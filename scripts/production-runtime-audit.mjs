import nextEnv from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { inspect } from "node:util";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
const { Pool } = pg;
loadEnvConfig(process.cwd());

const requiredEnv = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function connectionStringWithSupabaseSsl(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("uselibpqcompat", "true");

  return url.toString();
}

function allowEmptyCatalogueEnabled() {
  return process.env.ALLOW_EMPTY_CATALOGUE === "true";
}

function report(label, value, ok, emptyAllowed = false) {
  const status = emptyAllowed ? "OK EMPTY" : ok ? "OK" : "MISSING";
  console.log(`${status} ${label}: ${value}`);
}

function createOnceCleanup(label, cleanup) {
  let cleaned = false;

  return async () => {
    if (cleaned) return null;
    cleaned = true;

    try {
      await cleanup();
      return null;
    } catch (error) {
      return new Error(
        `Failed to close ${label}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  };
}

function createAuditFailure(message) {
  return new Error(`Production runtime audit failed. ${message}`);
}

function formatError(error) {
  return inspect(error, { depth: 5, colors: false });
}

async function runCleanup(cleanups) {
  const errors = [];

  for (const cleanup of [...cleanups].reverse()) {
    const error = await cleanup();
    if (error) errors.push(error);
  }

  if (errors.length === 0) return null;
  if (errors.length === 1) return errors[0];
  return new AggregateError(errors, "Failed to close production runtime audit resources.");
}

async function main() {
  let auditError = null;
  const cleanups = [];
  let poolError = null;

  try {
    const missing = requiredEnv.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    const allowEmptyCatalogue = allowEmptyCatalogueEnabled();
    const pool = new Pool({
      connectionString: connectionStringWithSupabaseSsl(requireEnv("POSTGRES_PRISMA_URL")),
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    const onPoolError = (error) => {
      poolError = error;
    };
    pool.on("error", onPoolError);
    cleanups.push(
      createOnceCleanup("PostgreSQL pool", async () => {
        pool.removeListener("error", onPoolError);
        await pool.end();
      }),
    );

    const prisma = new PrismaClient({
      adapter: new PrismaPg(pool),
    });
    cleanups.push(
      createOnceCleanup("Prisma client", async () => {
        await prisma.$disconnect();
      }),
    );

    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    cleanups.push(
      createOnceCleanup("Supabase auth auto refresh", async () => {
        await supabase.auth.stopAutoRefresh?.();
      }),
      createOnceCleanup("Supabase realtime channels", async () => {
        await supabase.removeAllChannels?.();
        supabase.realtime?.disconnect?.();
      }),
    );

    await prisma.$queryRaw`SELECT 1`;

    const [
      categories,
      products,
      activeProducts,
      adminUsers,
      roles,
      permissions,
      rolePermissions,
      superAdminAssignments,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.userRole.count(),
      prisma.permission.count(),
      prisma.rolePermission.count(),
      prisma.userRoleAssignment.count({ where: { role: { slug: "super-admin" } } }),
    ]);

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (authError) {
      throw authError;
    }
    if (poolError) {
      throw poolError;
    }

    const categoriesOk = allowEmptyCatalogue || categories > 0;
    const productsOk = allowEmptyCatalogue || products > 0;
    const activeProductsOk = allowEmptyCatalogue || activeProducts > 0;

    report("Prisma connection", "SELECT 1 succeeded", true);
    report("Supabase Auth admin API", `${authUsers.users.length} user sample returned`, true);
    report("categories", categories, categoriesOk, allowEmptyCatalogue && categories === 0);
    report("products", products, productsOk, allowEmptyCatalogue && products === 0);
    report(
      "active catalogue products",
      activeProducts,
      activeProductsOk,
      allowEmptyCatalogue && activeProducts === 0,
    );
    report("admin users", adminUsers, adminUsers > 0);
    report("roles", roles, roles > 0);
    report("permissions", permissions, permissions > 0);
    report("role permission links", rolePermissions, rolePermissions > 0);
    report("super-admin assignments", superAdminAssignments, superAdminAssignments > 0);

    const failed =
      !categoriesOk ||
      !productsOk ||
      !activeProductsOk ||
      adminUsers === 0 ||
      roles === 0 ||
      permissions === 0 ||
      rolePermissions === 0 ||
      superAdminAssignments === 0;

    if (failed) {
      throw createAuditFailure(
        allowEmptyCatalogue
          ? "Required auth or RBAC data is missing."
          : "Run the production setup and admin reset commands.",
      );
    }
  } catch (error) {
    auditError = error;
  } finally {
    const cleanupError = await runCleanup(cleanups);
    if (cleanupError) {
      if (auditError) {
        console.error(formatError(cleanupError));
      } else {
        auditError = cleanupError;
      }
    }
  }

  if (auditError) {
    throw auditError;
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});

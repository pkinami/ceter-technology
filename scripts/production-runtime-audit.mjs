import nextEnv from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
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

function report(label, value, ok) {
  const status = ok ? "OK" : "MISSING";
  console.log(`${status} ${label}: ${value}`);
}

async function main() {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connectionStringWithSupabaseSsl(requireEnv("POSTGRES_PRISMA_URL")),
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    }),
  });
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

  try {
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
      prisma.product.count({ where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } } }),
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

    report("Prisma connection", "SELECT 1 succeeded", true);
    report("Supabase Auth admin API", `${authUsers.users.length} user sample returned`, true);
    report("categories", categories, categories > 0);
    report("products", products, products > 0);
    report("active catalogue products", activeProducts, activeProducts > 0);
    report("admin users", adminUsers, adminUsers > 0);
    report("roles", roles, roles > 0);
    report("permissions", permissions, permissions > 0);
    report("role permission links", rolePermissions, rolePermissions > 0);
    report("super-admin assignments", superAdminAssignments, superAdminAssignments > 0);

    const failed =
      categories === 0 ||
      products === 0 ||
      activeProducts === 0 ||
      adminUsers === 0 ||
      roles === 0 ||
      permissions === 0 ||
      rolePermissions === 0 ||
      superAdminAssignments === 0;

    if (failed) {
      throw new Error("Production runtime audit failed. Run the production setup and admin reset commands.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

import nextEnv from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

function connectionStringWithSslMode(connectionString) {
  const url = new URL(connectionString);
  url.searchParams.set(
    "sslmode",
    process.env.NODE_ENV === "production" ? "verify-full" : "no-verify",
  );

  return url.toString();
}

function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function promptHidden(rl, prompt) {
  if (!input.isTTY || !output.isTTY) {
    return question(rl, prompt);
  }

  const originalWriteToOutput = rl._writeToOutput;

  output.write(prompt);
  rl._writeToOutput = () => {};

  try {
    return await question(rl, "");
  } finally {
    rl._writeToOutput = originalWriteToOutput;
    output.write("\n");
  }
}

async function getAdminInput() {
  const rl = readline.createInterface({ input, output });
  const envEmail = process.env.ADMIN_EMAIL?.trim();
  const envName = process.env.ADMIN_NAME?.trim();
  const envPassword = process.env.ADMIN_PASSWORD;

  let email = envEmail;
  let name = envName;
  let password = envPassword;

  try {
    email = email || (await question(rl, "Admin email: ")).trim();
    name = name || (await question(rl, "Admin name (optional): ")).trim();
    password = password || (await promptHidden(rl, "Admin password: "));
  } finally {
    rl.close();
  }

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid admin email address.");
  }

  name = name || email.split("@")[0];

  if (!password || password.length < 8) {
    throw new Error("Admin password must be at least 8 characters.");
  }

  return { email: email.toLowerCase(), name, password };
}

async function findAuthUserByEmail(supabase, email) {
  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase(),
    );

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  throw new Error("Could not find the user after scanning the Supabase Auth user list.");
}

async function main() {
  const databaseUrl = requiredEnv("DATABASE_URL");
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const { email, name, password } = await getAdminInput();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connectionStringWithSslMode(databaseUrl),
    }),
  });

  try {
    let authUser = await findAuthUserByEmail(supabase, email);
    let createdAuthUser = false;

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (error || !data.user) {
        throw error ?? new Error("Supabase did not return a created user.");
      }

      authUser = data.user;
      createdAuthUser = true;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: "ADMIN",
      },
      create: {
        id: authUser.id,
        email,
        name,
        role: "ADMIN",
      },
    });

    if (user.id !== authUser.id) {
      throw new Error(
        "A local user with this email already exists but has a different id than Supabase Auth.",
      );
    }

    const superAdminRole = await prisma.userRole.upsert({
      where: { slug: "super-admin" },
      update: {
        name: "Super Admin",
        description: "Full system access.",
        isSystem: true,
      },
      create: {
        name: "Super Admin",
        slug: "super-admin",
        description: "Full system access.",
        isSystem: true,
      },
    });

    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    });

    console.log(
      createdAuthUser
        ? `Created admin account for ${email}.`
        : `Granted ADMIN role to the existing auth user ${email}. Password was not changed.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

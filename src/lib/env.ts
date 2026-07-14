import { logServerError } from "./server-logging";

export function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  return undefined;
}

export function requireFirstEnv(...names: string[]) {
  const value = firstEnv(...names);

  if (!value) {
    const error = new Error(`Missing environment variable. Set one of: ${names.join(", ")}`);
    logServerError("environment.missing", error, { names });
    throw error;
  }

  return value;
}

export const databaseEnv = {
  pooledUrlNames: ["POSTGRES_PRISMA_URL"],
  directUrlNames: ["POSTGRES_URL_NON_POOLING"],
} as const;

export const supabaseEnv = {
  serverUrlNames: ["SUPABASE_URL"],
  publicUrlNames: [
    "NEXT_PUBLIC_SUPABASE_URL",
  ],
  publicKeyNames: [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ],
  serverClientKeyNames: [
    "SUPABASE_PUBLISHABLE_KEY",
  ],
  serviceRoleKeyNames: [
    "SUPABASE_SERVICE_ROLE_KEY",
  ],
} as const;

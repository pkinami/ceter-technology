import type { PoolConfig } from "pg";
import { databaseEnv, requireFirstEnv } from "./env.ts";

function getConnectionStringWithSupabaseSsl(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("uselibpqcompat", "true");

  return url.toString();
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPrismaPgConfig(): PoolConfig {
  const connectionString = requireFirstEnv(...databaseEnv.pooledUrlNames);

  const poolConfig = {
    max: positiveInteger(process.env.PRISMA_PG_POOL_MAX, process.env.NODE_ENV === "production" ? 5 : 3),
    idleTimeoutMillis: positiveInteger(process.env.PRISMA_PG_IDLE_TIMEOUT_MS, 30_000),
    connectionTimeoutMillis: positiveInteger(process.env.PRISMA_PG_CONNECTION_TIMEOUT_MS, 15_000),
  };

  return {
    connectionString: getConnectionStringWithSupabaseSsl(connectionString),
    ...poolConfig,
  };
}

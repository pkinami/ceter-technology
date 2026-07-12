import { loadEnvConfig } from "@next/env";
import { defineConfig, env } from "prisma/config";

loadEnvConfig(process.cwd());

function getConnectionStringWithSslMode(connectionString: string, sslMode: string) {
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", sslMode);

  return url.toString();
}

function getDatasourceUrl() {
  const connectionString = env("DATABASE_URL");

  if (process.env.NODE_ENV === "production") {
    return getConnectionStringWithSslMode(connectionString, "verify-full");
  }

  return getConnectionStringWithSslMode(connectionString, "no-verify");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDatasourceUrl(),
  },
});

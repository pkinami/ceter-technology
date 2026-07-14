import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";
import { databaseEnv, requireFirstEnv } from "./src/lib/env";

loadEnvConfig(process.cwd());

function getConnectionStringWithSupabaseSsl(connectionString: string) {
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("uselibpqcompat", "true");

  return url.toString();
}

function getDirectDatasourceUrl() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING;
  const command = process.argv.find((item) => item === "generate" || item === "validate");

  if (!connectionString && command) {
    return "postgresql://prisma:prisma@localhost:5432/prisma";
  }

  if (!connectionString) {
    return getConnectionStringWithSupabaseSsl(requireFirstEnv(...databaseEnv.directUrlNames));
  }

  return getConnectionStringWithSupabaseSsl(connectionString);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDirectDatasourceUrl(),
  },
});

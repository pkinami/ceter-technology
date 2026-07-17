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
  return getConnectionStringWithSupabaseSsl(requireFirstEnv(...databaseEnv.directUrlNames));
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDirectDatasourceUrl(),
  },
});

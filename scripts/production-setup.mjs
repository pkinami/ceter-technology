import { spawn } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function main() {
  if (process.env.CONFIRM_PRODUCTION_SETUP !== "seed") {
    throw new Error(
      "Refusing to modify data without confirmation. Set CONFIRM_PRODUCTION_SETUP=seed to upsert baseline categories, products, roles, and permissions.",
    );
  }

  await run("node", ["prisma/seed.mjs"]);
  await run("node", ["scripts/production-runtime-audit.mjs"]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

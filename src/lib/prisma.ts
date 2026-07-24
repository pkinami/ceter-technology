import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getPrismaPgConfig } from "./prisma-pg-config.ts";
import { logServerError } from "./server-logging.ts";

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

let prismaClient: ReturnType<typeof createPrismaClient> | undefined;

const transientConnectionMessages = [
  "Connection terminated unexpectedly",
  "Connection terminated",
  "ECONNRESET",
  "ETIMEDOUT",
  "terminating connection",
  "Connection closed",
];

function isTransientConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return transientConnectionMessages.some((item) => message.includes(item));
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function discardPrismaClient() {
  const client = prismaClient;
  prismaClient = undefined;
  globalForPrisma.prisma = undefined;

  void client?.$disconnect().catch((error) => {
    logServerError("prisma.disconnect.failed", error);
  });
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg(getPrismaPgConfig()),
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const maxAttempts = 3;

          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
              return await query(args);
            } catch (error) {
              const retryable = isTransientConnectionError(error);

              if (!retryable || attempt === maxAttempts) {
                if (retryable) {
                  discardPrismaClient();
                }

                logServerError("prisma.query.failed", error, { model, operation, attempt, maxAttempts });
                throw error;
              }

              await delay(150 * attempt);
            }
          }

          throw new Error("Prisma query retry loop exited unexpectedly.");
        },
      },
    },
  });
}

function getPrismaClient() {
  prismaClient = prismaClient ?? globalForPrisma.prisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getPrismaPgConfig } from "./prisma-pg-config";
import { logServerError } from "./server-logging";

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

let prismaClient: ReturnType<typeof createPrismaClient> | undefined;

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg(getPrismaPgConfig()),
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          try {
            return await query(args);
          } catch (error) {
            logServerError("prisma.query.failed", error, { model, operation });
            throw error;
          }
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

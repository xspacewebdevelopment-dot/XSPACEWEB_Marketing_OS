import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function getPrismaClient(): PrismaClient {
  let dbUrl = process.env.DATABASE_URL || "";
  if (
    (dbUrl.startsWith('"') && dbUrl.endsWith('"')) ||
    (dbUrl.startsWith("'") && dbUrl.endsWith("'"))
  ) {
    dbUrl = dbUrl.slice(1, -1);
  }

  // Strip channel_binding parameter to avoid TLS handshake delays on Node.js/Windows
  // Also standardize sslmode to verify-full to prevent pg-connection-string v3 security warning
  const cleanUrl = dbUrl
    .replace(/&?channel_binding=[^&]+/g, "")
    .replace(/([?&])sslmode=(?:require|prefer|verify-ca)(?=&|$)/g, "$1sslmode=verify-full");

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: cleanUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getValidPrismaClient(): PrismaClient {
  if (
    !globalForPrisma.prisma ||
    (process.env.NODE_ENV !== "production" && !(globalForPrisma.prisma as any).campaign)
  ) {
    globalForPrisma.prisma = getPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getValidPrismaClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = getValidPrismaClient();
}

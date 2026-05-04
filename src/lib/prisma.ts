import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createPrismaClient() {
  // Strip Prisma-specific params (schema, pgbouncer, sslmode) — pg doesn't understand them
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.delete("schema");
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("sslmode");

  console.log("[prisma] host:", url.hostname, "db:", url.pathname, "ssl:", process.env.NODE_ENV === "production");

  const pool = new Pool({
    connectionString: url.toString(),
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

  const adapter = new PrismaPg(pool, { schema: "family_planner" });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

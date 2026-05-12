import { PrismaClient } from "@prisma/client";
import { getSettings } from "./settings";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const settings = getSettings();
const dbUrl = settings.dbProvider === "NEON" ? settings.neonUrl : settings.supabaseUrl;

if (process.env.NODE_ENV === "production") {
  const maskedUrl = dbUrl ? `${dbUrl.split('@')[0].split(':')[0]}://***@${dbUrl.split('@')[1] || 'unknown'}` : "EMPTY";
  console.log(`Prisma initializing with provider: ${settings.dbProvider}, URL: ${maskedUrl}`);
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

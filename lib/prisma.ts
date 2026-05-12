import { PrismaClient } from "@prisma/client";
import { getSettings } from "./settings";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const settings = getSettings();
const dbUrl = settings.dbProvider === "NEON" ? settings.neonUrl : settings.supabaseUrl;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

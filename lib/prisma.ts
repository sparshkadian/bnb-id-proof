import { PrismaClient } from "@prisma/client";
import { getSettings } from "./settings";

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  provider: string;
};

/**
 * Internal function to get or create the Prisma client based on current settings.
 * Caches the client to avoid redundant file reads on every property access.
 */
function getInternalPrisma() {
  // In serverless, we want to check settings once per invocation or when explicitly changed.
  const settings = getSettings();
  const provider = settings.dbProvider;
  const dbUrl = provider === "NEON" ? settings.neonUrl : settings.supabaseUrl;

  // diagnostic check
  if (!dbUrl) {
    console.error(`[Prisma ERROR] No database URL found for provider: ${provider}. Check your environment variables.`);
  }

  const shouldReinitialize = 
    globalForPrisma.prisma && 
    globalForPrisma.provider !== provider;

  if (!globalForPrisma.prisma || shouldReinitialize) {
    if (shouldReinitialize) {
      console.log(`[Prisma] Switching database connection: ${globalForPrisma.provider} -> ${provider}`);
    }

    try {
      globalForPrisma.prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
        log: ["error", "warn"],
      });
      globalForPrisma.provider = provider;

      const maskedUrl = dbUrl ? `${dbUrl.split('@')[0].split(':')[0]}://***@${dbUrl.split('@')[1] || 'unknown'}` : "EMPTY";
      console.log(`[Prisma] Initialized for ${provider} with URL: ${maskedUrl}`);
    } catch (err) {
      console.error("[Prisma] Failed to initialize PrismaClient:", err);
      throw err;
    }
  }

  return globalForPrisma.prisma;
}

// Export a Proxy that intercepts all property access.
// We use a Proxy to keep the 'import { prisma }' syntax while allowing dynamic switching.
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // Note: In production/serverless, this function will likely run once per lambda invocation
    // because global variables are reset frequently.
    const client = getInternalPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});



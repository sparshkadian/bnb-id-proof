import { PrismaClient } from "@prisma/client";
import { getSettings } from "./settings";

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  provider: string;
};

/**
 * Internal function to get or create the Prisma client based on current settings.
 */
function getInternalPrisma() {
  const settings = getSettings();
  const dbUrl = settings.dbProvider === "NEON" ? settings.neonUrl : settings.supabaseUrl;

  const shouldReinitialize = 
    globalForPrisma.prisma && 
    globalForPrisma.provider !== settings.dbProvider;

  if (!globalForPrisma.prisma || shouldReinitialize) {
    if (shouldReinitialize) {
      console.log(`[Prisma] detected provider change: ${globalForPrisma.provider} -> ${settings.dbProvider}. Switching database connection...`);
      // We don't $disconnect the old one here to avoid blocking, 
      // the old connections will eventually time out.
    }

    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: ["error", "warn"], // Reduced logging for cleaner console
    });
    globalForPrisma.provider = settings.dbProvider;

    const maskedUrl = dbUrl ? `${dbUrl.split('@')[0].split(':')[0]}://***@${dbUrl.split('@')[1] || 'unknown'}` : "EMPTY";
    console.log(`[Prisma] Active provider: ${settings.dbProvider}, URL: ${maskedUrl}`);
  }

  return globalForPrisma.prisma;
}

// Export a Proxy that intercepts all property access and redirects to the current Prisma instance.
// This allows the app to switch databases immediately when settings.json is updated.
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getInternalPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});



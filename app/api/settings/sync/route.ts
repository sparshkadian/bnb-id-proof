import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const { sourceProvider, targetProvider } = await req.json();
  const settings = getSettings();

  const sourceUrl = sourceProvider === "NEON" ? settings.neonUrl : settings.supabaseUrl;
  const targetUrl = targetProvider === "NEON" ? settings.neonUrl : settings.supabaseUrl;

  if (!sourceUrl || !targetUrl) {
    return NextResponse.json({ error: "Source or Target URL missing" }, { status: 400 });
  }

  const sourcePrisma = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const targetPrisma = new PrismaClient({ datasources: { db: { url: targetUrl } } });

  try {
    console.log(`Starting sync from ${sourceProvider} to ${targetProvider}...`);
    
    // Test connections
    try {
      await sourcePrisma.$connect();
      console.log("Source database connected.");
    } catch (e: any) {
      throw new Error(`Failed to connect to source database: ${e.message}`);
    }

    try {
      await targetPrisma.$connect();
      console.log("Target database connected.");
    } catch (e: any) {
      throw new Error(`Failed to connect to target database: ${e.message}`);
    }

    // 1. Fetch all data from source
    const guests = await sourcePrisma.guest.findMany({ 
      include: { 
        documents: true, 
        notifications: true 
      } 
    });
    const reports = await sourcePrisma.monthlyReport.findMany();

    console.log(`Fetched ${guests.length} guests and ${reports.length} reports from source.`);

    // 2. Sync Guests and related data
    for (const guest of guests) {
      console.log(`Syncing guest: ${guest.name} (${guest.id})`);
      const { documents, notifications, ...guestData } = guest;
      
      // Upsert guest - remove id from update to avoid DB constraints issues
      const { id, ...guestDataWithoutId } = guestData as any;
      await targetPrisma.guest.upsert({
        where: { id: guest.id },
        update: guestDataWithoutId,
        create: guestData as any,
      });

      // Sync Documents
      for (const doc of documents) {
        const { id: docId, guestId, ...docData } = doc as any;
        await targetPrisma.guestDocument.upsert({
          where: { id: docId },
          update: docData,
          create: doc as any,
        });
      }

      // Sync Notifications
      for (const note of notifications) {
        const { id: noteId, guestId, ...noteData } = note as any;
        await targetPrisma.notification.upsert({
          where: { id: noteId },
          update: noteData,
          create: note as any,
        });
      }
    }

    // 3. Sync Monthly Reports
    for (const report of reports) {
      console.log(`Syncing report for ${report.month}/${report.year}`);
      const { id: reportId, ...reportData } = report as any;
      await targetPrisma.monthlyReport.upsert({
        where: { 
          month_year: { 
            month: report.month, 
            year: report.year 
          } 
        },
        update: reportData,
        create: report as any,
      });
    }

    console.log("Sync completed successfully.");
    return NextResponse.json({ success: true, message: `Synced ${guests.length} guests and ${reports.length} reports.` });
  } catch (error: any) {
    console.error("Sync error detailed:", error);
    return NextResponse.json({ error: "Sync failed: " + error.message }, { status: 500 });
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

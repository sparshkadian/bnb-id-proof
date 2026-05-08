import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/fileUpload";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // 1. Get all guests who checked in during this month/year
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const guests = await prisma.guest.findMany({
      where: {
        checkInDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const bookingsCount = guests.length;
    const appBookingsCount = guests.filter(g => g.bookingType === "APP").length;
    const offlineBookingsCount = guests.filter(g => g.bookingType === "OFFLINE").length;
    const grossRevenue = guests.reduce((sum, g) => sum + g.amountByGuest, 0);

    // 2. Get Monthly Report / Deductions
    const report = await prisma.monthlyReport.findUnique({
      where: {
        month_year: { month, year },
      },
    });

    const deductions = (report?.deductions as any[]) || [];
    const totalDeductions = deductions.reduce((sum, d) => {
      const amount = parseFloat(d.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const netRevenue = grossRevenue - totalDeductions;

    return NextResponse.json({
      month,
      year,
      stats: {
        bookingsCount,
        appBookingsCount,
        offlineBookingsCount,
        grossRevenue,
        totalDeductions,
        netRevenue,
      },
      report,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const month = parseInt(formData.get("month") as string);
    const year = parseInt(formData.get("year") as string);
    const deductionsStr = formData.get("deductions") as string;
    const reportFile = formData.get("report") as File;

    const updateData: any = { month, year };

    if (deductionsStr) {
      updateData.deductions = JSON.parse(deductionsStr);
    }

    if (reportFile && reportFile.size > 0) {
      const { filePath, publicId } = await uploadFile(reportFile, `Report_${month}_${year}`);
      updateData.reportFilePath = filePath;
      updateData.reportPublicId = publicId;
    }

    const report = await prisma.monthlyReport.upsert({
      where: {
        month_year: { month, year },
      },
      update: updateData,
      create: updateData,
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Dashboard POST Error:", error);
    return NextResponse.json({ error: "Failed to update dashboard data" }, { status: 500 });
  }
}

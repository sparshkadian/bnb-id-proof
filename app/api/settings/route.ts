import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json({ settings: getSettings() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = saveSettings(body);
    return NextResponse.json({ settings: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

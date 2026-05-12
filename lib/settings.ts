import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export interface AppSettings {
  companyName: string;
  companyLogo: string; // Base64 or URL
  favicon: string; // Base64 or URL
  dbProvider: 'NEON' | 'SUPABASE';
  neonUrl: string;
  supabaseUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "Orélia",
  companyLogo: "",
  favicon: "",
  dbProvider: "NEON",
  neonUrl: process.env.DATABASE_URL || "",
  supabaseUrl: process.env.SUPABASE_DATABASE_URL || "",
};

export function getSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Error reading settings:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<AppSettings>) {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export interface AppSettings {
  companyName: string;
  companyLogo: string; // Base64 or URL
  dbProvider: 'NEON' | 'SUPABASE';
  neonUrl: string;
  supabaseUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "Orélia",
  companyLogo: "",
  dbProvider: "SUPABASE",
  neonUrl: process.env.NEON_DATABASE_URL || "",
  supabaseUrl: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "",
};

export function getSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const storedSettings = JSON.parse(data);
      
      // Merge with defaults but ensure empty URLs in settings.json don't override env vars
      const merged = { ...DEFAULT_SETTINGS, ...storedSettings };
      
      if (!merged.neonUrl && (process.env.NEON_DATABASE_URL || process.env.DATABASE_URL)) {
        merged.neonUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "";
      }
      if (!merged.supabaseUrl && (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)) {
        merged.supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "";
      }
      
      return merged;
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

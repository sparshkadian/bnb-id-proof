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
  // Use DB_PROVIDER env var as high-priority override for production
  const envProvider = process.env.DB_PROVIDER || process.env.NEXT_PUBLIC_DB_PROVIDER;
  
  try {
    let storedSettings: any = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      storedSettings = JSON.parse(data);
    }
    
    // Merge order: Defaults < File Settings < Env Overrides
    const merged = { ...DEFAULT_SETTINGS, ...storedSettings };
    
    if (envProvider === 'NEON' || envProvider === 'SUPABASE') {
      merged.dbProvider = envProvider as 'NEON' | 'SUPABASE';
    }

    // Ensure URLs are always fresh from ENV if possible
    merged.neonUrl = process.env.NEON_DATABASE_URL || merged.neonUrl || "";
    merged.supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || merged.supabaseUrl || "";
    
    return merged;
  } catch (error) {
    console.error("Error reading settings:", error);
    return {
      ...DEFAULT_SETTINGS,
      dbProvider: (envProvider as any) || DEFAULT_SETTINGS.dbProvider
    };
  }
}

export function saveSettings(settings: Partial<AppSettings>) {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    
    // In production (Vercel), we can't save to the filesystem
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.warn("Settings cannot be saved to filesystem in production. Changes will be lost on next request.");
      return updated;
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (error) {
    console.error("Error saving settings:", error);
    if (process.env.NODE_ENV === 'production') return getSettings();
    throw error;
  }
}

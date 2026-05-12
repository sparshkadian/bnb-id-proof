"use client";

import { useState, useEffect } from "react";
import { Settings, Database, Building2, Upload, RefreshCw, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    const source = settings.dbProvider;
    const target = source === "NEON" ? "SUPABASE" : "NEON";
    
    if (!confirm(`This will sync all data from ${source} to ${target}. Continue?`)) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/settings/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceProvider: source, targetProvider: target }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Sync completed successfully");
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch (err) {
      toast.error("An error occurred during sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'companyLogo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, [type]: reader.result });
    };
    reader.readAsDataURL(file);
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-gray-500 font-medium animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#1E3A8A]" />
            Application Settings
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">Configure your workspace and branding</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Building2 className="w-5 h-5 text-[#1E3A8A]" />
            <h2 className="text-lg font-bold text-gray-900">Branding</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                placeholder="Enter company name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Company Logo</label>
                <div className="relative group cursor-pointer">
                  <div className="w-full h-32 bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-[#1E3A8A] transition-colors">
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="max-h-full object-contain" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                    <input type="file" onChange={(e) => handleFileChange(e, 'companyLogo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Favicon</label>
                <div className="relative group cursor-pointer">
                  <div className="w-full h-32 bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-[#1E3A8A] transition-colors">
                    {settings.favicon ? (
                      <img src={settings.favicon} alt="Favicon" className="w-12 h-12 object-contain" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                    <input type="file" onChange={(e) => handleFileChange(e, 'favicon')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Database className="w-5 h-5 text-[#1E3A8A]" />
            <h2 className="text-lg font-bold text-gray-900">Database Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Active Provider</label>
              <div className="flex bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
                <button onClick={() => setSettings({ ...settings, dbProvider: 'NEON' })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${settings.dbProvider === 'NEON' ? 'bg-white text-[#1E3A8A] shadow-sm shadow-blue-900/10' : 'text-gray-400 hover:text-gray-600'}`}>Neon</button>
                <button onClick={() => setSettings({ ...settings, dbProvider: 'SUPABASE' })} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${settings.dbProvider === 'SUPABASE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Supabase</button>
              </div>
            </div>
            <div className="pt-4 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#1E3A8A] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <p className="font-bold mb-1">Database Redundancy</p>
                  You can switch between providers if one is experiencing downtime. Use the sync feature to keep your data up to date across both platforms.
                </div>
              </div>
              <button onClick={handleSync} disabled={syncing} className="w-full py-3 bg-white border border-[#E2E8F0] text-[#1E3A8A] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition-all active:scale-[0.98] disabled:opacity-50">
                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync Data to {settings.dbProvider === 'NEON' ? 'Supabase' : 'Neon'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

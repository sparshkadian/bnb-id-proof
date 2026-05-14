"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, Users, DollarSign, Wallet, Plus, Trash2, Upload, FileText, Download, Calendar } from "lucide-react";
import toast from "react-hot-toast";

import ModernSelect from "@/components/ModernSelect";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    bookingsCount: 0,
    appBookingsCount: 0,
    offlineBookingsCount: 0,
    grossRevenue: 0,
    totalDeductions: 0,
    netRevenue: 0
  });
  const [report, setReport] = useState<any>(null);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthOptions = months.map((m, i) => ({ value: (i + 1).toString(), label: m }));
  const yearOptions = [2024, 2025, 2026].map(y => ({ value: y.toString(), label: y.toString() }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`Fetching dashboard data for ${month}/${year}`);
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setReport(data.report);
        const rawDeductions = data.report?.deductions || [];
        const sortedDeductions = [...rawDeductions].sort((a: any, b: any) => {
          return new Date(a.datePaid || 0).getTime() - new Date(b.datePaid || 0).getTime();
        });
        setDeductions(sortedDeductions);
      }
    } catch (err) {
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddDeduction = () => {
    setDeductions([...deductions, { item: "", amount: 0, datePaid: new Date().toISOString().split('T')[0] }]);
  };

  const handleRemoveDeduction = (index: number) => {
    const newDeductions = [...deductions];
    newDeductions.splice(index, 1);
    setDeductions(newDeductions);
  };

  const handleDeductionChange = (index: number, field: string, value: any) => {
    const newDeductions = [...deductions];
    newDeductions[index][field] = value;
    setDeductions(newDeductions);
  };

  const handleSave = async (reportFile?: File) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("month", month.toString());
      formData.append("year", year.toString());
      formData.append("deductions", JSON.stringify(deductions));
      if (reportFile) {
        formData.append("report", reportFile);
      }

      const res = await fetch("/api/dashboard", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Dashboard updated successfully");
        fetchData();
      } else {
        toast.error("Failed to update dashboard");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const kpis = [
    { 
      label: "Total Bookings", 
      value: stats.bookingsCount, 
      subValue: `${stats.appBookingsCount} App / ${stats.offlineBookingsCount} Offline`,
      icon: Users, 
      color: "bg-blue-500" 
    },
    { label: "Gross Revenue", value: `₹${stats.grossRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-500" },
    { label: "Total Deductions", value: `₹${stats.totalDeductions.toLocaleString()}`, icon: Wallet, color: "bg-rose-500" },
    { label: "Net Revenue", value: `₹${stats.netRevenue.toLocaleString()}`, icon: TrendingUp, color: "bg-[#1E3A8A]" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monthly performance and financial summary</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-[#E2E8F0]">
          <ModernSelect 
            className="w-40"
            options={monthOptions}
            value={month.toString()}
            onChange={(val) => setMonth(parseInt(val))}
          />
          <ModernSelect 
            className="w-28"
            options={yearOptions}
            value={year.toString()}
            onChange={(val) => setYear(parseInt(val))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-2xl ${kpi.color} text-white shadow-lg shadow-blue-900/5 group-hover:scale-110 transition-transform`}>
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
            {kpi.subValue && (
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{kpi.subValue}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Monthly Deductions</h2>
              </div>
              <button 
                onClick={handleAddDeduction}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E3A8A] hover:bg-blue-50 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
            <div className="p-5">
              {deductions.length > 0 ? (
                <div className="space-y-4">
                  {deductions.map((d, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Item Description</label>
                        <input 
                          type="text" 
                          value={d.item}
                          onChange={(e) => handleDeductionChange(i, 'item', e.target.value)}
                          placeholder="e.g. Electricity Bill"
                          className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Amount</label>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                          <input 
                            type="number" 
                            value={d.amount}
                            onChange={(e) => handleDeductionChange(i, 'amount', e.target.value)}
                            className="w-full pl-7 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Date Paid</label>
                        <input 
                          type="date" 
                          value={d.datePaid}
                          onChange={(e) => handleDeductionChange(i, 'datePaid', e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <button 
                          onClick={() => handleRemoveDeduction(i)}
                          className="p-2.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
                    <button 
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="px-8 py-3 bg-[#1E3A8A] text-white rounded-2xl text-sm font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                      {saving ? "Saving Changes..." : "Save Deductions"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-[#E2E8F0]">
                  <Wallet className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold mb-4">No deductions recorded for this month.</p>
                  <button 
                    onClick={handleAddDeduction}
                    className="px-6 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E3A8A] hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    Add Your First Deduction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Airbnb Report</h2>
            </div>
            
            {report?.reportFilePath ? (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Report Uploaded</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        {report.reportFilePath.split('.').pop()?.toUpperCase()} Document
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`/api/download?url=${encodeURIComponent(report.reportFilePath)}&publicId=${encodeURIComponent(report.reportPublicId || "")}&filename=Airbnb_Report_${month}_${year}.pdf`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white text-emerald-600 hover:text-emerald-700 rounded-xl shadow-sm transition-all"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Replace Report</p>
                  <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#E2E8F0] rounded-2xl cursor-pointer hover:border-[#1E3A8A] hover:bg-blue-50/30 transition-all group">
                    <Upload className="w-8 h-8 text-gray-300 group-hover:text-[#1E3A8A] mb-2 transition-colors" />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-[#1E3A8A]">Choose new file</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handleSave(e.target.files[0])} 
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-center">
                  <p className="text-sm text-gray-500 font-medium mb-4 italic">No Airbnb report has been uploaded for this month yet.</p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-2xl text-sm font-black hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload Report
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handleSave(e.target.files[0])} 
                    />
                  </label>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Tip
                  </p>
                  <p className="text-xs text-blue-600 leading-relaxed font-medium">
                    Upload the monthly CSV or PDF provided by Airbnb to keep your records centralized.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

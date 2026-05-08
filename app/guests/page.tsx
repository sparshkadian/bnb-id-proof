"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, Trash2, FileText, User, Download, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Shield, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import ModernSelect from "@/components/ModernSelect";
import DualMonthCalendar from "@/components/DualMonthCalendar";
import { format, isWithinInterval, startOfDay } from "date-fns";

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID"];

export default function GuestListPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("ALL");
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Add Guest Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [guestsCount, setGuestsCount] = useState(1);

  const [formData, setFormData] = useState({ name: "", checkInDate: "", checkOutDate: "", notes: "", amountPaid: "0", bookingType: "APP" });
  const [submitting, setSubmitting] = useState(false);
  
  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/guests?t=${Date.now()}`);
      const data = await res.json();
      const mappedGuests = (data.guests || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        checkIn: new Date(g.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        checkOut: new Date(g.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        start: new Date(g.checkInDate).getDate(),
        end: new Date(g.checkOutDate).getDate(),
        month: new Date(g.checkInDate).getMonth(),
        year: new Date(g.checkInDate).getFullYear(),
        guests: g.numberOfGuests,
        idType: g.idProofType,
        docs: g.documents?.length || 0,
        status: g.status,
        amountPaid: g.amountByGuest,
        bookingType: g.bookingType
      }));
      setGuests(mappedGuests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleDelete = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Delete Guest Record?
        </div>
        <p className="text-xs text-gray-500 font-medium">This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const deletePromise = fetch(`/api/guests/${id}`, { method: "DELETE" });
              toast.promise(deletePromise, {
                loading: 'Deleting guest...',
                success: () => {
                  fetchGuests();
                  return 'Guest deleted successfully';
                },
                error: 'Failed to delete guest',
              });
            }}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  // Filter Logic
  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    
    let matchesDate = true;
    if (startDate && endDate) {
      const guestStart = startOfDay(new Date(g.checkIn));
      const guestEnd = startOfDay(new Date(g.checkOut));
      const filterStart = startOfDay(startDate);
      const filterEnd = startOfDay(endDate);
      matchesDate = (guestStart <= filterEnd && guestEnd >= filterStart);
    }
    
    const matchesBookingType = bookingTypeFilter === "ALL" || g.bookingType === bookingTypeFilter;
    return matchesSearch && matchesDate && matchesBookingType;
  });

  // Form Logic
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("numberOfGuests", guestsCount.toString());
      data.append("checkInDate", formData.checkInDate);
      data.append("checkOutDate", formData.checkOutDate);
      data.append("notes", formData.notes);
      data.append("amountPaid", formData.amountPaid);
      data.append("bookingType", formData.bookingType);

      const res = await fetch("/api/guests", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", checkInDate: "", checkOutDate: "", notes: "", amountPaid: "0", bookingType: "APP" });
        setGuestsCount(1);
        toast.success("Guest registered successfully");
        fetchGuests();
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to add guest");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add guest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-8 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Guest List</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage all registrations</p>
        </div>
        
        {/* Unified Filter Row - Horizontal on all screens */}
        <div className="flex flex-row items-center gap-3 w-full lg:w-auto overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
          <div className="relative flex-shrink-0 w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] placeholder:text-gray-400"
            />
          </div>

          <ModernSelect 
            className="w-44"
            options={[
              { value: "ALL", label: "All Bookings" },
              { value: "APP", label: "App Only" },
              { value: "OFFLINE", label: "Offline Only" }
            ]}
            value={bookingTypeFilter}
            onChange={setBookingTypeFilter}
          />

          <div className="relative">
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                ${startDate && endDate ? 'border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/30' : 'border-[#E2E8F0] text-gray-700 hover:bg-gray-50'}`}
            >
              <CalendarIcon className="w-4 h-4" />
              {startDate && endDate 
                ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                : "Filter by Date"}
            </button>
            
            {showCalendar && (
              <div className="absolute right-0 top-full mt-2 z-50 shadow-2xl">
                <DualMonthCalendar 
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Guest Button - Positioned above table */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Guest
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Guest Name</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Stay Duration</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Guests</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">ID Type</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Documents</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">Loading guests...</td></tr>
              ) : filteredGuests.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">No guests found matching filters.</td></tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className={`hover:bg-[#F8FAFC] transition-colors ${guest.bookingType === 'OFFLINE' ? 'bg-gray-50/80' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs">
                          {guest.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{guest.name}</span>
                        {guest.bookingType === 'OFFLINE' && (
                          <span className="text-[10px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Offline</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {guest.checkIn} <span className="text-gray-400 mx-1">→</span> {guest.checkOut}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" /> {guest.guests}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{guest.idType}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap -ml-0.5 ${
                        guest.status === "BOOKING_CONFIRMED" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        guest.status === "ID_PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        guest.status === "ID_CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        guest.status === "CHECKED_IN" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        guest.status === "CHECKED_OUT" ? "bg-gray-100 text-gray-700 border-gray-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      }`}>
                        {guest.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
                          <FileText className="w-3 h-3" /> {guest.docs} Files
                        </div>
                        {/* <button className="text-gray-400 hover:text-[#1E3A8A]"><Download className="w-4 h-4" /></button> */}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/guests/${guest.id}`} className="p-2 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(guest.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] w-full max-w-[800px] max-h-[90vh] overflow-y-auto relative animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 pr-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Guest</h2>
                  <p className="text-sm text-gray-500 mt-1">Register a new guest and confirm their booking</p>
                </div>

                {/* <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold">Secure Registration</span>
                </div> */}
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Guest Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]" placeholder="e.g. Julian Thorne" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Number of Guests</label>
                    <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden h-12">
                      <button type="button" onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))} className="px-4 text-gray-500 hover:bg-gray-100 h-full font-bold text-lg">-</button>
                      <input type="number" value={guestsCount} readOnly className="w-full text-center bg-transparent focus:outline-none font-bold text-gray-900" />
                      <button type="button" onClick={() => setGuestsCount(guestsCount + 1)} className="px-4 text-gray-500 hover:bg-gray-100 h-full font-bold text-lg">+</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Booking Type</label>
                    <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden p-1 h-12">
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, bookingType: 'APP'})}
                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${formData.bookingType === 'APP' ? 'bg-white text-[#1E3A8A] shadow-sm shadow-blue-900/10' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        App Booking
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, bookingType: 'OFFLINE'})}
                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${formData.bookingType === 'OFFLINE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Offline Booking
                      </button>
                    </div>
                  </div>



                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Check-in Date</label>
                    <input type="date" value={formData.checkInDate} onChange={e => setFormData({...formData, checkInDate: e.target.value})} required className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] h-12" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Check-out Date</label>
                    <input type="date" value={formData.checkOutDate} onChange={e => setFormData({...formData, checkOutDate: e.target.value})} required className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] h-12" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Amount Paid (₹)</label>
                    <input type="number" value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: e.target.value})} required className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] h-12" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Additional Notes</label>
                    <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] resize-none" placeholder="Any special requests or notes..."></textarea>
                  </div>

                </div>

                <div className="pt-6 border-t border-[#E2E8F0] flex justify-end gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-8 py-3 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-all shadow-sm disabled:opacity-50">
                    {submitting ? "Submitting..." : "Submit Registration"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

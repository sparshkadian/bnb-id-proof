"use client";

import { useState } from "react";
import { Upload, X, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import FileUploadModal from "@/app/components/FileUploadModal";



export default function AddGuestPage() {
  const router = useRouter();
  const [guestsCount, setGuestsCount] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",

    checkInDate: "",
    checkOutDate: "",
    notes: "",
    amountPaid: "0"
  });

  // Modal and file info state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filesWithInfo, setFilesWithInfo] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setPendingFiles(Array.from(e.target.files));
      setIsUploadModalOpen(true);
      e.target.value = "";
    }
  };

  const handleModalConfirm = (newFilesInfo: any[]) => {
    setFilesWithInfo((prev) => [...prev, ...newFilesInfo]);
    setIsUploadModalOpen(false);
    setPendingFiles([]);
  };

  const removeFile = (index: number) => {
    setFilesWithInfo((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (filesWithInfo.length > 0) {
        data.append("idProofType", filesWithInfo[0].idType);
      }
      
      for (const info of filesWithInfo) {
        data.append("documents", info.file);
        data.append("documentNames", info.customName);
        data.append("documentOwners", info.owner);
        if (info.owner === "ACCOMPANYING_GUEST") {
          data.append("accompanyingGuestNames", info.guestName);
        }
      }

      const res = await fetch("/api/guests", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        toast.success("Guest registered successfully");
        router.push("/guests");
        setTimeout(() => {
            router.refresh();
        }, 100);
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
    <div className="max-w-[800px] mx-auto p-8 relative min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Guest</h1>
          <p className="text-sm text-gray-500 mt-1">Register a new guest and upload their identification</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold">Secure Registration</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Guest Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all"
                placeholder="e.g. Julian Thorne"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Number of Guests</label>
              <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden h-12">
                <button
                  type="button"
                  onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                  className="px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-full font-bold text-lg"
                >
                  -
                </button>
                <input
                  type="number"
                  value={guestsCount}
                  readOnly
                  className="w-full text-center bg-transparent focus:outline-none font-bold text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setGuestsCount(guestsCount + 1)}
                  className="px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-full font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>


            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Check-in Date</label>
              <input
                type="date"
                required
                value={formData.checkInDate}
                onChange={e => setFormData({...formData, checkInDate: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Check-out Date</label>
              <input
                type="date"
                required
                value={formData.checkOutDate}
                onChange={e => setFormData({...formData, checkOutDate: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Amount Paid (₹)</label>
              <input
                type="number"
                required
                value={formData.amountPaid}
                onChange={e => setFormData({...formData, amountPaid: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all h-12"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Upload ID Proof</label>
              <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-[#E2E8F0] border-dashed rounded-xl hover:bg-[#F8FAFC] transition-colors relative bg-white">
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="flex text-sm text-gray-600 justify-center font-medium">
                    <label className="relative cursor-pointer text-[#1E3A8A] hover:text-blue-800">
                      <span>Click to upload</span>
                      <input type="file" className="sr-only" multiple onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>

              {filesWithInfo.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filesWithInfo.map((info, idx) => (
                    <div key={idx} className="relative bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 flex flex-col items-center">
                      <button type="button" onClick={() => removeFile(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 border border-white hover:bg-red-200">
                        <X className="w-3 h-3" />
                      </button>
                      <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-gray-200 mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{info.file.name.split('.').pop()}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 truncate w-full text-center" title={info.customName}>{info.customName}</span>
                      <span className="text-[8px] font-bold text-indigo-500 uppercase mt-1">{info.owner.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Additional Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all resize-none"
                placeholder="Any special requests or notes..."
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E2E8F0] flex justify-end gap-4">
            <Link href="/guests" className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-8 py-3 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-all shadow-sm disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </form>
      </div>

      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={handleModalConfirm}
        files={pendingFiles}
        mainGuestName={formData.name || "Main Guest"}
        checkInDate={formData.checkInDate}
        checkOutDate={formData.checkOutDate}
      />
    </div>
  );
}

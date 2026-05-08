"use client";

import { useState, useEffect } from "react";
import { User, Calendar as CalendarIcon, FileText, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, Upload, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import IdUploadUtility from "@/app/components/IdUploadUtility";
import FileUploadModal from "@/app/components/FileUploadModal";




function DocumentItem({ doc }: { doc: any }) {
  const fileName = doc.filePath.split('/').pop()?.split(/[#?]/)[0] || "document";
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() : "DOC";
  const displayExt = (extension && extension.length <= 4) ? extension : "DOC";
  const downloadUrl = `/api/download?url=${encodeURIComponent(doc.filePath)}&publicId=${encodeURIComponent(doc.publicId || "")}&filename=${encodeURIComponent(fileName)}`;

  return (
    <div className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] gap-4">
      <div className="flex items-center gap-3 overflow-hidden min-w-0">
        <div className="w-10 h-10 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
          {displayExt}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-gray-700 truncate" title={fileName}>
            {fileName}
          </span>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            {doc.fileType?.split('/')[1] || 'Document'}
          </span>
        </div>
      </div>
      <a 
        href={downloadUrl}
        className="p-2 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
      >
        <Download className="w-5 h-5" />
      </a>
    </div>
  );
}

export default function GuestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [guest, setGuest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const res = await fetch(`/api/guests/${id}`);
        if (res.ok) {
          const data = await res.json();
          setGuest(data.guest);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGuest();
  }, [id]);

  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tempData, setTempData] = useState({ checkInTime: "", checkOutTime: "", amountByGuest: "0" });
  
  // File upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    if (guest) {
      setTempData({
        checkInTime: guest.checkInTime ? new Date(guest.checkInTime).toTimeString().slice(0, 5) : "",
        checkOutTime: guest.checkOutTime ? new Date(guest.checkOutTime).toTimeString().slice(0, 5) : "",
        amountByGuest: guest.amountByGuest?.toString() || "0",
      });
    }
  }, [guest]);

  const hasChanges = guest && (
    tempData.checkInTime !== (guest.checkInTime ? new Date(guest.checkInTime).toTimeString().slice(0, 5) : "") ||
    tempData.checkOutTime !== (guest.checkOutTime ? new Date(guest.checkOutTime).toTimeString().slice(0, 5) : "") ||
    tempData.amountByGuest !== (guest.amountByGuest?.toString() || "0")
  );

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      if (status === "CHECKED_IN") formData.append("checkInTime", new Date().toISOString());
      if (status === "CHECKED_OUT") formData.append("checkOutTime", new Date().toISOString());

      const res = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setGuest(data.guest);
        if (status === "CHECKED_OUT") toast.success("Guest checked out successfully");
        if (status === "CHECKED_IN") toast.success("Guest checked in successfully");
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) return;
    setUpdating(true);
    try {
      const formData = new FormData();
      
      if (tempData.checkInTime !== (guest.checkInTime ? new Date(guest.checkInTime).toTimeString().slice(0, 5) : "")) {
        const checkInDate = new Date(guest.checkInDate);
        const [h, m] = tempData.checkInTime.split(":").map(Number);
        checkInDate.setHours(h, m, 0, 0);
        formData.append("checkInTime", checkInDate.toISOString());
      }
      
      if (tempData.checkOutTime !== (guest.checkOutTime ? new Date(guest.checkOutTime).toTimeString().slice(0, 5) : "")) {
        const checkOutDate = new Date(guest.checkOutDate);
        const [h, m] = tempData.checkOutTime.split(":").map(Number);
        checkOutDate.setHours(h, m, 0, 0);
        formData.append("checkOutTime", checkOutDate.toISOString());
      }

      if (tempData.amountByGuest !== (guest.amountByGuest?.toString() || "0")) {
        formData.append("amountByGuest", tempData.amountByGuest);
      }

      const res = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setGuest(data.guest);
        toast.success("Changes saved successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes");
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setPendingFiles(Array.from(e.target.files));
    setIsUploadModalOpen(true);
    // Reset input
    e.target.value = "";
  };

  const handleModalConfirm = async (filesInfo: any[]) => {
    setIsUploadModalOpen(false);
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      for (const info of filesInfo) {
        formData.append("documents", info.file);
        formData.append("documentNames", info.customName);
        formData.append("documentOwners", info.owner);
        if (info.owner === "ACCOMPANYING_GUEST") {
          formData.append("accompanyingGuestNames", info.guestName);
        }
      }

      if (filesInfo.length > 0) {
        formData.append("idProofType", filesInfo[0].idType);
      }

      const res = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setGuest(data.guest);
        toast.success("Documents uploaded successfully");
      } else {
        toast.error("Failed to upload documents");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during upload");
    } finally {
      setUploading(false);
      setPendingFiles([]);
    }
  };

  const statusSteps = [
    { key: "BOOKING_CONFIRMED", label: "Booking Created" },
    { key: "ID_CONFIRMED", label: "ID Verification" },
    { key: "CHECKED_IN", label: "Checked In" },
    { key: "CHECKED_OUT", label: "Checked Out" },
  ];

  const getEffectiveStatus = () => {
    if (!guest) return "CREATED";
    
    // If status is already manually set to Checked Out, keep it
    if (guest.status === "CHECKED_OUT") return "CHECKED_OUT";

    const now = new Date();
    const checkIn = new Date(guest.checkInDate);
    const checkOut = new Date(guest.checkOutDate);
    
    // Set auto-times: 1 PM for check-in, 11 AM for check-out
    const autoCheckInTime = new Date(checkIn);
    autoCheckInTime.setHours(13, 0, 0, 0);
    
    const autoCheckOutTime = new Date(checkOut);
    autoCheckOutTime.setHours(11, 0, 0, 0);

    // Auto Check-out logic: If current time is past check-out date 11 AM
    if (now >= autoCheckOutTime) return "CHECKED_OUT";
    
    // If status is already manually set to Checked In, keep it
    if (guest.status === "CHECKED_IN") return "CHECKED_IN";

    // Auto Check-in logic: If current time is past check-in date 1 PM
    if (now >= autoCheckInTime) return "CHECKED_IN";

    return guest.status;
  };

  const effectiveStatus = getEffectiveStatus();
  const getStepIndex = (status: string) => {
    if (status === "BOOKING_CONFIRMED" || status === "CREATED") return 0;
    if (status === "ID_PENDING") return 1;
    if (status === "ID_CONFIRMED") return 1;
    if (status === "CHECKED_IN") return 2;
    if (status === "CHECKED_OUT") return 3;
    return 0;
  };
  const currentStepIndex = getStepIndex(effectiveStatus);
  const isStepCompleted = (idx: number) => {
    if (effectiveStatus === "ID_CONFIRMED" && idx === 1) return true;
    if (effectiveStatus === "CHECKED_IN" && idx <= 2) return true;
    if (effectiveStatus === "CHECKED_OUT" && idx <= 3) return true;
    return idx < currentStepIndex;
  };

  // Temporarily disabled for historical data upload
  const isLocked = false;
  /*
  const isLocked = guest && guest.checkOutDate && (
    new Date() > new Date(new Date(guest.checkOutDate).getTime() + 24 * 60 * 60 * 1000)
  );
  */


  if (loading) {
    return <div className="p-8 max-w-[800px] mx-auto text-center text-gray-500 font-medium">Loading guest details...</div>;
  }

  if (!guest) {
    return <div className="p-8 max-w-[800px] mx-auto text-center text-red-500 font-medium">Guest not found.</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-8">
      <Link href="/guests" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1E3A8A] font-semibold mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Guests
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Guest Details */}
        <div className={`${guest.hasIdProof ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
          {/* Top Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 flex items-center gap-6">
            <div className="w-20 h-20 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-sm">
              {guest.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{guest.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <User className="w-4 h-4" /> {guest.numberOfGuests} Guest{guest.numberOfGuests !== 1 && 's'}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                  effectiveStatus === "BOOKING_CONFIRMED" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                  effectiveStatus === "ID_PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  effectiveStatus === "ID_CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  effectiveStatus === "CHECKED_IN" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  effectiveStatus === "CHECKED_OUT" ? "bg-gray-100 text-gray-700 border-gray-200" :
                  "bg-gray-100 text-gray-700 border-gray-200"
                }`}>
                  {effectiveStatus?.replace("_", " ")}
                </span>
                {isLocked && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-bold animate-pulse">
                    <X className="w-3 h-3" /> Locked
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lifecycle Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">Guest Lifecycle</h2>
            <div className="relative flex justify-between">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-[#1E3A8A] -translate-y-1/2 z-0 transition-all duration-500" 
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              ></div>
              
              {statusSteps.map((step, idx) => {
                const isCompleted = isStepCompleted(idx);
                const isCurrent = idx === currentStepIndex && !isCompleted;
                
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${
                      isCompleted ? "bg-[#1E3A8A] border-[#1E3A8A] text-white" :
                      isCurrent ? "bg-white border-[#1E3A8A] text-[#1E3A8A]" :
                      "bg-white border-gray-100 text-gray-300"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span className={`absolute top-12 whitespace-nowrap text-xs font-bold ${
                      isCurrent ? "text-[#1E3A8A]" : "text-gray-500"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-16 flex justify-end gap-3 flex-wrap">
              {effectiveStatus === "ID_CONFIRMED" && (
                <button 
                  onClick={() => handleUpdateStatus("CHECKED_IN")}
                  disabled={updating || isLocked}
                  className="px-6 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
                >
                  Mark Check-In
                </button>
              )}
              {effectiveStatus === "CHECKED_IN" && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus("ID_CONFIRMED")}
                    disabled={updating || isLocked}
                    className="px-6 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Back to ID Verification
                  </button>
                  <button 
                    onClick={() => {
                      if (!guest.hasIdProof) {
                        toast.error("ID proof is required before check-out");
                        return;
                      }
                      handleUpdateStatus("CHECKED_OUT");
                    }}
                    disabled={updating || isLocked}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50 ${
                      !guest.hasIdProof 
                        ? "bg-gray-300 text-white cursor-not-allowed" 
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Mark Check-Out
                  </button>
                </>
              )}
              {effectiveStatus === "CHECKED_OUT" && (
                <button 
                  onClick={() => handleUpdateStatus("CHECKED_IN")}
                  disabled={updating || isLocked}
                  className="px-6 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Back to Checked In
                </button>
              )}
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#1E3A8A]" />
                <h2 className="text-xl font-bold text-gray-900">Stay Details</h2>
              </div>
              {hasChanges && (
                <button 
                  onClick={handleSaveChanges}
                  disabled={updating || isLocked}
                  className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-right-2 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Update Details"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-in Date</p>
                <p className="text-base font-bold text-gray-900">
                  {new Date(guest.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-out Date</p>
                <p className="text-base font-bold text-gray-900">
                  {new Date(guest.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-in Time</p>
                  <div className="relative group">
                    <input 
                      type="time" 
                      value={tempData.checkInTime}
                      onChange={(e) => setTempData(prev => ({ ...prev, checkInTime: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-out Time</p>
                  <div className="relative group">
                    <input 
                      type="time" 
                      value={tempData.checkOutTime}
                      onChange={(e) => setTempData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount Paid</p>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input 
                    type="number" 
                    value={tempData.amountByGuest}
                    onChange={(e) => setTempData(prev => ({ ...prev, amountByGuest: e.target.value }))}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-7 pr-3 py-1.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] transition-all"
                  />
                </div>
              </div>
              <div className="col-span-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ID Proof Status</p>
                <div className="flex items-center gap-2">
                  {guest.hasIdProof ? (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      <Clock className="w-4 h-4" /> Pending
                    </span>
                  )}
                  <span className="text-base font-bold text-gray-900 ml-2">{guest.idProofType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {guest.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#1E3A8A]" />
                <h2 className="text-xl font-bold text-gray-900">Additional Notes</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                {guest.notes}
              </p>
            </div>
          )}

          {/* ID Combine Utility */}
          {!isLocked && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <IdUploadUtility 
                guestName={guest.name} 
                guestId={id} 
                checkInDate={guest.checkInDate}
                checkOutDate={guest.checkOutDate}
                onUploadSuccess={(updatedGuest) => setGuest(updatedGuest)} 
              />
            </div>
          )}

          {/* ID Documents */}
          <div className={`rounded-2xl shadow-sm border p-6 transition-all duration-300 ${!guest.hasIdProof ? 'border-[#1E3A8A] bg-[#F0F7FF] ring-4 ring-blue-50' : 'border-[#E2E8F0] bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${!guest.hasIdProof ? 'text-[#1E3A8A]' : 'text-gray-400'}`} />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">ID Proof Documents</h2>
                  {!guest.hasIdProof && <p className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">Required Step</p>}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <label className={`cursor-pointer px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                  !guest.hasIdProof 
                    ? 'bg-[#1E3A8A] text-white hover:bg-blue-900 shadow-lg shadow-blue-900/10' 
                    : 'bg-[#F8FAFC] hover:bg-gray-100 text-[#1E3A8A] border border-[#E2E8F0]'
                }`}>
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading..." : guest.hasIdProof ? "Upload More" : "Upload ID Proof"}
                  <input type="file" className="sr-only" multiple onChange={handleFileUpload} disabled={uploading || isLocked} />
                </label>
              </div>
            </div>

            {guest.documents && guest.documents.length > 0 ? (
              <div className="space-y-8">
                {/* Main Guest Documents */}
                {guest.documents.filter((d: any) => d.documentOwner === "MAIN_GUEST" || !d.documentOwner).length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                      <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                      Main Guest Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {guest.documents
                        .filter((d: any) => d.documentOwner === "MAIN_GUEST" || !d.documentOwner)
                        .map((doc: any, i: number) => (
                          <DocumentItem key={i} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Accompanying Guest Documents */}
                {guest.documents.filter((d: any) => d.documentOwner === "ACCOMPANYING_GUEST").length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                      Accompanying Guest Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {guest.documents
                        .filter((d: any) => d.documentOwner === "ACCOMPANYING_GUEST")
                        .map((doc: any, j: number) => (
                          <DocumentItem key={j} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-[#F8FAFC] rounded-xl border-2 border-dashed border-[#E2E8F0]">
                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Standard Messages */}
        {!guest.hasIdProof && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-[#1E3A8A]" />
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-[#EEF2FF] rounded-2xl border border-[#C3DAFE] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#1E3A8A] text-sm uppercase tracking-wider">Check-in Message</h3>
                    <button 
                      onClick={() => {
                        const message = `Dear ${guest.name},

Your booking has been successfully confirmed.
Duration of Stay: ${new Date(guest.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to ${new Date(guest.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${guest.totalNights} nights)

Kindly share a valid government-issued ID proof for all guests at your earliest convenience to complete the check-in process.

The check-in details will be shared with you 24 hours prior to your stay.

Please feel free to reach out if you have any questions.

Thank you!`;
                        navigator.clipboard.writeText(message);
                        toast.success("Message copied to clipboard!");
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Copy Message
                    </button>
                  </div>
                  
                  <div className="bg-white/70 rounded-xl p-4 border border-[#C3DAFE] text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-line">
                    {`Dear ${guest.name},

Your booking has been successfully confirmed.
Duration of Stay: ${new Date(guest.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to ${new Date(guest.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${guest.totalNights} nights)

Kindly share a valid government-issued ID proof for all guests at your earliest convenience to complete the check-in process.

The check-in details will be shared with you 24 hours prior to your stay.

Please feel free to reach out if you have any questions.

Thank you!`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FileUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={handleModalConfirm}
        files={pendingFiles}
        mainGuestName={guest.name}
        checkInDate={guest.checkInDate}
        checkOutDate={guest.checkOutDate}
      />
    </div>
  );
}

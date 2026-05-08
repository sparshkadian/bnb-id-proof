import { useState, useEffect, useCallback } from "react";
import { X, User, Users, FileText, Check, RotateCw, Crop, Save, Loader2 } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils";

interface FileInfo {
  file: File;
  previewUrl: string;
  customName: string;
  owner: "MAIN_GUEST" | "ACCOMPANYING_GUEST";
  guestName: string;
  idType: string;
}

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filesInfo: any[]) => void;
  files: File[];
  mainGuestName: string;
  checkInDate?: string;
  checkOutDate?: string;
}

import ModernSelect from "@/components/ModernSelect";

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID"];
const ID_OPTIONS = ID_TYPES.map(type => ({ value: type, label: type }));

export default function FileUploadModal({
  isOpen,
  onClose,
  onConfirm,
  files,
  mainGuestName,
  checkInDate,
  checkOutDate,
}: FileUploadModalProps) {
  const [filesInfo, setFilesInfo] = useState<FileInfo[]>([]);
  
  // Editor State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "YYYYMMDD";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "YYYYMMDD";
    return d.toISOString().split('T')[0].replace(/-/g, '');
  };

  const generateName = (info: Partial<FileInfo>) => {
    const start = formatDate(checkInDate);
    const end = formatDate(checkOutDate);
    const gName = info.guestName || "Guest";
    const cleanGName = gName.replace(/\s+/g, '_');
    const id = info.idType || "ID";
    const cleanId = id.replace(/\s+/g, '_');
    
    return `${start}_${end}__${cleanGName}__${cleanId}`;
  };

  useEffect(() => {
    if (isOpen && files.length > 0) {
      const initialInfo = files.map((file) => {
        const info: any = {
          file,
          previewUrl: URL.createObjectURL(file),
          owner: "MAIN_GUEST" as const,
          guestName: mainGuestName,
          idType: ID_TYPES[0],
        };
        info.customName = generateName(info);
        return info as FileInfo;
      });
      setFilesInfo(initialInfo);

      return () => {
        initialInfo.forEach(info => URL.revokeObjectURL(info.previewUrl));
      };
    }
  }, [isOpen, files, checkInDate, checkOutDate, mainGuestName]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpdate = (index: number, updates: Partial<FileInfo>) => {
    setFilesInfo((prev) =>
      prev.map((info, i) => {
        if (i === index) {
          const newInfo = { ...info, ...updates };
          if (updates.owner === "MAIN_GUEST" && !updates.guestName) {
            newInfo.guestName = mainGuestName;
          }
          if (updates.owner || updates.guestName !== undefined || updates.idType) {
            newInfo.customName = generateName(newInfo);
          }
          return newInfo;
        }
        return info;
      })
    );
  };

  const saveEditedImage = async () => {
    if (editingIndex === null || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const info = filesInfo[editingIndex];
      const croppedBlob = await getCroppedImg(
        info.previewUrl,
        croppedAreaPixels,
        rotation
      );

      if (croppedBlob) {
        const editedFile = new File([croppedBlob], info.file.name, {
          type: "image/jpeg",
        });
        const newUrl = URL.createObjectURL(editedFile);
        
        // Revoke old URL
        URL.revokeObjectURL(info.previewUrl);
        
        handleUpdate(editingIndex, {
          file: editedFile,
          previewUrl: newUrl
        });
        setEditingIndex(null);
        setRotation(0);
        setZoom(1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    for (const info of filesInfo) {
      if (!info.guestName) {
        alert(`Please enter a guest name for file: ${info.file.name}`);
        return;
      }
      if (!info.idType) {
        alert(`Please select an ID type for file: ${info.file.name}`);
        return;
      }
    }
    onConfirm(filesInfo);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Image Editor Overlay */}
        {editingIndex !== null && (
          <div className="absolute inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Crop className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-gray-900">Edit Document</h4>
              </div>
              <button onClick={() => setEditingIndex(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-gray-900">
              <Cropper
                image={filesInfo[editingIndex].previewUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={undefined}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>

            <div className="p-6 bg-white border-t space-y-6">
              <div className="flex items-center gap-8">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zoom</label>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-all flex items-center gap-2 font-bold text-xs"
                  >
                    <RotateCw className="w-4 h-4" /> Rotate 90°
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedImage}
                  disabled={isProcessing}
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/10 flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Document Information</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configure naming & owner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8">
          {filesInfo.map((info, idx) => (
            <div key={idx} className="space-y-4 p-5 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  {idx + 1}
                </div>
                <span className="text-sm font-bold text-gray-900 truncate flex-1">
                  {info.file.name}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {(info.file.size / 1024).toFixed(0)} KB
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preview & Edit Button */}
                <div className="md:col-span-2 flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {info.file.type.startsWith("image/") ? (
                    <div className="relative group">
                      <img src={info.previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-white shadow-sm" />
                      <button 
                        onClick={() => setEditingIndex(idx)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white"
                      >
                        <Crop className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-600">{info.file.name}</p>
                    {info.file.type.startsWith("image/") && (
                      <button 
                        onClick={() => setEditingIndex(idx)}
                        className="mt-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-800 transition-colors flex items-center gap-1"
                      >
                        <Crop className="w-3 h-3" /> Edit Image (Crop/Rotate)
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Document Owner
                  </label>
                  <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
                    <button
                      onClick={() => handleUpdate(idx, { owner: "MAIN_GUEST" })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        info.owner === "MAIN_GUEST"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <User className="w-3 h-3" />
                      Main Guest
                    </button>
                    <button
                      onClick={() => handleUpdate(idx, { owner: "ACCOMPANYING_GUEST" })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        info.owner === "ACCOMPANYING_GUEST"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      Accompanying
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    ID Type
                  </label>
                  <ModernSelect
                    value={info.idType}
                    onChange={(val) => handleUpdate(idx, { idType: val })}
                    options={ID_OPTIONS}
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    value={info.guestName}
                    onChange={(e) => handleUpdate(idx, { guestName: e.target.value })}
                    className="w-full px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter guest name"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Generated Filename
                  </label>
                  <div className="w-full px-4 py-2 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm font-mono font-bold text-indigo-600 break-all">
                    {info.customName}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/10 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm Upload
          </button>
        </div>
      </div>
    </div>
  );
}

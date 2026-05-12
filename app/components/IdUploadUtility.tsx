import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, Image as ImageIcon, Download, Check, Loader2, X, RotateCw, Crop, Save, User, Users } from "lucide-react";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils";

interface IdUploadUtilityProps {
  guestName: string;
  guestId: string;
  checkInDate?: string;
  checkOutDate?: string;
  onUploadSuccess: (updatedGuest: any) => void;
}

import ModernSelect from "@/components/ModernSelect";

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID"];
const ID_OPTIONS = ID_TYPES.map(type => ({ value: type, label: type }));

export default function IdUploadUtility({ 
  guestName, 
  guestId, 
  checkInDate,
  checkOutDate,
  onUploadSuccess 
}: IdUploadUtilityProps) {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [documentOwner, setDocumentOwner] = useState<"MAIN_GUEST" | "ACCOMPANYING_GUEST">("MAIN_GUEST");
  const [guestNameInput, setGuestNameInput] = useState(guestName);
  const [filename, setFilename] = useState("");
  
  const [outputType, setOutputType] = useState<"PDF" | "IMAGE">("PDF");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Editor State
  const [editingSide, setEditingSide] = useState<"front" | "back" | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "YYYYMMDD";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "YYYYMMDD";
    return d.toISOString().split('T')[0].replace(/-/g, '');
  };

  const generateName = useCallback(() => {
    const start = formatDate(checkInDate);
    const end = formatDate(checkOutDate);
    const gName = guestNameInput || "Guest";
    const cleanGName = gName.replace(/\s+/g, '_');
    const cleanId = idType.replace(/\s+/g, '_');
    
    return `${start}_${end}__${cleanGName}__${cleanId}`;
  }, [checkInDate, checkOutDate, guestNameInput, idType]);

  useEffect(() => {
    setFilename(generateName());
  }, [generateName]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "front") setFrontImage(reader.result as string);
        else setBackImage(reader.result as string);
        setGeneratedBlob(null);
        setPreviewUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveEditedImage = async () => {
    if (editingSide === null || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const imageSrc = editingSide === "front" ? frontImage : backImage;
      if (!imageSrc) return;

      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      if (croppedBlob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (editingSide === "front") setFrontImage(reader.result as string);
          else setBackImage(reader.result as string);
          setEditingSide(null);
          setRotation(0);
          setZoom(1);
          setGeneratedBlob(null);
          setPreviewUrl(null);
        };
        reader.readAsDataURL(croppedBlob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateOutput = async () => {
    if (!frontImage || !backImage) {
      toast.error("Please upload both front and back images");
      return;
    }

    setIsGenerating(true);
    try {
      const frontImg = await loadImage(frontImage);
      const backImg = await loadImage(backImage);

      if (outputType === "PDF") {
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pageWidth * 0.8;
        const imgHeight = (imgWidth * frontImg.height) / frontImg.width;
        
        pdf.addImage(frontImage, "JPEG", (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);
        pdf.addImage(backImage, "JPEG", (pageWidth - imgWidth) / 2, 20 + imgHeight + 10, imgWidth, (imgWidth * backImg.height) / backImg.width);
        
        const blob = pdf.output("blob");
        setGeneratedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      } else {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = Math.max(frontImg.width, backImg.width);
        const height = frontImg.height + backImg.height + 20;

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(frontImg, (width - frontImg.width) / 2, 0);
        ctx.drawImage(backImg, (width - backImg.width) / 2, frontImg.height + 20);

        canvas.toBlob((blob) => {
          if (blob) {
            setGeneratedBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
          }
        }, "image/jpeg", 0.9);
      }
      toast.success(`${outputType} generated!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate output");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const downloadFile = () => {
    if (!generatedBlob) return;
    const url = URL.createObjectURL(generatedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${outputType === "PDF" ? "pdf" : "jpg"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const attachToProfile = async () => {
    if (!generatedBlob) return;
    setIsUploading(true);
    try {
      const file = new File([generatedBlob], `${filename}.${outputType === "PDF" ? "pdf" : "jpg"}`, {
        type: outputType === "PDF" ? "application/pdf" : "image/jpeg",
      });

      const formData = new FormData();
      formData.append("documents", file);
      formData.append("documentNames", filename);
      formData.append("documentOwners", documentOwner);
      if (documentOwner === "ACCOMPANYING_GUEST") {
        formData.append("accompanyingGuestNames", guestNameInput);
      }
      formData.append("idProofTypes", idType);

      const res = await fetch(`/api/guests/${guestId}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUploadSuccess(data.guest);
        toast.success("Document attached to profile successfully!");
        setFrontImage(null);
        setBackImage(null);
        setGeneratedBlob(null);
        setPreviewUrl(null);
      } else {
        toast.error("Failed to attach to profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden relative">
      
      {/* Image Editor Overlay */}
      {editingSide !== null && (
        <div className="absolute inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-gray-900">Edit {editingSide === "front" ? "Front" : "Back"} Side</h4>
            </div>
            <button onClick={() => setEditingSide(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 relative bg-gray-900">
            <Cropper
              image={(editingSide === "front" ? frontImage : backImage)!}
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
              <button onClick={() => setEditingSide(null)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
              <button
                onClick={saveEditedImage}
                disabled={isProcessing}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Apply Edits
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">ID Combine Utility</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Merge & crop front/back images</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Side */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Front Side</p>
            <div className="relative group">
              <label className={`relative flex flex-col items-center justify-center aspect-[1.58/1] border-2 border-dashed rounded-2xl cursor-pointer transition-all ${frontImage ? 'border-indigo-200 bg-indigo-50/30' : 'border-[#E2E8F0] hover:border-indigo-400 hover:bg-gray-50'}`}>
                {frontImage ? (
                  <img src={frontImage} alt="Front" className="w-full h-full object-contain rounded-xl p-2" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-xs font-bold text-gray-400">Upload Front</span>
                  </>
                )}
                <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e, "front")} />
              </label>
              {frontImage && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => setEditingSide("front")} className="p-1.5 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors">
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setFrontImage(null)} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 shadow-sm transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Back Side */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Back Side</p>
            <div className="relative group">
              <label className={`relative flex flex-col items-center justify-center aspect-[1.58/1] border-2 border-dashed rounded-2xl cursor-pointer transition-all ${backImage ? 'border-indigo-200 bg-indigo-50/30' : 'border-[#E2E8F0] hover:border-indigo-400 hover:bg-gray-50'}`}>
                {backImage ? (
                  <img src={backImage} alt="Back" className="w-full h-full object-contain rounded-xl p-2" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-xs font-bold text-gray-400">Upload Back</span>
                  </>
                )}
                <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e, "back")} />
              </label>
              {backImage && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => setEditingSide("back")} className="p-1.5 bg-white border border-gray-200 rounded-lg text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors">
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setBackImage(null)} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 shadow-sm transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Document Belongs To</label>
              <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
                <button 
                  onClick={() => {
                    setDocumentOwner("MAIN_GUEST");
                    setGuestNameInput(guestName);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${documentOwner === "MAIN_GUEST" ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <User className="w-3.5 h-3.5 inline mr-1" /> Main Guest
                </button>
                <button 
                  onClick={() => setDocumentOwner("ACCOMPANYING_GUEST")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${documentOwner === "ACCOMPANYING_GUEST" ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Users className="w-3.5 h-3.5 inline mr-1" /> Accompanying
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">ID Type</label>
                  <ModernSelect
                    value={idType}
                    onChange={setIdType}
                    options={ID_OPTIONS}
                  />
            </div>

            <div className="md:col-span-2 space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Guest Name</label>
              <input 
                type="text" 
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="Enter guest name"
                className="w-full px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Output Format</label>
              <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
                <button onClick={() => { setOutputType("PDF"); setGeneratedBlob(null); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${outputType === "PDF" ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>PDF Document</button>
                <button onClick={() => { setOutputType("IMAGE"); setGeneratedBlob(null); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${outputType === "IMAGE" ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Combined Image</button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Generated Filename</label>
              <div className="w-full px-4 py-2 bg-gray-50 border border-[#E2E8F0] rounded-xl text-xs font-mono font-bold text-indigo-600 truncate">
                {filename}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!generatedBlob ? (
              <button 
                onClick={generateOutput}
                disabled={isGenerating || !frontImage || !backImage}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/10 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Combined {outputType}
              </button>
            ) : (
              <>
                <button onClick={downloadFile} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-6 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all shadow-sm"><Download className="w-4 h-4" /> Download</button>
                <button onClick={attachToProfile} disabled={isUploading} className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Attach to Profile
                </button>
              </>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {previewUrl && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-[#E2E8F0] animate-in fade-in slide-in-from-top-4 duration-300">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Generated Preview</p>
            {outputType === "PDF" ? (
              <iframe src={previewUrl} className="w-full h-80 rounded-xl border border-gray-200 bg-white" title="PDF Preview" />
            ) : (
              <img src={previewUrl} alt="Combined Preview" className="w-full max-h-80 object-contain rounded-xl border border-gray-200 bg-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

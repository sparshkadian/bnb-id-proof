import { Download, FileText, FileImage, File } from "lucide-react";

type Document = {
  id: string;
  filePath: string;
  fileType: string;
};

export default function FilePreview({ document, index }: { document: Document; index: number }) {
  const isImage = document.fileType.startsWith("image/");

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {isImage ? <FileImage className="w-4 h-4" /> : <File className="w-4 h-4" />}
          Document {index + 1}
        </div>
        <a
          href={document.filePath}
          download
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
      </div>
      <div className="bg-gray-100 p-4 flex justify-center items-center min-h-[300px]">
        {isImage ? (
          <img
            src={document.filePath}
            alt={`ID Proof ${index + 1}`}
            className="max-w-full max-h-[600px] object-contain rounded shadow-sm bg-white"
          />
        ) : (
          <div className="text-center p-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">PDF Document</p>
            <a
              href={document.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Open PDF in new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

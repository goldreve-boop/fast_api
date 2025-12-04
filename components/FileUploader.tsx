import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { parseExcelFile } from '../services/excelService';
import { ParsedData, DataRow } from '../types';

interface FileUploaderProps {
  title: string;
  description: string;
  currentData: ParsedData | null;
  onDataLoaded: (data: ParsedData) => void;
  accept?: string;
  requiredHeaders?: string[];
  customValidation?: (rows: DataRow[]) => string | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  title, 
  description, 
  currentData, 
  onDataLoaded,
  accept = ".xlsx, .xls, .csv",
  requiredHeaders,
  customValidation
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateHeaders = (headers: string[]): string[] => {
    if (!requiredHeaders) return [];
    // Case-insensitive check
    const headersLower = headers.map(h => h.toLowerCase());
    return requiredHeaders.filter(req => !headersLower.includes(req.toLowerCase()));
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcelFile(file);
      
      const missingHeaders = validateHeaders(data.headers);
      
      if (missingHeaders.length > 0) {
        const foundHeaders = data.headers.length > 0 ? data.headers.join(', ') : 'None';
        throw new Error(
          `Missing required columns: ${missingHeaders.join(', ')}.\n\nFound columns in file: ${foundHeaders}`
        );
      }

      if (customValidation) {
        const validationError = customValidation(data.rows);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      onDataLoaded(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse file. Please ensure it is a valid Excel file.");
    } finally {
      setIsLoading(false);
      // Reset input value to allow re-uploading the same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500">{description}</p>
      </div>

      {requiredHeaders && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">Required Excel Columns</h4>
            <p className="text-xs text-blue-600 mb-2">Your file must contain the following headers exactly:</p>
            <div className="flex flex-wrap gap-2">
              {requiredHeaders.map(header => (
                <span key={header} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-blue-200 text-xs font-mono text-blue-700">
                  {header}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div 
        className={`
          relative border-2 border-dashed rounded-xl p-10 transition-all duration-200 ease-in-out
          flex flex-col items-center justify-center text-center cursor-pointer
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept={accept}
          onChange={handleFileInput}
        />
        
        {isLoading ? (
          <div className="animate-pulse flex flex-col items-center">
             <UploadCloud className="w-12 h-12 text-indigo-400 mb-4" />
             <p className="text-indigo-600 font-medium">Processing File...</p>
          </div>
        ) : currentData ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{currentData.fileName}</h3>
            <p className="text-sm text-green-600 mt-1">Successfully Uploaded</p>
            <p className="text-xs text-slate-400 mt-2">{currentData.rows.length} rows processed</p>
            <button className="mt-6 text-sm text-indigo-600 hover:text-indigo-800 underline">
              Replace File
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Click to upload or drag and drop</h3>
            <p className="text-sm text-slate-500 mt-2">XLSX, CSV (Max 10MB)</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm whitespace-pre-line font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* Data Preview Table (Simplified) */}
      {currentData && currentData.rows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Data Preview
            </h3>
            <span className="text-xs text-slate-500">Showing first 5 rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  {currentData.headers.slice(0, 6).map((header, idx) => (
                    <th key={idx} className="px-6 py-3 font-medium whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                  {currentData.headers.length > 6 && <th className="px-6 py-3">...</th>}
                </tr>
              </thead>
              <tbody>
                {currentData.rows.slice(0, 5).map((row, rowIdx) => (
                  <tr key={rowIdx} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    {currentData.headers.slice(0, 6).map((header, colIdx) => (
                      <td key={`${rowIdx}-${colIdx}`} className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {String(row[header] || "")}
                      </td>
                    ))}
                    {currentData.headers.length > 6 && <td className="px-6 py-4 text-slate-400">...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
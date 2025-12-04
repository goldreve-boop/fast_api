
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MaterialMapping } from '../types';
import { SAP_DB } from '../services/sapDatabase';
import { Trash2, Save, Plus, RotateCcw, UploadCloud } from 'lucide-react';
import { parseExcelFile } from '../services/excelService';

interface MaterialMappingPageProps {
  onUpdateMappings: (mappings: MaterialMapping[]) => void;
}

const MaterialMappingPage: React.FC<MaterialMappingPageProps> = ({ onUpdateMappings }) => {
  const [rows, setRows] = useState<MaterialMapping[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRows(SAP_DB.ZMAPPING_MAT);
  }, []);

  const matnrList = useMemo(() => {
    if (SAP_DB.ZFIDOC.length === 0) return [];
    const uniqueSet = new Set<string>();
    SAP_DB.ZFIDOC.forEach(row => {
      const val = String(row['MATERIAL'] || '');
      if (val) uniqueSet.add(val);
    });
    return Array.from(uniqueSet).sort();
  }, []);

  const upcList = useMemo(() => {
    if (SAP_DB.ZNIELSEN.length === 0) return [];
    const uniqueSet = new Set<string>();
    SAP_DB.ZNIELSEN.forEach(row => {
      const val = String(row['UPC'] || '');
      if (val) uniqueSet.add(val);
    });
    return Array.from(uniqueSet).sort();
  }, []);

  const handleAddLine = () => {
    const newRow: MaterialMapping = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      matnr: '',
      upc: '',
      packSize: ''
    };
    setRows([...rows, newRow]);
    setIsSaved(false);
  };

  const handleRemoveLine = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
    setIsSaved(false);
  };

  const handleChange = (id: string, field: keyof MaterialMapping, value: string) => {
    setRows(rows.map(row => {
      if (row.id === id) return { ...row, [field]: value };
      return row;
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    const cleanRows = rows.filter(r => r.matnr || r.upc);
    onUpdateMappings(cleanRows);
    setRows(cleanRows);
    setIsSaved(true);
    alert('Material mappings saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm("Discard unsaved changes?")) {
       setRows(SAP_DB.ZMAPPING_MAT);
       setIsSaved(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      const newMappings: MaterialMapping[] = parsed.rows.map(row => {
         const findVal = (keys: string[]) => {
          const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().replace(/\s/g, '')));
          return foundKey ? String(row[foundKey]) : '';
        };
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          matnr: findVal(['matnr', 'material', 'materialno']),
          upc: findVal(['upc', 'ean', 'upccode']),
          packSize: findVal(['packsize', 'pack', 'size'])
        };
      }).filter(m => m.matnr || m.upc);

       if (newMappings.length === 0) {
        alert(`Upload Failed: No valid data found.`);
        return;
      }

      setRows(prev => [...prev, ...newMappings]);
      setIsSaved(false);
      setTimeout(() => alert(`Success! ${newMappings.length} material mappings added.`), 10);

    } catch (error: any) {
      console.error(error);
      alert("Error processing file: " + error.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Material Mapping</h1>
          <p className="text-slate-500 mt-2">Link Financial Materials (MATNR) to Nielsen Products (UPC).</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors">
            <UploadCloud className="w-4 h-4" /> Upload Excel
          </button>

          {!isSaved && (
             <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors">
               <RotateCcw className="w-4 h-4" /> Discard
             </button>
          )}
          <button onClick={handleSave} disabled={isSaved} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors shadow-sm ${isSaved ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            <Save className="w-4 h-4" /> {isSaved ? 'All Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[35%]">MATNR (FI Material)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[35%]">UPC (Nielsen)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">Pack Size</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No material mappings found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="relative">
                        <input list={`matnr-list-${row.id}`} value={row.matnr} onChange={(e) => handleChange(row.id, 'matnr', e.target.value)} placeholder="Select or Type MATNR..." className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5" />
                        <datalist id={`matnr-list-${row.id}`}>{matnrList.map(m => <option key={m} value={m} />)}</datalist>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        <input list={`upc-list-${row.id}`} value={row.upc} onChange={(e) => handleChange(row.id, 'upc', e.target.value)} placeholder="Select or Type UPC..." className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5" />
                        <datalist id={`upc-list-${row.id}`}>{upcList.map(u => <option key={u} value={u} />)}</datalist>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={row.packSize} onChange={(e) => handleChange(row.id, 'packSize', e.target.value)} placeholder="e.g. 6, 12, 24" className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5" />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleRemoveLine(row.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
           <button onClick={handleAddLine} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"><Plus className="w-4 h-4" /> Add Line</button>
        </div>
      </div>
    </div>
  );
};

export default MaterialMappingPage;

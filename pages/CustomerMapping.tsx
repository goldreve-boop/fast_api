
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CustomerMapping } from '../types';
import { SAP_DB } from '../services/sapDatabase';
import { Trash2, AlertCircle, Save, Plus, RotateCcw, UploadCloud, Search, XCircle } from 'lucide-react';
import { parseExcelFile } from '../services/excelService';

interface CustomerMappingPageProps {
  onUpdateMappings: (mappings: CustomerMapping[]) => void;
}

const CustomerMappingPage: React.FC<CustomerMappingPageProps> = ({ onUpdateMappings }) => {
  const [rows, setRows] = useState<CustomerMapping[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from SAP_DB
  useEffect(() => {
    setRows(SAP_DB.ZMAPPING_CUST);
  }, []);

  // Extract from SAP_DB tables
  const territories = useMemo(() => {
    if (SAP_DB.ZPROMOTION.length === 0) return [];
    const uniqueMap = new Map<string, string>();
    SAP_DB.ZPROMOTION.forEach(row => {
      const id = String(row['TerritoryID'] || '');
      const name = String(row['TypeName'] || row['TerritoryName'] || ''); 
      if (id && !uniqueMap.has(id)) uniqueMap.set(id, name);
    });
    return Array.from(uniqueMap.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  const customers = useMemo(() => {
    if (SAP_DB.ZNIELSEN.length === 0) return [];
    const uniqueSet = new Set<string>();
    SAP_DB.ZNIELSEN.forEach(row => {
      const cust = String(row['Customer'] || '');
      if (cust) uniqueSet.add(cust);
    });
    return Array.from(uniqueSet).sort();
  }, []);

  const handleAddLine = () => {
    const newRow: CustomerMapping = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      territoryId: '',
      territoryName: '',
      nielsenCustomer: ''
    };
    setSearchTerm('');
    setRows([...rows, newRow]);
    setIsSaved(false);
  };

  const handleRemoveLine = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
    setIsSaved(false);
  };

  const handleDeleteAll = () => {
    if (rows.length === 0) return;
    if (window.confirm("Are you sure you want to delete ALL mappings?")) {
      setRows([]);
      setIsSaved(false);
      setSearchTerm('');
    }
  };

  const handleChange = (id: string, field: keyof CustomerMapping, value: string) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'territoryId') {
          const found = territories.find(t => t.id === value);
          if (found) updatedRow.territoryName = found.name;
        }
        return updatedRow;
      }
      return row;
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    const cleanRows = rows.filter(r => r.territoryId || r.nielsenCustomer || r.territoryName);
    onUpdateMappings(cleanRows);
    setRows(cleanRows);
    setIsSaved(true);
    alert('Mappings saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm("Discard unsaved changes?")) {
       setRows(SAP_DB.ZMAPPING_CUST);
       setIsSaved(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Expected format: TerritoryID, TerritoryName, Customer
      const parsed = await parseExcelFile(file, ['TerritoryID', 'TerritoryName', 'Customer']);
      
      const newMappings: CustomerMapping[] = parsed.rows.map(row => {
        const findVal = (keys: string[]) => {
          const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().replace(/\s/g, '')));
          return foundKey ? String(row[foundKey]) : '';
        };
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          territoryId: findVal(['territoryid', 'id']),
          territoryName: findVal(['territoryname', 'territory name', 'name']),
          nielsenCustomer: findVal(['customer', 'nielsencustomer'])
        };
      }).filter(m => m.territoryId || m.nielsenCustomer);

      if (newMappings.length === 0) {
        alert(`Upload Failed. Required headers: TerritoryID, TerritoryName, Customer.`);
        return;
      }

      setRows(prev => [...prev, ...newMappings]);
      setIsSaved(false);
      setSearchTerm('');
      setTimeout(() => alert(`Success! ${newMappings.length} mappings added.`), 10);
      
    } catch (error) {
      console.error(error);
      alert("Failed to parse Excel file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredRows = rows.filter(row => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      row.territoryId.toLowerCase().includes(lowerTerm) ||
      row.territoryName.toLowerCase().includes(lowerTerm) ||
      row.nielsenCustomer.toLowerCase().includes(lowerTerm)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customer Mapping</h1>
          <p className="text-slate-500 mt-2">Map Promotion Territories to Nielsen Customers.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search mappings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 w-48 md:w-64"
            />
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors">
            <UploadCloud className="w-4 h-4" /> Upload Excel
          </button>

          {rows.length > 0 && (
            <button onClick={handleDeleteAll} className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}

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
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[25%]">TerritoryID</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[35%]">TerritoryName</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[35%]">Customer</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-[5%]">Remove</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRows.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No mappings found.</td></tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="relative">
                        <select value={row.territoryId} onChange={(e) => handleChange(row.id, 'territoryId', e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5 bg-transparent">
                          <option value="">Select or Type...</option>
                          {territories.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                        </select>
                        {row.territoryId && !territories.find(t => t.id === row.territoryId) && (
                            <div className="text-xs text-red-500 mt-1">Unknown ID: {row.territoryId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={row.territoryName} onChange={(e) => handleChange(row.id, 'territoryName', e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={row.nielsenCustomer} onChange={(e) => handleChange(row.id, 'nielsenCustomer', e.target.value)} className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5">
                        <option value="">Select Customer...</option>
                        {customers.map(c => <option key={c} value={c}>{c}</option>)}
                         {row.nielsenCustomer && !customers.includes(row.nielsenCustomer) && (
                             <option value={row.nielsenCustomer}>{row.nielsenCustomer} (New)</option>
                         )}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleRemoveLine(row.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"><XCircle className="w-4 h-4" /></button>
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

export default CustomerMappingPage;

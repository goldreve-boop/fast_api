
import React, { useState, useEffect } from 'react';
import { SAP_DB } from '../services/sapDatabase';
import { ButtonRole } from '../types';
import { Save, Plus, Trash2, RotateCcw, Search } from 'lucide-react';

const ButtonRolePage: React.FC = () => {
  const [rows, setRows] = useState<ButtonRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setRows(SAP_DB.ZBUTTONROLE);
  }, []);

  const handleAddLine = () => {
    const newRow: ButtonRole = {
      id: Date.now().toString(),
      userId: '',
      menuId: '', // Start empty, user must select
      canSave: false,
      canCancel: false,
      canCreate: false,
      canDelete: false,
      canConfirm: false
    };
    setRows([...rows, newRow]);
    setIsSaved(false);
  };

  const handleRemoveLine = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
    setIsSaved(false);
  };

  const handleChange = (id: string, field: keyof ButtonRole, value: any) => {
    setRows(rows.map(r => {
        if (r.id === id) {
            // If user ID changes, reset the menu selection because available menus change
            if (field === 'userId') {
                return { ...r, userId: value, menuId: '' };
            }
            return { ...r, [field]: value };
        }
        return r;
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    const cleanRows = rows.filter(r => r.userId.trim() !== '' && r.menuId.trim() !== '');
    SAP_DB.ZBUTTONROLE = cleanRows;
    setRows(cleanRows);
    setIsSaved(true);
    alert('Button Roles saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Discard changes?')) {
      setRows(SAP_DB.ZBUTTONROLE);
      setIsSaved(true);
    }
  };

  // Helper to get authorized menus for a specific user
  const getAuthorizedMenus = (userId: string) => {
      if (!userId) return [];
      // Filter ZMENUROLE for this user and where isAuthorized is true
      return SAP_DB.ZMENUROLE
          .filter(mr => mr.userId.toLowerCase() === userId.toLowerCase() && mr.isAuthorized)
          .map(mr => mr.menuId);
  };

  const filteredRows = rows.filter(r => 
    r.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.menuId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Button Role</h1>
          <p className="text-slate-500 mt-2">Manage user permissions for specific actions. (Filtered by Menu Role)</p>
        </div>
        <div className="flex gap-3 items-center">
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search User or Menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
           </div>
           {!isSaved && (
             <button onClick={handleReset} className="px-4 py-2 border border-slate-300 bg-white text-slate-600 font-medium rounded-lg hover:bg-slate-50">
               <RotateCcw className="w-4 h-4" />
             </button>
           )}
           <button onClick={handleSave} disabled={isSaved} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors shadow-sm ${isSaved ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
             <Save className="w-4 h-4" /> {isSaved ? 'Saved' : 'Save Changes'}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Program</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Save</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Cancel</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Create</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Delete</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Remove</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRows.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">No button roles defined.</td></tr>
              ) : (
                filteredRows.map((row) => {
                  const availableMenus = getAuthorizedMenus(row.userId);
                  
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-6 py-2">
                        <input 
                            type="text" 
                            value={row.userId} 
                            onChange={(e) => handleChange(row.id, 'userId', e.target.value)} 
                            placeholder="Enter User ID"
                            className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5"
                        />
                        </td>
                        <td className="px-6 py-2">
                        <select 
                            value={row.menuId} 
                            onChange={(e) => handleChange(row.id, 'menuId', e.target.value)}
                            className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5"
                            disabled={!row.userId || availableMenus.length === 0}
                        >
                            <option value="">Select Menu...</option>
                            {availableMenus.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {row.userId && availableMenus.length === 0 && (
                            <div className="text-xs text-red-400 mt-1">No authorized menus found for this user.</div>
                        )}
                        </td>
                        <td className="px-4 py-2 text-center"><input type="checkbox" checked={row.canSave} onChange={(e) => handleChange(row.id, 'canSave', e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" /></td>
                        <td className="px-4 py-2 text-center"><input type="checkbox" checked={row.canCancel} onChange={(e) => handleChange(row.id, 'canCancel', e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" /></td>
                        <td className="px-4 py-2 text-center"><input type="checkbox" checked={row.canCreate} onChange={(e) => handleChange(row.id, 'canCreate', e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" /></td>
                        <td className="px-4 py-2 text-center"><input type="checkbox" checked={row.canDelete} onChange={(e) => handleChange(row.id, 'canDelete', e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" /></td>
                        <td className="px-4 py-2 text-center"><input type="checkbox" checked={row.canConfirm} onChange={(e) => handleChange(row.id, 'canConfirm', e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded" /></td>
                        <td className="px-4 py-2 text-center">
                        <button onClick={() => handleRemoveLine(row.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </td>
                    </tr>
                  );
                })
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

export default ButtonRolePage;

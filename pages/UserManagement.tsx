
import React, { useState, useEffect } from 'react';
import { SAP_DB } from '../services/sapDatabase';
import { User } from '../types';
import { Save, Plus, Trash2, RotateCcw, Search, User as UserIcon } from 'lucide-react';

const UserManagementPage: React.FC = () => {
  const [rows, setRows] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setRows(SAP_DB.ZUSER);
  }, []);

  const handleAddLine = () => {
    const newRow: User = {
      id: Date.now().toString(),
      userId: '',
      password: '',
      lastName: '',
      firstName: ''
    };
    setRows([...rows, newRow]);
    setIsSaved(false);
  };

  const handleRemoveLine = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
    setIsSaved(false);
  };

  const handleChange = (id: string, field: keyof User, value: any) => {
    setRows(rows.map(r => (r.id === id ? { ...r, [field]: value } : r)));
    setIsSaved(false);
  };

  const handleSave = () => {
    const cleanRows = rows.filter(r => r.userId.trim() !== '');
    SAP_DB.ZUSER = cleanRows;
    setRows(cleanRows);
    setIsSaved(true);
    alert('Users saved successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Discard changes?')) {
      setRows(SAP_DB.ZUSER);
      setIsSaved(true);
    }
  };

  const filteredRows = rows.filter(r => 
    r.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-2">Create and manage system users.</p>
        </div>
        <div className="flex gap-3 items-center">
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search User..."
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
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Password</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Last Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">First Name</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Remove</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users defined.</td></tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-2">
                      <div className="relative">
                        <UserIcon className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={row.userId} 
                          onChange={(e) => handleChange(row.id, 'userId', e.target.value)} 
                          placeholder="User ID"
                          className="w-full text-sm pl-8 border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-2">
                      <input 
                        type="password" 
                        value={row.password} 
                        onChange={(e) => handleChange(row.id, 'password', e.target.value)} 
                        placeholder="Password"
                        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input 
                        type="text" 
                        value={row.lastName} 
                        onChange={(e) => handleChange(row.id, 'lastName', e.target.value)} 
                        placeholder="Last Name"
                        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5"
                      />
                    </td>
                    <td className="px-6 py-2">
                      <input 
                        type="text" 
                        value={row.firstName} 
                        onChange={(e) => handleChange(row.id, 'firstName', e.target.value)} 
                        placeholder="First Name"
                        className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 py-1.5"
                      />
                    </td>
                    <td className="px-6 py-2 text-center">
                       <button onClick={() => handleRemoveLine(row.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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

export default UserManagementPage;

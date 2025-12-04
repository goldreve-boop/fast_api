
import React, { useState } from 'react';
import { SAP_DB } from '../services/sapDatabase';
import { Search, Filter, Calendar, ChevronDown, ChevronRight, Save, Layout, Trash2, Copy, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper to safely find values
const getVal = (row: any, keys: string[]) => {
  if (!row) return '';
  for (const k of keys) {
    if (row[k] !== undefined) return String(row[k]);
  }
  return '';
};

const DeductionClaim: React.FC = () => {
  const navigate = useNavigate();
  const [claimingAccount, setClaimingAccount] = useState('');
  const [disputeCaseId, setDisputeCaseId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  // Robust date parser for SAP formats
  const parseRowDate = (val: any): Date | null => {
    if (!val) return null;
    const str = String(val).trim();
    
    const sapMatch = str.match(/^(\d{4})(\d{2})(\d{2})/);
    if (sapMatch) {
      const year = parseInt(sapMatch[1], 10);
      const month = parseInt(sapMatch[2], 10) - 1;
      const day = parseInt(sapMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    const isoMatch = str.match(/^(\d{4})[\.\-\/](\d{2})[\.\-\/](\d{2})/);
    if (isoMatch) {
       const year = parseInt(isoMatch[1], 10);
       const month = parseInt(isoMatch[2], 10) - 1;
       const day = parseInt(isoMatch[3], 10);
       const d = new Date(year, month, day);
       if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const parseInputDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
       return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return null;
  };

  const handleSearch = () => {
    setSearched(true);
    const fromDate = parseInputDate(dateFrom);
    const toDate = parseInputDate(dateTo);

    const results = SAP_DB.ZDISPUTE.filter(row => {
      const rowCaseId = String(getVal(row, ['EXT_KEY', 'Dispute Case ID'])).trim();
      const rowAccount = String(getVal(row, ['FIN_KUNNR', 'Claiming Account'])).trim();
      
      const rawDateVal = getVal(row, ['CREATE_TIME', 'Create Time', 'Date']);
      const rowDate = parseRowDate(rawDateVal);

      let matchCaseId = true;
      if (disputeCaseId) {
        matchCaseId = rowCaseId.includes(disputeCaseId.trim());
      }

      let matchAccount = true;
      if (claimingAccount) {
        matchAccount = rowAccount.includes(claimingAccount.trim());
      }

      let matchDate = true;
      if (fromDate || toDate) {
        if (!rowDate) {
          matchDate = false;
        } else {
          rowDate.setHours(0, 0, 0, 0);
          if (fromDate) {
            fromDate.setHours(0, 0, 0, 0);
            if (rowDate.getTime() < fromDate.getTime()) matchDate = false;
          }
          if (matchDate && toDate) { 
            toDate.setHours(0, 0, 0, 0);
            if (rowDate.getTime() > toDate.getTime()) matchDate = false;
          }
        }
      }

      return matchCaseId && matchAccount && matchDate;
    });
    setSearchResults(results);
  };

  const handleClear = () => {
      setClaimingAccount('');
      setDisputeCaseId('');
      setDateFrom('');
      setDateTo('');
      setSearchResults([]);
      setSearched(false);
  };

  const formatDateDisplay = (val: any) => {
    const d = parseRowDate(val);
    if (!d) return val;
    return d.toISOString().split('T')[0];
  };

  const handleRowClick = (id: string) => {
    if (id) {
      navigate(`/claim/deduction/${id}`);
    }
  };

  return (
    <div className="space-y-2 bg-slate-50 min-h-screen p-4 font-sans text-xs">
      {/* Header */}
      <div className="bg-[#dcebf9] border-b border-[#a6c4df] px-4 py-2 flex justify-between items-center mb-2 rounded-t-md">
        <div>
            <h1 className="text-lg font-bold text-slate-900 italic flex items-center gap-2">
                Search: Deduction Claims
            </h1>
            <div className="flex gap-4 text-xs text-slate-600 mt-0.5">
                <span className="hover:underline cursor-pointer">Archive Search</span>
                <span className="hover:underline cursor-pointer">Editable List</span>
            </div>
        </div>
      </div>

      {/* Search Criteria Panel */}
      <div className="bg-[#ebf2f9] p-3 rounded-sm border border-[#b0cce5]">
        <div className="flex justify-between items-start mb-2">
            <h2 className="font-bold text-xs text-slate-800">Search Criteria</h2>
            <button className="text-xs text-blue-600 hover:underline">Hide Search Fields</button>
        </div>
        
        <div className="grid grid-cols-1 gap-y-1 max-w-4xl">
            {/* Row 1: Claiming Account */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Claiming Account</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <input type="text" value={claimingAccount} onChange={e => setClaimingAccount(e.target.value)} className="border border-slate-300 px-2 h-5 text-xs w-1/2 bg-white" />
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 2: Dispute Case ID */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Dispute Case ID</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <input type="text" value={disputeCaseId} onChange={e => setDisputeCaseId(e.target.value)} className="border border-slate-300 px-2 h-5 text-xs w-1/2 bg-white" />
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 3: Create Date */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Create Date</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is between <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center gap-1">
                    <div className="relative w-1/4">
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-slate-300 px-2 h-5 text-xs w-full bg-white" />
                    </div>
                    <span className="text-xs">and</span>
                    <div className="relative w-1/4">
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-slate-300 px-2 h-5 text-xs w-full bg-white" />
                    </div>
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>
        </div>

        <div className="flex justify-between items-center mt-4">
            <div className="flex gap-1">
                <button onClick={handleSearch} className="bg-[#f6e59d] border border-[#dcc982] text-xs px-3 py-0.5 hover:bg-[#eedb8d] font-normal text-slate-800 shadow-sm rounded-sm">Search</button>
                <button onClick={handleClear} className="bg-[#f6e59d] border border-[#dcc982] text-xs px-3 py-0.5 hover:bg-[#eedb8d] font-normal text-slate-800 shadow-sm rounded-sm">Clear</button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Maximum Number of Results:</span>
                <input type="text" defaultValue="100" className="border border-slate-300 w-10 px-1 text-center bg-white h-5" />
            </div>
        </div>
        <div className="flex gap-2 mt-2 items-center">
            <span className="text-xs text-slate-600">Save Search As:</span>
            <input type="text" className="border border-slate-300 h-5 w-40 bg-white" />
             <button className="bg-[#f6e59d] border border-[#dcc982] text-xs px-2 py-0.5 hover:bg-[#eedb8d] font-normal text-slate-800 shadow-sm rounded-sm flex items-center gap-1">
                <Save className="w-3 h-3" /> Save
            </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="mt-2">
        <div className="bg-[#e8eef7] px-2 py-1 border border-[#b0cce5] flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800">Result List: {searched ? (searchResults.length > 0 ? `${searchResults.length} Deduction Claims Found` : 'No Claims Found') : 'Please run a search'}</h3>
        </div>
        
        <div className="bg-[#e3e9f1] p-1 border-x border-b border-[#b0cce5] flex gap-2 mb-0 items-center">
             <button className="flex items-center gap-1 bg-white border border-slate-400 px-2 py-0.5 text-[11px] rounded-sm shadow-sm hover:bg-slate-50"><div className="text-yellow-500 font-bold">New</div></button>
             <button className="flex items-center gap-1 bg-white border border-slate-400 px-2 py-0.5 text-[11px] rounded-sm shadow-sm hover:bg-slate-50 text-slate-400"><Trash2 className="w-3 h-3" /></button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <button className="text-[11px] hover:underline text-slate-700">Export</button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <div className="flex-1"></div>
             <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-600">Filter:</span>
                <input type="text" className="border border-slate-300 h-5 w-32 bg-white" />
                <div className="flex gap-1">
                    <Layout className="w-4 h-4 text-slate-500 cursor-pointer"/>
                </div>
             </div>
        </div>

        <div className="overflow-x-auto border border-[#b0cce5] border-t-0 bg-white">
            <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#ebf2f9] text-slate-700">
                    <tr>
                        <th className="w-6 px-1 border-r border-b border-[#b0cce5] text-center"><div className="w-3 h-3 border border-slate-400 bg-white inline-block"></div></th>
                        <th className="w-6 px-1 border-r border-b border-[#b0cce5]"></th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Dispute Case ID</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Claiming Account</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Requested Amount</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Currency</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Create Date</th>
                        <th className="px-2 py-1 border-b border-[#b0cce5] bg-[#ebf2f9]">Employee</th>
                    </tr>
                </thead>
                <tbody>
                    {!searched || searchResults.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">No result found</td></tr>
                    ) : (
                        searchResults.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[#fff8c0] border-b border-slate-100 cursor-default even:bg-[#f5f9fd]" onClick={() => handleRowClick(getVal(row, ['EXT_KEY']))}>
                                <td className="px-1 text-center border-r border-slate-200"><div className="w-3 h-3 border border-slate-400 bg-white inline-block"></div></td>
                                <td className="px-1 text-center border-r border-slate-200"><ChevronRight className="w-3 h-3 text-slate-500" /></td>
                                <td className="px-2 py-1 border-r border-slate-200 text-blue-600 hover:underline cursor-pointer font-medium">
                                    {getVal(row, ['EXT_KEY'])}
                                </td>
                                <td className="px-2 py-1 border-r border-slate-200">{getVal(row, ['FIN_KUNNR'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200 text-right">{getVal(row, ['FIN_ORIGINAL_AMT'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{getVal(row, ['FIN_DISPUTE_CURR']) || 'USD'}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{formatDateDisplay(getVal(row, ['CREATE_TIME']))}</td>
                                <td className="px-2 py-1 border-slate-200">{getVal(row, ['CREATED_BY']) || 'Unknown'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DeductionClaim;

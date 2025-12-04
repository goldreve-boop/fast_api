
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAP_DB } from '../services/sapDatabase';
import { Search, Filter, Calendar, Plus, Minus, Copy, ChevronRight, ChevronDown, Save as SaveIcon, Layout, Trash2 } from 'lucide-react';

// Helper to safely find values case-insensitively
const findVal = (row: any, keys: string[]): string => {
  if (!row) return '';
  for (const key of keys) {
    if (row[key] !== undefined) return String(row[key]);
  }
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey);
    if (foundKey) return String(row[foundKey]);
  }
  return '';
};

const TradePromotion: React.FC = () => {
  const navigate = useNavigate();
  const [searchCriteria, setSearchCriteria] = useState({
    promotionId: '',
    customer: '',
    productId: '',
    merchStartFrom: '',
    merchStartTo: '',
    shipStartFrom: '10/01/2025', // Default from screenshot example
    shipStartTo: '10/31/2025',   // Default from screenshot example
    status: '',
    spendMethod: '',
    tactic: ''
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setSearched(true);
    
    const results = SAP_DB.ZPROMOTION.filter(p => {
      const pid = String(findVal(p, ['PromotionID', 'ID'])).toLowerCase();
      const cust = String(findVal(p, ['TerritoryID', 'Account', 'Customer', 'Planning Account'])).toLowerCase();
      const custName = String(findVal(p, ['TypeName', 'TerritoryName'])).toLowerCase();
      const prod = String(findVal(p, ['ProductID', 'Product'])).toLowerCase();
      const start = String(findVal(p, ['Planned_Start', 'Start'])).toLowerCase();
      const status = String(findVal(p, ['Status'])).toLowerCase();
      const tactic = String(findVal(p, ['Tactic'])).toLowerCase();
      const type = String(findVal(p, ['Type'])).toLowerCase();

      let match = true;
      if (searchCriteria.promotionId && !pid.includes(searchCriteria.promotionId.toLowerCase())) match = false;
      
      if (searchCriteria.customer) {
          const searchCust = searchCriteria.customer.toLowerCase();
          if (!cust.includes(searchCust) && !custName.includes(searchCust)) match = false;
      }
      
      if (searchCriteria.productId && !prod.includes(searchCriteria.productId.toLowerCase())) match = false;
      
      if (searchCriteria.merchStartFrom && !start.includes(searchCriteria.merchStartFrom)) {
         // Simple string match fallback
      }

      if (searchCriteria.status && !status.includes(searchCriteria.status.toLowerCase())) match = false;
      if (searchCriteria.tactic && !tactic.includes(searchCriteria.tactic.toLowerCase())) match = false;

      return match;
    });

    // Deduplicate by ID for display list
    const uniqueMap = new Map();
    results.forEach(p => {
        const id = String(findVal(p, ['PromotionID', 'ID']));
        if (!uniqueMap.has(id)) uniqueMap.set(id, p);
    });

    setSearchResults(Array.from(uniqueMap.values()));
  };

  const handleClear = () => {
    setSearchCriteria({
      promotionId: '', customer: '', productId: '', 
      merchStartFrom: '', merchStartTo: '', 
      shipStartFrom: '', shipStartTo: '', 
      status: '', spendMethod: '', tactic: ''
    });
    setSearchResults([]);
    setSearched(false);
  };

  return (
    <div className="space-y-2 bg-slate-50 min-h-screen p-4 font-sans text-xs">
      {/* Header */}
      <div className="bg-[#dcebf9] border-b border-[#a6c4df] px-4 py-2 flex justify-between items-center mb-2 rounded-t-md">
        <div>
            <h1 className="text-lg font-bold text-slate-900 italic flex items-center gap-2">
                Search: Trade Promotions
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
            {/* Row 1: Promotion ID */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Trade Promotion ID</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <input type="text" value={searchCriteria.promotionId} onChange={e => setSearchCriteria({...searchCriteria, promotionId: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-1/2 bg-white" />
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 2: Customer */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Customer</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <input type="text" value={searchCriteria.customer} onChange={e => setSearchCriteria({...searchCriteria, customer: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-1/2 bg-white" />
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 3: Product ID */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Product ID</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <div className="relative w-1/2">
                        <input type="text" value={searchCriteria.productId} onChange={e => setSearchCriteria({...searchCriteria, productId: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-full bg-white" />
                        <Copy className="w-3 h-3 absolute right-1 top-1 text-slate-400"/>
                    </div>
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 4: Merch Start Date */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Merchandising Start Date</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is between <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center gap-1">
                    <div className="relative w-1/4">
                        <input type="text" value={searchCriteria.merchStartFrom} onChange={e => setSearchCriteria({...searchCriteria, merchStartFrom: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-full bg-white" />
                        <Calendar className="w-3 h-3 absolute right-1 top-1 text-slate-400"/>
                    </div>
                    <span className="text-xs">and</span>
                    <div className="relative w-1/4">
                        <input type="text" value={searchCriteria.merchStartTo} onChange={e => setSearchCriteria({...searchCriteria, merchStartTo: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-full bg-white" />
                        <Calendar className="w-3 h-3 absolute right-1 top-1 text-slate-400"/>
                    </div>
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 5: Ship/Pricing Start Date */}
            <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Ship/Pricing Start Date</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is between <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center gap-1">
                    <div className="relative w-1/4">
                        <input type="text" value={searchCriteria.shipStartFrom} onChange={e => setSearchCriteria({...searchCriteria, shipStartFrom: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-full bg-white" />
                        <Calendar className="w-3 h-3 absolute right-1 top-1 text-slate-400"/>
                    </div>
                    <span className="text-xs">and</span>
                    <div className="relative w-1/4">
                        <input type="text" value={searchCriteria.shipStartTo} onChange={e => setSearchCriteria({...searchCriteria, shipStartTo: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-full bg-white" />
                        <Calendar className="w-3 h-3 absolute right-1 top-1 text-slate-400"/>
                    </div>
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

             {/* Row 6: Promo Status */}
             <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Promo Status</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <input type="text" value={searchCriteria.status} onChange={e => setSearchCriteria({...searchCriteria, status: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-1/2 bg-white" />
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 7: Spend Method */}
             <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Spend Method</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <input type="text" value={searchCriteria.spendMethod} onChange={e => setSearchCriteria({...searchCriteria, spendMethod: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-1/2 bg-white" />
                    <div className="flex gap-1 ml-1"><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">+</div><div className="w-4 h-4 bg-[#dee6ef] rounded-full flex items-center justify-center text-[10px] border border-slate-300 cursor-pointer">-</div></div>
                </div>
            </div>

            {/* Row 8: Promo Tactic */}
             <div className="flex items-center">
                <label className="text-xs text-right font-medium w-40 pr-2">Promo Tactic</label>
                <div className="bg-white border border-slate-300 px-1 text-xs flex items-center justify-between w-24 h-5 mr-1">is <ChevronDown className="w-3 h-3"/></div>
                <div className="flex-1 flex items-center">
                    <input type="text" value={searchCriteria.tactic} onChange={e => setSearchCriteria({...searchCriteria, tactic: e.target.value})} className="border border-slate-300 px-2 h-5 text-xs w-1/2 bg-white" />
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
            <div className="flex items-center gap-1 text-xs text-slate-600">
                <input type="checkbox" className="rounded-none border-slate-300 w-3 h-3"/> Include View
            </div>
             <button className="bg-[#f6e59d] border border-[#dcc982] text-xs px-2 py-0.5 hover:bg-[#eedb8d] font-normal text-slate-800 shadow-sm rounded-sm flex items-center gap-1">
                <SaveIcon className="w-3 h-3" /> Save
            </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="mt-2">
        <div className="bg-[#e8eef7] px-2 py-1 border border-[#b0cce5] flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800">Result List: {searchResults.length > 0 ? `More Than ${searchResults.length} Trade Promotions Found` : 'No Trade Promotions Found'}</h3>
        </div>
        
        <div className="bg-[#e3e9f1] p-1 border-x border-b border-[#b0cce5] flex gap-2 mb-0 items-center">
             <button className="flex items-center gap-1 bg-white border border-slate-400 px-2 py-0.5 text-[11px] rounded-sm shadow-sm hover:bg-slate-50"><div className="text-yellow-500 font-bold">New</div></button>
             <button className="flex items-center gap-1 bg-white border border-slate-400 px-2 py-0.5 text-[11px] rounded-sm shadow-sm hover:bg-slate-50 text-slate-400"><Trash2 className="w-3 h-3" /></button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <button className="text-[11px] hover:underline text-slate-700">Expand All</button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <button className="text-[11px] hover:underline text-slate-700">Collapse All</button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <button className="text-[11px] hover:underline text-slate-400">Mass Change</button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <button className="text-[11px] hover:underline text-slate-400">Mass Copy</button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <button className="text-[11px] hover:underline text-slate-400">Versions</button>
             <div className="w-px bg-slate-400 mx-1 h-4"></div>
             <button className="text-[11px] hover:underline text-slate-700 flex items-center">More <ChevronDown className="w-3 h-3 ml-1"/></button>
             <div className="flex-1"></div>
             <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-600">Filter:</span>
                <input type="text" className="border border-slate-300 h-5 w-32 bg-white" />
                <div className="flex gap-1">
                    <Layout className="w-4 h-4 text-slate-500 cursor-pointer"/>
                    <div className="w-4 h-4 bg-slate-300 flex items-center justify-center text-[10px] cursor-pointer border border-slate-400">x</div>
                </div>
             </div>
        </div>

        <div className="overflow-x-auto border border-[#b0cce5] border-t-0 bg-white">
            <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#ebf2f9] text-slate-700">
                    <tr>
                        <th className="w-6 px-1 border-r border-b border-[#b0cce5] text-center"><div className="w-3 h-3 border border-slate-400 bg-white inline-block"></div></th>
                        <th className="w-6 px-1 border-r border-b border-[#b0cce5]"></th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Promotion ID</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Promotion Description</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Planning Account</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Date Approved</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Merch Start...</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Merch End ...</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Status</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Created By</th>
                        <th className="px-2 py-1 border-r border-b border-[#b0cce5] bg-[#ebf2f9]">Tactic</th>
                        <th className="px-2 py-1 border-b border-[#b0cce5] bg-[#ebf2f9]">Promotion Type</th>
                    </tr>
                </thead>
                <tbody>
                    {searchResults.length === 0 ? (
                        <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-400 italic">No result found</td></tr>
                    ) : (
                        searchResults.map((p, idx) => (
                            <tr key={idx} className="hover:bg-[#fff8c0] border-b border-slate-100 cursor-default even:bg-[#f5f9fd]">
                                <td className="px-1 text-center border-r border-slate-200"><div className="w-3 h-3 border border-slate-400 bg-white inline-block"></div></td>
                                <td className="px-1 text-center border-r border-slate-200"><ChevronRight className="w-3 h-3 text-slate-500" /></td>
                                <td 
                                    className="px-2 py-1 border-r border-slate-200 text-blue-600 hover:underline cursor-pointer"
                                    onClick={() => navigate(`/trade-promotion/${findVal(p, ['PromotionID', 'ID'])}`)}
                                >
                                    {findVal(p, ['PromotionID', 'ID'])}
                                </td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['PromotionName', 'Name'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['TerritoryID', 'TypeName'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['CreatedDate'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['Planned_Start'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['Planned_Finish'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['Status'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['CreatedBy'])}</td>
                                <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['Tactic'])}</td>
                                <td className="px-2 py-1 border-slate-200">{findVal(p, ['Type', 'Promotion Type'])}</td>
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

export default TradePromotion;

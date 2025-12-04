
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SAP_DB } from '../services/sapDatabase';
import { ArrowLeft, Save, X, Edit, Calendar, DollarSign, Trash2, Copy, FileText, Layout, ChevronDown } from 'lucide-react';

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

const PromotionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [headerData, setHeaderData] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [spendDetails, setSpendDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // 1. ZPROMOTION contains multiple rows for a single Promotion ID (one per product)
      const allRows = SAP_DB.ZPROMOTION.filter(row => 
        String(findVal(row, ['PromotionID', 'ID'])).toLowerCase() === id.toLowerCase()
      );

      if (allRows.length > 0) {
        setHeaderData(allRows[0]);
        setProducts(allRows);
      }

      // 2. Fetch Spend Details from ZPROMOSPEND
      const spendRows = SAP_DB.ZPROMOSPEND.filter(row => 
        String(findVal(row, ['PromotionID'])).toLowerCase() === id.toLowerCase()
      );
      setSpendDetails(spendRows);

      setLoading(false);
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading promotion details...</div>;
  if (!headerData || Object.keys(headerData).length === 0) return <div className="p-8 text-center text-slate-500">Promotion {id} not found.</div>;

  // Safe getters
  const get = (keys: string[]) => findVal(headerData, keys);
  const fmtNum = (val: string) => {
      if (!val) return '0.00';
      const num = parseFloat(val.replace(/,/g, ''));
      return isNaN(num) ? '0.00' : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateProductSpend = (spendItem: any, totalProducts: number): number => {
      const rateStr = findVal(spendItem, ['Spend_Rate']);
      const rate = parseFloat(rateStr.replace(/,/g, '')) || 0;
      const typeDesc = (findVal(spendItem, ['Spend_type_desc']) || findVal(spendItem, ['Spend_type'])).toLowerCase();
      
      // If 'fixed' is in the description (e.g. 'Fixed'), divide by product count
      // Otherwise (e.g. 'Count/Recount', 'BillBack'), use the rate directly
      if (typeDesc.includes('fixed')) {
          return totalProducts > 0 ? rate / totalProducts : 0;
      }
      return rate;
  };

  const labelClass = "text-right text-slate-600 font-medium whitespace-nowrap";
  const valueClass = "text-slate-900 font-medium truncate text-[11px]";
  const linkClass = "text-blue-600 hover:underline cursor-pointer font-medium truncate text-[11px]";

  return (
    <div className="flex flex-col h-full bg-slate-100 text-[11px] font-sans">
      {/* 1. Blue Header */}
      <div className="bg-[#8cbae1] px-2 py-1 flex justify-between items-center shadow-sm shrink-0 border-b border-slate-400">
        <div className="font-bold text-sm text-black italic">
          Trade Promotion: {get(['PromotionID', 'ID'])}, {get(['PromotionName', 'Name'])}
        </div>
        <div className="flex gap-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs bg-white/40 hover:bg-white/60 px-2 py-0.5 rounded border border-slate-400 transition-colors text-slate-800">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="bg-[#f0f0f0] border-b border-slate-300 px-2 py-1 flex items-center gap-1 shrink-0">
        <button disabled className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border border-transparent text-slate-400 cursor-not-allowed">
          <Save className="w-3 h-3" /> Save
        </button>
        <div className="w-px h-3 bg-slate-300 mx-1"></div>
        <button disabled className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border border-transparent text-slate-400 cursor-not-allowed">
          <X className="w-3 h-3" /> Cancel
        </button>
        <div className="w-px h-3 bg-slate-300 mx-1"></div>
        <div className="flex gap-1">
           <button className="px-2 py-0.5 hover:bg-slate-200 rounded flex items-center gap-1 text-[11px] text-slate-700"><FileText className="w-3 h-3 text-yellow-600"/> New</button>
           <button className="px-2 py-0.5 hover:bg-slate-200 rounded"><Trash2 className="w-3 h-3 text-slate-600"/></button>
           <button className="px-2 py-0.5 hover:bg-slate-200 rounded"><Copy className="w-3 h-3 text-slate-600"/></button>
        </div>
         <div className="w-px h-3 bg-slate-300 mx-1"></div>
         <span className="text-[11px] text-slate-500 cursor-default">Background Approve</span>
         <span className="text-[11px] text-slate-500 ml-2 cursor-default">Balance</span>
      </div>

      {/* 3. Main Content */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        
        {/* Trade Promotion Details Header */}
        <div className="bg-white border border-[#a6c4df]">
             <div className="bg-[#dcebf9] px-2 py-1 border-b border-[#a6c4df] flex items-center gap-1">
                 <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-600"></div>
                 <span className="font-bold text-slate-800 text-xs">Trade Promotion Details</span>
            </div>
            
            <div className="bg-[#eef3f8] p-3 relative">
                 <button className="absolute top-2 left-2 flex items-center gap-1 bg-[#f6e59d] border border-[#dcc982] text-[11px] px-2 py-0.5 rounded-sm shadow-sm hover:bg-[#eedb8d] text-slate-800 z-10">
                    <Edit className="w-3 h-3" /> Edit
                </button>

                {/* 6 Column Grid for Layout */}
                <div className="grid grid-cols-[85px_1fr_90px_1fr_80px_1fr] gap-x-2 gap-y-1 items-center pt-8 lg:pt-0">
                    
                    {/* Row 1 */}
                    <div className={labelClass}>Description:</div>
                    <div className={valueClass}>{get(['PromotionName', 'Name', 'Description'])}</div>

                    <div className={labelClass}>Current Status:</div>
                    <div className={valueClass}>{get(['Status'])}</div>

                    <div className={labelClass}>New Status:</div>
                    <div className={valueClass}><input type="text" disabled className="w-full h-5 border border-slate-300 bg-white px-1 shadow-sm"/></div>

                    {/* Row 2 */}
                    <div className={labelClass}>Territory:</div>
                    <div><a className={linkClass}>{get(['TerritoryID'])}</a></div>

                    <div className={labelClass}>Created on:</div>
                    <div className={valueClass}>{get(['CreatedDate', 'Date Approved'])}</div>

                    <div className={labelClass}>Executed On:</div>
                    <div className={valueClass}>{get(['ExecuteDate', 'Start'])}</div>

                    {/* Row 3 - Left Empty */}
                    <div className="col-span-2"></div>

                    <div className={labelClass}>Created By:</div>
                    <div><a className={linkClass}>{get(['CreatedBy'])}</a></div>

                    <div className={labelClass}>Changed on:</div>
                    <div className={valueClass}>{get(['ChangedDate', 'Finish'])}</div>

                    {/* Row 4 */}
                    <div className={labelClass}>Type:</div>
                    <div className={valueClass}>Direct Account</div>

                    <div className={labelClass}>Funds Plan ID:</div>
                    <div className="flex items-center gap-2 col-span-3">
                         <a className={linkClass}>{get(['FundPlanID'])}</a>
                         <span className={valueClass}>{get(['FundPlanName']) || '2025 Base Fund (Not For Slotting)'}</span>
                    </div>

                    {/* Row 5 */}
                    <div className={labelClass}>Tactic:</div>
                    <div className={`${valueClass} col-span-5`}>{get(['Tactic'])}</div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Promotion Dates */}
            <div className="flex-1 border border-[#a6c4df] bg-[#ebf2f9] flex flex-col">
                <div className="bg-white px-2 py-1 border-b border-[#a6c4df] flex justify-between items-center shadow-sm rounded-t-sm">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-xs"><Calendar className="w-3 h-3" /> Promotion Dates</span>
                </div>
                <div className="p-1">
                    <div className="flex gap-1 mb-1">
                        <button className="bg-[#f6e59d] border border-[#dcc982] text-[10px] px-2 py-0.5 rounded-sm hover:bg-[#eedb8d] text-slate-800">Edit List</button>
                        <div className="flex-1 text-right text-[10px] flex items-center justify-end gap-1 text-slate-600">
                            Filter: <input type="text" className="border border-slate-300 w-20 h-4 bg-white px-1"/>
                            <Layout className="w-3 h-3 text-green-600 cursor-pointer"/>
                            <Edit className="w-3 h-3 text-yellow-600 cursor-pointer"/>
                        </div>
                    </div>
                    <table className="w-full text-[11px] text-left border-collapse bg-white border border-slate-300">
                        <thead className="bg-[#e3e9f1]">
                            <tr>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-slate-700">Date</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-slate-700">Start Date</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-slate-700">End Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="px-1 py-0.5 border border-slate-200">Merchandising Date</td>
                                <td className="px-1 py-0.5 border border-slate-200">{get(['Planned_Start', 'Start'])}</td>
                                <td className="px-1 py-0.5 border border-slate-200">{get(['Planned_Finish', 'End'])}</td>
                            </tr>
                             <tr>
                                <td className="px-1 py-0.5 border border-slate-200">Ship/ Pricing Date</td>
                                <td className="px-1 py-0.5 border border-slate-200">{get(['Planned_Start'])}</td>
                                <td className="px-1 py-0.5 border border-slate-200">{get(['Planned_Finish'])}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Spend Details */}
            <div className="flex-1 border border-[#a6c4df] bg-[#ebf2f9] flex flex-col">
                <div className="bg-white px-2 py-1 border-b border-[#a6c4df] flex justify-between items-center shadow-sm rounded-t-sm">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-xs"><DollarSign className="w-3 h-3" /> Spend Details</span>
                </div>
                 <div className="p-1">
                    <div className="flex gap-1 mb-1">
                        <button className="bg-[#f6e59d] border border-[#dcc982] text-[10px] px-2 py-0.5 rounded-sm hover:bg-[#eedb8d] text-slate-800">Edit List</button>
                        <button className="bg-[#f6e59d] border border-[#dcc982] text-[10px] px-2 py-0.5 rounded-sm hover:bg-[#eedb8d] text-slate-800">Planning</button>
                         <div className="flex-1 text-right text-[10px] flex items-center justify-end gap-1 text-slate-600">
                            Filter: <input type="text" className="border border-slate-300 w-20 h-4 bg-white px-1"/>
                            <Layout className="w-3 h-3 text-green-600 cursor-pointer"/>
                            <Edit className="w-3 h-3 text-yellow-600 cursor-pointer"/>
                        </div>
                    </div>
                    <table className="w-full text-[11px] text-left border-collapse bg-white border border-slate-300">
                        <thead className="bg-[#e3e9f1]">
                            <tr>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-slate-700">Actions</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-slate-700">Spend Method</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-slate-700 text-right">Spend Value</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-slate-700 text-center">Exceptions</th>
                            </tr>
                        </thead>
                        <tbody>
                             {spendDetails.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-1 py-4 text-center text-slate-400 italic border border-slate-200">
                                        No spend details found.
                                    </td>
                                </tr>
                             ) : (
                                spendDetails.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-1 py-0.5 border border-slate-200 text-center"><Trash2 className="w-3 h-3 text-slate-500 inline-block cursor-pointer hover:text-red-500"/></td>
                                        <td className="px-1 py-0.5 border border-slate-200">{findVal(item, ['Spend_type_desc']) || findVal(item, ['Spend_type'])}</td>
                                        <td className="px-1 py-0.5 border border-slate-200 text-right">{fmtNum(findVal(item, ['Spend_Rate']))}</td>
                                        <td className="px-1 py-0.5 border border-slate-200 text-center"><input type="checkbox" disabled className="w-3 h-3"/></td>
                                    </tr>
                                ))
                             )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Volume & Spend Summary */}
            <div className="flex-[0.8] border border-[#a6c4df] bg-[#ebf2f9] flex flex-col">
                <div className="bg-white px-2 py-1 border-b border-[#a6c4df] flex justify-between items-center shadow-sm rounded-t-sm">
                    <span className="font-bold text-slate-800 text-xs">Volume & Spend Summary</span>
                </div>
                <div className="p-1 grid grid-cols-2 gap-4 text-[11px]">
                    <div>
                        <div className="font-bold text-center mb-1 border-b border-slate-300 pb-0.5 text-slate-800">Planned Volume</div>
                        <div className="grid grid-cols-[60px_1fr_20px] gap-1 items-center mt-1">
                            <span className="text-slate-600 text-right">Bill Back:</span>
                            <span></span>
                            <span></span>
                        </div>
                         <div className="grid grid-cols-[60px_1fr_20px] gap-1 items-center">
                            <span className="text-slate-600 text-right">Off Invo...</span>
                            <span></span>
                            <span></span>
                        </div>
                         <div className="grid grid-cols-[60px_1fr_20px] gap-1 items-center">
                            <span className="text-slate-600 text-right">Scan/C...</span>
                            <span className="text-right font-mono">{fmtNum(get(['ScanVolume']))}</span>
                            <span className="text-slate-500">CS</span>
                        </div>
                         <div className="grid grid-cols-[60px_1fr_20px] gap-1 items-center">
                            <span className="text-slate-600 text-right">Promot...</span>
                            <span className="text-right font-mono">{fmtNum(get(['0INV_QTY']))}</span>
                            <span className="text-slate-500">CS</span>
                        </div>
                         <div className="grid grid-cols-[60px_1fr_20px] gap-1 items-center border-t border-slate-200 mt-1 pt-1">
                            <span className="text-slate-600 text-right">Total Vo...</span>
                            <span className="text-right font-bold font-mono">{fmtNum(get(['0UPLI_QTYS']))}</span>
                            <span className="text-slate-500">CS</span>
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-center mb-1 border-b border-slate-300 pb-0.5 text-slate-800">Planned Spend</div>
                        <div className="grid grid-cols-[50px_1fr_30px] gap-1 items-center mt-1">
                            <span className="text-slate-600 text-right">Planne...</span>
                            <span className="text-right font-mono">{fmtNum(get(['Planned_Spend']))}</span>
                            <span className="text-slate-500">USD</span>
                        </div>
                         <div className="grid grid-cols-[50px_1fr_30px] gap-1 items-center">
                            <span className="text-slate-600 text-right">Net Rev:</span>
                            <span></span>
                            <span></span>
                        </div>
                         <div className="grid grid-cols-[50px_1fr_30px] gap-1 items-center">
                            <span className="text-slate-600 text-right">Gross ...</span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Products Table */}
        <div className="bg-[#ebf2f9] border border-[#a6c4df] flex flex-col">
            <div className="bg-white px-2 py-1 border-b border-[#a6c4df] flex justify-between items-center shadow-sm rounded-t-sm">
                <span className="font-bold text-slate-800 text-xs">Products & Exceptions</span>
            </div>
            <div className="p-1">
                 <div className="flex gap-1 mb-1">
                        <button className="bg-[#f6e59d] border border-[#dcc982] text-[10px] px-2 py-0.5 rounded-sm hover:bg-[#eedb8d] text-slate-800">Edit List</button>
                         <div className="flex-1 text-right text-[10px] flex items-center justify-end gap-1 text-slate-600">
                            Filter: <input type="text" className="border border-slate-300 w-20 h-4 bg-white px-1"/>
                            <Layout className="w-3 h-3 text-green-600 cursor-pointer"/>
                            <Edit className="w-3 h-3 text-yellow-600 cursor-pointer"/>
                        </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse bg-white border border-slate-300">
                        <thead className="bg-[#e3e9f1] text-slate-700">
                            <tr>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal w-16 text-center">Actions</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal">Product ID</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal">Product</th>
                                <th className="px-1 py-0.5 border border-slate-300 font-normal text-center w-10">Unit</th>
                                {/* Dynamic Spend Columns based on Spend Details */}
                                {spendDetails.map((sd, i) => (
                                    <th key={i} className="px-1 py-0.5 border border-slate-300 font-normal text-right">
                                        {findVal(sd, ['Spend_type_desc']) || findVal(sd, ['Spend_type'])}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-1 py-0.5 border-r border-slate-200 flex gap-1 justify-center">
                                        <Trash2 className="w-3 h-3 text-slate-500 cursor-pointer hover:text-red-500"/>
                                        <Edit className="w-3 h-3 text-slate-500 cursor-pointer hover:text-blue-500"/>
                                    </td>
                                    <td className="px-1 py-0.5 border-r border-slate-200 text-blue-600 hover:underline cursor-pointer">{findVal(p, ['ProductID', 'Product', 'Material'])}</td>
                                    <td className="px-1 py-0.5 border-r border-slate-200">{findVal(p, ['Description', 'Product Description'])}</td>
                                    <td className="px-1 py-0.5 border-r border-slate-200 text-center">CS</td>
                                    {/* Dynamic Calculated Values */}
                                    {spendDetails.map((sd, i) => (
                                        <td key={i} className="px-1 py-0.5 border-r border-slate-200 text-right font-mono">
                                            {calculateProductSpend(sd, products.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PromotionDetail;

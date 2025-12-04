
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SAP_DB } from '../services/sapDatabase';
import { ArrowLeft, Save, X, FileText, Edit, Search, CheckSquare, Square, Plus, Trash2, Layout } from 'lucide-react';

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

// Normalize ID: Remove leading zeros and trim
const normalizeId = (val: string | number | undefined): string => {
  if (!val) return '';
  return String(val).trim().replace(/^0+/, '');
};

const DeductionClaimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ extRef: '', checkNo: '' });

  // Create Claim State
  const [isCreateClaimPopupOpen, setIsCreateClaimPopupOpen] = useState(false);
  const [promoSearchTerm, setPromoSearchTerm] = useState('');
  const [promoSearchResults, setPromoSearchResults] = useState<any[]>([]);
  const [selectedPromoIds, setSelectedPromoIds] = useState<Set<string>>(new Set());
  
  // View Claim State
  const [isViewClaimPopupOpen, setIsViewClaimPopupOpen] = useState(false);
  const [selectedClaimForView, setSelectedClaimForView] = useState<any[]>([]);
  const [viewClaimId, setViewClaimId] = useState('');

  // Resolution State (Selected Promotions for Claim)
  const [resolutionItems, setResolutionItems] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]); // Created Claims (Local view state)

  const refreshClaims = (targetId: string) => {
      // Filter ZCLAIM by DisputeCaseID matching the current page's ID
      const existingClaims = SAP_DB.getTable('ZCLAIM').filter(c => {
          const dbCaseId = c.DisputeCaseID || c.disputeCaseId || c['Dispute Case ID']; 
          return normalizeId(dbCaseId) === targetId;
      });
      
      // Aggregate by ClaimID for display in the documents table
      const aggregatedClaims = new Map<string, any>();
      
      existingClaims.forEach(c => {
          const cId = c.ClaimID || c.id;
          if (!aggregatedClaims.has(cId)) {
              aggregatedClaims.set(cId, {
                  id: cId,
                  type: 'Deduction Claim',
                  amount: 0,
                  currency: c.Currency || 'USD',
                  employee: c.Employee || 'Erika Cox', 
                  status: c.Status || 'Approved',
                  createdOn: c.CreatedOn
              });
          }
          const claim = aggregatedClaims.get(cId);
          claim.amount += parseFloat(c.Validated || 0);
      });

      setClaims(Array.from(aggregatedClaims.values()));
  };

  // Load Data
  useEffect(() => {
    if (id) {
      const targetId = normalizeId(id);
      
      // 1. Load Dispute Case Data
      const found = SAP_DB.ZDISPUTE.find(row => {
        const rowIdRaw = findVal(row, ['EXT_KEY', 'Dispute Case ID', 'Case ID']);
        return normalizeId(rowIdRaw) === targetId;
      });
      
      if (found) {
        setData(found);
        setEditData({
          extRef: findVal(found, ['EXT_REF', 'External Ref']) || '',
          checkNo: findVal(found, ['ZZCHECK_NUMBER', 'Check No']) || ''
        });
      }

      // 2. Load Existing Claims
      refreshClaims(targetId);
    }
  }, [id]); 

  const handleSave = () => {
    if (!data) return;
    
    // 1. Save Edit Data (Header)
    if (isEditing) {
      const targetId = normalizeId(id);
      const rowIdx = SAP_DB.ZDISPUTE.findIndex(row => normalizeId(findVal(row, ['EXT_KEY'])) === targetId);
      if (rowIdx >= 0) {
        const updatedRow = { ...SAP_DB.ZDISPUTE[rowIdx] };
        const extKey = Object.keys(updatedRow).find(k => k.toLowerCase().includes('ext_ref')) || 'EXT_REF';
        const checkKey = Object.keys(updatedRow).find(k => k.toLowerCase().includes('check')) || 'ZZCHECK_NUMBER';
        updatedRow[extKey] = editData.extRef;
        updatedRow[checkKey] = editData.checkNo;
        SAP_DB.ZDISPUTE[rowIdx] = updatedRow;
        setData(updatedRow);
      }
      setIsEditing(false);
    }

    // 2. Save Claim Creation (Resolution)
    if (resolutionItems.length > 0) {
        const itemsToSave = resolutionItems.filter(item => {
            const val = parseFloat(item.validatedAmount);
            return !isNaN(val) && val > 0;
        });

        if (itemsToSave.length > 0) {
            const existingClaims = SAP_DB.getTable('ZCLAIM') || [];
            let lastId = 300000;
            existingClaims.forEach(c => {
                const currentId = parseInt(c.ClaimID || c.id);
                if (!isNaN(currentId) && currentId > lastId) lastId = currentId;
            });
            const newClaimId = String(lastId + 1);
            const currentDisputeId = getField(['EXT_KEY', 'Dispute Case ID']) || id;

            const newClaimRecords: any[] = [];
            itemsToSave.forEach(item => {
                newClaimRecords.push({
                    ClaimID: newClaimId,
                    DisputeCaseID: currentDisputeId,
                    ProductID: item.productId,
                    PromotionID: item.promotionId,
                    Validated: item.validatedAmount,
                    Comment: item.comment,
                    Currency: 'USD',
                    Status: 'Approved',
                    CreatedOn: new Date().toISOString().split('T')[0],
                    Employee: 'Erika Cox'
                });
            });
            SAP_DB.insertRows('ZCLAIM', newClaimRecords);
            if (id) refreshClaims(normalizeId(id));
            setResolutionItems([]); 
            alert(`Claim ${newClaimId} created successfully!`);
        } else {
            alert("No valid items to save (Validated amount must be greater than 0).");
        }
    } else if (isEditing) {
        alert("Changes saved successfully.");
    }
  };

  const handleCancel = () => {
    setEditData({
      extRef: findVal(data, ['EXT_REF', 'External Ref']) || '',
      checkNo: findVal(data, ['ZZCHECK_NUMBER', 'Check No']) || ''
    });
    setIsEditing(false);
    setResolutionItems([]);
  };
  
  const handleDeleteClaim = (claimId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to delete Claim ${claimId}?`)) {
          SAP_DB.ZCLAIM = SAP_DB.ZCLAIM.filter(c => c.ClaimID !== claimId);
          if (id) refreshClaims(normalizeId(id));
      }
  };

  const handleViewClaim = (claimId: string) => {
      const allClaims = SAP_DB.getTable('ZCLAIM');
      const items = allClaims.filter(c => c.ClaimID === claimId);
      if (items.length > 0) {
          setSelectedClaimForView(items);
          setViewClaimId(claimId);
          setIsViewClaimPopupOpen(true);
      }
  };

  // --- Promo Search Handlers ---
  const handlePromoSearch = () => {
    let results = [];
    if (!promoSearchTerm.trim()) {
        results = SAP_DB.ZPROMOTION; 
    } else {
        results = SAP_DB.ZPROMOTION.filter(p => {
            const pId = String(findVal(p, ['PromotionID', 'ID']) || '').toLowerCase();
            return pId.includes(promoSearchTerm.toLowerCase());
        });
    }

    const uniqueMap = new Map();
    results.forEach(p => {
        const pid = String(findVal(p, ['PromotionID', 'ID']));
        if (pid && !uniqueMap.has(pid)) {
            uniqueMap.set(pid, p);
        }
    });
    
    setPromoSearchResults(Array.from(uniqueMap.values()).slice(0, 100));
  };

  const togglePromoSelection = (promoId: string) => {
      const newSet = new Set(selectedPromoIds);
      if (newSet.has(promoId)) newSet.delete(promoId);
      else newSet.add(promoId);
      setSelectedPromoIds(newSet);
  };

  const handleChoosePromos = () => {
      const allMatchingRows = SAP_DB.ZPROMOTION.filter(p => 
          selectedPromoIds.has(String(findVal(p, ['PromotionID', 'ID'])))
      );

      const items = allMatchingRows.map(p => ({
          promotionId: findVal(p, ['PromotionID', 'ID']),
          promotionName: findVal(p, ['PromotionName', 'Name']),
          productId: findVal(p, ['ProductID', 'Product ID', 'Material']),
          reserved: 0.00,
          settled: 0.00,
          accrualBalance: 0.00,
          validatedAmount: 0.00,
          comment: ''
      }));

      setResolutionItems([...resolutionItems, ...items]);
      setIsCreateClaimPopupOpen(false);
      setSelectedPromoIds(new Set());
      setPromoSearchResults([]);
      setPromoSearchTerm('');
  };

  const handleValidatedChange = (index: number, val: string) => {
      const newItems = [...resolutionItems];
      newItems[index].validatedAmount = val;
      setResolutionItems(newItems);
  };

  const handleCommentChange = (index: number, val: string) => {
      const newItems = [...resolutionItems];
      newItems[index].comment = val;
      setResolutionItems(newItems);
  };

  const getField = (keys: string[]) => findVal(data, keys);
  const fmt = (val: string | number) => {
      if (val === undefined || val === null) return '0.00';
      const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const originalAmtStr = getField(['FIN_ORIGINAL_AMT', 'Requested', 'Amount']);
  const originalAmt = originalAmtStr ? parseFloat(originalAmtStr.replace(/,/g, '')) : 0;
  
  const totalClaimed = claims.reduce((sum, c) => sum + c.amount, 0);
  const currentUnassigned = originalAmt - totalClaimed;
  const currentUnresolved = originalAmt - totalClaimed;
  const currentValidated = totalClaimed;
  const currentSettled = totalClaimed;
  const currentDisputed = originalAmt - totalClaimed;
  const currentCredited = totalClaimed;
  
  const labelClass = "text-right text-slate-600 font-medium whitespace-nowrap text-[11px] pr-2";
  const valueClass = "text-slate-900 font-medium truncate text-[11px]";
  const numberClass = "text-right font-mono text-[11px]";

  return (
    <div className="flex flex-col h-full bg-slate-100 text-[11px] font-sans">
      {/* 1. Header */}
      <div className="bg-[#8cbae1] px-2 py-1 flex justify-between items-center shadow-sm shrink-0 border-b border-slate-400">
        <div className="font-bold text-sm text-black italic">
          Dispute Case: {getField(['EXT_KEY', 'Dispute Case ID']) || id}
        </div>
        <div className="flex gap-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs bg-white/40 hover:bg-white/60 px-2 py-0.5 rounded border border-slate-400 transition-colors text-slate-800">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="bg-[#f0f0f0] border-b border-slate-300 px-2 py-1 flex items-center gap-1 shrink-0">
        <button 
          onClick={handleSave} 
          disabled={!isEditing && resolutionItems.length === 0}
          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border transition-all
            ${(isEditing || resolutionItems.length > 0)
              ? 'text-slate-800 border-slate-400 bg-white hover:bg-slate-50 shadow-sm cursor-pointer' 
              : 'text-slate-400 border-transparent cursor-not-allowed opacity-50'
            }`}
        >
          <Save className="w-3 h-3" /> Save
        </button>
        <div className="w-px h-3 bg-slate-300 mx-1"></div>
        <button 
          onClick={handleCancel}
          disabled={!isEditing && resolutionItems.length === 0}
          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded border transition-all
            ${(isEditing || resolutionItems.length > 0)
              ? 'text-slate-800 border-slate-400 bg-white hover:bg-slate-50 shadow-sm cursor-pointer' 
              : 'text-slate-400 border-transparent cursor-not-allowed opacity-50'
            }`}
        >
          <X className="w-3 h-3" /> Cancel
        </button>
        <div className="h-4 w-px bg-slate-300 mx-1"></div>
        <button 
            onClick={() => setIsCreateClaimPopupOpen(true)}
            className="text-[11px] text-slate-700 hover:text-blue-600 bg-white border border-slate-400 hover:bg-slate-50 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3 h-3" /> Create Claim
        </button>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        <div className="bg-white border border-[#a6c4df]">
          {/* Section Header */}
          <div className="bg-[#dcebf9] px-2 py-1 border-b border-[#a6c4df] flex items-center gap-2">
             <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-600"></div>
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-slate-700 hover:text-blue-600 rounded p-0.5 transition-colors absolute right-2"
              title="Edit Details"
            >
              <Edit className="w-3 h-3" />
            </button>
            <span className="font-bold text-slate-800 text-xs">Claim Submission Details</span>
          </div>

          <div className="bg-[#eef3f8] p-3 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 mb-1 border-b border-slate-300 pb-0.5">General Data</h4>
                <div className="grid grid-cols-[120px_1fr] gap-1 items-center">
                  <label className={labelClass}>Claiming Account:</label>
                  <div className="text-blue-600 hover:underline cursor-pointer text-[11px]">
                    {getField(['FIN_KUNNR', 'Claiming Account']) || '-'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-800 mb-1 border-b border-slate-300 pb-0.5">StarKist Dispute Case Detail</h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-[120px_1fr] gap-1 items-center">
                    <label className={labelClass}>Dispute Case ID:</label>
                    <div className="flex items-center gap-4">
                      <span className={valueClass}>{getField(['EXT_KEY', 'Dispute Case ID']) || id}</span>
                      <span className="text-[10px] text-slate-500">{getField(['CREATED_BY', 'Employee']) || ''}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[120px_1fr] gap-1 items-center">
                    <label className={labelClass}>External Ref:</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editData.extRef}
                        onChange={(e) => setEditData({...editData, extRef: e.target.value})}
                        className="text-[11px] border border-slate-400 px-1 py-0.5 w-full max-w-[200px] bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <span className={valueClass}>{getField(['EXT_REF', 'External Ref']) || '-'}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-1 items-center">
                    <label className={labelClass}>Check No:</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editData.checkNo}
                        onChange={(e) => setEditData({...editData, checkNo: e.target.value})}
                        className="text-[11px] border border-slate-400 px-1 py-0.5 w-full max-w-[200px] bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <span className={valueClass}>{getField(['ZZCHECK_NUMBER', 'Check No']) || '-'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-800 mb-1 border-b border-slate-300 pb-0.5">Status</h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-[120px_1fr] gap-1 items-center">
                    <label className={labelClass}>Current Status:</label>
                    <span className={valueClass}>Open</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-1 items-center">
                    <label className={labelClass}>New Status:</label>
                    <input type="text" className="border border-slate-300 px-1 py-0.5 text-[11px] w-full max-w-[150px] bg-white shadow-sm" disabled />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Amounts */}
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 mb-1 border-b border-slate-300 pb-0.5">Amounts</h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Unassigned Amount :</label>
                    <span className={`${numberClass} font-bold text-slate-900 w-24`}>{fmt(currentUnassigned)}</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Unresolved Amount :</label>
                    <span className={`${numberClass} font-bold text-slate-900 w-24`}>{fmt(currentUnresolved)}</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Validated :</label>
                    <span className={`${numberClass} w-24`}>{fmt(currentValidated)}</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Rejected :</label>
                    <span className={`${numberClass} w-24`}>0.00</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Settled :</label>
                    <span className={`${numberClass} w-24`}>{fmt(currentSettled)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-800 mb-1 border-b border-slate-300 pb-0.5">Amounts from Dispute Case</h4>
                <div className="space-y-1">
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Requested :</label>
                    <span className={`${numberClass} font-bold text-slate-900 w-24`}>{fmt(originalAmt)}</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Disputed :</label>
                    <span className={`${numberClass} font-bold text-slate-900 w-24`}>{fmt(currentDisputed)}</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Paid :</label>
                    <span className={`${numberClass} w-24`}>0.00</span>
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-1 items-center">
                    <label className={labelClass}>Credited :</label>
                    <span className={`${numberClass} w-24`}>{fmt(currentCredited)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Section (Visible after Choose) */}
        {resolutionItems.length > 0 && (
            <div className="bg-white border border-[#a6c4df] mb-4">
                <div className="bg-[#dcebf9] px-2 py-1 border-b border-[#a6c4df]">
                    <span className="text-xs font-bold text-slate-800">Resolution</span>
                </div>
                <div className="overflow-x-auto bg-[#eef3f8]">
                    <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-[#e3e9f1] text-slate-700">
                            <tr>
                                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">PromotionID</th>
                                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Promotion Name</th>
                                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Product ID</th>
                                <th className="px-2 py-1 font-normal border-r border-[#b0cce5] text-right">Reserved</th>
                                <th className="px-2 py-1 font-normal border-r border-[#b0cce5] text-right">Settled</th>
                                <th className="px-2 py-1 font-normal border-r border-[#b0cce5] text-right">Accrual Bal...</th>
                                <th className="px-2 py-1 font-normal border-r border-[#b0cce5] text-right">Validated</th>
                                <th className="px-2 py-1 font-normal">Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resolutionItems.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-200 hover:bg-[#fff8c0] bg-white">
                                    <td className="px-2 py-1 border-r border-slate-200 text-blue-600">{item.promotionId}</td>
                                    <td className="px-2 py-1 border-r border-slate-200">{item.promotionName}</td>
                                    <td className="px-2 py-1 border-r border-slate-200">{item.productId}</td>
                                    <td className="px-2 py-1 border-r border-slate-200 text-right font-mono">0.00</td>
                                    <td className="px-2 py-1 border-r border-slate-200 text-right font-mono">0.00</td>
                                    <td className="px-2 py-1 border-r border-slate-200 text-right font-mono">0.00</td>
                                    <td className="px-2 py-1 border-r border-slate-200 text-right">
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="border border-slate-300 px-1 py-0.5 text-right w-20 text-[11px]"
                                            value={item.validatedAmount}
                                            onChange={(e) => handleValidatedChange(idx, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <input 
                                            type="text" 
                                            className="border border-slate-300 px-1 py-0.5 w-full text-[11px]"
                                            value={item.comment}
                                            onChange={(e) => handleCommentChange(idx, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Claim Documents Table */}
        <div className="bg-white border border-[#a6c4df]">
          <div className="bg-[#dcebf9] px-2 py-1 border-b border-[#a6c4df] flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-800">Claim Processing Documents</span>
            </div>
            <div className="flex-1 text-right text-[10px] flex items-center justify-end gap-1 text-slate-600">
                Filter: <input type="text" className="border border-slate-300 w-20 h-4 bg-white px-1"/>
                <Layout className="w-3 h-3 text-green-600 cursor-pointer"/>
            </div>
          </div>
          
          <table className="w-full text-[11px] text-left border-collapse bg-white">
            <thead className="bg-[#e3e9f1] text-slate-700">
              <tr>
                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Claim Type</th>
                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Claim ID</th>
                <th className="px-2 py-1 font-normal border-r border-[#b0cce5] text-right">Claimed Amount</th>
                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Currency</th>
                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Employee Responsible</th>
                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Status</th>
                <th className="px-2 py-1 font-normal border-r border-[#b0cce5]">Created On</th>
                <th className="px-2 py-1 font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr><td colSpan={8} className="px-2 py-4 text-center text-slate-400 italic">No result found</td></tr>
              ) : (
                claims.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-[#fff8c0] even:bg-[#f5f9fd]">
                        <td className="px-2 py-1 border-r border-slate-200">{c.type}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-blue-600 cursor-pointer hover:underline" onClick={() => handleViewClaim(c.id)}>{c.id}</td>
                        <td className="px-2 py-1 border-r border-slate-200 text-right font-mono">{fmt(c.amount)}</td>
                        <td className="px-2 py-1 border-r border-slate-200">{c.currency}</td>
                        <td className="px-2 py-1 border-r border-slate-200">{c.employee}</td>
                        <td className="px-2 py-1 border-r border-slate-200">{c.status}</td>
                        <td className="px-2 py-1 border-r border-slate-200">{c.createdOn}</td>
                        <td className="px-2 py-1 text-center">
                            <button onClick={(e) => handleDeleteClaim(c.id, e)} className="text-slate-400 hover:text-red-500 p-0.5 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Claim Details Modal */}
      {isViewClaimPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#eef2f8] w-[800px] max-h-[80vh] border border-slate-400 shadow-xl flex flex-col rounded-sm">
            <div className="bg-[#dcebf9] px-2 py-1 flex justify-between items-center border-b border-[#a6c4df]">
              <h3 className="font-bold text-xs text-slate-800">Claim Details: {viewClaimId}</h3>
              <button onClick={() => setIsViewClaimPopupOpen(false)} className="hover:bg-slate-200 p-1 rounded"><X className="w-4 h-4 text-slate-600" /></button>
            </div>
            <div className="p-0 overflow-auto bg-white">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-[#e3e9f1] text-slate-700">
                  <tr>
                    <th className="px-2 py-1 border-r border-[#b0cce5]">Claim ID</th>
                    <th className="px-2 py-1 border-r border-[#b0cce5]">Dispute Case ID</th>
                    <th className="px-2 py-1 border-r border-[#b0cce5]">Promotion ID</th>
                    <th className="px-2 py-1 border-r border-[#b0cce5]">Product ID</th>
                    <th className="px-2 py-1 border-r border-[#b0cce5] text-right">Validated</th>
                    <th className="px-2 py-1">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClaimForView.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-[#fff8c0]">
                      <td className="px-2 py-1 border-r border-slate-200 text-blue-600">{item.ClaimID}</td>
                      <td className="px-2 py-1 border-r border-slate-200">{item.DisputeCaseID}</td>
                      <td className="px-2 py-1 border-r border-slate-200">{item.PromotionID}</td>
                      <td className="px-2 py-1 border-r border-slate-200">{item.ProductID}</td>
                      <td className="px-2 py-1 border-r border-slate-200 text-right font-mono">{fmt(item.Validated)}</td>
                      <td className="px-2 py-1">{item.Comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Search Modal */}
      {isCreateClaimPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-[#eef2f8] w-[800px] max-h-[80vh] border border-slate-400 shadow-xl flex flex-col rounded-sm">
                <div className="bg-white border-b border-slate-300 px-3 py-2 flex justify-between items-center shrink-0">
                    <span className="font-bold text-sm text-slate-800">Add Promotion - Chrome</span>
                    <button onClick={() => setIsCreateClaimPopupOpen(false)} className="hover:bg-slate-200 p-1 rounded"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-4 overflow-auto flex-1 space-y-4">
                    {/* Criteria */}
                    <div className="bg-white border border-slate-300 p-3">
                        <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
                            <h5 className="text-xs font-bold text-slate-700">Search Criteria</h5>
                            <button className="text-[10px] text-blue-600 hover:underline">Hide Search Fields</button>
                        </div>
                        <div className="space-y-2 mb-4">
                            {['Trade Promotion ID', 'Product ID', 'Merchandising Start Date', 'Promo Status', 'Invoice Number', 'Spend Category'].map((label) => (
                                <div key={label} className="grid grid-cols-[140px_40px_1fr_30px] gap-2 items-center">
                                    <label className="text-xs text-right text-slate-700">{label}</label>
                                    <div className="bg-slate-100 border border-slate-300 px-1 text-xs text-center rounded">is</div>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            className="border border-slate-300 px-2 py-0.5 text-xs w-full focus:border-blue-500 outline-none" 
                                            value={label === 'Trade Promotion ID' ? promoSearchTerm : ''}
                                            onChange={e => label === 'Trade Promotion ID' && setPromoSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[10px] hover:bg-slate-300">+</button>
                                        <button className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[10px] hover:bg-slate-300">-</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <button onClick={handlePromoSearch} className="bg-[#f0e0a0] border border-[#d0c080] text-xs px-3 py-1 hover:bg-[#e0d090] font-medium text-slate-800">Search</button>
                                <button onClick={() => {setPromoSearchTerm(''); setPromoSearchResults([]);}} className="bg-[#f0e0a0] border border-[#d0c080] text-xs px-3 py-1 hover:bg-[#e0d090] font-medium text-slate-800">Clear</button>
                            </div>
                            <div className="text-xs text-slate-500">Maximum Number of Results: <input type="text" defaultValue="100" className="border border-slate-300 w-10 text-center" /></div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="bg-white border border-slate-300 p-0">
                        <div className="bg-[#e8eef7] px-2 py-1 border-b border-slate-300 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800">Result List: {promoSearchResults.length} Trade Promotions Found</span>
                            <button onClick={handleChoosePromos} className="bg-white border border-slate-300 text-xs px-2 py-0.5 hover:bg-slate-50">Choose</button>
                        </div>
                        <div className="h-[200px] overflow-auto bg-white">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-[#e3e9f1] text-slate-600 sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="w-8 px-2 py-1 border-r border-[#b0cce5] border-b"></th>
                                        <th className="px-2 py-1 border-r border-[#b0cce5] border-b">Trade Promotion ID</th>
                                        <th className="px-2 py-1 border-r border-[#b0cce5] border-b">Trade Promotion Desc...</th>
                                        <th className="px-2 py-1 border-r border-[#b0cce5] border-b">Planning Account</th>
                                        <th className="px-2 py-1 border-r border-[#b0cce5] border-b">Planned St...</th>
                                        <th className="px-2 py-1 border-r border-[#b0cce5] border-b">Planned En...</th>
                                        <th className="px-2 py-1 border-r border-[#b0cce5] border-b">Status</th>
                                        <th className="px-2 py-1 border-b border-[#b0cce5]">Employee Resp...</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promoSearchResults.length === 0 ? (
                                        <tr><td colSpan={8} className="px-2 py-4 text-center text-slate-400 italic border-b border-slate-100">No result found</td></tr>
                                    ) : (
                                        promoSearchResults.map((p, i) => {
                                            const pid = String(findVal(p, ['PromotionID', 'ID']));
                                            const isSel = selectedPromoIds.has(pid);
                                            return (
                                                <tr key={i} className={`border-b border-slate-100 hover:bg-[#fff8c0] ${isSel ? 'bg-[#fff0a0]' : ''} cursor-default`}>
                                                    <td className="px-2 py-1 text-center border-r border-slate-200" onClick={() => togglePromoSelection(pid)}>
                                                        <div className="w-3 h-3 border border-slate-400 bg-white flex items-center justify-center">
                                                            {isSel && <div className="w-2 h-2 bg-slate-800"></div>}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 border-r border-slate-200">{pid}</td>
                                                    <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['PromotionName', 'Name'])}</td>
                                                    <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['TerritoryID'])}</td>
                                                    <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['Planned_Start'])}</td>
                                                    <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['Planned_Finish'])}</td>
                                                    <td className="px-2 py-1 border-r border-slate-200">{findVal(p, ['Status'])}</td>
                                                    <td className="px-2 py-1">{findVal(p, ['CreatedBy'])}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DeductionClaimDetail;

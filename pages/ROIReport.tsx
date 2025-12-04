
import React, { useState, useMemo, useEffect } from 'react';
import { AIAnalysisResult, PromotionDrillDownResult, PromotionAnalysis, CustomerROIStats, ROIFilterOptions } from '../types';
import { generateROIAnalysis } from '../services/geminiService';
// Call the RFC function
import { SAP_RFC } from '../services/sapFunctions';
import { SAP_DB } from '../services/sapDatabase';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, AlertTriangle, FileText, CheckCircle2, Search, X, Receipt, TrendingUp, Play } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ROIReport: React.FC = () => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const [calculationResults, setCalculationResults] = useState<{ 
    promotions: PromotionAnalysis[], 
    customerStats: CustomerROIStats[] 
  } | null>(null);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedHier2, setSelectedHier2] = useState<string>('all');
  const [selectedHier3, setSelectedHier3] = useState<string>('all');
  const [selectedHier4, setSelectedHier4] = useState<string>('all');

  const [activeFilter, setActiveFilter] = useState<ROIFilterOptions>({ year: 'all' });
  
  // Drill Down State
  const [selectedDrillDownPromo, setSelectedDrillDownPromo] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<PromotionDrillDownResult | null>(null);

  // Get Available Years via RFC
  const availableYears = useMemo(() => SAP_RFC.getAvailableYears(), []);

  // Get Hierarchy Tree via RFC
  const hierarchyTree = useMemo(() => SAP_RFC.getHierarchyTree(), []);

  // Effect to reset child filters when parent changes
  useEffect(() => { setSelectedHier3('all'); setSelectedHier4('all'); }, [selectedHier2]);
  useEffect(() => { setSelectedHier4('all'); }, [selectedHier3]);

  const handleRunAnalysis = () => {
    const filterOptions: ROIFilterOptions = {
      year: selectedYear,
      hier2: selectedHier2 !== 'all' ? selectedHier2 : undefined,
      hier3: selectedHier3 !== 'all' ? selectedHier3 : undefined,
      hier4: selectedHier4 !== 'all' ? selectedHier4 : undefined
    };

    // Call SAP Function Z_CALCULATE_ROI
    const results = SAP_RFC.calculateROI(filterOptions);
    
    setCalculationResults(results);
    setActiveFilter(filterOptions);
    setAnalysis(null);
  };

  const activeFilterLabel = useMemo(() => {
    const parts = [];
    if (activeFilter.year !== 'all') parts.push(`Year: ${activeFilter.year}`);
    if (activeFilter.hier2) parts.push(activeFilter.hier2);
    if (activeFilter.hier3) parts.push(activeFilter.hier3);
    return parts.length > 0 ? parts.join(' | ') : 'All Data';
  }, [activeFilter]);

  const promotions = calculationResults?.promotions || [];
  const customerStats = calculationResults?.customerStats || [];

  const topPromotions = useMemo(() => {
    return [...promotions].sort((a, b) => b.roiPercent - a.roiPercent).slice(0, 10);
  }, [promotions]);

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      // Construct a temporary data object for Gemini since it expects AppState
      // In a real scenario, Gemini service would also be an RFC or handle the DB directly.
      const tempData: any = {
         nielsenData: { rows: SAP_DB.ZNIELSEN, headers: [], fileName: '' },
         promotionData: { rows: SAP_DB.ZPROMOTION, headers: [], fileName: '' },
         fiData: { rows: SAP_DB.ZFIDOC, headers: [], fileName: '' }
      };
      const result = await generateROIAnalysis(tempData, { 
        promotions, 
        customerStats 
      });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleInspect = (promoId: string) => {
    // Call SAP Function Z_GET_PROMOTION_DRILLDOWN
    const results = SAP_RFC.getPromotionDrillDown(promoId);
    setDrillDownData(results);
    setSelectedDrillDownPromo(promoId);
  };

  const closeDrillDown = () => {
    setSelectedDrillDownPromo(null);
    setDrillDownData(null);
  };

  const salesRows = drillDownData?.salesRows || [];
  const spendRows = drillDownData?.spendRows || [];
  const totalIncUnits = salesRows.reduce((sum, r) => sum + r.incrementalUnits, 0);
  const totalMargin = salesRows.reduce((sum, r) => sum + r.grossMargin, 0);
  const totalSpend = spendRows.reduce((sum, r) => sum + r.amount, 0);

  const customerChartData = customerStats.map((c, index) => ({
    name: c.customerName,
    x: c.totalSpend,
    y: c.avgRoiPercent,
    z: c.totalGrossMargin,
    count: c.promotionCount,
    fill: COLORS[index % COLORS.length]
  }));

  const promoChartData = topPromotions.map((p, index) => ({
    name: p.promotionName,
    customerName: p.customerName,
    x: p.finalSpend,
    y: p.roiPercent,
    z: p.grossMargin,
    fill: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const isPromo = d.customerName !== undefined;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm z-50">
          <p className="font-bold text-slate-800 mb-1">{d.name}</p>
          {isPromo && <p className="text-xs text-slate-500 mb-2 font-medium">{d.customerName}</p>}
          <div className="space-y-1 text-slate-600">
            <p>Spend: <span className="font-mono text-indigo-600">${d.x.toLocaleString()}</span></p>
            <p>ROI: <span className={`font-mono ${d.y >= 0 ? 'text-green-600' : 'text-red-500'}`}>{d.y.toFixed(1)}%</span></p>
            <p>Gross Margin: <span className="font-mono text-slate-800">${d.z.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
            {!isPromo && <p className="text-xs text-slate-400 mt-1">{d.count} Promotions</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  const isReady = SAP_DB.isReadyForAnalysis();

  return (
    <div className="space-y-8 relative">
      {selectedDrillDownPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
               <div><h3 className="text-lg font-bold text-slate-900">Promotion Inspection</h3><p className="text-sm text-slate-500 font-mono">{selectedDrillDownPromo}</p></div>
               <button onClick={closeDrillDown} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-8">
               <div>
                 <h4 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4"><TrendingUp className="w-5 h-5 text-green-600" /> 1. Sales & Margin Verification (Nielsen)</h4>
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">Date</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">Customer</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">UPC</th>
                            <th className="px-4 py-2 text-left font-medium text-slate-500">Mapped MATNR</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500">Inc Units</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500">Unit Price</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-500">Inc Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {salesRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 font-mono text-slate-600">{row.date}</td>
                                  <td className="px-4 py-2 text-slate-700">{row.customer}</td>
                                  <td className="px-4 py-2 font-mono text-slate-600">{row.upc}</td>
                                  <td className="px-4 py-2 font-mono text-slate-500">{row.matchedMaterial}</td>
                                  <td className="px-4 py-2 text-right font-bold text-slate-800">{row.incrementalUnits.toLocaleString()}</td>
                                  <td className="px-4 py-2 text-right text-slate-600">${row.unitPrice.toFixed(2)}</td>
                                  <td className="px-4 py-2 text-right text-slate-600">${row.grossMargin.toFixed(0)}</td>
                              </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold">
                           <tr><td colSpan={4} className="px-4 py-2 text-right">Total:</td><td className="px-4 py-2 text-right text-indigo-600">{totalIncUnits.toLocaleString()}</td><td></td><td className="px-4 py-2 text-right text-green-600">${totalMargin.toLocaleString(undefined, {maximumFractionDigits:0})}</td></tr>
                        </tfoot>
                    </table>
                 </div>
               </div>
               <div>
                 <h4 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4"><Receipt className="w-5 h-5 text-indigo-600" /> 2. Spend Verification (FI Document)</h4>
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr><th className="px-4 py-2 text-left font-medium text-slate-500">Doc</th><th className="px-4 py-2 text-left font-medium text-slate-500">Date</th><th className="px-4 py-2 text-left font-medium text-slate-500">Matnr</th><th className="px-4 py-2 text-left font-medium text-slate-500">GL</th><th className="px-4 py-2 text-left font-medium text-slate-500">Desc</th><th className="px-4 py-2 text-right font-medium text-slate-500">Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {spendRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-2 font-mono text-slate-600">{row.fiDocument}</td>
                                  <td className="px-4 py-2 font-mono text-slate-600">{row.date}</td>
                                  <td className="px-4 py-2 font-mono text-slate-600">{row.material}</td>
                                  <td className="px-4 py-2 font-mono text-slate-500">{row.glAccount}</td>
                                  <td className="px-4 py-2 text-slate-700">{row.description}</td>
                                  <td className="px-4 py-2 text-right font-bold text-slate-800">${row.amount.toLocaleString()}</td>
                              </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold"><tr><td colSpan={5} className="px-4 py-2 text-right">Total Actual Spend:</td><td className="px-4 py-2 text-right text-red-600">${totalSpend.toLocaleString()}</td></tr></tfoot>
                    </table>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="pb-6 border-b border-slate-200 space-y-6">
        <div className="flex justify-between items-start">
           <div>
              <h1 className="text-3xl font-bold text-slate-900">ROI Analysis Report</h1>
              <p className="text-slate-500 mt-1">Profit-based analysis of {promotions.length} promotions.</p>
           </div>
           
           {calculationResults && (
             <button onClick={handleAIAnalysis} disabled={loadingAI} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm">
               <Sparkles className="w-4 h-4 text-purple-600" />
               {loadingAI ? 'Generating...' : 'AI Insights'}
             </button>
           )}
        </div>

        {/* Top Filter Bar */}
        <div className="flex flex-wrap items-end gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
           <div className="px-3 border-r border-slate-100">
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="text-sm font-semibold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer">
                  <option value="all">All Years</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <div className="px-3 border-r border-slate-100">
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Hier 2</label>
              <select value={selectedHier2} onChange={(e) => setSelectedHier2(e.target.value)} className="text-sm font-semibold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[100px]">
                  <option value="all">All</option>
                  {hierarchyTree.hier2.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
           </div>
           <div className="px-3 border-r border-slate-100">
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Hier 3</label>
              <select value={selectedHier3} onChange={(e) => setSelectedHier3(e.target.value)} disabled={selectedHier2 === 'all'} className="text-sm font-semibold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[100px] disabled:text-slate-300">
                  <option value="all">All</option>
                  {selectedHier2 !== 'all' && hierarchyTree.map2to3.get(selectedHier2)?.size && 
                     Array.from(hierarchyTree.map2to3.get(selectedHier2)!).sort().map(h => <option key={h} value={h}>{h}</option>)
                  }
              </select>
           </div>
           <div className="px-3">
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Hier 4</label>
              <select value={selectedHier4} onChange={(e) => setSelectedHier4(e.target.value)} disabled={selectedHier3 === 'all'} className="text-sm font-semibold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer min-w-[100px] disabled:text-slate-300">
                  <option value="all">All</option>
                  {selectedHier3 !== 'all' && hierarchyTree.map3to4.get(selectedHier3)?.size && 
                     Array.from(hierarchyTree.map3to4.get(selectedHier3)!).sort().map(h => <option key={h} value={h}>{h}</option>)
                  }
              </select>
           </div>
           <div className="ml-auto pr-1 pb-1">
              {isReady ? (
                <button onClick={handleRunAnalysis} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm">
                   <Play className="w-3 h-3 fill-current" /> {calculationResults ? 'Update' : 'Run Analysis'}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 text-xs px-2">
                   <AlertTriangle className="w-3 h-3" /> Upload Data
                </div>
              )}
           </div>
        </div>
        {calculationResults && <div className="text-xs text-slate-400 px-2">Active Filter: <span className="font-medium text-indigo-600">{activeFilterLabel}</span></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Across Customer</h3>
          <ResponsiveContainer width="100%" height="90%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Spend" unit="$" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <YAxis type="number" dataKey="y" name="ROI" unit="%" />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Margin" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Customers" data={customerChartData} fill="#8884d8">
                   {customerChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Scatter>
              </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Top 10 Promo Analysis</h3>
          <ResponsiveContainer width="100%" height="90%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Spend" unit="$" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <YAxis type="number" dataKey="y" name="ROI" unit="%" />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Margin" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Promotions" data={promoChartData} fill="#82ca9d">
                   {promoChartData.map((entry, index) => <Cell key={`cell-promo-${index}`} fill={entry.fill} />)}
                </Scatter>
              </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {calculationResults && (
        <>
          {analysis && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
               <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-indigo-600" /><h2 className="font-bold text-indigo-900">AI Insights</h2></div>
               <p className="text-indigo-700 text-sm mb-4">{analysis.summary}</p>
               <ul className="list-disc list-inside text-indigo-700 text-sm space-y-1">{analysis.recommendations.map((r,i)=><li key={i}>{r}</li>)}</ul>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4" /> Promotion Details</h3>
              <span className="text-xs text-slate-500">{promotions.length} Promotions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-center w-[50px]"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Promotion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dates</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Spend ($)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Inc Units</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Lift Rev</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Inc Margin</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Net Profit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">ROI %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {promotions.sort((a,b) => b.roiPercent - a.roiPercent).map((p) => (
                      <tr key={p.promotionId} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-center"><button onClick={() => handleInspect(p.promotionId)} className="p-2 text-slate-400 hover:text-indigo-600"><Search className="w-4 h-4" /></button></td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            <div>{p.promotionName}</div>
                            <div className="flex gap-2 text-xs text-slate-400 font-normal mt-0.5">
                                <span>{p.promotionId}</span>
                                {p.mappedProductCount > 0 && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {p.mappedProductCount} SKUs</span>}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{p.customerName}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{p.startDate} <span className="text-slate-300">to</span> {p.endDate}</td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-slate-700">${p.finalSpend.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-slate-700">{p.incrementalUnits.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-slate-500">${p.incrementalRevenue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-slate-700">${p.grossMargin.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className="px-6 py-4 text-sm text-right font-mono font-bold text-slate-800">${p.netProfit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td className={`px-6 py-4 text-sm text-right font-mono font-bold ${p.roiPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{p.roiPercent.toFixed(1)}%</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ROIReport;

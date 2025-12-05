import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, FileSpreadsheet, Loader2, AlertCircle, RefreshCw, ServerOff, Database } from 'lucide-react';

// Configuration for API endpoint - Deployed on Cloud Run
const API_BASE_URL = 'https://fast-api-65494201008.us-central1.run.app';

type TabType = 'nielsen' | 'promotion' | 'promotionSpend' | 'fi' | 'cogs' | 'listPrice' | 'hierarchy' | 'dispute' | 'claim';

const DataPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('nielsen');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('unknown');
  
  const rowsPerPage = 15;

  // Metadata for tabs
  const tabConfig: Record<TabType, { label: string, endpoint: string, link?: string }> = {
    nielsen: { label: 'Nielsen', endpoint: '/api/nielsen', link: '/upload/nielsen' },
    promotion: { label: 'Promotion', endpoint: '/api/promotion', link: '/upload/promotion' },
    promotionSpend: { label: 'Promo Spend', endpoint: '/api/promotion-spend', link: '/upload/promotion-spend' },
    fi: { label: 'FI Doc', endpoint: '/api/fi-doc', link: '/upload/fi' },
    cogs: { label: 'COGS', endpoint: '/api/cogs', link: '/upload/cogs' },
    listPrice: { label: 'List Price', endpoint: '/api/list-price', link: '/upload/list-price' },
    hierarchy: { label: 'Hierarchy', endpoint: '/api/cust-hier', link: '/upload/customer-hierarchy' },
    dispute: { label: 'Dispute', endpoint: '/api/dispute', link: '/upload/dispute' },
    claim: { label: 'Claim', endpoint: '/api/claim', link: '/claim/deduction' }
  };

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // We use the health endpoint which returns detailed status
        const res = await fetch(`${API_BASE_URL}/health`);
        if (res.ok) {
           const json = await res.json();
           // Some backends return {status: "ok"}, others might return detailed db_connected.
           if (json.status === "ok" || json.db_connected) {
               setDbStatus('connected');
           } else {
               setDbStatus('db_error');
               console.warn("Backend running but DB might not be connected:", json);
           }
        } else {
           setDbStatus('server_error');
        }
      } catch (e) {
        setDbStatus('offline');
        console.error("Health check failed:", e);
      }
    };
    checkBackend();
  }, []);

  // Fetch data from MySQL Backend via FastAPI
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      
      try {
        const config = tabConfig[activeTab];
        const response = await fetch(`${API_BASE_URL}${config.endpoint}?limit=1000`);
        
        if (!response.ok) {
          const text = await response.text();
          let msg = response.statusText;
          try {
             const json = JSON.parse(text);
             if (json.detail) msg = json.detail;
          } catch (e) {}
          throw new Error(`Server Error (${response.status}): ${msg}`);
        }
        
        const result = await response.json();
        // Handle responses that might be wrapped in { data: [...] } or just [...]
        setData(Array.isArray(result) ? result : (result.data ? result.data : []));
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        // User friendly error mapping
        if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
             setError("Cannot connect to backend server at " + API_BASE_URL);
             setDbStatus('offline');
        } else {
             setError(err.message || "Unknown error occurred.");
        }
      } finally {
        setLoading(false);
        setCurrentPage(1); // Reset to first page on tab change
      }
    };

    fetchData();
  }, [activeTab]);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  const filteredRows = data.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Preview</h1>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-slate-500">Inspect table data directly from MySQL Database.</p>
             {dbStatus === 'offline' && (
                 <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    <ServerOff className="w-3 h-3"/> Backend Offline
                 </span>
             )}
             {dbStatus === 'db_error' && (
                 <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                    <Database className="w-3 h-3"/> DB Disconnected
                 </span>
             )}
             {dbStatus === 'connected' && (
                 <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    <Database className="w-3 h-3"/> Live MySQL
                 </span>
             )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          {(Object.keys(tabConfig) as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                  ${isActive 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                {tabConfig[tab].label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading || data.length === 0}
          />
        </div>
        
        {!loading && data.length > 0 && (
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">{filteredRows.length}</span> rows
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Fetching data from MySQL...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-center px-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Connection Error</h3>
            <p className="text-slate-500 max-w-md mb-2">{error}</p>
            
            {error.includes('Cannot connect') ? (
                <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 max-w-md">
                    <p className="font-semibold mb-2">Troubleshooting Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-left">
                        <li>Ensure the backend is running at <a href={API_BASE_URL} target="_blank" rel="noreferrer" className="text-blue-600 underline">{API_BASE_URL}</a></li>
                        <li>Verify that the service allows CORS requests.</li>
                    </ol>
                </div>
            ) : (
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 max-w-md">
                     <p className="font-semibold">Database Error</p>
                     <p>The backend is reachable but returned an error. It might be missing tables or credentials.</p>
                </div>
            )}
            
            <button 
              onClick={() => handleTabChange(activeTab)} 
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4"/> Retry Connection
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Table is Empty</h3>
            <p className="text-slate-500 mb-4">No records found in database for {tabConfig[activeTab].label}.</p>
            
            {tabConfig[activeTab].link && (
              <Link to={tabConfig[activeTab].link!} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Upload Data
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full pb-3 flex-1">
              <table className="w-max min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {currentRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {headers.map((header, colIdx) => (
                        <td key={`${idx}-${colIdx}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {String(row[header] === null || row[header] === undefined ? '' : row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="p-2 border border-slate-300 rounded-md bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="p-2 border border-slate-300 rounded-md bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataPreview;

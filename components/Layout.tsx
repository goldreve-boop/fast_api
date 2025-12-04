
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Receipt, 
  PieChart, 
  TrendingUp, 
  Menu, 
  X, 
  Table, 
  Link as LinkIcon, 
  Box, 
  Tag, 
  DollarSign, 
  Database, 
  ChevronDown, 
  ChevronRight,
  Network,
  BarChart2,
  AlertCircle,
  ClipboardList,
  ShieldCheck,
  Users,
  MousePointer,
  UserPlus,
  Briefcase,
  Coins
} from 'lucide-react';

interface NavItemProps {
  item: {
    name: string;
    path: string;
    icon: React.ElementType;
  };
  isChild?: boolean;
  onCloseMobileMenu: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isChild = false, onCloseMobileMenu }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;
  
  return (
    <NavLink
      to={item.path}
      onClick={onCloseMobileMenu}
      className={`
        flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
        ${isChild ? 'pl-11' : ''}
        ${isActive 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
      {item.name}
    </NavLink>
  );
};

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthSettingsOpen, setIsAuthSettingsOpen] = useState(true);
  const [isSyndicatedOpen, setIsSyndicatedOpen] = useState(true);
  const [isSAPOpen, setIsSAPOpen] = useState(true);
  const [isTradePromoOpen, setIsTradePromoOpen] = useState(true);
  const [isClaimOpen, setIsClaimOpen] = useState(true);

  const authSettingsItems = [
    { name: 'User Management', path: '/role/user', icon: UserPlus },
    { name: 'Menu Role', path: '/role/menu', icon: Users },
    { name: 'Button Role', path: '/role/button', icon: MousePointer },
  ];

  const syndicatedItems = [
    { name: 'Nielsen Data', path: '/upload/nielsen', icon: TrendingUp },
  ];

  const sapDataItems = [
    { name: 'Promotion Data', path: '/upload/promotion', icon: FileSpreadsheet },
    { name: 'Promotion Spend', path: '/upload/promotion-spend', icon: Coins },
    { name: 'FI Document', path: '/upload/fi', icon: Receipt },
    { name: 'COGS Data', path: '/upload/cogs', icon: DollarSign },
    { name: 'List Price', path: '/upload/list-price', icon: Tag },
    { name: 'Cust. Hierarchy', path: '/upload/customer-hierarchy', icon: Network },
    { name: 'Dispute Case', path: '/upload/dispute', icon: AlertCircle },
  ];

  const tradePromoItems = [
    { name: 'Trade Promotion', path: '/trade-promotion', icon: Briefcase },
  ];

  const claimItems = [
    { name: 'Deduction Claim', path: '/claim/deduction', icon: ClipboardList },
  ];

  const mappingItems = [
    { name: 'Customer Mapping', path: '/mapping', icon: LinkIcon },
    { name: 'Material Mapping', path: '/mapping/material', icon: Box },
  ];

  const analysisItems = [
    { name: 'Data Preview', path: '/preview', icon: Table },
    { name: 'ROI Report', path: '/report', icon: PieChart },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 border-b border-slate-200 px-6">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <PieChart className="w-8 h-8" />
            <span>ROI Analytics</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {/* Dashboard */}
          <NavItem 
            item={{ name: 'Dashboard', path: '/', icon: LayoutDashboard }} 
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />

          {/* Authorization Settings Group */}
          <div className="pt-2">
            <button
              onClick={() => setIsAuthSettingsOpen(!isAuthSettingsOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span>Authorization Settings</span>
              </div>
              {isAuthSettingsOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {isAuthSettingsOpen && (
              <div className="mt-1 space-y-0.5">
                {authSettingsItems.map((item) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    isChild={true} 
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Syndicated Data Group */}
          <div className="pt-1">
            <button
              onClick={() => setIsSyndicatedOpen(!isSyndicatedOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span>Syndicated Data</span>
              </div>
              {isSyndicatedOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {isSyndicatedOpen && (
              <div className="mt-1 space-y-0.5">
                {syndicatedItems.map((item) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    isChild={true} 
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SAP Data Group */}
          <div className="pt-1">
            <button
              onClick={() => setIsSAPOpen(!isSAPOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span>SAP Data</span>
              </div>
              {isSAPOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {isSAPOpen && (
              <div className="mt-1 space-y-0.5">
                {sapDataItems.map((item) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    isChild={true} 
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Trade Promotion Group */}
          <div className="pt-1">
            <button
              onClick={() => setIsTradePromoOpen(!isTradePromoOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span>Trade Promotion</span>
              </div>
              {isTradePromoOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {isTradePromoOpen && (
              <div className="mt-1 space-y-0.5">
                {tradePromoItems.map((item) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    isChild={true} 
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Claim Group */}
          <div className="pt-1">
            <button
              onClick={() => setIsClaimOpen(!isClaimOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span>Claim</span>
              </div>
              {isClaimOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {isClaimOpen && (
              <div className="mt-1 space-y-0.5">
                {claimItems.map((item) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    isChild={true} 
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 pb-2">
             <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mapping Data</p>
             {mappingItems.map(item => (
                <NavItem 
                  key={item.path} 
                  item={item} 
                  onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                />
             ))}
          </div>

          <div className="pt-2">
             <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Analysis</p>
             {analysisItems.map(item => (
                <NavItem 
                  key={item.path} 
                  item={item} 
                  onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                />
             ))}
          </div>

        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              SH
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-700">Sungmin Hong</p>
              <p className="text-xs text-slate-500">Analyst</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:hidden">
          <div className="font-bold text-lg text-slate-800">ROI Analytics</div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

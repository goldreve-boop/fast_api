
export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface ParsedData {
  fileName: string;
  rows: DataRow[];
  headers: string[];
}

export interface CustomerMapping {
  id: string;
  territoryId: string;
  territoryName: string;
  nielsenCustomer: string;
}

export interface MaterialMapping {
  id: string;
  matnr: string;
  upc: string;
  packSize: string;
}

// Authorization Types
export interface User {
  id: string;
  userId: string;
  password?: string;
  firstName: string;
  lastName: string;
}

export interface MenuRole {
  id: string; // unique record id
  userId: string;
  menuId: string; // The route or menu name
  isAuthorized: boolean;
}

export interface ButtonRole {
  id: string; // unique record id
  userId: string;
  menuId: string; // Key: Menu Program
  canSave: boolean;
  canCancel: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canConfirm: boolean;
}

export interface AppState {
  nielsenData: ParsedData | null;
  promotionData: ParsedData | null;
  fiData: ParsedData | null;
  cogsData: ParsedData | null;
  listPriceData: ParsedData | null;
  customerHierarchyData: ParsedData | null;
  customerMappings: CustomerMapping[];
  materialMappings: MaterialMapping[];
}

export interface ROIFilterOptions {
  year: string;
  hier2?: string;
  hier3?: string;
  hier4?: string;
}

export enum UploadType {
  NIELSEN = 'NIELSEN',
  PROMOTION = 'PROMOTION',
  FI = 'FI',
}

// Result of specific promotion calculation
export interface PromotionAnalysis {
  promotionId: string;
  promotionName: string;
  customerName: string;
  startDate: string;
  endDate: string;
  
  // Financials
  plannedSpend: number;
  actualSpend: number; // From FI
  finalSpend: number; // Actual if exists, else Planned
  
  // Nielsen Performance
  incrementalUnits: number;
  incrementalRevenue: number; // Based on Nielsen Price (Legacy view)
  baselineUnits: number;

  // Profitability Metrics (New)
  grossMargin: number; // (ListPrice - COGS) * Units
  netProfit: number;   // GrossMargin - FinalSpend
  
  // Metrics
  roiPercent: number; // (GrossMargin - Spend) / Spend * 100
  roiValue: number;   // NetProfit

  // Meta
  mappedProductCount: number; // Number of SKUs used for filtering
}

// Data structure for the Sales Drill-Down (Nielsen)
export interface PromotionDrillDownRow {
  date: string;
  customer: string;
  upc: string;
  incrementalUnits: number;
  unitPrice: number;
  revenue: number;
  grossMargin: number;
  matchedMaterial: string; // The MATNR that linked this UPC
}

// Data structure for the Spend Drill-Down (FI)
export interface SpendDrillDownRow {
  fiDocument: string;
  date: string;
  material: string; // Added Material field
  glAccount: string;
  description: string;
  amount: number;
}

// Combined Drill Down Result
export interface PromotionDrillDownResult {
  salesRows: PromotionDrillDownRow[];
  spendRows: SpendDrillDownRow[];
}

// Aggregated by Customer for the Bubble Chart
export interface CustomerROIStats {
  customerName: string;
  totalSpend: number;
  totalGrossMargin: number; // Changed from RevenueLift
  avgRoiPercent: number;
  promotionCount: number;
}

export interface AIAnalysisResult {
  roiScore: number;
  summary: string;
  recommendations: string[];
  riskAssessment: string;
}


import { SAP_DB } from './sapDatabase';
import { PromotionAnalysis, CustomerROIStats, PromotionDrillDownResult, ROIFilterOptions, CustomerMapping, MaterialMapping } from '../types';

// --- Helper Functions (Internal ABAP Logic) ---

const parseNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]+/g, '');
  return parseFloat(str) || 0;
};

const parseDateStr = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const normalizeUpc = (val: any): string => {
  if (!val) return '';
  return String(val).trim().replace(/^0+/, '');
};

const normalizeMatnr = (val: any): string => {
  if (!val) return '';
  return String(val).trim().toLowerCase().replace(/^0+/, '');
};

const findVal = (row: any, keys: string[]): any => {
  if (!row) return undefined;
  for (const key of keys) if (row[key] !== undefined) return row[key];
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey);
    if (foundKey) return row[foundKey];
  }
  return undefined;
};

// --- Public RFC-like Functions ---

export const SAP_RFC = {
  
  // Z_GET_HIERARCHY_TREE
  getHierarchyTree: () => {
    const hier2 = new Set<string>();
    const map2to3 = new Map<string, Set<string>>();
    const map3to4 = new Map<string, Set<string>>();
    
    const rows = SAP_DB.ZCUSTHIER;
    rows.forEach(row => {
      const h2 = String(findVal(row, ['Hier2Name', 'Hier2']) || '').trim();
      const h3 = String(findVal(row, ['Hier3Name', 'Hier3']) || '').trim();
      const h4 = String(findVal(row, ['Hier4Name', 'Hier4']) || '').trim();

      if (h2) {
        hier2.add(h2);
        if (h3) {
          if (!map2to3.has(h2)) map2to3.set(h2, new Set());
          map2to3.get(h2)?.add(h3);
          if (h4) {
            if (!map3to4.has(h3)) map3to4.set(h3, new Set());
            map3to4.get(h3)?.add(h4);
          }
        }
      }
    });

    return {
      hier2: Array.from(hier2).sort(),
      map2to3,
      map3to4
    };
  },

  // Z_CALCULATE_ROI
  calculateROI: (filter?: ROIFilterOptions): { 
    promotions: PromotionAnalysis[], 
    customerStats: CustomerROIStats[] 
  } => {
    const promotionData = SAP_DB.ZPROMOTION;
    const nielsenData = SAP_DB.ZNIELSEN;
    const fiData = SAP_DB.ZFIDOC;
    const cogsData = SAP_DB.ZCOGS;
    const listPriceData = SAP_DB.ZLISTPRICE;
    const customerMappings = SAP_DB.ZMAPPING_CUST;
    const materialMappings = SAP_DB.ZMAPPING_MAT;
    const customerHierarchyData = SAP_DB.ZCUSTHIER;

    if (promotionData.length === 0 || nielsenData.length === 0) {
      return { promotions: [], customerStats: [] };
    }

    // --- 1. Prepare Filter Logic ---
    const allowedCustomers = new Set<string>(); 
    const allowedTerritoryCodes = new Set<string>();
    let isHierarchyFilterActive = false;

    if (filter && (filter.hier2 || filter.hier3 || filter.hier4) && customerHierarchyData.length > 0) {
      isHierarchyFilterActive = true;
      customerHierarchyData.forEach(row => {
        const h2 = String(findVal(row, ['Hier2Name', 'Hier2']) || '').trim();
        const h3 = String(findVal(row, ['Hier3Name', 'Hier3']) || '').trim();
        const h4 = String(findVal(row, ['Hier4Name', 'Hier4']) || '').trim();
        const h6Code = String(findVal(row, ['Hier6', 'Hier6Code']) || '').trim();
        const h6Name = String(findVal(row, ['Hier6Name', 'Hier6Name']) || '').trim();

        let match = true;
        if (filter.hier2 && h2 !== filter.hier2) match = false;
        if (filter.hier3 && h3 !== filter.hier3) match = false;
        if (filter.hier4 && h4 !== filter.hier4) match = false;

        if (match) {
          if (h6Code) allowedTerritoryCodes.add(h6Code.toLowerCase());
          if (h6Name) allowedCustomers.add(h6Name.toLowerCase());
        }
      });
    }

    // --- 2. Prepare Lookups ---
    const territoryToCustomer = new Map<string, string>();
    customerMappings.forEach(m => {
      if (m.territoryId && m.nielsenCustomer) {
        territoryToCustomer.set(m.territoryId.toLowerCase(), m.nielsenCustomer.toLowerCase());
      }
    });

    const matnrToPackSize = new Map<string, number>();
    const matnrToUpc = new Map<string, string>();
    const upcToMatnr = new Map<string, string>(); 

    materialMappings.forEach(m => {
      const matnr = normalizeMatnr(m.matnr);
      if (m.packSize) matnrToPackSize.set(matnr, parseNum(m.packSize) || 1);
      if (m.upc) {
        const upc = normalizeUpc(m.upc);
        matnrToUpc.set(matnr, upc);
        upcToMatnr.set(upc, matnr);
      }
    });

    const matnrToCOGS = new Map<string, number>();
    cogsData.forEach(row => {
      const matnr = normalizeMatnr(findVal(row, ['MATNR', 'Material']));
      if (matnr) matnrToCOGS.set(matnr, parseNum(findVal(row, ['COGS', 'Cost'])));
    });

    const matnrToListPrice = new Map<string, number>();
    listPriceData.forEach(row => {
      const matnr = normalizeMatnr(findVal(row, ['MATNR', 'Material']));
      if (matnr) matnrToListPrice.set(matnr, parseNum(findVal(row, ['LISTPRICE', 'List Price', 'Price'])));
    });

    const promoTotalActualSpend = new Map<string, number>();
    const promoFiMaterials = new Map<string, Set<string>>();
    
    fiData.forEach(row => {
      const pid = String(findVal(row, ['PromotionID', 'Promotion ID', 'PromId']) || '');
      const rawAmount = parseNum(findVal(row, ['AMOUNT', 'Amount', 'Amt']));
      const matnr = normalizeMatnr(findVal(row, ['MATERIAL', 'Material', 'Matnr']));
      
      if (pid) {
        promoTotalActualSpend.set(pid, (promoTotalActualSpend.get(pid) || 0) + rawAmount);
        if (matnr) {
          if (!promoFiMaterials.has(pid)) promoFiMaterials.set(pid, new Set());
          promoFiMaterials.get(pid)?.add(matnr);
        }
      }
    });

    // --- 3. Process Promotions ---
    const uniquePromotions = new Map<string, any>();
    const promoProducts = new Map<string, Set<string>>(); 

    promotionData.forEach(row => {
      const tactic = String(findVal(row, ['Tactic', 'Strategy']) || '').trim().toUpperCase();
      if (tactic === 'EDLP') return;

      const promoId = String(findVal(row, ['PromotionID', 'ID', 'PromoID']) || '');
      if (!promoId) return;

      if (!uniquePromotions.has(promoId)) uniquePromotions.set(promoId, row);

      const matnr = normalizeMatnr(findVal(row, ['ProductID', 'Product ID', 'Material', 'SKU']));
      if (matnr) {
        if (!promoProducts.has(promoId)) promoProducts.set(promoId, new Set());
        promoProducts.get(promoId)?.add(matnr);
      }
    });

    const analysisResults: PromotionAnalysis[] = [];

    uniquePromotions.forEach((promo, promoId) => {
      const territoryId = String(findVal(promo, ['TerritoryID', 'Territory ID']) || '');
      const plannedStart = parseDateStr(findVal(promo, ['Planned_Start', 'Start Date', 'Start']));
      const plannedFinish = parseDateStr(findVal(promo, ['Planned_Finish', 'End Date', 'Finish', 'End']));
      
      if (!plannedStart || !plannedFinish) return;

      // Year Filter
      if (filter?.year && filter.year !== 'all') {
        const promoYear = plannedStart.getFullYear().toString();
        if (promoYear !== filter.year) return;
      }

      // Hierarchy Filter
      const nielsenCustName = territoryToCustomer.get(territoryId.toLowerCase());
      if (isHierarchyFilterActive) {
        let isMatch = false;
        if (territoryId && allowedTerritoryCodes.has(territoryId.toLowerCase())) isMatch = true;
        else if (nielsenCustName && allowedCustomers.has(nielsenCustName.toLowerCase())) isMatch = true;
        if (!isMatch) return;
      }

      const actualSpendTotal = promoTotalActualSpend.get(promoId) || 0;
      const plannedSpendRaw = parseNum(findVal(promo, ['Planned_Spend', 'Planned Spend', 'Spend']));
      const finalSpendTotal = actualSpendTotal > 0 ? actualSpendTotal : plannedSpendRaw;

      const promoMatnrs = promoProducts.get(promoId);
      const fiMatnrs = promoFiMaterials.get(promoId);
      
      const combinedMatnrs = new Set<string>();
      if (promoMatnrs) promoMatnrs.forEach(m => combinedMatnrs.add(m));
      if (fiMatnrs) fiMatnrs.forEach(m => combinedMatnrs.add(m));

      const targetUpcs = new Set<string>();
      let hasProductDefinition = false;

      if (combinedMatnrs.size > 0) {
        hasProductDefinition = true;
        combinedMatnrs.forEach(matnr => {
          const mappedUpc = matnrToUpc.get(matnr);
          if (mappedUpc) targetUpcs.add(mappedUpc);
        });
      }

      let incrementalUnits = 0;
      let baselineUnits = 0;
      let totalGrossMargin = 0;
      let legacyRevenueSum = 0;
      let legacyUnitPriceSum = 0;
      let legacyDataCount = 0;

      if (nielsenCustName) {
        nielsenData.forEach(nRow => {
          const nCust = String(findVal(nRow, ['Customer', 'Cust']) || '').toLowerCase();
          const nDate = parseDateStr(findVal(nRow, ['Date', 'Period']));
          const nUpc = normalizeUpc(findVal(nRow, ['UPC', 'UPC Code', 'Item']));
          
          if (nCust === nielsenCustName && nDate) {
            if (nDate >= plannedStart && nDate <= plannedFinish) {
              if (hasProductDefinition && !targetUpcs.has(nUpc)) return;

              const incVol = parseNum(findVal(nRow, ['Incremental U Vol', 'Inc Vol', 'Inc Units']));
              const baseVol = parseNum(findVal(nRow, ['Baseline U Vol', 'Base Vol']));
              const nielsenPrice = parseNum(findVal(nRow, ['Avg Sgl Unit Price', 'Unit Price', 'Price']));

              incrementalUnits += incVol;
              baselineUnits += baseVol;
              legacyUnitPriceSum += nielsenPrice;
              legacyDataCount++;
              
              let matnr = upcToMatnr.get(nUpc);
              if (combinedMatnrs.size > 0) {
                 for (const pMatnr of combinedMatnrs) {
                   if (matnrToUpc.get(pMatnr) === nUpc) {
                     matnr = pMatnr;
                     break;
                   }
                 }
              }
              
              let caseListPrice = 0;
              let caseCogs = 0;
              let packSize = 1;

              if (matnr) {
                caseCogs = matnrToCOGS.get(matnr) || 0;
                packSize = matnrToPackSize.get(matnr) || 1;
                caseListPrice = matnrToListPrice.get(matnr) || (nielsenPrice * packSize); 
              } else {
                caseListPrice = nielsenPrice; 
                packSize = 1;
              }

              const unitListPrice = packSize > 0 ? (caseListPrice / packSize) : 0;
              const unitCogs = packSize > 0 ? (caseCogs / packSize) : 0;
              const unitMargin = unitListPrice - unitCogs;
              totalGrossMargin += (unitMargin * incVol);
            }
          }
        });
      }

      const avgPeriodPrice = legacyDataCount > 0 ? (legacyUnitPriceSum / legacyDataCount) : 0;
      legacyRevenueSum = incrementalUnits * avgPeriodPrice;

      const netProfit = totalGrossMargin - finalSpendTotal;
      let roiPercent = 0;
      if (finalSpendTotal > 0) {
        roiPercent = (netProfit / finalSpendTotal) * 100;
      } else if (totalGrossMargin > 0) {
        roiPercent = 100; 
      }

      analysisResults.push({
        promotionId: promoId,
        promotionName: String(findVal(promo, ['PromotionName', 'Name']) || 'Promo ' + promoId),
        customerName: nielsenCustName || 'Unknown (No Mapping)',
        startDate: plannedStart.toISOString().split('T')[0],
        endDate: plannedFinish.toISOString().split('T')[0],
        plannedSpend: plannedSpendRaw,
        actualSpend: actualSpendTotal,
        finalSpend: finalSpendTotal, 
        incrementalUnits,
        incrementalRevenue: legacyRevenueSum, 
        baselineUnits,
        grossMargin: totalGrossMargin,
        netProfit: netProfit,
        roiPercent,
        roiValue: netProfit,
        mappedProductCount: targetUpcs.size
      });
    });

    // Aggregate
    const customerMap = new Map<string, CustomerROIStats>();
    analysisResults.forEach(res => {
      if (res.customerName === 'Unknown (No Mapping)') return;
      const existing = customerMap.get(res.customerName) || {
        customerName: res.customerName,
        totalSpend: 0,
        totalGrossMargin: 0,
        avgRoiPercent: 0,
        promotionCount: 0
      };
      existing.totalSpend += res.finalSpend;
      existing.totalGrossMargin += res.grossMargin;
      existing.promotionCount += 1;
      customerMap.set(res.customerName, existing);
    });

    const customerStats = Array.from(customerMap.values()).map(c => ({
      ...c,
      avgRoiPercent: c.totalSpend > 0 
        ? ((c.totalGrossMargin - c.totalSpend) / c.totalSpend) * 100
        : 0
    }));

    return { promotions: analysisResults, customerStats };
  },

  // Z_GET_PROMOTION_DRILLDOWN
  getPromotionDrillDown: (targetPromoId: string): PromotionDrillDownResult => {
    const promotionData = SAP_DB.ZPROMOTION;
    const nielsenData = SAP_DB.ZNIELSEN;
    const fiData = SAP_DB.ZFIDOC;
    const cogsData = SAP_DB.ZCOGS;
    const listPriceData = SAP_DB.ZLISTPRICE;
    const customerMappings = SAP_DB.ZMAPPING_CUST;
    const materialMappings = SAP_DB.ZMAPPING_MAT;

    const result: PromotionDrillDownResult = { salesRows: [], spendRows: [] };
    if (promotionData.length === 0 || nielsenData.length === 0) return result;

    // Territory -> Customer Map
    const territoryToCustomer = new Map<string, string>();
    customerMappings.forEach(m => {
      if (m.territoryId && m.nielsenCustomer) territoryToCustomer.set(m.territoryId.toLowerCase(), m.nielsenCustomer.toLowerCase());
    });

    // Material Maps
    const matnrToPackSize = new Map<string, number>();
    const matnrToUpc = new Map<string, string>();
    const upcToMatnr = new Map<string, string>();
    materialMappings.forEach(m => {
      const matnr = normalizeMatnr(m.matnr);
      if (m.packSize) matnrToPackSize.set(matnr, parseNum(m.packSize) || 1);
      if (m.upc) {
        const upc = normalizeUpc(m.upc);
        matnrToUpc.set(matnr, upc);
        upcToMatnr.set(upc, matnr);
      }
    });

    const matnrToCOGS = new Map<string, number>();
    cogsData.forEach(row => {
      const matnr = normalizeMatnr(findVal(row, ['MATNR', 'Material']));
      if (matnr) matnrToCOGS.set(matnr, parseNum(findVal(row, ['COGS', 'Cost'])));
    });

    const matnrToListPrice = new Map<string, number>();
    listPriceData.forEach(row => {
      const matnr = normalizeMatnr(findVal(row, ['MATNR', 'Material']));
      if (matnr) matnrToListPrice.set(matnr, parseNum(findVal(row, ['LISTPRICE', 'List Price'])));
    });

    // Target Promo Info
    const targetPromoRow = promotionData.find(row => String(findVal(row, ['PromotionID', 'ID']) || '') === targetPromoId);
    const promoMatnrs = new Set<string>();

    promotionData.forEach(row => {
      if (String(findVal(row, ['PromotionID', 'ID']) || '') === targetPromoId) {
        const matnr = normalizeMatnr(findVal(row, ['ProductID', 'Material']));
        if (matnr) promoMatnrs.add(matnr);
      }
    });

    fiData.forEach(row => {
      if (String(findVal(row, ['PromotionID', 'PromId']) || '') === targetPromoId) {
        const matnr = normalizeMatnr(findVal(row, ['MATERIAL', 'Matnr']));
        if (matnr) promoMatnrs.add(matnr);
      }
    });

    if (targetPromoRow) {
      const territoryId = String(findVal(targetPromoRow, ['TerritoryID', 'Territory ID']) || '');
      const nielsenCustName = territoryToCustomer.get(territoryId.toLowerCase());
      const plannedStart = parseDateStr(findVal(targetPromoRow, ['Planned_Start', 'Start']));
      const plannedFinish = parseDateStr(findVal(targetPromoRow, ['Planned_Finish', 'Finish']));

      if (nielsenCustName && plannedStart && plannedFinish) {
        const targetUpcs = new Set<string>();
        let hasProductDefinition = false;
        if (promoMatnrs.size > 0) {
          hasProductDefinition = true;
          promoMatnrs.forEach(matnr => {
            const upc = matnrToUpc.get(matnr);
            if (upc) targetUpcs.add(upc);
          });
        }

        nielsenData.forEach(nRow => {
          const nCust = String(findVal(nRow, ['Customer', 'Cust']) || '').toLowerCase();
          const nDate = parseDateStr(findVal(nRow, ['Date', 'Period']));
          const nUpc = normalizeUpc(findVal(nRow, ['UPC', 'UPC Code']));

          if (nCust === nielsenCustName && nDate) {
            if (nDate >= plannedStart && nDate <= plannedFinish) {
              let isMatch = true;
              if (hasProductDefinition && !targetUpcs.has(nUpc)) isMatch = false;

              if (isMatch) {
                const incVol = parseNum(findVal(nRow, ['Incremental U Vol', 'Inc Vol']));
                const nielsenPrice = parseNum(findVal(nRow, ['Avg Sgl Unit Price', 'Unit Price']));
                
                let matnr = upcToMatnr.get(nUpc);
                if (promoMatnrs.size > 0) {
                  for (const pMatnr of promoMatnrs) {
                    if (matnrToUpc.get(pMatnr) === nUpc) {
                      matnr = pMatnr;
                      break;
                    }
                  }
                }

                let caseListPrice = 0;
                let caseCogs = 0;
                let packSize = 1;

                if (matnr) {
                  caseCogs = matnrToCOGS.get(matnr) || 0;
                  packSize = matnrToPackSize.get(matnr) || 1;
                  caseListPrice = matnrToListPrice.get(matnr) || (nielsenPrice * packSize);
                } else {
                  caseListPrice = nielsenPrice;
                  packSize = 1;
                }

                const unitListPrice = packSize > 0 ? (caseListPrice / packSize) : 0;
                const unitCogs = packSize > 0 ? (caseCogs / packSize) : 0;
                const unitMargin = unitListPrice - unitCogs;

                result.salesRows.push({
                  date: nDate.toISOString().split('T')[0],
                  customer: findVal(nRow, ['Customer', 'Cust']),
                  upc: nUpc,
                  incrementalUnits: incVol,
                  unitPrice: nielsenPrice,
                  revenue: incVol * nielsenPrice,
                  grossMargin: incVol * unitMargin,
                  matchedMaterial: matnr || '(No Mapping)'
                });
              }
            }
          }
        });
      }
    }

    fiData.forEach(row => {
      if (String(findVal(row, ['PromotionID', 'Promotion ID', 'PromId']) || '') === targetPromoId) {
        const rawDate = parseDateStr(findVal(row, ['Date', 'PostDate', 'DocDate']));
        result.spendRows.push({
          fiDocument: String(findVal(row, ['FIDOCUMENT', 'Document']) || 'Unknown'),
          date: rawDate ? rawDate.toISOString().split('T')[0] : 'N/A',
          material: String(findVal(row, ['MATERIAL', 'Material', 'Matnr']) || ''),
          glAccount: String(findVal(row, ['GL_ACCOUNT', 'GL']) || ''),
          description: String(findVal(row, ['Desc', 'Description', 'Text']) || ''),
          amount: parseNum(findVal(row, ['AMOUNT', 'Amount', 'Amt']))
        });
      }
    });

    return result;
  },

  // Z_GET_AVAILABLE_YEARS
  getAvailableYears: (): string[] => {
    const years = new Set<string>();
    SAP_DB.ZPROMOTION.forEach(row => {
      const dateVal = row['Planned_Start'] || row['PLANNED_START'] || row['Start Date'];
      if (dateVal && typeof dateVal === 'string' && dateVal.length >= 4) {
        years.add(dateVal.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }
};

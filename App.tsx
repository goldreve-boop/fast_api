
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FileUploader from './components/FileUploader';
import Dashboard from './pages/Dashboard';
import ROIReport from './pages/ROIReport';
import DataPreview from './pages/DataPreview';
import CustomerMappingPage from './pages/CustomerMapping';
import MaterialMappingPage from './pages/MaterialMapping';
import DeductionClaim from './pages/DeductionClaim';
import DeductionClaimDetail from './pages/DeductionClaimDetail';
import MenuRolePage from './pages/MenuRole';
import ButtonRolePage from './pages/ButtonRole';
import UserManagementPage from './pages/UserManagement';
import TradePromotion from './pages/TradePromotion';
import PromotionDetail from './pages/PromotionDetail';
import { ParsedData, DataRow, CustomerMapping, MaterialMapping } from './types';
import { SAP_DB } from './services/sapDatabase';

function App() {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const refreshApp = () => setLastUpdate(Date.now());

  const updateNielsen = (newData: ParsedData) => {
    SAP_DB.clearTable('ZNIELSEN');
    SAP_DB.insertRows('ZNIELSEN', newData.rows);
    refreshApp();
  };
  const updatePromotion = (newData: ParsedData) => {
    SAP_DB.clearTable('ZPROMOTION');
    SAP_DB.insertRows('ZPROMOTION', newData.rows);
    refreshApp();
  };
  const updatePromotionSpend = (newData: ParsedData) => {
    SAP_DB.clearTable('ZPROMOSPEND');
    SAP_DB.insertRows('ZPROMOSPEND', newData.rows);
    refreshApp();
  };
  const updateFI = (newData: ParsedData) => {
    SAP_DB.clearTable('ZFIDOC');
    SAP_DB.insertRows('ZFIDOC', newData.rows);
    refreshApp();
  };
  const updateCOGS = (newData: ParsedData) => {
    SAP_DB.clearTable('ZCOGS');
    SAP_DB.insertRows('ZCOGS', newData.rows);
    refreshApp();
  };
  const updateListPrice = (newData: ParsedData) => {
    SAP_DB.clearTable('ZLISTPRICE');
    SAP_DB.insertRows('ZLISTPRICE', newData.rows);
    refreshApp();
  };
  const updateCustomerHierarchy = (newData: ParsedData) => {
    SAP_DB.clearTable('ZCUSTHIER');
    SAP_DB.insertRows('ZCUSTHIER', newData.rows);
    refreshApp();
  };
  const updateDispute = (newData: ParsedData) => {
    SAP_DB.clearTable('ZDISPUTE');
    SAP_DB.insertRows('ZDISPUTE', newData.rows);
    refreshApp();
  };

  const updateMappings = (newMappings: CustomerMapping[]) => {
    SAP_DB.ZMAPPING_CUST = newMappings;
    refreshApp();
  };
  const updateMaterialMappings = (newMappings: MaterialMapping[]) => {
    SAP_DB.ZMAPPING_MAT = newMappings;
    refreshApp();
  };

  const nielsenHeaders = ['Date', 'Customer', 'UPC', 'Baseline U Vol', 'Incremental U Vol', 'Avg Sgl Unit Price'];
  const promotionHeaders = ['ID', 'PromotionID', 'PromotionName', 'Tactic', 'CreatedDate', 'ExecuteDate', 'Status', 'Planned_Start', 'Planned_Finish', 'ScanVolume', 'Planned_Spend', 'TerritoryID', 'Type', 'TypeName', 'Objective', 'CreatedBy', 'ChangedDate', 'FundPlanID', 'FundPlanName', '0INV_QTY', '0UPLI_QTYS', 'ProductID', 'Description'];
  const promotionSpendHeaders = ['PromotionID', 'Spend_type', 'Spend_type_desc', 'Spend_Rate'];
  const fiHeaders = ['FIDOCUMENT', 'Date', 'GL_ACCOUNT', 'Desc', 'AMOUNT', 'PromotionID', 'MATERIAL'];
  const cogsHeaders = ['MATNR', 'COGS'];
  const listPriceHeaders = ['MATNR', 'LISTPRICE'];
  const custHierarchyHeaders = ['Hier6', 'Hier6Name', 'Hier5', 'Hier5Name', 'Hier4', 'Hier4Name', 'Hier3', 'Hier3Name', 'Hier2', 'Hier2Name'];
  const disputeHeaders = ['EXT_KEY', 'CASE_GUID', 'FIN_ORIGINAL_AMT', 'FIN_DISPUTE_CURR', 'FIN_KUNNR', 'FIN_BUKRS', 'FIN_STAT_PARA', 'FIN_EXTAPPL_PRO', 'ZZCHECK_NUMBER', 'CASE_TYPE', 'EXT_REF', 'CREATED_BY', 'CREATE_TIME', 'CHANGED_BY', 'CASE_TITLE', 'PROFILE_ID', 'STAT_ORDERNO', 'STAT_PARA', 'REASON_CODE'];

  const validatePromotionData = (rows: DataRow[]): string | null => {
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const row = rows[i];
      const startDate = row['Planned_Start'] || row['PLANNED_START'] || row['planned_start'];
      const finishDate = row['Planned_Finish'] || row['PLANNED_FINISH'] || row['planned_finish'];
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (startDate && !dateRegex.test(String(startDate))) return `Row ${i + 1}: 'Planned_Start' (${startDate}) invalid format.`;
      if (finishDate && !dateRegex.test(String(finishDate))) return `Row ${i + 1}: 'Planned_Finish' (${finishDate}) invalid format.`;
    }
    return null;
  };

  const validatePromotionSpendData = (rows: DataRow[]): string | null => {
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const row = rows[i];
      const rate = row['Spend_Rate'];
      if (rate !== undefined && rate !== null && rate !== "" && isNaN(Number(rate))) {
        return `Row ${i + 1}: 'Spend_Rate' value "${rate}" must be a number.`;
      }
    }
    return null;
  };

  const getFileData = (tableName: string) => {
    const rows = SAP_DB.getTable(tableName);
    return rows.length > 0 ? { fileName: `${tableName}.xlsx`, rows, headers: Object.keys(rows[0]) } : null;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard key={lastUpdate} />} />
          
          {/* Upload Routes */}
          <Route path="upload/nielsen" element={<FileUploader title="1. Nielsen Data Upload" description="Upload your Nielsen market share and sales volume reports." currentData={getFileData('ZNIELSEN')} onDataLoaded={updateNielsen} requiredHeaders={nielsenHeaders} />} />
          <Route path="upload/promotion" element={<FileUploader title="2. Promotion Data Upload" description="Upload your internal promotion calendar." currentData={getFileData('ZPROMOTION')} onDataLoaded={updatePromotion} requiredHeaders={promotionHeaders} customValidation={validatePromotionData} />} />
          <Route path="upload/promotion-spend" element={<FileUploader title="2.1. Promotion Spend Upload" description="Upload Promotion Spend rates and descriptions." currentData={getFileData('ZPROMOSPEND')} onDataLoaded={updatePromotionSpend} requiredHeaders={promotionSpendHeaders} customValidation={validatePromotionSpendData} />} />
          <Route path="upload/fi" element={<FileUploader title="3. Financial Document Upload" description="Upload actual financial invoices." currentData={getFileData('ZFIDOC')} onDataLoaded={updateFI} requiredHeaders={fiHeaders} />} />
          <Route path="upload/cogs" element={<FileUploader title="4. COGS Data Upload" description="Upload Cost of Goods Sold data." currentData={getFileData('ZCOGS')} onDataLoaded={updateCOGS} requiredHeaders={cogsHeaders} />} />
          <Route path="upload/list-price" element={<FileUploader title="5. List Price Upload" description="Upload List Price data." currentData={getFileData('ZLISTPRICE')} onDataLoaded={updateListPrice} requiredHeaders={listPriceHeaders} />} />
          <Route path="upload/customer-hierarchy" element={<FileUploader title="6. Customer Hierarchy Upload" description="Upload Customer Hierarchy Master Data." currentData={getFileData('ZCUSTHIER')} onDataLoaded={updateCustomerHierarchy} requiredHeaders={custHierarchyHeaders} />} />
          <Route path="upload/dispute" element={<FileUploader title="7. Dispute Case Upload" description="Upload Dispute Case Management data." currentData={getFileData('ZDISPUTE')} onDataLoaded={updateDispute} requiredHeaders={disputeHeaders} />} />
          
          {/* Authorization Routes */}
          <Route path="role/user" element={<UserManagementPage />} />
          <Route path="role/menu" element={<MenuRolePage />} />
          <Route path="role/button" element={<ButtonRolePage />} />

          {/* Trade Promotion Routes */}
          <Route path="trade-promotion" element={<TradePromotion />} />
          <Route path="trade-promotion/:id" element={<PromotionDetail />} />

          {/* Claim Routes */}
          <Route path="claim/deduction" element={<DeductionClaim />} />
          <Route path="claim/deduction/:id" element={<DeductionClaimDetail />} />

          {/* Mapping Routes */}
          <Route path="mapping" element={<CustomerMappingPage onUpdateMappings={updateMappings} />} />
          <Route path="mapping/material" element={<MaterialMappingPage onUpdateMappings={updateMaterialMappings} />} />

          {/* Analysis Routes */}
          <Route path="preview" element={<DataPreview key={lastUpdate} />} />
          <Route path="report" element={<ROIReport />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

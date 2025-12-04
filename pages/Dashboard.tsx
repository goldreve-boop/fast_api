
import React from 'react';
import { Link } from 'react-router-dom';
import { SAP_DB } from '../services/sapDatabase';
import { TrendingUp, FileSpreadsheet, Receipt, ArrowRight, CheckCircle2, Circle, DollarSign, Tag, Network, AlertCircle, Coins } from 'lucide-react';

const Dashboard: React.FC = () => {
  const steps = [
    {
      title: "Nielsen Data",
      description: "Market share and sales volume data",
      uploaded: SAP_DB.ZNIELSEN.length > 0,
      link: "/upload/nielsen",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Promotion Data",
      description: "Marketing calendars and spend allocation",
      uploaded: SAP_DB.ZPROMOTION.length > 0,
      link: "/upload/promotion",
      icon: FileSpreadsheet,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      title: "Promotion Spend",
      description: "Spend Rates & Type Descriptions",
      uploaded: SAP_DB.ZPROMOSPEND.length > 0,
      link: "/upload/promotion-spend",
      icon: Coins,
      color: "text-yellow-600",
      bg: "bg-yellow-100"
    },
    {
      title: "FI Document",
      description: "Financial invoices and actuals",
      uploaded: SAP_DB.ZFIDOC.length > 0,
      link: "/upload/fi",
      icon: Receipt,
      color: "text-emerald-600",
      bg: "bg-emerald-100"
    },
    {
      title: "COGS Data",
      description: "Cost of Goods Sold (MATNR, COGS)",
      uploaded: SAP_DB.ZCOGS.length > 0,
      link: "/upload/cogs",
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-100"
    },
    {
      title: "List Price",
      description: "Product List Price (MATNR, LISTPRICE)",
      uploaded: SAP_DB.ZLISTPRICE.length > 0,
      link: "/upload/list-price",
      icon: Tag,
      color: "text-pink-600",
      bg: "bg-pink-100"
    },
    {
      title: "Cust. Hierarchy",
      description: "Customer Hierarchy (Hier6 - Hier2)",
      uploaded: SAP_DB.ZCUSTHIER.length > 0,
      link: "/upload/customer-hierarchy",
      icon: Network,
      color: "text-cyan-600",
      bg: "bg-cyan-100"
    },
    {
      title: "Dispute Case",
      description: "Dispute Management Data",
      uploaded: SAP_DB.ZDISPUTE.length > 0,
      link: "/upload/dispute",
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-100"
    }
  ];

  const allUploaded = steps.every(s => s.uploaded);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, Analytics</h1>
          <p className="text-slate-500 mt-2">Track your data upload progress to generate the ROI Report.</p>
        </div>
        {allUploaded && (
          <Link 
            to="/report" 
            className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Generate Report <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link 
              key={step.title}
              to={step.link} 
              className={`
                group relative p-6 bg-white rounded-xl shadow-sm border transition-all duration-200
                ${step.uploaded ? 'border-green-200 hover:border-green-300' : 'border-slate-200 hover:border-indigo-300'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${step.bg} ${step.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {step.uploaded ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300" />
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{step.description}</p>
              
              <div className="flex items-center text-sm font-medium">
                {step.uploaded ? (
                  <span className="text-green-600">Uploaded</span>
                ) : (
                  <span className="text-indigo-600 group-hover:underline">Upload File &rarr;</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready for AI Analysis?</h2>
          <p className="text-slate-300 mb-6">
            Once all datasets are uploaded, our Gemini-powered engine will cross-reference Nielsen performance against your promotion spend, financial actuals, and cost data to calculate true ROI.
          </p>
          {allUploaded ? (
            <Link 
              to="/report"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Go to Report
            </Link>
          ) : (
            <div className="inline-flex items-center px-4 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm">
              Complete uploads to unlock analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  FileText, 
  Zap, 
  BarChart3, 
  Plus, 
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Network
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

interface FinancialData {
  month: string;
  actual: number;
  budget: number;
  forecast: number;
}

const MOCK_DATA: Record<string, FinancialData[]> = {
  revenue: [
    { month: 'Jan', actual: 420000, budget: 400000, forecast: 410000 },
    { month: 'Feb', actual: 380000, budget: 410000, forecast: 390000 },
    { month: 'Mar', actual: 450000, budget: 420000, forecast: 440000 },
    { month: 'Apr', actual: 480000, budget: 430000, forecast: 470000 },
    { month: 'May', actual: 460000, budget: 440000, forecast: 465000 },
    { month: 'Jun', actual: 510000, budget: 450000, forecast: 500000 },
  ],
  opex: [
    { month: 'Jan', actual: 120000, budget: 110000, forecast: 115000 },
    { month: 'Feb', actual: 130000, budget: 115000, forecast: 125000 },
    { month: 'Mar', actual: 115000, budget: 120000, forecast: 118000 },
    { month: 'Apr', actual: 140000, budget: 125000, forecast: 135000 },
    { month: 'May', actual: 135000, budget: 130000, forecast: 132000 },
    { month: 'Jun', actual: 150000, budget: 135000, forecast: 145000 },
  ],
  ebitda: [
    { month: 'Jan', actual: 300000, budget: 290000, forecast: 295000 },
    { month: 'Feb', actual: 250000, budget: 295000, forecast: 265000 },
    { month: 'Mar', actual: 335000, budget: 300000, forecast: 322000 },
    { month: 'Apr', actual: 340000, budget: 305000, forecast: 335000 },
    { month: 'May', actual: 325000, budget: 310000, forecast: 333000 },
    { month: 'Jun', actual: 360000, budget: 315000, forecast: 355000 },
  ],
};

export default function AIFPNAStudio({ user }: { user: any }) {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'opex' | 'ebitda'>('revenue');
  const [data, setData] = useState<FinancialData[]>(MOCK_DATA.revenue);
  const [narrative, setNarrative] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setData(MOCK_DATA[selectedMetric]);
  }, [selectedMetric]);

  // Calculate Variances
  const varianceData = useMemo(() => {
    return data.map(item => ({
      ...item,
      budgetVariance: item.actual - item.budget,
      budgetVariancePct: ((item.actual - item.budget) / item.budget) * 100,
      forecastVariance: item.actual - item.forecast,
      forecastVariancePct: ((item.actual - item.forecast) / item.forecast) * 100,
    }));
  }, [data]);

  const totals = useMemo(() => {
    const actual = data.reduce((acc, curr) => acc + curr.actual, 0);
    const budget = data.reduce((acc, curr) => acc + curr.budget, 0);
    const forecast = data.reduce((acc, curr) => acc + curr.forecast, 0);
    return {
      actual,
      budget,
      forecast,
      variance: actual - budget,
      variancePct: ((actual - budget) / budget) * 100
    };
  }, [data]);

  const generateNarrative = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
        As a Senior FP&A Manager, analyze the following financial data for the last 6 months:
        ${JSON.stringify(varianceData)}
        
        Total Actual: ₹${totals.actual.toLocaleString('en-IN')}
        Total Budget: ₹${totals.budget.toLocaleString('en-IN')}
        Total Variance: ₹${totals.variance.toLocaleString('en-IN')} (${totals.variancePct.toFixed(2)}%)
        
        Provide a concise, professional executive summary including:
        1. Key drivers of the variance.
        2. Risks and opportunities for the next quarter.
        3. Strategic recommendations.
        Format with clear headings and bullet points.
      `;

      // PII Masking Proxy
      const { maskPII, unmaskPII } = await import('@/lib/pii');
      const { logAuditTrail } = await import('@/lib/audit');
      
      const { maskedText: maskedPrompt, mapping } = maskPII(prompt);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: maskedPrompt,
      });

      const rawNarrative = response.text || 'Failed to generate narrative.';
      
      // Unmask PII
      const finalNarrative = unmaskPII(rawNarrative, mapping);
      
      // Audit-Trail Logging
      await logAuditTrail(user?.uid || 'unknown', user?.orgId || 'default-org', prompt, varianceData, finalNarrative);

      setNarrative(finalNarrative);
    } catch (error) {
      console.error('Error generating narrative:', error);
      setNarrative('Error generating narrative. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <BarChart3 size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">FP&A Intelligence</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter leading-none mb-2">FP&A STUDIO</h2>
          <p className="text-zinc-500 max-w-md">Automated variance analysis, rolling forecasts, and AI-driven board narratives.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generateNarrative}
            disabled={isGenerating}
            className="px-6 py-3 bg-emerald-500 text-black rounded-xl text-sm font-black hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? 'ANALYZING...' : 'GENERATE NARRATIVE'}
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-zinc-900 text-white border border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 active:scale-95">
            <Download size={18} />
            EXPORT PACK
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Actual Revenue', value: `₹${(totals.actual / 10000000).toFixed(2)}Cr`, sub: 'YTD Performance', icon: TrendingUp, color: 'text-white' },
          { label: 'Predicted Revenue', value: '₹14.2Cr', sub: 'End of Year', icon: Sparkles, color: 'text-emerald-400' },
          { label: 'Next Year Forecast', value: '₹18.5Cr', sub: 'AI Projection', icon: ArrowUpRight, color: 'text-blue-400' },
          { label: 'Budget Variance', value: `₹${(totals.variance / 100000).toFixed(1)}L`, sub: `${totals.variancePct > 0 ? '+' : ''}${totals.variancePct.toFixed(1)}% vs Budget`, icon: ArrowUpRight, color: totals.variance >= 0 ? 'text-emerald-500' : 'text-rose-500' },
          { label: 'Forecast Accuracy', value: '98.4%', sub: 'Last 3 Months', icon: CheckCircle2, color: 'text-indigo-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{kpi.label}</span>
              <kpi.icon size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </div>
            <div className={`text-2xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] text-zinc-500 mt-1 font-medium">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analysis Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <BarChart3 size={200} />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Financial Performance Trend</h3>
                <p className="text-xs text-zinc-500">Actuals vs. Budget vs. Rolling Forecast</p>
              </div>
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                {(['revenue', 'opex', 'ebitda'] as const).map(m => (
                  <button 
                    key={m}
                    onClick={() => setSelectedMetric(m)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedMetric === m ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#525252" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    fontFamily="var(--font-mono)"
                  />
                  <YAxis 
                    stroke="#525252" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `₹${v/1000}k`}
                    fontFamily="var(--font-mono)"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Area 
                    key={`actual-${selectedMetric}`}
                    name="Actual"
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    strokeWidth={4} 
                    animationDuration={1500}
                  />
                  <Area 
                    key={`budget-${selectedMetric}`}
                    name="Budget"
                    type="monotone" 
                    dataKey="budget" 
                    stroke="#6366f1" 
                    fillOpacity={1} 
                    fill="url(#colorBudget)" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                  />
                  <Line 
                    key={`forecast-${selectedMetric}`}
                    name="Forecast"
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast Dependencies */}
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-6">
              <Network size={20} className="text-blue-400" />
              <h3 className="text-lg font-bold">Forecast Dependencies</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Cloud Infrastructure', dependency: 'Usage-based', detail: 'AWS/GCP billing cycles and auto-scaling events.', impact: 'High' },
                { label: 'Sales Pipeline', dependency: 'Conversion Rate', detail: 'Weighted average of Stage 3+ opportunities in CRM.', impact: 'Critical' },
                { label: 'Hiring Plan', dependency: 'Headcount', detail: 'Ramp-up time for new engineers (avg 3 months).', impact: 'Medium' },
                { label: 'Market Volatility', dependency: 'External', detail: 'Currency fluctuations (USD/INR) and interest rates.', impact: 'Low' },
              ].map((dep, i) => (
                <div key={i} className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold">{dep.label}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      dep.impact === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                      dep.impact === 'High' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>{dep.impact} Impact</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2"><span className="text-zinc-600 font-bold uppercase tracking-tighter">Dep:</span> {dep.dependency}</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{dep.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Variance Table */}
          <div className="bg-[#0f0f0f] rounded-3xl border border-zinc-800/50 overflow-hidden">
            <div className="p-6 border-bottom border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">Variance Analysis Table</h3>
              <div className="flex gap-2">
                <button onClick={() => alert('Filter applied')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
                  <Filter size={16} />
                </button>
                <button onClick={() => window.print()} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">Month</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">Actual</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">Budget</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">Variance (₹)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">Variance (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {varianceData.map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-900/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-sm">{row.month}</td>
                      <td className="px-6 py-4 font-bold text-sm">₹{row.actual.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">₹{row.budget.toLocaleString('en-IN')}</td>
                      <td className={`px-6 py-4 text-sm font-bold ${row.budgetVariance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {row.budgetVariance >= 0 ? '+' : ''}{row.budgetVariance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black ${row.budgetVariancePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {row.budgetVariancePct >= 0 ? '+' : ''}{row.budgetVariancePct.toFixed(1)}%
                          </span>
                          <div className="flex-1 h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${row.budgetVariancePct >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(Math.abs(row.budgetVariancePct) * 5, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: AI Narrative & Insights */}
        <div className="space-y-6">
          <div className="bg-[#0f0f0f] rounded-3xl border border-zinc-800/50 flex flex-col h-full">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                <h3 className="text-lg font-bold">AI Narrative</h3>
              </div>
              {isGenerating && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Generating</span>
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
              <AnimatePresence mode="wait">
                {narrative ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert prose-sm max-w-none"
                  >
                    <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed font-medium">
                      {narrative}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <div className="p-4 bg-zinc-900 rounded-full text-zinc-700">
                      <FileText size={40} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400">No Narrative Generated</p>
                      <p className="text-xs text-zinc-600 mt-1">Click the button above to analyze your financial data.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {narrative && (
              <div className="p-6 border-t border-zinc-800 bg-zinc-900/20">
                <button 
                  onClick={() => alert('Saved to Board Pack successfully!')}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                  <Download size={14} />
                  SAVE TO BOARD PACK
                </button>
              </div>
            )}
          </div>

          {/* Optimization Alerts */}
          <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 p-6 rounded-3xl border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-emerald-400" />
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Optimization Alert</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1">
                  <AlertCircle size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">OpEx Efficiency Gap</p>
                  <p className="text-xs text-zinc-400 mt-1">Cloud infrastructure costs are trending 12% above forecast. AI suggests rightsizing 4 instances.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1">
                  <Info size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Revenue Opportunity</p>
                  <p className="text-xs text-zinc-400 mt-1">Expansion revenue from Tier 2 accounts is accelerating. Consider increasing CSM focus here.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}

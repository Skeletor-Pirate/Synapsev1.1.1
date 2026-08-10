'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getStockPrice } from '@/app/actions/stocks';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Bell,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Database,
  Bot,
  Code2,
  ShieldCheck,
  LayoutDashboard,
  Brain,
  Landmark,
  ShoppingBag
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Brush
} from 'recharts';
import RAGView from '@/components/RAGView';
import AgentView from '@/components/AgentView';
import InferenceView from '@/components/InferenceView';
import TrustView from '@/components/TrustView';
import BudgetBrain from './BudgetBrain';
import Treasury from './Treasury';
import DataMarket from './DataMarket';

// Mock Data
const SPEND_DATA_BY_CATEGORY: Record<string, { month: string, spend: number }[]> = {
  All: [
    { month: 'Jan', spend: 4000 },
    { month: 'Feb', spend: 3000 },
    { month: 'Mar', spend: 5000 },
    { month: 'Apr', spend: 2780 },
    { month: 'May', spend: 1890 },
    { month: 'Jun', spend: 2390 },
  ],
  Cloud: [
    { month: 'Jan', spend: 1200 },
    { month: 'Feb', spend: 1100 },
    { month: 'Mar', spend: 1500 },
    { month: 'Apr', spend: 1300 },
    { month: 'May', spend: 1400 },
    { month: 'Jun', spend: 1600 },
  ],
  Marketing: [
    { month: 'Jan', spend: 800 },
    { month: 'Feb', spend: 600 },
    { month: 'Mar', spend: 1200 },
    { month: 'Apr', spend: 400 },
    { month: 'May', spend: 200 },
    { month: 'Jun', spend: 300 },
  ],
  Payroll: [
    { month: 'Jan', spend: 2000 },
    { month: 'Feb', spend: 1300 },
    { month: 'Mar', spend: 2300 },
    { month: 'Apr', spend: 1080 },
    { month: 'May', spend: 290 },
    { month: 'Jun', spend: 490 },
  ],
};

const stockData = {
  'AAPL': [{ time: '10:00', price: 150 }, { time: '11:00', price: 152 }, { time: '12:00', price: 151 }, { time: '13:00', price: 155 }],
  'GOOGL': [{ time: '10:00', price: 2800 }, { time: '11:00', price: 2810 }, { time: '12:00', price: 2805 }, { time: '13:00', price: 2820 }],
};

const STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA'];

/* ── Animated Counter ── */
function AnimatedValue({ value, prefix = '' }: { value: string; prefix?: string }) {
  return (
    <span className="inline-block animate-number" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{value}
    </span>
  );
}

/* ── Custom Tooltip for charts ── */
const ChartTooltipStyle = {
  backgroundColor: 'var(--surface-2)',
  border: '1px solid var(--glass-border)',
  borderRadius: '12px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
  padding: '10px 14px',
};

export default function Dashboard({ user, liveFeed = [] }: { user: any, liveFeed?: any[] }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [currency, setCurrency] = useState('INR');
  const [timeframe, setTimeframe] = useState('6M');
  const [category, setCategory] = useState('All');
  const [stockPrices, setStockPrices] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchPrices() {
      const prices: Record<string, any> = {};
      for (const symbol of STOCKS) {
        const data = await getStockPrice(symbol);
        if (data) prices[symbol] = data;
      }
      setStockPrices(prices);
    }
    fetchPrices();
  }, []);

  const filteredSpendData = React.useMemo(() => {
    return SPEND_DATA_BY_CATEGORY[category] || SPEND_DATA_BY_CATEGORY.All;
  }, [category]);

  const exchangeRates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 151.2,
    'INR': 83.4,
    'CAD': 1.35,
    'AUD': 1.52,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'rag', label: 'RAG Layer', icon: Database },
    { id: 'agents', label: 'Agentic Layer', icon: Bot },
    { id: 'budget', label: 'Budget Brain', icon: Brain },
    { id: 'treasury', label: 'Treasury', icon: Landmark },
    { id: 'market', label: 'Data Market', icon: ShoppingBag },
    { id: 'inference', label: 'Inference Layer', icon: Code2 },
    { id: 'trust', label: 'Trust & Control', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            FinRAG Pro
          </h2>
          <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Real-time financial intelligence for your organization.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 hover:bg-white/[0.06] active:scale-95"
            style={{ border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
          >
            Export Report
          </button>
          {user?.role !== 'viewer' && (
            <button 
              onClick={() => alert('New Transaction modal would open here')} 
              className="px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95"
              style={{ 
                background: 'var(--accent-primary)', 
                color: 'white',
                boxShadow: '0 2px 8px var(--accent-primary-glow)',
              }}
            >
              New Transaction
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Bar with sliding indicator ── */}
      <div className="relative">
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap relative"
                style={{
                  background: isActive ? 'var(--surface-3)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="h-px mt-2" style={{ background: 'var(--glass-border)' }} />
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'EBITDA', value: '₹2.4Cr', icon: TrendingUp, change: '+12.3%', positive: true },
              { label: 'Last Year Revenue', value: '₹12.8Cr', icon: DollarSign, change: '+8.7%', positive: true },
              { label: 'Current Employees', value: '142', icon: Users, change: '+4', positive: true },
              { label: 'Active Projects', value: '12', icon: Briefcase, change: '-2', positive: false },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="p-5 rounded-xl transition-all duration-200 hover:translate-y-[-1px] group"
                style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <stat.icon size={14} style={{ color: 'var(--text-ghost)' }} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-ghost)' }}>
                      {stat.label}
                    </p>
                  </div>
                  <span 
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ 
                      color: stat.positive ? 'var(--accent-success)' : 'var(--accent-danger)',
                      background: stat.positive ? 'var(--accent-success-dim)' : 'var(--accent-danger-dim)',
                    }}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  <AnimatedValue value={stat.value} />
                </h3>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Spend Analysis */}
            <div 
              className="lg:col-span-2 p-6 rounded-xl h-[380px]"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)' }}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Spend Analysis</h3>
                <div className="flex gap-2">
                  <select 
                    className="text-[10px] font-semibold px-2 py-1 rounded-md border-none outline-none"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                  >
                    <option value="1M">1 Month</option>
                    <option value="3M">3 Months</option>
                    <option value="6M">6 Months</option>
                  </select>
                  <select 
                    className="text-[10px] font-semibold px-2 py-1 rounded-md border-none outline-none"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Payroll">Payroll</option>
                  </select>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="82%">
                <BarChart data={filteredSpendData}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="transparent" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={8} 
                    tick={{ fill: 'var(--text-ghost)', fontWeight: 500 }}
                  />
                  <YAxis 
                    stroke="transparent" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `₹${v}`}
                    tick={{ fill: 'var(--text-ghost)', fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={ChartTooltipStyle}
                    itemStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)' }}
                    labelStyle={{ color: 'var(--text-ghost)', marginBottom: '4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spend']}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="spend" fill="url(#colorSpend)" radius={[6, 6, 0, 0]} />
                  <Brush 
                    dataKey="month" 
                    height={24} 
                    stroke="rgba(255,255,255,0.06)" 
                    fill="var(--surface-1)" 
                    tickFormatter={() => ''} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock & Currency */}
            <div className="space-y-4">
              {/* Stock card */}
              <div 
                className="p-5 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)' }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live Stock</h3>
                  <select 
                    className="text-[10px] font-semibold px-2 py-1 rounded-md border-none outline-none"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                    value={selectedStock}
                    onChange={(e) => setSelectedStock(e.target.value)}
                  >
                    {STOCKS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                {stockPrices[selectedStock] ? (
                  <div className="mb-4">
                    <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      ${stockPrices[selectedStock].price.toFixed(2)}
                    </div>
                    <div 
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: stockPrices[selectedStock].change >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}
                    >
                      {stockPrices[selectedStock].change >= 0 ? '+' : ''}{stockPrices[selectedStock].change.toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-xs animate-shimmer h-8 rounded" style={{ color: 'var(--text-ghost)' }}>
                    Loading…
                  </div>
                )}

                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockData[selectedStock as keyof typeof stockData] || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="time" stroke="transparent" fontSize={9} tickLine={false} axisLine={false} dy={4} tick={{ fill: 'var(--text-ghost)' }} />
                      <YAxis domain={['auto', 'auto']} stroke="transparent" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={36} tick={{ fill: 'var(--text-ghost)' }} />
                      <Tooltip 
                        contentStyle={ChartTooltipStyle}
                        itemStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)' }}
                        labelStyle={{ color: 'var(--text-ghost)', fontSize: '10px', fontWeight: 600 }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="var(--accent-purple)" 
                        strokeWidth={2} 
                        dot={{ r: 2.5, fill: 'var(--accent-purple)', strokeWidth: 0 }} 
                        activeDot={{ r: 4, fill: 'white', stroke: 'var(--accent-purple)', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Currency card */}
              <div 
                className="p-5 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)' }}
              >
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Currency Rates</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {Object.entries(exchangeRates).map(([curr, rate]) => (
                    <div key={curr} className="flex items-center justify-between text-xs py-1">
                      <span style={{ color: 'var(--text-ghost)' }}>{curr}</span>
                      <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {rate.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Live Transaction Stream ── */}
          <div 
            className="p-6 rounded-xl h-[360px] flex flex-col"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live Transaction Stream</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-breathe" style={{ background: 'var(--accent-success)' }} />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--accent-success)' }}>LIVE</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {liveFeed && liveFeed.length === 0 ? (
                <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-ghost)' }}>
                  <p className="text-sm">Waiting for live data…</p>
                </div>
              ) : (
                liveFeed?.map((tx: any) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-3.5 rounded-lg transition-colors duration-150 hover:bg-white/[0.02]"
                    style={{ border: '1px solid var(--glass-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ 
                          background: tx.type === 'inflow' ? 'var(--accent-success-dim)' : 'var(--accent-danger-dim)',
                          color: tx.type === 'inflow' ? 'var(--accent-success)' : 'var(--accent-danger)',
                        }}
                      >
                        {tx.type === 'inflow' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {tx.vendor || tx.category}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p 
                        className="text-xs font-bold tabular-nums"
                        style={{ 
                          color: tx.type === 'inflow' ? 'var(--accent-success)' : 'var(--accent-danger)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {tx.type === 'inflow' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-ghost)' }}>
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rag' && <RAGView user={user} />}
      {activeTab === 'agents' && <AgentView user={user} />}
      {activeTab === 'budget' && <BudgetBrain user={user} />}
      {activeTab === 'treasury' && <Treasury user={user} />}
      {activeTab === 'market' && <DataMarket user={user} />}
      {activeTab === 'inference' && <InferenceView />}
      {activeTab === 'trust' && <TrustView />}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
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

export default function Dashboard({ user, liveFeed }: { user: any, liveFeed: any[] }) {
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
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">FinRAG Pro</h2>
          <p className="text-zinc-500 text-sm font-medium">Real-time financial intelligence for your organization.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium border border-zinc-800 hover:bg-zinc-800 transition-colors">Export Report</button>
          {user?.role !== 'viewer' && (
            <button onClick={() => alert('New Transaction modal would open here')} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">New Transaction</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-zinc-800 pb-px overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                isActive 
                  ? 'bg-zinc-900 border-t border-l border-r border-zinc-800 text-emerald-400' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'EBITDA', value: '₹2.4Cr', icon: TrendingUp },
          { label: 'Last Year Revenue', value: '₹12.8Cr', icon: DollarSign },
          { label: 'Current Employees', value: '142', icon: Users },
          { label: 'Active Projects', value: '12', icon: Briefcase },
        ].map((stat, i) => (
          <div key={i} className="bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={16} className="text-zinc-500" />
              <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Analysis Chart */}
        <div className="lg:col-span-2 bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 h-[400px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Spend Analysis</h3>
            <div className="flex gap-2">
              <select 
                className="bg-zinc-900 text-xs p-2 rounded border border-zinc-800"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
              </select>
              <select 
                className="bg-zinc-900 text-xs p-2 rounded border border-zinc-800"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Software">Software</option>
                <option value="Travel">Travel</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={filteredSpendData}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="month" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} dy={10} fontFamily="var(--font-mono)" />
              <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} fontFamily="var(--font-mono)" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}
                labelStyle={{ color: '#71717a', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spend']}
              />
              <Bar dataKey="spend" fill="url(#colorSpend)" radius={[4, 4, 0, 0]} />
              <Brush dataKey="month" height={30} stroke="#525252" fill="#09090b" tickFormatter={() => ''} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Analysis & Currency */}
        <div className="space-y-6">
          <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Live Stock Analysis</h3>
              <select 
                className="bg-zinc-900 text-xs p-1 rounded border border-zinc-800"
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
              >
                {STOCKS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            {stockPrices[selectedStock] ? (
              <div className="mb-4">
                <div className="text-3xl font-bold">${stockPrices[selectedStock].price.toFixed(2)}</div>
                <div className={`text-sm font-medium ${stockPrices[selectedStock].change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stockPrices[selectedStock].change >= 0 ? '+' : ''}{stockPrices[selectedStock].change.toFixed(2)}%
                </div>
              </div>
            ) : (
              <div className="mb-4 text-sm text-zinc-500">Loading live data...</div>
            )}

            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockData[selectedStock as keyof typeof stockData] || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="time" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={5} fontFamily="var(--font-mono)" />
                  <YAxis domain={['auto', 'auto']} stroke="#525252" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} fontFamily="var(--font-mono)" width={40} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1' }}
                    labelStyle={{ color: '#71717a', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                  />
                  <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={3} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <h3 className="font-bold mb-4">Currency Rates (Base: USD)</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(exchangeRates).map(([curr, rate]) => (
                <div key={curr} className="text-xs text-zinc-400">
                  {curr}: <span className="font-bold text-white">{rate.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Transaction Stream */}
      <div className="bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 h-[400px] flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <h3 className="text-lg font-bold mb-6">Live Transaction Stream</h3>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {liveFeed && liveFeed.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-600 italic">
              Waiting for live data...
            </div>
          ) : (
            liveFeed?.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'inflow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tx.type === 'inflow' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{tx.vendor || tx.category}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{tx.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'inflow' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'inflow' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-zinc-600">{new Date(tx.timestamp).toLocaleTimeString()}</p>
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

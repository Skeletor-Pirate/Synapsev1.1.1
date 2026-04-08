'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCcw, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Zap,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Target,
  Sparkles
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { predictMarketGrowth } from '@/lib/orchestrator-client';

export default function InvestIQ({ user }: { user: any }) {
  const [investments, setInvestments] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const handleSweepSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const runPrediction = async () => {
    setIsPredicting(true);
    try {
      const res = await predictMarketGrowth();
      setPrediction(res);
    } catch (error) {
      console.error("Prediction failed:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    runPrediction();
  }, []);

  const yieldData = [
    { month: 'Jan', yield: 4.2 },
    { month: 'Feb', yield: 4.5 },
    { month: 'Mar', yield: 4.8 },
    { month: 'Apr', yield: 5.1 },
    { month: 'May', yield: 5.4 },
    { month: 'Jun', yield: 5.8 },
  ];

  const ladderData = [
    { instrument: 'FD - HDFC', amount: '₹1,20,00,000', yield: '7.2%', maturity: 'June 15, 2026' },
    { instrument: 'Liquid Fund - ICICI', amount: '₹85,00,000', yield: '6.8%', maturity: 'Daily' },
    { instrument: 'T-Bills', amount: '₹2,50,00,000', yield: '6.5%', maturity: 'Sept 30, 2026' },
    { instrument: 'Corporate Bond', amount: '₹1,50,00,000', yield: '8.1%', maturity: 'Dec 12, 2026' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-500">InvestIQ</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Yield Optimization</h2>
          <p className="text-zinc-500">Idle cash management and mutual fund sweep automation.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSweepSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium border border-zinc-800 hover:bg-zinc-800 flex items-center gap-2"
          >
            <RefreshCcw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing Sweeps...' : 'Sync Sweeps'}
          </button>
          <button onClick={() => alert('New Investment modal would open here')} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 flex items-center gap-2">
            <Plus size={16} />
            New Investment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-sm font-medium">Invested Capital</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold tracking-tight">₹6.05Cr</h3>
            <span className="text-xs font-bold text-emerald-500">+12.4%</span>
          </div>
        </div>
        <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-sm font-medium">Weighted Avg. Yield</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold tracking-tight">7.12%</h3>
            <span className="text-xs font-bold text-emerald-500">+0.42%</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={40} />
          </div>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">AI Market Predictor</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black tracking-tighter text-white">
              {isPredicting ? '...' : prediction?.prediction?.growth || '+0.8%'}
            </h3>
            <span className="text-xs font-bold text-emerald-400">
              {isPredicting ? '' : prediction?.prediction?.sentiment || 'Bullish'}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 line-clamp-1">
            {isPredicting ? 'Analyzing global trends...' : prediction?.prediction?.summary || 'Tech and Rare Earths showing strong momentum.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
          <h3 className="text-lg font-bold mb-8">Yield Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yieldData}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="month" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="yield" stroke="#a855f7" fillOpacity={1} fill="url(#colorYield)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Target size={20} className="text-emerald-400" />
            AI Recommendations
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {isPredicting ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                <RefreshCcw size={24} className="animate-spin mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Generating Alpha...</p>
              </div>
            ) : (
              prediction?.recommendations?.map((rec: any, i: number) => (
                <div key={i} className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-white">{rec.asset}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      rec.rating === 'Buy' ? 'bg-emerald-500/10 text-emerald-500' :
                      rec.rating === 'Sell' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>{rec.rating}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2"><span className="text-zinc-700 font-bold uppercase">Type:</span> {rec.type}</p>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{rec.benefit}</p>
                </div>
              )) || (
                <div className="text-center py-8 text-zinc-600 text-xs">No recommendations available.</div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
        <h3 className="text-lg font-bold mb-6">Maturity Ladder</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest">
                <th className="pb-4 font-bold">Instrument</th>
                <th className="pb-4 font-bold">Amount</th>
                <th className="pb-4 font-bold">Yield</th>
                <th className="pb-4 font-bold">Maturity Date</th>
                <th className="pb-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {ladderData.map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors group">
                  <td className="py-4 font-bold">{row.instrument}</td>
                  <td className="py-4">{row.amount}</td>
                  <td className="py-4 text-emerald-500 font-bold">{row.yield}</td>
                  <td className="py-4 text-zinc-400">{row.maturity}</td>
                  <td className="py-4">
                    <button onClick={() => alert('Viewing details')} className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

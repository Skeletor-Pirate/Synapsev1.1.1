'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Landmark, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCcw, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Zap,
  CreditCard,
  Wallet,
  Users
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function Treasury({ user }: { user: any }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const liquidityMetrics = [
    { label: 'Total Liquidity', value: '₹1,24,00,000', change: '+12.4%', icon: Landmark, color: 'text-emerald-500' },
    { label: 'Cash Flow (MTD)', value: '+₹1,42,500', change: '+5.2%', icon: Zap, color: 'text-blue-500' },
    { label: 'Crypto Assets', value: '₹85,200', change: '-2.1%', icon: Wallet, color: 'text-amber-500' },
    { label: 'Amount in Hand', value: '₹42,000', change: 'Stable', icon: CreditCard, color: 'text-zinc-400' },
    { label: 'Bonds & T-Bills', value: '₹4,50,000', change: '+0.5%', icon: ShieldCheck, color: 'text-purple-500' },
  ];

  const cashData = [
    { name: 'HDFC Bank', balance: 450000, color: '#1e40af' },
    { name: 'ICICI Bank', balance: 280000, color: '#ea580c' },
    { name: 'SVB', balance: 125000, color: '#0284c7' },
    { name: 'Mercury', balance: 85000, color: '#000000' },
    { name: 'Coinbase', balance: 85200, color: '#2563eb' },
  ];

  const forecastData = [
    { day: '30D', inflow: 120000, outflow: 95000 },
    { day: '60D', inflow: 145000, outflow: 110000 },
    { day: '90D', inflow: 160000, outflow: 135000 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Landmark size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Treasury</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Treasury Management</h2>
          <p className="text-zinc-500">Unified visibility into liquidity, cash flow, and multi-asset holdings.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium border border-zinc-800 hover:bg-zinc-800 flex items-center gap-2"
          >
            <RefreshCcw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </button>
          <button onClick={() => alert('Connect Account modal would open here')} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 flex items-center gap-2">
            <Plus size={16} />
            Connect Account
          </button>
        </div>
      </div>

      {/* Liquidity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {liquidityMetrics.map((m, i) => (
          <div key={i} className="bg-[#0f0f0f] p-5 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <m.icon size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              <span className={`text-[10px] font-bold ${m.color}`}>{m.change}</span>
            </div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{m.label}</p>
            <h3 className="text-xl font-bold tracking-tight mt-1">{m.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
          <h3 className="text-lg font-bold mb-8">Asset Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
                <XAxis type="number" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: '#18181b' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
                  {cashData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
          <h3 className="text-lg font-bold mb-8">Liquidity Forecast</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="day" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#18181b' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="inflow" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
          <h3 className="text-lg font-bold mb-6">Connected Accounts</h3>
          <div className="space-y-4">
            {[
              { name: 'HDFC Bank - Current', acc: '**** 4291', balance: '₹4,50,000', status: 'Connected', icon: Landmark },
              { name: 'ICICI Bank - Savings', acc: '**** 8821', balance: '₹2,80,000', status: 'Connected', icon: Landmark },
              { name: 'Coinbase - Primary', acc: 'BTC/ETH/SOL', balance: '₹85,200', status: 'Connected', icon: Wallet },
              { name: 'SVB - Venture Debt', acc: '**** 5567', balance: '₹1,25,000', status: 'Syncing', icon: Landmark },
            ].map((acc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <acc.icon size={24} />
                  </div>
                  <div>
                    <p className="font-bold">{acc.name}</p>
                    <p className="text-xs text-zinc-500">{acc.acc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{acc.balance}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <div className={`w-1.5 h-1.5 rounded-full ${acc.status === 'Connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{acc.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
          <h3 className="text-lg font-bold mb-6">Top Investors</h3>
          <div className="space-y-4">
            {[
              { name: 'Sequoia Capital', round: 'Series B', amount: '₹12.5Cr', date: 'Jan 2024', icon: Users },
              { name: 'Andreessen Horowitz', round: 'Series B', amount: '₹8.0Cr', date: 'Jan 2024', icon: Users },
              { name: 'Tiger Global', round: 'Series A', amount: '₹5.2Cr', date: 'June 2023', icon: Users },
              { name: 'Y Combinator', round: 'Seed', amount: '₹50L', date: 'Dec 2022', icon: Users },
            ].map((inv, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <inv.icon size={24} />
                  </div>
                  <div>
                    <p className="font-bold">{inv.name}</p>
                    <p className="text-xs text-zinc-500">{inv.round}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{inv.amount}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{inv.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ChevronRight,
  Globe,
  Lock,
  Zap,
  Tag,
  Star,
  RefreshCcw
} from 'lucide-react';

export default function DataMarket({ user }: { user: any }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'browse' | 'subscriptions' | 'api'>('browse');

  const categories = ['All', 'Financial', 'Consumer', 'B2B', 'Alternative', 'Real Estate'];
  
  const datasets = [
    { id: 1, name: 'SaaS Benchmark Data 2024', category: 'Financial', price: '₹40,000/mo', rating: 4.8, providers: 'ChartMogul', description: 'Aggregated, anonymized SaaS metrics across 2000+ companies.' },
    { id: 2, name: 'Consumer Spending Patterns', category: 'Consumer', price: '₹1,00,000/mo', rating: 4.9, providers: 'Visa/Mastercard', description: 'Real-time consumer transaction trends by region and category.' },
    { id: 3, name: 'Global Supply Chain Logistics', category: 'B2B', price: '₹70,000/mo', rating: 4.5, providers: 'Flexport', description: 'Live tracking of container movements and port congestion data.' },
    { id: 4, name: 'Satellite Imagery - Retail Traffic', category: 'Alternative', price: '₹2,00,000/mo', rating: 4.7, providers: 'Orbital Insight', description: 'Parking lot occupancy data for top 500 US retailers.' },
  ];

  const subscriptions = [
    { id: 1, name: 'SaaS Benchmark Data 2024', status: 'Active', nextBilling: 'Apr 15, 2026', usage: '85%' },
    { id: 2, name: 'Global Supply Chain Logistics', status: 'Active', nextBilling: 'Apr 22, 2026', usage: '42%' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Database size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">DataMarket</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Data Intelligence Market</h2>
          <p className="text-zinc-500">Access premium datasets and API streams for financial modeling.</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'browse' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Browse
          </button>
          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'subscriptions' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Subscriptions
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'api' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            API Access
          </button>
        </div>
      </div>

      {activeTab === 'browse' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                  selectedCategory === cat 
                    ? 'bg-white text-black border-white' 
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {datasets.filter(d => selectedCategory === 'All' || d.category === selectedCategory).map(dataset => (
              <div key={dataset.id} className="bg-[#0f0f0f] p-6 rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 group-hover:text-blue-400 transition-colors">
                    <Database size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{dataset.price}</p>
                    <div className="flex items-center gap-1 justify-end text-amber-500">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-bold">{dataset.rating}</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{dataset.name}</h3>
                <p className="text-sm text-zinc-500 mb-6 line-clamp-2">{dataset.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Provider: {dataset.providers}</span>
                  <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-[#0f0f0f] rounded-3xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dataset</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Next Billing</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Usage</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/20 transition-colors">
                  <td className="p-6">
                    <p className="font-bold text-white">{sub.name}</p>
                  </td>
                  <td className="p-6">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase tracking-widest">
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-zinc-400">{sub.nextBilling}</td>
                  <td className="p-6">
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: sub.usage }} />
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
              <h3 className="text-lg font-bold mb-6">API Keys</h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Production Key</p>
                    <code className="text-sm font-mono text-zinc-300">tk_live_4928...x92k</code>
                  </div>
                  <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
                    <RefreshCcw size={16} />
                  </button>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Sandbox Key</p>
                    <code className="text-sm font-mono text-zinc-300">tk_test_8812...a11p</code>
                  </div>
                  <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
              <h3 className="text-lg font-bold mb-6">Documentation</h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                  <p className="font-bold mb-1">Authentication Guide</p>
                  <p className="text-xs text-zinc-500">Learn how to authenticate your requests using Bearer tokens.</p>
                </div>
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                  <p className="font-bold mb-1">Endpoints Reference</p>
                  <p className="text-xs text-zinc-500">Detailed documentation for all available data endpoints.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 p-8 rounded-3xl border border-zinc-800/50">
            <h3 className="text-lg font-bold mb-6">Usage Limits</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                  <span className="text-zinc-500">Monthly Requests</span>
                  <span className="text-white">85,402 / 100,000</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                  <span className="text-zinc-500">Rate Limit</span>
                  <span className="text-white">12 / 60 req/min</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '20%' }} />
                </div>
              </div>
              <button className="w-full py-3 bg-white text-black rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

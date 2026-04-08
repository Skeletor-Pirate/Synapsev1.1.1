'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Download,
  Plus,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function VendorIQ({ user }: { user: any }) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const vendorList = [
    { name: 'AWS India', category: 'Cloud Infra', spend: '₹45,20,000', renewal: 'May 12, 2026', score: 92, status: 'Active' },
    { name: 'Google Workspace', category: 'SaaS', spend: '₹12,80,000', renewal: 'April 22, 2026', score: 88, status: 'Expiring' },
    { name: 'Slack Technologies', category: 'SaaS', spend: '₹8,40,000', renewal: 'June 15, 2026', score: 75, status: 'Active' },
    { name: 'Zoom Video', category: 'SaaS', spend: '₹5,20,000', renewal: 'April 10, 2026', score: 62, status: 'Urgent' },
    { name: 'Adobe Creative', category: 'Design', spend: '₹3,10,000', renewal: 'July 01, 2026', score: 81, status: 'Active' },
  ];

  const filteredVendors = vendorList.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Tag size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">VendorIQ</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Vendor Intelligence</h2>
          <p className="text-zinc-500">Contract extraction, vendor scoring, and spend consolidation.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium border border-zinc-800 hover:bg-zinc-800 flex items-center gap-2">
            <Download size={16} />
            Export Audit
          </button>
          <button onClick={() => alert('Add Contract modal would open here')} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 flex items-center gap-2">
            <Plus size={16} />
            Add Contract
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-zinc-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 bg-zinc-900 px-4 py-2 rounded-xl flex items-center gap-3 border border-zinc-800 focus-within:border-zinc-600 transition-colors">
                <Search size={18} className="text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search vendors or contracts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
              <button onClick={() => alert('Filter applied')} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">
                <Filter size={18} className="text-zinc-500" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest">
                    <th className="pb-4 font-bold">Vendor Name</th>
                    <th className="pb-4 font-bold">Category</th>
                    <th className="pb-4 font-bold">Annual Spend</th>
                    <th className="pb-4 font-bold">Renewal Date</th>
                    <th className="pb-4 font-bold">Score</th>
                    <th className="pb-4 font-bold">Status</th>
                    <th className="pb-4 font-bold"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredVendors.map((vendor, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors group">
                      <td className="py-4 font-bold">{vendor.name}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-zinc-900 rounded-lg text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                          {vendor.category}
                        </span>
                      </td>
                      <td className="py-4">{vendor.spend}</td>
                      <td className="py-4 text-zinc-400">{vendor.renewal}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${vendor.score > 80 ? 'bg-emerald-500' : vendor.score > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${vendor.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold">{vendor.score}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          vendor.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 
                          vendor.status === 'Expiring' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => alert('More options')} className="p-1 hover:bg-zinc-800 rounded transition-colors">
                          <MoreHorizontal size={16} className="text-zinc-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-6">Spend Consolidation</h3>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Savings Opportunity</span>
                </div>
                <p className="text-sm font-bold mb-1">Duplicate SaaS Subscriptions</p>
                <p className="text-xs text-zinc-400 mb-3">Both Zoom and Google Meet are being used across 3 departments.</p>
                <p className="text-emerald-500 font-bold text-sm">Potential Savings: ₹1,20,000/yr</p>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <p className="text-sm font-bold mb-1">Unused Licenses</p>
                <p className="text-xs text-zinc-400 mb-3">12 Adobe Creative Cloud licenses have zero activity in 30 days.</p>
                <p className="text-amber-500 font-bold text-sm">Potential Savings: ₹84,000/yr</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-4">Renewal Alerts</h3>
            <div className="space-y-3">
              {[
                { name: 'Zoom Video', days: '2 days', urgent: true },
                { name: 'Google Workspace', days: '14 days', urgent: false },
                { name: 'AWS Reserved Instances', days: '21 days', urgent: false },
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alert.urgent ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-xs font-medium">{alert.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">in {alert.days}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Download,
  Plus,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export default function TaxPilot({ user }: { user: any }) {
  const [taxEvents, setTaxEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleClearTaxSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const deadlines = [
    { title: 'GSTR-1 Filing (Monthly)', date: 'April 11, 2026', status: 'Upcoming', type: 'GST' },
    { title: 'TDS Payment (March)', date: 'April 07, 2026', status: 'Urgent', type: 'TDS' },
    { title: 'Income Tax Return (ITR) Filing', date: 'July 31, 2026', status: 'Upcoming', type: 'Income Tax' },
    { title: 'GSTR-3B Filing (Monthly)', date: 'April 20, 2026', status: 'Upcoming', type: 'GST' },
  ];

  const gstSummary = [
    { label: 'Input Tax Credit (ITC)', value: '₹1,24,500', color: 'text-emerald-500' },
    { label: 'Output Tax Liability', value: '₹1,58,000', color: 'text-rose-500' },
    { label: 'Net GST Payable', value: '₹33,500', color: 'text-white' },
  ];

  const taxBenefits = [
    { section: '80C', limit: '₹1,50,000', claimed: '₹1,20,000', description: 'PPF, ELSS, LIC, etc.' },
    { section: '80D', limit: '₹25,000', claimed: '₹15,000', description: 'Health Insurance' },
    { section: '24(b)', limit: '₹2,00,000', claimed: '₹0', description: 'Home Loan Interest' },
    { section: '80G', limit: 'No Limit', claimed: '₹5,000', description: 'Donations' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500">TaxPilot India</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Tax & Compliance</h2>
          <p className="text-zinc-500">Indian Income Tax Act & GST Compliant Filing System.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleClearTaxSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium border border-zinc-800 hover:bg-zinc-800 flex items-center gap-2"
          >
            <Calculator size={16} />
            {isSyncing ? 'Syncing ITR Data...' : 'Sync ITR Data'}
          </button>
          <button onClick={() => alert('ITR Filing Wizard started')} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 flex items-center gap-2">
            <Plus size={16} />
            File ITR (AY 2026-27)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* GST Section */}
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-8">GST Summary (Current Month)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {gstSummary.map((item, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{item.label}</p>
                  <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="text-sm font-medium">GSTR-1 Data Validated for Indian Filing</span>
              </div>
              <button onClick={() => alert('GST Filing process started')} className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">File GST Now →</button>
            </div>
          </div>

          {/* Tax Benefits Section */}
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Tax Benefits & Deductions (Old Regime)</h3>
              <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Switch to New Regime</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taxBenefits.map((benefit, i) => (
                <div key={i} className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Section {benefit.section}</p>
                      <p className="text-sm font-bold">{benefit.description}</p>
                    </div>
                    <p className="text-xs text-zinc-500">Limit: {benefit.limit}</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Claimed</span>
                      <span className="text-white font-bold">{benefit.claimed}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: benefit.limit === 'No Limit' ? '100%' : `${(parseInt(benefit.claimed.replace(/[^0-9]/g, '')) / parseInt(benefit.limit.replace(/[^0-9]/g, ''))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => alert('Add investment proof modal')} className="w-full mt-6 py-3 border border-dashed border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:border-zinc-600 transition-all">
              + Add Investment Proof
            </button>
          </div>

          {/* TDS Section */}
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-6">TDS Tracking (Form 26AS Sync)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest">
                    <th className="pb-4 font-bold">Section</th>
                    <th className="pb-4 font-bold">Deductor</th>
                    <th className="pb-4 font-bold">Base Amount</th>
                    <th className="pb-4 font-bold">TDS (10%)</th>
                    <th className="pb-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { section: '194J', vendor: 'AWS India (Cloud)', amount: '₹4,20,000', tds: '₹42,000', status: 'Pending' },
                    { section: '194C', vendor: 'BlueDart (Logistics)', amount: '₹1,20,000', tds: '₹12,000', status: 'Paid' },
                    { section: '194J', vendor: 'Google India', amount: '₹2,80,000', tds: '₹28,000', status: 'Pending' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                      <td className="py-4 font-medium">{row.section}</td>
                      <td className="py-4 text-zinc-400">{row.vendor}</td>
                      <td className="py-4">{row.amount}</td>
                      <td className="py-4 text-rose-500 font-bold">{row.tds}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${row.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {row.status}
                        </span>
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
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-zinc-500" />
              Tax Calendar
            </h3>
            <div className="space-y-4">
              {deadlines.map((deadline, i) => (
                <div key={i} className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${deadline.status === 'Urgent' ? 'bg-red-500' : 'bg-zinc-700'}`} />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{deadline.type}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${deadline.status === 'Urgent' ? 'text-red-500' : 'text-zinc-500'}`}>
                      {deadline.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold mb-1">{deadline.title}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock size={12} />
                    {deadline.date}
                  </p>
                </div>
              ))}
            </div>
            <button onClick={() => alert('Syncing to Google Calendar...')} className="w-full mt-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors">
              Sync to Google Calendar
            </button>
          </div>

          <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-6 rounded-2xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Compliance Alert</h3>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              &quot;You have <span className="text-white font-bold">3 vendors</span> with non-compliant GSTINs. Filing with these may result in ITC blockage.&quot;
            </p>
            <button onClick={() => alert('Reviewing non-compliant vendors...')} className="mt-4 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
              Review Non-Compliant Vendors →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

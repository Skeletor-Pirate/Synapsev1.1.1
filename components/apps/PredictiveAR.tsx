'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  FileText,
  Download
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { predictReceivableRisk } from '@/lib/gemini';
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils';

export default function PredictiveAR({ user }: { user: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    if (!user?.orgId) return;

    const q = query(
      collection(db, 'invoices'),
      where('orgId', '==', user.orgId),
      orderBy('dueDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(invs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
    });

    return () => unsubscribe();
  }, [user.orgId]);

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const handleExport = () => {
    const headers = [
      { key: 'id', label: 'Invoice ID' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'riskLevel', label: 'Risk Level' }
    ];
    const exportData = invoices.map(inv => ({
      ...inv,
      riskLevel: getRiskLevel(inv.riskScore)
    }));
    exportToCSV(exportData, 'invoices.csv', headers);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">PredictiveAR</h2>
          <p className="text-zinc-500">Inflow intelligence and autonomous receivables management.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="px-6 py-3 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 flex items-center gap-2 border border-zinc-800"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 flex items-center gap-2">
            <Plus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Receivables', value: '₹1,58,20,000', icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'Avg. Collection Time', value: '22 Days', icon: Clock, color: 'text-zinc-400' },
              { label: 'High Risk Amount', value: '₹12,40,000', icon: AlertCircle, color: 'text-red-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={14} className={stat.color} />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#0f0f0f] rounded-3xl border border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold">Open Invoices</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <Search size={14} className="text-zinc-500" />
                  <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-32" />
                </div>
                <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><Filter size={16} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/30">
                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Customer</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Due Date</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Amount</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Risk Level</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-12 text-center text-zinc-500">Loading invoices...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-zinc-500">No open invoices.</td></tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoice(inv)}
                        className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors cursor-pointer ${selectedInvoice?.id === inv.id ? 'bg-zinc-800/30' : ''}`}
                      >
                        <td className="p-4">
                          <div className="font-bold">{inv.vendor}</div>
                          <div className="text-[10px] text-zinc-500">INV-{inv.id.slice(-6).toUpperCase()}</div>
                        </td>
                        <td className="p-4 text-sm text-zinc-400">{format(new Date(inv.dueDate), 'MMM dd')}</td>
                        <td className="p-4 font-mono font-bold">₹{inv.amount.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${getRiskColor(getRiskLevel(inv.riskScore))}`}>
                            {getRiskLevel(inv.riskScore)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <ChevronRight size={16} className="text-zinc-600" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedInvoice ? (
              <motion.div 
                key={selectedInvoice.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0f0f0f] rounded-3xl border border-zinc-800 p-8 space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">Invoice Details</h3>
                    <p className="text-zinc-500 text-sm">INV-{selectedInvoice.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(getRiskLevel(selectedInvoice.riskScore))}`}>
                    {getRiskLevel(selectedInvoice.riskScore).toUpperCase()} RISK
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Amount Due</span>
                    <span className="font-bold">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Due Date</span>
                    <span className="font-bold">{format(new Date(selectedInvoice.dueDate), 'MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Customer</span>
                    <span className="font-bold">{selectedInvoice.vendor}</span>
                  </div>
                </div>

                <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest">AI Risk Analysis</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This customer has a 78% probability of late payment based on their last 3 transactions. 
                    We recommend sending a soft reminder today.
                  </p>
                  <div className="pt-4 border-t border-zinc-800">
                    <button className="w-full py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                      <Mail size={14} />
                      Send AI Reminder
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">History</p>
                  <div className="space-y-3">
                    <div className="flex gap-3 text-xs">
                      <div className="w-1 h-full bg-emerald-500 rounded-full" />
                      <div>
                        <p className="font-bold">Invoice Created</p>
                        <p className="text-zinc-500">12 days ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <div className="w-1 h-full bg-amber-500 rounded-full" />
                      <div>
                        <p className="font-bold">Soft Reminder Sent</p>
                        <p className="text-zinc-500">5 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800 text-zinc-500">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Select an invoice to view AI insights and take action.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AnimatePresence({ children, mode }: { children: React.ReactNode, mode?: "wait" | "popLayout" | "sync" }) {
  return <>{children}</>;
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  MoreHorizontal,
  Sparkles,
  Download
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { analyzeExpenseAnomaly } from '@/lib/gemini';
import { format } from 'date-fns';
import { exportToCSV } from '@/lib/utils';

export default function SpendSense({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState({
    amount: '',
    vendor: '',
    category: 'Software',
    currency: 'INR',
    type: 'outflow',
    description: ''
  });

  useEffect(() => {
    if (!user?.orgId) return;

    const q = query(
      collection(db, 'transactions'),
      where('orgId', '==', user.orgId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, [user.orgId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const txData = {
      orgId: user.orgId,
      amount: parseFloat(newTx.amount),
      vendor: newTx.vendor,
      category: newTx.category,
      currency: newTx.currency,
      type: newTx.type,
      timestamp: new Date().toISOString(),
      status: 'pending',
      description: newTx.description
    };

    try {
      const docRef = await addDoc(collection(db, 'transactions'), txData);
      setShowAddModal(false);
      
      // Run AI Analysis in background
      const analysis = await analyzeExpenseAnomaly(txData);
      if (analysis) {
        // Update with analysis
        if (analysis.isAnomaly) {
          await addDoc(collection(db, 'alerts'), {
            orgId: user.orgId,
            type: 'anomaly',
            title: 'Spend Anomaly Detected',
            message: `Unusual spend of ${txData.amount} ${txData.currency} at ${txData.vendor}. ${analysis.reason}`,
            timestamp: new Date().toISOString(),
            isRead: false
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const handleExport = () => {
    const headers = [
      { key: 'timestamp', label: 'Date' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
      { key: 'currency', label: 'Currency' },
      { key: 'status', label: 'Status' }
    ];
    exportToCSV(transactions, 'transactions.csv', headers);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">SpendSense</h2>
          <p className="text-zinc-500">Outflow intelligence and autonomous expense monitoring.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="px-6 py-3 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 flex items-center gap-2 border border-zinc-800"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Log Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search size={16} className="text-zinc-500" />
              <input type="text" placeholder="Filter by vendor or category..." className="bg-transparent border-none outline-none text-sm w-full" />
            </div>
            <button onClick={() => alert('Filter applied')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><Filter size={18} /></button>
          </div>

          {/* Transaction List */}
          <div className="bg-[#0f0f0f] rounded-3xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="p-6 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Date</th>
                  <th className="p-6 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Vendor</th>
                  <th className="p-6 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Category</th>
                  <th className="p-6 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Amount</th>
                  <th className="p-6 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Status</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center text-zinc-500">Loading transactions...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center text-zinc-500">No transactions found.</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
                      <td className="p-6 text-sm text-zinc-400">{tx.timestamp ? format(new Date(tx.timestamp), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td className="p-6">
                        <div className="font-bold">{tx.vendor}</div>
                        {tx.isAnomaly && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mt-1">
                            <AlertTriangle size={10} />
                            ANOMALY DETECTED
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-zinc-900 rounded-full text-xs border border-zinc-800">{tx.category}</span>
                      </td>
                      <td className="p-6 font-mono font-bold">
                        {tx.amount.toLocaleString('en-IN', { style: 'currency', currency: tx.currency })}
                      </td>
                      <td className="p-6">
                        <div className={`flex items-center gap-2 text-xs font-bold ${
                          tx.status === 'completed' ? 'text-emerald-500' : 
                          tx.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          {tx.status === 'completed' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                          {tx.status.toUpperCase()}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button onClick={() => alert('More options')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-white text-black p-8 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} />
              <span className="text-xs font-black uppercase tracking-widest">AI Insights</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Your software spend is up 14% this month. We detected 3 duplicate subscriptions for &quot;SaaS Tool X&quot;.
            </p>
            <button onClick={() => alert('Optimization process started')} className="mt-6 w-full py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors">
              Optimize Spend
            </button>
          </div>

          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Top Vendors</h3>
            <div className="space-y-4">
              {[
                { name: 'Amazon Web Services', amount: '₹4,20,000', trend: 'up' },
                { name: 'Google Cloud', amount: '₹2,80,000', trend: 'down' },
                { name: 'Slack Technologies', amount: '₹1,20,000', trend: 'flat' },
              ].map((v, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold">{v.name}</p>
                    <p className="text-xs text-zinc-500">{v.amount}</p>
                  </div>
                  {v.trend === 'up' ? <ArrowUpRight size={16} className="text-red-500" /> : <ArrowDownRight size={16} className="text-emerald-500" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0f0f0f] border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tighter">New Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-800 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Vendor Name</label>
                <input 
                  required
                  type="text" 
                  value={newTx.vendor}
                  onChange={e => setNewTx({...newTx, vendor: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors" 
                  placeholder="e.g. AWS"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Amount</label>
                  <input 
                    required
                    type="number" 
                    value={newTx.amount}
                    onChange={e => setNewTx({...newTx, amount: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors" 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Currency</label>
                  <select 
                    value={newTx.currency}
                    onChange={e => setNewTx({...newTx, currency: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>INR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Category</label>
                  <select 
                    value={newTx.category}
                    onChange={e => setNewTx({...newTx, category: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors"
                  >
                    <option>Software</option>
                    <option>Marketing</option>
                    <option>Travel</option>
                    <option>Office</option>
                    <option>Payroll</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Type</label>
                  <select 
                    value={newTx.type}
                    onChange={e => setNewTx({...newTx, type: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors"
                  >
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Description</label>
                <input 
                  type="text" 
                  value={newTx.description}
                  onChange={e => setNewTx({...newTx, description: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mt-1 outline-none focus:border-white transition-colors" 
                  placeholder="e.g. Monthly server costs"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                Save Transaction
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  FileText, 
  Zap, 
  BarChart3, 
  Plus, 
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

import { orchestrateCFOClient, AgentType } from '@/lib/orchestrator-client';

import ReactMarkdown from 'react-markdown';

export default function BudgetBrain({ user }: { user: any }) {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [activeScenario, setActiveScenario] = useState('Base Case');
  const [isGenerating, setIsGenerating] = useState(false);
  const [boardPackResult, setBoardPackResult] = useState<string | null>(null);

  useEffect(() => {
    if (user?.orgId) {
      const q = query(
        collection(db, 'forecasts'),
        where('orgId', '==', user.orgId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForecasts(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'forecasts');
      });

      return () => unsubscribe();
    }
  }, [user?.orgId]);

  const generateBoardPack = async () => {
    if (!user?.orgId) {
      alert("Organization data not loaded yet. Please wait a moment or refresh.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await orchestrateCFOClient(
        "Generate a comprehensive board pack narrative based on our current forecasts and revenue variance.",
        user?.orgId || 'default-org',
        'fpa',
        user?.uid || 'default-thread',
        user?.uid || 'unknown',
        user?.role || 'admin'
      );
      setBoardPackResult(response.text);
    } catch (error: any) {
      console.error("Failed to generate board pack details:", error);
      alert(`Failed to generate board pack: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const chartData = [
    { month: 'Jan', actual: 400000, forecast: 400000 },
    { month: 'Feb', actual: 300000, forecast: 320000 },
    { month: 'Mar', actual: 200000, forecast: 250000 },
    { month: 'Apr', actual: 278000, forecast: 280000 },
    { month: 'May', actual: 189000, forecast: 210000 },
    { month: 'Jun', actual: 239000, forecast: 250000 },
    { month: 'Jul', actual: 349000, forecast: 360000 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">BudgetBrain</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Rolling Forecasts</h2>
          <p className="text-zinc-500">AI-powered predictive modeling and scenario planning.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={generateBoardPack}
            disabled={isGenerating}
            className="px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium border border-zinc-800 hover:bg-zinc-800 flex items-center gap-2"
          >
            {isGenerating ? <Sparkles size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? 'Generating...' : 'Generate Board Pack'}
          </button>
          <button onClick={() => alert('New Scenario modal would open here')} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 flex items-center gap-2">
            <Plus size={16} />
            New Scenario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Revenue Variance Analysis</h3>
              <div className="flex bg-zinc-900 p-1 rounded-lg">
                {['Base Case', 'Optimistic', 'Pessimistic'].map(s => (
                  <button 
                    key={s}
                    onClick={() => setActiveScenario(s)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${activeScenario === s ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                  <XAxis dataKey="month" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="actual" stroke="#6366f1" fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} />
                  <Area type="monotone" dataKey="forecast" stroke="#a855f7" fillOpacity={0} strokeDasharray="5 5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-500 mb-4">What-If Scenario: 20% Churn Spike</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Runway Impact</span>
                  <span className="text-rose-500 font-bold">-4.2 Months</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[70%]" />
                </div>
                <p className="text-xs text-zinc-500 italic">&quot;AI suggests immediate vendor consolidation to offset cash burn.&quot;</p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-500 mb-4">What-If Scenario: Series B Funding</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hiring Capacity</span>
                  <span className="text-emerald-500 font-bold">+12 Headcount</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[85%]" />
                </div>
                <p className="text-xs text-zinc-500 italic">&quot;Marketing spend can scale 3x with maintained CAC efficiency.&quot;</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-zinc-800">
            <h3 className="text-lg font-bold mb-4">Board Pack Narratives</h3>
            <div className="space-y-4">
              {[
                { title: 'Q1 Revenue Commentary', date: '2 hours ago', status: 'Draft' },
                { title: 'Burn Rate Analysis', date: 'Yesterday', status: 'Final' },
                { title: 'Unit Economics Update', date: '3 days ago', status: 'Final' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-[10px] text-zinc-500">{doc.date}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-700 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">AI Insights</h3>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              &quot;Based on current burn, you will need to initiate fundraising by <span className="text-white font-bold">August 2026</span>. 
              Reducing cloud infra spend by 15% could extend runway by 2.5 weeks.&quot;
            </p>
            <button onClick={() => alert('Detailed Optimization Plan would open here')} className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              View Detailed Optimization Plan →
            </button>
          </div>
        </div>
      </div>

      {/* Board Pack Result Modal */}
      {boardPackResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl max-h-[80vh] bg-[#0f0f0f] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <Sparkles className="text-amber-500" size={24} />
                <h3 className="text-xl font-bold">AI Board Pack Narrative</h3>
              </div>
              <button 
                onClick={() => setBoardPackResult(null)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="markdown-body">
                <ReactMarkdown>{boardPackResult}</ReactMarkdown>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button 
                onClick={() => setBoardPackResult(null)}
                className="px-6 py-2 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => alert('Exporting to PDF...')}
                className="px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all"
              >
                Export to PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

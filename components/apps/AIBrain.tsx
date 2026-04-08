'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BrainCircuit, 
  Sparkles, 
  Send, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  MessageSquare,
  Bot,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { orchestrateCFOClient, AgentType, generateStrategicInsights } from '@/lib/orchestrator-client';
import ReactMarkdown from 'react-markdown';

export default function AIBrain({ user }: { user: any }) {
  const [query, setQuery] = useState('');
  const [agentType, setAgentType] = useState<AgentType>('lead');
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Hello! I'm your Synapse AI CFO. I can help you analyze spend, predict cash flow, or generate financial reports. What's on your mind today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    const fetchInsights = async () => {
      const dynamicInsights = await generateStrategicInsights(user?.orgId || 'default-org');
      setInsights(dynamicInsights);
    };
    fetchInsights();
  }, [user?.orgId]);

  const handleSend = async () => {
    if (!query.trim() || !user?.orgId) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    setStatus('Initializing...');

    try {
      const threadId = user?.uid || 'default-thread';
      const response = await orchestrateCFOClient(
        query, 
        user?.orgId || 'default-org', 
        agentType, 
        threadId, 
        user?.uid || 'unknown', 
        user?.role || 'viewer',
        (newStatus) => setStatus(newStatus)
      );
      setMessages(prev => [...prev, { role: 'assistant', content: response.text, sources: response.sources }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error while processing your request." }]);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="h-full flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">AI Brain</h2>
          <p className="text-zinc-500">Autonomous FP&A, narrative reporting, and strategic insights.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col bg-[#0f0f0f] rounded-3xl border border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold">CFO Assistant</h3>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Online • AI-Powered</p>
              </div>
            </div>
            
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {(['lead', 'data', 'fpa', 'auditor', 'treasurer'] as AgentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setAgentType(type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    agentType === type 
                      ? 'bg-white text-black' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-zinc-800' : 'bg-white text-black'}`}>
                  {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100' 
                      : 'bg-white/5 border border-white/10 text-zinc-300'
                  }`}>
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((source: any, idx: number) => (
                        <a 
                          key={idx} 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                        >
                          <Sparkles size={10} className="text-amber-500" />
                          <span className="truncate max-w-[150px]">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex gap-1"
                    >
                      <div className="w-1 h-1 bg-zinc-400 rounded-full" />
                      <div className="w-1 h-1 bg-zinc-400 rounded-full" />
                      <div className="w-1 h-1 bg-zinc-400 rounded-full" />
                    </motion.div>
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">{status}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-zinc-800">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your finances, generate a report, or simulate a scenario..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 pr-16 outline-none focus:border-white transition-colors text-sm"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !query.trim()}
                className="absolute right-2 p-3 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Insights & Reports */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 rounded-3xl border border-zinc-700">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Strategic Insights
            </h3>
            <div className="space-y-4">
              {insights.length > 0 ? insights.map((insight, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{insight.title}</p>
                  <p className="text-sm leading-relaxed">{insight.content}</p>
                </div>
              )) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 animate-pulse">
                  <div className="h-3 w-24 bg-zinc-700 rounded mb-2" />
                  <div className="h-10 w-full bg-zinc-800 rounded" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0f0f0f] p-8 rounded-3xl border border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Generated Reports</h3>
            <div className="space-y-3">
              {[
                { name: 'Monthly Variance Report', date: 'Mar 2026' },
                { name: 'AR Risk Assessment', date: 'Mar 28, 2026' },
                { name: 'Expense Policy Audit', date: 'Mar 25, 2026' },
              ].map((r, i) => (
                <div key={i} onClick={() => alert(`Opening ${r.name}`)} className="flex items-center justify-between p-3 hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-[10px] text-zinc-600">{r.date}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-700 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

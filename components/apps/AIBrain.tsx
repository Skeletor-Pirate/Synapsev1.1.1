'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import NeuralPulse from '@/components/apps/dashboard/NeuralPulse';
import {
  Sparkles,
  Send,
  FileText,
  Bot,
  User as UserIcon,
  ChevronRight,
  Clock,
  Calendar,
  Mail,
  Loader2,
  Zap,
  Shield,
  BarChart3,
  Banknote,
  Database
} from 'lucide-react';
import { orchestrateCFOClient, AgentType, generateStrategicInsights } from '@/lib/orchestrator-client';
import { chatWithAssistant } from '@/app/actions/assistant';
import ReactMarkdown from 'react-markdown';

type Mode = 'neural' | 'assistant';

export default function AIBrain({ user, onOpenApp }: { user: any; onOpenApp?: (appId: string, params?: any) => void }) {
  const [query, setQuery] = useState('');
  const [agentType, setAgentType] = useState<AgentType>('lead');
  const [mode, setMode] = useState<Mode>('assistant');
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "I'm **Velyra**, your unified AI executive. I can send emails, schedule meetings, set timers, query your finances, search the web, and run deep analysis. What do you need?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [insights, setInsights] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    const fetchInsights = async () => {
      try {
        const dynamicInsights = await generateStrategicInsights(user?.orgId || 'default-org');
        if (!cancelled) setInsights(dynamicInsights);
      } catch {
        if (!cancelled) setInsights([
          { title: 'Cash Flow Alert', content: 'Awaiting financial data for analysis.' },
          { title: 'System Ready', content: 'All executive subsystems are online.' }
        ]);
      }
    };
    fetchInsights();
    return () => { cancelled = true; };
  }, [user?.orgId]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const userMessage = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setStatus('Initializing...');

    try {
      if (mode === 'assistant') {
        // Use the server-action-based assistant (OpenRouter) — handles email, calendar, timers, vector search
        const historyForAPI = messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));

        const res = await chatWithAssistant(userMessage, historyForAPI);

        if (res.success) {
          setMessages(prev => [...prev, { role: 'assistant', content: res.text || '' }]);

          // Handle frontend commands
          if (res.commands) {
            for (const cmd of res.commands) {
              if (cmd.type === 'schedule_meeting') {
                const saved = localStorage.getItem('synapse-calendar-events');
                const events = saved ? JSON.parse(saved) : [];
                const currentDate = new Date();
                const newEvent = {
                  id: Date.now().toString(),
                  date: cmd.payload.date || currentDate.getDate(),
                  month: currentDate.getMonth(),
                  year: currentDate.getFullYear(),
                  title: cmd.payload.title || 'Meeting',
                  type: 'meeting',
                  time: cmd.payload.time || '12:00',
                  description: cmd.payload.description || ''
                };
                events.push(newEvent);
                localStorage.setItem('synapse-calendar-events', JSON.stringify(events));
              } else if (cmd.type === 'send_email') {
                const saved = localStorage.getItem('synapse-mail-data');
                const mails = saved ? JSON.parse(saved) : [];
                mails.unshift({
                  id: Date.now(),
                  folder: 'sent',
                  sender: 'Me',
                  email: 'admin@synapsecfo.com',
                  subject: cmd.payload.subject || 'No Subject',
                  snippet: (cmd.payload.body || '').substring(0, 100),
                  content: cmd.payload.body || '',
                  date: 'Just now',
                  unread: false,
                  starred: false,
                });
                localStorage.setItem('synapse-mail-data', JSON.stringify(mails));
              } else if (cmd.type === 'set_timer') {
                const minutes = cmd.payload.minutes || 1;
                const ms = minutes * 60000;
                setActiveTimer(`Timer set for ${minutes} min: ${cmd.payload.label}`);
                setTimeout(() => {
                  alert(`Timer Finished: ${cmd.payload.label}`);
                  setActiveTimer(null);
                }, ms);
              }
            }
          }
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${res.error}` }]);
        }
      } else {
        // Neural Engine mode — uses Gemini orchestrator with tool calling, RAG, news search
        const threadId = user?.uid || 'default-thread';
        const response = await orchestrateCFOClient(
          userMessage,
          user?.orgId || 'default-org',
          agentType,
          threadId,
          user?.uid || 'unknown',
          user?.role || 'viewer',
          (newStatus) => setStatus(newStatus)
        );
        setMessages(prev => [...prev, { role: 'assistant', content: response.text, sources: response.sources }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error processing your request. Please try again." }]);
    } finally {
      setLoading(false);
      setStatus('');
      inputRef.current?.focus();
    }
  };

  const agentMeta: Record<AgentType, { icon: any; label: string }> = {
    lead: { icon: Sparkles, label: 'Lead' },
    data: { icon: Database, label: 'Data' },
    fpa: { icon: BarChart3, label: 'FP&A' },
    auditor: { icon: Shield, label: 'Audit' },
    treasurer: { icon: Banknote, label: 'Treasury' },
  };

  return (
    <div className="h-full flex flex-col gap-0" style={{ color: 'var(--text-primary)' }}>

      {/* ── Unified Header ── */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Velyra</h1>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--accent-success)' }}>
              Online • {mode === 'assistant' ? 'Executive Assistant' : `Neural Engine › ${agentType.toUpperCase()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex p-0.5 rounded-lg border" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-3)' }}>
            <button
              onClick={() => setMode('assistant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                mode === 'assistant' ? 'bg-white text-black' : 'text-[var(--text-ghost)] hover:text-white'
              }`}
            >
              <Bot size={10} /> Assistant
            </button>
            <button
              onClick={() => setMode('neural')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                mode === 'neural' ? 'bg-white text-black' : 'text-[var(--text-ghost)] hover:text-white'
              }`}
            >
              <Zap size={10} /> Neural
            </button>
          </div>

          {/* Agent type selector (only in neural mode) */}
          <AnimatePresence>
            {mode === 'neural' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex p-0.5 rounded-lg border overflow-hidden"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-3)' }}
              >
                {(['lead', 'data', 'fpa', 'auditor', 'treasurer'] as AgentType[]).map((type) => {
                  const meta = agentMeta[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setAgentType(type)}
                      className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        agentType === type ? 'bg-white text-black' : 'text-[var(--text-ghost)] hover:text-white'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Capability indicators */}
          <div className="hidden lg:flex gap-3">
            <div className="flex flex-col items-center justify-center text-[9px]" style={{ color: 'var(--text-ghost)' }}>
              <Mail size={12} className="mb-0.5" /> Email
            </div>
            <div className="flex flex-col items-center justify-center text-[9px]" style={{ color: 'var(--text-ghost)' }}>
              <Calendar size={12} className="mb-0.5" /> Calendar
            </div>
            <div className="flex flex-col items-center justify-center text-[9px]" style={{ color: 'var(--text-ghost)' }}>
              <Database size={12} className="mb-0.5" /> RAG
            </div>
          </div>
        </div>
      </div>

      {/* Timer Banner */}
      <AnimatePresence>
        {activeTimer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 py-2 border-b flex items-center gap-2 text-xs font-bold overflow-hidden"
            style={{ background: 'var(--accent-warning-dim)', color: 'var(--accent-warning)', borderColor: 'var(--glass-border)' }}
          >
            <Clock size={14} className="animate-pulse" />
            {activeTimer}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0 overflow-hidden">

        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden border-r" style={{ borderColor: 'var(--glass-border)' }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                    isUser ? 'bg-[var(--surface-3)]' : ''
                  }`}
                    style={!isUser ? { background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))' } : undefined}
                  >
                    {isUser ? <UserIcon size={13} style={{ color: 'var(--text-secondary)' }} /> : <Sparkles size={13} className="text-white" />}
                  </div>
                  <div className={`max-w-[80%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-xl text-[12px] leading-relaxed border ${
                      isUser
                        ? 'bg-[var(--surface-1)] border-[var(--glass-border)] rounded-tr-sm'
                        : 'bg-white/5 border-white/10 rounded-tl-sm'
                    }`}>
                      <div className="markdown-body prose-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source: any, idx: number) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-0.5 border rounded-md text-[9px] transition-all font-medium hover:bg-white/5"
                            style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
                          >
                            <Sparkles size={9} className="text-[var(--accent-warning)]" />
                            <span className="truncate max-w-[100px]">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))' }}>
                  <Sparkles size={13} className="text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl rounded-tl-sm flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <NeuralPulse />
                    <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      {status || 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={mode === 'assistant' 
                  ? 'Send an email, schedule a meeting, set a timer...' 
                  : 'Query finances, analyze data, search the web...'}
                className="w-full rounded-xl p-3 pr-12 text-xs outline-none transition-colors"
                style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)'
                }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !query.trim()}
                className="absolute right-2 p-2 rounded-lg transition-all disabled:opacity-40 font-bold text-xs"
                style={{ 
                  background: query.trim() ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))' : 'var(--surface-3)', 
                  color: 'white' 
                }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Insights & Reports ── */}
        <div className="hidden lg:flex flex-col gap-0 overflow-y-auto">

          {/* Strategic Insights */}
          <div className="p-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-ghost)' }}>
              <Sparkles size={12} className="text-[var(--accent-warning)]" />
              Strategic Insights
            </h3>
            <div className="space-y-2.5">
              {insights.length > 0 ? insights.map((insight, idx) => (
                <div key={idx} className="p-3 rounded-xl border" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-1)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-ghost)' }}>{insight.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.content}</p>
                </div>
              )) : (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="p-3 rounded-xl border animate-pulse" style={{ borderColor: 'var(--glass-border)' }}>
                      <div className="h-2 w-20 rounded mb-2" style={{ background: 'var(--surface-3)' }} />
                      <div className="h-8 w-full rounded" style={{ background: 'var(--surface-2)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Capabilities */}
          <div className="p-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-ghost)' }}>Capabilities</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Mail, label: 'Send Email', hint: '"Email John about the Q3 report"' },
                { icon: Calendar, label: 'Schedule', hint: '"Set a meeting for Friday at 3pm"' },
                { icon: Clock, label: 'Set Timer', hint: '"Remind me in 15 minutes"' },
                { icon: Database, label: 'RAG Search', hint: '"What are our top expenses?"' },
              ].map((cap, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(cap.hint.replace(/"/g, ''))}
                  className="flex items-center gap-2 p-2.5 rounded-lg border transition-all hover:bg-white/5 text-left"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <cap.icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <div>
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{cap.label}</p>
                    <p className="text-[8px]" style={{ color: 'var(--text-ghost)' }}>{cap.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generated Reports */}
          <div className="p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-ghost)' }}>Generated Reports</h3>
            <div className="space-y-1.5">
              {[
                { name: 'Monthly Variance Report', date: 'Aug 2026' },
                { name: 'AR Risk Assessment', date: 'Aug 8, 2026' },
                { name: 'Expense Policy Audit', date: 'Aug 5, 2026' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 hover:bg-[var(--surface-1)] rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-[var(--glass-border)]">
                  <div className="flex items-center gap-2.5">
                    <FileText size={13} style={{ color: 'var(--text-tertiary)' }} />
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                      <p className="text-[9px]" style={{ color: 'var(--text-ghost)' }}>{r.date}</p>
                    </div>
                  </div>
                  <ChevronRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

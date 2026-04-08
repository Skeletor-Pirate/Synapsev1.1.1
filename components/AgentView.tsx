import React, { useState } from 'react';
import { Bot, CheckCircle2, AlertCircle, RefreshCw, BrainCircuit, Target, ShieldAlert, Send, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { orchestrateCFOClient } from '@/lib/orchestrator-client';
import ReactMarkdown from 'react-markdown';

export default function AgentView({ user }: { user: any }) {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'auditing' | 'correcting' | 'complete'>('idle');
  const [logs, setLogs] = useState<{agent: string, message: string, type: 'info' | 'error' | 'success'}[]>([]);
  const [query, setQuery] = useState('');
  const [finalOutput, setFinalOutput] = useState('');
  const [sources, setSources] = useState<any[]>([]);

  const runOrchestration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    if (!user?.orgId) {
      alert("Organization data not loaded yet.");
      return;
    }
    
    setStatus('analyzing');
    setFinalOutput('');
    setSources([]);
    setLogs([{ agent: 'Lead Agent', message: `Goal decomposed for query: "${query}"`, type: 'info' }]);
    
    try {
      const response = await orchestrateCFOClient(
        query,
        user.orgId,
        'lead',
        user.uid + '-agent-view',
        user.uid,
        user.role || 'viewer',
        (statusMsg) => {
          // Map status messages to agents for the log view
          let agent = 'Lead Agent';
          let message = statusMsg;
          let type: 'info' | 'error' | 'success' = 'info';
          
          if (statusMsg.includes('[REASONING]')) {
            message = statusMsg.replace('[REASONING]', '').trim();
            agent = 'Analyst Agent';
            setStatus('analyzing');
          } else if (statusMsg.includes('[HANDOFF]')) {
            const match = statusMsg.match(/\[HANDOFF\] to (.*?):/);
            agent = match ? match[1] : 'Lead Agent';
            message = statusMsg.replace(/\[HANDOFF\] to (.*?):/, '').trim();
          } else if (statusMsg.includes('Executing tool')) {
            agent = 'Tool Executor';
            type = 'info';
          } else if (statusMsg.includes('Searching internal')) {
            agent = 'RAG Agent';
          } else if (statusMsg.includes('Searching news')) {
            agent = 'News Agent';
          } else if (statusMsg.includes('Synthesizing')) {
            agent = 'Analyst Agent';
            setStatus('auditing');
          } else if (statusMsg.includes('Finalizing')) {
            agent = 'Lead Agent';
            type = 'success';
            setStatus('complete');
          }
          
          setLogs(prev => [...prev, { agent, message, type }]);
        }
      );
      
      setFinalOutput(response.text);
      setSources(response.sources);
      setStatus('complete');
    } catch (error) {
      setLogs(prev => [...prev, { agent: 'System', message: 'Orchestration failed.', type: 'error' }]);
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center">
            <Bot className="w-6 h-6 mr-3 text-emerald-500" />
            The Agentic Layer
          </h1>
          <p className="text-zinc-400 mt-1">Multi-Agent Orchestration & The Auditor Loop.</p>
        </div>
      </div>

      {/* Query Input */}
      <form onSubmit={runOrchestration} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a complex financial question (e.g., 'Assess acquisition readiness for Q4')"
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          disabled={status !== 'idle' && status !== 'complete'}
        />
        <button
          type="submit"
          disabled={!query.trim() || (status !== 'idle' && status !== 'complete')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Decomposition */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-400" />
            Active Agents
          </h3>
          <div className="space-y-3">
            <AgentCard name="Lead Agent" role="Orchestrator" active={status !== 'idle' && status !== 'complete'} />
            <AgentCard name="Data Agent" role="Metrics" active={status === 'analyzing'} />
            <AgentCard name="Analyst Agent" role="Drafter" active={status === 'analyzing' || status === 'correcting'} />
            <AgentCard name="Auditor Agent" role="Reviewer" active={status === 'auditing' || status === 'correcting'} />
          </div>
        </div>

        {/* The Auditor Loop */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4 flex flex-col">
          <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
            Inter-Agent Communication
          </h3>
          
          {/* Logs */}
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 min-h-[200px] overflow-y-auto custom-scrollbar font-mono text-xs space-y-3">
            {logs.length === 0 && <span className="text-zinc-600">Enter a query to start the multi-agent orchestration...</span>}
            {logs.map((log, i) => (
              <div key={i} className={cn(
                "flex flex-col space-y-1 p-2 rounded border",
                log.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-400" : 
                log.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
                "bg-zinc-900 border-zinc-800 text-zinc-300"
              )}>
                <span className="font-bold text-[10px] uppercase tracking-wider opacity-70">{log.agent}</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>

          {/* Final Output */}
          {finalOutput && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in slide-in-from-bottom-2">
              <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Final Output
              </h4>
              <div className="markdown-body text-sm text-zinc-200">
                <ReactMarkdown>{finalOutput}</ReactMarkdown>
              </div>
              
              {sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20 flex flex-wrap gap-2">
                  {sources.map((source, idx) => (
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
          )}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ name, role, active }: { name: string, role: string, active: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-all",
      active ? "bg-zinc-800/80 border-zinc-700" : "bg-zinc-950/50 border-zinc-800/50"
    )}>
      <div className="flex items-center">
        <div className={cn("w-2 h-2 rounded-full mr-3", active ? "bg-emerald-500 animate-pulse" : "bg-zinc-700")} />
        <span className="text-sm font-medium text-zinc-200">{name}</span>
      </div>
      <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">{role}</span>
    </div>
  );
}

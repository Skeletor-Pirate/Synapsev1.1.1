'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, Upload, FileText, CheckCircle, Loader2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { ingestDocument } from '@/app/actions/knowledge';

export default function KnowledgeBase() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isAutonomous, setIsAutonomous] = useState(false);

  useEffect(() => {
    const setting = localStorage.getItem('synapse-autonomous-sync-enabled');
    if (setting === 'true') {
      setIsAutonomous(true);
    }
  }, []);

  const toggleAutonomous = () => {
    const newState = !isAutonomous;
    setIsAutonomous(newState);
    localStorage.setItem('synapse-autonomous-sync-enabled', newState.toString());
    if (newState) {
      // Trigger a global event to force an immediate sync in WebOSShell
      window.dispatchEvent(new CustomEvent('force-autonomous-sync'));
    }
  };

  const handleIngest = async () => {
    if (!title.trim() || !content.trim()) {
      setStatusMsg('Please provide a title and content.');
      return;
    }
    
    setIsLoading(true);
    setStatusMsg('Processing and generating vector embeddings...');
    
    try {
      const res = await ingestDocument(title, content, { source: 'manual_entry' });
      if (res.success) {
        setStatusMsg(`Successfully ingested! Generated ${res.chunksInserted} vector chunks.`);
        setTitle('');
        setContent('');
      } else {
        setStatusMsg(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-6" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Ingest private company data into the PostgreSQL Vector DB for AI RAG.
            </p>
          </div>
        </div>

        <button 
          onClick={toggleAutonomous}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm border ${isAutonomous ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-black/20 border-white/10 text-zinc-400 hover:text-white'}`}
        >
          {isAutonomous ? <ToggleRight size={20} className="text-indigo-400" /> : <ToggleLeft size={20} />}
          {isAutonomous ? 'Autonomous Sync Active' : 'Enable Autonomous Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Ingest Form */}
        <div className="md:col-span-2 flex flex-col gap-4 rounded-xl p-6 border border-white/10" style={{ background: 'var(--surface-1)' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload size={18} className="text-indigo-400" />
            Add Document
          </h2>
          
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-medium text-zinc-400">Document Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 EBITA Board Meeting Notes"
              className="px-4 py-2.5 rounded-lg bg-black/40 border border-white/5 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2 flex-1 mt-2">
            <label className="text-sm font-medium text-zinc-400">Content (Paste text here)</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste meeting transcripts, financial summaries, or strategy docs here. The AI will chunk it and generate 768-dimensional embeddings via Gemini."
              className="flex-1 resize-none p-4 rounded-lg bg-black/40 border border-white/5 outline-none focus:border-indigo-500/50 transition-colors custom-scrollbar"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className={`text-sm ${statusMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {statusMsg}
            </span>
            <button 
              onClick={handleIngest}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              Vectorize & Save
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="flex flex-col gap-4 rounded-xl p-6 border border-white/10" style={{ background: 'var(--surface-1)' }}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Search size={18} className="text-purple-400" />
            How to Query
          </h2>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm leading-relaxed text-purple-100">
            Once a document is ingested, it is instantly available to the Synapse OS AI Agent.
          </div>
          
          <h3 className="text-sm font-medium text-zinc-400 mt-4">Try asking the Voice Assistant:</h3>
          <ul className="space-y-3 mt-2">
            <li className="p-3 rounded-lg bg-black/40 border border-white/5 text-sm">
              "What were the key takeaways from the Q3 EBITA meeting?"
            </li>
            <li className="p-3 rounded-lg bg-black/40 border border-white/5 text-sm">
              "Search company records for our cloud infrastructure budget."
            </li>
          </ul>

          <div className="mt-auto p-4 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle size={16} className="text-emerald-400" />
              Vector Engine
            </div>
            <div className="text-xs text-zinc-400">PostgreSQL + pgvector (HNSW)</div>
            <div className="text-xs text-zinc-400">Embedding Model: text-embedding-004</div>
          </div>
        </div>

      </div>
    </div>
  );
}

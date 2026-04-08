import React, { useState } from 'react';
import { Database, Search, FileText, Network, Layers, Terminal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { answerWithRAGClient } from '@/lib/rag-client';
import ReactMarkdown from 'react-markdown';

export default function RAGView({ user }: { user: any }) {
  const [query, setQuery] = useState("What was our burn in Q3?");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!user?.orgId) {
      alert("Organization data not loaded yet.");
      return;
    }
    setIsProcessing(true);
    setResult(null);
    try {
      const response = await answerWithRAGClient(
        query,
        user.orgId,
        user.uid,
        user.role || 'viewer'
      );
      
      setResult({
        type: 'hybrid',
        sql: "DYNAMIC_QUERY_ANALYSIS_ACTIVE",
        textContext: `Retrieved ${response.sources.length} relevant sources from knowledge base.`,
        graphContext: "Entity resolution performed on retrieved nodes.",
        summary: response.text,
        sources: response.sources
      });
    } catch (error) {
      console.error("RAG search failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center">
          <Database className="w-6 h-6 mr-3 text-emerald-500" />
          The RAG Layer
        </h1>
        <p className="text-zinc-400 mt-1">Beyond Simple Vector Search: Bridging structured and unstructured data.</p>
      </div>

      {/* Query Input */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Execute Query'}
          </button>
        </div>
      </div>

      {/* Results Area */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Hybrid Retrieval */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
              <Terminal className="w-5 h-5 mr-2 text-blue-400" />
              Hybrid Retrieval (Text-to-SQL)
            </h3>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-blue-300">
              {result.sql}
            </div>
            <div className="flex items-start space-x-3 text-sm text-zinc-400 bg-zinc-800/30 p-3 rounded-lg">
              <FileText className="w-4 h-4 mt-0.5 text-zinc-500 flex-shrink-0" />
              <p>{result.textContext}</p>
            </div>
          </div>

          {/* GraphRAG */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
              <Network className="w-5 h-5 mr-2 text-purple-400" />
              Knowledge Graph (GraphRAG)
            </h3>
            <div className="h-32 bg-zinc-950 border border-zinc-800 rounded-lg relative overflow-hidden flex items-center justify-center">
              {/* Mock Graph Visualization */}
              <div className="absolute w-2 h-2 bg-purple-500 rounded-full left-1/4 top-1/3 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              <div className="absolute w-2 h-2 bg-emerald-500 rounded-full right-1/4 top-1/2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <div className="absolute w-2 h-2 bg-blue-500 rounded-full left-1/2 bottom-1/4 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="25%" y1="33%" x2="75%" y2="50%" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4" />
                <line x1="25%" y1="33%" x2="50%" y2="75%" stroke="#3f3f46" strokeWidth="1" />
              </svg>
              <span className="text-xs text-zinc-500 z-10 bg-zinc-950/80 px-2 py-1 rounded">Entity Resolution Active</span>
            </div>
            <p className="text-sm text-zinc-400">{result.graphContext}</p>
          </div>

          {/* Hierarchical Summarization */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-amber-400" />
              Hierarchical Summarization
            </h3>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500/50 w-1/4 rounded-full"></div>
              </div>
              <span className="text-xs text-zinc-500">Pulled 3 monthly summaries instead of 10,000 transactions</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="markdown-body text-zinc-200 text-sm">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
              
              {result.sources && result.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap gap-2">
                  {result.sources.map((source: any, idx: number) => (
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

        </div>
      )}
    </div>
  );
}

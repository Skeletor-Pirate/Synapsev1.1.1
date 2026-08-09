'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, ChevronRight } from 'lucide-react';

interface TerminalLine {
  content: string;
  type: 'input' | 'output' | 'system' | 'error' | 'success';
}

export default function Terminal() {
  const [history, setHistory] = useState<TerminalLine[]>([
    { content: 'Synapse OS Terminal v2.0.0', type: 'system' },
    { content: 'Neural engine connected. Type "help" for available commands.', type: 'system' },
    { content: '', type: 'output' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const newHistory: TerminalLine[] = [...history, { content: `${input}`, type: 'input' }];

    switch (cmd) {
      case 'help':
        newHistory.push(
          { content: '', type: 'output' },
          { content: 'Available commands:', type: 'system' },
          { content: '  help     — Show this help message', type: 'output' },
          { content: '  clear    — Clear the terminal', type: 'output' },
          { content: '  whoami   — Show current user info', type: 'output' },
          { content: '  ls       — List files in current directory', type: 'output' },
          { content: '  query    — Run an AI financial query', type: 'output' },
          { content: '  status   — Show system status', type: 'output' },
          { content: '  exit     — Close the terminal', type: 'output' },
          { content: '', type: 'output' },
        );
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'whoami':
        newHistory.push(
          { content: 'User: Administrator', type: 'success' },
          { content: 'Role: CFO', type: 'output' },
          { content: 'Organization: Synapse Corp', type: 'output' },
        );
        break;
      case 'ls':
        newHistory.push(
          { content: 'Financials/', type: 'success' },
          { content: 'Tax Documents/', type: 'success' },
          { content: 'Reports/', type: 'success' },
          { content: 'Q1_Forecast.xlsx', type: 'output' },
          { content: 'Vendor_List.csv', type: 'output' },
          { content: 'Audit_2025.pdf', type: 'output' },
        );
        break;
      case 'status':
        newHistory.push(
          { content: '', type: 'output' },
          { content: '┌─ SYSTEM STATUS ─────────────────┐', type: 'system' },
          { content: '│  Neural Engine    ● ONLINE      │', type: 'success' },
          { content: '│  RAG Layer        ● ONLINE      │', type: 'success' },
          { content: '│  Agentic Layer    ● ONLINE      │', type: 'success' },
          { content: '│  Inference Layer  ● STANDBY     │', type: 'output' },
          { content: '│  Memory Usage     42.3%         │', type: 'output' },
          { content: '│  Uptime           14d 6h 23m    │', type: 'output' },
          { content: '└─────────────────────────────────┘', type: 'system' },
          { content: '', type: 'output' },
        );
        break;
      case 'query':
        newHistory.push(
          { content: 'Usage: query [prompt]', type: 'system' },
          { content: 'Example: query "What is our current burn rate?"', type: 'output' },
        );
        break;
      case 'exit':
        newHistory.push({ content: 'Terminal session ended. Please close the window.', type: 'system' });
        break;
      default:
        if (cmd.startsWith('query ')) {
          newHistory.push(
            { content: 'Processing neural query…', type: 'system' },
            { content: 'Analyzing real-time financial data…', type: 'output' },
            { content: '', type: 'output' },
            { content: 'Result: Current burn rate is $124,500/month, projected to decrease 12% next quarter.', type: 'success' },
          );
        } else {
          newHistory.push({ content: `Command not found: ${cmd}`, type: 'error' });
        }
    }

    setHistory(newHistory);
    setInput('');
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'var(--text-primary)';
      case 'system': return 'var(--accent-primary)';
      case 'success': return 'var(--accent-success)';
      case 'error': return 'var(--accent-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div 
      className="h-full flex flex-col overflow-hidden relative"
      style={{ 
        background: 'var(--surface-1)', 
        fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
      }}
    >
      {/* Subtle CRT scanline overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Terminal header */}
      <div 
        className="flex items-center gap-2 px-4 py-2 relative z-20"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <TerminalIcon size={12} style={{ color: 'var(--text-ghost)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-ghost)' }}>
          synapse://terminal
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-success)' }} />
          <span className="text-[9px] font-medium" style={{ color: 'var(--text-ghost)' }}>connected</span>
        </div>
      </div>
      
      {/* Terminal body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-0.5 text-[13px] relative z-20">
        {history.map((line, i) => (
          <div key={i} className="flex items-start gap-0 leading-relaxed">
            {line.type === 'input' && (
              <span style={{ color: 'var(--accent-primary)' }} className="mr-2 select-none">❯</span>
            )}
            <span style={{ color: getLineColor(line.type) }}>
              {line.content}
            </span>
          </div>
        ))}
      </div>

      {/* Input line */}
      <form onSubmit={handleCommand} className="flex items-center gap-2 px-4 py-3 relative z-20" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <span style={{ color: 'var(--accent-primary)' }} className="text-sm select-none">❯</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[13px]"
          style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-primary)' }}
          autoFocus
          spellCheck={false}
        />
        {!input && (
          <span className="animate-blink text-sm" style={{ color: 'var(--accent-primary)' }}>▊</span>
        )}
      </form>
    </div>
  );
}

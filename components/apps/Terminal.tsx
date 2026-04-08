'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, ChevronRight } from 'lucide-react';

export default function Terminal() {
  const [history, setHistory] = useState<string[]>(['Welcome to Synapse OS Terminal v1.0.0', 'Type "help" for a list of commands.']);
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
    const newHistory = [...history, `> ${input}`];

    switch (cmd) {
      case 'help':
        newHistory.push('Available commands:', '  help     - Show this help message', '  clear    - Clear the terminal', '  whoami   - Show current user info', '  ls       - List files in current directory', '  query    - Run an AI financial query', '  exit     - Close the terminal');
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'whoami':
        newHistory.push('User: Administrator', 'Role: CFO', 'Organization: Synapse Corp');
        break;
      case 'ls':
        newHistory.push('Financials/', 'Tax Documents/', 'Reports/', 'Q1_Forecast.xlsx', 'Vendor_List.csv', 'Audit_2025.pdf');
        break;
      case 'query':
        newHistory.push('Usage: query [prompt]', 'Example: query "What is our current burn rate?"');
        break;
      case 'exit':
        newHistory.push('Terminal session ended. Please close the window.');
        break;
      default:
        if (cmd.startsWith('query ')) {
          newHistory.push('AI Brain is processing your request...', 'Analyzing real-time financial data...', 'Result: Our current burn rate is $124,500 per month, projected to decrease by 12% next quarter.');
        } else {
          newHistory.push(`Command not found: ${cmd}`);
        }
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="h-full bg-black text-emerald-500 font-mono p-4 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-4 text-zinc-500 border-b border-white/5 pb-2">
        <TerminalIcon size={14} />
        <span className="text-xs font-bold uppercase tracking-widest">Synapse Terminal</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-1 text-sm">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('>') ? 'text-white' : ''}>{line}</div>
        ))}
      </div>

      <form onSubmit={handleCommand} className="mt-4 flex items-center gap-2">
        <ChevronRight size={16} className="text-emerald-500" />
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-white text-sm"
          autoFocus
        />
      </form>
    </div>
  );
}

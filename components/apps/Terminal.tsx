'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { chatWithAssistant } from '@/app/actions/assistant';

interface TerminalLine {
  content: string;
  type: 'input' | 'output' | 'system' | 'error' | 'success' | 'info' | 'divider';
}

const BANNER = [
  { content: '╔══════════════════════════════════════════════════╗', type: 'system' },
  { content: '║          SYNAPSE OS  ·  Terminal v3.0.0          ║', type: 'system' },
  { content: '║     Neural Interface · Type "help" for commands   ║', type: 'system' },
  { content: '╚══════════════════════════════════════════════════╝', type: 'system' },
  { content: '', type: 'output' },
] as TerminalLine[];

const APPS = [
  'dashboard','mail','assistant','calendar','notes','music','voice',
  'calculator','taskmanager','google','aibrain','settings','explorer',
  'terminal','spendsense','predictivear','budgetbrain','treasury',
  'taxpilot','vendoriq','investiq','datamarket','knowledgebase'
];

export default function Terminal() {
  const [history, setHistory] = useState<TerminalLine[]>(BANNER);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const push = useCallback((...lines: TerminalLine[]) => {
    setHistory(h => [...h, ...lines]);
  }, []);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const raw = input.trim();
    const cmd = raw.toLowerCase();
    const args = raw.split(' ').slice(1).join(' ');

    setCmdHistory(h => [raw, ...h]);
    setCmdHistoryIdx(-1);
    setHistory(h => [...h, { content: raw, type: 'input' }]);
    setInput('');

    // ── Built-in commands ──────────────────────────────────────────────────
    if (cmd === 'clear' || cmd === 'cls') { setHistory(BANNER); return; }

    if (cmd === 'help') {
      push(
        { content: '', type: 'output' },
        { content: '─── System Commands ───────────────────────────────', type: 'divider' },
        { content: '  help          Show this help text', type: 'output' },
        { content: '  clear / cls   Clear the terminal', type: 'output' },
        { content: '  whoami        Show current user', type: 'output' },
        { content: '  status        Show system health', type: 'output' },
        { content: '  uptime        Show session uptime', type: 'output' },
        { content: '  date          Show current date & time', type: 'output' },
        { content: '', type: 'output' },
        { content: '─── App Controls ──────────────────────────────────', type: 'divider' },
        { content: '  open <app>    Open any OS app by name', type: 'output' },
        { content: '  apps          List all available apps', type: 'output' },
        { content: '  close         Close the focused window', type: 'output' },
        { content: '', type: 'output' },
        { content: '─── Synapse AI ────────────────────────────────────', type: 'divider' },
        { content: '  ai <prompt>   Run a prompt against the AI Assistant', type: 'output' },
        { content: '  mail <addr>   Draft & send email via AI', type: 'output' },
        { content: '  schedule <x>  Schedule a calendar event', type: 'output' },
        { content: '', type: 'output' },
        { content: '─── OS Tools ──────────────────────────────────────', type: 'divider' },
        { content: '  ls            List OS apps & services', type: 'output' },
        { content: '  neofetch      Display system info', type: 'output' },
        { content: '  echo <text>   Echo text back to terminal', type: 'output' },
        { content: '  history       Show command history', type: 'output' },
        { content: '', type: 'output' },
      );
      return;
    }

    if (cmd === 'apps' || cmd === 'ls') {
      push(
        { content: '', type: 'output' },
        { content: 'Installed Applications:', type: 'system' },
        ...APPS.map(a => ({ content: `  ● ${a}`, type: 'success' as const })),
        { content: '', type: 'output' },
      );
      return;
    }

    if (cmd === 'date') {
      push({ content: new Date().toLocaleString(), type: 'success' });
      return;
    }

    if (cmd === 'uptime') {
      push({ content: `Session started at ${new Date().toLocaleTimeString()}`, type: 'success' });
      return;
    }

    if (cmd === 'whoami') {
      push(
        { content: 'User:         Master Admin', type: 'success' },
        { content: 'Role:         Executive', type: 'output' },
        { content: 'Organization: Synapse Corp', type: 'output' },
        { content: 'Session:      Active', type: 'output' },
      );
      return;
    }

    if (cmd === 'history') {
      push(
        { content: '', type: 'output' },
        ...cmdHistory.map((c, i) => ({ content: `  ${cmdHistory.length - i}  ${c}`, type: 'output' as const })),
        { content: '', type: 'output' },
      );
      return;
    }

    if (cmd === 'neofetch') {
      push(
        { content: '', type: 'output' },
        { content: '   ███████╗██╗   ██╗███╗   ██╗', type: 'info' },
        { content: '   ██╔════╝╚██╗ ██╔╝████╗  ██║', type: 'info' },
        { content: '   ███████╗ ╚████╔╝ ██╔██╗ ██║', type: 'info' },
        { content: '   ╚════██║  ╚██╔╝  ██║╚██╗██║', type: 'info' },
        { content: '   ███████║   ██║   ██║ ╚████║', type: 'info' },
        { content: '   ╚══════╝   ╚═╝   ╚═╝  ╚═══╝', type: 'info' },
        { content: '', type: 'output' },
        { content: `  OS:       Synapse OS v1.1.1`, type: 'output' },
        { content: `  Kernel:   Next.js 15 / React 19`, type: 'output' },
        { content: `  AI:       Google Gemini 2.0 Live`, type: 'output' },
        { content: `  Apps:     ${APPS.length} installed`, type: 'output' },
        { content: `  Memory:   ${Math.round(Math.random() * 30 + 40)}% used`, type: 'output' },
        { content: `  Time:     ${new Date().toLocaleTimeString()}`, type: 'output' },
        { content: '', type: 'output' },
      );
      return;
    }

    if (cmd === 'status') {
      push(
        { content: '', type: 'output' },
        { content: '┌─ SYSTEM STATUS ─────────────────────────┐', type: 'system' },
        { content: '│  Neural Engine    ● ONLINE              │', type: 'success' },
        { content: '│  Voice Layer      ● LIVE (Gemini 2.0)  │', type: 'success' },
        { content: '│  Mail Agent       ● ONLINE              │', type: 'success' },
        { content: '│  Calendar Sync    ● ONLINE              │', type: 'success' },
        { content: '│  AI Sorter        ● ONLINE (Groq)       │', type: 'success' },
        { content: `│  RAM              ${Math.round(Math.random()*30+30)}% used              │`, type: 'output' },
        { content: '└─────────────────────────────────────────┘', type: 'system' },
        { content: '', type: 'output' },
      );
      return;
    }

    if (cmd.startsWith('echo ')) {
      push({ content: args, type: 'output' });
      return;
    }

    // ── open <appId> ───────────────────────────────────────────────────────
    if (cmd.startsWith('open ') || cmd.startsWith('launch ')) {
      const target = args.toLowerCase().trim();
      const aliasMap: Record<string, string> = {
        email: 'mail', emails: 'mail', inbox: 'mail',
        ai: 'assistant', bot: 'assistant', chat: 'assistant',
        agenda: 'calendar', velyra: 'aibrain', brain: 'aibrain',
        files: 'explorer', file: 'explorer', calc: 'calculator',
        tasks: 'taskmanager', task: 'taskmanager',
      };
      const appId = aliasMap[target] || target;
      if (APPS.includes(appId)) {
        window.dispatchEvent(new CustomEvent('open-app', { detail: { appId } }));
        push({ content: `Launching ${appId}…`, type: 'success' });
      } else {
        push({ content: `Unknown app: "${target}". Run "apps" to see available apps.`, type: 'error' });
      }
      return;
    }

    // ── ai <prompt> — forward to AI assistant ──────────────────────────────
    if (cmd.startsWith('ai ') || cmd.startsWith('ask ') || cmd.startsWith('synapse ')) {
      const prompt = args;
      if (!prompt) { push({ content: 'Usage: ai <your question>', type: 'error' }); return; }
      push({ content: '⠿ Thinking…', type: 'info' });
      setIsLoading(true);
      try {
        const res = await chatWithAssistant(prompt, []);
        setHistory(h => h.filter(l => l.content !== '⠿ Thinking…'));
        if (res.success) {
          // Word-wrap long responses at 72 chars
          const words = (res.text || '').split(' ');
          let line = '';
          const lines: string[] = [];
          for (const w of words) {
            if ((line + w).length > 72) { lines.push(line.trim()); line = ''; }
            line += w + ' ';
          }
          if (line.trim()) lines.push(line.trim());
          push(...lines.map(l => ({ content: l, type: 'success' as const })));
          // Execute any returned commands
          if (res.commands) {
            for (const c of res.commands) {
              if (c.type === 'schedule_meeting') {
                push({ content: `✓ Calendar event scheduled: ${c.payload.title}`, type: 'success' });
              }
            }
          }
        } else {
          push({ content: `AI Error: ${res.error}`, type: 'error' });
        }
      } catch (err: any) {
        setHistory(h => h.filter(l => l.content !== '⠿ Thinking…'));
        push({ content: `Error: ${err.message}`, type: 'error' });
      }
      setIsLoading(false);
      return;
    }

    // ── schedule <event> ─────────────────────────────────────────────────
    if (cmd.startsWith('schedule ')) {
      push({ content: '⠿ Scheduling…', type: 'info' });
      setIsLoading(true);
      const res = await chatWithAssistant(`Schedule this for me: ${args}`, []);
      setHistory(h => h.filter(l => l.content !== '⠿ Scheduling…'));
      if (res.success) {
        push({ content: res.text || 'Done.', type: 'success' });
      } else {
        push({ content: `Error: ${res.error}`, type: 'error' });
      }
      setIsLoading(false);
      return;
    }

    // ── Unrecognized ──────────────────────────────────────────────────────
    push({ content: `Command not found: ${cmd}. Type "help" for help.`, type: 'error' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx = Math.min(cmdHistoryIdx + 1, cmdHistory.length - 1);
      setCmdHistoryIdx(nextIdx);
      setInput(cmdHistory[nextIdx] || '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.max(cmdHistoryIdx - 1, -1);
      setCmdHistoryIdx(nextIdx);
      setInput(nextIdx === -1 ? '' : cmdHistory[nextIdx]);
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      // Autocomplete app names after "open "
      if (input.startsWith('open ') || input.startsWith('launch ')) {
        const partial = input.split(' ')[1] || '';
        const match = APPS.find(a => a.startsWith(partial));
        if (match) setInput(input.split(' ')[0] + ' ' + match);
      }
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':   return '#a78bfa';
      case 'system':  return '#60a5fa';
      case 'success': return '#34d399';
      case 'error':   return '#f87171';
      case 'info':    return '#fbbf24';
      case 'divider': return '#4b5563';
      default:        return '#9ca3af';
    }
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative select-text"
      style={{ background: '#0a0a0f', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* CRT scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 z-20 border-b border-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[10px] font-mono text-zinc-500 tracking-widest uppercase">synapse://terminal</span>
        {isLoading && <span className="ml-auto text-[10px] text-yellow-400 animate-pulse">● Processing</span>}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-0.5 text-[12px] leading-5 z-20">
        {history.map((line, i) => (
          <div key={i} className="flex items-start gap-0">
            {line.type === 'input' && (
              <span className="mr-2 select-none" style={{ color: '#a78bfa' }}>❯</span>
            )}
            <span style={{ color: getLineColor(line.type), whiteSpace: 'pre' }}>
              {line.content}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleCommand} className="flex items-center gap-2 px-4 py-3 z-20 border-t border-white/5">
        <span className="text-sm select-none" style={{ color: '#a78bfa' }}>❯</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-[12px] font-mono"
          style={{ color: '#e5e7eb', caretColor: '#a78bfa' }}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          disabled={isLoading}
          placeholder={isLoading ? 'Processing…' : ''}
        />
      </form>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Clock, Calendar, Mail } from 'lucide-react';
import { chatWithAssistant } from '@/app/actions/assistant';
import { ingestDocument } from '@/app/actions/knowledge';

export default function AssistantApp() {
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([
    { role: 'assistant', content: 'Hello! I am your Executive Assistant. I can schedule meetings, set timers, and send emails for you. How can I help today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
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
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'An unexpected error occurred.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncOS = async () => {
    setIsSyncing(true);
    try {
      const mails = JSON.parse(localStorage.getItem('synapse-mail-data') || '[]');
      const events = JSON.parse(localStorage.getItem('synapse-calendar-events') || '[]');
      
      let osStateReport = '# OS State Report\n\n';
      osStateReport += '## Recent Emails\n';
      mails.slice(0, 10).forEach((m: any) => {
        osStateReport += `- [${m.folder.toUpperCase()}] From: ${m.sender} (${m.email}) | Subject: ${m.subject}\n  Content: ${m.snippet}\n`;
      });

      osStateReport += '\n## Upcoming Calendar Events\n';
      events.slice(0, 10).forEach((e: any) => {
        osStateReport += `- [${e.date}/${e.month + 1}/${e.year}] ${e.time} - ${e.title}: ${e.description}\n`;
      });

      await ingestDocument('OS State Sync (Manual)', osStateReport);
      setMessages(prev => [...prev, { role: 'assistant', content: 'OS State successfully synced to your Vector Brain.' }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to sync OS State.' }]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-white font-sans relative overflow-hidden">
      
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))' }}>
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Executive Assistant</h1>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>Powered by OpenRouter</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleSyncOS}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))',
              color: 'white',
              opacity: isSyncing ? 0.7 : 1
            }}
          >
            {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
            Sync OS State
          </button>
          <div className="flex flex-col items-center justify-center text-xs" style={{ color: 'var(--text-ghost)' }}>
            <Mail size={14} className="mb-1" /> Sends Mails
          </div>
          <div className="flex flex-col items-center justify-center text-xs" style={{ color: 'var(--text-ghost)' }}>
            <Calendar size={14} className="mb-1" /> Modifies Calendar
          </div>
        </div>
      </div>

      {activeTimer && (
        <div className="px-6 py-2 border-b flex items-center gap-2 text-sm font-bold animate-fade-in" 
             style={{ background: 'var(--accent-warning-dim)', color: 'var(--accent-warning)', borderColor: 'var(--glass-border)' }}>
          <Clock size={14} className="animate-pulse" />
          {activeTimer}
        </div>
      )}

      {/* ── Chat History ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm"
                   style={{ 
                     background: isUser ? 'var(--surface-3)' : 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))',
                     border: isUser ? '1px solid var(--glass-border)' : 'none'
                   }}>
                {isUser ? <User size={14} style={{ color: 'var(--text-secondary)' }} /> : <Bot size={14} className="text-white" />}
              </div>
              
              <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                   style={{ 
                     background: isUser ? 'var(--surface-2)' : 'var(--surface-1)',
                     border: '1px solid var(--glass-border)',
                     color: 'var(--text-primary)',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                   }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                 style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))' }}>
              <Bot size={14} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-5 py-3 text-sm flex items-center gap-2"
                 style={{ background: 'var(--surface-1)', border: '1px solid var(--glass-border)', color: 'var(--text-ghost)' }}>
              <Loader2 size={14} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-4 bg-transparent border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to schedule a meeting, send an email, or set a timer..."
            className="w-full rounded-xl pl-4 pr-12 py-3 text-sm outline-none transition-all shadow-inner"
            style={{ 
              background: 'var(--surface-2)', 
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: input.trim() ? 'var(--accent-primary)' : 'var(--surface-3)', color: 'white' }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>

    </div>
  );
}

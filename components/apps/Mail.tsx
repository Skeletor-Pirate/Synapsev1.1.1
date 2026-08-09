'use client';

import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  AlertCircle,
  Search,
  PenSquare,
  Reply,
  Forward,
  Star,
  Archive,
  MoreVertical,
  X,
  Paperclip,
  Maximize2,
  Minimize2,
  CornerUpLeft,
  Loader2
} from 'lucide-react';
import { sendEmailAction } from '@/app/actions/mail';

// Mock Data
const MOCK_EMAILS = [
  {
    id: 1,
    folder: 'inbox',
    sender: 'Sarah Jenkins',
    email: 'sarah.j@synapsecfo.com',
    subject: 'Q3 Financial Forecast Review',
    snippet: 'Hi team, please find attached the revised Q3 forecast based on the new marketing spend. Let me know if you have any questions before the board meeting.',
    content: "Hi team,\n\nPlease find attached the revised Q3 forecast based on the new marketing spend. I've adjusted the customer acquisition cost (CAC) assumptions which improved our projected EBITDA by 4.2%.\n\nLet me know if you have any questions before the board meeting on Thursday.\n\nBest,\nSarah Jenkins\nVP of Finance",
    date: '10:42 AM',
    unread: true,
    starred: true,
  },
  {
    id: 2,
    folder: 'inbox',
    sender: 'Stripe',
    email: 'receipts@stripe.com',
    subject: 'Your Stripe payout is on its way',
    snippet: 'A payout of $124,500.00 USD is on its way to your bank account. It should arrive by tomorrow.',
    content: "Hi Synapse Corp,\n\nA payout of $124,500.00 USD is on its way to your bank account ending in 4921. It should arrive by tomorrow.\n\nView details in your dashboard.\n\n- The Stripe Team",
    date: 'Yesterday',
    unread: false,
    starred: false,
  },
  {
    id: 3,
    folder: 'inbox',
    sender: 'Legal Team',
    email: 'legal@synapsecfo.com',
    subject: 'Action Required: Updated Terms of Service',
    snippet: 'Please review and approve the updated Terms of Service for the new DataMarket feature before launch next week.',
    content: "Hello,\n\nPlease review and approve the updated Terms of Service for the new DataMarket feature. We need final sign-off before the launch next week.\n\nChanges primarily cover the new API usage limits and data compliance in the EU.\n\nThanks,\nLegal",
    date: 'Aug 8',
    unread: true,
    starred: false,
  },
  {
    id: 4,
    folder: 'sent',
    sender: 'Me',
    email: 'admin@synapsecfo.com',
    subject: 'Re: Budget Allocation 2025',
    snippet: 'Approved. Proceed with the $45k allocation to the Cloud infrastructure team.',
    content: "Approved.\n\nProceed with the $45k allocation to the Cloud infrastructure team. Make sure to log this under Q4 Capital Expenditures.\n\nBest,\nAdmin",
    date: 'Aug 5',
    unread: false,
    starred: false,
  },
];

type FolderType = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash';

export default function Mail() {
  const [activeFolder, setActiveFolder] = useState<FolderType>('inbox');
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [emails, setEmails] = useState(MOCK_EMAILS);
  
  // Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composeMaximized, setComposeMaximized] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(e => e.folder === 'inbox' && e.unread).length },
    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: FileText, count: 2 },
    { id: 'spam', label: 'Spam', icon: AlertCircle, count: 0 },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
  ];

  const currentEmails = emails.filter(e => 
    e.folder === activeFolder && 
    (e.subject.toLowerCase().includes(search.toLowerCase()) || e.sender.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSend = async () => {
    if (!composeTo || !composeSubject) return;
    
    setIsSending(true);
    
    // Call Resend Server Action
    const result = await sendEmailAction(composeTo, composeSubject, composeBody);
    
    setIsSending(false);
    
    if (result.success) {
      const newEmail = {
        id: Date.now(),
        folder: 'sent',
        sender: 'Me',
        email: 'admin@synapsecfo.com',
        subject: composeSubject,
        snippet: composeBody.substring(0, 100),
        content: composeBody,
        date: 'Just now',
        unread: false,
        starred: false,
      };
      
      setEmails([newEmail, ...emails]);
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    } else {
      alert(`Failed to send email: ${result.error}`);
    }
  };

  const markAsRead = (id: number) => {
    setEmails(emails.map(e => e.id === id ? { ...e, unread: false } : e));
  };

  const toggleStar = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setEmails(emails.map(email => email.id === id ? { ...email, starred: !email.starred } : email));
  };

  return (
    <div className="h-full flex relative overflow-hidden bg-transparent text-white font-sans">
      
      {/* ── Sidebar ── */}
      <div 
        className="w-60 flex flex-col p-4 border-r"
        style={{ borderColor: 'var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}
      >
        <button
          onClick={() => setIsComposing(true)}
          className="w-full mb-6 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all hover:brightness-110 active:scale-95 shadow-lg"
          style={{ 
            background: 'var(--accent-primary)',
            boxShadow: '0 4px 14px var(--accent-primary-glow)' 
          }}
        >
          <PenSquare size={16} /> Compose
        </button>

        <nav className="flex-1 space-y-1">
          {folders.map(f => {
            const Icon = f.icon;
            const isActive = activeFolder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setActiveFolder(f.id as FolderType); setSelectedEmail(null); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--surface-3)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-ghost)' }} />
                  {f.label}
                </div>
                {f.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" 
                        style={{ background: 'var(--accent-primary)', color: 'white' }}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Email List ── */}
      <div 
        className="w-[340px] flex flex-col border-r flex-shrink-0"
        style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-1)' }}
      >
        {/* Search Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--text-ghost)' }} />
            <input 
              type="text" 
              placeholder="Search mail..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors focus:ring-1"
              style={{ 
                background: 'var(--surface-3)', 
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--accent-primary)' 
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentEmails.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-ghost)' }}>
              No messages found.
            </div>
          ) : (
            currentEmails.map(email => {
              const isSelected = selectedEmail?.id === email.id;
              return (
                <div 
                  key={email.id}
                  onClick={() => { setSelectedEmail(email); markAsRead(email.id); }}
                  className="p-4 border-b cursor-pointer transition-colors relative group"
                  style={{ 
                    borderColor: 'var(--glass-border)',
                    background: isSelected ? 'var(--surface-3)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent'
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span 
                      className={`text-sm truncate pr-2 ${email.unread ? 'font-bold' : 'font-medium'}`}
                      style={{ color: email.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {email.sender}
                    </span>
                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-ghost)' }}>
                      {email.date}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 overflow-hidden">
                      <p 
                        className={`text-xs truncate mb-1 ${email.unread ? 'font-semibold' : 'font-medium'}`}
                        style={{ color: email.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {email.subject}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-ghost)' }}>
                        {email.snippet}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => toggleStar(e, email.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star size={14} fill={email.starred ? '#FEBC2E' : 'none'} color={email.starred ? '#FEBC2E' : 'var(--text-ghost)'} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Reading Pane ── */}
      <div className="flex-1 flex flex-col bg-transparent">
        {selectedEmail ? (
          <>
            {/* Toolbar */}
            <div className="h-14 flex items-center justify-between px-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Archive">
                  <Archive size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Delete">
                  <Trash2 size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Reply">
                  <CornerUpLeft size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="More">
                  <MoreVertical size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-3xl">
                <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                  {selectedEmail.subject}
                </h1>
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
                         style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-primary))' }}>
                      {selectedEmail.sender.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {selectedEmail.sender}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>
                        to me &lt;{selectedEmail.email}&gt;
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-ghost)' }}>
                    {selectedEmail.date}
                  </span>
                </div>

                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {selectedEmail.content}
                </div>

                {/* Reply Box Stub */}
                <div className="mt-12">
                  <div className="p-4 rounded-xl border flex gap-3 items-center cursor-text transition-colors hover:bg-white/[0.02]"
                       style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-2)' }}
                       onClick={() => { setIsComposing(true); setComposeTo(selectedEmail.email); setComposeSubject(`Re: ${selectedEmail.subject}`); }}>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Reply size={14} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-ghost)' }}>Reply to {selectedEmail.sender}...</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center shadow-lg"
                 style={{ background: 'var(--surface-3)', border: '1px solid var(--glass-border)' }}>
              <Inbox size={24} style={{ color: 'var(--text-ghost)' }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No message selected</h3>
            <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>Select an email from the list to read it.</p>
          </div>
        )}
      </div>

      {/* ── Compose Modal (Floating) ── */}
      {isComposing && (
        <div 
          className={`absolute bottom-4 right-4 flex flex-col shadow-2xl transition-all duration-300 ${composeMaximized ? 'inset-4 z-50 rounded-xl' : 'w-[500px] h-[550px] rounded-t-xl z-50'}`}
          style={{ 
            background: 'var(--surface-1)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
          }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3 flex items-center justify-between rounded-t-xl"
            style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--glass-border)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>New Message</span>
            <div className="flex gap-2">
              <button onClick={() => setComposeMaximized(!composeMaximized)} className="hover:bg-white/10 p-1 rounded transition-colors">
                {composeMaximized ? <Minimize2 size={14} style={{ color: 'var(--text-ghost)' }} /> : <Maximize2 size={14} style={{ color: 'var(--text-ghost)' }} />}
              </button>
              <button onClick={() => setIsComposing(false)} className="hover:bg-red-500/20 hover:text-red-400 p-1 rounded transition-colors group">
                <X size={14} className="text-[var(--text-ghost)] group-hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col flex-1">
            <div className="border-b flex" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="px-4 py-3 text-sm" style={{ color: 'var(--text-ghost)' }}>To</span>
              <input 
                type="text" 
                value={composeTo}
                onChange={e => setComposeTo(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
            <div className="border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <input 
                type="text" 
                placeholder="Subject"
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm px-4 py-3"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            
            <textarea 
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm p-4 resize-none custom-scrollbar"
              style={{ color: 'var(--text-secondary)' }}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <button 
              onClick={handleSend}
              disabled={isSending}
              className="px-6 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {isSending ? 'Sending...' : 'Send'} 
              {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
            
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Paperclip size={16} style={{ color: 'var(--text-ghost)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

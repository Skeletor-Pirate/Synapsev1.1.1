'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, LogOut, Lock, ChevronRight, Zap } from 'lucide-react';
import { AppDefinition, AppId } from './AppRegistry';

interface AppDrawerProps {
  isOpen: boolean;
  apps: AppDefinition[];
  onAppClick: (appId: AppId) => void;
  onSignOut: () => void;
  onLock: () => void;
  user: any;
}

export default function AppDrawer({ 
  isOpen, 
  apps, 
  onAppClick, 
  onSignOut, 
  onLock,
  user 
}: AppDrawerProps) {
  const [search, setSearch] = useState('');

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group apps into categories for a more OS-like feel
  const coreApps = filteredApps.filter(a => ['dashboard', 'calculator', 'calendar', 'mail', 'notes', 'explorer', 'terminal'].includes(a.id));
  const financeApps = filteredApps.filter(a => ['spendsense', 'predictivear', 'taxpilot', 'vendoriq', 'investiq', 'fpnastudio'].includes(a.id));
  const aiApps = filteredApps.filter(a => ['aibrain', 'voice', 'google'].includes(a.id));
  const otherApps = filteredApps.filter(a => !coreApps.includes(a) && !financeApps.includes(a) && !aiApps.includes(a));

  const renderAppGrid = (appList: AppDefinition[], startDelay: number = 0) => (
    <div className="grid grid-cols-5 gap-1">
      {appList.map((app, index) => (
        <motion.button
          key={app.id}
          onClick={() => onAppClick(app.id)}
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            delay: startDelay + index * 0.03, 
            duration: 0.25, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-150 group hover:bg-white/[0.04] active:scale-95"
        >
          <div className={`w-11 h-11 rounded-[13px] ${app.color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            <app.icon size={20} className="text-white drop-shadow-sm" />
          </div>
          <span 
            className="text-[10px] font-medium text-center truncate w-full leading-tight transition-colors duration-150"
            style={{ color: 'var(--text-secondary)' }}
          >
            {app.name}
          </span>
        </motion.button>
      ))}
    </div>
  );

  const SectionHeader = ({ label, count }: { label: string; count: number }) => (
    <div className="flex items-center justify-between mb-2 mt-5 first:mt-0">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-ghost)' }}>
        {label}
      </h3>
      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: 'var(--text-ghost)', background: 'var(--surface-3)' }}>
        {count}
      </span>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[560px] max-h-[640px] rounded-2xl z-[150] flex flex-col overflow-hidden pointer-events-auto"
          style={{
            background: 'rgba(10, 10, 18, 0.9)',
            backdropFilter: 'blur(48px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(48px) saturate(1.4)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
          }}
        >
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

          {/* Search */}
          <div className="p-5 pb-3">
            <div className="relative group">
              <Search 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
                size={14}
                style={{ color: 'var(--text-ghost)' }}
              />
              <input 
                type="text" 
                placeholder="Search apps…" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl text-sm font-medium focus:outline-none transition-all duration-200"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Apps Sections */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 custom-scrollbar">
            {search ? (
              <>
                <SectionHeader label="Results" count={filteredApps.length} />
                {renderAppGrid(filteredApps)}
              </>
            ) : (
              <>
                {coreApps.length > 0 && (
                  <>
                    <SectionHeader label="System" count={coreApps.length} />
                    {renderAppGrid(coreApps, 0)}
                  </>
                )}
                {financeApps.length > 0 && (
                  <>
                    <SectionHeader label="Finance" count={financeApps.length} />
                    {renderAppGrid(financeApps, 0.1)}
                  </>
                )}
                {aiApps.length > 0 && (
                  <>
                    <SectionHeader label="AI & Search" count={aiApps.length} />
                    {renderAppGrid(aiApps, 0.2)}
                  </>
                )}
                {otherApps.length > 0 && (
                  <>
                    <SectionHeader label="Other" count={otherApps.length} />
                    {renderAppGrid(otherApps, 0.25)}
                  </>
                )}
              </>
            )}
          </div>

          {/* User Footer */}
          <div 
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.015)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  boxShadow: '0 2px 8px var(--accent-primary-glow)',
                }}
              >
                {user?.displayName?.[0] || 'U'}
              </div>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.displayName || 'User'}
                </p>
                <p className="text-[9px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--text-ghost)' }}>
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={onLock}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-white/[0.05]"
                title="Lock"
              >
                <Lock size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>
              <button 
                onClick={onSignOut}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-white/[0.05]"
                title="Sign out"
              >
                <LogOut size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, LogOut, Lock, Sparkles, FileText, Activity } from 'lucide-react';
import { AppDefinition } from './AppRegistry';

interface AppDrawerProps {
  isOpen: boolean;
  apps: AppDefinition[];
  onAppClick: (appId: any) => void;
  onClose: () => void;
  onSignOut: () => void;
  onLock: () => void;
  user: any;
}

export default function AppDrawer({ 
  isOpen, 
  apps, 
  onAppClick, 
  onClose,
  onSignOut, 
  onLock,
  user 
}: AppDrawerProps) {
  const [search, setSearch] = useState('');

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 1.06, filter: 'blur(16px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.94, filter: 'blur(16px)' }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
          className="fixed inset-0 top-10 z-[170] bg-black/15 backdrop-blur-3xl saturate-[250%] flex flex-col items-center justify-between p-6 sm:p-10 pointer-events-auto select-none cursor-pointer"
        >
          {/* Top Floating Glass Search Pill */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mt-4 cursor-default"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={20} />
              <input 
                type="text" 
                placeholder="SEARCH APPS & COMMANDS..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full text-xs font-black text-white uppercase tracking-wider placeholder-white/40 focus:outline-none focus:bg-white/20 focus:border-cyan-400 shadow-2xl transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* macOS Organic Floating App Grid (No Box Container) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex-1 w-full max-w-5xl overflow-y-auto my-6 custom-scrollbar px-4 flex flex-col justify-between cursor-default"
          >
            <div>
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-3">
                <h3 className="text-xs font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-400 animate-pulse" /> SYNAPSE APPLICATIONS
                </h3>
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">{filteredApps.length} INSTALLED</span>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 sm:gap-8 justify-items-center">
                {filteredApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppClick(app.id);
                    }}
                    className="flex flex-col items-center gap-3 p-3 rounded-3xl transition-all group hover:scale-110 duration-200"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] ${app.color} flex items-center justify-center border-2 border-white/30 shadow-2xl group-hover:border-white group-hover:shadow-cyan-500/30 transition-all duration-200`}>
                      <app.icon size={36} className="text-white drop-shadow-lg sm:size-[42px]" />
                    </div>
                    <span className="text-xs font-black text-white group-hover:text-cyan-300 uppercase tracking-wider transition-colors text-center truncate w-24 sm:w-28 drop-shadow-md">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  onClick={(e) => { e.stopPropagation(); onAppClick('spendsense'); }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">EXPENSE ANOMALY</p>
                    <p className="text-[10px] font-bold text-cyan-300 uppercase">RUN RISK SCAN</p>
                  </div>
                </div>

                <div 
                  onClick={(e) => { e.stopPropagation(); onAppClick('predictivear'); }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400/50 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">PREDICTIVE AR</p>
                    <p className="text-[10px] font-bold text-cyan-300 uppercase">CASHFLOW FORECAST</p>
                  </div>
                </div>

                <div 
                  onClick={(e) => { e.stopPropagation(); onAppClick('fpnastudio'); }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">FP&A STUDIO</p>
                    <p className="text-[10px] font-bold text-cyan-300 uppercase">MODEL SCENARIOS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Glass Footer Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-white/10 backdrop-blur-2xl rounded-2xl px-6 py-3 flex items-center justify-between text-white border border-white/20 shadow-2xl cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-black text-white border border-white/30 shadow-md">
                {user?.displayName?.[0] || 'A'}
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">{user?.displayName || 'MASTER ADMIN'}</p>
                <p className="text-[10px] text-cyan-400 font-mono font-bold">SYNAPSE OS EXECUTIVE V1.1.1</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onLock(); }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Lock size={14} /> LOCK
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onSignOut(); }}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-xs font-black text-red-200 uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <LogOut size={14} /> SIGN OUT
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

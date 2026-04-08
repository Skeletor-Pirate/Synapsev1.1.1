'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, LogOut, Lock } from 'lucide-react';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[640px] h-[720px] bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-[150] flex flex-col overflow-hidden pointer-events-auto"
        >
          {/* Search Bar */}
          <div className="p-8 pb-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search for apps, settings, and documents" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/5 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white/10 focus:border-white/10 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Apps Grid */}
          <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pinned Apps</h3>
              <button className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors">All Apps &gt;</button>
            </div>
            
            <div className="grid grid-cols-6 gap-2">
              {filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => onAppClick(app.id)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <app.icon size={24} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors text-center truncate w-full">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Recommended Section */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recommended</h3>
                <button className="text-[10px] font-bold text-zinc-400 hover:text-white transition-colors">More &gt;</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                      <Search size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-300">Financial Report Q{i}.pdf</p>
                      <p className="text-[10px] text-zinc-500">Recently opened</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer / User Profile */}
          <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black border-2 border-white/10">
                {user?.displayName?.[0] || 'U'}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user?.displayName || 'User'}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{user?.role || 'Administrator'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={onLock}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                title="Lock"
              >
                <Lock size={18} />
              </button>
              <button 
                onClick={onSignOut}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Mic } from 'lucide-react';
import { AppDefinition, AppId } from './AppRegistry';

interface TaskbarProps {
  openApps: AppId[];
  activeApp: AppId | null;
  minimizedApps: AppId[];
  onAppClick: (appId: AppId) => void;
  onStartClick: () => void;
  isStartOpen: boolean;
  apps: AppDefinition[];
}

export default function Taskbar({ 
  openApps, 
  activeApp, 
  minimizedApps, 
  onAppClick, 
  onStartClick, 
  isStartOpen,
  apps 
}: TaskbarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const pinnedApps: AppId[] = [
    'dashboard', 
    'spendsense', 
    'predictivear', 
    'fpnastudio', 
    'taxpilot', 
    'vendoriq', 
    'investiq', 
    'explorer', 
    'terminal', 
    'calculator', 
    'calendar', 
    'notes', 
    'music',
    'aibrain',
    'settings'
  ];

  const dockApps = Array.from(new Set([...pinnedApps, ...openApps]));

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-0 right-0 h-20 sm:h-24 flex items-end justify-center px-2 sm:px-4 z-[160] pointer-events-none max-w-full">
      <motion.div 
        className="macos-glass px-2.5 sm:px-4 py-2 sm:py-3 rounded-3xl flex items-center gap-2 sm:gap-3.5 shadow-[0_30px_70px_rgba(0,0,0,0.85)] pointer-events-auto border-2 border-white/25 relative max-w-[98vw] overflow-x-auto no-scrollbar"
        initial={{ y: 60, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 220 }}
      >
        {/* Launchpad Button */}
        <div
          className="relative group flex flex-col items-center cursor-pointer shrink-0"
          onClick={onStartClick}
        >
          <div className="relative flex flex-col items-center">
            <button 
              className={`w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center rounded-2xl transition-all duration-300 border-2 ${
                isStartOpen 
                  ? 'bg-cyan-500/30 border-cyan-400 scale-105 shadow-lg shadow-cyan-500/40' 
                  : 'bg-white/10 border-white/20 hover:bg-white/25 hover:scale-105 hover:border-white/40'
              }`}
            >
              <LayoutGrid size={22} className="text-white drop-shadow-md" />
            </button>
          </div>

          <div className="hidden md:block absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl text-xs font-black text-white uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-2xl z-50">
            LAUNCHPAD
          </div>
        </div>

        <div className="w-0.5 h-7 sm:h-8 bg-white/20 mx-0.5 sm:mx-1 shrink-0" />

        {/* Dock Icons Container */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {dockApps.map((appId, idx) => {
            const app = apps.find(a => a.id === appId);
            if (!app) return null;

            const isOpen = openApps.includes(appId);
            const isActive = activeApp === appId;
            const isMinimized = minimizedApps.includes(appId);

            let scale = 1;
            if (hoveredIndex !== null) {
              const distance = Math.abs(hoveredIndex - idx);
              if (distance === 0) scale = 1.22;
              else if (distance === 1) scale = 1.1;
            }

            return (
              <div
                key={appId}
                className="relative group flex flex-col items-center cursor-pointer pb-2 shrink-0"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onAppClick(appId)}
              >
                <motion.div
                  animate={{ scale }}
                  transition={{ type: 'spring', damping: 18, stiffness: 320 }}
                  className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl ${app.color} flex items-center justify-center border-2 border-white/30 shadow-2xl transition-colors ${
                    isActive ? 'ring-4 ring-cyan-300 shadow-cyan-500/50' : 'hover:border-white/50'
                  } ${isMinimized ? 'opacity-50' : 'opacity-100'}`}
                >
                  <app.icon size={22} className="text-white drop-shadow-md sm:size-[26px]" />
                </motion.div>
                
                {isOpen && (
                  <div 
                    className={`absolute bottom-0 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-cyan-300 shadow-[0_0_12px_#67e8f9]' : 'bg-white/70'
                    }`} 
                  />
                )}

                <div className="hidden md:block absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl text-xs font-black text-white uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-2xl z-50">
                  {app.name.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-0.5 h-7 sm:h-8 bg-white/20 mx-0.5 sm:mx-1 shrink-0" />

        {/* Voice AI Dock Button */}
        <div
          className="relative group flex flex-col items-center cursor-pointer shrink-0"
          onClick={() => onAppClick('voice')}
        >
          <div className="relative flex flex-col items-center">
            <button 
              className="w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 border-2 border-cyan-300 shadow-lg shadow-cyan-500/40 hover:scale-105 transition-transform duration-200"
            >
              <Mic size={22} className="text-white animate-pulse sm:size-[26px]" />
            </button>
          </div>
          
          <div className="hidden md:block absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl text-xs font-black text-white uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-2xl z-50">
            SYNAPSE VOICE
          </div>
        </div>
      </motion.div>
    </div>
  );
}

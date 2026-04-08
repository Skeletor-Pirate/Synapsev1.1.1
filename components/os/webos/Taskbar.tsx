'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  const pinnedApps: AppId[] = ['dashboard', 'calculator', 'calendar', 'notes'];
  const taskbarApps = Array.from(new Set([...pinnedApps, ...openApps]));

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-center px-4 z-[100] pointer-events-none">
      <div className="bg-black/40 backdrop-blur-3xl border border-white/10 px-3 py-2 rounded-3xl flex items-center gap-2 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] pointer-events-auto mb-2">
        {/* Start Button */}
        <button 
          onClick={onStartClick}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${isStartOpen ? 'bg-white/20 scale-90' : 'hover:bg-white/10 hover:scale-110'}`}
        >
          <div className="grid grid-cols-2 gap-0.5 p-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-sm" />
            <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
            <div className="w-2 h-2 bg-amber-500 rounded-sm" />
            <div className="w-2 h-2 bg-rose-500 rounded-sm" />
          </div>
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />

        {/* Open Apps */}
        <div className="flex items-center gap-2">
          {taskbarApps.map((appId) => {
            const app = apps.find(a => a.id === appId);
            if (!app) return null;
            const isOpen = openApps.includes(appId);
            const isActive = activeApp === appId;
            const isMinimized = minimizedApps.includes(appId);

            return (
              <button
                key={appId}
                onClick={() => onAppClick(appId)}
                className={`relative group w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ease-out ${isActive ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5 hover:scale-110'}`}
              >
                <app.icon 
                  size={24} 
                  className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''} ${isMinimized ? 'opacity-50' : 'opacity-100'}`} 
                />
                
                {/* Active Indicator */}
                {isOpen && (
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 rounded-full bg-white transition-all duration-300 ${isActive ? 'w-4 opacity-100' : 'w-1 opacity-50'}`} />
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                  {app.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { motion, useDragControls } from 'motion/react';
import { X, Maximize2, Minus } from 'lucide-react';
import { AppDefinition } from './AppRegistry';

interface AppWindowProps {
  app: AppDefinition;
  isActive: boolean;
  isMaximized: boolean;
  zIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}

export default function AppWindow({ 
  app, 
  isActive, 
  isMaximized, 
  zIndex,
  onClose, 
  onMinimize, 
  onMaximize, 
  onFocus,
  children 
}: AppWindowProps) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag={!isMaximized}
      dragMomentum={false}
      dragControls={dragControls}
      dragListener={false}
      initial={{ opacity: 0, scale: 0.85, y: 40 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        zIndex: zIndex,
        width: isMaximized ? '100%' : '80%',
        height: isMaximized ? '100%' : '85vh',
        top: isMaximized ? 0 : '7.5vh',
        left: isMaximized ? 0 : '10%',
        borderRadius: isMaximized ? 0 : 24
      }}
      exit={{ opacity: 0, scale: 0.85, y: 40 }}
      transition={{ type: 'spring', damping: 30, stiffness: 250, mass: 0.8 }}
      className={`absolute bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col overflow-hidden pointer-events-auto ${isActive ? 'ring-1 ring-white/20' : ''}`}
      onClick={onFocus}
    >
      {/* Window Title Bar */}
      <div 
        className={`h-10 flex items-center justify-between px-4 border-b select-none cursor-default transition-colors ${isActive ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5'}`}
        onPointerDown={(e) => {
          dragControls.start(e);
        }}
      >
        <div className="flex items-center gap-3 flex-1 h-full">
          <app.icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />
          <span className={`text-xs font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>{app.name}</span>
        </div>
        <div className="flex items-center">
          <button 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Maximize2 size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-10 h-10 flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {children}
      </div>
    </motion.div>
  );
}

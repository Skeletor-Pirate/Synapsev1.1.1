'use client';

import React, { useState } from 'react';
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
  const [isTrafficHovered, setIsTrafficHovered] = useState(false);

  return (
    <motion.div
      drag={!isMaximized}
      dragMomentum={false}
      dragControls={dragControls}
      dragListener={false}
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        zIndex: zIndex,
        width: isMaximized ? '100%' : '80%',
        height: isMaximized ? '100%' : '85vh',
        top: isMaximized ? 0 : '7.5vh',
        left: isMaximized ? 0 : '10%',
        borderRadius: isMaximized ? 0 : 16
      }}
      exit={{ opacity: 0, scale: 0.92, y: 24 }}
      transition={{ type: 'spring', damping: 32, stiffness: 280, mass: 0.7 }}
      className="absolute flex flex-col overflow-hidden pointer-events-auto"
      style={{
        background: isActive ? 'rgba(10, 10, 18, 0.88)' : 'rgba(10, 10, 18, 0.78)',
        backdropFilter: 'blur(40px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
        border: `1px solid ${isActive ? 'var(--glass-border-active)' : 'var(--glass-border)'}`,
        boxShadow: isActive 
          ? '0 24px 80px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.06) inset'
          : '0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25)',
        filter: isActive ? 'none' : 'brightness(0.92)',
        transition: 'filter 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}
      onClick={onFocus}
    >
      {/* ── Window Title Bar ── */}
      <div 
        className="h-10 flex items-center justify-between px-3 select-none cursor-default"
        style={{
          background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
          borderBottom: '1px solid var(--glass-border)',
        }}
        onPointerDown={(e) => {
          dragControls.start(e);
        }}
        onDoubleClick={onMaximize}
      >
        {/* Traffic light buttons */}
        <div 
          className="flex items-center gap-[7px] pl-1"
          onMouseEnter={() => setIsTrafficHovered(true)}
          onMouseLeave={() => setIsTrafficHovered(false)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-3 h-3 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ 
              background: isActive ? '#FF5F57' : 'rgba(255,255,255,0.1)',
              boxShadow: isActive ? '0 1px 3px rgba(255,95,87,0.3) inset' : 'none',
            }}
          >
            {isTrafficHovered && <X size={7} strokeWidth={3} className="text-black/60" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-3 h-3 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ 
              background: isActive ? '#FEBC2E' : 'rgba(255,255,255,0.1)',
              boxShadow: isActive ? '0 1px 3px rgba(254,188,46,0.3) inset' : 'none',
            }}
          >
            {isTrafficHovered && <Minus size={7} strokeWidth={3} className="text-black/60" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onMaximize(); }}
            className="w-3 h-3 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ 
              background: isActive ? '#28C840' : 'rgba(255,255,255,0.1)',
              boxShadow: isActive ? '0 1px 3px rgba(40,200,64,0.3) inset' : 'none',
            }}
          >
            {isTrafficHovered && <Maximize2 size={6} strokeWidth={3} className="text-black/60" />}
          </button>
        </div>

        {/* Window title - centered */}
        <div className="absolute left-0 right-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2">
            <app.icon size={12} style={{ color: isActive ? 'var(--text-secondary)' : 'var(--text-ghost)' }} />
            <span 
              className="text-[11px] font-medium"
              style={{ color: isActive ? 'var(--text-secondary)' : 'var(--text-ghost)' }}
            >
              {app.name}
            </span>
          </div>
        </div>

        {/* Spacer to keep layout balanced */}
        <div className="w-16" />
      </div>

      {/* ── Window Content ── */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {children}
      </div>
    </motion.div>
  );
}

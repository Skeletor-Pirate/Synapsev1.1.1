'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
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

/* ── Single Dock Item with magnification ── */
function DockItem({ 
  app, 
  isOpen, 
  isActive, 
  isMinimized, 
  mouseX, 
  onClick 
}: { 
  app: AppDefinition; 
  isOpen: boolean; 
  isActive: boolean; 
  isMinimized: boolean; 
  mouseX: any;
  onClick: () => void; 
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [44, 56, 44]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 200, damping: 15 });

  const handleClick = useCallback(() => {
    if (!isOpen) {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 500);
    }
    onClick();
  }, [isOpen, onClick]);

  return (
    <motion.button
      ref={ref}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width, height: width }}
      className="relative flex items-center justify-center rounded-[12px] transition-colors duration-150"
    >
      {/* Icon container */}
      <motion.div
        className={`w-full h-full rounded-[12px] ${app.color} flex items-center justify-center relative`}
        style={{
          boxShadow: isActive 
            ? '0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset' 
            : '0 2px 8px rgba(0,0,0,0.2)',
          filter: isMinimized ? 'brightness(0.5) saturate(0.5)' : 'none',
        }}
        animate={isBouncing ? {
          y: [0, -16, -4, -10, 0],
          transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
        } : { y: 0 }}
      >
        <app.icon size={20} className="text-white drop-shadow-sm" />
      </motion.div>

      {/* Running indicator dot */}
      {isOpen && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
          <div 
            className="rounded-full transition-all duration-300"
            style={{
              width: isActive ? 5 : 3,
              height: isActive ? 5 : 3,
              background: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: isActive ? '0 0 6px rgba(255,255,255,0.3)' : 'none',
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md whitespace-nowrap pointer-events-none"
            style={{
              background: 'var(--surface-4)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{app.name}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
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
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-center px-4 z-[100] pointer-events-none">
      <motion.div 
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-1.5 px-2.5 py-2 rounded-2xl pointer-events-auto mb-1.5"
        style={{
          background: 'rgba(8, 8, 16, 0.72)',
          backdropFilter: 'blur(40px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Start Button */}
        <motion.button 
          onClick={onStartClick}
          whileTap={{ scale: 0.9 }}
          className="w-11 h-11 flex items-center justify-center rounded-[11px] transition-all duration-200"
          style={{
            background: isStartOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
          }}
          onMouseEnter={e => { if (!isStartOpen) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { if (!isStartOpen) (e.target as HTMLElement).style.background = 'transparent'; }}
        >
          {/* Synapse mini logo */}
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <circle cx="12" cy="5" r="2" fill="#3B82F6" />
            <circle cx="5" cy="16" r="2" fill="#8B5CF6" />
            <circle cx="19" cy="16" r="2" fill="#06B6D4" />
            <line x1="12" y1="5" x2="5" y2="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="12" y1="5" x2="19" y2="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="5" y1="16" x2="19" y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          </svg>
        </motion.button>

        {/* Separator */}
        <div className="w-px h-7 mx-1 self-center" style={{ background: 'var(--glass-border)' }} />

        {/* Dock Items */}
        {taskbarApps.map((appId) => {
          const app = apps.find(a => a.id === appId);
          if (!app) return null;

          return (
            <DockItem
              key={appId}
              app={app}
              isOpen={openApps.includes(appId)}
              isActive={activeApp === appId}
              isMinimized={minimizedApps.includes(appId)}
              mouseX={mouseX}
              onClick={() => onAppClick(appId)}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

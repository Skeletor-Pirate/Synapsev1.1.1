'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Search, 
  Sliders, 
  Mic, 
  Battery, 
  Lock,
  Sparkles
} from 'lucide-react';

interface MacOSMenuBarProps {
  activeAppName: string;
  onOpenSpotlight: () => void;
  onToggleControlCenter: () => void;
  isControlCenterOpen: boolean;
  onOpenVoiceAssistant: () => void;
  onLock: () => void;
  onSignOut: () => void;
  user: any;
}

export default function MacOSMenuBar({
  activeAppName,
  onOpenSpotlight,
  onToggleControlCenter,
  isControlCenterOpen,
  onOpenVoiceAssistant,
  onLock,
  onSignOut,
  user
}: MacOSMenuBarProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-10 select-none z-[200] macos-menu-glass text-white flex items-center justify-between px-2 sm:px-4 font-bold tracking-wide shadow-md max-w-full overflow-hidden">
      {/* Left Menu Section */}
      <div className="flex items-center gap-2 sm:gap-4 truncate">
        {/* Synapse Logo Badge */}
        <div 
          onClick={onOpenSpotlight}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer px-2 sm:px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 transition-all text-white shrink-0"
        >
          <Sparkles size={15} className="text-cyan-400 animate-pulse" />
          <span className="font-black tracking-widest text-xs sm:text-sm text-cyan-300 uppercase">SYNAPSE</span>
        </div>

        {/* Active Application Name */}
        <span className="font-extrabold text-white text-xs sm:text-sm uppercase px-1.5 sm:px-2 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer tracking-wider truncate">
          {activeAppName ? activeAppName.toUpperCase() : 'DESKTOP'}
        </span>

        {/* Capitalized Menu Options (Hidden on Mobile/Small screens) */}
        <div className="hidden lg:flex items-center gap-2 text-zinc-300 text-xs font-bold uppercase tracking-wider">
          {['FILE', 'EDIT', 'VIEW', 'ANALYTICS', 'AGENTS', 'HELP'].map((item) => (
            <button
              key={item}
              className="px-2 py-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls Section */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Voice AI Trigger Button */}
        <button
          onClick={onOpenVoiceAssistant}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 border border-cyan-300/40 hover:scale-105 active:scale-95 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all shadow-md"
          title="SYNAPSE VOICE ENGINE"
        >
          <Mic size={14} className="text-white animate-pulse" />
          <span className="hidden sm:inline">VOICE ENGINE</span>
        </button>

        {/* Spotlight Search */}
        <button
          onClick={onOpenSpotlight}
          className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white hover:text-cyan-300 transition-all"
          title="SPOTLIGHT SEARCH (⌘SPACE)"
        >
          <Search size={15} />
        </button>

        {/* Control Center Toggle */}
        <button
          onClick={onToggleControlCenter}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
            isControlCenterOpen 
              ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-lg' 
              : 'bg-white/5 border-white/10 hover:bg-white/15 text-white'
          }`}
          title="CONTROL CENTER"
        >
          <Sliders size={15} />
        </button>

        {/* System Indicators (Hidden on small mobile screens) */}
        <div className="hidden sm:flex items-center gap-1.5 px-1 text-white">
          <Wifi size={15} className="text-cyan-400" />
          <Battery size={16} className="text-emerald-400" />
        </div>

        {/* Live Date & Time */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] sm:text-xs font-black tracking-wider text-white">
          <span className="text-cyan-300 hidden md:inline">{date}</span>
          <span>{time}</span>
        </div>

        {/* Lock Screen */}
        <button
          onClick={onLock}
          className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-zinc-300 hover:text-red-300 transition-all"
          title="LOCK SESSION"
        >
          <Lock size={14} />
        </button>
      </div>
    </div>
  );
}

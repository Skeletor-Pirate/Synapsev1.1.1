'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Bluetooth, 
  Volume2, 
  Mic, 
  Sparkles, 
  Moon, 
  Lock, 
  LogOut,
  Cpu
} from 'lucide-react';

interface MacOSControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoice: () => void;
  onLock: () => void;
  onSignOut: () => void;
  user: any;
}

export default function MacOSControlCenter({
  isOpen,
  onClose,
  onOpenVoice,
  onLock,
  onSignOut,
  user
}: MacOSControlCenterProps) {
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [volume, setVolume] = useState(85);
  const [neuralIntensity, setNeuralIntensity] = useState(90);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[180]" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, y: -20, filter: 'blur(8px)' }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed top-12 right-2 sm:right-4 w-[92vw] sm:w-96 macos-glass rounded-3xl shadow-[0_35px_80px_rgba(0,0,0,0.85)] z-[190] p-4 text-white select-none border-2 border-white/25"
          >
            {/* Connection Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="glass-card rounded-2xl p-3 flex flex-col gap-3">
                <button
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  className="flex items-center gap-3 group cursor-pointer text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    wifiEnabled ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40' : 'bg-white/10 text-white/50'
                  }`}>
                    <Wifi size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">WI-FI</p>
                    <p className="text-[10px] font-bold text-cyan-300">{wifiEnabled ? 'SECURE-5G' : 'OFF'}</p>
                  </div>
                </button>

                <button
                  onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                  className="flex items-center gap-3 group cursor-pointer text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    bluetoothEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'bg-white/10 text-white/50'
                  }`}>
                    <Bluetooth size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">BLUETOOTH</p>
                    <p className="text-[10px] font-bold text-cyan-300">{bluetoothEnabled ? 'NEURAL LINK' : 'OFF'}</p>
                  </div>
                </button>
              </div>

              <div className="glass-card rounded-2xl p-3 flex flex-col justify-between gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-3 group cursor-pointer text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    darkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/10 text-white/50'
                  }`}>
                    <Moon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">THEME</p>
                    <p className="text-[10px] font-bold text-cyan-300">{darkMode ? 'DARK MODE' : 'LIGHT MODE'}</p>
                  </div>
                </button>

                <button
                  onClick={() => { onClose(); onOpenVoice(); }}
                  className="flex items-center gap-3 group cursor-pointer text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/40 hover:scale-105 transition-transform duration-200">
                    <Mic size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-cyan-300 uppercase tracking-wider">VOICE AI</p>
                    <p className="text-[10px] font-bold text-white/70">ACTIVE MIC</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Neural System Diagnostics Card */}
            <div className="glass-card rounded-2xl p-3.5 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                  <Cpu size={18} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">NEURAL CORE</p>
                  <p className="text-[10px] font-bold text-emerald-400 font-mono">GEMINI 3.6 FLASH</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-widest shadow-md">
                100% ONLINE
              </span>
            </div>

            {/* Glass Sliders */}
            <div className="glass-card rounded-2xl p-3.5 flex flex-col gap-3.5 mb-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-white">
                  <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-cyan-400 animate-pulse" /> AI INTENSITY</span>
                  <span className="text-cyan-300 font-mono">{neuralIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={neuralIntensity}
                  onChange={(e) => setNeuralIntensity(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-white">
                  <span className="flex items-center gap-1.5"><Volume2 size={14} className="text-blue-400" /> VOLUME</span>
                  <span className="text-blue-300 font-mono">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-blue-500 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Admin User Footer */}
            <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-sm text-white border-2 border-white/30 shadow-md">
                  {user?.displayName?.[0] || 'A'}
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">{user?.displayName || 'MASTER ADMIN'}</p>
                  <p className="text-[10px] font-bold text-cyan-400 font-mono">AUTHENTICATED</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onLock}
                  className="p-2 rounded-xl glass-card glass-card-hover text-white"
                  title="LOCK SESSION"
                >
                  <Lock size={16} />
                </button>
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 transition-colors"
                  title="SIGN OUT"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import React from 'react';
import { 
  Activity, 
  Cpu, 
  MemoryStick as Memory, 
  HardDrive, 
  X,
  RefreshCw
} from 'lucide-react';

interface TaskManagerProps {
  user: any;
  openApps: string[];
  onCloseApp: (appId: any) => void;
  apps: any[];
}

export default function TaskManager({ user, openApps, onCloseApp, apps }: TaskManagerProps) {
  const cpuUsage = Math.min(100, openApps.length * 12 + 2);
  const memoryUsage = (openApps.length * 0.4 + 1.2).toFixed(1);

  return (
    <div className="h-full flex flex-col bg-transparent text-white font-sans">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4 p-6 border-b border-zinc-800">
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <Cpu size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">CPU Usage</span>
          </div>
          <p className="text-2xl font-black tracking-tighter text-emerald-500">{cpuUsage}%</p>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <Memory size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Memory</span>
          </div>
          <p className="text-2xl font-black tracking-tighter text-blue-500">{memoryUsage} GB</p>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
            <HardDrive size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Disk</span>
          </div>
          <p className="text-2xl font-black tracking-tighter text-amber-500">4%</p>
        </div>
      </div>

      {/* Processes List */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Active Processes</h3>
          <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {openApps.map((appId) => {
            const app = apps.find(a => a.id === appId);
            if (!app) return null;

            return (
              <div key={appId} className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800 hover:bg-zinc-900/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center shadow-lg`}>
                    <app.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{app.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Running</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="hidden md:block text-right">
                    <p className="text-xs font-bold text-zinc-400">0.8% CPU</p>
                    <p className="text-[10px] text-zinc-600">142 MB</p>
                  </div>
                  <button 
                    onClick={() => onCloseApp(appId)}
                    className="p-2 bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {openApps.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-zinc-600 italic">
              <Activity size={32} className="mb-2 opacity-20" />
              <p className="text-sm">No active processes found.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

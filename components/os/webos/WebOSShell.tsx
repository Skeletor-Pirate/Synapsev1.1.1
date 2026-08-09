'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CFOGlance from '@/components/apps/dashboard/CFOGlance';
import {
  Wifi,
  Volume2, 
  Search as SearchIcon, 
  Command,
  Bell,
  User,
  LogOut,
  Lock,
  LayoutDashboard,
  Folder,
  FileText,
  File,
  Mic,
  BatteryMedium,
  Zap,
  ChevronRight,
  Sparkles,
  Shield
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { seedInitialData } from '@/lib/seed';
import { useFileSystem } from '@/hooks/useFileSystem';
import { logUserLogin, logAppUsage, syncUserAction } from '@/lib/analytics';

import { AppRegistry, AppId, AppDefinition } from './AppRegistry';
import AppWindow from './AppWindow';
import Taskbar from './Taskbar';
import AppDrawer from './AppDrawer';
import VoiceAssistant from './VoiceAssistant';

/* ── Synapse Logo SVG ── */
function SynapseLogo({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <div className={`relative ${animated ? 'animate-float' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Neural network nodes */}
        <circle cx="20" cy="8" r="3" fill="url(#nodeGrad1)" className={animated ? 'animate-breathe' : ''} />
        <circle cx="8" cy="26" r="3" fill="url(#nodeGrad2)" className={animated ? 'animate-breathe' : ''} style={{ animationDelay: '0.3s' }} />
        <circle cx="32" cy="26" r="3" fill="url(#nodeGrad3)" className={animated ? 'animate-breathe' : ''} style={{ animationDelay: '0.6s' }} />
        <circle cx="20" cy="32" r="2.5" fill="url(#nodeGrad4)" className={animated ? 'animate-breathe' : ''} style={{ animationDelay: '0.9s' }} />
        <circle cx="14" cy="16" r="2" fill="url(#nodeGrad1)" opacity="0.6" />
        <circle cx="26" cy="16" r="2" fill="url(#nodeGrad2)" opacity="0.6" />
        {/* Connections */}
        <line x1="20" y1="8" x2="8" y2="26" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="8" x2="32" y2="26" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.4" />
        <line x1="8" y1="26" x2="32" y2="26" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.3" />
        <line x1="8" y1="26" x2="20" y2="32" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.3" />
        <line x1="32" y1="26" x2="20" y2="32" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.3" />
        <line x1="14" y1="16" x2="26" y2="16" stroke="url(#lineGrad)" strokeWidth="0.8" opacity="0.25" />
        <defs>
          <linearGradient id="nodeGrad1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3B82F6"/><stop offset="1" stopColor="#60A5FA"/></linearGradient>
          <linearGradient id="nodeGrad2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8B5CF6"/><stop offset="1" stopColor="#A78BFA"/></linearGradient>
          <linearGradient id="nodeGrad3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#06B6D4"/><stop offset="1" stopColor="#22D3EE"/></linearGradient>
          <linearGradient id="nodeGrad4" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#10B981"/><stop offset="1" stopColor="#34D399"/></linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3B82F6" stopOpacity="0.6"/><stop offset="1" stopColor="#8B5CF6" stopOpacity="0.6"/></linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ── Mesh Gradient Wallpaper (CSS only, no external images) ── */
function DesktopWallpaper() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, hsla(217, 60%, 12%, 1) 0%, transparent 70%)' }} />
      {/* Floating orbs */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          top: '-10%', right: '-5%',
          background: 'radial-gradient(circle, hsla(217, 91%, 60%, 0.12) 0%, transparent 70%)',
          animation: 'meshFloat1 30s ease-in-out infinite',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          bottom: '5%', left: '-5%',
          background: 'radial-gradient(circle, hsla(265, 80%, 62%, 0.1) 0%, transparent 70%)',
          animation: 'meshFloat2 35s ease-in-out infinite',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 350, height: 350,
          top: '50%', left: '40%',
          background: 'radial-gradient(circle, hsla(190, 90%, 50%, 0.06) 0%, transparent 70%)',
          animation: 'meshFloat3 28s ease-in-out infinite',
          filter: 'blur(60px)',
        }}
      />
      {/* Noise grain overlay */}
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}

export default function WebOSShell() {
  const fileSystem = useFileSystem();
  const [user, setUser] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [openApps, setOpenApps] = useState<AppId[]>([]);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [minimizedApps, setMinimizedApps] = useState<AppId[]>([]);
  const [maximizedApps, setMaximizedApps] = useState<AppId[]>([]);
  const [zOrder, setZOrder] = useState<AppId[]>([]);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [appParams, setAppParams] = useState<Record<AppId, any>>({} as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState(new Date());

  const appStartTimes = useRef<Record<string, number>>({});

  const handleGesture = (gesture: string) => {
    if (gesture === 'pinch') {
      setIsStartOpen(prev => !prev);
    }
  };

  const handleOpenApp = useCallback((appId: AppId, params?: any) => {
    if (appId === 'voice' as any) {
      setIsVoiceAssistantOpen(true);
      return;
    }
    if (params) {
      setAppParams(prev => ({ ...prev, [appId]: params }));
    }
    setOpenApps(prev => {
      if (!prev.includes(appId)) {
        if (!appStartTimes.current[appId]) {
          appStartTimes.current[appId] = Date.now();
          if (user?.uid) syncUserAction(user.uid, 'app_opened', { appId });
        }
        return [...prev, appId];
      }
      return prev;
    });
    setZOrder(prev => [...prev.filter(id => id !== appId), appId]);
    setActiveApp(appId);
    setMinimizedApps(prev => prev.filter(id => id !== appId));
    setIsStartOpen(false);
    setIsCommandPaletteOpen(false);
  }, [user?.uid]);

  const handleCloseApp = useCallback((appId: AppId) => {
    setOpenApps(prev => prev.filter(id => id !== appId));
    setZOrder(prev => prev.filter(id => id !== appId));
    setMinimizedApps(prev => prev.filter(id => id !== appId));
    setMaximizedApps(prev => prev.filter(id => id !== appId));
    if (activeApp === appId) {
      setActiveApp(null);
    }
    
    const startTime = appStartTimes.current[appId];
    if (startTime && user?.uid) {
      const durationMs = Date.now() - startTime;
      logAppUsage(user.uid, appId, durationMs);
      syncUserAction(user.uid, 'app_closed', { appId, durationMs });
      delete appStartTimes.current[appId];
    }
  }, [activeApp, user?.uid]);

  const handleMinimizeApp = useCallback((appId: AppId) => {
    setMinimizedApps(prev => prev.includes(appId) ? prev : [...prev, appId]);
    setActiveApp(null);
  }, []);

  const handleToggleMaximizeApp = useCallback((appId: AppId) => {
    setMaximizedApps(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
    setActiveApp(appId);
    setZOrder(prev => [...prev.filter(id => id !== appId), appId]);
  }, []);

  const handleFocusApp = useCallback((appId: AppId) => {
    setActiveApp(appId);
    setZOrder(prev => [...prev.filter(id => id !== appId), appId]);
    setMinimizedApps(prev => prev.filter(id => id !== appId));
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const newUserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'no-email@example.com',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: 'admin',
            orgId: 'org_' + Math.random().toString(36).substring(2, 9),
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUserProfile);
          await seedInitialData(newUserProfile.orgId);
        }
        setFirebaseUser(fbUser);
        logUserLogin(fbUser.uid, fbUser.email);
        syncUserAction(fbUser.uid, 'user_login', { email: fbUser.email });
      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Global App Event Listener
  useEffect(() => {
    const handleGlobalOpenApp = (e: any) => {
      if (e.detail && e.detail.appId) {
        handleOpenApp(e.detail.appId, e.detail);
      }
    };
    window.addEventListener('open-app', handleGlobalOpenApp);
    return () => window.removeEventListener('open-app', handleGlobalOpenApp);
  }, [handleOpenApp]);

  // User Profile Listener
  useEffect(() => {
    if (!firebaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser({ ...firebaseUser, ...docSnap.data() });
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      setLoading(false);
    });
    return () => unsubscribeUser();
  }, [firebaseUser]);

  // Live Feed Listener
  useEffect(() => {
    if (!user?.orgId) return;
    const q = query(
      collection(db, 'transactions'), 
      where('orgId', '==', user.orgId),
      orderBy('timestamp', 'desc'), 
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feed = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLiveFeed(feed);
    });
    return () => unsubscribe();
  }, [user]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsStartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setOpenApps([]);
      setActiveApp(null);
      setMinimizedApps([]);
      setMaximizedApps([]);
      setIsStartOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  /* ═══ BOOT SCREEN ═══ */
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'var(--surface-0)' }}>
        <DesktopWallpaper />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          <SynapseLogo size={64} animated />
          <div className="mt-8 flex flex-col items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              SYNAPSE
            </h1>
            {/* Thin loading bar */}
            <div className="w-48 h-[2px] rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-purple))' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'linear' }}
              />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Initializing neural engine…</p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══ LOGIN SCREEN ═══ */
  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center overflow-hidden relative" style={{ background: 'var(--surface-0)' }}>
        <DesktopWallpaper />

        <motion.div 
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="glass-heavy rounded-3xl p-10 text-center relative overflow-hidden">
            {/* Subtle top edge gradient */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
            
            <div className="flex justify-center mb-6">
              <SynapseLogo size={56} animated />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              Synapse OS
            </h1>
            <p className="text-sm mb-10" style={{ color: 'var(--text-tertiary)' }}>
              AI-Native CFO Operating System
            </p>
            
            <button 
              onClick={handleSignIn}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97]"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                boxShadow: '0 4px 16px var(--accent-primary-glow), 0 1px 2px rgba(0,0,0,0.3)',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.filter = 'brightness(1)'; }}
            >
              <Shield size={16} />
              Continue with Google
            </button>

            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-success)' }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-ghost)' }}>
                Secure Enterprise Access
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══ LOCK SCREEN ═══ */
  if (isLocked) {
    return (
      <div 
        className="h-screen w-screen flex flex-col items-center justify-center relative cursor-pointer overflow-hidden"
        style={{ background: 'var(--surface-0)' }}
        onClick={() => setIsLocked(false)}
      >
        <DesktopWallpaper />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center"
        >
          <h1 
            className="text-8xl font-extralight tracking-tight mb-2"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-inter), Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}
          >
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="mt-20 flex flex-col items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}
            >
              <User size={24} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>Click anywhere to unlock</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const activeAppDef = activeApp ? AppRegistry.find(a => a.id === activeApp) : null;

  /* ═══ MAIN DESKTOP ═══ */
  return (
    <div className="h-screen w-screen overflow-hidden relative select-none" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
      {/* Desktop Wallpaper */}
      <DesktopWallpaper />

      {/* ── Top Bar (Menu Bar) ── */}
      <div 
        className="h-11 flex items-center justify-between px-5 relative z-[200]"
        style={{
          background: 'rgba(8, 8, 16, 0.72)',
          backdropFilter: 'blur(40px) saturate(1.4)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsStartOpen(prev => !prev)}
            className="flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-150 hover:bg-white/5 active:bg-white/10"
          >
            <SynapseLogo size={18} />
            <span className="text-[11px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Synapse</span>
          </button>

          {/* Active window title */}
          {activeAppDef && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {activeAppDef.name}
            </span>
          )}

          <div style={{ width: 1, height: 14, background: 'var(--glass-border)' }} />

          <button 
            onClick={() => setIsVoiceAssistantOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150 hover:bg-white/5 group"
          >
            <Mic size={12} style={{ color: 'var(--accent-primary)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Voice</span>
          </button>

          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md transition-all duration-150 hover:bg-white/5 group"
          >
            <SearchIcon size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Search</span>
            <div className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-3)' }}>
              <Command size={9} style={{ color: 'var(--text-ghost)' }} />
              <span className="text-[9px] font-semibold" style={{ color: 'var(--text-ghost)' }}>K</span>
            </div>
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Wifi size={13} style={{ color: 'var(--text-tertiary)' }} />
            <Volume2 size={13} style={{ color: 'var(--text-tertiary)' }} />
            <BatteryMedium size={15} style={{ color: 'var(--text-tertiary)' }} />
            <div className="relative">
              <Bell size={13} style={{ color: 'var(--text-tertiary)' }} />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-warning)' }} />
            </div>
          </div>
          <div style={{ width: 1, height: 14, background: 'var(--glass-border)' }} />
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[9px] font-medium" style={{ color: 'var(--text-ghost)' }}>
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Desktop Workspace ── */}
      <main className="absolute inset-0 top-11 bottom-14 pointer-events-none">
        {/* Desktop Icons */}
        <div className="grid grid-flow-col grid-rows-6 gap-1 w-fit pointer-events-auto p-6">
          {AppRegistry.filter(app => !app.hidden).map((app, index) => (
            <motion.button
              key={app.id}
              onDoubleClick={() => handleOpenApp(app.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-20 h-20 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all duration-200 group hover:bg-white/[0.04]"
            >
              <div 
                className={`w-11 h-11 rounded-[13px] ${app.color} flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg`}
              >
                <app.icon size={20} className="text-white drop-shadow-sm" />
              </div>
              <span 
                className="text-[10px] font-medium text-center leading-tight max-w-[72px] truncate transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
              >
                {app.name}
              </span>
            </motion.button>
          ))}
        </div>

        {/* App Windows */}
        <AnimatePresence>
          {openApps.map((appId) => {
            const app = AppRegistry.find(a => a.id === appId);
            if (!app || minimizedApps.includes(appId)) return null;

            return (
              <AppWindow
                key={appId}
                app={app}
                isActive={activeApp === appId}
                isMaximized={maximizedApps.includes(appId)}
                zIndex={zOrder.indexOf(appId) + 10}
                onClose={() => handleCloseApp(appId)}
                onMinimize={() => handleMinimizeApp(appId)}
                onMaximize={() => handleToggleMaximizeApp(appId)}
                onFocus={() => handleFocusApp(appId)}
              >
                <app.component 
                  user={user} 
                  liveFeed={liveFeed} 
                  openApps={openApps}
                  onCloseApp={handleCloseApp}
                  apps={AppRegistry}
                  fileSystem={fileSystem}
                  params={appParams[appId]}
                />
              </AppWindow>
            );
          })}
        </AnimatePresence>
      </main>

      {/* ── Taskbar ── */}
      <Taskbar 
        openApps={openApps}
        activeApp={activeApp}
        minimizedApps={minimizedApps}
        onAppClick={(appId) => {
          if (activeApp === appId) {
            handleMinimizeApp(appId);
          } else {
            handleFocusApp(appId);
          }
        }}
        onStartClick={() => setIsStartOpen(prev => !prev)}
        isStartOpen={isStartOpen}
        apps={AppRegistry.filter(app => !app.hidden)}
      />

      {/* ── App Drawer ── */}
      <AppDrawer 
        isOpen={isStartOpen}
        apps={AppRegistry.filter(app => !app.hidden)}
        onAppClick={handleOpenApp}
        onSignOut={handleSignOut}
        onLock={() => setIsLocked(true)}
        user={user}
      />

      {/* ── Voice Assistant ── */}
      <AnimatePresence>
        {isVoiceAssistantOpen && (
          <VoiceAssistant user={user} onClose={() => setIsVoiceAssistantOpen(false)} />
        )}
      </AnimatePresence>

      {/* ═══ COMMAND PALETTE ═══ */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl glass-heavy rounded-2xl overflow-hidden pointer-events-auto"
            >
              {/* Search input */}
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <SearchIcon size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <input 
                  type="text" 
                  placeholder="Search apps, files, commands…" 
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-3)' }}>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-ghost)' }}>ESC</span>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[360px] overflow-y-auto py-2 custom-scrollbar">
                {/* Apps section */}
                <div className="px-3 py-1">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-ghost)' }}>
                    Applications
                  </p>
                  {AppRegistry.filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase())).map((app, index) => (
                    <motion.button
                      key={app.id}
                      onClick={() => handleOpenApp(app.id)}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.15 }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-100 group hover:bg-white/[0.04]"
                    >
                      <div className={`w-8 h-8 rounded-lg ${app.color} flex items-center justify-center transition-transform duration-150 group-hover:scale-105`}>
                        <app.icon size={16} className="text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{app.name}</p>
                      </div>
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-ghost)' }} />
                    </motion.button>
                  ))}
                </div>

                {/* Files section */}
                {searchQuery && fileSystem.files.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                  <div className="px-3 py-1 mt-1" style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-ghost)' }}>
                      Files
                    </p>
                    {fileSystem.files.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((file: any) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          if (file.type === 'note') {
                            handleOpenApp('notes');
                            setTimeout(() => {
                              window.dispatchEvent(new CustomEvent('open-app', { detail: { appId: 'notes', fileId: file.id } }));
                            }, 50);
                          } else {
                            handleOpenApp('explorer');
                          }
                          setIsCommandPaletteOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-100 group hover:bg-white/[0.04]"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
                          {file.type === 'folder' ? (
                            <Folder size={16} style={{ color: 'var(--accent-primary)' }} />
                          ) : file.type === 'note' ? (
                            <FileText size={16} style={{ color: 'var(--accent-warning)' }} />
                          ) : (
                            <File size={16} style={{ color: 'var(--text-tertiary)' }} />
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-ghost)' }}>
                            {file.type === 'folder' ? 'Folder' : file.type === 'note' ? 'Note' : 'File'} · {file.size}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Backdrop */}
            <div 
              className="fixed inset-0 -z-10 pointer-events-auto"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
              onClick={() => setIsCommandPaletteOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

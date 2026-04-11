'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Mic
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
      // Toggle start menu on pinch
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
        // Fetch or create user profile in Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Create new user profile
          const newUserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'no-email@example.com',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: 'admin',
            orgId: 'org_' + Math.random().toString(36).substring(2, 9),
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUserProfile);
          
          // Seed initial data for new organization
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

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
        <div className="w-24 h-24 relative">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <h1 className="mt-8 text-2xl font-black tracking-tighter text-white animate-pulse">SYNAPSE OS</h1>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-zinc-900/20" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm scale-105" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md p-12 bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[40px] text-center"
        >
          <div className="w-24 h-24 bg-white rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl rotate-12">
            <div className="grid grid-cols-2 gap-1 p-2">
              <div className="w-4 h-4 bg-blue-500 rounded-sm" />
              <div className="w-4 h-4 bg-emerald-500 rounded-sm" />
              <div className="w-4 h-4 bg-amber-500 rounded-sm" />
              <div className="w-4 h-4 bg-rose-500 rounded-sm" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">Synapse OS</h1>
          <p className="text-zinc-500 text-sm font-medium mb-12">The AI-Native CFO Operating System</p>
          
          <button 
            onClick={handleSignIn}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95"
          >
            <User size={20} />
            Continue with Google
          </button>
          
          <p className="mt-8 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Secure Enterprise Access Only</p>
        </motion.div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div 
        className="h-screen w-screen bg-cover bg-center flex flex-col items-center justify-center relative cursor-pointer"
        style={{ backgroundImage: `url('${user.backgroundUrl || 'https://picsum.photos/seed/os/1920/1080'}')` }}
        onClick={() => setIsLocked(false)}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-8xl font-black text-white tracking-tighter mb-4">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-2xl font-medium text-white/80">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="mt-24 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <p className="text-xl font-bold text-white">{user.displayName}</p>
            <p className="text-sm text-white/60">Click to unlock</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050505] text-white overflow-hidden relative font-sans select-none">
      {/* Desktop Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-50 pointer-events-none" 
        style={{ backgroundImage: `url('${user.backgroundUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}')` }}
      />
      
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-6 bg-black/40 backdrop-blur-2xl border-b border-white/10 relative z-[200] shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 h-2 bg-blue-500 rounded-sm" />
              <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
              <div className="w-2 h-2 bg-amber-500 rounded-sm" />
              <div className="w-2 h-2 bg-rose-500 rounded-sm" />
            </div>
            <span className="text-xs font-black tracking-tighter">SYNAPSE</span>
          </div>
          
          <div className="h-4 w-px bg-white/10" />
          
          <div className="flex items-center gap-4 text-zinc-500">
            <button 
              onClick={() => setIsVoiceAssistantOpen(true)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors group"
            >
              <Mic size={14} className="group-hover:text-blue-300 transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Voice</span>
            </button>
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <SearchIcon size={14} className="group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Search</span>
              <div className="flex items-center gap-1 ml-2 opacity-50">
                <Command size={10} />
                <span className="text-[10px]">K</span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-zinc-400">
            <Wifi size={16} />
            <Volume2 size={16} />
            <Bell size={16} className="text-amber-500" />
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
              {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Workspace / Desktop */}
      <main className="absolute inset-0 top-12 bottom-12 pointer-events-none">
        {/* Desktop Icons */}
        <div className="grid grid-flow-col grid-rows-6 gap-4 w-fit pointer-events-auto p-8">
          {AppRegistry.filter(app => !app.hidden).map((app) => (
            <button
              key={app.id}
              onDoubleClick={() => handleOpenApp(app.id)}
              className="w-24 h-24 flex flex-col items-center justify-center gap-2 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl ${app.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <app.icon size={24} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors text-center shadow-black drop-shadow-md">
                {app.name}
              </span>
            </button>
          ))}
        </div>

        {/* Windows Container */}
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

      {/* Taskbar */}
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

      {/* App Drawer / Start Menu */}
      <AppDrawer 
        isOpen={isStartOpen}
        apps={AppRegistry.filter(app => !app.hidden)}
        onAppClick={handleOpenApp}
        onSignOut={handleSignOut}
        onLock={() => setIsLocked(true)}
        user={user}
      />

      {/* Voice Assistant */}
      <AnimatePresence>
        {isVoiceAssistantOpen && (
          <VoiceAssistant user={user} onClose={() => setIsVoiceAssistantOpen(false)} />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden pointer-events-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <SearchIcon className="text-zinc-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Type a command or search apps..." 
                  className="flex-1 bg-transparent border-none outline-none text-lg font-medium placeholder:text-zinc-600"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-zinc-500">
                  ESC
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar">
                {AppRegistry.filter(app => app.name.toLowerCase().includes(searchQuery.toLowerCase())).map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleOpenApp(app.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <app.icon size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{app.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Application</p>
                    </div>
                  </button>
                ))}
                {searchQuery && fileSystem.files.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((file: any) => (
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
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-lg group-hover:bg-white/10 transition-all">
                      {file.type === 'folder' ? (
                        <Folder size={20} className="text-blue-400" />
                      ) : file.type === 'note' ? (
                        <FileText size={20} className="text-amber-400" />
                      ) : (
                        <File size={20} className="text-zinc-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{file.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        {file.type === 'folder' ? 'Folder' : file.type === 'note' ? 'Note' : 'File'} • {file.size}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10 pointer-events-auto"
              onClick={() => setIsCommandPaletteOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

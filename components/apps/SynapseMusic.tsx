'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, List, Sparkles, Loader2, Download } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  lyrics?: string;
  isGenerated?: boolean;
}

export default function SynapseMusic() {
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', title: 'Neural Symphony', artist: 'Synapse AI', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: '2', title: 'Executive Flow', artist: 'Synapse AI', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    const handleGeneratedMusic = (e: any) => {
      const { url, title, lyrics } = e.detail;
      const newTrack: Track = {
        id: Date.now().toString(),
        title: title || 'Generated Composition',
        artist: 'Synapse Lyria',
        url,
        lyrics,
        isGenerated: true
      };
      setTracks(prev => [newTrack, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setIsGenerating(false);
    };

    const handleGenerationStart = () => {
      setIsGenerating(true);
    };

    const handleGenerationFailed = () => {
      setIsGenerating(false);
    };

    window.addEventListener('music-generated', handleGeneratedMusic);
    window.addEventListener('music-generation-start', handleGenerationStart);
    window.addEventListener('music-generation-failed', handleGenerationFailed);
    return () => {
      window.removeEventListener('music-generated', handleGeneratedMusic);
      window.removeEventListener('music-generation-start', handleGenerationStart);
      window.removeEventListener('music-generation-failed', handleGenerationFailed);
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="p-8 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Music size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">Synapse Music</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Neural Audio Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isGenerating && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <Loader2 size={12} className="animate-spin text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Generating...</span>
            </div>
          )}
          <button className="p-2 text-zinc-400 hover:text-white transition-colors">
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentTrack.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            <div className="relative w-64 h-64 mb-12">
              {/* Vinyl/Disk Animation */}
              <motion.div 
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-black border-4 border-white/5 shadow-2xl flex items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center z-10">
                  <div className="w-4 h-4 rounded-full bg-indigo-500" />
                </div>
                {/* Grooves */}
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute rounded-full border border-white/5"
                    style={{ inset: `${(i + 1) * 20}px` }}
                  />
                ))}
              </motion.div>
              
              {/* Floating Particles if Generated */}
              {currentTrack.isGenerated && (
                <div className="absolute -inset-4 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [0, -20, 0],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 2
                      }}
                      className="absolute"
                      style={{ 
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                      }}
                    >
                      <Sparkles size={12} className="text-indigo-400" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <h2 className="text-3xl font-black tracking-tighter mb-1 text-center">{currentTrack.title}</h2>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8">{currentTrack.artist}</p>

            {currentTrack.lyrics && (
              <div className="w-full max-h-32 overflow-y-auto mb-8 p-4 bg-white/5 rounded-2xl border border-white/5 text-center italic text-zinc-400 text-sm scrollbar-hide">
                {currentTrack.lyrics}
              </div>
            )}

            {/* Controls */}
            <div className="w-full space-y-8">
              {/* Progress Bar */}
              <div className="w-full space-y-2">
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden cursor-pointer">
                  <motion.div 
                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  <span>0:00</span>
                  <span>3:45</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                <button onClick={prevTrack} className="p-3 text-zinc-400 hover:text-white transition-colors">
                  <SkipBack size={24} />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                >
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={nextTrack} className="p-3 text-zinc-400 hover:text-white transition-colors">
                  <SkipForward size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Playlist Sidebar (Hidden for now, just a list at bottom) */}
      <div className="p-8 bg-black/40 border-t border-white/5">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Neural Library</h3>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div 
              key={track.id}
              onClick={() => setCurrentTrackIndex(index)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${index === currentTrackIndex ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === currentTrackIndex ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                  {index === currentTrackIndex && isPlaying ? <div className="flex gap-0.5 items-end h-3"><div className="w-0.5 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]" /><div className="w-0.5 bg-white animate-[music-bar_0.8s_ease-in-out_infinite]" /><div className="w-0.5 bg-white animate-[music-bar_0.5s_ease-in-out_infinite]" /></div> : <Music size={14} />}
                </div>
                <div>
                  <p className={`text-xs font-bold ${index === currentTrackIndex ? 'text-white' : 'text-zinc-400'}`}>{track.title}</p>
                  <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{track.artist}</p>
                </div>
              </div>
              {track.isGenerated && <Sparkles size={12} className="text-indigo-400" />}
            </div>
          ))}
        </div>
      </div>

      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
      />

      <style jsx global>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

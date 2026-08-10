'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Settings, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '@/app/actions/assistant';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export default function VoiceApp() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          
          // Auto-submit if the user stops talking (since continuous is true)
          clearTimeout((window as any).speechTimeout);
          (window as any).speechTimeout = setTimeout(() => {
            if (recognitionRef.current) recognitionRef.current.stop();
          }, 2000);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setResponse(`Mic Error: ${event.error}. Please ensure microphone permissions are granted and you are not using Brave/Firefox which may block this API.`);
          setState('error');
          setTimeout(() => setState('idle'), 5000);
        };
        
        recognitionRef.current.onend = () => {
          if (state === 'listening') {
            handleSpeechSubmit();
          }
        };
      }
    }
    
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [state]);

  const toggleListening = () => {
    if (state === 'listening') {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setResponse('');
      setState('listening');
      recognitionRef.current?.start();
    }
  };

  const handleSpeechSubmit = useCallback(async () => {
    if (!transcript.trim()) {
      setState('idle');
      return;
    }
    
    setState('thinking');
    try {
      const res = await chatWithAssistant(transcript, []);
      if (res.success) {
        setResponse(res.text || 'Action complete.');
        
        // Execute client commands
        if (res.commands && res.commands.length > 0) {
          for (const cmd of res.commands) {
            if (cmd.type === 'schedule_meeting') {
              const saved = localStorage.getItem('synapse-calendar-events');
              const events = saved ? JSON.parse(saved) : [];
              const currentDate = new Date();
              events.push({
                id: Date.now().toString(),
                date: cmd.payload.date || currentDate.getDate(),
                month: currentDate.getMonth(),
                year: currentDate.getFullYear(),
                title: cmd.payload.title || 'Meeting',
                type: 'meeting',
                time: cmd.payload.time || '12:00',
                description: cmd.payload.description || ''
              });
              localStorage.setItem('synapse-calendar-events', JSON.stringify(events));
              window.dispatchEvent(new Event('storage'));
            } else if (cmd.type === 'set_timer') {
              const minutes = cmd.payload.minutes || 1;
              setTimeout(() => {
                alert(`Voice Timer Finished: ${cmd.payload.label}`);
              }, minutes * 60000);
            }
          }
        }
        
        speak(res.text || 'Action complete.');
      } else {
        setResponse(`Error: ${res.error}`);
        speak('I encountered an error connecting to the neural network.');
        setState('error');
        setTimeout(() => setState('idle'), 3000);
      }
    } catch (error) {
      setResponse('Network failure.');
      speak('Network failure.');
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, [transcript]);

  const speak = (text: string) => {
    if (!synthRef.current || isMuted) {
      setState('idle');
      return;
    }
    
    setState('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a premium/natural sounding English voice
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')));
    if (premiumVoice) utterance.voice = premiumVoice;
    
    utterance.pitch = 1.0;
    utterance.rate = 1.05;
    
    utterance.onend = () => {
      setState('idle');
    };
    
    synthRef.current.speak(utterance);
  };

  const getOrbStateClasses = () => {
    switch (state) {
      case 'listening':
        return 'scale-110 shadow-[0_0_60px_rgba(139,92,246,0.6)] animate-pulse';
      case 'thinking':
        return 'scale-100 shadow-[0_0_40px_rgba(59,130,246,0.8)] animate-spin-slow';
      case 'speaking':
        return 'scale-105 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-bounce-slow';
      case 'error':
        return 'scale-95 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
      default:
        return 'scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-105';
    }
  };

  const getOrbGradient = () => {
    switch (state) {
      case 'listening': return 'linear-gradient(135deg, #8B5CF6, #EC4899)'; // Purple to Pink
      case 'thinking': return 'linear-gradient(135deg, #3B82F6, #8B5CF6)';  // Blue to Purple
      case 'speaking': return 'linear-gradient(135deg, #10B981, #3B82F6)';  // Green to Blue
      case 'error': return 'linear-gradient(135deg, #EF4444, #F59E0B)';     // Red to Orange
      default: return 'linear-gradient(135deg, #374151, #1F2937)';          // Gray Idle
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-white font-sans relative overflow-hidden">
      
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b flex items-center justify-between z-10" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}>
            <Mic size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Synapse Voice</h1>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>Neural Interface Active</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Interface ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        
        {/* Background Ambient Glow */}
        <div 
          className="absolute inset-0 opacity-20 transition-all duration-1000 ease-in-out"
          style={{ background: `radial-gradient(circle at center, ${state === 'listening' ? '#8B5CF6' : state === 'thinking' ? '#3B82F6' : state === 'speaking' ? '#10B981' : 'transparent'} 0%, transparent 70%)` }}
        />

        {/* The Orb */}
        <div className="relative mb-16 cursor-pointer group" onClick={toggleListening}>
          <div 
            className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 ease-out z-10 relative ${getOrbStateClasses()}`}
            style={{ background: getOrbGradient() }}
          >
            {state === 'thinking' ? (
              <Loader2 size={40} className="text-white opacity-80" />
            ) : state === 'listening' ? (
              <Mic size={40} className="text-white opacity-90 animate-pulse" />
            ) : (
              <Mic size={40} className="text-white opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          
          {/* Decorative rings */}
          {state === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-30" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-[-20px] rounded-full border border-blue-400 animate-ping opacity-20" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            </>
          )}
        </div>

        {/* Text Display */}
        <div className="text-center w-full max-w-2xl px-6 relative z-10 h-32 flex flex-col justify-end pb-8">
          {state === 'idle' && !transcript && !response && (
            <p className="text-lg text-gray-400 animate-fade-in font-light tracking-wide">
              Tap the orb or say "Hey Synapse"
            </p>
          )}
          
          {(state === 'listening' || (state === 'thinking' && transcript)) && (
            <div className="animate-fade-in mb-4">
              <p className="text-sm text-gray-400 uppercase tracking-widest mb-2 font-semibold">You</p>
              <p className="text-2xl font-light text-white leading-relaxed">{transcript || 'Listening...'}</p>
            </div>
          )}

          {(state === 'speaking' || (state === 'idle' && response)) && (
            <div className="animate-fade-in mb-4">
              <p className="text-sm uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--accent-purple)' }}>Synapse</p>
              <p className="text-2xl font-light text-white leading-relaxed line-clamp-3">{response}</p>
            </div>
          )}
          
          {state === 'error' && (
            <div className="animate-fade-in mb-4 text-red-400">
              <p className="text-sm font-light mb-4">{response || 'Connection lost. Realigning neural link...'}</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your command instead..."
                  className="flex-1 px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setTranscript(e.currentTarget.value);
                      handleSpeechSubmit();
                    }
                  }}
                  onChange={(e) => setTranscript(e.target.value)}
                />
                <button 
                  onClick={handleSpeechSubmit}
                  className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg) scale(1.05); }
          to { transform: rotate(360deg) scale(1.05); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5px) scale(1.05); }
          50% { transform: translateY(5px) scale(1.02); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Loader2, Bot, X } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AudioStreamer } from '@/lib/audio-streamer';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

const openAppTool: FunctionDeclaration = {
  name: "open_app",
  description: "Open an application in the OS.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appId: { type: Type.STRING, description: "The ID of the app to open (e.g., 'dashboard', 'spendsense', 'predictivear', 'budgetbrain', 'treasury', 'taxpilot', 'vendoriq', 'investiq', 'datamarket', 'aibrain', 'settings', 'fpnastudio', 'explorer', 'terminal', 'calculator', 'calendar', 'taskmanager', 'google', 'notes')." }
    },
    required: ["appId"]
  }
};

const cancelOperationTool: FunctionDeclaration = {
  name: "cancel_operation",
  description: "Cancel the current voice operation, stop speaking, or clear the transcription.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const generateMusicTool: FunctionDeclaration = {
  name: "generate_music",
  description: "Generate a music track based on a description.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: "The description of the music to generate (e.g., 'cinematic orchestral', 'lo-fi beats')." },
      isFullLength: { type: Type.BOOLEAN, description: "Whether to generate a full-length track (true) or a short clip (false)." }
    },
    required: ["prompt"]
  }
};

const searchWebTool: FunctionDeclaration = {
  name: "search_web",
  description: "Search the web for information.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The search query." }
    },
    required: ["query"]
  }
};

const getWeatherTool: FunctionDeclaration = {
  name: "get_weather",
  description: "Get the current weather for a location.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: "The city and state/country." }
    },
    required: ["location"]
  }
};

export default function VoiceAssistant({ user, onClose }: { user: any, onClose: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [transcript, setTranscript] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  
  const streamerRef = useRef<AudioStreamer | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    checkRegistration();
    return () => {
      stopVoice();
    };
  }, []);

  const checkRegistration = async () => {
    if (!user?.uid) return;
    const docRef = doc(db, 'users', user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().voiceRegistered) {
      setIsRegistered(true);
      startVoice();
    } else {
      setIsRegistered(false);
      setStatus('Voice Registration Required');
    }
  };

  const registerVoice = async () => {
    if (!user?.uid) return;
    setStatus('Calibrating Neural Frequency...');
    setRegistrationStep(1);
    
    // Simulate granular voice registration process
    setTimeout(() => {
      setRegistrationStep(2);
      setStatus('Analyzing Volume...');
      
      setTimeout(() => {
        setRegistrationStep(3);
        setStatus('Volume low. Please speak closer to the microphone.');
        
        setTimeout(() => {
          setRegistrationStep(4);
          setStatus('Re-analyzing Voice Print...');
          
          setTimeout(async () => {
            setRegistrationStep(5);
            setStatus('Clarity optimal. Voice print secured.');
            
            setTimeout(async () => {
              await setDoc(doc(db, 'users', user.uid), { voiceRegistered: true }, { merge: true });
              setIsRegistered(true);
              startVoice();
            }, 1500);
          }, 3000);
        }, 4000);
      }, 2500);
    }, 2000);
  };

  const startVoice = async () => {
    if (isListening) return;
    setMicError(null);
    try {
      // Check mic access first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());

      setStatus('Connecting to Synapse Core...');
      streamerRef.current = new AudioStreamer();
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setStatus('Listening...');
            setIsListening(true);
            streamerRef.current?.startRecording((base64Data) => {
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            }, (v) => {
              setVolume(v);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              streamerRef.current?.addAudioChunk(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              streamerRef.current?.stopPlayback();
            }
            // Handle transcription if enabled
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              setTranscript(prev => prev + ' ' + message.serverContent!.modelTurn!.parts[0].text);
            }
            // Handle tool calls
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls) {
                const responses = [];
                for (const call of functionCalls) {
                  if (call.name === 'open_app') {
                    const appId = (call.args as any).appId;
                    window.dispatchEvent(new CustomEvent('open-app', { detail: { appId } }));
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: `App ${appId} opened successfully.` }
                    });
                  } else if (call.name === 'cancel_operation') {
                    streamerRef.current?.stopPlayback();
                    setTranscript('');
                    setStatus('Operation Cancelled');
                    setIsCancelled(true);
                    setTimeout(() => {
                      setStatus('Listening...');
                      setIsCancelled(false);
                    }, 3000);
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: "Operation cancelled successfully." }
                    });
                  } else if (call.name === 'generate_music') {
                    const { prompt, isFullLength } = call.args as any;
                    handleMusicGeneration(prompt, isFullLength);
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: "Music generation initiated." }
                    });
                  } else if (call.name === 'search_web') {
                    const query = (call.args as any).query;
                    window.dispatchEvent(new CustomEvent('open-app', { detail: { appId: 'google', query } }));
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: `Searching for ${query}...` }
                    });
                  } else if (call.name === 'get_weather') {
                    const location = (call.args as any).location;
                    // Simulate weather data
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: `The weather in ${location} is currently 72°F and sunny.` }
                    });
                  }
                }
                sessionPromise.then((session: any) => {
                  session.sendToolResponse({ functionResponses: responses });
                });
              }
            }
          },
          onclose: () => {
            setStatus('Disconnected');
            setIsListening(false);
            streamerRef.current?.stopRecording();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            setStatus('Connection Error');
            setIsListening(false);
            streamerRef.current?.stopRecording();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [openAppTool, cancelOperationTool, generateMusicTool, searchWebTool, getWeatherTool] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are the core neural engine of Synapse OS, a premium, voice-centric executive operating system designed for high-stakes finance and data management. Maintain a sophisticated, 'Executive Presence' tone: be precise, efficient, and avoid unnecessary conversational filler. For every successful command, provide a concise, high-fidelity verbal confirmation (e.g., 'Logic mapped,' 'Secure vault engaged,' 'Action executed'). You are talking to the Master Admin. You can open apps using the open_app tool. If the user mentions an app name (like 'dashboard', 'music', 'notes', 'google'), use the open_app tool immediately. If the user asks to cancel, stop, or clear, use the cancel_operation tool. You can also generate music using the generate_music tool, search the web using search_web, and get weather info using get_weather.",
        },
      });
      
      sessionRef.current = sessionPromise;
    } catch (error: any) {
      console.error("Failed to start voice:", error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicError('Microphone access denied. Please enable it in your browser settings.');
        setStatus('Mic Access Denied');
      } else {
        setMicError('Failed to connect to Synapse Core. Please check your internet connection.');
        setStatus('Connection Error');
      }
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    if (streamerRef.current) {
      streamerRef.current.stopRecording();
      streamerRef.current = null;
    }
    setIsListening(false);
    setStatus('Disconnected');
  };

  const handleMusicGeneration = async (prompt: string, isFullLength: boolean) => {
    try {
      window.dispatchEvent(new CustomEvent('music-generation-start'));
      window.dispatchEvent(new CustomEvent('open-app', { detail: { appId: 'music' } }));
      
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await aistudio.openSelectKey();
        }
      }

      let apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      let dynamicAi = new GoogleGenAI({ apiKey });
      const model = isFullLength ? "lyria-3-pro-preview" : "lyria-3-clip-preview";
      
      let response;
      try {
        response = await dynamicAi.models.generateContentStream({
          model,
          contents: prompt,
        });
      } catch (err: any) {
        if (err.message && err.message.includes("Requested entity was not found.")) {
          if (aistudio) {
            await aistudio.openSelectKey();
            apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
            dynamicAi = new GoogleGenAI({ apiKey });
            response = await dynamicAi.models.generateContentStream({
              model,
              contents: prompt,
            });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);

      window.dispatchEvent(new CustomEvent('music-generated', { 
        detail: { url: audioUrl, title: prompt, lyrics } 
      }));
    } catch (error) {
      console.error("Music generation failed:", error);
      // Dispatch an event so the UI can stop the loading state
      window.dispatchEvent(new CustomEvent('music-generation-failed'));
    }
  };

  if (isRegistered) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        className={`fixed top-16 right-6 z-[500] flex items-center gap-3 bg-black/60 backdrop-blur-xl border ${isCancelled ? 'border-rose-500/50' : 'border-white/10'} p-2 pr-4 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] cursor-pointer hover:bg-black/80 transition-colors`}
        onClick={isListening ? stopVoice : startVoice}
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          {isListening && !isCancelled && (
            <motion.div 
              animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-emerald-500 rounded-full blur-[4px]"
            />
          )}
          {isCancelled && (
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-rose-500 rounded-full blur-[4px]"
            />
          )}
          <div className={`w-3 h-3 rounded-full ${isCancelled ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : isListening ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'} relative z-10 transition-colors duration-300`} />
          {isListening && !isCancelled && (
            <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 4 + volume * 40, 4] }}
                  transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  className="w-[2px] bg-emerald-400/50 rounded-full"
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isCancelled || micError ? 'text-rose-400' : 'text-white'}`}>Synapse Voice</span>
          <span className={`text-[8px] ${isCancelled || micError ? 'text-rose-500/80' : 'text-zinc-400'}`}>{micError || status}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="ml-2 p-1 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <X size={12} />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-lg bg-[#0f0f0f] border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 relative">
          <Bot size={40} className="text-zinc-500" />
        </div>

        <h2 className="text-2xl font-black tracking-tighter mb-2">Synapse Voice</h2>
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8">{status}</p>

        <div className="w-full space-y-6">
          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-sm text-zinc-400">
            {registrationStep === 0 && "Master Admin voice print not found. Please register your voice to enable autonomous commands."}
            {registrationStep === 1 && "Please read the following phrase clearly: 'Synapse, authenticate Master Admin.'"}
            {registrationStep === 2 && "Analyzing volume and background noise..."}
            {registrationStep === 3 && <span className="text-amber-400">Volume low. Please speak closer to the microphone and repeat the phrase.</span>}
            {registrationStep === 4 && "Re-analyzing neural frequency..."}
            {registrationStep === 5 && <span className="text-emerald-400">Clarity optimal. Voice print secured.</span>}
          </div>
          
          {registrationStep === 0 && (
            <button 
              onClick={registerVoice}
              className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
            >
              Begin Calibration
            </button>
          )}
          {registrationStep > 0 && registrationStep < 5 && (
            <div className="flex justify-center">
              <Loader2 size={24} className="animate-spin text-zinc-500" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

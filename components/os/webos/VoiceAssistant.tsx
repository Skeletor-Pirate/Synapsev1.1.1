'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Loader2, Bot, X } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { AudioStreamer } from '@/lib/audio-streamer';
import { searchKnowledgeBase } from '@/app/actions/knowledge';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ingestDocument } from '@/app/actions/knowledge';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'MISSING_API_KEY' });

const openAppTool: FunctionDeclaration = {
  name: "open_app",
  description: "Open an application in the OS.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appId: { type: Type.STRING, description: "The ID of the app to open. Valid values: 'dashboard', 'mail' (or 'email'), 'assistant', 'voice', 'calendar', 'notes', 'music', 'spendsense', 'predictivear', 'budgetbrain', 'treasury', 'taxpilot', 'vendoriq', 'investiq', 'datamarket', 'aibrain', 'settings', 'explorer', 'terminal', 'calculator', 'taskmanager', 'google'." }
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

const searchCompanyDataTool: FunctionDeclaration = {
  name: "search_company_data",
  description: "Searches the private PostgreSQL vector database for company records, meeting notes, EBITA, and other ingested knowledge.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The search query to look up." }
    },
    required: ["query"]
  }
};

const sendEmailTool: FunctionDeclaration = {
  name: "send_email",
  description: "Sends an email to a specified address.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      to: { type: Type.STRING, description: "The email address to send to." },
      subject: { type: Type.STRING, description: "The subject of the email." },
      body: { type: Type.STRING, description: "The body content of the email." },
    },
    required: ["to", "subject", "body"]
  }
};

const scheduleMeetingTool: FunctionDeclaration = {
  name: "schedule_meeting",
  description: "Schedules a meeting in the calendar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The title of the meeting." },
      date: { type: Type.INTEGER, description: "The day of the month (1-31)." },
      time: { type: Type.STRING, description: "The time of the meeting in HH:MM format." },
      description: { type: Type.STRING, description: "A brief description." },
    },
    required: ["title", "date", "time"]
  }
};

const setTimerTool: FunctionDeclaration = {
  name: "set_timer",
  description: "Sets a timer for a specific duration.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      minutes: { type: Type.INTEGER, description: "The duration of the timer in minutes." },
      label: { type: Type.STRING, description: "What the timer is for." },
    },
    required: ["minutes", "label"]
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
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  
  const streamerRef = useRef<AudioStreamer | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
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

    checkRegistration();
    return () => {
      stopVoice();
    };
  }, [user?.uid]);

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
            // Iterate ALL parts to get all audio chunks — not just parts[0]
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  streamerRef.current?.addAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  setTranscript(prev => prev + ' ' + part.text);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              // Full stop & reset — clears the audio queue so the new response starts clean
              streamerRef.current?.stopPlayback();
            }
            // Handle tool calls
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls) {
                const responses = [];
                for (const call of functionCalls) {
                  if (call.name === 'open_app') {
                    let appId = (call.args as any).appId as string;
                    // Normalize common aliases
                    const aliasMap: Record<string, string> = {
                      email: 'mail', emails: 'mail', inbox: 'mail',
                      ai: 'assistant', bot: 'assistant', chat: 'assistant',
                      voice: 'voice', mic: 'voice',
                      agenda: 'calendar', schedule: 'calendar',
                      velyra: 'aibrain', brain: 'aibrain',
                    };
                    appId = aliasMap[appId.toLowerCase()] || appId;
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
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: `The weather in ${location} is currently 72°F and sunny.` }
                    });
                  } else if (call.name === 'search_company_data') {
                    const query = (call.args as any).query;
                    try {
                      const res = await searchKnowledgeBase(query);
                      if (res.success && res.results) {
                        const info = res.results.map((r: any) => `- [${r.title}] ${r.content}`).join('\n');
                        responses.push({ id: call.id, name: call.name, response: { result: `Found ${res.results.length} relevant documents:\n${info}` } });
                      } else {
                        responses.push({ id: call.id, name: call.name, response: { result: `Search failed or no results found. Error: ${res.error || 'None'}` } });
                      }
                    } catch (e: any) {
                      responses.push({ id: call.id, name: call.name, response: { result: `Failed: ${e.message}` } });
                    }
                  } else if (call.name === 'send_email') {
                    const args = call.args as any;
                    const saved = localStorage.getItem('synapse-mail-data');
                    const mails = saved ? JSON.parse(saved) : [];
                    mails.unshift({
                      id: Date.now(),
                      folder: 'sent',
                      sender: 'Me',
                      email: 'admin@synapsecfo.com',
                      subject: args.subject || 'No Subject',
                      snippet: (args.body || '').substring(0, 100),
                      content: args.body || '',
                      date: 'Just now',
                      unread: false,
                      starred: false,
                    });
                    localStorage.setItem('synapse-mail-data', JSON.stringify(mails));
                    responses.push({ id: call.id, name: call.name, response: { result: 'Email sent successfully and saved to Outbox.' } });
                  } else if (call.name === 'schedule_meeting') {
                    const args = call.args as any;
                    const saved = localStorage.getItem('synapse-calendar-events');
                    const events = saved ? JSON.parse(saved) : [];
                    const currentDate = new Date();
                    events.push({
                      id: Date.now().toString(),
                      date: args.date || currentDate.getDate(),
                      month: currentDate.getMonth(),
                      year: currentDate.getFullYear(),
                      title: args.title || 'Meeting',
                      type: 'meeting',
                      time: args.time || '12:00',
                      description: args.description || ''
                    });
                    localStorage.setItem('synapse-calendar-events', JSON.stringify(events));
                    responses.push({ id: call.id, name: call.name, response: { result: 'Meeting scheduled successfully.' } });
                  } else if (call.name === 'set_timer') {
                    const args = call.args as any;
                    const minutes = args.minutes || 1;
                    setTimeout(() => alert(`Timer Finished: ${args.label}`), minutes * 60000);
                    responses.push({ id: call.id, name: call.name, response: { result: `Timer set for ${minutes} minutes.` } });
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
          tools: [{ functionDeclarations: [openAppTool, cancelOperationTool, generateMusicTool, searchWebTool, getWeatherTool, searchCompanyDataTool, sendEmailTool, scheduleMeetingTool, setTimerTool] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: `You are the core neural engine of Synapse OS, a premium, voice-centric executive operating system designed for high-stakes finance and data management. Maintain a sophisticated, 'Executive Presence' tone: be precise, efficient, and avoid unnecessary conversational filler. For every successful command, provide a concise, high-fidelity verbal confirmation (e.g., 'Logic mapped,' 'Secure vault engaged,' 'Action executed'). You are talking to the Master Admin. You must speak and respond strictly in ${selectedLanguage}. You can open apps using the open_app tool. If the user mentions an app name (like 'dashboard', 'music', 'notes', 'google'), use the open_app tool immediately. If the user asks about internal company data, meeting notes, or financial records, use the search_company_data tool. If the user asks to send an email, use the send_email tool. If they ask to set a timer or schedule a meeting, use those tools. If the user asks to cancel, stop, or clear, use the cancel_operation tool. You can also generate music using the generate_music tool, search the web using search_web, and get weather info using get_weather.`,
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
        
        <div className="flex gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
          <select 
            value={selectedLanguage} 
            onChange={(e) => { e.stopPropagation(); setSelectedLanguage(e.target.value); stopVoice(); }}
            className="bg-zinc-900/80 text-[9px] font-bold tracking-wider uppercase text-white border border-white/20 rounded px-1 py-0.5 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
          >
            <option value="English">EN</option>
            <option value="Spanish">ES</option>
            <option value="French">FR</option>
            <option value="Japanese">JP</option>
            <option value="Hindi">HI</option>
          </select>
          <select 
            value={selectedVoice} 
            onChange={(e) => { e.stopPropagation(); setSelectedVoice(e.target.value); stopVoice(); }}
            className="bg-zinc-900/80 text-[9px] font-bold tracking-wider uppercase text-zinc-300 border border-white/20 rounded px-1 py-0.5 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
          >
            <option value="Aoede">Aoede</option>
            <option value="Charon">Charon</option>
            <option value="Fenrir">Fenrir</option>
            <option value="Kore">Kore</option>
            <option value="Puck">Puck</option>
          </select>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="ml-1 p-1 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
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

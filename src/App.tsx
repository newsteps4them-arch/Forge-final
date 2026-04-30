import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Hammer, ChevronRight, User, Cpu, Key, Car, CheckCircle2, MessageSquare, Wrench, ArrowUp, ArrowLeft, Calculator, HardHat, Eye, EyeOff, Camera, ImageIcon, Code, Mic, Trash2, Edit2, X, Save } from 'lucide-react';
import Markdown from 'react-markdown';
import { NotificationContainer } from './components/NotificationContainer';
import { toast } from './lib/notifications';
import { GoogleGenAI } from '@google/genai';

// --- Types ---
type OnboardingData = {
  assistantName: string;
  wakeWord: string;
  userName: string;
  apiKey: string;
  vehicleInfo: string;
  inventory: string;
  onboardingComplete: boolean;
};

type Screen = 'Welcome' | 'NameAssistant' | 'WakeWord' | 'AboutYou' | 'ApiKeys' | 'Inventory' | 'Vehicles' | 'Ready' | 'Main' | 'Chat';
type AssistantMode = 'DIY & General' | 'Mechanic' | 'Estimator' | 'Contractor' | 'Coder';
type ChatMessage = { role: 'user' | 'model', text: string, image?: string };

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};



// --- Components ---

const TaskItem = ({ task, onToggle, onDelete, onEdit }: { task: Task, onToggle: () => void, onDelete: () => void, onEdit: (text: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [showModal, setShowModal] = useState(false);

  const handleSave = () => {
    if (editText.trim() && editText !== task.text) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
    setShowModal(false);
  };

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${task.completed ? 'bg-black/20 border-white/5 opacity-60' : 'bg-surface/50 border-white/5 hover:border-primary/20'}`}
      >
        <button 
          onClick={onToggle}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${task.completed ? 'bg-primary border-primary text-black' : 'border-white/20 text-transparent'}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input 
              autoFocus
              className="w-full bg-transparent border-none outline-none text-sm text-text-primary p-0 m-0 font-medium"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className={`text-sm font-medium truncate cursor-text ${task.completed ? 'line-through text-text-dim' : 'text-text-primary'}`}
            >
              {task.text}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => {
              setEditText(task.text);
              setShowModal(true);
            }}
            className="p-1.5 text-text-dim hover:text-primary transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 text-text-dim hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-surface border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-text-primary">Edit Task</h3>
                <button onClick={() => setShowModal(false)} className="text-text-dim hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea 
                autoFocus
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium mb-6 min-h-[120px] resize-none"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="What needs to be done?"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-full border border-white/10 text-text-secondary font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-full bg-primary text-black font-bold text-sm shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const WelcomeScreen = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="flex flex-col justify-between h-full py-12 px-8 bg-gradient-to-b from-[#111] to-[#020202] overflow-hidden relative">
      {/* Ember decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
              x: [0, Math.random() * 30, 0],
              y: [0, Math.random() * -30, 0]
             }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full bg-primary shadow-[0_0_15px_rgba(245,166,35,0.8)]"
            style={{
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
            }}
          />
        ))}
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center text-center space-y-12 relative z-10"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-surface rounded-[2rem] border border-primary/20 shadow-[inset_0_2px_20px_rgba(245,166,35,0.15)] flex items-center justify-center mb-8">
            <Hammer className="text-primary w-10 h-10" />
          </div>
          <h1 className="text-6xl font-black tracking-tight text-white font-display">Forge</h1>
        </div>

        <div className="space-y-3">
          <p className="text-xl font-medium text-primary tracking-wide">Bring your ideas to life.</p>
          <p className="text-sm text-text-secondary/80 font-mono uppercase tracking-[0.2em]">Build with precision</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="relative z-10"
      >
        <button
          onClick={onNext}
          className="w-full bg-primary py-4 px-8 rounded-full text-black font-extrabold text-[17px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(245,166,35,0.3)] hover:shadow-[0_0_40px_rgba(245,166,35,0.6)]"
        >
          Let's Build It
        </button>
      </motion.div>
    </div>
  );
};

const ApiKeysSetupScreen = ({
  value,
  onChange,
  onNext
}: {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
}) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] p-8 relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Key className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-20 relative z-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-lg">
          <Key className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>
        
        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">API Keys</h2>
        <p className="text-text-secondary text-lg mb-8 tracking-wide">Powering Forge with your own tech stack.</p>

        <div className="mb-8 p-5 bg-surface/50 border border-border/50 rounded-2xl shadow-inner">
           <p className="text-[15px] leading-relaxed text-text-secondary mb-3">
             You can obtain a Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>.
           </p>
           <p className="text-xs text-primary/60 uppercase tracking-widest font-bold mt-4">
             Leave blank to use system key.
           </p>
        </div>

        <div className="relative group">
          <input
            type={showKey ? "text" : "password"}
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Gemini API Key (optional)"
            className="w-full bg-surface/50 border border-border/50 rounded-2xl py-6 pl-6 pr-14 text-xl text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
            onKeyDown={(e) => e.key === 'Enter' && onNext()}
          />
          <button 
             onClick={() => setShowKey(!showKey)}
             className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
          >
             {showKey ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <button
          onClick={onNext}
          className="w-full bg-primary py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.2)]"
        >
          {value.trim() ? 'Continue' : 'Skip'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const SetupScreen = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  placeholder, 
  value, 
  onChange, 
  onNext,
  optional = false
}: { 
  title: string; 
  subtitle: string; 
  icon: any; 
  placeholder: string; 
  value: string; 
  onChange: (val: string) => void; 
  onNext: () => void;
  optional?: boolean;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] p-8 relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Icon className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-20 relative z-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-lg">
          <Icon className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>
        
        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">{title}</h2>
        <p className="text-text-secondary text-lg mb-12 tracking-wide">{subtitle}</p>

        <div className="relative group">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface/50 border border-border/50 rounded-2xl py-6 px-6 text-xl text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
            onKeyDown={(e) => e.key === 'Enter' && (optional || value.trim()) && onNext()}
          />
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <button
          disabled={!optional && !value.trim()}
          onClick={onNext}
          className="w-full bg-primary disabled:bg-surface disabled:text-text-dim py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:active:scale-100 shadow-[0_0_20px_rgba(245,166,35,0.2)] disabled:shadow-none"
        >
          {optional && !value.trim() ? 'Skip' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const ReadyScreen = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-gradient-to-b from-[#111] to-[#020202] p-8 text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          className="bg-surface w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] animate-pulse" />
          <CheckCircle2 className="text-primary w-16 h-16 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
        </motion.div>
        
        <h2 className="text-4xl font-display font-black text-text-primary mb-4 tracking-tight">You're all set.</h2>
        <p className="text-text-secondary text-lg max-w-xs mx-auto tracking-wide">Forge is ready to help you build what you imagine.</p>
      </div>

      <div className="mb-8 relative z-10">
        <button
          onClick={onFinish}
          className="w-full bg-primary py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(245,166,35,0.4)] hover:shadow-[0_0_40px_rgba(245,166,35,0.6)]"
        >
          Initialize Dashboard
        </button>
      </div>
    </motion.div>
  );
};

const CameraView = ({ onCapture, onClose, mode }: { onCapture: (img: string) => void, onClose: () => void, mode: AssistantMode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error("Camera access denied", e);
        toast.show("Camera access denied or not available. Please ensure permissions are granted.", "error");
        onClose();
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [onClose]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center">
       <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
       
       <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md">
             <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             Live View
          </div>
       </div>

       {/* Mode specific overlays */}
       <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          {mode === 'Mechanic' && (
             <div className="w-64 h-64 border-2 border-primary/50 relative">
               <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary -translate-x-1 -translate-y-1" />
               <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary translate-x-1 -translate-y-1" />
               <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary -translate-x-1 translate-y-1" />
               <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary translate-x-1 translate-y-1" />
               <p className="text-primary font-mono text-xs text-center mt-[105%] animate-pulse">Scanning Engine Bay...</p>
             </div>
          )}
          {mode === 'Estimator' && (
             <div className="w-full h-full border-4 border-dashed border-primary/30 relative">
                 <div className="absolute top-1/2 left-0 w-full h-px bg-primary/30" />
                 <div className="absolute top-0 left-1/2 w-px h-full bg-primary/30" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 px-3 py-1 rounded text-primary text-xs font-mono backdrop-blur-md">
                     Estimating Dimensions...
                 </div>
             </div>
          )}
          {mode === 'Contractor' && (
             <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden font-mono">
               {/* Blueprint Grid */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.15)_1px,transparent_1px)] bg-[size:5vw_5vw]" />
               <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.4)_1px,transparent_1px)] bg-[size:25vw_25vw]" />
               
               {/* Center Crosshair */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 opacity-80">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-400" />
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-400" />
                  <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
               </div>
               
               {/* Corner Brackets */}
               <div className="absolute top-16 left-8 w-16 h-16 border-t-2 border-l-2 border-blue-400 opacity-60" />
               <div className="absolute top-16 right-8 w-16 h-16 border-t-2 border-r-2 border-blue-400 opacity-60" />
               <div className="absolute bottom-40 left-8 w-16 h-16 border-b-2 border-l-2 border-blue-400 opacity-60" />
               <div className="absolute bottom-40 right-8 w-16 h-16 border-b-2 border-r-2 border-blue-400 opacity-60" />

               {/* Simulated Measurements */}
               <div className="absolute top-[45%] left-10 bg-blue-900/60 text-blue-200 text-[10px] px-1.5 py-0.5 rounded border border-blue-400/40 backdrop-blur shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                 H: 8'4"
               </div>
               <div className="absolute top-[30%] right-[25%] bg-blue-900/60 text-blue-200 text-[10px] px-1.5 py-0.5 rounded border border-blue-400/40 backdrop-blur shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                 W: 12'6"
               </div>
               <div className="absolute bottom-48 right-10 flex flex-col items-end gap-1.5 border border-transparent">
                 <div className="bg-blue-900/80 text-blue-100 text-[9px] px-2 py-1 rounded border border-blue-400/50 backdrop-blur font-semibold">
                   PITCH: 4/12
                 </div>
                 <div className="bg-blue-900/80 text-blue-100 text-[9px] px-2 py-1 rounded border border-blue-400/50 backdrop-blur flex items-center gap-1.5 font-semibold">
                   <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_5px_#60a5fa]" />
                   STRUCTURAL DETECTED
                 </div>
               </div>

               {/* Laser scan line overlay */}
               <motion.div 
                 className="absolute left-0 right-0 h-[1px] bg-blue-400 shadow-[0_0_20px_4px_rgba(59,130,246,0.6)] z-10"
                 animate={{ top: ['15%', '80%', '15%'] }}
                 transition={{ duration: 3.5, ease: "linear", repeat: Infinity }}
               />

               <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center text-blue-100 text-[11px] tracking-[0.25em] font-bold bg-blue-950/70 px-4 py-1.5 rounded backdrop-blur-md border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.4)] z-20 whitespace-nowrap">
                   BLUEPRINT MAPPING ACTIVE
               </div>
             </div>
          )}
       </div>

       <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
          <button 
             onClick={capturePhoto} 
             className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
             <div className="w-16 h-16 bg-white rounded-full" />
          </button>
       </div>
    </div>
  );
}

const ChatScreen = ({ onBack, onboarding, initialMode, activeProject }: { onBack: () => void, onboarding: OnboardingData, initialMode?: AssistantMode, activeProject?: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('forge_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<AssistantMode>(initialMode || 'DIY & General');
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    localStorage.setItem('forge_chat', JSON.stringify(messages));
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-') && (v.name.includes('Google') || v.name.includes('Natural')));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('forge_chat');
    toast.show("Chat history cleared", "success");
  };

  const [isRecording, setIsRecording] = useState(false);
  
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition && isRecording) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
           setInput(prev => prev ? prev + ' ' + transcript : transcript);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
         // if it stops organically, restart if isRecording is true, but since that can loop, just turn it off
         setIsRecording(false);
      };
      
      try {
        recognition.start();
      } catch (e) {
        setIsRecording(false);
        toast.show("Speech recognition failed to start", "error");
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isRecording]);

  const handleMicClick = () => {
    if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
       alert("Speech recognition is not supported in this browser.");
       return;
    }
    setIsRecording(!isRecording);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            toast.show("Image attached successfully", "success");
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const userMsg = overrideText || input.trim();
    if (!userMsg && !image) return;
    
    const attachedImage = image;
    
    setInput('');
    setImage(null);
    setMessages(prev => [...prev, { role: 'user', text: userMsg, image: attachedImage || undefined }]);
    setLoading(true);

    try {
      let systemInstruction = `You are ${onboarding.assistantName}, an AI assistant for ${onboarding.userName}.`;
      if (onboarding.inventory) {
         systemInstruction += `\n\nThe user has the following tools/inventory available: ${onboarding.inventory}. Keep this in mind when suggesting solutions or steps.`;
      }
      if (mode === 'Mechanic') {
          systemInstruction = `You are ${onboarding.assistantName}, an expert AI assistant specializing in vehicles, garage work, DIY mechanic tasks, and diagnostics. The user is a DIYer or tinkerer working on their vehicle. ${onboarding.vehicleInfo ? `The user's vehicle is: ${onboarding.vehicleInfo}.` : ''} Provide torque specs, diagnostics info, and step by step mechanical instructions. The user may point their camera at their engine bay; analyze the photo and solve specific assistance and scenarios.`;
      } else if (mode === 'Estimator') {
          systemInstruction = `You are ${onboarding.assistantName}, an expert estimator AI. Help the user (${onboarding.userName}) calculate material costs, project timelines, labor estimates, and provide detailed breakdowns of expenses for various projects. The user may use their camera for measurements or photos; provide estimates based on local economy and rates, local prices of materials, and subcontractors based on their descriptions. Always format financial breakdowns in neat markdown tables.`;
      } else if (mode === 'Contractor') {
          systemInstruction = `You are ${onboarding.assistantName}, a master contractor and construction expert AI. Help the user (${onboarding.userName}) with building codes, structural advice, construction techniques, project management, and trade-specific knowledge. 
CRITICAL CAPABILITY: If the user provides a photo and asks to visualize a change (e.g., "what would this look like if we removed the sink"), calculate the new scene and generate an image. To generate this image, construct a highly detailed visual prompt describing the FINAL modified scene (incorporating the existing elements from their photo + the new requested changes) and embed it as a markdown image using Pollinations:
\`![Visualized Concept](https://image.pollinations.ai/prompt/{url_encoded_detailed_prompt}?width=1024&height=1024&nologo=true)\`.`;
      } else if (mode === 'Coder') {
          systemInstruction = `You are ${onboarding.assistantName}, an expert software engineer and AI pair programmer. Help the user (${onboarding.userName}) with coding, debugging, software architecture, refactoring, and explaining complex programming concepts.`;
      } else {
          systemInstruction = `You are ${onboarding.assistantName}, a versatile AI assistant for DIYers, builders, and tinkerers. You help with general project planning, teardown/assembly, and normal assistant tasks. The user is ${onboarding.userName}.`;
      }

      if (activeProject) {
          systemInstruction += `\n\nThe user's CURRENT ACTIVE PROJECT is: "${activeProject}". Keep this highly relevant across all responses.`;
      }

      const apiKey = onboarding.apiKey || import.meta.env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
         throw new Error('Gemini API Key is missing. Please add it in settings.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const contentParts: any[] = [];
      if (userMsg) {
        contentParts.push(userMsg);
      }
      
      if (attachedImage) {
        const [mimeTypePart, base64Part] = attachedImage.split(',');
        const mimeType = mimeTypePart.match(/:(.*?);/)?.[1] || 'image/jpeg';
        contentParts.push({
          inlineData: {
            data: base64Part,
            mimeType
          }
        });
      }

      // Convert history
      const contents = messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.image ? [
            { text: msg.text }, 
            { inlineData: { data: msg.image.split(',')[1], mimeType: msg.image.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg' } }
        ] : [{ text: msg.text }]
      }));

      if (contentParts.length > 0) {
        contents.push({
          role: 'user',
          parts: contentParts.map(p => typeof p === 'string' ? { text: p } : p)
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: contents as any,
        config: {
          systemInstruction,
        }
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text as string }]);
        if (autoSpeak) {
           speakText(response.text);
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `An error occurred: ${error.message}` }]);
      toast.show("Network error or request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleARCapture = (imgData: string) => {
    setImage(imgData);
    setShowCamera(false);
    toast.show("Camera capture successful", "success");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-full bg-[#050505] relative overflow-hidden"
    >
      {showCamera && (
        <CameraView 
          onCapture={handleARCapture} 
          onClose={() => setShowCamera(false)} 
          mode={mode} 
        />
      )}
      {/* Glass Header */}
      <header className="absolute top-0 left-0 right-0 z-30 px-4 pt-10 pb-4 glass flex flex-col gap-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-text-primary">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 flex justify-center">
             <span className="text-xs font-bold uppercase tracking-widest text-primary/80">{mode} Mode</span>
          </div>
          <button onClick={clearChat} title="Clear Chat" className="p-2 rounded-full hover:bg-white/10 transition-colors text-text-secondary hover:text-error flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex bg-black/40 rounded-full p-1 border border-white/5 overflow-x-auto no-scrollbar items-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <button 
             onClick={() => {
                setAutoSpeak(!autoSpeak);
                if (autoSpeak) window.speechSynthesis?.cancel();
             }}
             title={autoSpeak ? "Voice Output On" : "Voice Output Off"}
             className={`p-2 rounded-full transition-colors flex-shrink-0 ml-1 mr-2 ${autoSpeak ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-white/10'}`}
           >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>{autoSpeak && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>}{autoSpeak && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>}</svg>
           </button>
          {/* Scrollable mode toggles */}
          {['DIY & General', 'Mechanic', 'Estimator', 'Contractor', 'Coder'].map((m) => (
             <button 
               key={m}
               onClick={() => {
                  setMode(m as AssistantMode);
                  toast.show(`Switched to ${m} mode`, "info", 3000);
               }}
               className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === m ? 'bg-primary text-black shadow-[0_0_10px_rgba(245,166,35,0.4)]' : 'text-text-secondary hover:text-text-primary'}`}
             >
                {m === 'DIY & General' && <Hammer className="w-3 h-3" />}
                {m === 'Mechanic' && <Wrench className="w-3 h-3" />}
                {m === 'Estimator' && <Calculator className="w-3 h-3" />}
                {m === 'Contractor' && <HardHat className="w-3 h-3" />}
                {m === 'Coder' && <Code className="w-3 h-3" />}
                {m === 'DIY & General' ? 'DIY' : m}
             </button>
          ))}
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto w-full h-full px-5 pt-[140px] pb-[160px] space-y-6 z-10 no-scrollbar relative">
        {/* Subtle background ember visualizer */}
        {messages.length === 0 && (
           <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
              <div className="w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
           </div>
        )}

        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center opacity-70 relative z-10 space-y-8">
            <div className="flex flex-col items-center justify-center">
              <Cpu className="w-16 h-16 text-primary mb-6 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
              <p className="text-center text-text-primary font-display text-xl tracking-tight max-w-[200px]">
                {mode === 'Mechanic' 
                  ? "What are we tearing apart today?" 
                  : mode === 'Estimator'
                  ? "Let's run some numbers."
                  : mode === 'Contractor'
                  ? "Let's build something solid."
                  : mode === 'Coder'
                  ? "What are we coding today?"
                  : "What are we building today?"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[280px]">
                {mode === 'Mechanic' && ["Torque specs for...", "Interpret OBD2 code", "Step-by-step teardown"].map(suggest => (
                    <button key={suggest} onClick={() => setInput(suggest)} className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors">{suggest}</button>
                ))}
                {mode === 'Estimator' && ["Estimate 10x10 tile", "Material cost for 50ft fence", "Labor breakdown layout"].map(suggest => (
                    <button key={suggest} onClick={() => setInput(suggest)} className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors">{suggest}</button>
                ))}
                {mode === 'Contractor' && ["Deck footing codes", "Write an estimate block", "Calculate roof pitch"].map(suggest => (
                    <button key={suggest} onClick={() => setInput(suggest)} className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors">{suggest}</button>
                ))}
                {mode === 'Coder' && ["Review my code", "Explain React hooks", "Write a Python script"].map(suggest => (
                    <button key={suggest} onClick={() => setInput(suggest)} className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors">{suggest}</button>
                ))}
                {mode === 'DIY & General' && ["Build a planter box", "Which paint for cabinets?", "Angle grinder safety"].map(suggest => (
                    <button key={suggest} onClick={() => setInput(suggest)} className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors">{suggest}</button>
                ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={idx} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
             <div className={`shadow-lg max-w-[90%] p-5 ${msg.role === 'user' ? 'bg-primary text-black rounded-[2rem] rounded-tr-md' : 'bg-surface text-text-primary border border-white/5 rounded-[2rem] rounded-tl-md'}`}>
              {msg.image && (
                <img src={msg.image} alt="Uploaded" className="rounded-xl w-full max-h-48 object-cover mb-3 border border-black/10" />
              )}
              {msg.text && (
                 msg.role === 'model' ? (
                   <div className="markdown-body text-text-primary/90">
                      <Markdown>{msg.text}</Markdown>
                   </div>
                 ) : (
                   <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{msg.text}</p>
                 )
              )}
            </div>
            <span className="text-[10px] text-text-dim mt-2 tracking-widest uppercase px-2">
              {msg.role === 'user' ? onboarding.userName : onboarding.assistantName}
            </span>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
            <div className="bg-surface text-text-primary border border-white/5 rounded-[2rem] rounded-tl-md p-5 flex gap-1.5 items-center shadow-lg">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_rgba(245,166,35,0.5)]" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_rgba(245,166,35,0.5)]" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_rgba(245,166,35,0.5)]" />
            </div>
          </motion.div>
        )}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* Floating Input Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-8 glass border-t border-white/5">
        {image && (
          <div className="mb-3 relative inline-block mx-2">
             <img src={image} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-primary/50 shadow-lg" />
             <button 
               onClick={() => setImage(null)}
               className="absolute -top-2 -right-2 bg-card rounded-full p-1 border border-border text-text-secondary hover:text-text-primary shadow-lg"
             >
                <EyeOff className="w-3.5 h-3.5" />
             </button>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-3xl pl-3 pr-2 py-2 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/30 transition-all shadow-inner">
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden" 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-text-secondary hover:text-primary transition-colors bg-white/5 rounded-full hover:bg-white/10"
              title="Upload Image"
            >
               <ImageIcon className="w-5 h-5" />
            </button>
            <button 
              type="button"
              onClick={() => setShowCamera(true)}
              className="p-2.5 text-text-secondary hover:text-primary transition-colors bg-white/5 rounded-full hover:bg-white/10"
              title="AR Camera View"
            >
               <Camera className="w-5 h-5" />
            </button>
            <button 
              type="button"
              onClick={handleMicClick}
              className={`p-2.5 transition-colors rounded-full ${isRecording ? 'text-black bg-primary animate-pulse shadow-[0_0_15px_rgba(245,166,35,0.5)]' : 'text-text-secondary hover:text-primary bg-white/5 hover:bg-white/10'}`}
            >
               <Mic className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Listening intently..." : "Ask Forge..."}
              className="flex-1 bg-transparent border-none text-text-primary outline-none py-2 px-2 placeholder:text-text-dim/80"
            />
            <button 
              onClick={() => handleSend()}
              disabled={(!input.trim() && !image) || loading}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black disabled:opacity-30 transition-all active:scale-90 shadow-[0_0_15px_rgba(245,166,35,0.4)] disabled:shadow-none"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
          
          {messages.length > 0 && (
            <div className="flex overflow-x-auto gap-2 no-scrollbar py-1 mt-1 pb-2">
              {(() => {
                let suggestions: string[] = [];
                switch (mode) {
                    case 'Mechanic': suggestions = ['Check fluid levels', 'Diagnostic codes', 'Torque specs']; break;
                    case 'Contractor': suggestions = ['Material cost breakdown', 'Permit info', 'Code requirements']; break;
                    case 'Estimator': suggestions = ['Calculate tile sqft', 'Labor breakdown', 'Compare materials']; break;
                    case 'Coder': suggestions = ['Review code block', 'Optimize algorithm', 'Debug error']; break;
                    default: suggestions = ['How does this work?', 'Give me a summary', 'Safety tips']; break;
                }
                return suggestions.map(suggest => (
                    <button 
                        key={suggest} 
                        onClick={() => setInput(suggest)} 
                        className="bg-white/5 border border-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap flex-shrink-0"
                    >
                        {suggest}
                    </button>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Welcome');
  const [chatMode, setChatMode] = useState<AssistantMode>('DIY & General');
  const [activeProject, setActiveProject] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('forge_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [onboarding, setOnboarding] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem('forge_user');
    return saved ? JSON.parse(saved) : {
      assistantName: '',
      wakeWord: '',
      userName: '',
      apiKey: '',
      vehicleInfo: '',
      inventory: '',
      onboardingComplete: false
    };
  });

  useEffect(() => {
    if (onboarding.onboardingComplete && currentScreen === 'Welcome') {
      setCurrentScreen('Main');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('forge_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const updateData = (key: keyof OnboardingData, value: any) => {
    setOnboarding(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    const sequence: Screen[] = ['Welcome', 'NameAssistant', 'WakeWord', 'AboutYou', 'ApiKeys', 'Inventory', 'Vehicles', 'Ready', 'Main'];
    const nextIdx = sequence.indexOf(currentScreen) + 1;
    if (nextIdx < sequence.length) {
      setCurrentScreen(sequence[nextIdx]);
    }
  };

  const handleFinish = () => {
    const finalData = { ...onboarding, onboardingComplete: true };
    setOnboarding(finalData);
    localStorage.setItem('forge_user', JSON.stringify(finalData));
    setCurrentScreen('Main');
    toast.show(`Welcome to Forge, ${finalData.userName}!`, 'success');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020202] py-8 selection:bg-primary/30">
      <NotificationContainer />
      {/* Premium Device Container with glow */}
      <div className="w-full max-w-[420px] h-[880px] bg-[#0A0A0A] rounded-[3.5rem] shadow-2xl relative overflow-hidden border-[6px] border-[#222] ring-1 ring-black/50 shadow-[0_0_80px_-15px_rgba(245,166,35,0.15)] flex flex-col">
        {/* Sleek status bar mock */}
        <div className="w-full h-8 flex items-center justify-center pt-2 absolute top-0 z-50 pointer-events-none">
           <div className="w-24 h-6 bg-black rounded-full" />
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-4">
          <AnimatePresence mode="wait">
          {currentScreen === 'Welcome' && (
            <WelcomeScreen key="welcome" onNext={handleNext} />
          )}

          {currentScreen === 'NameAssistant' && (
            <SetupScreen
              key="name"
              title="Name your assistant"
              subtitle="What should I call your digital spark?"
              icon={Sparkles}
              placeholder="e.g. Ember, Forge, Spark"
              value={onboarding.assistantName}
              onChange={(v) => updateData('assistantName', v)}
              onNext={handleNext}
            />
          )}

          {currentScreen === 'WakeWord' && (
            <SetupScreen
              key="wake"
              title="Pick a wake word"
              subtitle="The word that commands my attention."
              icon={Cpu}
              placeholder="e.g. Hey Forge, Ember..."
              value={onboarding.wakeWord}
              onChange={(v) => updateData('wakeWord', v)}
              onNext={handleNext}
            />
          )}

          {currentScreen === 'AboutYou' && (
            <SetupScreen
              key="user"
              title="Who are you?"
              subtitle="I want to know who I'm forging for."
              icon={User}
              placeholder="Your name"
              value={onboarding.userName}
              onChange={(v) => updateData('userName', v)}
              onNext={handleNext}
            />
          )}

          {currentScreen === 'ApiKeys' && (
            <ApiKeysSetupScreen
              key="api"
              value={onboarding.apiKey}
              onChange={(v) => updateData('apiKey', v)}
              onNext={handleNext}
            />
          )}

          {currentScreen === 'Inventory' && (
            <SetupScreen
              key="inventory"
              title="Your Toolbox"
              subtitle="What tools, gear, or tech stack do you have?"
              icon={Wrench}
              placeholder="e.g. Socket set, DeWalt drills, React/Node..."
              value={onboarding.inventory}
              onChange={(v) => updateData('inventory', v)}
              onNext={handleNext}
              optional={true}
            />
          )}

          {currentScreen === 'Vehicles' && (
            <SetupScreen
              key="vehicles"
              title="Vehicle connection"
              subtitle="Connecting Forge to your mobility."
              icon={Car}
              placeholder="Car model or ID (optional)"
              value={onboarding.vehicleInfo}
              onChange={(v) => updateData('vehicleInfo', v)}
              onNext={handleNext}
              optional={true}
            />
          )}

          {currentScreen === 'Ready' && (
            <ReadyScreen key="ready" onFinish={handleFinish} />
          )}

          {currentScreen === 'Main' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full p-8"
            >
              <header className="flex justify-between items-center mb-10 pt-8 px-2">
                <div>
                  <h1 className="text-text-dim text-xs font-bold uppercase tracking-[0.25em] mb-1">Morning, {onboarding.userName}</h1>
                  <h2 className="text-3xl font-black text-text-primary tracking-tight font-display">Dashboard</h2>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dim rounded-2xl flex items-center justify-center font-bold text-black border border-primary/40 shadow-[0_4px_20px_rgba(245,166,35,0.4)]">
                  {onboarding.userName.charAt(0)}
                </div>
              </header>

              <div className="space-y-6">
                {/* Assistant Interaction Area */}
                <div className="bg-gradient-to-b from-surface to-card rounded-[2.5rem] p-8 border border-border/40 relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-30">
                    <Sparkles className="text-primary w-8 h-8" />
                  </div>
                  
                  <div className="flex flex-col items-center text-center py-4 relative z-10">
                    {/* Animated Pulsing Voice Visualizer */}
                    <div className="relative mb-6">
                      <motion.div 
                        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-[-30px] bg-primary/20 rounded-full blur-2xl"
                      />
                      <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-primary/20 shadow-[inset_0_2px_15px_rgba(245,166,35,0.1)] z-10 relative">
                        <Cpu className="text-primary w-8 h-8" />
                      </div>
                    </div>
                    
                    <h3 className="font-display font-bold text-3xl mb-1 text-text-primary tracking-tight">{onboarding.assistantName}</h3>
                    <p className="text-text-secondary text-sm mb-8 tracking-wide">Listening for "<span className="text-primary font-medium">{onboarding.wakeWord}</span>"</p>
                    
                    <button 
                      onClick={() => setCurrentScreen('Chat')}
                      className="bg-primary hover:bg-primary/90 text-black px-8 py-3.5 rounded-full text-[15px] font-bold transition-all flex items-center gap-2 mt-2 shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] active:scale-95"
                    >
                      <MessageSquare className="w-5 h-5" /> Start Forging
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button 
                    onClick={() => { setChatMode('Mechanic'); setCurrentScreen('Chat'); }}
                    className="bg-card/40 p-5 rounded-3xl border border-border/30 hover:border-primary/50 hover:bg-surface transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface border border-border/50 group-hover:border-primary/30 flex items-center justify-center mb-1 transition-colors">
                      <Wrench className="text-primary w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-text-primary tracking-wide">Mechanic</span>
                  </button>
                  <button 
                    onClick={() => { setChatMode('Contractor'); setCurrentScreen('Chat'); }}
                    className="bg-card/40 p-5 rounded-3xl border border-border/30 hover:border-primary/50 hover:bg-surface transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface border border-border/50 group-hover:border-primary/30 flex items-center justify-center mb-1 transition-colors">
                      <HardHat className="text-primary w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-text-primary tracking-wide">Contractor</span>
                  </button>
                  <button 
                    onClick={() => { setChatMode('Estimator'); setCurrentScreen('Chat'); }}
                    className="bg-card/40 p-5 rounded-3xl border border-border/30 hover:border-primary/50 hover:bg-surface transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface border border-border/50 group-hover:border-primary/30 flex items-center justify-center mb-1 transition-colors">
                      <Calculator className="text-primary w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-text-primary tracking-wide">Estimator</span>
                  </button>
                  <button 
                    onClick={() => { setChatMode('Coder'); setCurrentScreen('Chat'); }}
                    className="bg-card/40 p-5 rounded-3xl border border-border/30 hover:border-primary/50 hover:bg-surface transition-all flex flex-col items-center justify-center gap-3 active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface border border-border/50 group-hover:border-primary/30 flex items-center justify-center mb-1 transition-colors">
                      <Code className="text-primary w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-text-primary tracking-wide">Coder</span>
                  </button>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card/30 p-5 rounded-[2rem] border border-border/20 hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70">
                       <Car className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Vehicle Match</h4>
                    <p className="text-text-secondary text-xs truncate max-w-full font-mono">{onboarding.vehicleInfo || 'No vehicle set'}</p>
                  </div>

                  <div className="bg-card/30 p-5 rounded-[2rem] border border-border/20 hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70">
                       <Wrench className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Toolbox</h4>
                    <p className="text-text-secondary text-xs truncate max-w-full font-mono">{onboarding.inventory ? 'Loaded' : 'Empty'}</p>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-card/30 rounded-[2rem] border border-border/20 p-6">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-display font-bold text-lg text-text-primary">Action Items</h3>
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {tasks.filter(t => !t.completed).length} Pending
                    </span>
                  </div>

                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto no-scrollbar">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 opacity-30">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs uppercase tracking-widest">Clear for takeoff</p>
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {tasks.map((task) => (
                          <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={() => {
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                            }}
                            onDelete={() => {
                              setTasks(prev => prev.filter(t => t.id !== task.id));
                              toast.show("Task removed", "info");
                            }}
                            onEdit={(newText) => {
                              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, text: newText } : t));
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>

                  <div className="relative group">
                    <input 
                      type="text"
                      placeholder="Add a new task..."
                      className="w-full bg-surface/50 border border-border/50 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget;
                          const val = input.value.trim();
                          if (val) {
                            setTasks(prev => [{ id: Math.random().toString(36).substr(2, 9), text: val, completed: false, createdAt: Date.now() }, ...prev]);
                            input.value = '';
                            toast.show("Task added", "success");
                          }
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary/20 rounded-lg text-primary">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-[2rem] border border-primary/20 flex items-center justify-between group focus-within:ring-1 focus-within:ring-primary/50 transition-all mt-4 mb-16">
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      <Hammer className="text-primary w-6 h-6" />
                    </div>
                    <div className="flex-1 pr-4">
                      <h4 className="font-bold text-text-primary text-[15px] tracking-wide mb-0.5">Active Project</h4>
                      <input 

                        type="text" 
                        value={activeProject}
                        onChange={(e) => setActiveProject(e.target.value)}
                        placeholder="e.g. Engine rebuild, Deck layout..."
                        className="bg-transparent border-none text-primary/80 text-xs w-full outline-none placeholder:text-primary/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto mb-4 flex justify-between items-center pt-8 border-t border-border/20">
                <button 
                   onClick={() => {
                     localStorage.removeItem('forge_user');
                     window.location.reload();
                   }}
                   className="text-text-dim text-xs uppercase tracking-widest hover:text-primary transition-colors"
                >
                  System Reset
                </button>
                <p className="text-text-dim text-[10px] uppercase tracking-widest opacity-30">Forge v0.0.1</p>
              </div>
            </motion.div>
          )}

          {currentScreen === 'Chat' && (
            <ChatScreen key="chat" onBack={() => setCurrentScreen('Main')} onboarding={onboarding} initialMode={chatMode} activeProject={activeProject} />
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

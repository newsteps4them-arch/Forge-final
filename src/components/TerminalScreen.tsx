import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Terminal, Send, Save, Download } from 'lucide-react';
import { toast } from '../lib/notifications';

export const TerminalScreen = ({ onBack, onCommand, logs = [] }: { onBack: () => void, onCommand: (cmd: string) => void, logs?: string[] }) => {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSend = () => {
    if (!input.trim()) return;
    onCommand(input.trim());
    setInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center gap-3 px-6 mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">Terminal</h2>
        </div>
        <div className="ml-auto flex gap-2">
           <button onClick={() => toast.show("Export not implemented", "info")} className="p-2 bg-white/5 rounded-full text-white/50 hover:bg-white/10 transition-colors"><Download className="w-4 h-4" /></button>
           <button onClick={() => toast.show("Scripts not implemented", "info")} className="p-2 bg-white/5 rounded-full text-white/50 hover:bg-white/10 transition-colors"><Save className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 font-mono text-[11px] mb-4 space-y-2 no-scrollbar">
         <div className="text-white/30 mb-4">// Forge Diagnostic Terminal v4.5 active</div>
         {logs.map((log, i) => {
            const isUser = log.startsWith('>');
            const isError = log.toLowerCase().includes('error');
            return (
              <div key={i} className={`flex items-start gap-2 ${isUser ? 'text-primary' : isError ? 'text-red-500' : 'text-green-500'} bg-black/40 p-2 rounded`} style={{ wordBreak: 'break-all' }}>
                 <span className="opacity-50 select-none flex-shrink-0">{isUser ? 'Tx:' : 'Rx:'}</span>
                 <span>{log.replace(/^> /, '')}</span>
              </div>
            );
         })}
         <div ref={logEndRef} />
      </div>

      <div className="px-6 relative">
         <input
           type="text"
           value={input}
           onChange={(e) => setInput(e.target.value)}
           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
           placeholder="Enter AT or Hex commands (e.g. 01 0C)"
           className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white font-mono text-sm uppercase outline-none focus:border-primary/50 transition-colors pr-14 placeholder:text-white/20 placeholder:normal-case"
         />
         <button 
           onClick={handleSend}
           className="absolute right-8 top-1/2 -translate-y-1/2 p-2 bg-primary text-black rounded-xl"
         >
           <Send className="w-4 h-4" />
         </button>
      </div>
    </motion.div>
  );
};

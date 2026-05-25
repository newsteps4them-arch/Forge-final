import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Play, Square, Coffee } from "lucide-react";

export const TimeClockScreen = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center justify-between px-6 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">Time & Labor</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 no-scrollbar pb-10">
        <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center mb-6">
           <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center relative mb-6 shadow-[0_0_40px_rgba(245,166,35,0.1)]">
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-4xl font-mono font-black text-white px-2">02:14</span>
           </div>
           
           <h3 className="text-xl font-bold text-white mb-1">RO #4829</h3>
           <p className="text-sm text-white/50 mb-6">Timing Chain Replacement</p>
           
           <div className="flex gap-4">
              <button className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 transition-colors text-white/70 gap-1">
                 <Square className="w-5 h-5" />
                 <span className="text-[9px] uppercase font-bold tracking-widest">Stop</span>
              </button>
              <button className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex flex-col items-center justify-center hover:bg-orange-500/30 transition-colors text-orange-500 gap-1">
                 <Coffee className="w-5 h-5" />
                 <span className="text-[9px] uppercase font-bold tracking-widest">Pause</span>
              </button>
              <button className="w-16 h-16 rounded-2xl bg-primary text-black flex flex-col items-center justify-center shadow-lg hover:bg-primary/90 transition-colors gap-1">
                 <Play className="w-5 h-5" />
                 <span className="text-[9px] uppercase font-bold tracking-widest">Start</span>
              </button>
           </div>
        </div>
        
        <h3 className="text-xs font-black tracking-widest uppercase text-white/50 mb-3 ml-2">Today's Timesheet</h3>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
           <div className="flex items-center justify-between">
              <div>
                 <h4 className="font-bold text-white text-sm">RO #4828 • Brake Pad R&R</h4>
                 <p className="text-[10px] uppercase font-mono text-white/40 tracking-widest">Flagged: 1.5 Hrs</p>
              </div>
              <div className="text-right">
                 <span className="font-mono text-emerald-500 font-bold text-sm">01:12:05</span>
                 <p className="text-[10px] text-white/50">Efficiency: 125%</p>
              </div>
           </div>
           
           <div className="h-px bg-white/10 w-full" />
           
           <div className="flex items-center justify-between">
              <div>
                 <h4 className="font-bold text-white text-sm">Shop Maintenance</h4>
                 <p className="text-[10px] uppercase font-mono text-white/40 tracking-widest">Hourly</p>
              </div>
              <div className="text-right">
                 <span className="font-mono text-white font-bold text-sm">00:45:00</span>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

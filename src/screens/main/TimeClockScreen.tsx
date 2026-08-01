import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Play, Square, Coffee, Edit2, Check } from "lucide-react";
import { toast } from "../../lib/notifications";

interface TimesheetLog {
  id: number;
  ro: string;
  desc: string;
  type: string;
  timeSeconds: number;
  efficiency?: string;
}

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const MOCK_BRAKE_PAD_SECONDS = 4325;
const MOCK_SHOP_MAINT_SECONDS = 2700;

export const TimeClockScreen = ({ onBack }: { onBack: () => void }) => {
  const [timesheet, setTimesheet] = useState<TimesheetLog[]>([
    { id: 1, ro: "RO #4828", desc: "Brake Pad R&R", type: "Flagged: 1.5 Hrs", timeSeconds: MOCK_BRAKE_PAD_SECONDS, efficiency: "125%" },
    { id: 2, ro: "Shop Maint.", desc: "Shop Clean & Organize", type: "Hourly", timeSeconds: MOCK_SHOP_MAINT_SECONDS }
  ]);

  // Active job states
  const [roNumber, setRoNumber] = useState("RO #4829");
  const [jobDesc, setJobDesc] = useState("Timing Chain Replacement");
  const [isEditingJob, setIsEditingJob] = useState(false);

  // Timer states
  const [timeElapsed, setTimeElapsed] = useState(134); // starts with 2m14s mock
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Clock ticks every second if active and not paused
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const mins = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const secs = totalSeconds % SECONDS_PER_MINUTE;
    
    const hStr = hrs.toString().padStart(2, "0");
    const mStr = mins.toString().padStart(2, "0");
    const sStr = secs.toString().padStart(2, "0");
    
    return `${hStr}:${mStr}:${sStr}`;
  };

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
      toast.show(`Clocked in on ${roNumber}`, "success");
    } else if (isPaused) {
      setIsPaused(false);
      toast.show(`Resumed labor timer`, "info");
    }
  };

  const handlePause = () => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      toast.show("Labor timer paused", "info");
    }
  };

  const handleStop = () => {
    if (isRunning) {
      const loggedSeconds = timeElapsed;
      const newLog: TimesheetLog = {
        id: Date.now(),
        ro: roNumber,
        desc: jobDesc,
        type: "Flagged",
        timeSeconds: loggedSeconds,
        efficiency: loggedSeconds > 0 ? `${Math.round((3600 / loggedSeconds) * 100)}%` : "100%"
      };

      setTimesheet([newLog, ...timesheet]);
      setIsRunning(false);
      setIsPaused(false);
      setTimeElapsed(0);
      toast.show(`Clocked out. Logged ${formatTime(loggedSeconds)} to timesheet.`, "success");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 mb-6">
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

      {/* Main Clock Interface */}
      <div className="flex-1 overflow-y-auto px-6 no-scrollbar pb-10">
        <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center mb-6">
           
           {/* Dial Timer Graphic */}
           <div className="w-36 h-36 rounded-full border-4 border-primary/10 flex items-center justify-center relative mb-6 shadow-[0_0_40px_rgba(245,166,35,0.08)] bg-black/40">
              <div 
                className={`absolute inset-0 border-4 border-primary rounded-full border-t-transparent ${isRunning && !isPaused ? "animate-spin" : "opacity-30"}`} 
                style={{ animationDuration: '4s' }} 
              />
              <span className="text-3xl font-mono font-black text-white px-2 tracking-widest selection:bg-transparent">
                {formatTime(timeElapsed)}
              </span>
           </div>
           
           {/* Current Job Display and Inline Edit */}
           <div className="mb-6 w-full max-w-xs relative">
             {isEditingJob ? (
               <div className="bg-black/50 border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
                 <input
                   type="text"
                   value={roNumber}
                   onChange={(e) => setRoNumber(e.target.value)}
                   placeholder="RO / Task Number"
                   className="w-full bg-white/5 border border-white/5 rounded-lg py-1 px-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-center font-mono font-bold"
                 />
                 <input
                   type="text"
                   value={jobDesc}
                   onChange={(e) => setJobDesc(e.target.value)}
                   placeholder="Job Description"
                   className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary/50 text-center font-medium"
                 />
                 <button
                   onClick={() => setIsEditingJob(false)}
                   className="mt-1 w-full bg-primary text-black rounded-lg py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1"
                 >
                   <Check className="w-3.5 h-3.5" /> Save Job Details
                 </button>
               </div>
             ) : (
               <div className="relative group">
                 <h3 className="text-lg font-bold text-white tracking-wide flex items-center justify-center gap-1.5">
                   {roNumber}
                   <button 
                     onClick={() => setIsEditingJob(true)}
                     className="text-white/30 hover:text-primary transition-colors p-1"
                   >
                     <Edit2 className="w-3.5 h-3.5" />
                   </button>
                 </h3>
                 <p className="text-xs text-white/50 mt-1 font-mono">{jobDesc}</p>
               </div>
             )}
           </div>
           
           {/* Action Buttons */}
           <div className="flex gap-4">
              <button 
                onClick={handleStop}
                disabled={!isRunning}
                className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex flex-col items-center justify-center hover:bg-white/5 disabled:hover:bg-transparent text-white/40 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all gap-1"
              >
                 <Square className="w-5 h-5" />
                 <span className="text-[8px] uppercase font-bold tracking-widest font-mono">Stop</span>
              </button>
              <button 
                onClick={handlePause}
                disabled={!isRunning || isPaused}
                className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center hover:bg-orange-500/20 disabled:hover:bg-transparent text-orange-500/50 hover:text-orange-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all gap-1"
              >
                 <Coffee className="w-5 h-5" />
                 <span className="text-[8px] uppercase font-bold tracking-widest font-mono">Pause</span>
              </button>
              <button 
                onClick={handleStart}
                className="w-16 h-16 rounded-2xl bg-primary text-black flex flex-col items-center justify-center shadow-lg hover:bg-primary/95 transition-all gap-1 active:scale-95"
              >
                 <Play className="w-5 h-5" />
                 <span className="text-[8px] uppercase font-bold tracking-widest font-mono">Start</span>
              </button>
           </div>
        </div>
        
        {/* Logs List Section */}
        <h3 className="text-[10px] font-black tracking-widest uppercase text-white/40 mb-3 ml-2 font-mono">Today's Timesheet</h3>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {timesheet.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                   <h4 className="font-bold text-white text-sm tracking-wide">{log.ro} • {log.desc}</h4>
                   <p className="text-[9px] uppercase font-mono text-white/30 tracking-widest mt-0.5">{log.type}</p>
                </div>
                <div className="text-right font-mono">
                   <span className="text-emerald-500 font-bold text-sm">{formatTime(log.timeSeconds)}</span>
                   {log.efficiency && (
                     <p className="text-[9px] text-white/30 mt-0.5">Efficiency: {log.efficiency}</p>
                   )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

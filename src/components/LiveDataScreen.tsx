import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Gauge, Activity, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Component for a dynamic circular gauge
const CircularGauge = ({ value, max, label, unit }: { value: number, max: number, label: string, unit: string }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full aspect-square max-w-[180px] mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
          fill="transparent"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#F5A623"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-white">{Math.round(value)}</span>
        <span className="text-[10px] text-white/50 font-black uppercase tracking-widest leading-none mt-1">{unit}</span>
      </div>
      <div className="absolute bottom-2 text-[10px] text-primary/60 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
};

export const LiveDataScreen = ({ onBack, telemetry = [] }: { onBack: () => void, telemetry?: any[] }) => {
  const [localData, setLocalData] = useState<any[]>(telemetry);
  
  // Simulate live data if no real telemetry is provided via props
  useEffect(() => {
     let interval: any;
     if (telemetry.length === 0) {
        interval = setInterval(() => {
           setLocalData(prev => {
              const lastRpm = prev.length ? prev[prev.length - 1].RPM : 800;
              const newRpm = Math.max(700, Math.min(6500, lastRpm + (Math.random() - 0.5) * 500));
              const newData = { time: new Date().toLocaleTimeString(), RPM: Math.round(newRpm) };
              return [...prev.slice(-40), newData];
           });
        }, 800);
     } else {
        setLocalData(telemetry);
     }
     return () => clearInterval(interval);
  }, [telemetry]);

  const currentRpm = localData.length > 0 ? localData[localData.length - 1].RPM : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center gap-3 px-6 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <Gauge className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">Live Data</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 no-scrollbar pb-10">
        
        {/* RPM Circular Gauge */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
           <CircularGauge value={currentRpm} max={7000} label="Engine RPM" unit="r/min" />
        </div>

        <div className="grid grid-cols-2 gap-4">
           {[{ label: 'Coolant', value: '185', unit: '°F', icon: Zap },
             { label: 'Boost', value: '14.2', unit: 'psi', icon: Gauge },
             { label: 'Voltage', value: '13.8', unit: 'V', icon: Zap },
             { label: 'Load', value: '24', unit: '%', icon: Activity },
           ].map((metric) => (
             <div key={metric.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-white/50">
                   <span className="text-[10px] font-bold uppercase tracking-widest">{metric.label}</span>
                   <metric.icon className="w-4 h-4 text-primary opacity-60" />
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-black text-white">{metric.value}</span>
                   <span className="text-xs text-white/40">{metric.unit}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="h-64 bg-white/5 border border-white/10 rounded-3xl p-4 overflow-hidden relative">
           <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">RPM Log</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[8px] text-primary/60 font-mono uppercase tracking-widest">Recording</span>
              </div>
           </div>
           <ResponsiveContainer width="100%" height="90%">
             <AreaChart data={localData.length ? localData : [{time: '0', RPM: 0}]}>
               <defs>
                 <linearGradient id="colorRPM" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#F5A623" stopOpacity={0.4}/>
                   <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <XAxis dataKey="time" hide />
               <YAxis hide domain={['auto', 'auto']} />
               <Tooltip 
                 contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}
                 itemStyle={{ color: '#F5A623' }}
               />
               <Area type="monotone" dataKey="RPM" stroke="#F5A623" strokeWidth={3} fillOpacity={1} fill="url(#colorRPM)" isAnimationActive={!!telemetry.length} />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

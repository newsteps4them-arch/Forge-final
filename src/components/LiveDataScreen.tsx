import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Gauge, Activity, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const LiveDataScreen = ({ onBack, telemetry = [] }: { onBack: () => void, telemetry?: any[] }) => {
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

      <div className="flex-1 overflow-y-auto px-6 space-y-6 no-scrollbar">
        <div className="grid grid-cols-2 gap-4">
           {[{ label: 'RPM', value: '850', unit: 'r/min', icon: Activity },
             { label: 'Coolant', value: '185', unit: '°F', icon: Zap },
             { label: 'Boost', value: '14.2', unit: 'psi', icon: Gauge },
             { label: 'Voltage', value: '13.8', unit: 'V', icon: Zap },
           ].map((metric) => (
             <div key={metric.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-white/50">
                   <span className="text-[10px] font-bold uppercase tracking-widest">{metric.label}</span>
                   <metric.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-black text-white">{metric.value}</span>
                   <span className="text-xs text-white/40">{metric.unit}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="h-64 bg-white/5 border border-white/10 rounded-2xl p-4">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-4">RPM Log</h3>
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={telemetry.length ? telemetry : [{time: '0', RPM: 0}]}>
               <defs>
                 <linearGradient id="colorRPM" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <XAxis dataKey="time" hide />
               <YAxis hide domain={['auto', 'auto']} />
               <Tooltip 
                 contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                 itemStyle={{ color: '#F5A623' }}
               />
               <Area type="monotone" dataKey="RPM" stroke="#F5A623" strokeWidth={2} fillOpacity={1} fill="url(#colorRPM)" />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

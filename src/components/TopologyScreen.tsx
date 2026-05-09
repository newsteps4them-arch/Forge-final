import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Network, Server, Zap, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from '../lib/notifications';

const MODULES = [
  { id: 'PCM', name: 'Powertrain Control Module', bus: 'HS-CAN', status: 'online', dtcs: 1 },
  { id: 'ABS', name: 'Anti-lock Braking System', bus: 'HS-CAN', status: 'online', dtcs: 0 },
  { id: 'IPC', name: 'Instrument Panel Cluster', bus: 'MS-CAN', status: 'online', dtcs: 0 },
  { id: 'BdyCM', name: 'Body Control Module', bus: 'MS-CAN', status: 'online', dtcs: 0 },
  { id: 'APIM', name: 'Accessory Protocol Interface', bus: 'I-CAN', status: 'offline', dtcs: 0 },
  { id: 'TCM', name: 'Transmission Control', bus: 'HS-CAN', status: 'online', dtcs: 0 },
];

export const TopologyScreen = ({ onBack }: { onBack: () => void }) => {
  const [pinging, setPinging] = useState<string | null>(null);

  const handlePing = (id: string) => {
    setPinging(id);
    toast.show(`Pinging ${id}...`, "info");
    setTimeout(() => {
      setPinging(null);
      toast.show(`${id} Responded (32ms).`, "success");
    }, 1500);
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
          <Network className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">Network Topology</h2>
        </div>
      </div>

      <div className="px-6 mb-6">
         <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <Zap className="w-5 h-5" />
               </div>
               <div>
                  <div className="text-[10px] text-primary/70 uppercase tracking-widest font-bold mb-0.5">Gateway Status</div>
                  <div className="text-sm font-black text-primary">Active // 500 kbps</div>
               </div>
            </div>
            <button 
              onClick={() => toast.show("Network-wide proxy alignment initiated...", "info")} 
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-primary hover:text-black transition-colors"
            >
               Align
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-8 no-scrollbar pb-10">
         {['HS-CAN', 'MS-CAN', 'I-CAN'].map(bus => (
           <div key={bus} className="relative">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-0.5 flex-1 bg-white/10 relative">
                  <div className="absolute inset-y-0 left-0 bg-primary w-1/3 opacity-50" />
               </div>
               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">{bus}</span>
               <div className="h-0.5 flex-1 bg-white/10 relative">
                 <div className="absolute inset-y-0 right-0 bg-primary w-1/3 opacity-50" />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               {MODULES.filter(m => m.bus === bus).map(mod => (
                 <div 
                   key={mod.id} 
                   onClick={() => handlePing(mod.id)}
                   className={`p-4 rounded-2xl border transition-all cursor-pointer ${mod.status === 'offline' ? 'bg-red-500/10 border-red-500/30' : mod.dtcs > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10 hover:border-primary/30'}`}
                 >
                   <div className="flex items-center justify-between mb-2">
                     <span className={`text-[12px] font-black uppercase tracking-widest ${mod.status === 'offline' ? 'text-red-500' : mod.dtcs > 0 ? 'text-orange-500' : 'text-white'}`}>{mod.id}</span>
                     {pinging === mod.id ? (
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                     ) : mod.status === 'offline' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                     ) : mod.dtcs > 0 ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                     ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                     )}
                   </div>
                   <p className="text-[9px] text-white/40 font-mono tracking-wider leading-tight h-6">{mod.name}</p>
                   {mod.dtcs > 0 && <span className="text-[8px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded font-mono uppercase mt-2 inline-block shadow-[0_0_8px_rgba(249,115,22,0.3)]">{mod.dtcs} DTC</span>}
                 </div>
               ))}
             </div>
           </div>
         ))}
      </div>
    </motion.div>
  );
};

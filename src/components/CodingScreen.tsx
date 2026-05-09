import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ToggleLeft, ShieldAlert, Cpu, Zap, Activity, ArrowUp, Wrench, RefreshCw, Key, Database } from 'lucide-react';
import { toast } from '../lib/notifications';

const BIDIRECTIONAL_TESTS = [
  { id: "0801", name: "Cooling Fan", sub: "High Speed", cmd: "08 01 01" },
  { id: "0802", name: "Fuel Pump", sub: "Prime Loop", cmd: "08 02 01" },
  { id: "0805", name: "EVAP Vent", sub: "Solenoid Toggle", cmd: "08 05 01" },
  { id: "2F01", name: "DLR Lights", sub: "Force Active", cmd: "2F 01 03 01" },
];

const SERVICE_FUNCTIONS = [
  { id: "oil", name: "Oil Life Reset", icon: RefreshCw },
  { id: "dpf", name: "DPF Static Regen", icon: Zap },
  { id: "bms", name: "BMS System Reset", icon: Activity },
  { id: "keys", name: "PATS Key Programming", icon: Key },
  { id: "abs", name: "ABS Bleed Routine", icon: Activity },
];

export const CodingScreen = ({ onBack, onCommand }: { onBack: () => void, onCommand: (cmd: string) => void }) => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [tab, setTab] = useState<'coding' | 'service'>('coding');

  const handleRunTest = (test: typeof BIDIRECTIONAL_TESTS[0]) => {
     setActiveTest(test.id);
     onCommand(test.cmd);
     toast.show(`Executing: ${test.name}`, "info");
     setTimeout(() => setActiveTest(null), 2000);
  };

  const handleService = (id: string, name: string) => {
    setActiveTest(id);
    toast.show(`Initiating ${name}...`, "info");
    setTimeout(() => {
       setActiveTest(null);
       toast.show(`${name} completed successfully`, "success");
    }, 2500);
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
          <ToggleLeft className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">Service & Coding</h2>
        </div>
      </div>

      <div className="px-6 mb-4 flex gap-2">
        <button 
          onClick={() => setTab('coding')}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors border ${tab === 'coding' ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white/60 border-white/10'}`}
        >
           Module Config
        </button>
        <button 
          onClick={() => setTab('service')}
          className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors border ${tab === 'service' ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white/60 border-white/10'}`}
        >
           Service Resets
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-10">
         {tab === 'coding' && (
           <>
             <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 mb-6">
                <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                   <p className="text-[10px] uppercase tracking-widest font-bold text-red-500 mb-1">Warning: Advanced Action</p>
                   <p className="text-xs text-red-500/70 leading-relaxed">
                     Incorrect coding can lead to ECU corruption. Ensure vehicle battery is stable (12.0V+) before writing block data.
                   </p>
                </div>
             </div>

             <div className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">FORScan AS-BUILT Format</div>
             <button 
               onClick={() => toast.show("AS-BUILT Backup initiated", "info")}
               className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
             >
                <div className="flex items-center gap-3">
                   <Database className="w-5 h-5 text-white/50" />
                   <div className="flex flex-col text-left">
                     <span className="text-sm font-bold text-white/80">Backup All Modules</span>
                     <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase">Generates .ab files</span>
                   </div>
                </div>
             </button>

             <button 
               onClick={() => toast.show("Advanced Mode restricted", "error")}
               className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors mt-2"
             >
                <div className="flex items-center gap-3">
                   <Cpu className="w-5 h-5 text-white/50" />
                   <div className="flex flex-col text-left">
                     <span className="text-sm font-bold text-white/80">Module Configuration (As-Built)</span>
                     <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase">Hexadecimal Block Editor</span>
                   </div>
                </div>
                <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">PRO</span>
             </button>

             <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Easy Config (One-Click)</div>
             <div className="space-y-2 mt-4">
               {[
                 { name: 'Enable Window Roll-Down via Keyfob', ECU: 'BdyCM' },
                 { name: 'Disable Auto Start/Stop', ECU: 'PCM' },
                 { name: 'Enable Global Window Close', ECU: 'BdyCM' },
                 { name: 'Disable Seatbelt Chime', ECU: 'IPC' }
               ].map((mod) => (
                  <div key={mod.name} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                     <div className="flex flex-col gap-1 pr-4">
                        <span className="text-sm font-bold text-white">{mod.name}</span>
                        <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest">ECU: {mod.ECU}</span>
                     </div>
                     <button 
                       onClick={() => toast.show("Action restricted in preview", "info")}
                       className="w-12 h-6 bg-white/10 rounded-full relative flex-shrink-0"
                     >
                        <div className="w-5 h-5 bg-white/40 rounded-full absolute left-0.5 top-0.5 transition-transform" />
                     </button>
                  </div>
               ))}
             </div>
           </>
         )}

         {tab === 'service' && (
           <>
             <div className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Maintenance Resets</div>
             <div className="grid grid-cols-1 gap-2 mt-4">
               {SERVICE_FUNCTIONS.map(service => (
                  <button 
                    key={service.id}
                    onClick={() => handleService(service.id, service.name)}
                    disabled={activeTest !== null}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
                  >
                     <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary/70">
                           <service.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight">{service.name}</span>
                     </div>
                     {activeTest === service.id ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                     ) : (
                        <ArrowUp className="w-4 h-4 rotate-45 text-white/20" />
                     )}
                  </button>
               ))}
             </div>

             <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Actuator Controls</div>
             <div className="grid grid-cols-1 gap-2 mt-4">
                {BIDIRECTIONAL_TESTS.map(test => (
                  <button
                    key={test.id}
                    onClick={() => handleRunTest(test)}
                    disabled={activeTest !== null}
                    className={`flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/30 transition-all group ${activeTest === test.id ? 'border-primary shadow-[0_0_15px_rgba(245,166,35,0.2)]' : ''}`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-mono text-primary/60 mb-0.5 uppercase tracking-widest">{test.id} // SEC_CMD</span>
                      <span className="text-[13px] font-bold text-text-primary">{test.name}</span>
                      <span className="text-[9px] text-white/40 uppercase tracking-wider">{test.sub}</span>
                    </div>
                    {activeTest === test.id ? (
                      <Activity className="w-5 h-5 text-primary animate-pulse" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary transition-colors">
                        <ArrowUp className="w-4 h-4 rotate-45" />
                      </div>
                    )}
                  </button>
                ))}
             </div>
             <p className="text-[8px] text-white/40 font-mono uppercase tracking-[0.2em] px-1 text-center mt-2">Caution: Bidirectional tests bypass PCM safety logic.</p>
           </>
         )}
      </div>
    </motion.div>
  );
};

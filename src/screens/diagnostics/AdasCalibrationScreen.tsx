import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Target, Shield, CheckCircle, AlertTriangle, ChevronRight, Map, Crosshair } from "lucide-react";

export const AdasCalibrationScreen = ({ onBack }: { onBack: () => void }) => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const systems = [
    { id: "ldw", name: "Lane Departure Warning", status: "calibrated", lastCal: "2024-03-12" },
    { id: "acc", name: "Adaptive Cruise Control", status: "attention", lastCal: "2023-10-05" },
    { id: "bsm", name: "Blind Spot Monitoring", status: "calibrated", lastCal: "2024-01-20" },
    { id: "aeb", name: "Automatic Emergency Braking", status: "calibrated", lastCal: "2024-03-12" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center justify-between px-6 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-cyan-500">
            <Target className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">ADAS Calibration</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-10">
         <div className="bg-[#111] p-6 rounded-3xl border border-white/5 mb-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield className="w-24 h-24 text-cyan-500" />
            </div>
            <h3 className="text-white text-lg font-bold mb-2">Chassis & Safety Tech</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Dynamic and static calibration for Advanced Driver Assistance Systems (ADAS).
            </p>
         </div>

         {!selectedSystem ? (
            <div className="space-y-3">
               <h3 className="text-xs font-black tracking-widest uppercase text-white/50 mb-3 ml-2">Available Systems</h3>
               {systems.map((sys) => (
                 <button
                   key={sys.id}
                   onClick={() => setSelectedSystem(sys.id)}
                   className="w-full bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 hover:border-cyan-500/50 transition-all text-left"
                 >
                   <div>
                     <h4 className="text-sm font-bold text-white flex items-center gap-2">
                       {sys.name}
                       {sys.status === 'calibrated' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                       ) : (
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                       )}
                     </h4>
                     <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-mono">Last Calibrated: {sys.lastCal}</p>
                   </div>
                   <ChevronRight className="w-4 h-4 text-white/30" />
                 </button>
               ))}
            </div>
         ) : (
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
            >
               <button onClick={() => setSelectedSystem(null)} className="text-[10px] uppercase font-bold text-cyan-500 tracking-widest flex items-center gap-1 hover:text-cyan-400">
                  <ArrowLeft className="w-3 h-3" /> Back to Systems
               </button>

               <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                 <h4 className="text-lg font-bold text-white mb-1">
                   {systems.find(s => s.id === selectedSystem)?.name}
                 </h4>
                 <div className="h-px w-full bg-white/10 my-4" />
                 
                 <div className="space-y-3">
                   <h5 className="text-xs text-white/50 uppercase tracking-widest font-bold">Calibration Method</h5>
                   <div className="grid grid-cols-2 gap-3">
                      <button className="bg-[#111] border border-cyan-500/50 text-cyan-500 p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-cyan-500/10 transition-colors gap-2">
                         <Crosshair className="w-6 h-6" />
                         <span className="text-[10px] uppercase font-bold tracking-widest">Static (Targets)</span>
                      </button>
                      <button className="bg-[#111] border border-white/5 text-white/70 p-4 rounded-xl flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors gap-2">
                         <Map className="w-6 h-6" />
                         <span className="text-[10px] uppercase font-bold tracking-widest">Dynamic (Drive)</span>
                      </button>
                   </div>
                 </div>
                 
                 <div className="mt-6 bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                    <div>
                       <h6 className="text-[10px] uppercase tracking-widest font-bold text-orange-500 mb-1">Pre-Conditions</h6>
                       <ul className="text-xs text-white/70 list-disc pl-4 space-y-1">
                         <li>Vehicle on level surface</li>
                         <li>Tire pressure verified</li>
                         <li>No suspension modifications</li>
                       </ul>
                    </div>
                 </div>

                 <button className="w-full mt-6 bg-cyan-500 text-black py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors">
                   Initiate Calibration
                 </button>
               </div>
            </motion.div>
         )}
      </div>
    </motion.div>
  );
};

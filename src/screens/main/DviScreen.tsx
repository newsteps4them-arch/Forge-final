import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, XCircle, FileText, Upload } from "lucide-react";

export const DviScreen = ({ onBack }: { onBack: () => void }) => {
  const [items] = useState([
    { id: 1, category: "Tires & Brakes", name: "Front Brake Pads", status: "attention", notes: "3mm remaining, replace soon." },
    { id: 2, category: "Under Hood", name: "Engine Oil", status: "good", notes: "Level and condition okay." },
    { id: 3, category: "Under Hood", name: "Drive Belt", status: "critical", notes: "Cracked and glazed, immediate replacement recommended." },
    { id: 4, category: "Exterior", name: "Headlights", status: "good", notes: "Operational." },
  ]);

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
          <div className="flex items-center gap-2 text-primary">
            <Camera className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">Digital Inspection</h2>
          </div>
        </div>
        <button className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Send DVI</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-10">
        {items.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">{item.category}</span>
               </div>
               <div className="flex gap-2">
                 <button className={`p-2 rounded-full border ${item.status === 'good' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-black border-white/10 text-white/30'}`}>
                   <CheckCircle className="w-4 h-4" />
                 </button>
                 <button className={`p-2 rounded-full border ${item.status === 'attention' ? 'bg-orange-500/20 border-orange-500/50 text-orange-500' : 'bg-black border-white/10 text-white/30'}`}>
                   <AlertTriangle className="w-4 h-4" />
                 </button>
                 <button className={`p-2 rounded-full border ${item.status === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-black border-white/10 text-white/30'}`}>
                   <XCircle className="w-4 h-4" />
                 </button>
               </div>
            </div>
            
            <div className="bg-black/50 border border-white/5 p-3 rounded-xl">
               <p className="text-xs text-white/70">{item.notes}</p>
            </div>
            
            <div className="flex items-center gap-2">
               <button className="flex-1 border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 transition-all py-3 rounded-xl flex items-center justify-center gap-2 text-white/50 hover:text-primary">
                 <Upload className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Add Media</span>
               </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

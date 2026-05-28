import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Users, TrendingUp, DollarSign, Calendar, Plus, Bell } from "lucide-react";

export const CrmDashboardScreen = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center justify-between px-6 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">Client CRM</h2>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors text-primary border border-primary/30">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full no-scrollbar">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 px-6 mb-6">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">Mtd Revenue</span>
            <span className="text-2xl font-black text-white">$24,150</span>
            <div className="flex items-center gap-1 text-emerald-500 font-mono text-[10px] uppercase mt-1">
              <TrendingUp className="w-3 h-3" /> +12.5% vs Prev
            </div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">Approvals</span>
            <span className="text-2xl font-black text-white">84%</span>
            <div className="flex items-center gap-1 text-emerald-500 font-mono text-[10px] uppercase mt-1">
              <TrendingUp className="w-3 h-3" /> SMS Close Rate
            </div>
          </div>
        </div>

        {/* Action Required */}
        <div className="px-6 mb-2">
            <h3 className="text-xs font-black tracking-widest uppercase text-white/50 mb-3">Awaiting Approval (SMS Sent)</h3>
        </div>
        
        <div className="px-6 mb-6 flex flex-col gap-3">
           <div className="bg-white/5 border border-primary/30 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                 <h4 className="font-bold text-white text-sm">Sarah Jenkins</h4>
                 <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Sent 2H Ago</span>
              </div>
              <p className="text-xs text-white/60">2019 Honda CR-V • Evap Core Replacement</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                 <span className="text-sm font-black text-white">$1,245.00</span>
                 <div className="flex gap-2">
                   <button className="bg-white/5 px-3 py-1.5 rounded flex items-center gap-1 text-[10px] font-black uppercase text-white/70 hover:bg-white/10">
                      <Bell className="w-3 h-3" /> Nudge
                   </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Recent Client Activity */}
        <div className="px-6 mb-2">
            <h3 className="text-xs font-black tracking-widest uppercase text-white/50 mb-3">Client Activity</h3>
        </div>

        <div className="px-6 mb-6 flex flex-col gap-3">
           <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                 </div>
                 <div>
                    <h4 className="font-bold text-white text-sm">Mike Thompson</h4>
                    <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest">Approved RO #4482</p>
                 </div>
              </div>
              <span className="text-sm font-black text-white">$850</span>
           </div>

           <div className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                 </div>
                 <div>
                    <h4 className="font-bold text-white text-sm">Elise Morrison</h4>
                    <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest">Scheduled Appointment</p>
                 </div>
              </div>
              <span className="text-xs text-white/50">Tomorrow</span>
           </div>
        </div>

      </div>
    </motion.div>
  );
};

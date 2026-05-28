import React from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Activity,
  Users,
  TrendingUp,
  DollarSign,
  Database,
  Clock,
} from "lucide-react";

export const AnalyticsScreen = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <header className="flex items-center gap-4 mb-8 pt-6 px-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-3xl font-black text-text-primary tracking-tight font-display">
          Shop Analytics
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface border border-white/5 p-5 rounded-3xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-text-dim font-bold">
                Revenue
              </span>
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div className="text-2xl font-black text-white">$14,250</div>
            <div className="text-[10px] text-success mt-1">
              +12.5% this week
            </div>
          </div>

          <div className="bg-surface border border-white/5 p-5 rounded-3xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-text-dim font-bold">
                Efficiency
              </span>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-black text-white">94%</div>
            <div className="text-[10px] text-primary mt-1">
              Billed vs Actual Hrs
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/5 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="w-16 h-16" />
          </div>
          <h3 className="text-sm font-bold text-text-primary mb-4">
            Diagnostics Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">First-Time Fix Rate</span>
                <span className="text-white font-bold">88%</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5">
                <div
                  className="bg-success h-1.5 rounded-full"
                  style={{ width: "88%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">Average Diag Time</span>
                <span className="text-white font-bold">45 min</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/5 p-6 rounded-3xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="w-16 h-16" />
          </div>
          <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Predictive Failure Analytics (AI)
          </h3>
          <p className="text-[10px] text-text-dim mb-4">
            Advanced heuristic models trained on historical shop data and OEM telemetry.
          </p>
          <div className="space-y-4">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="text-white text-xs font-bold font-mono">Ford F-150 (3.5L EcoBoost)</h4>
                   <p className="text-[10px] text-white/50">Cam Phaser / Timing Chain Risk</p>
                 </div>
                 <span className="text-[10px] uppercase font-black tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded">High Risk: 82%</span>
               </div>
               <div className="flex gap-4 text-[10px] text-white/40 font-mono mt-3">
                 <div className="flex flex-col">
                   <span>Trigger:</span>
                   <span className="text-white/70">Cold Start Rattle (Audio)</span>
                 </div>
                 <div className="flex flex-col">
                   <span>Est. Window:</span>
                   <span className="text-white/70">1,500 - 3,000 mi</span>
                 </div>
               </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="text-white text-xs font-bold font-mono">Honda CR-V (1.5T)</h4>
                   <p className="text-[10px] text-white/50">Fuel Injector Degradation</p>
                 </div>
                 <span className="text-[10px] uppercase font-black tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">Elevated: 45%</span>
               </div>
               <div className="flex gap-4 text-[10px] text-white/40 font-mono mt-3">
                 <div className="flex flex-col">
                   <span>Trigger:</span>
                   <span className="text-white/70">Fuel Trim Variance (+8%)</span>
                 </div>
                 <div className="flex flex-col">
                   <span>Est. Window:</span>
                   <span className="text-white/70">5,000 - 10,000 mi</span>
                 </div>
               </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <h4 className="text-white text-xs font-bold font-mono">Chevy Silverado (6.2L)</h4>
                   <p className="text-[10px] text-white/50">Lifter Failure (AFM/DFM)</p>
                 </div>
                 <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Monitor: 28%</span>
               </div>
               <div className="flex gap-4 text-[10px] text-white/40 font-mono mt-3">
                 <div className="flex flex-col">
                   <span>Trigger:</span>
                   <span className="text-white/70">Valve Train Harmonics</span>
                 </div>
                 <div className="flex flex-col">
                   <span>Est. Window:</span>
                   <span className="text-white/70">12,000+ mi</span>
                 </div>
               </div>
            </div>
            
            <button className="w-full py-3 border border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 text-xs font-bold tracking-widest text-white/50 hover:text-primary transition-all rounded-xl uppercase">
              Run Fleet Analysis
            </button>
          </div>
        </div>

        <div className="bg-surface border border-white/5 p-6 rounded-3xl mb-8">
          <h3 className="text-sm font-bold text-text-primary mb-4">
            API Utilization (Team Forge)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    NHTSA Recall DB
                  </div>
                  <div className="text-[10px] text-text-dim">
                    450 Queries / mo
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-success">Healthy</span>
            </div>

            <div className="flex items-center justify-between bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Nexpart Order API
                  </div>
                  <div className="text-[10px] text-text-dim">
                    120 Orders / mo
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-success">Healthy</span>
            </div>

            <div className="flex items-center justify-between bg-black/30 p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Mitchell1 Labor
                  </div>
                  <div className="text-[10px] text-text-dim">
                    380 Lookups / mo
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-warning text-yellow-500">
                Rate Limit Near
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

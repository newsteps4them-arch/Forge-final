import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, MessageSquare, Wrench, Activity, Hexagon, Calculator, Network, Database, Terminal } from 'lucide-react';

const INDEX_ITEMS = [
  {
    icon: MessageSquare,
    title: 'Expert Network (AI)',
    desc: 'Consult specialized AI agents (Diagnostics Lead, Performance Tuner, Electrical Engineer, Estimator) for specific tasks. Ask for diagnostic paths, wiring pinouts, or labor calculations.',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    icon: Terminal,
    title: 'Diagnostic Log',
    desc: 'Perform quick or deep module scans using your connected OBD interface. View DTCs, simulate freeze frame data, and clear emission monitors.',
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  {
    icon: Activity,
    title: 'Tuner Hub (Live Data)',
    desc: 'Monitor live telemetry like engine RPM, boost pressure, and coolant temp. The ECU Maps tab allows for simulated 3D volumetric efficiency mapping.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    icon: Hexagon,
    title: 'Service & Coding',
    desc: 'Perform maintenance resets (Oil, DPF, BMS) or modify As-Built hexadecimal module configurations (e.g., enabling window roll-down via keyfob).',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    icon: Network,
    title: 'Network Topology',
    desc: 'Visualize your vehicle\'s CAN-Bus networks (HS-CAN, MS-CAN). Ping individual modules to check health and see which modules are reporting DTCs.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    icon: Calculator,
    title: 'Service Estimator',
    desc: 'Draft repair orders. Add parts and labor lines, calculate totals, and send professional PDFs directly to your clients.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    icon: Database,
    title: '3rd Party APIs',
    desc: 'Link external platform accounts (like Snap-on Connect or FORScan) to pull in autonomous data logs and repair databases.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10'
  },
  {
    icon: Wrench,
    title: 'Toolbox (Inventory)',
    desc: 'Keep track of your physical tools. The AI incorporates your available tools into its repair strategies.',
    color: 'text-gray-400',
    bg: 'bg-gray-400/10'
  }
];

export const IndexScreen = ({ onBack }: { onBack: () => void }) => {
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
          <BookOpen className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">Operator's Manual</h2>
        </div>
      </div>

      <div className="px-6 mb-6">
         <p className="text-xs text-white/50 leading-relaxed font-mono">
           Welcome to the Engineering Hub. This suite is designed for advanced automotive diagnostics and operations. Review the sections below to understand the capabilities at your disposal.
         </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-10">
         {INDEX_ITEMS.map(item => (
           <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4 mb-3">
                 <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                 </div>
                 <h3 className="text-[13px] font-black text-white tracking-widest uppercase">{item.title}</h3>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed pl-14">
                 {item.desc}
              </p>
           </div>
         ))}
         
         <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <h4 className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">Hardware Connection</h4>
            <p className="text-xs text-white/40 max-w-[250px] mx-auto">
               Ensure your ELM327 or J2534 passthrough device is connected via Bluetooth/WiFi before attempting live data or coding functions.
            </p>
         </div>
      </div>
    </motion.div>
  );
};

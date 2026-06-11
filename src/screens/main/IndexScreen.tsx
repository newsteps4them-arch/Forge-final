import React from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Wrench,
  Activity,
  Hexagon,
  Calculator,
  Network,
  Database,
  Terminal,
  Car,
  FileText,
  ShoppingCart,
  Users,
  Camera,
  Clock,
  Target
} from "lucide-react";

const INDEX_ITEMS = [
  // --- Service & Repairs ---
  {
    category: "Service & Repairs",
    icon: Terminal,
    title: "Diagnostics & Scans",
    team: "Team Diagnostics",
    desc: "Perform quick or deep system scans. View error codes, system states, and clear faults.",
    color: "text-red-500",
    bg: "bg-red-500/10",
    target: "Diagnostics"
  },
  {
    category: "Service & Repairs",
    icon: Activity,
    title: "Live Telemetry Data",
    team: "Team Powertrain",
    desc: "Monitor live system data like pressure, temperature, voltage, and RPM in real-time.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    target: "LiveData"
  },
  {
    category: "Service & Repairs",
    icon: Hexagon,
    title: "Maintenance & Resets",
    team: "Team Systems",
    desc: "Perform routine resets (e.g., duty cycles) and customize hardware controller settings.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    target: "Coding"
  },
  {
    category: "Service & Repairs",
    icon: Target,
    title: "Sensor Calibration",
    team: "Team Chassis",
    desc: "Run static and dynamic calibration routines for hardware sensors, proximity monitoring, and control systems.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    target: "AdasCalibration"
  },
  {
    category: "Service & Repairs",
    icon: Network,
    title: "Network Topology",
    team: "Team Electrical",
    desc: "Visualize your asset's communication networks and see which control modules are responding.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    target: "Topology"
  },
  // --- Shop Management ---
  {
    category: "Shop Management",
    icon: Calculator,
    title: "Estimates & Invoices",
    team: "Team Operations",
    desc: "Draft repair orders, calculate labor totals, and send professional estimates to clients.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    target: "Estimator"
  },
  {
    category: "Shop Management",
    icon: Camera,
    title: "Digital Inspections",
    team: "Team Service",
    desc: "Perform multi-point inspections with photo and video uploads to share with clients.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    target: "DviModule"
  },
  {
    category: "Shop Management",
    icon: Clock,
    title: "Time Clock & Labor",
    team: "Team HR / Ops",
    desc: "Clock in on jobs, track mechanic efficiency, and log your daily hours.",
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
    target: "TimeClock"
  },
  {
    category: "Shop Management",
    icon: Users,
    title: "Client Management",
    team: "Team CX",
    desc: "Manage customer approvals, send automated SMS reminders, and track shop revenue.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    target: "CrmDashboard"
  },
  {
    category: "Shop Management",
    icon: ShoppingCart,
    title: "Parts Catalog",
    team: "Team Inventory",
    desc: "Order OEM and aftermarket parts directly from your integrated suppliers.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    target: "PartsCatalog"
  },
  // --- Research & Tools ---
  {
    category: "Research & Tools",
    icon: MessageSquare,
    title: "Ask AI Assistants",
    team: "Team Intelligence",
    desc: "Chat with specialized AI for help with diagnostic paths, wiring, or labor calculations.",
    color: "text-primary",
    bg: "bg-primary/10",
    target: "Chat"
  },
  {
    category: "Research & Tools",
    icon: FileText,
    title: "Repair Manuals",
    team: "Team Research",
    desc: "Search Service Bulletins (TSBs), recalls, and step-by-step manufacturer procedures.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    target: "KnowledgeBase"
  },
  {
    category: "Research & Tools",
    icon: Car,
    title: "Client Assets",
    team: "Team Operations",
    desc: "Manage client property/hardware, view service histories, and set the active target asset.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    target: "Garage"
  },
  {
    category: "Research & Tools",
    icon: Database,
    title: "Connect Services",
    team: "Team Infrastructure",
    desc: "Link external tool accounts to sync your repair data and logs automatically.",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    target: "Integrations"
  },
  {
    category: "Research & Tools",
    icon: Wrench,
    title: "Equipment Inventory",
    team: "Team Inventory",
    desc: "Keep track of physical shop tools and your diagnostic equipment.",
    color: "text-gray-400",
    bg: "bg-gray-400/10",
    target: "Inventory"
  },
];

const CATEGORIES = ["Service & Repairs", "Shop Management", "Research & Tools"];

export const IndexScreen = ({ onBack, onNavigate }: { onBack: () => void, onNavigate: (screen: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center gap-3 px-6 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">
            Module Directory
          </h2>
        </div>
      </div>

      <div className="px-6 mb-6">
        <p className="text-xs text-white/50 leading-relaxed font-mono">
          Easily access all your shop tools below, grouped by category for your convenience.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-8 no-scrollbar pb-10">
        {CATEGORIES.map((category) => (
          <div key={category} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-white/10 pb-2 mb-4">
              {category}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {INDEX_ITEMS.filter(item => item.category === category).map((item) => (
                <div
                  key={item.title}
                  onClick={() => onNavigate(item.target)}
                  className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-primary/30 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-[13px] font-black text-white tracking-widest uppercase">
                        {item.title}
                      </h3>
                    </div>
                    {item.team && (
                       <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-black/50 text-white/40 border border-white/5 rounded-md font-mono hidden xl:inline-block">
                         {item.team}
                       </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed sm:pl-14">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <h4 className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">
            Hardware Connection
          </h4>
          <p className="text-xs text-white/40 max-w-[250px] mx-auto">
            Ensure your ELM327 or J2534 passthrough device is connected via
            Bluetooth/WiFi before attempting live data or coding functions.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

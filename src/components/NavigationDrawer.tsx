/**
 * NavigationDrawer Component
 *
 * A side-bar navigation menu that provides access to all major subsystems of Forge OS.
 * Categorizes functionality into Systems, Diagnostics, Tools & Repair, and Management.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Wrench, Activity, Database, Calculator, 
  ScanEye, BarChart3, Zap, FileText, 
  Terminal, Home, MessageSquare, BookOpen, Settings, Rocket
} from "lucide-react";

import { Screen } from "../hooks/useNavigation";

interface NavigationDrawerProps {
  /** Visibility state of the drawer. */
  isOpen: boolean;
  /** Callback to close the drawer. */
  onClose: () => void;
  /** Navigation callback to switch screens. */
  onNavigate: (screen: Screen) => void;
  /** The currently active screen ID. */
  currentScreen: Screen;
}

/**
 * Menu hierarchy definition for the drawer.
 */
const MENU_GROUPS = [
  {
    title: "System",
    items: [
      { id: "Main", label: "Dashboard", icon: Home, desc: "Command Center" },
      { id: "Chat", label: "AI Hub", icon: MessageSquare, desc: "Expert Assistance" },
    ]
  },
  {
    title: "Diagnostics",
    items: [
      { id: "Diagnostics", label: "OBD Tracker", icon: Activity, desc: "Diagnostics Log" },
      { id: "Terminal", label: "OBD Terminal", icon: Terminal, desc: "Live Connection" },
      { id: "LiveData", label: "Live Data Grid", icon: Activity, desc: "Sensor Streams" },
      { id: "Coding", label: "Module Coding", icon: Wrench, desc: "ECU Adjustments" },
      { id: "VisualInspector", label: "Field Vision", icon: ScanEye, desc: "Visual AI Insp." },
    ]
  },
  {
    title: "Tools & Repair",
    items: [
      { id: "GuidedDiagnostics", label: "Test Plans", icon: FileText, desc: "Guided Repair" },
      { id: "Oscilloscope", label: "Lab Scope", icon: Activity, desc: "Waveform Analysis" },
      { id: "Topology", label: "Network Topology", icon: Zap, desc: "CAN-bus Mapping" },
      { id: "Estimator", label: "Estimator", icon: Calculator, desc: "Quotes & Labor" },
      { id: "Inventory", label: "Toolbox", icon: Wrench, desc: "Inventory & Parts" },
    ]
  },
  {
    title: "Management",
    items: [
      { id: "Integrations", label: "3rd Party API", icon: Database, desc: "External Tools" },
      { id: "Analytics", label: "Shop Analytics", icon: BarChart3, desc: "Performance ROI" },
      { id: "GoToMarket", label: "Launch Console", icon: Rocket, desc: "SaaS & Build Stats" },
      { id: "Settings", label: "Settings", icon: Settings, desc: "System Config" },
      { id: "Index", label: "Documentation", icon: BookOpen, desc: "Manual & Docs" },
    ]
  }
];

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentScreen
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
          {/* Sidebar Menu */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] sm:w-[320px] bg-[#050505] border-r border-white/5 z-[100] flex flex-col shadow-2xl hardware-pattern"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between p-6 border-b border-primary/20 bg-primary/5 pt-safe">
              <h2 className="text-xl font-display font-black text-white tracking-widest uppercase">
                Forge<span className="text-primary tracking-normal">.OS</span>
              </h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5 shadow-inner"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            
            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-6 pb-32 pl-safe">
              {MENU_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-2">
                  <h3 className="px-3 text-[10px] font-mono text-primary/70 uppercase tracking-[0.25em] font-bold">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                          currentScreen === item.id 
                          ? "bg-primary/10 border border-primary/30 text-white shadow-inner" 
                          : "bg-black hover:bg-white/5 border border-white/5 text-text-secondary hover:text-white"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentScreen === item.id ? "bg-primary text-black" : "bg-white/5 text-text-dim"}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col flex-1 text-left">
                          <span className="font-bold text-sm tracking-wide">{item.label}</span>
                          <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest opacity-70">{item.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

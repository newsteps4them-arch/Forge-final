import React from "react";
import { Home, Activity, Gauge, ToggleLeft, Terminal } from "lucide-react";

const TABS = [
  { id: "Main", label: "Home", icon: Home },
  { id: "Diagnostics", label: "Diag", icon: Activity },
  { id: "LiveData", label: "Live Data", icon: Gauge },
  { id: "Coding", label: "Coding", icon: ToggleLeft },
  { id: "Terminal", label: "Terminal", icon: Terminal },
];

export const BottomNavBar = ({
  currentTab,
  onTabSelect,
}: {
  currentTab: string;
  onTabSelect: (id: string) => void;
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#151619]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex items-center gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabSelect(tab.id)}
          className={`relative p-3 rounded-[24px] flex items-center justify-center transition-all duration-300 min-w-[3rem] h-12 ${
            currentTab === tab.id
              ? "bg-[#2E2E2E] text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.5)]"
              : "text-text-secondary hover:text-white hover:bg-white/5"
          }`}
        >
          <tab.icon
            className={`w-5 h-5 transition-transform duration-300 ${currentTab === tab.id ? "scale-110 drop-shadow-[0_0_8px_rgba(245,166,35,0.6)]" : "scale-100"}`}
          />
          {currentTab === tab.id && (
            <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary drop-shadow-[0_0_4px_rgba(245,166,35,1)]" />
          )}
        </button>
      ))}
    </div>
  );
};

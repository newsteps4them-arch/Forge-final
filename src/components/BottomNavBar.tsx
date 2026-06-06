/**
 * BottomNavBar Component
 *
 * The primary navigation controller for the mobile-style interface.
 * Provides quick access to Home, Hub, Chat, and Assets.
 */

import React from "react";
import { Home, LayoutGrid, MessageSquare, Box } from "lucide-react";

/**
 * Navigation tabs configuration.
 */
const TABS = [
  { id: "Main", label: "Home", icon: Home },
  { id: "Index", label: "Hub", icon: LayoutGrid },
  { id: "Chat", label: "Chat", icon: MessageSquare },
  { id: "Inventory", label: "Assets", icon: Box },
];

interface BottomNavBarProps {
  /** The ID of the currently active tab. */
  currentTab: string;
  /** Callback function triggered when a tab is clicked. */
  onTabSelect: (id: string) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabSelect,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0A0A0A]/95 backdrop-blur-3xl border border-white/10 rounded-full px-2 py-2 flex items-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50">
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`relative flex items-center justify-center transition-all duration-500 ease-out h-12 ${
              isActive 
                ? "w-28 px-4 bg-primary/20 text-primary shadow-inner" 
                : "w-12 text-text-dim hover:text-white hover:bg-white/5 mx-0.5"
            } rounded-full overflow-hidden`}
          >
            {/* Pulsing indicator for active state */}
            {isActive && (
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
            )}

            <div className={`relative flex items-center justify-center gap-2 ${isActive ? "scale-100" : "scale-90"}`}>
              <tab.icon className={`transition-all duration-300 ${isActive ? "w-4 h-4" : "w-5 h-5"}`} />
              <div 
                className={`text-[10px] uppercase font-bold tracking-wider overflow-hidden transition-all duration-500 whitespace-nowrap ${
                  isActive ? "w-full max-w-[60px] opacity-100 ml-1" : "w-0 max-w-0 opacity-0"
                }`}
              >
                {tab.label}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

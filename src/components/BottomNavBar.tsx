import React from 'react';
import { Home, Activity, Gauge, ToggleLeft, Terminal } from 'lucide-react';

const TABS = [
  { id: 'Main', label: 'Home', icon: Home },
  { id: 'Diagnostics', label: 'Diag', icon: Activity },
  { id: 'LiveData', label: 'Live Data', icon: Gauge },
  { id: 'Coding', label: 'Coding', icon: ToggleLeft },
  { id: 'Terminal', label: 'Terminal', icon: Terminal }
];

export const BottomNavBar = ({ currentTab, onTabSelect }: { currentTab: string, onTabSelect: (id: string) => void }) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/10 rounded-[30px] p-2 flex items-center gap-1 shadow-2xl z-50">
       {TABS.map(tab => (
         <button
           key={tab.id}
           onClick={() => onTabSelect(tab.id)}
           className={`relative p-3 rounded-[20px] flex items-center justify-center transition-all duration-300 w-12 h-12 ${
             currentTab === tab.id ? 'bg-primary/20 text-primary scale-110 shadow-[0_4px_20px_rgba(245,166,35,0.3)]' : 'text-white/50 hover:text-white hover:bg-white/5'
           }`}
         >
           <tab.icon className="w-5 h-5 absolute" />
         </button>
       ))}
    </div>
  );
};

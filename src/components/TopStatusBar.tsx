import React, { useState, useEffect } from "react";
import {
  Wifi,
  Battery,
  BatteryMedium,
  BatteryFull,
  Activity,
  Download
} from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export const TopStatusBar = () => {
  const [time, setTime] = useState("");
  const [ping, setPing] = useState(24);
  const { isInstallable, installPWA } = usePWAInstall();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) +
          "." +
          now.getMilliseconds().toString().padStart(3, "0").slice(0, 1),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 100);

    const pingInterval = setInterval(() => {
      setPing((p) => Math.max(12, Math.min(80, p + (Math.random() * 10 - 5))));
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(pingInterval);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-[#0A0A0A] border-b border-white/5 text-[10px] font-mono tracking-widest text-text-dim z-50 relative selection:bg-transparent cursor-default">
      <div className="flex items-center gap-4">
        <span className="text-primary font-bold">
          FORGE_OS <span className="text-white/30 text-[8px]">v1.4.2</span>
        </span>
        <span className="hidden sm:inline">SYSTEM: ONLINE</span>
        {isInstallable && (
          <button 
            onClick={installPWA}
            className="flex items-center gap-1.5 bg-primary/20 text-primary px-2 py-0.5 rounded cursor-pointer hover:bg-primary/30 transition-colors border border-primary/30"
          >
            <Download className="w-3 h-3" />
            <span>INSTALL APP</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-success animate-pulse relative top-[-0.5px]" />
          <span className="w-12 text-right">{ping.toFixed(0)}MS</span>
        </div>
        <div className="flex items-center gap-1.5 text-primary">
          <Wifi className="w-3 h-3" />
          <span>SYNC</span>
        </div>
        <span className="w-24 text-right hidden sm:inline text-white/50">
          {time}
        </span>
        <BatteryFull className="w-4 h-4 text-white/70" />
      </div>
    </div>
  );
};

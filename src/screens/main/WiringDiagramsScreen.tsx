import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Search,
  ZoomIn,
  ZoomOut,
  Layers,
  Maximize2,
} from "lucide-react";

export const WiringDiagramsScreen = ({
  onBack,
  vehicle,
}: {
  onBack: () => void;
  vehicle: string;
}) => {
  const [zoom, setZoom] = useState(1);
  const [activeLayer, setActiveLayer] = useState("all");

  const layers = [
    { id: "all", name: "All Circuits" },
    { id: "power", name: "Power & Ground" },
    { id: "can", name: "CAN Bus" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <header className="flex flex-col gap-2 mb-6 pt-6 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-text-primary" />
            </button>
            <h2 className="text-3xl font-black text-text-primary tracking-tight font-display flex items-center gap-2">
              <Layers className="w-8 h-8 text-primary" /> Schematics
            </h2>
          </div>
        </div>
        <p className="text-text-secondary text-sm font-mono pl-12">{vehicle}</p>
      </header>

      <div className="flex items-center gap-2 bg-surface/50 border border-white/10 p-2 rounded-2xl mb-4">
        {layers.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveLayer(l.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeLayer === l.id ? "bg-primary text-black" : "text-text-secondary hover:text-white"}`}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-white/10 rounded-3xl p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-text-secondary w-full">
          <Search className="w-4 h-4" />
          <input
            type="text"
            placeholder="Search components (e.g., Engine Control Module)"
            className="bg-transparent border-none outline-none text-sm w-full font-mono placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="flex-1 bg-surface border border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center group">
        <div className="absolute right-4 top-4 flex flex-col gap-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
            className="w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
            className="w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Mock Schematic Drawing */}
        <div
          className="relative w-full h-full p-8 transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Main ECU Box */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-64 border-2 border-primary bg-primary/5 rounded-lg p-4 flex flex-col justify-between">
            <div className="border-b border-primary/30 pb-2 mb-2 font-bold text-primary text-xs uppercase tracking-wider text-center">
              ECM (J220)
            </div>
            <div className="flex flex-col gap-4 text-[10px] font-mono text-white/70">
              <div className="flex justify-start gap-2">
                <span className="text-white">Pin 2 (B+)</span>
              </div>
              <div className="flex justify-start gap-2">
                <span className="text-white">Pin 4 (Gnd)</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-white">Pin 12 (CAN_H)</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-white">Pin 13 (CAN_L)</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-white">Pin 65 (Ign 1)</span>
              </div>
            </div>
          </div>

          {/* Ignition Coil Box */}
          <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-32 h-24 border-2 border-white/20 bg-white/5 rounded-lg p-3">
            <div className="font-bold text-white text-xs text-center mb-2">
              Ignition Coil 1
            </div>
            <div className="flex flex-col gap-2 text-[10px] font-mono text-white/50">
              <div className="flex justify-start">
                <span className="text-white">Pin 1 (Sig)</span>
              </div>
            </div>
          </div>

          {/* Throttle Body Box */}
          <div className="absolute bottom-1/3 right-1/4 translate-y-1/2 w-32 h-32 border-2 border-white/20 bg-white/5 rounded-lg p-3">
            <div className="font-bold text-white text-xs text-center mb-2">
              Throttle Body
            </div>
            <div className="flex flex-col gap-2 text-[10px] font-mono text-white/50">
              <div className="flex justify-start">
                <span className="text-white">Pin 1 (M+)</span>
              </div>
              <div className="flex justify-start">
                <span className="text-white">Pin 2 (M-)</span>
              </div>
            </div>
          </div>

          {/* Lines connecting them */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: -1 }}
          >
            {/* Ign Coil Line */}
            <path
              d="M 45% 45% L 55% 45% L 65% 30% L 75% 30%"
              fill="none"
              stroke={
                activeLayer === "power"
                  ? "rgba(255,0,0,0.8)"
                  : activeLayer === "all"
                    ? "rgba(245,166,35,0.8)"
                    : "rgba(255,255,255,0.1)"
              }
              strokeWidth="2"
              className={
                activeLayer === "all" || activeLayer === "power"
                  ? "shadow-[0_0_8px_rgba(255,0,0,0.5)]"
                  : ""
              }
            />
            <text
              x="55%"
              y="43%"
              fill="white"
              fontSize="10"
              fontFamily="monospace"
              opacity="0.5"
            >
              YEL/BLK
            </text>

            {/* Throttle Body Lines (CANish) */}
            <path
              d="M 45% 55% L 55% 55% L 65% 70% L 75% 70%"
              fill="none"
              stroke={
                activeLayer === "can"
                  ? "#00FFFF"
                  : activeLayer === "all"
                    ? "#00FFFF"
                    : "rgba(255,255,255,0.1)"
              }
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <path
              d="M 45% 58% L 55% 58% L 65% 73% L 75% 73%"
              fill="none"
              stroke={
                activeLayer === "can"
                  ? "#FF00FF"
                  : activeLayer === "all"
                    ? "#FF00FF"
                    : "rgba(255,255,255,0.1)"
              }
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

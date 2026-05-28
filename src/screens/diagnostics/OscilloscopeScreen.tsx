import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Activity,
  Play,
  Pause,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export const OscilloscopeScreen = ({
  onBack,
  vehicle,
}: {
  onBack: () => void;
  vehicle: string;
}) => {
  const [data, setData] = useState<
    { time: number; ch1: number; ch2: number }[]
  >([]);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: number | ReturnType<typeof setTimeout>;
    if (isRunning) {
      let t = 0;
      interval = setInterval(() => {
        setData((prev) => {
          const newData = [...prev];
          if (newData.length > 50) newData.shift();

          // Generate some mock CAN bus or sensor data
          const ch1 = Math.sin(t * 0.5) * 5 + 5 + Math.random() * 0.5; // 0-10V ish signal
          const ch2 =
            Math.sin(t * 0.5 + Math.PI) * 2.5 + 2.5 + Math.random() * 0.2; // Counter signal

          newData.push({ time: t, ch1, ch2 });
          t += 1;
          return newData;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

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
              <Activity className="w-8 h-8 text-primary" /> Lab Scope
            </h2>
          </div>
          <button className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center hover:bg-white/10">
            <Settings className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
              isRunning
                ? "bg-error/20 text-error hover:bg-error/30"
                : "bg-success/20 text-success hover:bg-success/30"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" /> Pause Capture
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> Start Capture
              </>
            )}
          </button>
        </div>

        <div className="flex-1 bg-surface border border-white/10 rounded-3xl p-4 relative flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  CH1 (Sensor)
                </span>
                <span className="text-xs font-mono text-primary ml-2">
                  10 V/div
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00FFFF] shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  CH2 (Ref)
                </span>
                <span className="text-xs font-mono text-[#00FFFF] ml-2">
                  5 V/div
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <defs>
                  <filter id="glow-primary" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="time" hide />
                <YAxis domain={[-2, 12]} stroke="rgba(255,255,255,0.5)" />
                <Line
                  type="monotone"
                  dataKey="ch1"
                  stroke="#f5a623"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ filter: "url(#glow-primary)" }} // Not super useful but good
                  style={{ filter: "url(#glow-primary)" }}
                />
                <Line
                  type="monotone"
                  dataKey="ch2"
                  stroke="#00FFFF"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ filter: "url(#glow-cyan)" }}
                  style={{ filter: "url(#glow-cyan)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

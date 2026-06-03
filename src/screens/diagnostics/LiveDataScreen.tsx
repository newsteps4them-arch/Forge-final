import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Gauge, Activity, Zap, Search, CheckCircle, Trash2, Download } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Component for a dynamic circular gauge
const CircularGauge = ({
  value,
  max,
  label,
  unit,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
}) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full aspect-square max-w-[180px] mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
          fill="transparent"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#F5A623"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-white">
          {Math.round(value)}
        </span>
        <span className="text-[10px] text-white/50 font-black uppercase tracking-widest leading-none mt-1">
          {unit}
        </span>
      </div>
      <div className="absolute bottom-2 text-[10px] text-primary/60 font-bold uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
};

const AVAILABLE_PIDS = [
  { id: "RPM", name: "Engine RPM", group: "General", unit: "RPM", icon: Activity },
  { id: "ECT", name: "Coolant Temp", group: "Cooling", unit: "°F", icon: Zap },
  { id: "MAP", name: "Manifold Pressure", group: "Air", unit: "psi", icon: Gauge },
  { id: "VSS", name: "Vehicle Speed", group: "General", unit: "mph", icon: Activity },
  { id: "SPARK", name: "Spark Advance", group: "Spark", unit: "°", icon: Zap },
  { id: "STFT1", name: "Short Term Fuel Trim", group: "Fuel", unit: "%", icon: Activity },
  { id: "LTFT1", name: "Long Term Fuel Trim", group: "Fuel", unit: "%", icon: Activity },
  { id: "MAF", name: "Mass Air Flow", group: "Air", unit: "g/s", icon: Gauge },
  { id: "IAT", name: "Intake Air Temp", group: "Air", unit: "°F", icon: Zap },
  { id: "TP", name: "Throttle Pos", group: "Air", unit: "%", icon: Gauge },
  { id: "O2S", name: "O2 Sensor Voltage", group: "Fuel", unit: "V", icon: Zap },
];

export const LiveDataScreen = ({
  onBack,
  telemetry = [],
}: {
  onBack: () => void;
  telemetry?: any[];
}) => {
  const [localData, setLocalData] = useState<any[]>(telemetry);
  const [selectedChartPid, setSelectedChartPid] = useState<string>("RPM");
  const [searchPid, setSearchPid] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");

  const [tab, setTab] = useState<"dashboard" | "maps" | "sessions">("dashboard");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingData, setRecordingData] = useState<any[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const [savedSessions, setSavedSessions] = useState<{ id: string, name: string, date: string, data: any[], pid: string }[]>(() => {
    try {
      const saved = localStorage.getItem("forge_telemetry_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Derived state values
  const latestData = localData[localData.length - 1];
  const currentRpm = latestData ? latestData.RPM : 800;
  const currentChartVal = latestData ? latestData[selectedChartPid] : "--";
  const activePidDef = AVAILABLE_PIDS.find(p => p.id === selectedChartPid) || AVAILABLE_PIDS[0];

  const filteredPids = AVAILABLE_PIDS.filter((pid) => {
    const matchesSearch = pid.name.toLowerCase().includes(searchPid.toLowerCase()) || 
                          pid.id.toLowerCase().includes(searchPid.toLowerCase());
    const matchesGroup = filterGroup === "All" || pid.group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  // Sync saved sessions
  useEffect(() => {
    try {
      localStorage.setItem("forge_telemetry_sessions", JSON.stringify(savedSessions));
    } catch (e) {
      console.error(e);
    }
  }, [savedSessions]);

  // Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Simulate live data if no real telemetry is provided via props
  useEffect(() => {
    let interval: any;
    if (telemetry.length === 0) {
      interval = setInterval(() => {
        setLocalData((prev) => {
          const lastVal = prev.length ? (prev[prev.length - 1][selectedChartPid] || (selectedChartPid === "RPM" ? 800 : 50)) : (selectedChartPid === "RPM" ? 800 : 50);
          const newVal = Math.max(
            0,
            lastVal + (Math.random() - 0.5) * (selectedChartPid === "RPM" ? 500 : 5),
          );
          const newData = {
            time: new Date().toLocaleTimeString(),
            [selectedChartPid]: Math.round(newVal * 10) / 10,
            RPM: selectedChartPid !== "RPM" 
              ? Math.max(700, prev.length ? prev[prev.length - 1].RPM + (Math.random() - 0.5) * 500 : 800)
              : Math.round(newVal),
          };

          if (isRecording) {
            setRecordingData(r => [...r, { time: newData.time, value: newData[selectedChartPid] }]);
          }

          return [...prev.slice(-40), newData];
        });
      }, 800);
    } else {
      // Defer state update to avoid cascading effect warning
      setTimeout(() => setLocalData(telemetry), 0);
    }
    return () => clearInterval(interval);
  }, [telemetry, selectedChartPid, isRecording]);

  const startRecording = () => {
    setRecordingData([]);
    setRecordingTime(0);
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    const sessionName = prompt("Enter a name to save this session:", `Session ${new Date().toLocaleDateString()}`);
    if (sessionName && sessionName.trim()) {
      const newSession = {
        id: `session-${Date.now()}`,
        name: sessionName.trim(),
        date: new Date().toLocaleString(),
        data: recordingData,
        pid: selectedChartPid
      };
      setSavedSessions(prev => [newSession, ...prev]);
    }
    setRecordingData([]);
  };

  const exportSessionToCsv = (session: any) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Time,Value\n"
      + session.data.map((d: any) => `"${d.time}","${d.value}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${session.name.replace(/\s+/g, "_")}_${session.pid}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSessions(prev => prev.filter(s => s.id !== id));
    if (selectedSessionId === id) {
      setSelectedSessionId(null);
    }
  };

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
          <Activity className="w-5 h-5" />
          <div>
             <h2 className="text-xl font-black uppercase tracking-widest leading-none">
               Tuner Hub
             </h2>
             <span className="text-[9px] uppercase tracking-widest text-primary/70 font-mono">Team Powertrain</span>
          </div>
        </div>
      </div>
      <div className="px-6 mb-4 flex gap-2">
        <button
          onClick={() => setTab("dashboard")}
          className={`flex-grow py-3 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-colors border ${tab === "dashboard" ? "bg-primary text-black border-primary" : "bg-white/5 text-white/60 border-white/10"}`}
        >
          Live Dash
        </button>
        <button
          onClick={() => setTab("maps")}
          className={`flex-grow py-3 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-colors border ${tab === "maps" ? "bg-primary text-black border-primary" : "bg-white/5 text-white/60 border-white/10"}`}
        >
          ECU Maps
        </button>
        <button
          onClick={() => setTab("sessions")}
          className={`flex-grow py-3 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-colors border ${tab === "sessions" ? "bg-primary text-black border-primary" : "bg-white/5 text-white/60 border-white/10"}`}
        >
          Saved Logs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 no-scrollbar pb-10">
        {tab === "dashboard" && (
          <motion.div
            key="dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Recording Controls */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse shadow-[0_0_8px_#ff0000]" : "bg-white/20"}`} />
                 <div>
                   <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                     {isRecording ? "Recording Live Telemetry" : "Telemetry Recorder"}
                   </h4>
                   {isRecording && (
                     <span className="text-[10px] text-white/50 font-mono mt-0.5 inline-block">
                       Elapsed Time: {Math.floor(recordingTime / 60)}m {recordingTime % 60}s • {recordingData.length} data points
                     </span>
                   )}
                 </div>
              </div>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isRecording 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "bg-primary text-black hover:bg-primary/95 shadow-[0_4px_15px_rgba(245,166,35,0.2)]"
                }`}
              >
                {isRecording ? "Stop & Save" : "Start Rec"}
              </button>
            </div>

            {/* RPM Circular Gauge */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
              <CircularGauge
                value={currentRpm}
                max={7000}
                label="Engine RPM"
                unit="r/min"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Coolant", value: "185", unit: "°F", icon: Zap },
                { label: "Boost", value: "14.2", unit: "psi", icon: Gauge },
                { label: "Voltage", value: "13.8", unit: "V", icon: Zap },
                { label: "Load", value: "24", unit: "%", icon: Activity },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors cursor-default"
                >
                  <div className="flex items-center justify-between text-white/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {metric.label}
                    </span>
                    <metric.icon className="w-4 h-4 text-primary opacity-60" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">
                      {metric.value}
                    </span>
                    <span className="text-xs text-white/40">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-64 bg-white/5 border border-white/10 rounded-3xl p-4 overflow-hidden relative">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {activePidDef.name} Log
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[8px] text-primary/60 font-mono uppercase tracking-widest">
                    Recording
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart
                  data={localData.length ? localData : [{ time: "0", [selectedChartPid]: 0 }]}
                >
                  <defs>
                    <linearGradient id="colorRPM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    itemStyle={{ color: "#F5A623" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedChartPid}
                    stroke="#F5A623"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRPM)"
                    isAnimationActive={!!telemetry.length}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* PID Selection List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 relative flex flex-col">
              <div className="flex flex-col gap-3 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/70 px-2">Data Stream Selection</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchPid}
                      onChange={(e) => setSearchPid(e.target.value)}
                      placeholder="Search PIDs (e.g. RPM, Fuel)..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <select 
                    value={filterGroup} 
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="All">All Groups</option>
                    <option value="General">General</option>
                    <option value="Cooling">Cooling</option>
                    <option value="Air">Air</option>
                    <option value="Spark">Spark</option>
                    <option value="Fuel">Fuel</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                {filteredPids.map(pid => (
                  <button
                    key={pid.id}
                    onClick={() => setSelectedChartPid(pid.id)}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      selectedChartPid === pid.id 
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(245,166,35,0.1)]" 
                        : "bg-black/40 border-white/5 hover:border-primary/30 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`p-3 rounded-xl border ${selectedChartPid === pid.id ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-white/40 border-white/10"}`}>
                         <pid.icon className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm ${selectedChartPid === pid.id ? "text-primary" : "text-white"}`}>{pid.name}</h4>
                            {selectedChartPid === pid.id && <CheckCircle className="w-3 h-3 text-primary" />}
                         </div>
                         <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono mt-0.5 inline-block">{pid.id} • {pid.group}</span>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <span className={`text-lg font-black font-mono ${selectedChartPid === pid.id ? "text-primary" : "text-white/70"}`}>
                         {selectedChartPid === pid.id ? currentChartVal : "--"}
                       </span>
                       <span className="text-[10px] text-white/40 font-mono tracking-widest">{pid.unit}</span>
                    </div>
                  </button>
                ))}
                {filteredPids.length === 0 && (
                   <div className="text-center py-8 text-white/40 text-sm">
                     No PIDs found matching your criteria.
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "maps" && (
          <motion.div
            key="maps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3">
              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
                  Tuning Mode Active
                </p>
                <p className="text-xs text-primary/70 leading-relaxed">
                  Modifying 3D volumetric efficiency maps. Ensure ECU is
                  unlocked before writing flash data.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
              Target Maps
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: "Fuel_Base", name: "Open Loop Fueling Map", load: "10x10" },
                {
                  id: "Spark_Adv",
                  name: "Ignition Timing Advance",
                  load: "12x12",
                },
                { id: "Boost_Tgt", name: "Wastegate Duty Cycle", load: "8x8" },
              ].map((map) => (
                <div
                  key={map.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-primary/30 transition-colors cursor-pointer group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                      {map.id}
                    </span>
                    <span className="text-[9px] min-w-12 text-center py-0.5 bg-white/10 text-white rounded font-mono shadow-inner">
                      {map.load}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-4 flex-1">
                    {map.name}
                  </h4>

                  {/* Fake Grid Map */}
                  <div className="grid grid-cols-4 gap-1 opacity-50 group-hover:opacity-100 transition-opacity mt-auto">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-4 rounded-sm ${i % 3 === 0 ? "bg-primary/40" : i % 2 === 0 ? "bg-orange-500/40" : "bg-red-500/40"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 bg-primary text-black py-4 rounded-xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-primary/90 shadow-[0_4px_15px_rgba(245,166,35,0.3)]">
              Write Flash Data
            </button>
          </motion.div>
        )}
        {tab === "sessions" && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {selectedSessionId ? (
              (() => {
                const s = savedSessions.find(x => x.id === selectedSessionId);
                if (!s) return null;
                return (
                  <div className="space-y-4">
                    <button
                      onClick={() => setSelectedSessionId(null)}
                      className="px-4 py-2 border border-white/10 rounded-lg text-xs font-bold text-white/70 hover:bg-white/5 transition-colors uppercase tracking-wider"
                    >
                      ← Back to Sessions
                    </button>
                    
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-black text-white">{s.name}</h4>
                          <span className="text-[10px] text-white/50 font-mono uppercase tracking-widest">{s.date} • PID: {s.pid}</span>
                        </div>
                        <button
                          onClick={() => exportSessionToCsv(s)}
                          className="bg-primary text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                        >
                          Export CSV
                        </button>
                      </div>

                      <div className="h-64 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden relative">
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={s.data.length ? s.data : [{ time: "0", value: 0 }]}>
                            <defs>
                              <linearGradient id="sessionCol" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F5A623" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis hide domain={["auto", "auto"]} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#111",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                fontSize: "10px",
                              }}
                              itemStyle={{ color: "#F5A623" }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#F5A623"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#sessionCol)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
                  Recorded Sessions ({savedSessions.length})
                </div>
                
                <div className="space-y-3">
                  {savedSessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className="bg-white/5 border border-white/10 hover:border-primary/40 rounded-2xl p-5 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-primary transition-colors">{s.name}</h4>
                        <span className="text-[10px] text-white/50 font-mono mt-1 inline-block uppercase tracking-wider">
                          {s.date} • PID: {s.pid} • {s.data.length} points
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportSessionToCsv(s); }}
                          className="p-2 border border-white/10 text-white/60 hover:text-primary hover:border-primary/40 rounded-lg hover:bg-white/5 transition-all"
                          title="Export CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => deleteSession(s.id, e)}
                          className="p-2 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/40 rounded-lg hover:bg-red-500/5 transition-all"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {savedSessions.length === 0 && (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                      <Activity className="w-12 h-12 text-white/15 mx-auto mb-4" />
                      <h4 className="text-sm font-bold text-white/70 mb-1">No recorded telemetry</h4>
                      <p className="text-xs text-white/40 max-w-xs mx-auto">
                        Go to the Live Dash tab and start recording live stream data to log telemetry charts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

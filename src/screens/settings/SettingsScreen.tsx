import React, { useState } from "react";
import { 
  ArrowLeft, Key, Bot, ShieldAlert, EyeOff, Eye, Database, Car, Sparkles,
  CheckCircle2, HelpCircle, Zap, SlidersHorizontal, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "../../lib/notifications";

export const SettingsScreen = ({
  apiKey,
  meliApiKey,
  alldataKey,
  obdKey,
  openAiKey,
  onSave,
  onBack,
}: {
  apiKey: string;
  meliApiKey: string;
  alldataKey: string;
  obdKey: string;
  openAiKey: string;
  onSave: (api: string, meli: string, alldata: string, obd: string, openai: string) => void;
  onBack: () => void;
}) => {
  // Modes: "sandbox" (easy, pre-configured defaults) vs "custom" (their own developer API keys)
  const [configMode, setConfigMode] = useState<"sandbox" | "custom">(
    (!apiKey && !meliApiKey && !alldataKey && !obdKey && !openAiKey) ? "sandbox" : "custom"
  );

  const [geminiKey, setGeminiKey] = useState(apiKey);
  const [meliKey, setMeliKey] = useState(meliApiKey);
  const [alldataK, setAlldataK] = useState(alldataKey);
  const [obdK, setObdK] = useState(obdKey);
  const [openaiKey, setOpenaiKey] = useState(openAiKey);

  const [showGemini, setShowGemini] = useState(false);
  const [showMeli, setShowMeli] = useState(false);
  const [showAlldata, setShowAlldata] = useState(false);
  const [showObd, setShowObd] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Help guides visible state
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  // OBD-II Link Dropdown Preset State
  const [selectedObdPreset, setSelectedObdPreset] = useState(() => {
    if (!obdKey) return "simulated";
    if (obdKey.includes("OBDLink")) return "obdlink";
    if (obdKey.includes("ELM327")) return "elm327";
    return "custom";
  });

  const handleSave = () => {
    setError(null);
    if (configMode === "sandbox") {
      // Clean or default keys
      onSave("", "", "", "", "");
      toast.show("Forge System Configuration active!", "success");
    } else {
      onSave(geminiKey, meliKey, alldataK, obdK, openaiKey);
      toast.show("Custom Developer Keys linked successfully!", "success");
    }
  };

  const autoLinkSandbox = () => {
    setConfigMode("sandbox");
    setGeminiKey("");
    setMeliKey("");
    setAlldataK("");
    setObdK("");
    setOpenaiKey("");
    setSelectedObdPreset("simulated");
    toast.show("Auto-Configured: Forge Cloud and OBD-II Simulator activated!", "success");
  };

  const selectObdPresetAndAutoFill = (preset: string) => {
    setSelectedObdPreset(preset);
    setError(null);
    if (preset === "simulated") {
      setObdK("SIMULATED_OBD_STREAM_ENABLED");
      toast.show("ECU Engine Simulator Mode activated.", "success");
    } else if (preset === "obdlink") {
      setObdK("OBDLink MX+ Bluetooth (Auto-Baud 115200)");
      toast.show("Optimized for high-speed OBDLink MX+ hardware adapters.", "success");
    } else if (preset === "elm327") {
      setObdK("Generic ELM327 Bluetooth (Auto-Baud 38400)");
      toast.show("Standard rate 38400 ELM327 link mapped.", "success");
    } else if (preset === "vgate") {
      setObdK("Vgate iCar Pro Blue Link (Auto-Baud 115200)");
      toast.show("Vgate iCar Pro profile applied.", "success");
    } else {
      setObdK("");
    }
  };

  const toggleGuide = (id: string) => {
    setOpenGuide(openGuide === id ? null : id);
  };

  // Status computation for user readability
  const getStatusBadge = (keyVal: string, term: string) => {
    if (configMode === "sandbox") {
      return (
        <span className="flex items-center gap-1 text-[9px] font-mono tracking-wider font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Forge Cloud Default (Free)
        </span>
      );
    }
    if (keyVal && keyVal.trim() !== "") {
      return (
        <span className="flex items-center gap-1 text-[9px] font-mono tracking-wider font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
          📂 Linked Custom Key
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[9px] font-mono tracking-wider font-extrabold uppercase bg-white/5 text-text-dim border border-white/5 px-2 py-0.5 rounded-full">
        ⚠️ Standby (Offline)
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#050505] flex flex-col pt-8 pb-32 z-20 overflow-y-auto"
    >
      <div className="flex items-center justify-between px-6 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="w-5 h-5 drop-shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
            <h2 className="text-xl font-black uppercase tracking-widest font-display">
              System Connections
            </h2>
          </div>
        </div>

        {/* Instant Auto Setup Button for non-technical users */}
        <button
          onClick={autoLinkSandbox}
          className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl transition-all"
        >
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          1-Click Auto Configure
        </button>
      </div>

      <div className="px-6 space-y-6 max-w-2xl mx-auto w-full pb-20">
        
        {/* Intro explanatory banner */}
        <div className="bg-surface border border-white/5 p-5 rounded-3xl relative overflow-hidden">
          <h3 className="text-white text-xs font-black uppercase tracking-wider mb-1">
            How do you want Team Forge to connect?
          </h3>
          <p className="text-[11px] text-text-secondary leading-relaxed mb-4">
            You don't need any complex API keys! Set Team Forge to **Automated Sandbox** to get fully active AI diagnostic features, repair logs, and simulator engines with zero setup.
          </p>

          <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => {
                setConfigMode("sandbox");
                toast.show("Switched to Automated Sandbox. No technical API knowledge required!", "success");
              }}
              className={`py-3 px-4 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 justify-center ${
                configMode === "sandbox"
                  ? "bg-primary text-black font-extrabold shadow-[0_0_15px_rgba(245,166,35,0.2)]"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Automated Sandbox</span>
              <span className="text-[8px] opacity-70 lowercase font-normal">Super simple, pre-configured</span>
            </button>

            <button
              onClick={() => {
                setConfigMode("custom");
                toast.show("Switched to Custom Keys. Plug in your own private configurations.", "info");
              }}
              className={`py-3 px-4 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 justify-center ${
                configMode === "custom"
                  ? "bg-primary text-black font-extrabold shadow-[0_0_15px_rgba(245,166,35,0.2)]"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Custom Developer Keys</span>
              <span className="text-[8px] opacity-70 lowercase font-normal">Add your own private services</span>
            </button>
          </div>
        </div>

        {/* Dynamic configurations list */}
        <div className="space-y-6">

          {/* 1. Gemini AI: Diagnostic AI Assistant */}
          <div className="bg-surface/30 border border-white/5 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-black/40 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5">
                  <Key className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Diagnostic AI Assistant</h4>
                  <p className="text-[10px] text-text-dim font-medium">The neural engine behind diagnosis steps and terminal chats.</p>
                </div>
              </div>
              {getStatusBadge(geminiKey, "Gemini")}
            </div>

            <button
              onClick={() => toggleGuide("gemini")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-primary transition-colors font-mono uppercase"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              What is a Diagnostic AI Key? {openGuide === "gemini" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {openGuide === "gemini" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-black/40 p-3.5 rounded-xl border border-white/5 text-[11px] text-text-secondary leading-relaxed space-y-2 mt-2"
                >
                  <p>
                    A <strong>Gemini Key</strong> acts as the password to Google's super-fast AI systems. Linking it grants unlimited assistance with DTC engine trouble codes, part lookups, and vehicle advice.
                  </p>
                  <p className="border-t border-white/5 pt-2">
                    💡 <strong>Where to obtain it:</strong> Head over to the free <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google AI Studio</a>, click "Create API Key", and paste it securely below.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {configMode === "custom" && (
              <div className="relative group mt-2">
                <input
                  type={showGemini ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => {
                    setError(null);
                    setGeminiKey(e.target.value);
                  }}
                  placeholder="Paste your Gemini AI Key (starts with AIzaSy...)"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4.5 pl-4 pr-12 text-xs text-text-primary placeholder:text-text-dim outline-none focus:border-primary/50 transition-all font-mono"
                />
                <button
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
                >
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* 2. OBDII Configuration: Automotive ECU Connector presets */}
          <div className="bg-surface/30 border border-white/5 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-black/40 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5">
                  <Car className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">OBD-II Hardware Link</h4>
                  <p className="text-[10px] text-text-dim font-medium">Auto-connect profile for diagnostic dongles plugged into cars.</p>
                </div>
              </div>
              {getStatusBadge(obdK, "OBD2")}
            </div>

            {/* Hardware Preset Dropdown */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[9px] text-text-dim uppercase font-mono tracking-wider font-extrabold">Select Your Diagnostic Adapter Hook:</label>
              <select
                value={selectedObdPreset}
                onChange={(e) => selectObdPresetAndAutoFill(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="simulated">🎮 Active Simulated Tester Mode (No Hardware Needed)</option>
                <option value="obdlink">📱 OBDLink MX+ Bluetooth Adapter (Extremely Fast, 115200 bps)</option>
                <option value="elm327">🔌 Generic Chinese ELM327 Bluetooth Adapter (Budget, 38400 bps)</option>
                <option value="vgate">📡 Vgate iCar Pro Bluetooth Link (Power-saving, 115200 bps)</option>
                <option value="custom">🛠️ Private Baud Rate / Custom Comport Driver</option>
              </select>
            </div>

            <button
              onClick={() => toggleGuide("obd")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-primary transition-colors font-mono uppercase"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              What is an OBD Adapter Hook? {openGuide === "obd" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {openGuide === "obd" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-black/40 p-3.5 rounded-xl border border-white/5 text-[11px] text-text-secondary leading-relaxed space-y-2 mt-2"
                >
                  <p>
                    An <strong>OBD-II Bluetooth / WiFi adapter</strong> is a compact plug that slides into the port near your steering column. Using this selection ensures Team Forge streams live speed, fuel trim, and sensors correctly.
                  </p>
                  <p className="border-t border-white/5 pt-2">
                    💡 <strong>Simulated Tester Mode</strong> simulates a virtual car's Engine Control Unit (ECU) right inside the web platform. Great for demoing.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {configMode === "custom" && selectedObdPreset === "custom" && (
              <div className="relative group mt-2">
                <input
                  type={showObd ? "text" : "password"}
                  value={obdK}
                  onChange={(e) => setObdK(e.target.value)}
                  placeholder="Enter private OBD-II driver commands or keys"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4.5 pl-4 pr-12 text-xs text-text-primary placeholder:text-text-dim outline-none focus:border-primary/50 transition-all font-mono"
                />
                <button
                  onClick={() => setShowObd(!showObd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
                >
                  {showObd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* 3. AllData Integration: Mechanical Repair Database */}
          <div className="bg-surface/30 border border-white/5 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-black/40 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5">
                  <Database className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Manufacturer Repair Diagrams</h4>
                  <p className="text-[10px] text-text-dim font-medium font-display">Links electrical wiring schematics and factory specifications.</p>
                </div>
              </div>
              {getStatusBadge(alldataK, "AllData")}
            </div>

            <button
              onClick={() => toggleGuide("alldata")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-primary transition-colors font-mono uppercase"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              What are Repair Handbooks? {openGuide === "alldata" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {openGuide === "alldata" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-black/40 p-3.5 rounded-xl border border-white/5 text-[11px] text-text-secondary leading-relaxed mt-2"
                >
                  <p>
                    AllData is a mechanical database providing diagrams for vehicles. Integrating your commercial license key populates actual components wiring details for active projects. When deactivated, Team Forge uses automated offline simulations.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {configMode === "custom" && (
              <div className="relative group mt-2">
                <input
                  type={showAlldata ? "text" : "password"}
                  value={alldataK}
                  onChange={(e) => setAlldataK(e.target.value)}
                  placeholder="OEM Database API Key"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4.5 pl-4 pr-12 text-xs text-text-primary placeholder:text-text-dim outline-none focus:border-primary/50 transition-all font-mono"
                />
                <button
                  onClick={() => setShowAlldata(!showAlldata)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
                >
                  {showAlldata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* 4. Meli Token: Chief of Staff AI */}
          <div className="bg-surface/30 border border-white/5 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-black/40 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5">
                  <Bot className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Chief Of Staff Sync (Meli)</h4>
                  <p className="text-[10px] text-text-dim font-medium">Orchestrate and coordinate tasks across workshop assistants.</p>
                </div>
              </div>
              {getStatusBadge(meliKey, "Meli")}
            </div>

            <button
              onClick={() => toggleGuide("meli")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-primary transition-colors font-mono uppercase"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              What is Meli Chief of Staff? {openGuide === "meli" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {openGuide === "meli" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-black/40 p-3.5 rounded-xl border border-white/5 text-[11px] text-text-secondary leading-relaxed space-y-2 mt-2"
                >
                  <p>
                    <strong>Meli</strong> is a Chief-of-Staff scheduling AI that syncs workshop timelines, keeps mechanics up-to-date, and maintains status across your entire CRM automatically.
                  </p>
                  <p className="border-t border-white/5 pt-2">
                    💡 <strong>Where to get a key:</strong> Request trial credentials over at <a href="https://meli.im/developers" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Meli Developers</a>.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {configMode === "custom" && (
              <div className="relative group mt-2">
                <input
                  type={showMeli ? "text" : "password"}
                  value={meliKey}
                  onChange={(e) => setMeliKey(e.target.value)}
                  placeholder="Meli Access Token (Bearer ...)"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4.5 pl-4 pr-12 text-xs text-text-primary placeholder:text-text-dim outline-none focus:border-primary/50 transition-all font-mono"
                />
                <button
                  onClick={() => setShowMeli(!showMeli)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
                >
                  {showMeli ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* 5. OpenAI API Key */}
          <div className="bg-surface/30 border border-white/5 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-black/40 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5">
                  <Sparkles className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">OpenAI Core Copilot Key</h4>
                  <p className="text-[10px] text-text-dim font-medium">Backup AI models, specialized text utilities, and Voice Cloning.</p>
                </div>
              </div>
              {getStatusBadge(openaiKey, "OpenAI")}
            </div>

            {configMode === "custom" && (
              <div className="relative group mt-2">
                <input
                  type={showOpenai ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="OpenAI Private Key (sk-...)"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-4.5 pl-4 pr-12 text-xs text-text-primary placeholder:text-text-dim outline-none focus:border-primary/50 transition-all font-mono"
                />
                <button
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
                >
                  {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-500 text-xs">{error}</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary/95 text-black font-extrabold text-[11px] tracking-widest py-4.5 rounded-2xl uppercase transition-all shadow-[0_0_20px_rgba(245,166,35,0.2)]"
          >
            Apply Active Connections
          </button>
          <button
            onClick={onBack}
            className="px-6 py-4.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-2xl uppercase transition-all"
          >
            Cancel
          </button>
        </div>

      </div>
    </motion.div>
  );
};

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, CheckCircle2, ChevronRight, Waves, Volume2 } from "lucide-react";
import { toast } from "../lib/notifications";

const PRESETS = [
  {
    id: "preset-alpha",
    name: "Alpha Protocol",
    desc: "Authoritative & precise",
  },
  { id: "preset-nova", name: "Nova Synapse", desc: "Warm & conversational" },
  { id: "preset-echo", name: "Echo Sentinel", desc: "Calm & analytical" },
];

export const VoiceCloneScreen = ({
  onNext,
  value,
  onChange,
  onUrlChange,
}: {
  onNext: () => void;
  value: boolean;
  onChange: (val: boolean) => void;
  onUrlChange: (url: string) => void;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recorded, setRecorded] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setIsRecording(false);
            setRecorded(true);
            setActivePreset(null);
            onChange(true);
            onUrlChange("https://example.com/custom_voice_print.mp3");
            toast.show("Voice print mapped successfully.", "success");
            
            // Auto-advance after recording
            setTimeout(() => {
              onNext();
            }, 1500);
            
            return 100;
          }
          return p + 2; // Takes about 5 seconds
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording, onChange, onUrlChange, onNext]);

  const handleRecord = () => {
    if (recorded) {
      // Reset recording
      setRecorded(false);
      onChange(false);
      onUrlChange("");
      return;
    }
    setIsRecording(true);
    setProgress(0);
    toast.show("Recording... Please read the phrase aloud.", "info");
  };

  const handleSelectPreset = (id: string) => {
    setRecorded(false);
    setIsRecording(false);
    setProgress(0);
    setActivePreset(id);
    onChange(false);
    onUrlChange(id);
    toast.show(`Voice core updated to preset.`, "success");
    
    // Auto-advance after preset selection
    setTimeout(() => {
      onNext();
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 overflow-y-auto no-scrollbar"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Mic className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-10 relative z-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 border border-white/5 shadow-lg">
          <Mic className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>

        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">
          Vocal Core
        </h2>
        <p className="text-text-secondary text-lg mb-8 tracking-wide">
          Map your signature voice or choose a high-end neural preset.
        </p>

        <div className="bg-surface/50 border border-white/10 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
          <div className="text-[10px] text-primary/60 uppercase font-black tracking-widest mb-4">
            Custom Voice Print (Read Aloud)
          </div>
          <p className="text-xl font-bold italic text-white/90">
            "Forge, initialize system diagnostics and sync my vocal profile."
          </p>

          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 h-1 bg-primary"
                style={{ width: `${progress}%` }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleRecord}
            disabled={isRecording}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 transition-all relative
              ${
                recorded
                  ? "bg-success/20 text-success border-2 border-success/50 click-scale"
                  : isRecording
                    ? "bg-primary/20 text-primary border-2 border-primary border-dashed animate-pulse"
                    : "bg-surface hover:bg-white/5 text-text-primary border border-white/10 shadow-xl click-scale"
              }`}
          >
            {recorded ? (
              <CheckCircle2 className="w-10 h-10 mb-1" />
            ) : isRecording ? (
              <Waves className="w-10 h-10 mb-1 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10 mb-1" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">
              {recorded
                ? "Mapped (Tap to Reset)"
                : isRecording
                  ? "Processing"
                  : "Hold to Record"}
            </span>
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <div className="text-xs font-bold text-text-dim uppercase tracking-widest">
              Or Select Preset
            </div>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="space-y-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  activePreset === p.id
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(245,166,35,0.15)]"
                    : "bg-surface border-white/5 hover:border-white/10"
                }`}
              >
                <div>
                  <div
                    className={`font-bold text-sm ${activePreset === p.id ? "text-primary" : "text-text-primary"}`}
                  >
                    {p.name}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {p.desc}
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${activePreset === p.id ? "bg-primary/20 text-primary" : "bg-black/30 text-text-dim"}`}
                >
                  {activePreset === p.id ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

        <div className="mb-4 mt-auto sticky bottom-0 bg-[#050505] pt-4 z-20 shadow-[0_-20px_20px_-10px_#050505]">
          <button
            onClick={onNext}
            className="w-full bg-primary disabled:bg-surface disabled:text-text-dim py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.2)] disabled:shadow-none"
          >
            {recorded || activePreset ? "Continue" : "Skip Vocal Core"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
    </motion.div>
  );
};

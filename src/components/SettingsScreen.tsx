import React, { useState } from "react";
import { ArrowLeft, Key, Bot, ShieldAlert, EyeOff, Eye } from "lucide-react";
import { motion } from "framer-motion";

export const SettingsScreen = ({
  apiKey,
  meliApiKey,
  onSave,
  onBack,
}: {
  apiKey: string;
  meliApiKey: string;
  onSave: (apiKey: string, meliApiKey: string) => void;
  onBack: () => void;
}) => {
  const [geminiKey, setGeminiKey] = useState(apiKey);
  const [meliKey, setMeliKey] = useState(meliApiKey);
  const [showGemini, setShowGemini] = useState(false);
  const [showMeli, setShowMeli] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (geminiKey.trim()) {
      if (!geminiKey.startsWith("AIza") || geminiKey.length < 39) {
        setError("Invalid Gemini API Key format. It should start with 'AIza' and be 39 characters.");
        return;
      }
    }
    setError(null);
    onSave(geminiKey, meliKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20 overflow-y-auto"
    >
      <div className="flex items-center gap-3 px-6 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <Key className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">
            Configuration
          </h2>
        </div>
      </div>

      <div className="px-6 space-y-8 max-w-2xl mx-auto w-full pb-20">
        {/* Gemini API Key */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-surface w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 shadow-lg">
              <Key className="text-primary w-5 h-5 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Gemini API Key</h3>
              <p className="text-xs text-text-secondary">Powering Forge with your own key.</p>
            </div>
          </div>
          <div className="p-4 bg-surface/50 border border-border/50 rounded-xl shadow-inner">
            <p className="text-sm leading-relaxed text-text-secondary mb-3">
              Obtain a key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Google AI Studio
              </a>
              . Leave blank to use system key.
            </p>
            <div className="relative group">
              <input
                type={showGemini ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => {
                  setError(null);
                  setGeminiKey(e.target.value);
                }}
                placeholder="Gemini API Key (optional)"
                className={`w-full bg-surface/50 border ${error ? 'border-red-500' : 'border-border/50'} rounded-xl py-4 pl-4 pr-12 text-sm text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all`}
              />
              <button
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-red-500 mt-2 text-xs flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Meli API Key */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-surface w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 shadow-lg">
              <Bot className="text-primary w-5 h-5 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Meli API Token</h3>
              <p className="text-xs text-text-secondary">Chief of Staff AI agent orchestration.</p>
            </div>
          </div>
          <div className="p-4 bg-surface/50 border border-border/50 rounded-xl shadow-inner">
            <p className="text-sm leading-relaxed text-text-secondary mb-3">
              Meli: a thoughtful AI, chief of staff. Connect to the MeliNet network to orchestrate multiple AI agents and keep your context synced. Obtain token from{" "}
              <a
                href="https://meli.im/developers"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Meli Developers
              </a>
              .
            </p>
            <div className="relative group">
              <input
                type={showMeli ? "text" : "password"}
                value={meliKey}
                onChange={(e) => setMeliKey(e.target.value)}
                placeholder="Meli API Token (Bearer ...)"
                className="w-full bg-surface/50 border border-border/50 rounded-xl py-4 pl-4 pr-12 text-sm text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
              />
              <button
                onClick={() => setShowMeli(!showMeli)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
              >
                {showMeli ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary py-4 rounded-xl text-black font-extrabold text-[13px] uppercase tracking-widest hover:bg-primary/90 transition-all border border-transparent shadow-[0_0_20px_rgba(245,166,35,0.2)]"
        >
          Save Configuration
        </button>
      </div>
    </motion.div>
  );
};

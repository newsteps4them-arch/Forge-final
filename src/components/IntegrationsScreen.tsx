import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Link as LinkIcon,
  Database,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  HardHat,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { toast } from "../lib/notifications";

const INTERGRATIONS = [
  {
    id: "alldata",
    name: "ALLDATA",
    type: "Repair Info",
    desc: "OEM repair information and schematics",
    icon: BookOpen,
    dev: "ALLDATA LLC",
  },
  {
    id: "mitchell1",
    name: "Mitchell 1 (ProDemand)",
    type: "Service Manuals",
    desc: "Wiring diagrams and service procedures",
    icon: HardHat,
    dev: "Mitchell Repair Info",
  },
  {
    id: "identifix",
    name: "Identifix (Direct-Hit)",
    type: "Diagnostics",
    desc: "Confirmed fixes and diagnostic hotline data",
    icon: CheckCircle2,
    dev: "Identifix",
  },
  {
    id: "snapon",
    name: "Snap-on Connect",
    type: "Professional",
    desc: "Secure diagnostics sync & cloud backup",
    icon: Zap,
    dev: "Snap-on Inc.",
  },
  {
    id: "forscan",
    name: "FORScan",
    type: "OEM Ford/Mazda",
    desc: "Advanced module configuration logs",
    icon: Database,
    dev: "FORScan Team",
  },
  {
    id: "torque",
    name: "Torque Pro",
    type: "Telemetry",
    desc: "Export logs to CSV or sync via local web server for telemetry ingestion.",
    icon: Activity,
    dev: "Ian Hawkins",
  },
  {
    id: "alfaobd",
    name: "AlfaOBD",
    type: "FCA Group",
    desc: "Body computer & proxy alignment logs",
    icon: Database,
    dev: "AlfaOBD Apps",
  },
  {
    id: "repair2",
    name: "RepairSolutions2",
    type: "Consumer Data",
    desc: "Share diagnostic data or use our BLE scanner support.",
    icon: LinkIcon,
    dev: "Innova Electronics",
  },
  {
    id: "nexpart",
    name: "Nexpart B2B",
    type: "Parts Ordering",
    desc: "Wholesale parts catalog and ordering",
    icon: LinkIcon,
    dev: "WHI Solutions",
  },
  {
    id: "nhtsa",
    name: "NHTSA Recalls",
    type: "Gov Database",
    desc: "Federal safety recalls and complaints",
    icon: AlertCircle,
    dev: "NHTSA",
  },
  {
    id: "carfax",
    name: "CARFAX",
    type: "Vehicle History",
    desc: "Service records and VIN decoding",
    icon: LinkIcon,
    dev: "CARFAX Inc.",
  },
];

export const IntegrationsScreen = ({
  onBack,
  connectedIds,
  onToggleConnection,
}: {
  onBack: () => void;
  connectedIds: string[];
  onToggleConnection: (id: string, isConnecting: boolean) => void;
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = (id: string, name: string) => {
    setSyncingId(id);
    toast.show(`Initiating autonomous sync with ${name}...`, "info");
    setTimeout(() => {
      setSyncingId(null);
      toast.show(
        `Sync complete. Data from ${name} integrated into Neural_Sync.`,
        "success",
      );
    }, 2500);
  };

  const handleToggle = (id: string, name: string, isConnected: boolean) => {
    if (!isConnected) {
      toast.show(`Authorizing API connection to ${name}...`, "info");
      setTimeout(() => {
        onToggleConnection(id, true);
        toast.show(`Successfully linked ${name} account.`, "success");
      }, 1500);
    } else {
      onToggleConnection(id, false);
      toast.show(`Unlinked ${name}.`, "info");
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
          <Database className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">
            3rd Party APIs
          </h2>
        </div>
      </div>

      <div className="px-6 space-y-6 overflow-y-auto no-scrollbar flex-1 pb-10 mt-2">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 mb-2">
          <h3 className="text-[12px] font-black uppercase text-primary tracking-widest mb-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Autonomous Data Syncing
          </h3>
          <p className="text-[10px] text-white/60 font-mono leading-relaxed uppercase tracking-wider">
            Connect external proprietary software to automatically ingest logs,
            telemetry, and repair databases into the Forge Neural engine.
          </p>
        </div>

        <div className="space-y-4">
          {INTERGRATIONS.map((int) => {
            const isConnected = connectedIds.includes(int.id);
            const isSyncing = syncingId === int.id;

            return (
              <div
                key={int.id}
                className={`p-4 rounded-[2rem] border transition-all ${isConnected ? "bg-primary/5 border-primary/30" : "bg-card/40 border-white/5"} overflow-hidden relative`}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isConnected ? "bg-primary text-black" : "bg-white/5 text-primary/40"}`}
                    >
                      <int.icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-[15px] font-bold text-white tracking-tight">
                        {int.name}
                      </h4>
                      <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest leading-none mt-1">
                        {int.type}
                      </span>
                      <span className="text-[10px] text-text-dim mt-1.5 font-mono opacity-80">
                        {int.desc}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 relative z-10">
                  <button
                    onClick={() => handleToggle(int.id, int.name, isConnected)}
                    className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                      isConnected
                        ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-black"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    {isConnected ? "Unlink Service" : "Authorize Link"}
                  </button>

                  <AnimatePresence>
                    {isConnected && (
                      <motion.button
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        onClick={() => handleSync(int.id, int.name)}
                        disabled={isSyncing}
                        className="px-5 py-3 bg-primary text-black rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 flex-shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                        />
                        {isSyncing ? "Syncing" : "Pull"}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {isConnected && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22C55E]" />
                    <span className="text-[8px] text-green-500 font-black uppercase tracking-widest">
                      Active
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center opacity-30 text-center gap-2">
          <AlertCircle className="w-6 h-6 text-text-dim" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-dim">
            Some integrations require API keys stored in user settings. Data is
            processed locally within the device context before cloud sync.
          </span>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Terminal, Send, Save, Download } from "lucide-react";
import { toast } from "../lib/notifications";

export const TerminalScreen = ({
  onBack,
  onCommand,
  logs = [],
}: {
  onBack: () => void;
  onCommand: (cmd: string) => void;
  logs?: string[];
}) => {
  const [input, setInput] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSend = () => {
    if (!input.trim()) return;
    onCommand(input.trim());
    setInput("");
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.show("No logs to export", "info");
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Type,Data\n"
      + logs.map(e => {
        const type = e.includes("TX:") ? "TX" : "RX";
        // Attempt to extract timestamp if present
        const match = e.match(/\[(.*?)\]/);
        const tstamp = match ? match[1] : new Date().toLocaleTimeString();
        const raw = e.replace(/\[.*?\]\s*(TX|RX):\s*/, "").replace(/"/g, '""');
        return `"${tstamp}","${type}","${raw}"`;
      }).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TorquePro_Log_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.show("Logs exported as CSV for Torque Pro", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#000000] scanlines-pattern flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center gap-3 px-6 mb-4 relative z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-[#00ff41] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-[#00ff41] crt-text">
          <Terminal className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest text-[#00ff41]">
            Terminal
          </h2>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExport}
            className="p-2 border border-[#00ff41]/30 rounded-md text-[#00ff41]/70 hover:bg-[#00ff41]/10 transition-colors"
            title="Export CSV for Torque Pro"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast.show("Scripts not implemented", "info")}
            className="p-2 border border-[#00ff41]/30 rounded-md text-[#00ff41]/70 hover:bg-[#00ff41]/10 transition-colors"
            title="Save Command Script"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 font-mono text-sm mb-4 space-y-1 no-scrollbar crt-text relative z-10">
        <div className="text-[#00ff41]/50 mb-6 border-b border-[#00ff41]/20 pb-4">
          FORGE OS SECURE TERMINAL<br/>
          CONNECTION ESTABLISHED: OBD-II / CAN<br/>
          PROTOCOL: ISO 15765-4 (CAN 11/500)<br/>
          SYSTEM v4.5 ONLINE
        </div>
        {logs.map((log, i) => {
          const isUser = log.startsWith(">");
          const isError = log.toLowerCase().includes("error");
          return (
            <div
              key={i}
              className={`flex items-start gap-3 ${isUser ? "text-[#00ff41]" : isError ? "text-error" : "text-[#00ff41]/80"}`}
              style={{ wordBreak: "break-all" }}
            >
              <span className="opacity-50 select-none flex-shrink-0">
                {isUser ? "TX" : "RX"}
              </span>
              <span className="opacity-30">|</span>
              <span>{log.replace(/^> /, "")}</span>
            </div>
          );
        })}
        <div className="flex items-start gap-3 text-[#00ff41] animate-pulse">
           <span className="opacity-50 select-none flex-shrink-0">TX</span>
           <span className="opacity-30">|</span>
           <span className="w-2 h-4 bg-[#00ff41] inline-block" />
        </div>
        <div ref={logEndRef} />
      </div>

      <div className="px-6 relative z-10">
        <div className="relative group">
            <div className="absolute inset-0 bg-[#00ff41]/5 blur-md rounded-none pointer-events-none transition-opacity opacity-0 group-focus-within:opacity-100" />
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="ENTER HEX COMMAND_ (e.g. 01 0C)"
            className="w-full bg-black/80 border-2 border-[#00ff41]/20 p-4 text-[#00ff41] font-mono text-sm uppercase outline-none focus:border-[#00ff41] transition-colors pr-14 placeholder:text-[#00ff41]/30 placeholder:normal-case rounded-none crt-text"
            />
            <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-colors rounded-none outline-none focus:bg-[#00ff41] focus:text-black"
            >
            <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Terminal, Send, Save, Download, Tv, ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import { toast } from "../../lib/notifications";

// Helper to parse each flat log line into metadata
const parseLogLine = (log: string, index: number = 0) => {
  const isTxVal = log.includes("TX:") || log.startsWith(">") || log.includes("[sys] TX:");
  const isErrorVal = log.toLowerCase().includes("error") || log.toLowerCase().includes("failed");
  
  let content = log;
  let timestamp = "";
  const tsMatch = log.match(/^\[(.*?)\]/);
  if (tsMatch) {
    timestamp = tsMatch[1];
    content = content.replace(/^\[.*?\]\s*/, "");
  }
  
  content = content.replace(/^(TX:|RX:|>\s*|\[sys\]\s*TX:|\[sys\]\s*RX:)\s*/i, "");
  
  return {
    id: `log-${index}-${timestamp}-${content}`,
    raw: log,
    isTx: isTxVal,
    isError: isErrorVal,
    timestamp,
    content,
  };
};

interface CommandTransaction {
  id: string;
  tx: ReturnType<typeof parseLogLine> | null;
  responses: ReturnType<typeof parseLogLine>[];
}

// Custom grouping algorithm that packs flat oldest-to-newest logs into transaction sets
const parseTransactions = (flatLogs: string[]): CommandTransaction[] => {
  // Since flatLogs are stored newest-first in useObdTelemetry (setLogs([newVal, ...prev])),
  // we copy and reverse them to process chronologically
  const chronological = [...flatLogs].reverse();
  const transactions: CommandTransaction[] = [];
  
  let currentTx: CommandTransaction | null = null;
  
  chronological.forEach((log, index) => {
    const parsed = parseLogLine(log, index);
    
    if (parsed.isTx) {
      if (currentTx) {
        transactions.push(currentTx);
      }
      currentTx = {
        id: `tx-${index}-${parsed.timestamp}-${parsed.content}`,
        tx: parsed,
        responses: [],
      };
    } else {
      if (currentTx) {
        currentTx.responses.push(parsed);
      } else {
        currentTx = {
          id: `orphan-${index}-${parsed.timestamp}`,
          tx: null,
          responses: [parsed],
        };
      }
    }
  });
  
  if (currentTx) {
    transactions.push(currentTx);
  }
  
  return transactions;
};

// ResponseLineItem handles individual line truncation and folding to prevent layout disruption with huge outputs
const ResponseLineItem = ({ resp }: { resp: ReturnType<typeof parseLogLine> }) => {
  const [expanded, setExpanded] = useState(false);
  const isTooLong = resp.content.length > 80;
  
  const displayedContent = isTooLong && !expanded 
    ? `${resp.content.substring(0, 80)}...` 
    : resp.content;

  return (
    <div className={`flex items-start gap-3 text-sm py-0.5 ${resp.isError ? "text-red-500" : "text-[#00ff41]/80"}`}>
      <span className="text-[10px] text-[#00ff41]/40 select-none flex-shrink-0 mt-0.5 font-bold uppercase w-6 text-center">
        RX
      </span>
      <span className="text-[#00ff41]/20 select-none">|</span>
      {resp.timestamp && (
        <span className="text-[#00ff41]/30 text-xs font-mono mt-0.5 select-none">
          [{resp.timestamp}]
        </span>
      )}
      <div className="flex-1 font-mono break-all text-xs md:text-sm">
        <span>{displayedContent}</span>
        {isTooLong && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="ml-2 px-1.5 py-0.5 rounded bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41]/20 text-[10px] select-none align-middle font-sans transition-colors border border-[#00ff41]/20 outline-none"
          >
            {expanded ? "Fold" : `Expand (${resp.content.length} chars)`}
          </button>
        )}
      </div>
    </div>
  );
};

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
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [collapsedTxIds, setCollapsedTxIds] = useState<Record<string, boolean>>({});
  const logEndRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  // Parse transactions for rendering folding nodes
  const transactions = parseTransactions(logs);

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
        const match = e.match(/\[(.*?)\]/);
        const tstamp = match ? match[1] : new Date().toLocaleTimeString();
        const raw = e.replace(/\[.*?\]\s*(TX|RX):\s*/, "").replace(/"/g, '""');
        return `"${tstamp}","${type}","${raw}"`;
      }).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    if (linkRef.current) {
      const link = linkRef.current;
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `TorquePro_Log_${new Date().getTime()}.csv`);
      link.click();
      toast.show("Logs exported as CSV for Torque Pro", "success");
    }
  };

  // Toggles collapsing for *all* transactions that contain outputs
  const handleToggleAllFolds = () => {
    const hasAnyCollapsed = transactions.some(t => t.responses.length > 0 && collapsedTxIds[t.id]);
    
    if (hasAnyCollapsed) {
      // If any is collapsed, unfold all
      setCollapsedTxIds({});
    } else {
      // Otherwise, fold all that have response outputs
      const nextCollapsed: Record<string, boolean> = {};
      transactions.forEach(t => {
        if (t.responses.length > 0) {
          nextCollapsed[t.id] = true;
        }
      });
      setCollapsedTxIds(nextCollapsed);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`absolute inset-0 bg-[#000000] ${crtEnabled ? "scanlines-pattern" : ""} flex flex-col pt-8 pb-32 z-20`}
    >
      <div className="flex items-center gap-3 px-6 mb-4 relative z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-[#00ff41] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`flex items-center gap-2 text-[#00ff41] ${crtEnabled ? "crt-text" : ""}`}>
          <Terminal className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest text-[#00ff41]">
            Terminal
          </h2>
        </div>
        <div className="ml-auto flex gap-2">
          {/* Collapse/Expand All Outputs */}
          <button
            onClick={handleToggleAllFolds}
            disabled={transactions.length === 0}
            className="p-2 border border-[#00ff41]/30 rounded-md text-[#00ff41]/70 hover:bg-[#00ff41]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Toggle All Log Folding"
          >
            <ChevronsUpDown className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCrtEnabled(prev => !prev)}
            className={`p-2 border border-[#00ff41]/30 rounded-md transition-colors ${crtEnabled ? "bg-[#00ff41]/20 text-[#00ff41]" : "text-[#00ff41]/70 hover:bg-[#00ff41]/10"}`}
            title="Toggle CRT Scanlines"
          >
            <Tv className="w-4 h-4" />
          </button>
          
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

      <div className={`flex-1 overflow-y-auto px-6 font-mono text-sm mb-4 space-y-3 no-scrollbar ${crtEnabled ? "crt-text" : ""} relative z-10`}>
        <div className="text-[#00ff41]/50 mb-4 border-b border-[#00ff41]/20 pb-4">
          FORGE OS SECURE TERMINAL<br/>
          CONNECTION ESTABLISHED: OBD-II / CAN<br/>
          PROTOCOL: ISO 15765-4 (CAN 11/500)<br/>
          SYSTEM v4.5 ONLINE
        </div>
        
        {/* Render transactions as folded/unfolded groups */}
        {transactions.map((t) => {
          const isCollapsed = !!collapsedTxIds[t.id];
          const hasResponses = t.responses.length > 0;
          
          if (!t.tx) {
            // Orphan start-up system initialization logs
            return (
              <div key={t.id} className="border border-[#00ff41]/20 bg-[#00ff41]/5 p-3 rounded-none relative">
                <div className="flex items-center gap-2 mb-2 text-xs text-[#00ff41]/50 select-none font-bold uppercase transition-opacity">
                  <Terminal className="w-3.5 h-3.5 text-[#00ff41]/40" />
                  <span>System Diagnostics Stream</span>
                  {hasResponses && (
                    <button 
                      onClick={() => setCollapsedTxIds(prev => ({ ...prev, [t.id]: !isCollapsed }))} 
                      className="ml-auto bg-[#00ff41]/10 border border-[#00ff41]/20 px-2 py-0.5 text-[#00ff41] hover:bg-[#00ff41]/20 rounded-sm text-[10px]"
                    >
                      {isCollapsed ? "[+] Unfold Info" : "[-] Fold Info"}
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {t.responses.map((resp) => (
                      <div key={resp.id} className="flex items-start gap-3 text-[#00ff41]/70 font-mono text-xs">
                        <span className="opacity-50 select-none flex-shrink-0">RX</span>
                        <span className="opacity-30">|</span>
                        <span className="break-all">{resp.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Transmit-Receive command block with interactive fold
          return (
            <div key={t.id} className="border border-[#00ff41]/20 bg-black/40 rounded-none overflow-hidden hover:bg-black/60 transition-colors">
              {/* Header Command line representing the transmitter TX trigger */}
              <div 
                onClick={() => hasResponses && setCollapsedTxIds(prev => ({ ...prev, [t.id]: !isCollapsed }))}
                className={`flex items-center gap-3 px-3 py-2.5 select-none user-none ${hasResponses ? "cursor-pointer hover:bg-[#00ff41]/5" : "pointer-events-none"}`}
              >
                {/* Expand / Collapse Icon */}
                {hasResponses ? (
                  <span className="text-[#00ff41] flex-shrink-0">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-[#00ff41]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#00ff41]" />
                    )}
                  </span>
                ) : (
                  <span className="w-4 h-4 flex-shrink-0" />
                )}
                
                {/* Green TX Indicator Badge */}
                <span className="bg-[#00ff41]/10 text-[#00ff41] text-[10px] font-black px-1.5 py-0.5 rounded border border-[#00ff41]/20 flex-shrink-0 select-none">
                  TX
                </span>
                
                {/* Timestamp tag */}
                {t.tx.timestamp && (
                  <span className="text-[#00ff41]/40 text-xs font-mono select-none">
                    [{t.tx.timestamp}]
                  </span>
                )}
                
                {/* Command text content */}
                <span className="text-[#00ff41] font-bold font-mono text-sm break-all">
                  {t.tx.content}
                </span>

                {/* Badge telling you how many lines or bytes are folded */}
                {hasResponses && isCollapsed && (
                  <span className="ml-auto bg-[#00ff41]/15 text-[#00ff41]/70 border border-[#00ff41]/20 text-[10px] px-2 py-0.5 rounded font-mono select-none">
                    {t.responses.length} output line{t.responses.length > 1 ? "s" : ""} folded
                  </span>
                )}
              </div>

              {/* Foldable Content containing individual RX packages with line folding */}
              {!isCollapsed && hasResponses && (
                <div className="border-t border-[#00ff41]/15 bg-[#00ff41]/2 pl-8 pr-3 py-2 space-y-1.5 relative">
                  {/* Visual vertical connector rail */}
                  <div className="absolute left-[21px] top-0 bottom-4 w-[1px] bg-[#00ff41]/15 pointer-events-none" />

                  {t.responses.map((resp) => (
                    <ResponseLineItem key={resp.id} resp={resp} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Flashing cursor sequence line */}
        <div className="flex items-start gap-3 text-[#00ff41] animate-pulse py-1">
           <span className="opacity-50 select-none flex-shrink-0">TX</span>
           <span className="opacity-30">|</span>
           <span className="w-2 h-4 bg-[#00ff41] inline-block" />
        </div>
        <div ref={logEndRef} />
      </div>

      {/* Preset Macro Buttons */}
      <div className="px-6 mb-3 flex flex-wrap gap-2 relative z-10 select-none">
        {[
          { label: "Adapter Info", cmd: "ATI" },
          { label: "Voltage", cmd: "ATRV" },
          { label: "Engine RPM", cmd: "01 0C" },
          { label: "Speed", cmd: "01 0D" },
          { label: "Scan DTCs", cmd: "03" },
          { label: "Clear DTCs", cmd: "04" },
        ].map((m) => (
          <button
            key={m.cmd}
            onClick={() => onCommand(m.cmd)}
            className="px-3 py-1.5 border border-[#00ff41]/20 bg-[#00ff41]/5 hover:bg-[#00ff41]/20 text-[#00ff41]/80 hover:text-[#00ff41] text-[10px] font-mono uppercase transition-colors"
          >
            {m.label} ({m.cmd})
          </button>
        ))}
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
            className={`w-full bg-black/80 border-2 border-[#00ff41]/20 p-4 text-[#00ff41] font-mono text-sm uppercase outline-none focus:border-[#00ff41] transition-colors pr-14 placeholder:text-[#00ff41]/30 placeholder:normal-case rounded-none ${crtEnabled ? "crt-text" : ""}`}
            />
            <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-colors rounded-none outline-none focus:bg-[#00ff41] focus:text-black"
            >
            <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
      <a ref={linkRef} className="hidden" style={{ display: "none" }} />
    </motion.div>
  );
};

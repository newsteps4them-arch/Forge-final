import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Calculator,
  FileText,
  Send,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "../../lib/notifications";

export const EstimatorScreen = ({
  onBack,
  vehicle,
}: {
  onBack: () => void;
  vehicle: string;
}) => {
  const [items, setItems] = useState([
    {
      id: 1,
      type: "Labor",
      desc: "Engine Diagnostic / Scan",
      qty: 1,
      rate: 145.0,
    },
    {
      id: 2,
      type: "Parts",
      desc: "OEM Ignition Coil (P/N 12345)",
      qty: 1,
      rate: 89.99,
    },
    {
      id: 3,
      type: "Labor",
      desc: "Ignition Coil Replacement",
      qty: 0.5,
      rate: 145.0,
    },
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  const laborTotal = items
    .filter((i) => i.type === "Labor")
    .reduce((acc, curr) => acc + curr.qty * curr.rate, 0);
  const partsTotal = items
    .filter((i) => i.type === "Parts")
    .reduce((acc, curr) => acc + curr.qty * curr.rate, 0);
  const total = laborTotal + partsTotal;

  const handleSend = () => {
    toast.show(
      "Estimate PDF generated and sent to customer via SMS.",
      "success",
      4000,
    );
  };

  const handlePartsQuery = () => {
    setIsQuerying(true);
    toast.show("Querying Nexpart B2B Catalog for accurate pricing...", "info");
    setTimeout(() => {
      setIsQuerying(false);
      setItems([
        ...items,
        {
          id: Date.now(),
          type: "Parts",
          desc: "NGK Spark Plug Set (Auto-Quoted)",
          qty: 4,
          rate: 12.5,
        },
      ]);
      toast.show("Added suggested parts from catalog.", "success");
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
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
            <Calculator className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">
              Estimator
            </h2>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="px-6 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">
              Target Vehicle
            </div>
            <div className="text-sm font-bold text-white">{vehicle}</div>
          </div>
          <button
            onClick={handlePartsQuery}
            disabled={isQuerying}
            className="text-[9px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            {isQuerying ? "Querying..." : "Parts DB"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar pb-10">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 relative group hover:border-primary/30 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-center">
                <span
                  className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${item.type === "Labor" ? "bg-blue-500/20 text-blue-500" : "bg-emerald-500/20 text-emerald-500"}`}
                >
                  {item.type}
                </span>
              </div>
              <span className="text-sm font-black text-white">
                ${(item.qty * item.rate).toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-white/80 font-medium">{item.desc}</p>
            <div className="text-[10px] text-white/40 font-mono">
              {item.qty} {item.type === "Labor" ? "hrs" : "qty"} @ $
              {item.rate.toFixed(2)}
            </div>

            <button
              onClick={() =>
                toast.show("Edit not supported in preview", "info")
              }
              className="absolute bottom-4 right-4 text-white/20 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="px-6 pt-4 pb-6 bg-[#050505] hardware-pattern border-t border-white/10 mt-auto">
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-xs text-white/60">
            <span>Labor</span>
            <span className="font-mono">${laborTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>Parts</span>
            <span className="font-mono">${partsTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-white mt-2 pt-2 border-t border-white/10">
            <span className="uppercase tracking-widest">Total Est.</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-[0.3] bg-white/5 border border-white/10 text-white rounded-xl py-3 flex items-center justify-center hover:bg-white/10 transition-colors">
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            className="flex-1 bg-primary text-black rounded-xl py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-primary/90 shadow-[0_4px_15px_rgba(245,166,35,0.3)]"
          >
            <Send className="w-4 h-4" /> Send to Client
          </button>
        </div>
      </div>
    </motion.div>
  );
};

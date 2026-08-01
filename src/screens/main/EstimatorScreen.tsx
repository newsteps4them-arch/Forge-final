import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Calculator,
  FileText,
  Send,
  Plus,
  Trash2,
  Search,
  X,
  PlusCircle,
} from "lucide-react";
import { toast } from "../../lib/notifications";

interface EstimateItem {
  id: number;
  type: "Labor" | "Parts";
  desc: string;
  qty: number;
  rate: number;
}

export const EstimatorScreen = ({
  onBack,
  vehicle,
}: {
  onBack: () => void;
  vehicle: string;
}) => {
  const [items, setItems] = useState<EstimateItem[]>([
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
  const [showAddModal, setShowAddModal] = useState(false);

  // New Item states
  const [newItemType, setNewItemType] = useState<"Labor" | "Parts">("Labor");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemRate, setNewItemRate] = useState("");

  const updateItemField = (id: number, field: "qty" | "rate", value: number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
    toast.show("Line item removed", "info");
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;
    const qtyNum = parseFloat(newItemQty) || 1;
    const rateNum = parseFloat(newItemRate) || 0;

    const newItem: EstimateItem = {
      id: Date.now(),
      type: newItemType,
      desc: newItemDesc.trim(),
      qty: qtyNum,
      rate: rateNum,
    };

    setItems([...items, newItem]);
    setShowAddModal(false);

    // Reset Form
    setNewItemDesc("");
    setNewItemQty("");
    setNewItemRate("");
    toast.show("Line item added to estimate", "success");
  };

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
      {/* Header */}
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Target Asset Summary Banner */}
      <div className="px-6 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1 font-mono">
              Target Vehicle
            </div>
            <div className="text-sm font-bold text-white">{vehicle || "Generic Vehicle"}</div>
          </div>
          <button
            onClick={handlePartsQuery}
            disabled={isQuerying}
            className="text-[9px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1 font-mono"
          >
            <Search className="w-3 h-3" />
            {isQuerying ? "Querying..." : "Parts DB"}
          </button>
        </div>
      </div>

      {/* Dynamic Item Cards List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar pb-10">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-[#111] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative group hover:border-primary/20 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                  <span
                    className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${item.type === "Labor" ? "bg-blue-500/20 text-blue-500" : "bg-emerald-500/20 text-emerald-500"}`}
                  >
                    {item.type}
                  </span>
                </div>
                <span className="text-sm font-black text-white font-mono">
                  ${(item.qty * item.rate).toFixed(2)}
                </span>
              </div>
              
              <p className="text-sm text-white/80 font-medium tracking-wide">{item.desc}</p>
              
              {/* Interactive Qty and Rate Inputs */}
              <div className="flex items-center gap-3 text-xs text-white/40 font-mono mt-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 w-fit">
                <div className="flex items-center gap-1">
                  <span className="uppercase text-[8px] text-white/30">Qty:</span>
                  <input
                    type="number"
                    step="any"
                    value={item.qty === 0 ? "" : item.qty}
                    onChange={(e) => updateItemField(item.id, "qty", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-10 bg-transparent text-white font-bold text-center outline-none border-b border-white/10 focus:border-primary font-mono"
                  />
                </div>
                <span className="text-white/15 font-sans">|</span>
                <div className="flex items-center gap-1">
                  <span className="uppercase text-[8px] text-white/30">Rate:</span>
                  <span className="text-white/20">$</span>
                  <input
                    type="number"
                    step="any"
                    value={item.rate === 0 ? "" : item.rate}
                    onChange={(e) => updateItemField(item.id, "rate", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-16 bg-transparent text-white font-bold text-center outline-none border-b border-white/10 focus:border-primary font-mono"
                  />
                </div>
              </div>

              <button
                onClick={() => deleteItem(item.id)}
                className="absolute bottom-4 right-4 text-white/25 hover:text-red-500 transition-colors"
                title="Remove Line Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Totals & Dispatch Panel */}
      <div className="px-6 pt-4 pb-6 bg-[#050505] hardware-pattern border-t border-white/10 mt-auto">
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs text-white/60 font-mono">
            <span>Labor Charges</span>
            <span className="font-bold">${laborTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-white/60 font-mono">
            <span>Parts Materials</span>
            <span className="font-bold">${partsTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-white mt-2 pt-2 border-t border-white/10 font-mono">
            <span className="uppercase tracking-widest font-sans text-xs">Total Estimate</span>
            <span className="text-primary text-base">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => toast.show("Export formats: PDF, CSV, print formats loaded.", "info")}
            className="flex-[0.3] bg-white/5 border border-white/10 text-white rounded-xl py-3 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
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

      {/* Add Line Item Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0E0E0E] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Add Line Item
            </h3>
            <p className="text-xs text-white/45 mb-6 font-mono">
              Add labor tasks or physical parts to compile customer estimates.
            </p>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              {/* Type Select */}
              <div className="relative">
                <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                  Item Category
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemType("Labor")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      newItemType === "Labor"
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                        : "bg-white/5 border-white/10 text-white/55"
                    }`}
                  >
                    Labor Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType("Parts")}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      newItemType === "Parts"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-white/5 border-white/10 text-white/55"
                    }`}
                  >
                    Parts / Gear
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="relative">
                <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="e.g. Brake Rotor Replacement, 5W30 Synthetic Oil"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Qty & Rate Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                    Quantity / Hours
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="e.g. 1.5, 4"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>
                <div className="relative">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                    Rate ($) / Unit Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(e.target.value)}
                    placeholder="e.g. 145.00, 19.99"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!newItemDesc.trim() || !newItemQty || !newItemRate}
                className="w-full mt-4 bg-primary disabled:bg-white/5 disabled:text-white/20 py-4 rounded-xl text-black font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/95 disabled:hover:bg-white/5 transition-all shadow-[0_0_20px_rgba(245,166,35,0.15)] disabled:shadow-none"
              >
                Insert Line Item
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingCart, Search, Package, Plus, ExternalLink } from "lucide-react";

export const PartsCatalogScreen = ({ onBack, vehicleMake }: { onBack: () => void, vehicleMake: string }) => {
  const [search, setSearch] = useState("");
  const [parts] = useState([
    { id: 1, name: "Ignition Coil Pack", pnr: "GN10328", supplier: "Worldpac", stock: 12, cost: 45.99, retail: 89.99 },
    { id: 2, name: "Iridium Spark Plug", pnr: "SILZKR7B11", supplier: "AutoZone Pro", stock: 144, cost: 7.25, retail: 16.50 },
    { id: 3, name: "MAF Sensor VDO", pnr: "5WK97508Z", supplier: "Worldpac", stock: 2, cost: 125.00, retail: 240.00 },
    { id: 4, name: "O2 Sensor Upstream", pnr: "234-9123", supplier: "NAPA Commercial", stock: 5, cost: 89.50, retail: 165.00 }
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center justify-between px-6 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-emerald-500">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">B2B Parts Catalog</h2>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-lg border border-emerald-500/30">
          <Package className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">View Cart (0)</span>
        </button>
      </div>

      <div className="px-6 mb-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search equivalent parts for ${vehicleMake || "target vehicle"}...`}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-text"
          />
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-10">
        {parts.map((p) => (
          <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col hover:border-emerald-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {p.name}
                </h3>
                <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">PN: {p.pnr}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-white">${p.retail.toFixed(2)}</span>
                <div className="flex items-center justify-end gap-1 text-[10px] text-white/40 font-mono">
                  <span>Cost: ${p.cost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-4">
               <div className="flex items-center gap-2">
                 <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${
                    p.stock > 10 ? "bg-emerald-500/20 text-emerald-500" :
                    p.stock > 0 ? "bg-orange-500/20 text-orange-500" :
                    "bg-red-500/20 text-red-500"
                 }`}>
                   {p.stock > 0 ? `${p.stock} IN STOCK` : "OUT OF STOCK"}
                 </span>
                 <span className="text-xs text-white/50 flex items-center gap-1">
                   {p.supplier} <ExternalLink className="w-3 h-3" />
                 </span>
               </div>
               <button className="bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-500 text-white p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30">
                 <Plus className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

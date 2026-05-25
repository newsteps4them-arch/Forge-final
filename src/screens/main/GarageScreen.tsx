import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Car, Plus, Search, User, MapPin } from "lucide-react";

export const GarageScreen = ({ onBack, onSelectVehicle }: { onBack: () => void, onSelectVehicle: (v: any) => void }) => {
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState([
    { id: 1, make: "Ford", model: "F-150", year: "2018", vin: "1FTFW1RG4KFGxxxxx", client: "John Doe", lastVisit: "2023-10-12" },
    { id: 2, make: "Chevrolet", model: "Silverado", year: "2020", vin: "1GCVKPEH5LZxxxxx", client: "Acme Corp", lastVisit: "2023-11-01" },
    { id: 3, make: "BMW", model: "330i", year: "2019", vin: "WBA5R1C51K8xxxxxx", client: "Jane Smith", lastVisit: "2024-01-15" }
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
          <div className="flex items-center gap-2 text-primary">
            <Car className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">Garage Manager</h2>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by VIN, Client, or Make..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-10">
        {vehicles.filter(v => 
          v.make.toLowerCase().includes(search.toLowerCase()) || 
          v.client.toLowerCase().includes(search.toLowerCase()) ||
          v.vin.toLowerCase().includes(search.toLowerCase())
        ).map((v) => (
          <div key={v.id} onClick={() => onSelectVehicle(v)} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-primary/30 hover:bg-white/10 transition-colors cursor-pointer flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-black text-white">{v.year} {v.make} {v.model}</h3>
              <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Select Target</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-primary" />
                <span className="text-xs text-white/70">{v.client}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-xs text-white/70">Last: {v.lastVisit}</span>
              </div>
            </div>
            
            <div className="text-[10px] text-white/40 font-mono mt-1 px-3 py-1 bg-black rounded-lg w-fit border border-white/5">
              VIN: {v.vin}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Car, Plus, Search, User, MapPin, X, ChevronRight } from "lucide-react";
import automotiveData from "../../data/automotiveData.json";

const DEFAULT_PLACEHOLDER_YEAR = 2024;

export const GarageScreen = ({ 
  onBack, 
  onSelectVehicle 
}: { 
  onBack: () => void;
  onSelectVehicle: (v: { id: number; make: string; model: string; year: string; vin: string; clientName: string; lastVisit: string }) => void;
}) => {
  const autoData = automotiveData as Record<string, Record<string, string[]>>;
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState([
    { id: 1, make: "Ford", model: "F-150", year: "2018", vin: "1FTFW1RG4KFGxxxxx", clientName: "John Doe", lastVisit: "2023-10-12" },
    { id: 2, make: "Chevrolet", model: "Silverado", year: "2020", vin: "1GCVKPEH5LZxxxxx", clientName: "Acme Corp", lastVisit: "2023-11-01" },
    { id: 3, make: "BMW", model: "330i", year: "2019", vin: "WBA5R1C51K8xxxxxx", clientName: "Jane Smith", lastVisit: "2024-01-15" }
  ]);

  // Modal and addition form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [vin, setVin] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const years = Object.keys(autoData).sort((a, b) => parseInt(b) - parseInt(a));

  const handleAddVehicle = () => {
    const newVeh = {
      id: Date.now(),
      make: make.trim(),
      model: model.trim(),
      year: year.trim(),
      vin: vin.trim() || "N/A",
      clientName: clientName.trim(),
      lastVisit: new Date().toISOString().split("T")[0],
    };
    setVehicles([newVeh, ...vehicles]);
    setShowAddModal(false);
    
    // Reset Form
    setClientName("");
    setVin("");
    setYear("");
    setMake("");
    setModel("");
    setIsCustom(false);
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
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-primary">
            <Car className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">Garage Manager</h2>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
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
          v.clientName.toLowerCase().includes(search.toLowerCase()) ||
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
                <span className="text-xs text-white/70">{v.clientName}</span>
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

      {/* Create Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
              <Car className="w-5 h-5" />
              Add Vehicle
            </h3>
            <p className="text-xs text-white/40 mb-6 font-mono">
              Create a new vehicle or custom equipment profile.
            </p>

            {/* Toggle */}
            <div className="flex bg-black p-1 rounded-xl border border-white/5 mb-6">
              <button
                type="button"
                onClick={() => setIsCustom(false)}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  !isCustom
                    ? "bg-primary text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Automotive Database
              </button>
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  isCustom
                    ? "bg-primary text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Custom Entry / Manual
              </button>
            </div>

            <div className="space-y-4">
              {/* Client Name */}
              <div className="relative">
                <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                  Client / Owner Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Fleet, John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Dynamic Fields */}
              {!isCustom ? (
                <>
                  <div className="relative">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                      Model Year
                    </label>
                    <div className="relative">
                      <select
                        value={year}
                        onChange={(e) => {
                          setYear(e.target.value);
                          setMake("");
                          setModel("");
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-colors appearance-none"
                      >
                        <option value="" className="bg-[#0f0f0f]">Select Year...</option>
                        {years.map((y) => (
                          <option key={y} value={y} className="bg-[#0f0f0f]">
                            {y}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="w-4 h-4 text-white/40 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                        Make / Brand
                      </label>
                      <div className="relative">
                        <select
                          disabled={!year}
                          value={make}
                          onChange={(e) => {
                            setMake(e.target.value);
                            setModel("");
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-colors appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="" className="bg-[#0f0f0f]">
                            {year ? "Select Make..." : "Select Year..."}
                          </option>
                          {year &&
                            autoData[year] &&
                            Object.keys(autoData[year])
                              .sort()
                              .map((m) => (
                                <option key={m} value={m} className="bg-[#0f0f0f]">
                                  {m}
                                </option>
                              ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronRight className="w-4 h-4 text-white/40 rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                        Model
                      </label>
                      <div className="relative">
                        <select
                          disabled={!make}
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-colors appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <option value="" className="bg-[#0f0f0f]">
                            {make ? "Select Model..." : "Select Make..."}
                          </option>
                          {year &&
                            make &&
                            autoData[year]?.[make] &&
                            autoData[year][make]
                              .slice()
                              .sort()
                              .map((mod) => (
                                <option key={mod} value={mod} className="bg-[#0f0f0f]">
                                  {mod}
                                </option>
                              ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronRight className="w-4 h-4 text-white/40 rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                      Model Year
                    </label>
                    <input
                      type="text"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. YYYY"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                        Make / Brand
                      </label>
                      <input
                        type="text"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="e.g. Trane"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                        Model
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. XV20i"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* VIN */}
              <div className="relative">
                <label className="text-[9px] uppercase tracking-widest text-white/40 mb-1 block font-bold font-mono">
                  VIN / Serial (Optional)
                </label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="Unique 17-char VIN or Serial"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              disabled={!clientName.trim() || !year.trim() || !make.trim() || !model.trim()}
              onClick={handleAddVehicle}
              className="w-full mt-6 bg-primary disabled:bg-white/5 disabled:text-white/20 py-4 rounded-xl text-black font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:active:scale-100 shadow-[0_0_20px_rgba(245,166,35,0.1)] disabled:shadow-none"
            >
              Create Vehicle Profile
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

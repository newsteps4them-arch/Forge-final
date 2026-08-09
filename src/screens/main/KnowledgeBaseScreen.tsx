import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Search, Filter, FileText } from "lucide-react";

export const KnowledgeBaseScreen = ({ onBack, vehicle }: { onBack: () => void, vehicle: string }) => {
  const [search, setSearch] = useState("");
  const [docs] = useState([
    { id: 1, type: "TSB", title: "TSB 18-2274: Engine Misfire on Cold Start", date: "2018-09-12", relevance: "High" },
    { id: 2, type: "Recall", title: "Safety Recall 19S07: Block Heater Connector", date: "2019-04-05", relevance: "Critical" },
    { id: 3, type: "Service", title: "Transmission Fluid Exchange Procedure", date: "2020-01-20", relevance: "Routine" },
    { id: 4, type: "TSB", title: "TSB 21-2051: Sync 3 Display Blank", date: "2021-03-10", relevance: "Medium" }
  ]);

  const filteredDocs = useMemo(() => {
    const searchLower = search.toLowerCase();
    return docs.filter(d =>
      d.title.toLowerCase().includes(searchLower) ||
      d.type.toLowerCase().includes(searchLower)
    );
  }, [docs, search]);

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
            <BookOpen className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">Knowledge Base</h2>
          </div>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="bg-[#111] border border-white/5 rounded-xl p-3 flex items-center justify-between">
           <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Target Framework</span>
           <span className="text-xs font-mono text-primary font-bold">{vehicle}</span>
        </div>
      </div>

      <div className="px-6 mb-6 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search TSBs, Recalls, Procedures..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
        <button className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col items-center justify-center hover:bg-white/10">
           <Filter className="w-5 h-5 text-white/70" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar pb-10">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start">
              <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${
                doc.type === "Recall" ? "bg-red-500/20 text-red-500" :
                doc.type === "TSB" ? "bg-orange-500/20 text-orange-500" :
                "bg-blue-500/20 text-blue-500"
              }`}>
                {doc.type}
              </span>
              <span className="text-[10px] text-white/40 font-mono">{doc.date}</span>
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors pr-8">
              {doc.title}
            </h3>
            <div className="flex justify-between items-center mt-2">
               <span className="text-xs text-white/50 flex items-center gap-1">
                 <FileText className="w-3 h-3" /> View Document (PDF)
               </span>
               <span className={`text-[10px] uppercase tracking-widest font-bold ${
                 doc.relevance === 'Critical' ? 'text-red-500' : 'text-white/40'
               }`}>
                 {doc.relevance}
               </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

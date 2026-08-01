import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Camera, CheckCircle, AlertTriangle, 
  XCircle, FileText, Upload, Plus, X, Trash2 
} from "lucide-react";
import { toast } from "../../lib/notifications";

interface InspectionItem {
  id: number;
  category: string;
  name: string;
  status: "good" | "attention" | "critical";
  notes: string;
  media?: string;
}

const REPORT_TOAST_DURATION = 5000;

export const DviScreen = ({ onBack }: { onBack: () => void }) => {
  const [items, setItems] = useState<InspectionItem[]>([
    { id: 1, category: "Tires & Brakes", name: "Front Brake Pads", status: "attention", notes: "3mm remaining, replace soon." },
    { id: 2, category: "Under Hood", name: "Engine Oil", status: "good", notes: "Level and condition okay." },
    { id: 3, category: "Under Hood", name: "Drive Belt", status: "critical", notes: "Cracked and glazed, immediate replacement recommended." },
    { id: 4, category: "Exterior", name: "Headlights", status: "good", notes: "Operational." },
  ]);

  // Form for new item
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Under Hood");
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Modal to show final summary
  const [showSendModal, setShowSendModal] = useState(false);

  // Hidden file inputs references mapped by item ID
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const updateStatus = (id: number, status: "good" | "attention" | "critical") => {
    setItems(items.map(item => item.id === id ? { ...item, status } : item));
  };

  const updateNotes = (id: number, notes: string) => {
    setItems(items.map(item => item.id === id ? { ...item, notes } : item));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem: InspectionItem = {
      id: Date.now(),
      category: newItemCategory,
      name: newItemName.trim(),
      status: "good",
      notes: "",
    };
    setItems([...items, newItem]);
    setNewItemName("");
    setShowAddItemForm(false);
    toast.show("Added custom inspection item", "success");
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    toast.show("Removed inspection item", "info");
  };

  const handleMediaUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setItems(items.map(item => item.id === id ? { ...item, media: reader.result as string } : item));
        toast.show("Media attached successfully", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const goodCount = items.filter(i => i.status === "good").length;
  const attentionCount = items.filter(i => i.status === "attention").length;
  const criticalCount = items.filter(i => i.status === "critical").length;

  const handleSendReport = () => {
    setShowSendModal(false);
    toast.show("Digital Inspection PDF generated and shared with client.", "success", REPORT_TOAST_DURATION);
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
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-primary">
            <Camera className="w-5 h-5" />
            <h2 className="text-xl font-black uppercase tracking-widest">Digital Inspection</h2>
          </div>
        </div>
        <button 
          onClick={() => setShowSendModal(true)}
          className="bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-primary/30 transition-all active:scale-95"
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Send DVI</span>
        </button>
      </div>

      {/* Checklist Health Telemetry Dashboard */}
      <div className="px-6 mb-6">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-4 grid grid-cols-3 gap-2 text-center font-mono">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
            <div className="text-emerald-500 text-lg font-black">{goodCount}</div>
            <div className="text-[8px] text-white/40 uppercase tracking-widest">Good</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5">
            <div className="text-orange-500 text-lg font-black">{attentionCount}</div>
            <div className="text-[8px] text-white/40 uppercase tracking-widest">Attention</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
            <div className="text-red-500 text-lg font-black">{criticalCount}</div>
            <div className="text-[8px] text-white/40 uppercase tracking-widest">Critical</div>
          </div>
        </div>
      </div>

      {/* Inspection Checklist Items */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-10">
        
        {/* Toggle Custom Add Form */}
        {!showAddItemForm ? (
          <button 
            onClick={() => setShowAddItemForm(true)}
            className="w-full bg-[#111] hover:bg-white/5 border border-dashed border-white/15 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-all mb-2"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>Add Custom Inspection Item</span>
          </button>
        ) : (
          <form onSubmit={handleAddItem} className="bg-[#111] border border-white/10 rounded-2xl p-4 space-y-3 mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">New Checklist Item</span>
              <button type="button" onClick={() => setShowAddItemForm(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Cabin Air Filter, Front Struts"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-primary/50 transition-colors"
              >
                <option value="Under Hood" className="bg-[#0f0f0f]">Under Hood</option>
                <option value="Tires & Brakes" className="bg-[#0f0f0f]">Tires & Brakes</option>
                <option value="Exterior" className="bg-[#0f0f0f]">Exterior</option>
                <option value="Interior" className="bg-[#0f0f0f]">Interior</option>
                <option value="Under Vehicle" className="bg-[#0f0f0f]">Under Vehicle</option>
              </select>
              <button 
                type="submit" 
                className="bg-primary text-black rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-all"
              >
                Add Item
              </button>
            </div>
          </form>
        )}

        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col gap-4 relative group"
            >
              {/* Header inside Card */}
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">{item.name}</h3>
                    <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">{item.category}</span>
                 </div>
                 
                 {/* Delete custom items */}
                 <button 
                   onClick={() => deleteItem(item.id)}
                   className="absolute top-5 right-28 opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-500 transition-all"
                   title="Delete Item"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>

                 {/* Tri-state status buttons */}
                 <div className="flex gap-1.5">
                   <button 
                     onClick={() => updateStatus(item.id, "good")}
                     title="Good / Pass"
                     className={`p-2 rounded-xl border transition-all ${item.status === 'good' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'bg-black border-white/5 text-white/20 hover:text-white/55'}`}
                   >
                     <CheckCircle className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => updateStatus(item.id, "attention")}
                     title="Requires Attention"
                     className={`p-2 rounded-xl border transition-all ${item.status === 'attention' ? 'bg-orange-500/20 border-orange-500/50 text-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-black border-white/5 text-white/20 hover:text-white/55'}`}
                   >
                     <AlertTriangle className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => updateStatus(item.id, "critical")}
                     title="Critical Failure"
                     className={`p-2 rounded-xl border transition-all ${item.status === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 'bg-black border-white/5 text-white/20 hover:text-white/55'}`}
                   >
                     <XCircle className="w-4 h-4" />
                   </button>
                 </div>
              </div>
              
              {/* Inspection notes text input */}
              <div className="relative">
                 <input 
                   type="text"
                   value={item.notes}
                   onChange={(e) => updateNotes(item.id, e.target.value)}
                   placeholder="Tap to add diagnostic findings or repair recommendations..."
                   className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-primary/40 focus:bg-black/60 transition-all font-mono"
                 />
              </div>
              
              {/* Media File Attachment Section */}
              <div className="flex flex-col gap-2">
                 {item.media && (
                   <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shadow-lg group-2">
                     <img src={item.media} alt="inspection clip" className="w-full h-full object-cover" />
                     <button
                       onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, media: undefined } : i))}
                       className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-black p-1.5 rounded-full text-white/60 hover:text-white transition-colors border border-white/5"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                 )}
                 
                 {/* Hidden input element */}
                 <input 
                   type="file"
                   accept="image/*"
                   className="hidden"
                   ref={el => fileInputRefs.current[item.id] = el}
                   onChange={(e) => handleMediaUpload(item.id, e)}
                 />

                 {!item.media && (
                   <button 
                     onClick={() => fileInputRefs.current[item.id]?.click()}
                     className="w-full border border-dashed border-white/10 hover:border-primary/40 hover:bg-white/5 transition-all py-3 rounded-xl flex items-center justify-center gap-2 text-white/40 hover:text-primary font-mono text-[10px]"
                   >
                     <Upload className="w-3.5 h-3.5" />
                     <span className="uppercase tracking-widest">Attach Inspection Media</span>
                   </button>
                 )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Report Send Summary Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0E0E0E] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative">
            <button
              onClick={() => setShowSendModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Inspection Report
            </h3>
            <p className="text-xs text-white/45 mb-6 font-mono">
              Review checklist totals before dispatching the DVI report link.
            </p>

            <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-white/5 mb-6 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Total Checks:</span>
                <span className="font-bold text-white">{items.length}</span>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex justify-between items-center text-emerald-500">
                <span>Passed / Good:</span>
                <span className="font-bold">{goodCount}</span>
              </div>
              <div className="flex justify-between items-center text-orange-500">
                <span>Attention Needed:</span>
                <span className="font-bold">{attentionCount}</span>
              </div>
              <div className="flex justify-between items-center text-red-500">
                <span>Critical / Failure:</span>
                <span className="font-bold">{criticalCount}</span>
              </div>
            </div>

            <button
              onClick={handleSendReport}
              className="w-full bg-primary py-4 rounded-xl text-black font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-[0_0_25px_rgba(245,166,35,0.15)]"
            >
              Send Live Link
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

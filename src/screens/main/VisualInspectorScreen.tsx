import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Camera, X, ScanEye, Crosshair, AlertCircle } from "lucide-react";
import { analyzeImage } from "../../services/geminiService";
import { toast } from "../../lib/notifications";
import Markdown from "react-markdown";

export const VisualInspectorScreen = ({
  onBack,
  mode,
  apiKey,
}: {
  onBack: () => void;
  mode: string;
  apiKey?: string;
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.show("Image must be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    let prompt = `You are a ${mode} assistant. Analyze this image carefully. `;
    if (mode === "Field Welder") {
      prompt += "Check the weld for porosity, undercut, lack of fusion, or irregular bead profile. Point out any defects.";
    } else if (mode === "Master Electrician") {
      prompt += "Analyze this electrical panel or wiring. Look for code violations, overheated wires, improper grounding, or general safety hazards.";
    } else if (mode === "HVAC Technician") {
      prompt += "Analyze this HVAC unit or ductwork. Identify the components, check for obvious refrigerant leaks, freezing, or airflow restrictions.";
    } else if (mode === "Heavy Equip. Tech") {
      prompt += "Analyze this heavy machinery part. Look for hydraulic leaks, structural cracks, worn track links, or damaged hoses.";
    } else if (mode === "Quality Inspector") {
      prompt += "Perform a rigorous visual multi-point inspection. Highlight any sub-standard work, safety issues, or areas needing attention.";
    } else {
      prompt += "Identify the components and point out any visible damage, wear, or abnormal conditions relevant to your expertise.";
    }

    try {
      const result = await analyzeImage(prompt, image, apiKey);
      setAnalysis(result);
    } catch (error) {
      toast.show("Failed to analyze image", "error");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0f1115] flex flex-col z-50">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-end">
          <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
            <ScanEye className="w-4 h-4 text-primary" />
            FIELD VISION
          </h2>
          <span className="text-[10px] text-primary">{mode} Context</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {!image ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8 mt-20">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <div className="text-center space-y-3 max-w-[280px]">
              <h3 className="text-xl font-bold text-white">Capture or Upload</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Take a photo of a weld, electrical panel, HVAC unit, or machinery part for AI defect detection and analysis.
              </p>
            </div>
            <div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-black px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Open Camera
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl">
              <img src={image} alt="Inspection" className="w-full h-auto object-contain max-h-[50vh]" />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <Crosshair className="w-12 h-12 text-primary animate-[spin_3s_linear_infinite]" />
                    <span className="text-[11px] font-mono text-primary animate-pulse uppercase tracking-widest">
                      Processing Vision Data...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!analysis && !isAnalyzing && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setImage(null)}
                  className="bg-surface border border-white/10 text-white px-6 py-3 rounded-full font-bold text-xs hover:bg-white/5 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleAnalyze}
                  className="bg-primary text-black px-6 py-3 rounded-full font-bold text-xs hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_15px_rgba(245,166,35,0.3)]"
                >
                  <ScanEye className="w-4 h-4" />
                  Analyze Image
                </button>
              </div>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1c23] border border-white/5 p-6 rounded-3xl shadow-xl"
              >
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Inspection Report</h4>
                    <p className="text-[10px] text-text-dim font-mono tracking-wider">AI Vision Analysis</p>
                  </div>
                </div>
                <div className="prose prose-invert prose-p:text-xs prose-p:leading-relaxed prose-headings:text-sm prose-headings:text-white prose-li:text-xs max-w-none text-text-secondary">
                  <Markdown>{analysis}</Markdown>
                </div>
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => { setImage(null); setAnalysis(null); }}
                        className="bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                        New Inspection
                    </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

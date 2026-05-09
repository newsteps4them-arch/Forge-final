import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  AlertTriangle,
  PenTool,
} from "lucide-react";

export const GuidedDiagnosticsScreen = ({
  onBack,
  vehicle,
}: {
  onBack: () => void;
  vehicle: string;
}) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Verify Customer Concern",
      desc: "Confirm the presence of warning lights or drivability issues.",
      action: "Test Drive Recommended",
    },
    {
      title: "Perform System Scan",
      desc: "Query all modules for DTCs. (P0300 Random Misfire detected).",
      action: "Scan Completed",
    },
    {
      title: "Check Ignition System",
      desc: "Inspect coils and spark plugs for carbon tracking or wear.",
      action: "Begin Inspection",
    },
    {
      title: "Vacuum Leak Test",
      desc: "Use smoke machine to check for intake manifold leaks.",
      action: "Start Test",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <header className="flex flex-col gap-2 mb-8 pt-6 px-2">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-text-primary" />
          </button>
          <h2 className="text-3xl font-black text-text-primary tracking-tight font-display">
            Guided Diag
          </h2>
        </div>
        <p className="text-text-secondary text-sm font-mono pl-12">{vehicle}</p>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 px-2 space-y-6">
        <div className="bg-primary/20 border border-primary/30 p-4 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-primary mt-1" />
          <div>
            <h3 className="text-white font-bold text-lg mb-1">
              Active Test Plan
            </h3>
            <p className="text-text-secondary text-sm">
              Based on DTCs: P0300, P0171.
            </p>
          </div>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_2px_rgba(255,255,255,0.1)] ${i <= step ? "bg-primary text-black" : "bg-surface text-text-dim"}`}
              >
                {i < step ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <PenTool className="w-5 h-5" />
                )}
              </div>
              <div
                className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${i === step ? "bg-surface border-primary/50 shadow-[0_0_15px_rgba(245,166,35,0.1)]" : i < step ? "bg-surface border-white/10 opacity-75" : "bg-black border-white/5 opacity-50"}`}
              >
                <h4
                  className={`font-bold mb-1 ${i === step ? "text-primary" : "text-white"}`}
                >
                  {s.title}
                </h4>
                <p className="text-text-secondary text-xs mb-3 leading-relaxed">
                  {s.desc}
                </p>
                {i === step && (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="w-full bg-primary/20 hover:bg-primary/30 text-primary py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    {s.action} <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {step === steps.length && (
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_2px_rgba(255,255,255,0.1)] bg-success text-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-success/10 border border-success/30 text-center">
                <h4 className="font-bold text-success mb-1">
                  Diagnostic Complete
                </h4>
                <p className="text-success/70 text-xs text-center">
                  Fault isolated. Ready for repair.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

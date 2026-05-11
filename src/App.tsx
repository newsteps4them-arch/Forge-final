import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Sparkles,
  Hammer,
  ChevronRight,
  User,
  Cpu,
  Key,
  Car,
  CheckCircle2,
  MessageSquare,
  Wrench,
  Layers,
  BookOpen,
  Bot,
  ArrowUp,
  ArrowLeft,
  Calculator,
  HardHat,
  Eye,
  EyeOff,
  Camera,
  ImageIcon,
  Code,
  Mic,
  Trash2,
  Edit2,
  X,
  Save,
  LogOut,
  Search,
  Plus,
  Calendar,
  Flag,
  Terminal,
  Activity,
  Zap,
  Bluetooth,
  Link as LinkIcon,
  ExternalLink,
  Wifi,
  Usb,
  Home,
  Gauge,
  ToggleLeft,
  Database,
  BarChart3,
  FileText,
} from "lucide-react";
import Markdown from "react-markdown";
import { NotificationContainer } from "./components/NotificationContainer";
import { BottomNavBar } from "./components/BottomNavBar";
import { TopStatusBar } from "./components/TopStatusBar";
import { LiveDataScreen } from "./components/LiveDataScreen";
import { CodingScreen } from "./components/CodingScreen";
import { TerminalScreen } from "./components/TerminalScreen";
import { IntegrationsScreen } from "./components/IntegrationsScreen";
import { EstimatorScreen } from "./components/EstimatorScreen";
import { TopologyScreen } from "./components/TopologyScreen";
import { IndexScreen } from "./components/IndexScreen";
import { VoiceCloneScreen } from "./components/VoiceCloneScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { GuidedDiagnosticsScreen } from "./components/GuidedDiagnosticsScreen";
import { OscilloscopeScreen } from "./components/OscilloscopeScreen";
import { WiringDiagramsScreen } from "./components/WiringDiagramsScreen";
import { CameraCapture } from "./components/CameraCapture";
import { toast } from "./lib/notifications";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  signInWithRedirect,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "./lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { generateChatResponse } from "./services/geminiService";
import { ObdConnection, WebBluetoothObd, WebSerialObd, SimulatedObd } from "./lib/obdConnection";

// --- Utilities ---
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
type DTC = {
  code: string;
  description: string;
  status: "Stored" | "Pending" | "Permanent";
};

type OnboardingData = {
  assistantName: string;
  wakeWord: string;
  customVoiceEnabled: boolean;
  customVoiceUrl: string | null;
  userName: string;
  apiKey: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin: string;
  vehicleProtocol: string;
  vehicleInfo: string;
  inventory: string;
  onboardingComplete: boolean;
};

type Screen =
  | "Welcome"
  | "NameAssistant"
  | "WakeWord"
  | "VoiceClone"
  | "AboutYou"
  | "ApiKeys"
  | "Inventory"
  | "Vehicles"
  | "Ready"
  | "Main"
  | "Chat"
  | "Diagnostics"
  | "LiveData"
  | "Coding"
  | "Terminal"
  | "Integrations"
  | "Estimator"
  | "Topology"
  | "Analytics"
  | "GuidedDiagnostics"
  | "Oscilloscope"
  | "WiringDiagrams"
  | "Index";
type AssistantMode =
  | "Operations"
  | "Diagnostics Lead"
  | "Performance Tuner"
  | "Electrical Eng."
  | "Estimator";
type ChatMessage = { role: "user" | "model"; text: string; image?: string };

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  category?: string;
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  userId: string;
  projectId: string;
  updatedAt?: any;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  userId: string;
  color?: string;
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  userId: string;
};

// --- Components ---

const TaskItem = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  selected,
  onSelect,
  themeColor = "#F5A623",
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  selected: boolean;
  onSelect: () => void;
  themeColor?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [showModal, setShowModal] = useState(false);

  const handleSave = () => {
    if (editText.trim() && editText !== task.text) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
    setShowModal(false);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          borderColor: selected ? themeColor : "rgba(255,255,255,0.05)",
          backgroundColor: selected
            ? `${themeColor}0D`
            : task.completed
              ? "rgba(0,0,0,0.2)"
              : "rgba(255,255,255,0.03)",
        }}
        className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${task.completed ? "opacity-60" : "hover:border-white/20"}`}
      >
        <div className="flex items-center gap-3 flex-shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            style={{ color: themeColor }}
            className="w-4 h-4 rounded border-white/20 bg-transparent focus:ring-opacity-20 transition-all cursor-pointer"
          />
          <button
            onClick={onToggle}
            style={{
              backgroundColor: task.completed ? themeColor : "transparent",
              borderColor: task.completed
                ? themeColor
                : "rgba(255,255,255,0.2)",
            }}
            className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 text-black"
          >
            <AnimatePresence mode="wait">
              {task.completed && (
                <motion.div
                  key="checked"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            {isEditing ? (
              <input
                autoFocus
                className="w-full bg-transparent border-none outline-none text-sm text-text-primary p-0 m-0 font-medium"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className={`text-sm font-medium truncate cursor-text ${task.completed ? "line-through text-text-dim" : "text-text-primary"}`}
              >
                {task.text}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              {task.category && (
                <div
                  style={{
                    color: themeColor,
                    backgroundColor: `${themeColor}1A`,
                  }}
                  className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold"
                >
                  {task.category}
                </div>
              )}
              <div
                className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold ${
                  task.priority === "High"
                    ? "bg-red-500/20 text-red-500"
                    : task.priority === "Medium"
                      ? "bg-orange-500/20 text-orange-500"
                      : "bg-blue-500/20 text-blue-500"
                }`}
              >
                {task.priority}
              </div>
              {task.dueDate && (
                <div className="text-[9px] text-text-dim font-mono uppercase tracking-widest">
                  Due: {task.dueDate}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditText(task.text);
              setShowModal(true);
            }}
            className="p-1.5 text-text-dim hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-text-dim hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-surface border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-text-primary">
                  Edit Task
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-dim hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                autoFocus
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium mb-6 min-h-[120px] resize-none"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="What needs to be done?"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-full border border-white/10 text-text-secondary font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-full bg-primary text-black font-bold text-sm shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const WelcomeScreen = ({
  onNext,
  onLogin,
  onLoginAnon,
}: {
  onNext: () => void;
  onLogin: () => void;
  onLoginAnon: () => void;
}) => {
  return (
    <div className="flex flex-col justify-between h-full py-12 px-8 bg-[#000] overflow-hidden relative">
      {/* Cinematic Grid Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(245,166,35,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ember decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.8, 1],
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * -100, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute rounded-full bg-primary shadow-[0_0_20px_rgba(245,166,35,0.9)]"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
        {/* Glow ambient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.2, 1, 0.3, 1] }}
        className="flex-1 flex flex-col items-center justify-center text-center space-y-16 relative z-10"
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-28 h-28 bg-[#111] rounded-[2.5rem] border-2 border-primary/40 shadow-[0_0_40px_rgba(245,166,35,0.2)] flex items-center justify-center mb-10 group"
          >
            <Hammer className="text-primary w-12 h-12 group-hover:scale-110 transition-transform" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-7xl font-black tracking-tighter text-white font-display leading-[0.8] mb-2 uppercase">
              Team
              <br />
              <span className="text-primary">Forge</span>
            </h1>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
          </div>
        </div>

        <div className="space-y-4 max-w-[280px]">
          <p className="text-2xl font-black text-white/90 tracking-tight leading-tight">
            Multidisciplinary Engineering Suite.
          </p>
          <p className="text-[11px] text-text-dim text-center leading-relaxed">
            Your centralized hub for organizing projects, diagnosing vehicles
            via OBD-II, and accessing specialized AI experts.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-dim border border-white/5 font-mono">
              HARDWARE
            </div>
            <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-dim border border-white/5 font-mono">
              SOFTWARE
            </div>
            <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-text-dim border border-white/5 font-mono">
              DESIGN
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="relative z-10 space-y-5"
      >
        <button
          onClick={onLogin}
          className="w-full bg-[#111] hover:bg-[#151515] py-5 px-8 rounded-[1.5rem] text-white font-black text-[13px] uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-4 group"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-500"
          />
          Authenticate User
        </button>
        <div className="flex items-center gap-4 px-4">
          <div className="h-[2px] bg-white/5 flex-1" />
          <span className="text-[10px] text-text-dim uppercase tracking-[0.4em] font-black">
            Secure Entry
          </span>
          <div className="h-[2px] bg-white/5 flex-1" />
        </div>
        <button
          onClick={onLoginAnon}
          className="w-full bg-primary py-5 px-8 rounded-[1.5rem] text-black font-black text-[15px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_15px_40px_rgba(245,166,35,0.4)] hover:shadow-[0_20px_50px_rgba(245,166,35,0.6)] flex items-center justify-center gap-2 group"
        >
          Initialize Workspace
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};

const ApiKeysSetupScreen = ({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
}) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Key className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-20 relative z-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-lg">
          <Key className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>

        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">
          API Keys
        </h2>
        <p className="text-text-secondary text-lg mb-8 tracking-wide">
          Powering Forge with your own tech stack.
        </p>

        <div className="mb-8 p-5 bg-surface/50 border border-border/50 rounded-2xl shadow-inner">
          <p className="text-[15px] leading-relaxed text-text-secondary mb-3">
            You can obtain a Gemini API key from{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Google AI Studio
            </a>
            .
          </p>
          <p className="text-xs text-primary/60 uppercase tracking-widest font-bold mt-4">
            Leave blank to use system key.
          </p>
        </div>

        <div className="relative group">
          <input
            type={showKey ? "text" : "password"}
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Gemini API Key (optional)"
            className="w-full bg-surface/50 border border-border/50 rounded-2xl py-6 pl-6 pr-14 text-xl text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
            onKeyDown={(e) => e.key === "Enter" && onNext()}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-primary transition-colors p-2"
          >
            {showKey ? (
              <EyeOff className="w-6 h-6" />
            ) : (
              <Eye className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <button
          onClick={onNext}
          className="w-full bg-primary py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.2)]"
        >
          {value.trim() ? "Continue" : "Skip"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const SetupScreen = ({
  title,
  subtitle,
  icon: Icon,
  placeholder,
  value,
  onChange,
  onNext,
  optional = false,
}: {
  title: string;
  subtitle: string;
  icon: any;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  optional?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Icon className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-20 relative z-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-lg">
          <Icon className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>

        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">
          {title}
        </h2>
        <p className="text-text-secondary text-lg mb-12 tracking-wide">
          {subtitle}
        </p>

        <div className="relative group">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface/50 border border-border/50 rounded-2xl py-6 px-6 text-xl text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
            onKeyDown={(e) =>
              e.key === "Enter" && (optional || value.trim()) && onNext()
            }
          />
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <button
          disabled={!optional && !value.trim()}
          onClick={onNext}
          className="w-full bg-primary disabled:bg-surface disabled:text-text-dim py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:active:scale-100 shadow-[0_0_20px_rgba(245,166,35,0.2)] disabled:shadow-none"
        >
          {optional && !value.trim() ? "Skip" : "Continue"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const VehicleSetupScreen = ({
  onboarding,
  updateData,
  onNext,
}: {
  onboarding: OnboardingData;
  updateData: (key: keyof OnboardingData, value: any) => void;
  onNext: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Car className="w-64 h-64 text-text-primary" />
      </div>
      <div className="flex-1 mt-10 relative z-10 overflow-y-auto no-scrollbar pb-10">
        <div className="bg-surface w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-lg">
          <Car className="text-primary w-8 h-8 drop-shadow-[0_0_10px_rgba(245,166,35,0.5)]" />
        </div>

        <h2 className="text-4xl font-display font-bold text-text-primary mb-3 leading-tight tracking-tight">
          Vehicle Connection
        </h2>
        <p className="text-text-secondary text-lg mb-8 tracking-wide">
          Enter your primary vehicle details for precision diagnostics.
        </p>

        <div className="space-y-6 max-w-md">
          <div className="relative group">
            <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
              Model Year
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={onboarding.vehicleYear}
              onChange={(e) => updateData("vehicleYear", e.target.value)}
              placeholder="e.g. 2024"
              className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
                Make
              </label>
              <input
                type="text"
                value={onboarding.vehicleMake}
                onChange={(e) => updateData("vehicleMake", e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
              />
            </div>
            <div className="relative group">
              <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
                Model
              </label>
              <input
                type="text"
                value={onboarding.vehicleModel}
                onChange={(e) => updateData("vehicleModel", e.target.value)}
                placeholder="e.g. RAV4"
                className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="relative group">
            <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
              VIN (Optional)
            </label>
            <input
              type="text"
              value={onboarding.vehicleVin}
              onChange={(e) => updateData("vehicleVin", e.target.value)}
              placeholder="17-character VIN"
              className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner font-mono"
            />
          </div>

          <div className="relative group">
            <label className="text-[10px] uppercase tracking-widest text-text-dim mb-1.5 block font-bold">
              Communication Protocol (Language)
            </label>
            <select
              value={onboarding.vehicleProtocol}
              onChange={(e) => updateData("vehicleProtocol", e.target.value)}
              className="w-full bg-surface/50 border border-border/50 rounded-2xl py-4 px-6 text-lg text-text-primary outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface transition-all shadow-inner appearance-none"
            >
              <option value="ISO 15765-4 (CAN 11/500)">
                ISO 15765-4 (CAN 11/500)
              </option>
              <option value="ISO 15765-4 (CAN 29/500)">
                ISO 15765-4 (CAN 29/500)
              </option>
              <option value="ISO 14230-4 (KWP FAST)">
                ISO 14230-4 (KWP FAST)
              </option>
              <option value="ISO 14230-4 (KWP 5BPS)">
                ISO 14230-4 (KWP 5BPS)
              </option>
              <option value="ISO 9141-2 (Asian/Euro)">
                ISO 9141-2 (Asian/Euro)
              </option>
              <option value="SAE J1850 PWM (Ford)">SAE J1850 PWM (Ford)</option>
              <option value="SAE J1850 VPW (GM)">SAE J1850 VPW (GM)</option>
            </select>
            <div className="absolute right-6 bottom-4 pointer-events-none">
              <ChevronRight className="w-5 h-5 text-text-dim rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 pt-4 relative z-10">
        <button
          onClick={onNext}
          className="w-full bg-primary py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.2)]"
        >
          {!onboarding.vehicleMake && !onboarding.vehicleModel
            ? "Skip"
            : "Confirm Vehicle"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

const ReadyScreen = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-gradient-to-b from-[#111] to-[#020202] p-8 text-center relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 200,
            delay: 0.2,
          }}
          className="bg-surface w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] animate-pulse" />
          <CheckCircle2 className="text-primary w-16 h-16 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
        </motion.div>

        <h2 className="text-4xl font-display font-black text-text-primary mb-4 tracking-tight">
          System Initialization Complete.
        </h2>
        <p className="text-text-secondary text-lg max-w-xs mx-auto tracking-wide">
          Team Forge has synced with your parameters. The Engineering Hub is
          ready.
        </p>
      </div>

      <div className="mb-8 relative z-10">
        <button
          onClick={onFinish}
          className="w-full bg-primary py-5 rounded-full text-black font-extrabold text-[15px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(245,166,35,0.4)] hover:shadow-[0_0_40px_rgba(245,166,35,0.6)]"
        >
          Initialize Dashboard
        </button>
      </div>
    </motion.div>
  );
};



const ChatScreen = ({
  onBack,
  onboarding,
  initialMode,
  activeProject,
  user,
  inventory,
  initialQuery,
}: {
  onBack: () => void;
  onboarding: OnboardingData;
  initialMode?: AssistantMode;
  activeProject: string;
  user: FirebaseUser;
  inventory: InventoryItem[];
  initialQuery?: string;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<AssistantMode>(initialMode || "Operations");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      setInput(initialQuery);
    }
  }, [initialQuery, messages.length]);

  // Sync with Firestore
  useEffect(() => {
    if (!user || !activeProject) return;

    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      where("projectId", "==", activeProject),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs
        .map((doc) => doc.data() as ChatMessage & { createdAt: any })
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [user, activeProject]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find(
      (v) =>
        v.lang.includes("en-") &&
        (v.name.includes("Google") || v.name.includes("Natural")),
    );

    if (onboarding.customVoiceUrl === "preset-alpha") {
      utterance.pitch = 0.5;
      utterance.rate = 1.1;
      preferredVoice =
        voices.find(
          (v) =>
            v.name.includes("UK English Male") ||
            v.name.includes("Google UK English Male"),
        ) || preferredVoice;
    } else if (onboarding.customVoiceUrl === "preset-nova") {
      utterance.pitch = 1.2;
      utterance.rate = 1.0;
      preferredVoice =
        voices.find(
          (v) =>
            v.name.includes("US English Female") ||
            v.name.includes("Google US English"),
        ) || preferredVoice;
    } else if (onboarding.customVoiceUrl === "preset-echo") {
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
      preferredVoice =
        voices.find(
          (v) =>
            v.name.includes("Daniel") || v.name.includes("UK English Male"),
        ) || preferredVoice;
    }

    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = async () => {
    if (!activeProject || !user) return;
    try {
      const q = query(
        collection(db, "chats"),
        where("userId", "==", user.uid),
        where("projectId", "==", activeProject),
      );
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
      toast.show("Chat history cleared", "success");
    } catch (e) {
      toast.show("Failed to clear chat", "error");
    }
  };

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isRecording) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInput((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        // if it stops organically, restart if isRecording is true, but since that can loop, just turn it off
        setIsRecording(false);
      };

      try {
        recognition.start();
      } catch (e) {
        setIsRecording(false);
        toast.show("Speech recognition failed to start", "error");
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isRecording]);

  const handleMicClick = () => {
    if (
      !(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      )
    ) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    setIsRecording(!isRecording);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        toast.show("Image attached successfully", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const userMsg = overrideText || input.trim();
    if (!userMsg && !image) return;

    setInput("");
    const attachedImage = image;
    setImage(null);
    setLoading(true);

    try {
      // Save User Message to Firestore
      await addDoc(collection(db, "chats"), {
        role: "user",
        text: userMsg,
        image: attachedImage || null,
        userId: user.uid,
        projectId: activeProject,
        createdAt: Date.now(),
      });

      let systemInstruction = `You are ${onboarding.assistantName}, professional engineering/DIY assistant for ${onboarding.userName}. `;
      systemInstruction += `Project context: ${activeProject || "General Workshop"}. `;

      if (inventory && inventory.length > 0) {
        systemInstruction += `User Inventory: ${inventory.map((i) => `${i.name} (Qty: ${i.quantity})`).join(", ")}. `;
      }

      switch (mode) {
        case "Diagnostics Lead":
          systemInstruction +=
            "Expert automotive diagnostic technician / shop foreman. You function like a high-end Snap-on diagnostic suite mixed with a senior Master Tech. ";
          systemInstruction +=
            "Analyze DTC codes, direct the user on what PIDs to look at, provide electrical testing procedures (voltage drops, resistance checks), and outline logic-based diagnostic paths. ";
          systemInstruction +=
            "Reference dealer-level data concepts like freeze frames and pinpoint tests.";
          break;
        case "Performance Tuner":
          systemInstruction +=
            "Expert automotive calibrator / tuner. Focus on live telemetry, spark advance, fuel trims, VE tables, boost mapping, and engine efficiency. ";
          systemInstruction +=
            "Direct the user to generate specific logs (e.g. WOT pulls) using FORScan or Torque Pro, then analyze the theoretical data. ";
          break;
        case "Electrical Eng.":
          systemInstruction +=
            "Automotive electrical system & CAN-bus network engineer. Focus on module configuration (As-Built coding like FORScan), network topologies, gateway modules, and CAN Hi/Lo troubleshooting. ";
          systemInstruction +=
            "Provide logic for proxy alignments, module resets, and wiring diagram pinouts.";
          break;
        case "Estimator":
          systemInstruction +=
            "Automotive service writer and estimator. Focus on labor time guides (e.g., Mitchell/Alldata), parts sourcing logistics, OEM vs Aftermarket cost-benefit analysis, and shop efficiency. ";
          break;
        case "Operations":
        default:
          systemInstruction +=
            "General operations and team coordinator. You can answer general questions and orchestrate the tasks across the team.";
          break;
      }

      // We don't update local messages state manually, the firestore listener handles it
      // Convert history for Gemini
      const history = [
        ...messages,
        { role: "user" as const, text: userMsg },
      ].map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.text }],
      }));

      const apiKey =
        onboarding.apiKey ||
        import.meta.env.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY;
      const response = await generateChatResponse(
        history,
        apiKey,
        systemInstruction,
      );

      // Save Model Response to Firestore
      await addDoc(collection(db, "chats"), {
        role: "model",
        text: response,
        userId: user.uid,
        projectId: activeProject,
        createdAt: Date.now(),
      });

      if (autoSpeak) {
        speakText(response);
      }
    } catch (error: any) {
      toast.show(error.message || "AI Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleARCapture = (imgData: string) => {
    setImage(imgData);
    setShowCamera(false);
    toast.show("Camera capture successful", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern relative overflow-hidden"
    >
      {showCamera && (
        <CameraCapture
          onCapture={handleARCapture}
          onClose={() => setShowCamera(false)}
          title="AR Scanner"
          assistantMode={mode}
        />
      )}
      {/* Tech Header */}
      <header className="absolute top-0 left-0 right-0 z-30 px-4 pt-10 pb-4 bg-[#050505]/90 backdrop-blur-xl flex flex-col gap-3 border-b border-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff41]/50 to-transparent" />
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-text-primary"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 crt-text">
              {mode} MODE
            </span>
            <div className="flex items-center gap-2 text-[9px] font-mono text-text-secondary">
               <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LINK ESTABLISHED
            </div>
          </div>
          <button
            onClick={clearChat}
            title="Clear Chat"
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-text-secondary hover:text-error flex-shrink-0"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div
          className="flex bg-black/40 rounded-full p-1 border border-white/5 overflow-x-auto no-scrollbar items-center"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <button
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (autoSpeak) window.speechSynthesis?.cancel();
            }}
            title={autoSpeak ? "Voice Output On" : "Voice Output Off"}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ml-1 mr-2 ${autoSpeak ? "bg-primary/20 text-primary" : "text-text-secondary hover:bg-white/10"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              {autoSpeak && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>}
              {autoSpeak && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>}
            </svg>
          </button>
          {/* Scrollable mode toggles */}
          {[
            "Operations",
            "Diagnostics Lead",
            "Performance Tuner",
            "Electrical Eng.",
            "Estimator",
          ].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m as AssistantMode);
                toast.show(`Switched to ${m} mode`, "info", 3000);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${mode === m ? "bg-primary text-black shadow-[0_0_10px_rgba(245,166,35,0.4)]" : "text-text-secondary hover:text-text-primary"}`}
            >
              {m === "Operations" && <Sparkles className="w-3 h-3" />}
              {m === "Diagnostics Lead" && <Wrench className="w-3 h-3" />}
              {m === "Estimator" && <Calculator className="w-3 h-3" />}
              {m === "Performance Tuner" && <Activity className="w-3 h-3" />}
              {m === "Electrical Eng." && <Zap className="w-3 h-3" />}
              {m.split(" ")[0]}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full h-full px-5 pt-[140px] pb-[160px] space-y-6 z-10 no-scrollbar relative">
        {/* Subtle background ember visualizer */}
        {messages.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
            <div className="w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
          </div>
        )}

        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center opacity-70 relative z-10 space-y-8">
            <div className="flex flex-col items-center justify-center">
              <Cpu className="w-16 h-16 text-primary mb-6 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]" />
              <p className="text-center text-text-primary font-display text-xl tracking-tight max-w-[200px]">
                {mode === "Diagnostics Lead"
                  ? "What are we tearing apart today?"
                  : mode === "Estimator"
                    ? "Let's run some numbers."
                    : mode === "Performance Tuner"
                      ? "Let's dial in the maps."
                      : mode === "Electrical Eng."
                        ? "Tracing the CAN lines."
                        : "How can the team assist?"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[280px]">
              {mode === "Diagnostics Lead" &&
                [
                  "Code P0300 on F150",
                  "Fuel trim data analysis",
                  "EVAP leak procedure",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Estimator" &&
                [
                  "OEM Parts pricing",
                  "Compare aftermarket blocks",
                  "Calculate 8 hrs labor",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Performance Tuner" &&
                [
                  "Adjust target boost CFG",
                  "Explain WOT Fuel table",
                  "MAF scaling tutorial",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Electrical Eng." &&
                [
                  "Calculate proxy align byte",
                  "Locate BCM ground",
                  "Explain HS-CAN topology",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
              {mode === "Operations" &&
                [
                  "Pull AS-BUILT data",
                  "Review diagnostic logs",
                  "Inventory check",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-surface/50 border border-white/5 hover:border-primary/50 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {suggest}
                  </button>
                ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={idx}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`shadow-lg max-w-[90%] p-5 ${msg.role === "user" ? "bg-primary text-black rounded-[2rem] rounded-tr-md" : "bg-surface text-text-primary border border-white/5 rounded-[2rem] rounded-tl-md"}`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Uploaded"
                  className="rounded-xl w-full max-h-48 object-cover mb-3 border border-black/10"
                />
              )}
              {msg.text &&
                (msg.role === "model" ? (
                  <div className="markdown-body text-text-primary/90">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">
                    {msg.text}
                  </p>
                ))}
            </div>
            <span className="text-[10px] text-text-dim mt-2 tracking-widest uppercase px-2">
              {msg.role === "user"
                ? onboarding.userName
                : onboarding.assistantName}
            </span>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start"
          >
            <div className="bg-surface text-text-primary border border-white/5 rounded-[2rem] rounded-tl-md p-5 flex gap-2 items-center shadow-lg relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 scanlines-pattern pointer-events-none" />
               <motion.div
                animate={{ height: ["8px", "20px", "8px"] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                className="w-1.5 bg-primary/80 rounded-full shadow-[0_0_5px_rgba(245,166,35,0.5)]"
              />
              <motion.div
                animate={{ height: ["8px", "24px", "8px"] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(245,166,35,0.8)]"
              />
              <motion.div
                animate={{ height: ["8px", "16px", "8px"] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 bg-primary/80 rounded-full shadow-[0_0_5px_rgba(245,166,35,0.5)]"
              />
              <span className="text-[10px] uppercase font-mono text-primary/70 tracking-widest ml-3">ANALYZING...</span>
            </div>
          </motion.div>
        )}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* Floating Input Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-8 glass border-t border-white/5">
        {image && (
          <div className="mb-3 relative inline-block mx-2">
            <img
              src={image}
              alt="Preview"
              className="w-16 h-16 rounded-xl object-cover border border-primary/50 shadow-lg"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-card rounded-full p-1 border border-border text-text-secondary hover:text-text-primary shadow-lg"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-3xl pl-3 pr-2 py-2 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/30 transition-all shadow-inner">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-text-secondary hover:text-primary transition-colors bg-white/5 rounded-full hover:bg-white/10"
              title="Upload Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="p-2.5 text-text-secondary hover:text-primary transition-colors bg-white/5 rounded-full hover:bg-white/10"
              title="AR Camera View"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-2.5 transition-colors rounded-full ${isRecording ? "text-black bg-primary animate-pulse shadow-[0_0_15px_rgba(245,166,35,0.5)]" : "text-text-secondary hover:text-primary bg-white/5 hover:bg-white/10"}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                isRecording ? "Listening intently..." : "Ask Forge..."
              }
              className="flex-1 bg-transparent border-none text-text-primary outline-none py-2 px-2 placeholder:text-text-dim/80"
            />
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !image) || loading}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black disabled:opacity-30 transition-all active:scale-90 shadow-[0_0_15px_rgba(245,166,35,0.4)] disabled:shadow-none"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>

          {messages.length > 0 && (
            <div className="flex overflow-x-auto gap-2 no-scrollbar py-1 mt-1 pb-2">
              {(() => {
                let suggestions: string[] = [];
                switch (mode) {
                  case "Diagnostics Lead":
                    suggestions = [
                      "Check fluid levels",
                      "Diagnostic paths",
                      "Service Resets",
                    ];
                    break;
                  case "Performance Tuner":
                    suggestions = [
                      "Analyze Data Log",
                      "Boost targets",
                      "Timing pull",
                    ];
                    break;
                  case "Estimator":
                    suggestions = [
                      "Calculate Labor",
                      "Part # lookup",
                      "Compare aftermarket",
                    ];
                    break;
                  case "Electrical Eng.":
                    suggestions = [
                      "Module config sync",
                      "Wiring diagram",
                      "CAN-bus check",
                    ];
                    break;
                  default:
                    suggestions = [
                      "Generate Report",
                      "Show active tasks",
                      "Sync integrations",
                    ];
                    break;
                }
                return suggestions.map((suggest) => (
                  <button
                    key={suggest}
                    onClick={() => setInput(suggest)}
                    className="bg-white/5 border border-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {suggest}
                  </button>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const InventoryScreen = ({
  onBack,
  inventory,
  user,
}: {
  onBack: () => void;
  inventory: InventoryItem[];
  user: FirebaseUser;
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "inventory"), {
        name: newItemName.trim(),
        quantity: 1,
        userId: user.uid,
        createdAt: Date.now(),
      });
      setNewItemName("");
      toast.show("Tool added to Forge Cloud", "success");
    } catch (e) {
      toast.show("Failed to sync inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (id: string, delta: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    try {
      if (newQty === 0) {
        await deleteDoc(doc(db, "inventory", id));
      } else {
        await updateDoc(doc(db, "inventory", id), { quantity: newQty });
      }
    } catch (e) {
      toast.show("Update failed", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative"
    >
      <header className="flex items-center gap-4 mb-10 pt-10 px-2">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-3xl font-black text-text-primary tracking-tight font-display">
          Toolbox
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
        <div className="bg-surface p-6 rounded-[2rem] border border-white/5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80">
            Add Gear / Parts
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. 10mm Socket, Multimeter..."
              className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-text-primary outline-none focus:border-primary/40 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || loading}
              className="bg-primary text-black p-3 rounded-2xl shadow-lg active:scale-95 disabled:opacity-30"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20 mt-4 h-full">
          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 opacity-50">
                <Wrench className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                No tools in your forge
              </h3>
              <p className="text-sm text-text-dim max-w-[200px] leading-relaxed uppercase tracking-wider text-[10px]">
                Your inventory is empty. Add your gear to sync it with the Cloud
                Assistant.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="bg-[#151619] border border-white/5 p-5 shadow-2xl relative overflow-hidden rounded-[2.5rem] flex items-center justify-between group hover:border-white/10 transition-colors shadow-lg"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-text-primary text-[16px] tracking-tight">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="px-1.5 py-0.5 bg-primary/10 rounded text-[9px] text-primary font-black uppercase tracking-widest border border-primary/5">
                        TOOLS
                      </div>
                      <span className="text-[10px] text-text-dim font-mono">
                        ID: {item.id.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-full border border-white/5">
                    <button
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="p-2.5 text-text-dim hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center font-black text-primary font-mono text-lg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="p-2.5 text-text-dim hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DiagnosticScreen = ({
  onBack,
  connected,
  dtcs,
  onCommand,
  onDeepDive,
}: {
  onBack: () => void;
  connected: boolean;
  dtcs: DTC[];
  onCommand: (cmd: string) => void;
  onDeepDive: (dtc: DTC) => void;
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState<string>("");

  const handleScan = (type: "quick" | "deep") => {
    if (!connected) {
      toast.show("Connect to vehicle first on Home screen", "error");
      return;
    }
    setIsScanning(true);
    setScanType(type === "quick" ? "Quick Scan" : "Deep Module Scan");

    // Simulate scan sequence
    setTimeout(() => {
      onCommand("03"); // Request Emission-Related Diagnostic Trouble Codes
    }, 1000);

    setTimeout(() => {
      setIsScanning(false);
      setScanType("");
      toast.show("Scan complete", "success");
    }, 3000);
  };

  const handleClear = () => {
    if (!connected) return;
    if (
      confirm(
        "Are you sure you want to clear all DTCs? This will reset your emissions monitors.",
      )
    ) {
      onCommand("04"); // Clear/Reset Emission-Related Diagnostic Info
      toast.show("Clear command sent", "info");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#0A0A0A] flex flex-col pt-8 pb-32 z-20"
    >
      <div className="flex items-center gap-3 px-6 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-primary">
          <Activity className="w-5 h-5" />
          <h2 className="text-xl font-black uppercase tracking-widest">
            Diagnostics
          </h2>
        </div>
      </div>

      <div className="px-6 space-y-6 overflow-y-auto no-scrollbar flex-1 pb-10">
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono leading-relaxed mb-6">
          Read and clear vehicle diagnostic trouble codes (DTCs). Green
          indicates a clean system. Red indicates faults found.
        </div>

        {/* Scan Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleScan("quick")}
            disabled={isScanning}
            className={`p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-3 transition-all ${isScanning && scanType === "Quick Scan" ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(245,166,35,0.2)] text-primary" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Zap
              className={`w-8 h-8 ${isScanning && scanType === "Quick Scan" ? "animate-pulse" : ""}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black uppercase tracking-wider font-mono">
                1-Tap Quick
              </span>
              <span className="text-[9px] text-white/40 uppercase mt-1 px-2">
                Checks Powertrain
              </span>
            </div>
          </button>
          <button
            onClick={() => handleScan("deep")}
            disabled={isScanning}
            className={`p-4 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-3 transition-all ${isScanning && scanType === "Deep Module Scan" ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(245,166,35,0.2)] text-primary" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Search
              className={`w-8 h-8 ${isScanning && scanType === "Deep Module Scan" ? "animate-pulse" : ""}`}
            />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black uppercase tracking-wider font-mono">
                Module Scan
              </span>
              <span className="text-[9px] text-white/40 uppercase mt-1 px-2">
                ABS, Airbag, Trans
              </span>
            </div>
          </button>
        </div>

        {/* Scan Results */}
        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 opacity-50"
            >
              <Activity className="w-10 h-10 text-primary animate-pulse mb-3" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                {scanType}...
              </span>
            </motion.div>
          ) : dtcs.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mt-6">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                  {dtcs.length} Fault(s) Detected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      toast.show(
                        "Diagnostic Report generated and saved to Hub.",
                        "success",
                      )
                    }
                    className="px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-primary hover:text-black transition-colors"
                  >
                    Report
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-red-500 hover:text-black transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {dtcs.map((dtc) => (
                <div
                  key={dtc.code}
                  className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-red-500 text-black font-black text-xs px-2 py-1 rounded">
                        {dtc.code}
                      </div>
                      <button
                        onClick={() => onDeepDive && onDeepDive(dtc)}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded border border-primary/30 text-[8px] text-primary hover:bg-primary/10 transition-colors uppercase font-bold tracking-widest mt-1"
                      >
                        <Bot className="w-2.5 h-2.5" /> Guide
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-1">
                        {dtc.description}
                      </p>
                      <p className="text-[10px] text-red-500/70 font-mono tracking-widest uppercase mb-1">
                        {dtc.status}
                      </p>
                      <div className="text-[9px] text-white/40 leading-relaxed font-mono uppercase">
                        Module: PCM (Powertrain Control Module)
                      </div>
                    </div>
                  </div>
                  {/* Simulated Freeze Frame Data */}
                  <div className="mt-2 pt-3 border-t border-red-500/10 grid grid-cols-2 gap-2">
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Engine RPM
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        1,824 r/min
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Coolant Temp
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        185 °F
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Vehicle Speed
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        45 mph
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded">
                      <span className="text-[8px] text-white/40 font-mono uppercase">
                        Engine Load
                      </span>
                      <span className="text-[9px] text-white font-mono">
                        32.4 %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="clean"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 opacity-50"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <span className="text-xs font-mono uppercase tracking-widest text-green-500 text-center">
                No faults detected
                <br />
                System OK
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

import { Capacitor } from "@capacitor/core";
import { getRedirectResult } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>("Welcome");
  const [chatMode, setChatMode] = useState<AssistantMode>("Operations");
  const [chatInitialQuery, setChatInitialQuery] = useState("");
  const [activeProject, setActiveProject] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>(
    [],
  );
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<
    "All" | "Low" | "Medium" | "High"
  >("All");

  // Diagnostic State
  const [obdConnected, setObdConnected] = useState(false);
  const obdRef = useRef<ObdConnection | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [obdMode, setObdMode] = useState<"Bluetooth" | "USB" | "Simulated">(
    "Simulated",
  );
  const [telemetry, setTelemetry] = useState<any[]>([]);

  useEffect(() => {
    // Extract telemetry from logs
    const newestLog = diagnosticLogs[0];
    if (newestLog && newestLog.includes("RX:")) {
      const match = newestLog.match(/\(([^:]+): ([\d.]+)/);
      if (match) {
        const name = match[1];
        const value = parseFloat(match[2]);
        setTelemetry((prev) => {
          const newData = {
            time: new Date().toLocaleTimeString(),
            [name]: value,
          };
          return [...prev.slice(-19), newData];
        });
      }
    }
  }, [diagnosticLogs]);
  const [detectedDtcs, setDetectedDtcs] = useState<DTC[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [onboarding, setOnboarding] = useState<OnboardingData>({
    assistantName: "",
    wakeWord: "",
    customVoiceEnabled: false,
    customVoiceUrl: null,
    userName: "",
    apiKey: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleVin: "",
    vehicleProtocol: "ISO 15765-4 (CAN 11/500)",
    vehicleInfo: "",
    inventory: "",
    onboardingComplete: false,
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        toast.show(`Signed in as ${u.displayName || u.email}`, "success");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Projects and Tasks on login
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setTasks([]);
      return;
    }

    // Projects Listener
    const pq = query(
      collection(db, "projects"),
      where("userId", "==", user.uid),
    );
    const unsubscribeProjects = onSnapshot(
      pq,
      async (snapshot) => {
        const fetchedProjects = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Project,
        );

        if (fetchedProjects.length === 0) {
          // Auto-create a default project so the app is never entirely blank
          try {
            const newProj = {
              name: "General Diagnostics",
              userId: user.uid,
              createdAt: Date.now(),
              color: "#F5A623",
            };
            const docRef = await addDoc(collection(db, "projects"), newProj);
            const createdProj = { id: docRef.id, ...newProj } as Project;
            setProjects([createdProj]);
            setActiveProject(docRef.id);
          } catch (e) {
            console.error("Failed to auto-create project", e);
          }
        } else {
          setProjects(fetchedProjects);
          if (
            !activeProject ||
            !fetchedProjects.find((p) => p.id === activeProject)
          ) {
            // Check local storage first
            const saved = localStorage.getItem(
              `forge_active_project_${user.uid}`,
            );
            if (saved && fetchedProjects.find((p) => p.id === saved)) {
              setActiveProject(saved);
            } else {
              setActiveProject(fetchedProjects[0].id);
            }
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "projects"),
    );

    // Tasks Listener (scoped to active project)
    const tq = activeProject
      ? query(
          collection(db, "tasks"),
          where("userId", "==", user.uid),
          where("projectId", "==", activeProject),
        )
      : query(collection(db, "tasks"), where("userId", "==", user.uid));

    const unsubscribeTasks = onSnapshot(
      tq,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Task,
        );
        setTasks(fetchedTasks);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "tasks"),
    );

    // Inventory Listener
    const iq = query(
      collection(db, "inventory"),
      where("userId", "==", user.uid),
    );
    const unsubscribeInventory = onSnapshot(
      iq,
      (snapshot) => {
        setInventory(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as InventoryItem,
          ),
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "inventory"),
    );

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeInventory();
    };
  }, [user, activeProject]);

  // Fetch User Profile
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as OnboardingData;
          setOnboarding(profile);
          if (profile.onboardingComplete) setCurrentScreen("Main");
        } else {
          setCurrentScreen("NameAssistant");
        }
      } catch (e) {
        console.error("Profile load failed", e);
      }
    };
    loadProfile();
  }, [user]);

  const PROJECT_COLORS = [
    "#F5A623",
    "#23F5A6",
    "#A623F5",
    "#F523A6",
    "#FF5B5B",
    "#5B8FFF",
  ];

  const handleUpdateProjectColor = async (color: string) => {
    if (!user || !activeProject) return;
    try {
      await updateDoc(doc(db, "projects", activeProject), {
        color,
        updatedAt: serverTimestamp(),
      });
      toast.show("Project color updated", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "projects");
    }
  };

  const ProjectPicker = () => {
    const activeProj = projects.find((p) => p.id === activeProject);

    return (
      <div className="space-y-4 mb-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              style={{
                backgroundColor:
                  activeProject === p.id
                    ? p.color || "#F5A623"
                    : "rgba(255,255,255,0.05)",
                borderColor:
                  activeProject === p.id
                    ? p.color || "#F5A623"
                    : "rgba(255,255,255,0.05)",
                color: activeProject === p.id ? "#000" : "#888",
              }}
              className={`flex-shrink-0 px-6 py-4 rounded-[2rem] border transition-all flex flex-col gap-1 min-w-[140px] ${
                activeProject === p.id
                  ? "shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                  : "hover:border-white/10"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-60`}
              >
                Project
              </span>
              <span className="font-display font-black text-sm tracking-tight truncate w-full">
                {p.name}
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              const name = prompt("Enter project name:");
              if (name) handleCreateProject(name);
            }}
            className="flex-shrink-0 px-6 py-4 rounded-[2rem] border border-dashed border-white/10 text-white/40 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center min-w-[140px] gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              New
            </span>
          </button>
        </div>

        {activeProj && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-2"
          >
            <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mr-2">
              Theme:
            </span>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleUpdateProjectColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    activeProj.color === c
                      ? "border-white scale-125"
                      : "border-transparent hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const handleCreateProject = async (name: string) => {
    if (!user || !name.trim()) return;
    try {
      const newProj = {
        name: name.trim(),
        userId: user.uid,
        createdAt: Date.now(),
        color: ["#F5A623", "#23F5A6", "#A623F5", "#F523A6"][
          Math.floor(Math.random() * 4)
        ],
      };
      const docRef = await addDoc(collection(db, "projects"), newProj);
      setActiveProject(docRef.id);
      toast.show(`Project "${name}" created`, "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "projects");
    }
  };

  // Sync Active Project to localStorage per user
  useEffect(() => {
    if (user && activeProject) {
      localStorage.setItem(`forge_active_project_${user.uid}`, activeProject);
    }
  }, [activeProject, user]);

  useEffect(() => {
    // Process redirect result if any
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast.show(
            `Signed in as ${result.user.displayName || result.user.email}`,
            "success",
          );
        }
      })
      .catch((error) => {
        if (error && error.code !== "auth/redirect-cancelled-by-user") {
          console.error("Auth redirect error: ", error);
          toast.show(
            `Login issue: ${error.message || "Check connection"}`,
            "error",
          );
        }
      });
  }, []);

  const handleLogin = async () => {
    try {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone);
      const isWebView = navigator.userAgent.includes('wv') || navigator.userAgent.includes('WebView');
      const isCapacitor = Capacitor.isNativePlatform();

      if (isCapacitor || isMobileDevice || isStandalone || isWebView) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Desktop browsers generally handle popups well
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.message.includes('popup')) {
        // Fallback to redirect if popup fails
        await signInWithRedirect(auth, googleProvider);
      } else {
        toast.show(`Login failed: ${error.message}`, "error");
      }
    }
  };

  const handleLoginAnon = async () => {
    try {
      await signInAnonymously(auth);
      toast.show("Signed in as Offline User", "info");
      handleNext();
    } catch (error: any) {
      toast.show(`Offline Login failed: ${error.message}`, "error");
      handleNext();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.show("Signed out successfully", "info");
    } catch (error: any) {
      toast.show(`Logout failed: ${error.message}`, "error");
    }
  };

  const toggleTaskSelection = (id: string) => {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id],
    );
  };

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "Low" | "Medium" | "High"
  >("Medium");
  const [showAddTaskOptions, setShowAddTaskOptions] = useState(false);

  const handleAddTask = async () => {
    if (!user || !newTaskText.trim()) return;
    try {
      await addDoc(collection(db, "tasks"), {
        text: newTaskText.trim(),
        completed: false,
        createdAt: Date.now(),
        priority: newTaskPriority,
        userId: user.uid,
        projectId: activeProject || "default",
      });
      setNewTaskText("");
      setNewTaskPriority("Medium");
      setShowAddTaskOptions(false);
      toast.show("Task added", "success");
    } catch (e) {
      toast.show("Failed to add task", "error");
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      toast.show("Update failed", "error");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "tasks", id));
      setSelectedTasks((prev) => prev.filter((tid) => tid !== id));
      toast.show("Task removed", "info");
    } catch (e) {
      toast.show("Delete failed", "error");
    }
  };

  const handleEditTask = async (id: string, text: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "tasks", id), {
        text,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      toast.show("Edit failed", "error");
    }
  };

  const filteredTasks = tasks
    .filter((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((t) => filterPriority === "All" || t.priority === filterPriority);

  const handleBatchPriority = async (priority: "Low" | "Medium" | "High") => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            priority,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(
        `Priority updated for ${selectedTasks.length} tasks`,
        "success",
      );
    } catch (e) {
      toast.show("Batch priority update failed", "error");
    }
  };

  const handleBatchComplete = async () => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            completed: true,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(`Marked ${selectedTasks.length} tasks as complete`, "success");
    } catch (e) {
      toast.show("Batch update failed", "error");
    }
  };

  const handleBatchDelete = async () => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) => deleteDoc(doc(db, "tasks", id))),
      );
      setSelectedTasks([]);
      toast.show(`Removed ${selectedTasks.length} tasks`, "info");
    } catch (e) {
      toast.show("Batch delete failed", "error");
    }
  };

  const handleBatchCategorize = async (category: string) => {
    if (!user) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            category,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(
        `Categorized ${selectedTasks.length} tasks as ${category}`,
        "success",
      );
    } catch (e) {
      toast.show("Batch categorize failed", "error");
    }
  };

  const handleBatchMove = async (projectId: string) => {
    if (!user || !projectId) return;
    try {
      await Promise.all(
        selectedTasks.map((id) =>
          updateDoc(doc(db, "tasks", id), {
            projectId,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedTasks([]);
      toast.show(
        `Moved ${selectedTasks.length} tasks to selected project`,
        "success",
      );
    } catch (e) {
      toast.show("Batch move failed", "error");
    }
  };

  const handleToggleIntegration = (id: string, isConnecting: boolean) => {
    if (isConnecting) {
      setConnectedIntegrations((prev) => [...new Set([...prev, id])]);
    } else {
      setConnectedIntegrations((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleConnect = async () => {
    if (obdConnected) {
      if (obdRef.current) {
         try {
           await obdRef.current.disconnect();
         } catch(e) {}
         obdRef.current = null;
      }
      setObdConnected(false);
      return;
    }

    try {
      if (obdMode === "Simulated") {
        obdRef.current = new SimulatedObd();
      } else if (obdMode === "Bluetooth") {
        obdRef.current = new WebBluetoothObd();
      } else if (obdMode === "USB") {
        obdRef.current = new WebSerialObd();
      }

      if (!obdRef.current) return;
      
      await obdRef.current.connect();
      setObdConnected(true);
      
      const res = await obdRef.current.sendCommand("ATI");
      setDiagnosticLogs((prev) => [`[sys] RX: ${res}`, ...prev].slice(0, 50));
      
      toast.show(`Connected via ${obdMode}`, "success");
    } catch (err: any) {
      console.error(err);
      obdRef.current = null;
      const msg =
        err.name === "SecurityError"
          ? "Hardware access requires top-level navigation. Open app in new tab."
          : err.message || "Connection failed";
      toast.show(msg, "error");
    }
  };

  const handleDeepDive = (dtc: DTC) => {
    setChatInitialQuery(
      `I'm dealing with DTC ${dtc.code}: ${dtc.description}. Can you provide a diagnostic path, logic, and potential repair procedures for a ${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}?`,
    );
    setChatMode("Diagnostics Lead");
    setCurrentScreen("Chat");
  };

  const handleDiagnosticCommand = async (command: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnosticLogs((prev) =>
      [`[${timestamp}] TX: ${command}`, ...prev].slice(0, 50),
    );

    if (!obdRef.current || !obdRef.current.isConnected()) {
       toast.show("Not connected to vehicle", "error");
       return;
    }

    try {
       const response = await obdRef.current.sendCommand(command);
       const rxTimestamp = new Date().toLocaleTimeString();
       setDiagnosticLogs((prev) =>
         [`[${rxTimestamp}] RX: ${response}`, ...prev].slice(0, 50),
       );

       if (command === "03") {
         if (response.includes("43")) {
           setDetectedDtcs([
             {
               code: "P0133",
               description: "O2 Sensor Circuit Slow Response (Bank 1 Sensor 1) [Simulated]",
               status: "Pending",
             },
           ]);
           toast.show("Diagnostic trouble codes detected", "error");
         }
       }
       if (command === "04") {
         setDetectedDtcs([]);
         toast.show("DTC Memory Cleared", "success");
       }
    } catch (e: any) {
       setDiagnosticLogs((prev) =>
         [`[sys] ERROR: ${e.message}`, ...prev].slice(0, 50),
       );
    }
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setOnboarding((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentScreen === "Vehicles") {
      const parts = [
        onboarding.vehicleYear,
        onboarding.vehicleMake,
        onboarding.vehicleModel,
      ].filter(Boolean);
      const summary =
        parts.length > 0 ? parts.join(" ") : onboarding.vehicleVin || "";
      setOnboarding((prev) => ({ ...prev, vehicleInfo: summary }));
    }
    const sequence: Screen[] = [
      "Welcome",
      "NameAssistant",
      "WakeWord",
      "VoiceClone",
      "AboutYou",
      "ApiKeys",
      "Inventory",
      "Vehicles",
      "Ready",
      "Main",
    ];
    const nextIdx = sequence.indexOf(currentScreen) + 1;
    if (nextIdx < sequence.length) {
      setCurrentScreen(sequence[nextIdx]);
    }
  };

  const handleFinish = async () => {
    const finalData = { ...onboarding, onboardingComplete: true };
    setOnboarding(finalData);

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          ...finalData,
          email: user.email,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Failed to sync profile:", e);
      }
    }

    setCurrentScreen("Main");
    toast.show(`Welcome to Forge, ${finalData.userName}!`, "success");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black selection:bg-primary/30 overflow-hidden hardware-pattern">
      <TopStatusBar />
      <NotificationContainer />
      <div className="flex-1 w-full flex items-center justify-center p-0 lg:p-6 bg-transparent">
        {/* Rugged Scanner Device Container */}
        <div className="w-full h-full lg:max-w-[480px] bg-[#0A0A0A] lg:rounded-[3rem] relative overflow-hidden lg:border-[8px] border-[#1d1d1d] lg:ring-4 ring-[#0f0f0f] shadow-[0_0_100px_-10px_rgba(245,166,35,0.15),inset_0_0_0_1px_rgba(255,255,255,0.05)] flex flex-col dotted-pattern">
          {/* Hardware Header accents */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-40 hidden lg:block" />

          <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-2 lg:pt-4">
            <AnimatePresence mode="wait">
              {currentScreen === "Welcome" && (
                <WelcomeScreen
                  key="welcome"
                  onNext={handleNext}
                  onLogin={handleLogin}
                  onLoginAnon={handleLoginAnon}
                />
              )}

              {currentScreen === "NameAssistant" && (
                <SetupScreen
                  key="name"
                  title="Name your assistant"
                  subtitle="What should I call your digital spark?"
                  icon={Sparkles}
                  placeholder="e.g. Ember, Forge, Spark"
                  value={onboarding.assistantName}
                  onChange={(v) => updateData("assistantName", v)}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "WakeWord" && (
                <SetupScreen
                  key="wake"
                  title="Pick a wake word"
                  subtitle="The word that commands my attention."
                  icon={Cpu}
                  placeholder="e.g. Hey Forge, Ember..."
                  value={onboarding.wakeWord}
                  onChange={(v) => updateData("wakeWord", v)}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "VoiceClone" && (
                <VoiceCloneScreen
                  key="voiceclone"
                  onNext={handleNext}
                  value={onboarding.customVoiceEnabled}
                  onChange={(val) => updateData("customVoiceEnabled", val)}
                  onUrlChange={(url) => updateData("customVoiceUrl", url)}
                />
              )}

              {currentScreen === "AboutYou" && (
                <SetupScreen
                  key="user"
                  title="Who are you?"
                  subtitle="I want to know who I'm forging for."
                  icon={User}
                  placeholder="Your name"
                  value={onboarding.userName}
                  onChange={(v) => updateData("userName", v)}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "ApiKeys" && (
                <ApiKeysSetupScreen
                  key="api"
                  value={onboarding.apiKey}
                  onChange={(v) => updateData("apiKey", v)}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "Inventory" && (
                <SetupScreen
                  key="inventory"
                  title="Your Toolbox"
                  subtitle="What tools, gear, or tech stack do you have?"
                  icon={Wrench}
                  placeholder="e.g. Socket set, DeWalt drills, React/Node..."
                  value={onboarding.inventory}
                  onChange={(v) => updateData("inventory", v)}
                  onNext={handleNext}
                  optional={true}
                />
              )}

              {currentScreen === "Vehicles" && (
                <VehicleSetupScreen
                  key="vehicles"
                  onboarding={onboarding}
                  updateData={updateData}
                  onNext={handleNext}
                />
              )}

              {currentScreen === "Ready" && (
                <ReadyScreen key="ready" onFinish={handleFinish} />
              )}

              {currentScreen === "Main" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col h-full p-8"
                >
                  <header className="flex justify-between items-start mb-10 pt-8 px-2 relative">
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#F5A623]" />
                        <h1 className="text-text-dim text-[10px] font-black uppercase tracking-[0.3em]">
                          System.Awaiting_Input
                        </h1>
                      </div>
                      <h2 className="text-4xl font-black text-text-primary tracking-tight font-display leading-none">
                        Engineering Hub
                      </h2>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          Operator: {onboarding.assistantName}
                        </span>
                        <span className="text-[9px] font-mono text-primary/60 uppercase tracking-widest">
                          {onboarding.vehicleYear} {onboarding.vehicleMake}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentScreen("Index")}
                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors mr-2"
                      >
                        <BookOpen className="w-5 h-5 text-white/60" />
                      </button>
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-card/40 shadow-inner group transition-all ${isOnline ? "text-success" : "text-error"}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-success shadow-[0_0_10px_#4CAF50]" : "bg-error shadow-[0_0_10px_#E53935]"}`}
                          />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">
                            {isOnline ? "Active_Link" : "Offline"}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${projects.find((p) => p.id === activeProject)?.color || "#F5A623"}, rgba(0,0,0,0.5))`,
                          borderColor: `${projects.find((p) => p.id === activeProject)?.color || "#F5A623"}44`,
                        }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-black border shadow-[0_10px_20px_rgba(0,0,0,0.4)] relative group transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                        onClick={() => setCurrentScreen("NameAssistant")}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        <User className="w-6 h-6" />
                      </div>
                    </div>
                  </header>

                  <ProjectPicker />

                  <div className="space-y-6 pb-24">
                    {/* Connection Settings */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black border border-white/10 rounded-2xl p-4 shadow-xl">
                        <span className="block text-[9px] text-white/40 uppercase tracking-widest mb-2 font-mono">
                          Hardware Interface
                        </span>
                        <select
                          value={obdMode}
                          onChange={(e) => setObdMode(e.target.value as any)}
                          className="w-full bg-white/5 border border-white/5 rounded-lg text-xs px-3 py-2 text-white outline-none font-bold uppercase tracking-wider"
                        >
                          <option value="Simulated">Simulated Demo</option>
                          <option value="Bluetooth">Bluetooth / BLE (ELM327/vLinker/Veepeak)</option>
                          <option value="USB">USB OTG Cable</option>
                        </select>
                        <p className="text-[10px] text-white/40 mt-3 font-mono leading-relaxed">
                          Bluetooth Classic (Standard ELM327) and BLE devices are supported in-browser. 
                          You can also run <strong className="text-primary/70">Torque Pro</strong> or <strong className="text-primary/70">RepairSolutions2</strong> natively and sync data via the Integrations screen or by exporting CSV logs from the Terminal.
                        </p>
                      </div>
                      <div className="flex-1 bg-black border border-white/10 rounded-2xl p-4 shadow-xl">
                        <span className="block text-[9px] text-white/40 uppercase tracking-widest mb-2 font-mono">
                          Vehicle Protocol
                        </span>
                        <select
                          value={onboarding.vehicleProtocol}
                          onChange={(e) =>
                            updateData("vehicleProtocol", e.target.value)
                          }
                          className="w-full bg-white/5 border border-white/5 rounded-lg text-xs px-3 py-2 text-white outline-none font-bold uppercase tracking-wider"
                        >
                          <option value="Auto">Auto Detect</option>
                          <option value="ISO 15765-4 (CAN 11/500)">
                            CAN 11/500
                          </option>
                          <option value="ISO 15765-4 (CAN 29/500)">
                            CAN 29/500
                          </option>
                          <option value="ISO 14230-4 (KWP FAST)">
                            KWP FAST
                          </option>
                          <option value="ISO 9141-2">ISO 9141-2</option>
                          <option value="SAE J1850 PWM">J1850 PWM</option>
                          <option value="SAE J1850 VPW">J1850 VPW</option>
                        </select>
                      </div>
                    </div>

                    {/* Primary OBD Hub */}
                    <div className="bg-black border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-4 font-mono">
                        {obdConnected ? "Link Active" : "No Connection"}
                      </p>

                      <button
                        onClick={handleConnect}
                        className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 transition-all ${
                          obdConnected
                            ? "bg-green-500/20 text-green-500 border border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                            : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 shadow-[0_0_30px_rgba(245,166,35,0.15)] hover:shadow-[0_0_50px_rgba(245,166,35,0.3)]"
                        }`}
                      >
                        {obdConnected ? (
                          <Wifi className="w-10 h-10 mb-1" />
                        ) : (
                          <Zap className="w-10 h-10 mb-1" />
                        )}
                        <span className="text-xl font-black uppercase tracking-widest leading-none">
                          {obdConnected ? "Connected" : "Connect"}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest opacity-60">
                          {obdConnected
                            ? onboarding.vehicleProtocol
                            : "to Vehicle"}
                        </span>
                      </button>

                      {obdConnected && (
                        <div className="flex w-full items-center justify-between mt-6 pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-white/40 uppercase tracking-widest">
                              Voltage
                            </span>
                            <span className="text-sm font-bold text-white font-mono">
                              13.8V
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] text-white/40 uppercase tracking-widest">
                              Protocol
                            </span>
                            <span className="text-sm font-bold text-white font-mono">
                              {onboarding.vehicleProtocol || "CAN 11-bit"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Forge Expert Team Area */}
                    <div className="bg-gradient-to-b from-surface to-card rounded-[2.5rem] p-8 border border-border/40 relative overflow-hidden group shadow-lg">
                      <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-30">
                        <Sparkles className="text-primary w-8 h-8" />
                      </div>

                      <div className="flex flex-col items-center text-center py-4 relative z-10">
                        <div className="relative mb-6">
                          <motion.div
                            animate={{
                              scale: [1, 1.4, 1],
                              opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="absolute inset-[-30px] bg-primary/20 rounded-full blur-2xl"
                          />
                          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-primary/20 shadow-[inset_0_2px_15px_rgba(245,166,35,0.1)] z-10 relative">
                            <Cpu className="text-primary w-8 h-8" />
                          </div>
                        </div>

                        <p className="text-[10px] text-text-dim uppercase tracking-[0.3em] font-mono mb-6">
                          Forge Team: Synchronized
                        </p>

                        <h3 className="font-display font-black text-4xl mb-2 text-text-primary tracking-tight">
                          Expert Network
                        </h3>
                        <p className="text-text-secondary text-xs mb-10 tracking-widest uppercase opacity-60">
                          Select Specialist for Consultation
                        </p>

                        <div className="flex gap-3 w-full">
                          <button
                            onClick={() => setCurrentScreen("Chat")}
                            className="flex-1 bg-primary text-black py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(245,166,35,0.2)] hover:shadow-[0_15px_30px_rgba(245,166,35,0.4)] active:scale-95 flex-col"
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> Operations
                            </div>
                            <span className="text-[9px] opacity-70 tracking-wider">
                              General AI Hub
                            </span>
                          </button>
                          <button
                            onClick={() => setCurrentScreen("Diagnostics")}
                            className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 flex-col"
                          >
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4" /> Terminal
                            </div>
                            <span className="text-[9px] text-text-dim tracking-wider">
                              OBD Diagnostics
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        {
                          mode: "Diagnostics Lead",
                          icon: Wrench,
                          color: "primary",
                          desc: "DTC Analysis & Repair Paths",
                        },
                        {
                          mode: "Performance Tuner",
                          icon: Activity,
                          color: "blue-500",
                          desc: "Live Data & Mapping",
                        },
                        {
                          mode: "Electrical Eng.",
                          icon: Zap,
                          color: "emerald-500",
                          desc: "Wiring & Module Coding",
                        },
                        {
                          mode: "Estimator",
                          icon: Calculator,
                          color: "purple-500",
                          desc: "Labor & Parts Pricing",
                        },
                      ].map((m) => (
                        <button
                          key={m.mode}
                          onClick={() => {
                            setChatMode(m.mode as AssistantMode);
                            setCurrentScreen("Chat");
                          }}
                          className="bg-card/40 p-5 rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all flex items-start flex-col gap-3 active:scale-95 group text-left"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors`}
                          >
                            <m.icon
                              className={`w-5 h-5 text-${m.color === "primary" ? "primary" : m.color}`}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-white uppercase tracking-widest leading-none">
                              {m.mode}
                            </span>
                            <span className="text-[9px] mt-2 font-mono text-text-dim uppercase tracking-widest">
                              {m.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Mobile Installation & APK Deployment Card */}
                    <div className="mb-6 p-6 bg-primary/10 border border-primary/20 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap className="w-12 h-12 text-primary" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <Car className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Mobile Deployment
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                          Run as Android App
                        </h4>
                        <p className="text-[10px] text-text-dim leading-relaxed uppercase tracking-wider mb-4">
                          No Fees. No App Store. Full Hardware Access.
                        </p>

                        <div className="space-y-4">
                          {/* GitHub Option */}
                          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 space-y-3">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                Option A: Professional GitHub Build
                              </span>
                            </div>
                            <p className="text-[9px] text-text-dim leading-relaxed uppercase tracking-wider">
                              The automated build engine is active. Check your
                              GitHub repository <b>Actions</b> tab for the
                              finished APK artifact.
                            </p>
                          </div>

                          {/* PWABuilder Option */}
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                              <Layers className="w-3 h-3 text-text-dim" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">
                                Option B: Web Bundler
                              </span>
                            </div>
                            <p className="text-[9px] text-text-dim leading-relaxed uppercase tracking-wider">
                              Use PWABuilder.com to bundle this URL into an
                              Android package manually.
                            </p>
                            <div className="flex items-center gap-2 p-2 bg-black/60 rounded-xl border border-white/10 overflow-hidden">
                              <code className="text-[9px] text-primary font-mono truncate flex-1">
                                https://ais-pre-xhgeaqcs5ry32eqncav2st-491297065011.us-west2.run.app
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    "https://ais-pre-xhgeaqcs5ry32eqncav2st-491297065011.us-west2.run.app",
                                  );
                                  toast.show("URL Copied", "success");
                                }}
                                className="bg-primary/20 text-primary p-1.5 rounded-lg hover:bg-primary/30 transition-colors"
                              >
                                <Layers className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Direct Install Option */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                1
                              </div>
                              <span className="text-[10px] text-text-primary uppercase tracking-widest">
                                Chrome Android
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                2
                              </div>
                              <span className="text-[10px] text-text-primary uppercase tracking-widest">
                                "Install App"
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors flex flex-col justify-between">
                        <div>
                          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70">
                            <Car className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-text-primary text-sm mb-1">
                            Vehicle Status
                          </h4>
                          <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                            {onboarding.vehicleInfo || "No vehicle set"}
                          </p>
                          <p className="text-[9px] text-primary/60 font-black uppercase tracking-widest mt-1">
                            {onboarding.vehicleProtocol}
                          </p>
                        </div>
                        {onboarding.vehicleVin && (
                          <p className="text-[9px] text-text-dim font-mono tracking-tighter opacity-40 mt-2 truncate">
                            VIN: {onboarding.vehicleVin}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setCurrentScreen("Inventory")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Toolbox
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          {inventory.length > 0
                            ? `${inventory.length} Items Sync'd`
                            : "Empty • Add Tools"}
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("Diagnostics")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Activity className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <Terminal className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Diagnostic Log
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          {obdConnected
                            ? "OBD Dynamic Stream"
                            : "Offline • ELM327"}
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("Integrations")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Database className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          3rd Party APIs
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          {connectedIntegrations.length > 0
                            ? `${connectedIntegrations.length} Active Hooks`
                            : "Sync Offline Tools"}
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("Estimator")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Calculator className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <Calculator className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Service Estimator
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          Parts & Labor Quotes
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("Analytics")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <BarChart3 className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Shop Analytics
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          Perf & Utilization
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("Topology")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Zap className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <Zap className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Network Topology
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          CAN-Bus Health
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("GuidedDiagnostics")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Test Plans
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          Guided Diag
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("Oscilloscope")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Activity className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <Activity className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Lab Scope
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          Signal Analysis
                        </p>
                      </button>

                      <button
                        onClick={() => setCurrentScreen("WiringDiagrams")}
                        className="bg-[#151619] p-5 rounded-3xl border border-white/5 shadow-2xl hover:border-primary/30 transition-colors text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Layers className="w-8 h-8" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mb-3 text-primary/70 group-hover:bg-primary/10 transition-colors">
                          <Layers className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-text-primary text-sm mb-1">
                          Schematics
                        </h4>
                        <p className="text-text-secondary text-xs truncate max-w-full font-mono">
                          Wiring Diagrams
                        </p>
                      </button>
                    </div>

                    {/* Tasks Section */}
                    <div className="bg-[#151619] rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden">
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex flex-col">
                            <h3 className="font-display font-bold text-lg text-text-primary">
                              Action Items
                            </h3>
                            {selectedTasks.length > 0 && (
                              <span className="text-[10px] text-primary/60 font-mono uppercase tracking-widest mt-0.5">
                                {selectedTasks.length} Selected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {filteredTasks.length > 0 && (
                              <button
                                onClick={() => {
                                  const allVisibleIds = filteredTasks.map(
                                    (t) => t.id,
                                  );
                                  const allSelected = allVisibleIds.every(
                                    (id) => selectedTasks.includes(id),
                                  );
                                  if (allSelected) {
                                    setSelectedTasks((prev) =>
                                      prev.filter(
                                        (id) => !allVisibleIds.includes(id),
                                      ),
                                    );
                                  } else {
                                    setSelectedTasks((prev) =>
                                      Array.from(
                                        new Set([...prev, ...allVisibleIds]),
                                      ),
                                    );
                                  }
                                }}
                                className="text-[10px] font-mono text-text-dim hover:text-primary transition-colors uppercase tracking-widest"
                              >
                                {filteredTasks.every((t) =>
                                  selectedTasks.includes(t.id),
                                )
                                  ? "Deselect All"
                                  : "Select Visible"}
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {tasks.filter((t) => !t.completed).length} Pending
                            </span>
                          </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex gap-2 px-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder="Search tasks..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-primary/30 transition-all"
                            />
                          </div>
                          <select
                            value={filterPriority}
                            onChange={(e) =>
                              setFilterPriority(e.target.value as any)
                            }
                            className="bg-white/5 border border-white/5 rounded-xl px-2 py-2 text-[10px] text-text-dim outline-none uppercase tracking-widest"
                          >
                            <option value="All">All Levels</option>
                            <option value="High">High Only</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                      </div>

                      {selectedTasks.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="mb-6 p-4 bg-surface border rounded-[2rem] shadow-xl overflow-hidden"
                          style={{
                            borderColor: `${projects.find((p) => p.id === activeProject)?.color || "#F5A623"}55`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">
                              Batch Protocol
                            </span>
                            <button
                              onClick={() => setSelectedTasks([])}
                              className="text-text-dim hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex gap-2 mb-4">
                            <button
                              onClick={handleBatchComplete}
                              style={{
                                backgroundColor:
                                  projects.find((p) => p.id === activeProject)
                                    ?.color || "#F5A623",
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-black rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Done
                            </button>
                            <button
                              onClick={handleBatchDelete}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black rounded-xl text-[11px] font-black uppercase tracking-wider border border-red-500/20 hover:border-red-500 transition-all active:scale-95 shadow-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Purge
                            </button>
                          </div>

                          <div className="space-y-4 pt-1">
                            <div>
                              <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-text-dim mb-2 ml-1">
                                Priority Shift
                              </p>
                              <div className="flex gap-1.5">
                                {(["Low", "Medium", "High"] as const).map(
                                  (p) => (
                                    <button
                                      key={p}
                                      onClick={() => handleBatchPriority(p)}
                                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all active:scale-95 ${
                                        p === "High"
                                          ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                                          : p === "Medium"
                                            ? "bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white"
                                            : "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-text-dim mb-2 ml-1">
                                Classification
                              </p>
                              <div className="grid grid-cols-4 gap-1.5">
                                {["Parts", "Labor", "Planning", "Code"].map(
                                  (cat) => (
                                    <button
                                      key={cat}
                                      onClick={() => handleBatchCategorize(cat)}
                                      className="py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] text-white/40 hover:text-primary font-mono uppercase tracking-widest border border-white/5 transition-all active:scale-95"
                                    >
                                      {cat}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-text-dim mb-2 ml-1">
                                Reassign Project
                              </p>
                              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {projects
                                  .filter((p) => p.id !== activeProject)
                                  .map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleBatchMove(p.id)}
                                      className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] text-text-dim hover:text-white font-bold uppercase tracking-widest border border-white/5 transition-all active:scale-95"
                                    >
                                      {p.name}
                                    </button>
                                  ))}
                                {projects.length <= 1 && (
                                  <p className="text-[8px] text-text-dim italic ml-1">
                                    No other projects available
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto no-scrollbar">
                        {(() => {
                          if (filteredTasks.length === 0) {
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-10 px-4"
                              >
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                  <CheckCircle2 className="w-8 h-8 text-white/20" />
                                </div>
                                <h4 className="text-sm font-bold text-text-primary mb-1">
                                  {searchQuery || filterPriority !== "All"
                                    ? "No matches found"
                                    : "No tasks yet"}
                                </h4>
                                <p className="text-[11px] text-text-dim uppercase tracking-widest leading-relaxed">
                                  {searchQuery || filterPriority !== "All"
                                    ? "Try adjusting your search or filters"
                                    : "Your project is currently clear."}
                                </p>
                              </motion.div>
                            );
                          }

                          return (
                            <AnimatePresence initial={false}>
                              {filteredTasks.map((task) => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  selected={selectedTasks.includes(task.id)}
                                  onSelect={() => toggleTaskSelection(task.id)}
                                  onToggle={() => handleToggleTask(task)}
                                  onDelete={() => handleDeleteTask(task.id)}
                                  onEdit={(newText) =>
                                    handleEditTask(task.id, newText)
                                  }
                                  themeColor={
                                    projects.find((p) => p.id === activeProject)
                                      ?.color
                                  }
                                />
                              ))}
                            </AnimatePresence>
                          );
                        })()}
                      </div>

                      <div className="relative space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add an action item..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onFocus={() => setShowAddTaskOptions(true)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddTask();
                            }}
                            className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-text-primary outline-none focus:border-primary/40 transition-all placeholder:text-text-dim/50"
                          />
                          <button
                            onClick={handleAddTask}
                            disabled={!newTaskText.trim()}
                            className="p-4 bg-primary text-black rounded-2xl disabled:opacity-30 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.2)]"
                          >
                            <ArrowUp className="w-5 h-5 flex-shrink-0" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {(showAddTaskOptions || newTaskText.trim()) && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-2 px-1"
                            >
                              <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                                {(["Low", "Medium", "High"] as const).map(
                                  (p) => (
                                    <button
                                      key={p}
                                      onClick={() => setNewTaskPriority(p)}
                                      className={`px-3 py-1 rounded-md text-[9px] uppercase tracking-widest font-bold transition-all ${
                                        newTaskPriority === p
                                          ? p === "High"
                                            ? "bg-red-500 text-white"
                                            : p === "Medium"
                                              ? "bg-orange-500 text-white"
                                              : "bg-blue-500 text-white"
                                          : "text-text-dim hover:bg-white/5"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ),
                                )}
                              </div>
                              <button
                                onClick={() => setShowAddTaskOptions(false)}
                                className="text-[9px] text-text-dim hover:text-white uppercase tracking-widest font-mono ml-auto"
                              >
                                Cancel
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div
                      style={{
                        background: `linear-gradient(to right, ${projects.find((p) => p.id === activeProject)?.color || "#F5A623"}1A, transparent)`,
                        borderColor: `${projects.find((p) => p.id === activeProject)?.color || "#F5A623"}33`,
                      }}
                      className="p-6 rounded-[2rem] border flex items-center justify-between group focus-within:ring-1 transition-all mt-4 mb-16"
                    >
                      <div className="flex items-center gap-5 flex-1">
                        <div
                          style={{
                            backgroundColor: `${projects.find((p) => p.id === activeProject)?.color || "#F5A623"}33`,
                            color:
                              projects.find((p) => p.id === activeProject)
                                ?.color || "#F5A623",
                          }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                        >
                          <Calculator className="w-6 h-6" />
                        </div>
                        <div className="flex-1 pr-4">
                          <h4 className="font-bold text-text-primary text-[15px] tracking-wide mb-2 flex justify-between items-center">
                            Project Roadmap
                            <span className="text-[10px] opacity-60 font-mono">
                              {tasks.length > 0
                                ? `${Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}%`
                                : "0%"}
                            </span>
                          </h4>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width:
                                  tasks.length > 0
                                    ? `${(tasks.filter((t) => t.completed).length / tasks.length) * 100}%`
                                    : 0,
                              }}
                              style={{
                                backgroundColor:
                                  projects.find((p) => p.id === activeProject)
                                    ?.color || "#F5A623",
                              }}
                              className="absolute top-0 left-0 h-full shadow-[0_0_10px_rgba(245,166,35,0.3)]"
                            />
                          </div>
                          <p className="text-text-dim text-[9px] uppercase tracking-widest mt-2 flex justify-between">
                            <span>{tasks.length} Objectives</span>
                            <span>
                              {tasks.filter((t) => t.completed).length} Resolved
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto mb-4 flex justify-between items-center pt-8 border-t border-border/20">
                    <button
                      onClick={() => {
                        handleLogout();
                        localStorage.removeItem(
                          `forge_active_project_${user?.uid}`,
                        );
                        localStorage.removeItem("forge_chat");
                        window.location.reload();
                      }}
                      className="text-text-dim text-xs uppercase tracking-widest hover:text-primary transition-colors"
                    >
                      System Reset
                    </button>
                    <p className="text-text-dim text-[10px] uppercase tracking-widest opacity-30">
                      Forge v0.0.1
                    </p>
                  </div>
                </motion.div>
              )}

              {currentScreen === "Chat" &&
                (!user ? (
                  <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#050505] hardware-pattern p-8 text-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center text-red-500 mb-2">
                      <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">
                      Authentication Required
                    </h3>
                    <p className="text-sm font-mono text-white/50 leading-relaxed max-w-sm">
                      Neural_Sync is offline. Please sign in via the Engineering
                      Hub (Home tab) to access Forge AI and cloud
                      synchronization.
                    </p>
                    <button
                      onClick={() => setCurrentScreen("Main")}
                      className="mt-6 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-primary/80 transition-colors"
                    >
                      Return to Hub
                    </button>
                  </div>
                ) : activeProject ? (
                  <ChatScreen
                    key="chat"
                    onBack={() => setCurrentScreen("Main")}
                    onboarding={onboarding}
                    initialMode={chatMode}
                    activeProject={activeProject}
                    user={user}
                    inventory={inventory}
                    initialQuery={chatInitialQuery}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#050505] hardware-pattern gap-4 p-8 text-center">
                    <div className="text-primary text-sm flex items-center gap-3 font-mono border border-primary/20 p-4 rounded-full bg-primary/5 mb-4">
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      INITIALIZING WORKSPACE...
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                      Select or create a project in the Hub first.
                    </p>
                    <button
                      onClick={() => setCurrentScreen("Main")}
                      className="mt-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Return to Hub
                    </button>
                  </div>
                ))}

              {currentScreen === "Inventory" && user && (
                <InventoryScreen
                  onBack={() => setCurrentScreen("Main")}
                  inventory={inventory}
                  user={user}
                />
              )}

              {currentScreen === "Diagnostics" && (
                <DiagnosticScreen
                  onBack={() => setCurrentScreen("Main")}
                  connected={obdConnected}
                  dtcs={detectedDtcs}
                  onCommand={handleDiagnosticCommand}
                  onDeepDive={handleDeepDive}
                />
              )}

              {currentScreen === "LiveData" && (
                <LiveDataScreen
                  onBack={() => setCurrentScreen("Main")}
                  telemetry={telemetry}
                />
              )}

              {currentScreen === "Coding" && (
                <CodingScreen
                  onBack={() => setCurrentScreen("Main")}
                  onCommand={handleDiagnosticCommand}
                />
              )}

              {currentScreen === "Terminal" && (
                <TerminalScreen
                  onBack={() => setCurrentScreen("Main")}
                  onCommand={handleDiagnosticCommand}
                  logs={diagnosticLogs}
                />
              )}

              {currentScreen === "Integrations" && (
                <IntegrationsScreen
                  onBack={() => setCurrentScreen("Main")}
                  connectedIds={connectedIntegrations}
                  onToggleConnection={handleToggleIntegration}
                />
              )}

              {currentScreen === "Estimator" && (
                <EstimatorScreen
                  onBack={() => setCurrentScreen("Main")}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "Topology" && (
                <TopologyScreen onBack={() => setCurrentScreen("Main")} />
              )}

              {currentScreen === "Analytics" && (
                <AnalyticsScreen onBack={() => setCurrentScreen("Main")} />
              )}

              {currentScreen === "GuidedDiagnostics" && (
                <GuidedDiagnosticsScreen
                  onBack={() => setCurrentScreen("Main")}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "Oscilloscope" && (
                <OscilloscopeScreen
                  onBack={() => setCurrentScreen("Main")}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "WiringDiagrams" && (
                <WiringDiagramsScreen
                  onBack={() => setCurrentScreen("Main")}
                  vehicle={`${onboarding.vehicleYear} ${onboarding.vehicleMake} ${onboarding.vehicleModel}`}
                />
              )}

              {currentScreen === "Index" && (
                <IndexScreen onBack={() => setCurrentScreen("Main")} />
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Navigation */}
          {["Main", "Diagnostics", "LiveData", "Coding", "Terminal"].includes(
            currentScreen,
          ) &&
            user && (
              <BottomNavBar
                currentTab={currentScreen}
                onTabSelect={(id) => setCurrentScreen(id as Screen)}
              />
            )}
        </div>
      </div>
    </div>
  );
}

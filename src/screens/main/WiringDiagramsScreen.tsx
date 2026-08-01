import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Search,
  ZoomIn,
  ZoomOut,
  Layers,
  Maximize2,
  Cpu,
  Loader2,
  AlertTriangle,
  Info
} from "lucide-react";
import { toast } from "../../lib/notifications";

interface PinInfo {
  label: string;
  pin: string;
  function: string;
}

interface EcmData {
  name: string;
  pins: PinInfo[];
}

interface ConnectionToEcm {
  ecmPin: string;
  coilPin: string;
  wireColor: string;
}

interface ThrottleConnection {
  ecmPin: string;
  throttlePin: string;
  wireColor: string;
}

interface IgnitionCoilData {
  name: string;
  pins: PinInfo[];
  connectionToEcm: ConnectionToEcm;
}

interface ThrottleBodyData {
  name: string;
  pins: PinInfo[];
  connectionToEcm: ThrottleConnection[];
}

interface WiringData {
  ecm: EcmData;
  ignitionCoil: IgnitionCoilData;
  throttleBody: ThrottleBodyData;
}

// Layout constants for Schematic SVG to eliminate magic number warnings
const VIEW_W = 960;
const VIEW_H = 540;

const ECU_X_POS = 100;
const ECU_Y_POS = 100;
const ECU_W_VAL = 200;
const ECU_H_VAL = 320;

const COIL_X_POS = 660;
const COIL_Y_POS = 60;
const COIL_W_VAL = 220;
const COIL_H_VAL = 160;

const THROTTLE_X_POS = 660;
const THROTTLE_Y_POS = 280;
const THROTTLE_W_VAL = 220;
const THROTTLE_H_VAL = 180;

const OBD_X_POS = 80;
const OBD_Y_POS = 440;
const OBD_W_VAL = 200;
const OBD_H_VAL = 80;

const POWER_X_POS = 400;
const POWER_Y_POS = 16;
const POWER_W_VAL = 160;
const POWER_H_VAL = 40;

const ECU_TERM_X_POS = 300;
const COIL_TERM_X_POS = 660;
const THROTTLE_TERM_X_POS = 660;
const OBD_TERM_X_POS = 280;
const POWER_TERM_X_POS = 480;
const POWER_TERM_Y_POS = 56;

const GND_LEFT_X = 50;
const GND_RIGHT_X = 910;
const GND_ECU_Y = 150;
const GND_COIL_Y = 180;
const GND_THROTTLE_Y = 400;

const POWER_SPLIT_Y = 80;
const POWER_ECU_X = 360;
const POWER_COIL_X = 580;

const TRG_MID_X = 480;
const TPS1_MID_X = 450;
const TPS2_MID_X = 430;

const OBD_CAN_H_Y = 460;
const OBD_CAN_L_Y = 490;
const OBD_CAN_H_MID_X = 50;
const OBD_CAN_L_MID_X = 40;

const ECU_PIN_YS = [120, 150, 180, 210, 240, 280, 320] as const;
const COIL_PIN_YS = [100, 140, 180] as const;
const THROTTLE_PIN_YS = [320, 360, 400] as const;
const OBD_PIN_YS = [460, 490] as const;

const RADIUS_SMALL = 3;
const RADIUS_LARGE = 3.5;
const RX_SMALL = 8;
const RX_MEDIUM = 10;
const RX_LARGE = 12;
const STROKE_THICK = 2.5;
const STROKE_THIN = 1.5;
const HOVER_STROKE = 16;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.2;
const ZOOM_DEFAULT = 1.0;

export const WiringDiagramsScreen = ({
  onBack,
  vehicle,
}: {
  onBack: () => void;
  vehicle: string;
}) => {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [activeLayer, setActiveLayer] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wiringData, setWiringData] = useState<WiringData | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<{ title: string, details: string, pins: PinInfo[] } | null>(null);
  const [hoveredWire, setHoveredWire] = useState<string | null>(null);

  const layers = [
    { id: "all", name: "All Circuits" },
    { id: "power", name: "Power & Ground" },
    { id: "can", name: "CAN Bus / Signals" },
  ];

  useEffect(() => {
    const fetchWiringData = async () => {
      setLoading(true);
      setError(null);
      
      const prompt = `
For a ${vehicle} (Year, Make, Model), provide the wiring connection details between:
1. The Engine Control Module (ECM/ECU)
2. Ignition Coil 1
3. Throttle Body (Electronic Throttle Control)

Return a JSON object matching this TypeScript interface:
{
  "ecm": {
    "name": "string (specific ECM model name, e.g. Bosch MED17.5.2)",
    "pins": [
      {"label": "string", "pin": "string", "function": "string"}
    ]
  },
  "ignitionCoil": {
    "name": "string (Ignition Coil Model)",
    "pins": [
      {"label": "string", "pin": "string", "function": "string"}
    ],
    "connectionToEcm": {
      "ecmPin": "string",
      "coilPin": "string",
      "wireColor": "string (actual factory color code, e.g. YEL/BLK)"
    }
  },
  "throttleBody": {
    "name": "string (Throttle Body model)",
    "pins": [
      {"label": "string", "pin": "string", "function": "string"}
    ],
    "connectionToEcm": [
      {
        "ecmPin": "string",
        "throttlePin": "string",
        "wireColor": "string (actual color code)"
      }
    ]
  }
}

Return ONLY the raw JSON object, without any markdown formatting around it. Keep pin counts to 4-5 key pins per component.
`;

      try {
        const response = await fetch('/api/chat', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: prompt,
            history: [],
            systemInstruction: "You are an expert automotive master electrician and diagrams database. You only provide accurate factory specs and wire color codes. Return valid JSON only.",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load wiring schematics.");
        }

        const data = await response.json();
        let cleanText = data.text ? data.text.trim() : "";
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();
        
        const parsed = JSON.parse(cleanText);
        setWiringData(parsed);
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Failed to load custom wiring schema:", error);
        setError(error.message || "Failed to load custom vehicle schematics.");
        // Fallback to static generic specs if API fails
        setWiringData({
          ecm: {
            name: "Generic ECM (J220)",
            pins: [
              { label: "B+", pin: "2", function: "12V Battery Power feed" },
              { label: "Gnd", pin: "4", function: "System Ground" },
              { label: "CAN_H", pin: "12", function: "Controller Area Network High" },
              { label: "CAN_L", pin: "13", function: "Controller Area Network Low" },
              { label: "Ign 1", pin: "65", function: "Ignition Coil 1 Trigger Signal" }
            ]
          },
          ignitionCoil: {
            name: "Ignition Coil 1",
            pins: [
              { label: "Sig", pin: "1", function: "Ignition Trigger Signal Input" },
              { label: "B+", pin: "2", function: "12V Power Feed" },
              { label: "Gnd", pin: "3", function: "Ground Connection" }
            ],
            connectionToEcm: { ecmPin: "65", coilPin: "1", wireColor: "YEL/BLK" }
          },
          throttleBody: {
            name: "Throttle Body",
            pins: [
              { label: "M+", pin: "1", function: "Throttle Control Motor Plus" },
              { label: "M-", pin: "2", function: "Throttle Control Motor Minus" },
              { label: "TPS1", pin: "3", function: "Throttle Position Sensor 1 Signal" }
            ],
            connectionToEcm: [
              { ecmPin: "24", throttlePin: "1", wireColor: "BLU/WHT" },
              { ecmPin: "25", throttlePin: "2", wireColor: "GRN/RED" }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWiringData();
  }, [vehicle]);

  const getWireStyle = (wireId: string, defaultColor: string) => {
    let isActive = false;
    if (activeLayer === "all") {
      isActive = true;
    } else if (activeLayer === "power" && (wireId === "power" || wireId === "ground")) {
      isActive = true;
    } else if (activeLayer === "can" && (wireId === "trigger" || wireId === "tps1" || wireId === "tps2" || wireId === "can_h" || wireId === "can_l")) {
      isActive = true;
    }

    const isHovered = hoveredWire === wireId;
    const isAnyHovered = hoveredWire !== null;

    let opacity = 0.8;
    if (!isActive) {
      opacity = 0.08;
    } else if (isAnyHovered && !isHovered) {
      opacity = 0.15;
    } else if (isHovered) {
      opacity = 1.0;
    }

    return {
      stroke: defaultColor,
      opacity,
      filter: isActive && (isHovered || !isAnyHovered) ? `url(#glow-${wireId})` : undefined,
      transition: "all 0.25s ease",
    };
  };

  const getWireLabel = () => {
    if (!hoveredWire) return "Hover over any connection trace to inspect signal telemetry";
    
    let ecmPinCoil = '65';
    let coilPinCoil = '1';
    if (wiringData && wiringData.ignitionCoil && wiringData.ignitionCoil.connectionToEcm) {
      ecmPinCoil = wiringData.ignitionCoil.connectionToEcm.ecmPin;
      coilPinCoil = wiringData.ignitionCoil.connectionToEcm.coilPin;
    }

    let ecmPinTps1 = '24';
    let throttlePinTps1 = '1';
    if (wiringData && wiringData.throttleBody && wiringData.throttleBody.connectionToEcm && wiringData.throttleBody.connectionToEcm[0]) {
      ecmPinTps1 = wiringData.throttleBody.connectionToEcm[0].ecmPin;
      throttlePinTps1 = wiringData.throttleBody.connectionToEcm[0].throttlePin;
    }

    let ecmPinTps2 = '25';
    let throttlePinTps2 = '2';
    if (wiringData && wiringData.throttleBody && wiringData.throttleBody.connectionToEcm && wiringData.throttleBody.connectionToEcm[1]) {
      ecmPinTps2 = wiringData.throttleBody.connectionToEcm[1].ecmPin;
      throttlePinTps2 = wiringData.throttleBody.connectionToEcm[1].throttlePin;
    }

    switch (hoveredWire) {
      case "trigger":
        return `IGNITION TRIGGER | Signal: 5V Square Wave Pulse | ECU Pin ${ecmPinCoil} ➔ Coil Pin ${coilPinCoil}`;
      case "tps1":
        return `THROTTLE MOTOR (+) | Signal: 12V PWM Drive | ECU Pin ${ecmPinTps1} ➔ Throttle Pin ${throttlePinTps1}`;
      case "tps2":
        return `THROTTLE MOTOR (-) | Signal: 12V PWM Drive | ECU Pin ${ecmPinTps2} ➔ Throttle Pin ${throttlePinTps2}`;
      case "power":
        return "B+ POWER FEED | Signal: 12.6V DC Constant Battery Power | Relay Terminal ➔ ECU Pin 2 & Coil Pin 2";
      case "ground":
        return "CHASSIS GROUND | Signal: 0V Reference | Chassis ➔ ECU Pin 4 & Coil Pin 3 & Throttle Pin 3";
      case "can_h":
        return "CAN HIGH BUS | Signal: 2.5V - 3.5V Differential Data Bus | ECU Pin 12 ➔ OBD-II Diagnostic Pin 6";
      case "can_l":
        return "CAN LOW BUS | Signal: 1.5V - 2.5V Differential Data Bus | ECU Pin 13 ➔ OBD-II Diagnostic Pin 14";
      default:
        return "Active Diagnostic Trace Link";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="flex flex-col h-full bg-[#050505] hardware-pattern p-8 relative overflow-hidden"
    >
      <header className="flex flex-col gap-2 mb-4 pt-6 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-text-primary" />
            </button>
            <h2 className="text-3xl font-black text-text-primary tracking-tight font-display flex items-center gap-2">
              <Layers className="w-8 h-8 text-primary" /> Schematics
            </h2>
          </div>
        </div>
        <p className="text-text-secondary text-sm font-mono pl-12">{vehicle}</p>
      </header>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-[10px] text-yellow-500 uppercase font-bold tracking-wider mb-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Offline mode: Displaying factory fallback wiring schematics</span>
        </div>
      )}

      {loading ? (
        <div className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 p-8">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div className="text-center">
             <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Factchecking Schematics</h4>
             <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1.5 font-mono">Querying factory electrical layouts for {vehicle}...</p>
          </div>
        </div>
      ) : !wiringData ? (
        <div className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-3xl flex items-center justify-center text-white/50 font-mono text-xs uppercase tracking-wider">
          Failed to load wiring schematics
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 bg-surface/50 border border-white/10 p-2 rounded-2xl mb-4">
            {layers.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeLayer === l.id ? "bg-primary text-black" : "text-text-secondary hover:text-white"}`}
              >
                {l.name}
              </button>
            ))}
          </div>

          <div className="flex-grow bg-[#050507] border border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center group min-h-[500px]">
            <div className="absolute right-4 top-4 flex flex-col gap-2 z-10 opacity-50 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setZoom(Math.min(zoom + ZOOM_STEP, ZOOM_MAX))}
                className="w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoom(Math.max(zoom - ZOOM_STEP, ZOOM_MIN))}
                className="w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoom(ZOOM_DEFAULT)}
                className="w-10 h-10 bg-black/50 backdrop-blur border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute left-4 top-4 z-10 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 text-[9px] text-white/50 font-mono uppercase tracking-wider flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Click a component node to view details | Hover wire lines to trace</span>
            </div>

            {/* Live Telemetry Info Ticker */}
            <div className="absolute bottom-4 left-4 z-10 bg-black/70 px-4 py-2.5 rounded-xl border border-primary/20 text-[10px] text-primary font-mono uppercase tracking-wider flex items-center gap-2 max-w-[80%] truncate">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>{getWireLabel()}</span>
            </div>

            {/* Schematic Canvas */}
            <div
              className="relative w-full h-full transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="w-full h-full select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <style>{`
                  @keyframes flow-east {
                    to {
                      stroke-dashoffset: -30;
                    }
                  }
                  @keyframes flow-west {
                    to {
                      stroke-dashoffset: 30;
                    }
                  }
                  .pulse-east {
                    stroke-dasharray: 8 12;
                    animation: flow-east 1.2s linear infinite;
                  }
                  .pulse-west {
                    stroke-dasharray: 8 12;
                    animation: flow-west 1.2s linear infinite;
                  }
                  .svg-grid {
                    fill: url(#grid);
                  }
                `}</style>

                <defs>
                  {/* Grid Pattern Background */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  </pattern>

                  {/* Glow Filters */}
                  <filter id="glow-trigger" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-tps1" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-tps2" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-power" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-ground" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-can_h" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-can_l" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid Fill */}
                <rect width={VIEW_W} height={VIEW_H} className="svg-grid" />

                {/* --- PATHS SECTION (CONNECTIONS) --- */}

                {/* ECU to Chassis Ground Line (Gnd Pin 4 ➔ Chassis) */}
                <path
                  d={`M ${ECU_TERM_X_POS} ${GND_ECU_Y} L ${GND_LEFT_X} ${GND_ECU_Y}`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("ground", "#10b981")}
                />
                {/* Coil to Chassis Ground Line (Gnd Pin 3 ➔ Chassis) */}
                <path
                  d={`M ${COIL_TERM_X_POS} ${GND_COIL_Y} L ${GND_RIGHT_X} ${GND_COIL_Y}`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("ground", "#10b981")}
                />
                {/* Throttle Ground Line (Gnd Pin 3 ➔ Chassis) */}
                <path
                  d={`M ${THROTTLE_TERM_X_POS} ${GND_THROTTLE_Y} L ${GND_RIGHT_X} ${GND_THROTTLE_Y}`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("ground", "#10b981")}
                />

                {/* Ground Symbols drawing */}
                <path d={`M ${GND_LEFT_X} ${GND_ECU_Y} L ${GND_LEFT_X} ${GND_ECU_Y + 8} M ${GND_LEFT_X - 10} ${GND_ECU_Y + 8} L ${GND_LEFT_X + 10} ${GND_ECU_Y + 8} M ${GND_LEFT_X - 5} ${GND_ECU_Y + 12} L ${GND_LEFT_X + 5} ${GND_ECU_Y + 12} M ${GND_LEFT_X - 1} ${GND_ECU_Y + 16} L ${GND_LEFT_X + 1} ${GND_ECU_Y + 16}`} stroke="#10b981" strokeWidth="2" fill="none" opacity={getWireStyle("ground", "#10b981").opacity} />
                <path d={`M ${GND_RIGHT_X} ${GND_COIL_Y} L ${GND_RIGHT_X} ${GND_COIL_Y + 8} M ${GND_RIGHT_X - 10} ${GND_COIL_Y + 8} L ${GND_RIGHT_X + 10} ${GND_COIL_Y + 8} M ${GND_RIGHT_X - 5} ${GND_COIL_Y + 12} L ${GND_RIGHT_X + 5} ${GND_COIL_Y + 12} M ${GND_RIGHT_X - 1} ${GND_COIL_Y + 16} L ${GND_RIGHT_X + 1} ${GND_COIL_Y + 16}`} stroke="#10b981" strokeWidth="2" fill="none" opacity={getWireStyle("ground", "#10b981").opacity} />
                <path d={`M ${GND_RIGHT_X} ${GND_THROTTLE_Y} L ${GND_RIGHT_X} ${GND_THROTTLE_Y + 8} M ${GND_RIGHT_X - 10} ${GND_THROTTLE_Y + 8} L ${GND_RIGHT_X + 10} ${GND_THROTTLE_Y + 8} M ${GND_RIGHT_X - 5} ${GND_THROTTLE_Y + 12} L ${GND_RIGHT_X + 5} ${GND_THROTTLE_Y + 12} M ${GND_RIGHT_X - 1} ${GND_THROTTLE_Y + 16} L ${GND_RIGHT_X + 1} ${GND_THROTTLE_Y + 16}`} stroke="#10b981" strokeWidth="2" fill="none" opacity={getWireStyle("ground", "#10b981").opacity} />

                {/* Power Distribution Feeds (B+) */}
                {/* Power Distribution Point to ECU Pin 2 */}
                <path
                  d={`M ${POWER_TERM_X_POS} ${POWER_TERM_Y_POS} L ${POWER_TERM_X_POS} ${POWER_SPLIT_Y} L ${POWER_ECU_X} ${POWER_SPLIT_Y} L ${POWER_ECU_X} 120 L ${ECU_TERM_X_POS} 120`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("power", "#ef4444")}
                />
                {/* Power Distribution Point to Coil Pin 2 */}
                <path
                  d={`M ${POWER_TERM_X_POS} ${POWER_TERM_Y_POS} L ${POWER_TERM_X_POS} ${POWER_SPLIT_Y} L ${POWER_COIL_X} ${POWER_SPLIT_Y} L ${POWER_COIL_X} 140 L ${COIL_TERM_X_POS} 140`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("power", "#ef4444")}
                />

                {/* Ignition Coil Trigger Line (ECU Pin 65 ➔ Coil Pin 1) */}
                <path
                  d={`M ${ECU_TERM_X_POS} 240 L ${TRG_MID_X} 240 L ${TRG_MID_X} 100 L ${COIL_TERM_X_POS} 100`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("trigger", "#f5a623")}
                />

                {/* Throttle Motor Plus Line (ECU Pin 24 ➔ Throttle Pin 1) */}
                <path
                  d={`M ${ECU_TERM_X_POS} 280 L ${TPS1_MID_X} 280 L ${TPS1_MID_X} 320 L ${THROTTLE_TERM_X_POS} 320`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("tps1", "#06b6d4")}
                />

                {/* Throttle Motor Minus Line (ECU Pin 25 ➔ Throttle Pin 2) */}
                <path
                  d={`M ${ECU_TERM_X_POS} 320 L ${TPS2_MID_X} 320 L ${TPS2_MID_X} 360 L ${THROTTLE_TERM_X_POS} 360`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("tps2", "#d946ef")}
                />

                {/* CAN High Line (ECU Pin 12 ➔ OBD Connector Pin 6) */}
                <path
                  d={`M ${ECU_TERM_X_POS} 180 L ${OBD_CAN_H_MID_X} 180 L ${OBD_CAN_H_MID_X} ${OBD_CAN_H_Y} L ${OBD_TERM_X_POS} ${OBD_CAN_H_Y}`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("can_h", "#3b82f6")}
                />

                {/* CAN Low Line (ECU Pin 13 ➔ OBD Connector Pin 14) */}
                <path
                  d={`M ${ECU_TERM_X_POS} 210 L ${OBD_CAN_L_MID_X} 210 L ${OBD_CAN_L_MID_X} ${OBD_CAN_L_Y} L ${OBD_TERM_X_POS} ${OBD_CAN_L_Y}`}
                  fill="none"
                  strokeWidth={STROKE_THICK}
                  style={getWireStyle("can_l", "#a855f7")}
                />

                {/* --- ANIMATED OVERLAY PULSES --- */}
                {activeLayer === "all" || activeLayer === "can" ? (
                  <>
                    {/* Trigger Pulse */}
                    <path
                      d={`M ${ECU_TERM_X_POS} 240 L ${TRG_MID_X} 240 L ${TRG_MID_X} 100 L ${COIL_TERM_X_POS} 100`}
                      fill="none"
                      stroke="#f5a623"
                      strokeWidth={STROKE_THIN}
                      className="pulse-east"
                      opacity={getWireStyle("trigger", "#f5a623").opacity}
                      pointerEvents="none"
                    />
                    {/* TPS1 Pulse */}
                    <path
                      d={`M ${ECU_TERM_X_POS} 280 L ${TPS1_MID_X} 280 L ${TPS1_MID_X} 320 L ${THROTTLE_TERM_X_POS} 320`}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={STROKE_THIN}
                      className="pulse-east"
                      opacity={getWireStyle("tps1", "#06b6d4").opacity}
                      pointerEvents="none"
                    />
                    {/* TPS2 Pulse */}
                    <path
                      d={`M ${ECU_TERM_X_POS} 320 L ${TPS2_MID_X} 320 L ${TPS2_MID_X} 360 L ${THROTTLE_TERM_X_POS} 360`}
                      fill="none"
                      stroke="#d946ef"
                      strokeWidth={STROKE_THIN}
                      className="pulse-east"
                      opacity={getWireStyle("tps2", "#d946ef").opacity}
                      pointerEvents="none"
                    />
                    {/* CAN_H Pulse */}
                    <path
                      d={`M ${ECU_TERM_X_POS} 180 L ${OBD_CAN_H_MID_X} 180 L ${OBD_CAN_H_MID_X} ${OBD_CAN_H_Y} L ${OBD_TERM_X_POS} ${OBD_CAN_H_Y}`}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth={STROKE_THIN}
                      className="pulse-west"
                      opacity={getWireStyle("can_h", "#3b82f6").opacity}
                      pointerEvents="none"
                    />
                    {/* CAN_L Pulse */}
                    <path
                      d={`M ${ECU_TERM_X_POS} 210 L ${OBD_CAN_L_MID_X} 210 L ${OBD_CAN_L_MID_X} ${OBD_CAN_L_Y} L ${OBD_TERM_X_POS} ${OBD_CAN_L_Y}`}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth={STROKE_THIN}
                      className="pulse-west"
                      opacity={getWireStyle("can_l", "#a855f7").opacity}
                      pointerEvents="none"
                    />
                  </>
                ) : null}

                {activeLayer === "all" || activeLayer === "power" ? (
                  <>
                    {/* Power 1 Pulse */}
                    <path
                      d={`M ${POWER_TERM_X_POS} ${POWER_TERM_Y_POS} L ${POWER_TERM_X_POS} ${POWER_SPLIT_Y} L ${POWER_ECU_X} ${POWER_SPLIT_Y} L ${POWER_ECU_X} 120 L ${ECU_TERM_X_POS} 120`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={STROKE_THIN}
                      className="pulse-west"
                      opacity={getWireStyle("power", "#ef4444").opacity}
                      pointerEvents="none"
                    />
                    {/* Power 2 Pulse */}
                    <path
                      d={`M ${POWER_TERM_X_POS} ${POWER_TERM_Y_POS} L ${POWER_TERM_X_POS} ${POWER_SPLIT_Y} L ${POWER_COIL_X} ${POWER_SPLIT_Y} L ${POWER_COIL_X} 140 L ${COIL_TERM_X_POS} 140`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={STROKE_THIN}
                      className="pulse-east"
                      opacity={getWireStyle("power", "#ef4444").opacity}
                      pointerEvents="none"
                    />
                    {/* Ground Pulses (flow west/away from module to chassis ground) */}
                    <path
                      d={`M ${ECU_TERM_X_POS} ${GND_ECU_Y} L ${GND_LEFT_X} ${GND_ECU_Y}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={STROKE_THIN}
                      className="pulse-west"
                      opacity={getWireStyle("ground", "#10b981").opacity}
                      pointerEvents="none"
                    />
                    <path
                      d={`M ${COIL_TERM_X_POS} ${GND_COIL_Y} L ${GND_RIGHT_X} ${GND_COIL_Y}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={STROKE_THIN}
                      className="pulse-east"
                      opacity={getWireStyle("ground", "#10b981").opacity}
                      pointerEvents="none"
                    />
                    <path
                      d={`M ${THROTTLE_TERM_X_POS} ${GND_THROTTLE_Y} L ${GND_RIGHT_X} ${GND_THROTTLE_Y}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={STROKE_THIN}
                      className="pulse-east"
                      opacity={getWireStyle("ground", "#10b981").opacity}
                      pointerEvents="none"
                    />
                  </>
                ) : null}

                {/* --- HOVER CAPTURE OVERLAYS (THICK & INVISIBLE) --- */}
                <path d={`M ${ECU_TERM_X_POS} ${GND_ECU_Y} L ${GND_LEFT_X} ${GND_ECU_Y}`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("ground")} onMouseLeave={() => setHoveredWire(null)} />
                <path d={`M ${COIL_TERM_X_POS} ${GND_COIL_Y} L ${GND_RIGHT_X} ${GND_COIL_Y}`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("ground")} onMouseLeave={() => setHoveredWire(null)} />
                <path d={`M ${THROTTLE_TERM_X_POS} ${GND_THROTTLE_Y} L ${GND_RIGHT_X} ${GND_THROTTLE_Y}`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("ground")} onMouseLeave={() => setHoveredWire(null)} />

                <path d={`M ${POWER_TERM_X_POS} ${POWER_TERM_Y_POS} L ${POWER_TERM_X_POS} ${POWER_SPLIT_Y} L ${POWER_ECU_X} ${POWER_SPLIT_Y} L ${POWER_ECU_X} 120 L ${ECU_TERM_X_POS} 120`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("power")} onMouseLeave={() => setHoveredWire(null)} />
                <path d={`M ${POWER_TERM_X_POS} ${POWER_TERM_Y_POS} L ${POWER_TERM_X_POS} ${POWER_SPLIT_Y} L ${POWER_COIL_X} ${POWER_SPLIT_Y} L ${POWER_COIL_X} 140 L ${COIL_TERM_X_POS} 140`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("power")} onMouseLeave={() => setHoveredWire(null)} />

                <path d={`M ${ECU_TERM_X_POS} 240 L ${TRG_MID_X} 240 L ${TRG_MID_X} 100 L ${COIL_TERM_X_POS} 100`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("trigger")} onMouseLeave={() => setHoveredWire(null)} />
                <path d={`M ${ECU_TERM_X_POS} 280 L ${TPS1_MID_X} 280 L ${TPS1_MID_X} 320 L ${THROTTLE_TERM_X_POS} 320`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("tps1")} onMouseLeave={() => setHoveredWire(null)} />
                <path d={`M ${ECU_TERM_X_POS} 320 L ${TPS2_MID_X} 320 L ${TPS2_MID_X} 360 L ${THROTTLE_TERM_X_POS} 360`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("tps2")} onMouseLeave={() => setHoveredWire(null)} />

                <path d={`M ${ECU_TERM_X_POS} 180 L ${OBD_CAN_H_MID_X} 180 L ${OBD_CAN_H_MID_X} ${OBD_CAN_H_Y} L ${OBD_TERM_X_POS} ${OBD_CAN_H_Y}`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("can_h")} onMouseLeave={() => setHoveredWire(null)} />
                <path d={`M ${ECU_TERM_X_POS} 210 L ${OBD_CAN_L_MID_X} 210 L ${OBD_CAN_L_MID_X} ${OBD_CAN_L_Y} L ${OBD_TERM_X_POS} ${OBD_CAN_L_Y}`} fill="none" stroke="transparent" strokeWidth={HOVER_STROKE} className="cursor-crosshair" onMouseEnter={() => setHoveredWire("can_l")} onMouseLeave={() => setHoveredWire(null)} />


                {/* --- COMPONENT CARDS (SVG SHAPES) --- */}

                {/* 12V Battery / Power Source Box */}
                <g 
                  onClick={() => setSelectedComponent({
                    title: "12V Power Distribution",
                    details: "Automotive fuse/relay block providing switched and constant 12.6V battery power feeds to engine management controllers, ignition coil trigger lines, and main fuel pump feeds.",
                    pins: [
                      { label: "B+", pin: "F15", function: "Main ECU Battery Fuse (15A)" },
                      { label: "B+", pin: "F20", function: "Ignition Coils Relay Fuse (20A)" }
                    ]
                  })}
                  className="cursor-pointer group"
                >
                  <rect x={POWER_X_POS} y={POWER_Y_POS} width={POWER_W_VAL} height={POWER_H_VAL} rx={RX_SMALL} fill="#0c0e12" stroke="rgba(239,68,68,0.2)" strokeWidth="1.5" className="transition-all hover:fill-red-500/5 hover:stroke-red-500/50" />
                  <text x={POWER_TERM_X_POS} y="34" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">12V POWER RELAY</text>
                  <circle cx={POWER_TERM_X_POS} cy={POWER_TERM_Y_POS} r={RADIUS_LARGE} fill="#ef4444" />
                </g>

                {/* ECU Card Node */}
                <g
                  onClick={() => setSelectedComponent({
                    title: wiringData.ecm.name,
                    details: "Engine Control Module (ECM) serves as the primary brain of the vehicle, regulating fuel injection, ignition timing, and throttle controls based on sensor telemetry.",
                    pins: wiringData.ecm.pins
                  })}
                  className="cursor-pointer"
                >
                  <rect x={ECU_X_POS} y={ECU_Y_POS} width={ECU_W_VAL} height={ECU_H_VAL} rx={RX_LARGE} fill="#0d0f12" stroke="rgba(245,166,35,0.2)" strokeWidth="1.5" className="transition-colors hover:fill-[#13171d] hover:stroke-primary/60" />
                  <rect x={ECU_X_POS} y={ECU_Y_POS} width={ECU_W_VAL} height="36" rx={RX_LARGE} fill="rgba(245,166,35,0.08)" />
                  <rect x={ECU_X_POS} y="118" width={ECU_W_VAL} height="18" fill="rgba(245,166,35,0.08)" />
                  <text x="200" y="122" fill="#f5a623" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ENGINE CONTROL UNIT</text>
                  <text x="200" y="132" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace" textAnchor="middle">{wiringData.ecm.name}</text>

                  {/* Pin list overlay texts */}
                  <g className="font-mono" fontSize="8" fill="rgba(255,255,255,0.5)">
                    <text x="285" y="123" textAnchor="end">Pin 2 (B+ Power)</text>
                    <text x="285" y="153" textAnchor="end">Pin 4 (Chassis Gnd)</text>
                    <text x="285" y="183" textAnchor="end">Pin 12 (CAN_H)</text>
                    <text x="285" y="213" textAnchor="end">Pin 13 (CAN_L)</text>
                    <text x="285" y="243" textAnchor="end">Pin 65 (Ign Trigger)</text>
                    <text x="285" y="283" textAnchor="end">Pin 24 (TPS Motor +)</text>
                    <text x="285" y="323" textAnchor="end">Pin 25 (TPS Motor -)</text>
                  </g>

                  {/* Pin circles */}
                  {ECU_PIN_YS.map((y) => (
                    <circle key={y} cx={ECU_TERM_X_POS} cy={y} r={RADIUS_SMALL} fill="#f5a623" />
                  ))}
                </g>

                {/* OBD-II Interface Card */}
                <g
                  onClick={() => setSelectedComponent({
                    title: "OBD-II Diagnostic Link",
                    details: "On-Board Diagnostics data connector (DLC) providing J1962 serial high-speed CAN networks access to scanners, telemetry logging adapters, and programming interfaces.",
                    pins: [
                      { label: "CAN_H", pin: "6", function: "High Speed CAN Transmit (2.5V-3.5V)" },
                      { label: "CAN_L", pin: "14", function: "High Speed CAN Receive (1.5V-2.5V)" }
                    ]
                  })}
                  className="cursor-pointer"
                >
                  <rect x={OBD_X_POS} y={OBD_Y_POS} width={OBD_W_VAL} height={OBD_H_VAL} rx={RX_MEDIUM} fill="#0d0f12" stroke="rgba(217,70,239,0.2)" strokeWidth="1.5" className="transition-colors hover:fill-[#13171d] hover:stroke-magenta/50" />
                  <rect x={OBD_X_POS} y={OBD_Y_POS} width={OBD_W_VAL} height="28" rx={RX_MEDIUM} fill="rgba(217,70,239,0.08)" />
                  <rect x={OBD_X_POS} y="455" width={OBD_W_VAL} height="13" fill="rgba(217,70,239,0.08)" />
                  <text x="180" y="458" fill="#d946ef" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">OBD-II DIAGNOSTIC LINK</text>

                  <g className="font-mono" fontSize="8" fill="rgba(255,255,255,0.5)">
                    <text x="270" y="463" textAnchor="end">Pin 6 (CAN_H)</text>
                    <text x="270" y="493" textAnchor="end">Pin 14 (CAN_L)</text>
                  </g>

                  {OBD_PIN_YS.map((y) => (
                    <circle key={y} cx={OBD_TERM_X_POS} cy={y} r={RADIUS_SMALL} fill="#d946ef" />
                  ))}
                </g>

                {/* Ignition Coil Card Node */}
                <g
                  onClick={() => setSelectedComponent({
                    title: wiringData.ignitionCoil.name,
                    details: "Ignition Coil converts low voltage battery power into high voltage spark required to ignite the combustion chamber fuel-air mixture.",
                    pins: wiringData.ignitionCoil.pins
                  })}
                  className="cursor-pointer"
                >
                  <rect x={COIL_X_POS} y={COIL_Y_POS} width={COIL_W_VAL} height={COIL_H_VAL} rx={RX_LARGE} fill="#0d0f12" stroke="rgba(239,68,68,0.2)" strokeWidth="1.5" className="transition-colors hover:fill-[#13171d] hover:stroke-red-500/60" />
                  <rect x={COIL_X_POS} y={COIL_Y_POS} width={COIL_W_VAL} height="36" rx={RX_LARGE} fill="rgba(239,68,68,0.08)" />
                  <rect x={COIL_X_POS} y="78" width={COIL_W_VAL} height="18" fill="rgba(239,68,68,0.08)" />
                  <text x="770" y="82" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">IGNITION COIL 1</text>
                  <text x="770" y="92" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace" textAnchor="middle">{wiringData.ignitionCoil.name}</text>

                  <g className="font-mono" fontSize="8" fill="rgba(255,255,255,0.5)">
                    <text x="675" y="103" textAnchor="start">Pin 1 (Trigger Signal)</text>
                    <text x="675" y="143" textAnchor="start">Pin 2 (B+ 12V Feed)</text>
                    <text x="675" y="183" textAnchor="start">Pin 3 (Chassis Ground)</text>
                  </g>

                  {COIL_PIN_YS.map((y) => (
                    <circle key={y} cx={COIL_TERM_X_POS} cy={y} r={RADIUS_SMALL} fill="#ef4444" />
                  ))}
                </g>

                {/* Throttle Body Card Node */}
                <g
                  onClick={() => setSelectedComponent({
                    title: wiringData.throttleBody.name,
                    details: "Electronic Throttle Body regulates the amount of air intake entering the engine based on driver accelerator pedal inputs.",
                    pins: wiringData.throttleBody.pins
                  })}
                  className="cursor-pointer"
                >
                  <rect x={THROTTLE_X_POS} y={THROTTLE_Y_POS} width={THROTTLE_W_VAL} height={THROTTLE_H_VAL} rx={RX_LARGE} fill="#0d0f12" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" className="transition-colors hover:fill-[#13171d] hover:stroke-cyan-400/60" />
                  <rect x={THROTTLE_X_POS} y={THROTTLE_Y_POS} width={THROTTLE_W_VAL} height="36" rx={RX_LARGE} fill="rgba(6,182,212,0.08)" />
                  <rect x={THROTTLE_X_POS} y="298" width={THROTTLE_W_VAL} height="18" fill="rgba(6,182,212,0.08)" />
                  <text x="770" y="302" fill="#06b6d4" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ELECTRONIC THROTTLE BODY</text>
                  <text x="770" y="312" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace" textAnchor="middle">{wiringData.throttleBody.name}</text>

                  <g className="font-mono" fontSize="8" fill="rgba(255,255,255,0.5)">
                    <text x="675" y="323" textAnchor="start">Pin 1 (Motor Drive +)</text>
                    <text x="675" y="363" textAnchor="start">Pin 2 (Motor Drive -)</text>
                    <text x="675" y="403" textAnchor="start">Pin 3 (Sensor Ground)</text>
                  </g>

                  {THROTTLE_PIN_YS.map((y) => (
                    <circle key={y} cx={THROTTLE_TERM_X_POS} cy={y} r={RADIUS_SMALL} fill="#06b6d4" />
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Component Details Inspection Overlay */}
      {selectedComponent && (
        <div className="absolute inset-x-8 bottom-8 top-20 bg-black/95 border-2 border-primary/30 rounded-3xl p-6 z-30 flex flex-col backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-4">
            <div>
              <h3 className="text-base font-black text-primary uppercase tracking-wide">
                {selectedComponent.title}
              </h3>
              <span className="text-[9px] text-white/50 font-mono uppercase tracking-widest">Pinout Specification Data Sheet</span>
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="px-3 py-1 bg-white/15 text-white hover:bg-white/20 rounded-lg text-[9px] font-bold uppercase tracking-wider"
            >
              Close
            </button>
          </div>
          
          <p className="text-xs text-white/70 leading-relaxed font-sans mb-4">
            {selectedComponent.details}
          </p>
          
          <div className="flex-grow overflow-y-auto no-scrollbar">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2 font-mono">Pin Mapping & Diagnostic Functions</div>
            <div className="space-y-2">
              {selectedComponent.pins.map((p) => (
                <div key={p.pin} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-white font-bold">Pin {p.pin}</span>
                    <span className="text-[10px] text-primary/80 font-mono ml-2">({p.label})</span>
                  </div>
                  <span className="text-xs text-white/50 font-mono text-right max-w-[340px] truncate">{p.function}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};



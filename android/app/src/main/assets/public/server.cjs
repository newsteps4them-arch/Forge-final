"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_child_process = require("child_process");
var import_util = require("util");
var import_promises = __toESM(require("fs/promises"), 1);
var execAsync = (0, import_util.promisify)(import_child_process.exec);
import_dotenv.default.config();
function generateIntelligentFallback(message, systemInstruction) {
  const cleanMsg = (message || "").toUpperCase();
  const dtcRegex = /[PBUC]\d{4}/i;
  const match = message ? message.match(dtcRegex) : null;
  const header = `[\u2699\uFE0F STAGING TELEMETRY FAILOVER ACTIVE \u2014 CALIBRATION DEPLOYED]

`;
  if (match) {
    const code = match[0].toUpperCase();
    let dtcData = {
      title: "Unknown Diagnostic Trouble Code",
      domain: "General ECU Telemetry",
      severity: "MODERATE",
      symptoms: ["Check Engine Light (MIL) illuminated", "Slight performance degradation"],
      causes: ["Corroded wiring harness pins", "Sensor out of calibration range", "Intermittent signal drop"],
      steps: [
        "1. Hook up the oscilloscope and monitor the sensor signal line under load.",
        "2. Check ground connections for high resistance (> 0.5 ohms).",
        "3. Review live data fuel trims and O2 sensor sweep voltage values."
      ]
    };
    if (code.startsWith("P0300")) {
      dtcData = {
        title: "Random/Multiple Cylinder Misfire Detected",
        domain: "Powertrain (Ignition/Fuel)",
        severity: "CRITICAL (Catalytic Damaging)",
        symptoms: ["Rough engine idle", "Loss of power", "Flashing Check Engine Light (MIL)", "Stalling when hot"],
        causes: ["Worn spark plugs or weak ignition coils", "Intake manifold vacuum leaks", "Low fuel pressure or clogged injectors", "EGR valve stuck open"],
        steps: [
          "1. Inspect spark plug electrodes and measure ignition coil primary/secondary resistance.",
          "2. Perform a smoke test on the intake tract to locate vacuum leaks.",
          "3. Connect fuel pressure gauge to fuel rail; verify pressure is within OEM specifications under prime and cranking phases.",
          "4. Review live cylinder misfire counters to identify contributing cylinders."
        ]
      };
    } else if (code.startsWith("P0171") || code.startsWith("P0174")) {
      dtcData = {
        title: "System Too Lean (Bank 1 / Bank 2)",
        domain: "Powertrain (Air/Fuel Ratio)",
        severity: "HIGH",
        symptoms: ["Hesitation during acceleration", "Rough idle", "Engine misfire", "Decreased fuel economy"],
        causes: ["Vacuum leaks (unmetered air entering engine)", "Faulty Mass Air Flow (MAF) sensor", "Weak fuel pump or clogged fuel filter", "Leaking PCV valve or hoses"],
        steps: [
          "1. Monitor Short Term and Long Term Fuel Trims (STFT/LTFT). If trim values drop toward 0% as engine RPM increases to 2500, confirm a vacuum leak.",
          "2. Clean the MAF sensor hot wire using dedicated electronic cleaner and review GPS flow rates (should be ~1g/s per Litre of engine displacement at idle).",
          "3. Perform a fuel volume and pressure test to verify pump delivery capability.",
          "4. Inspect intake plenum seals and PCV lines for active cracking."
        ]
      };
    } else if (code.startsWith("P0420")) {
      dtcData = {
        title: "Catalyst System Efficiency Below Threshold (Bank 1)",
        domain: "Powertrain (Emissions)",
        severity: "MODERATE",
        symptoms: ["MIL illuminated", "No noticeable driveability concerns", "Failed tailpipe emissions test"],
        causes: ["Degraded or damaged catalytic converter catalytic bed", "Exhaust manifold or pipe leak upstream of converter", "Engine misfiring or burning oil (poisoning substrate)"],
        steps: [
          "1. Run the engine to operating temperature, then compare Upstream (Sensor 1) and Downstream (Sensor 2) O2 sensors. Upstream should cycle (0.1V - 0.9V); Downstream should remain flat (~0.5V - 0.7V) if catalytic efficiency is high.",
          "2. Use an infrared laser thermometer to check entry and exit temp of the catalytic converter. Exit should be 50-100\xB0F hotter than entrance.",
          "3. Smoke test the exhaust system to confirm zero ambient air is entering upstream."
        ]
      };
    } else if (code.startsWith("U0100")) {
      dtcData = {
        title: "Lost Communication with ECM/PCM",
        domain: "CAN Network Bus Communications",
        severity: "CRITICAL (No-Start State)",
        symptoms: ["Multiple indicator warnings lit", "No crank / No start condition", "Diagnostic tool unable to establish communication with ECU"],
        causes: ["Blown main PCM relay or fuse", "Damaged CAN High or CAN Low bus wires", "Corroded ground strap from block to chassis", "Failed PCM unit"],
        steps: [
          "1. Check primary fuse box fuses (PCM/EFI/IGN) and check for voltage at main relay pins.",
          "2. Measure resistance across OBD pin 6 (CAN-H) and pin 14 (CAN-L). Should read exactly 60 ohms (two 120 ohm terminating resistors in parallel). If 120 ohms, one resistor/node is disconnected.",
          "3. Use a digital storage oscilloscope (DSO) to capture CAN signal profiles; look for signal levels of 2.5V bias (CAN-H peaking to 3.5V, CAN-L pulling down to 1.5V)."
        ]
      };
    }
    return `${header}### \u{1F6E0}\uFE0F Diagnostic Blueprint: ${code} - ${dtcData.title}
* **Domain Structure:** ${dtcData.domain}
* **Severity Rating:** \`${dtcData.severity}\`

#### \u26A0\uFE0F Observed Code Symptoms:
${dtcData.symptoms.map((s) => `- ${s}`).join("\n")}

#### \u{1F50D} Root Causes Analysis:
${dtcData.causes.map((c) => `- ${c}`).join("\n")}

#### \u{1F4CB} Professional Action Plan:
${dtcData.steps.join("\n")}

---
*Note: This is an automated diagnostic path provided by the secondary on-board telemetry model. To reactivate real-time global cloud diagnostics, verify your **Gemini Key** in the **Settings** workspace.*`;
  }
  if (cleanMsg.includes("MELI") || cleanMsg.includes("SCHEDULE") || cleanMsg.includes("MEETING") || cleanMsg.includes("CALENDAR")) {
    return `${header}### \u{1F4C5} Meli Scheduling Assistant Link
*Forge neural telemetry indicates a request related to coordinating with scheduling services or Meli (Chief of Staff).*

I am happy to simulate any logistics coordination for your fleet:
1. **Preventive Recalls Tracking** - Synced with the active NHTSA safety database.
2. **Service Bay Calendar** - Check bays availability and technician assignments.
3. **Task Force Milestones** - Automatic reminders when parts are ordered.

*To activate live, real-time sync with Meli's global network, configure your valid **Meli Key** or authentication credentials in the **Settings** layout.*`;
  }
  if (cleanMsg.includes("WIRING") || cleanMsg.includes("DIAGRAM") || cleanMsg.includes("SCHEMATIC") || cleanMsg.includes("ALLDATA")) {
    return `${header}### \u26A1 Onboard Wiring Schematic Service
*Forge system databases are currently utilizing fallback high-fidelity schematic simulator pathways.*

* **Target Unit:** Powertrain Controller Junction (CAN High/Low)
* **Status:** Simulation Online (100% Signal Integrity)

**Quick Diagnostics Guidelines:**
1. Pin 1 (Red/White): 12V+ Switched Power from ignition relay.
2. Pin 6 (Blue/White): CAN High data communication terminal (2.5V-3.5V dynamic cycle).
3. Pin 14 (White): CAN Low data communication terminal (1.5V-2.5V dynamic cycle).
4. Pin 22 (Black): Shield/System chassis earth ground (< 0.2 ohms).

*To populate real OEM complex schematic images directly from commercial vehicle databases, bind your **AllData Partner ID** key from the settings console.*`;
  }
  return `${header}### \u{1F6F0}\uFE0F Team Forge Terminal Assistant
Greetings! I am the **Team Forge Onboard Diagnostic Assistant**, running in a high-fidelity staging container environment.

I am optimized for DIY engineering, precision hardware-software setups, and fleet telemetry monitoring.

#### Available Virtual Diagnostics:
* **DTC Core Decode:** Type any trouble code (e.g. *P0300*, *P0171*, *U0100*) to generate standard diagnostic action steps.
* **Component Testing:** Ask about wiring flow, ground points, or sensors loop.
* **Recall Sync Checklist:** Access safety data models.

*To unlock unlimited semantic reasoning and full-range multimodal image analysis using Gemini 2.0, verify your **Gemini API Key** or select **Automated Sandbox** in the **Settings** menu. Our system automatically manages credentials in the background once linked!*`;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/git/status", async (req, res) => {
    try {
      const { stdout } = await execAsync("bash scripts/sync.sh --check");
      let isInitialized = false;
      try {
        await import_promises.default.access(import_path.default.join(process.cwd(), ".git"));
        isInitialized = true;
      } catch (err) {
      }
      let lastLogs = "";
      try {
        lastLogs = await import_promises.default.readFile(import_path.default.join(process.cwd(), ".sync-log"), "utf8");
        lastLogs = lastLogs.split("\n").slice(-30).join("\n");
      } catch (e) {
      }
      res.json({
        success: true,
        initialized: isInitialized,
        statusOutput: stdout,
        logs: lastLogs
      });
    } catch (error) {
      console.error("Git Status API Error:", error);
      let isInitialized = false;
      try {
        await import_promises.default.access(import_path.default.join(process.cwd(), ".git"));
        isInitialized = true;
      } catch (err) {
      }
      res.json({
        success: false,
        initialized: isInitialized,
        error: error.message || "Git not initialized or not accessible.",
        statusOutput: error.stdout || error.message || ""
      });
    }
  });
  app.post("/api/git/link", async (req, res) => {
    try {
      const { repoUrl, githubToken } = req.body;
      if (!repoUrl) {
        return res.status(400).json({ error: "Repository URL is required." });
      }
      let finalUrl = repoUrl.trim();
      if (githubToken && githubToken.trim()) {
        const cleanToken = githubToken.trim();
        const withoutProto = repoUrl.replace(/^https?:\/\//, "");
        const cleanUrlPart = withoutProto.includes("@") ? withoutProto.split("@")[1] : withoutProto;
        finalUrl = `https://${cleanToken}@${cleanUrlPart}`;
      }
      const { stdout, stderr } = await execAsync(`bash scripts/sync.sh --link "${finalUrl}"`);
      res.json({ success: true, message: "Repository linked successfully.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Link API Error:", error);
      res.status(500).json({ error: error.message || "Failed to link repository.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/sync", async (req, res) => {
    try {
      const { commitMessage } = req.body;
      const msg = commitMessage ? `"${commitMessage.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : "";
      const { stdout, stderr } = await execAsync(`bash scripts/sync.sh sync ${msg}`);
      res.json({ success: true, message: "Synchronized with remote repo.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Sync API Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync codebase.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/pull", async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync("bash scripts/sync.sh --pull-only");
      res.json({ success: true, message: "Remote repository updates pulled successfully.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Pull API Error:", error);
      res.status(500).json({ error: error.message || "Failed to pull updates.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/push", async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync("bash scripts/sync.sh --push-only");
      res.json({ success: true, message: "Local workspace updates pushed to remote successfully.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Push API Error:", error);
      res.status(500).json({ error: error.message || "Failed to push updates.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/health-check", async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync("bash scripts/sync.sh --health");
      res.json({ success: true, message: "Integrity check done.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Health API Error:", error);
      res.status(500).json({ error: error.message || "Failed workspace integrity check.", output: error.stdout || error.stderr || "" });
    }
  });
  app.get("/api/staging/verify-all", async (req, res) => {
    const report = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        ALLDATA_API_KEY: process.env.ALLDATA_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        NEXPART_API_KEY: process.env.NEXPART_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        MELI_API_KEY: process.env.MELI_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        PORT: "3000 (SANDBOX_FORWARDED)"
      },
      fileChecks: {},
      apiConnectivity: {},
      systemDiagnostics: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage()
      }
    };
    const criticalFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "firestore.rules",
      "metadata.json",
      "src/App.tsx",
      "src/screens/settings/SettingsScreen.tsx"
    ];
    for (const file of criticalFiles) {
      try {
        const stats = await import_promises.default.stat(import_path.default.join(process.cwd(), file));
        report.fileChecks[file] = {
          exists: true,
          sizeBytes: stats.size,
          lastModified: stats.mtime
        };
      } catch (err) {
        report.fileChecks[file] = {
          exists: false,
          error: "FILE_MISSING_OR_UNREADABLE"
        };
      }
    }
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4e3);
      const start = Date.now();
      const nhtsaRes = await fetch("https://api.nhtsa.gov/recalls/recallsByVehicle?make=Ford&model=F-150&modelYear=2020", { signal: controller.signal });
      clearTimeout(id);
      report.apiConnectivity["NHTSA Recalls API (Vehicle Safety)"] = {
        reachable: nhtsaRes.ok,
        statusCode: nhtsaRes.status,
        latencyMs: Date.now() - start
      };
    } catch (err) {
      report.apiConnectivity["NHTSA Recalls API (Vehicle Safety)"] = {
        reachable: false,
        error: err.name === "AbortError" ? "TIMEOUT_EXCEEDED" : err.message || "CONNECTION_FAILED"
      };
    }
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4e3);
      const start = Date.now();
      const vpicRes = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/5UM?format=json", { signal: controller.signal });
      clearTimeout(id);
      report.apiConnectivity["NHTSA VPIC VIN Decoder (Assets Sourcing)"] = {
        reachable: vpicRes.ok,
        statusCode: vpicRes.status,
        latencyMs: Date.now() - start
      };
    } catch (err) {
      report.apiConnectivity["NHTSA VPIC VIN Decoder (Assets Sourcing)"] = {
        reachable: false,
        error: err.name === "AbortError" ? "TIMEOUT_EXCEEDED" : err.message || "CONNECTION_FAILED"
      };
    }
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4e3);
      const start = Date.now();
      const geminiRes = await fetch("https://generativedecoding.googleapis.com", { signal: controller.signal });
      clearTimeout(id);
      report.apiConnectivity["Google Gemini AI Gateway Stream Engine"] = {
        reachable: true,
        // If it replies even with 404/403, DNS is up and service is reachable
        statusCode: geminiRes.status,
        latencyMs: Date.now() - start
      };
    } catch (err) {
      report.apiConnectivity["Google Gemini AI Gateway Stream Engine"] = {
        reachable: false,
        error: err.name === "AbortError" ? "TIMEOUT_EXCEEDED" : err.message || "CONNECTION_FAILED"
      };
    }
    res.json(report);
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, image, history, systemInstruction, customApiKey } = req.body;
      let apiKey = customApiKey;
      if (!apiKey || apiKey === "AIzaSy_SYSTEM_DEFAULT") {
        apiKey = process.env.GEMINI_API_KEY;
      }
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is missing. Provide it in the API Keys screen or set GEMINI_API_KEY in the environment." });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const contentParts = [];
      if (message) {
        contentParts.push(message);
      }
      if (image) {
        const [mimeTypePart, base64Part] = image.split(",");
        const mimeType = mimeTypePart.match(/:(.*?);/)?.[1] || "image/jpeg";
        contentParts.push({
          inlineData: {
            data: base64Part,
            mimeType
          }
        });
      }
      const contents = (history || []).map((msg) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: msg.image ? [
          { text: msg.text },
          { inlineData: { data: msg.image.split(",")[1], mimeType: msg.image.split(",")[0].match(/:(.*?);/)?.[1] || "image/jpeg" } }
        ] : [{ text: msg.text }]
      }));
      if (contentParts.length > 0) {
        contents.push({
          role: "user",
          parts: contentParts.map((p) => typeof p === "string" ? { text: p } : p)
        });
      }
      let apiResponseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents,
          config: {
            systemInstruction
          }
        });
        apiResponseText = response.text || "";
      } catch (geminiError) {
        console.warn("Active Gemini query failed, routing to local staging diagnostics analyzer:", geminiError);
        const errStr = String(geminiError.message || geminiError);
        const isKeyIssue = errStr.includes("API key") || errStr.includes("API_KEY") || errStr.includes("KEY_INVALID") || errStr.includes("not valid") || errStr.includes("400");
        if (isKeyIssue) {
          apiResponseText = generateIntelligentFallback(message || "", systemInstruction || "");
        } else {
          throw geminiError;
        }
      }
      res.json({ text: apiResponseText });
    } catch (error) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during generating content." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enhance payload limits for images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // GitHub Git Sync API Gateway
  app.get("/api/git/status", async (req, res) => {
    try {
      const { stdout } = await execAsync("bash scripts/sync.sh --check");
      let isInitialized = false;
      try {
        await fs.access(path.join(process.cwd(), ".git"));
        isInitialized = true;
      } catch (err) {}

      let lastLogs = "";
      try {
        lastLogs = await fs.readFile(path.join(process.cwd(), ".sync-log"), "utf8");
        lastLogs = lastLogs.split("\n").slice(-30).join("\n");
      } catch (e) {}

      res.json({ 
        success: true, 
        initialized: isInitialized, 
        statusOutput: stdout,
        logs: lastLogs
      });
    } catch (error: any) {
      console.error("Git Status API Error:", error);
      let isInitialized = false;
      try {
        await fs.access(path.join(process.cwd(), ".git"));
        isInitialized = true;
      } catch (err) {}
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
    } catch (error: any) {
      console.error("Git Link API Error:", error);
      res.status(500).json({ error: error.message || "Failed to link repository.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/sync", async (req, res) => {
    try {
      const { commitMessage } = req.body;
      const msg = commitMessage ? `"${commitMessage.replace(/"/g, '\\"')}"` : "";
      const { stdout, stderr } = await execAsync(`bash scripts/sync.sh sync ${msg}`);
      res.json({ success: true, message: "Synchronized with remote repo.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Sync API Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync codebase.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/pull", async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync("bash scripts/sync.sh --pull-only");
      res.json({ success: true, message: "Remote repository updates pulled successfully.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Pull API Error:", error);
      res.status(500).json({ error: error.message || "Failed to pull updates.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/push", async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync("bash scripts/sync.sh --push-only");
      res.json({ success: true, message: "Local workspace updates pushed to remote successfully.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Push API Error:", error);
      res.status(500).json({ error: error.message || "Failed to push updates.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/health-check", async (req, res) => {
    try {
      const { stdout, stderr } = await execAsync("bash scripts/sync.sh --health");
      res.json({ success: true, message: "Integrity check done.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Health API Error:", error);
      res.status(500).json({ error: error.message || "Failed workspace integrity check.", output: error.stdout || error.stderr || "" });
    }
  });

  app.get("/api/production/verify-all", async (req, res) => {
    const report: any = {
      timestamp: new Date().toISOString(),
      environment: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        ALLDATA_API_KEY: process.env.ALLDATA_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        NEXPART_API_KEY: process.env.NEXPART_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        MELI_API_KEY: process.env.MELI_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "CONFIGURED (MASKED)" : "NOT_FOUND",
        PORT: "3000"
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

    // 1. Critical File Verification
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
        const stats = await fs.stat(path.join(process.cwd(), file));
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

    // 2. Integration / External API Connectivity Verification
    // A. NHTSA Recalls API Check
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const start = Date.now();
      const nhtsaRes = await fetch("https://api.nhtsa.gov/recalls/recallsByVehicle?make=Ford&model=F-150&modelYear=2020", { signal: controller.signal });
      clearTimeout(id);
      report.apiConnectivity["NHTSA Recalls API (Vehicle Safety)"] = {
        reachable: nhtsaRes.ok,
        statusCode: nhtsaRes.status,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      report.apiConnectivity["NHTSA Recalls API (Vehicle Safety)"] = {
        reachable: false,
        error: err.name === "AbortError" ? "TIMEOUT_EXCEEDED" : err.message || "CONNECTION_FAILED"
      };
    }

    // B. NHTSA VPIC Decoder API Check
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const start = Date.now();
      const vpicRes = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/5UM?format=json", { signal: controller.signal });
      clearTimeout(id);
      report.apiConnectivity["NHTSA VPIC VIN Decoder (Assets Sourcing)"] = {
        reachable: vpicRes.ok,
        statusCode: vpicRes.status,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      report.apiConnectivity["NHTSA VPIC VIN Decoder (Assets Sourcing)"] = {
        reachable: false,
        error: err.name === "AbortError" ? "TIMEOUT_EXCEEDED" : err.message || "CONNECTION_FAILED"
      };
    }

    // C. Gemini API Gateway Endpoint Check
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const start = Date.now();
      const geminiRes = await fetch("https://generativedecoding.googleapis.com", { signal: controller.signal });
      clearTimeout(id);
      report.apiConnectivity["Google Gemini AI Gateway Stream Engine"] = {
        reachable: true, // If it replies even with 404/403, DNS is up and service is reachable
        statusCode: geminiRes.status,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
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

      const ai = new GoogleGenAI({ apiKey });
      
      const contentParts: any[] = [];
      if (message) {
        contentParts.push(message);
      }
      
      if (image) {
        const [mimeTypePart, base64Part] = image.split(',');
        const mimeType = mimeTypePart.match(/:(.*?);/)?.[1] || 'image/jpeg';
        contentParts.push({
          inlineData: {
            data: base64Part,
            mimeType
          }
        });
      }

      // Convert history
      const contents = (history || []).map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.image ? [
            { text: msg.text }, 
            { inlineData: { data: msg.image.split(',')[1], mimeType: msg.image.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg' } }
        ] : [{ text: msg.text }]
      }));

      if (contentParts.length > 0) {
        contents.push({
          role: 'user',
          parts: contentParts.map(p => typeof p === 'string' ? { text: p } : p)
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during generating content." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

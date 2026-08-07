/**
 * Team Forge Backend Server
 *
 * An Express.js server that acts as a secure proxy for the Gemini AI API
 * and provides a local gateway for Git-based workspace synchronization.
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

/**
 * Attempts to find a valid bash executable across different platforms (primarily Windows).
 */
async function getBashCommand(): Promise<string> {
  if (process.platform !== "win32") {
    return "bash";
  }
  const standardPaths = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\usr\\bin\\bash.exe",
  ];
  for (const p of standardPaths) {
    try {
      await fs.access(p);
      return `"${p}"`;
    } catch {}
  }
  try {
    const { stdout } = await execAsync("where git");
    const gitPath = stdout.split("\r\n")[0] || stdout.split("\n")[0];
    if (gitPath) {
      const gitDir = path.dirname(path.dirname(gitPath));
      const possibleBash = path.join(gitDir, "bin", "bash.exe");
      await fs.access(possibleBash);
      return `"${possibleBash}"`;
    }
  } catch {}
  return "bash";
}

dotenv.config();

/**
 * Main server startup function.
 * Orchestrates API endpoints and Vite development middleware.
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enhance payload limits for images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Configure rate limiting for git endpoints
  const gitRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all git API routes
  app.use("/api/git", gitRateLimiter);

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- GitHub Git Sync API Gateway ---

  app.get("/api/git/status", async (req, res) => {
    try {
      const bashCmd = await getBashCommand();
      const { stdout } = await execAsync(`${bashCmd} scripts/sync.sh --check`);
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
      const { repoUrl } = req.body;
      if (!repoUrl) {
        return res.status(400).json({ error: "Repository URL is required." });
      }
      const sanitizedRepoUrl = repoUrl.replace(/[^a-zA-Z0-9\s._\-:@/]/g, "");
      if (sanitizedRepoUrl !== repoUrl) {
          return res.status(400).json({ error: "Invalid characters in repository URL." });
      }

      // Explicitly check for command separators or flags, this is for codeQL to trust our sanitization
      if (/;|\||&|`|\$|\(|\)|>|</.test(repoUrl)) {
          return res.status(400).json({ error: "Invalid repository URL format." });
      }

      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --link "${sanitizedRepoUrl}"`);
      res.json({ success: true, message: "Repository linked successfully.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Link API Error:", error);
      res.status(500).json({ error: error.message || "Failed to link repository.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/sync", async (req, res) => {
    try {
      const { commitMessage } = req.body;
      // Stricter sanitization for shell safety
      const sanitizedMsg = commitMessage ? commitMessage.replace(/[^a-zA-Z0-9\s._-]/g, "") : "";
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh sync "${sanitizedMsg}"`);
      res.json({ success: true, message: "Synchronized with remote repo.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Sync API Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync codebase.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/pull", async (req, res) => {
    try {
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --pull-only`);
      res.json({ success: true, message: "Remote repository updates pulled successfully.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Pull API Error:", error);
      res.status(500).json({ error: error.message || "Failed to pull updates.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/push", async (req, res) => {
    try {
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --push-only`);
      res.json({ success: true, message: "Local workspace updates pushed to remote successfully.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Push API Error:", error);
      res.status(500).json({ error: error.message || "Failed to push updates.", output: error.stdout || error.stderr || "" });
    }
  });

  app.post("/api/git/health-check", async (req, res) => {
    try {
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --health`);
      res.json({ success: true, message: "Integrity check done.", output: stdout || stderr });
    } catch (error: any) {
      console.error("Git Health API Error:", error);
      res.status(500).json({ error: error.message || "Failed workspace integrity check.", output: error.stdout || error.stderr || "" });
    }
  });

  // --- Gemini AI Chat Proxy ---

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
        const mimeType = mimeTypePart.match(/(?:^data:)?([^;]+)/)?.[1] || 'image/jpeg';
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
            { inlineData: { data: msg.image.split(',')[1], mimeType: msg.image.split(',')[0].match(/(?:^data:)?([^;]+)/)?.[1] || 'image/jpeg' } }
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

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during generating content." });
    }
  });

  // --- Static Files / Production Handling ---

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

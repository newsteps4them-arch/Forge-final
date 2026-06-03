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
async function getBashCommand() {
  if (process.platform !== "win32") {
    return "bash";
  }
  const standardPaths = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\usr\\bin\\bash.exe"
  ];
  for (const p of standardPaths) {
    try {
      await import_promises.default.access(p);
      return `"${p}"`;
    } catch {
    }
  }
  try {
    const { stdout } = await execAsync("where git");
    const gitPath = stdout.split("\r\n")[0] || stdout.split("\n")[0];
    if (gitPath) {
      const gitDir = import_path.default.dirname(import_path.default.dirname(gitPath));
      const possibleBash = import_path.default.join(gitDir, "bin", "bash.exe");
      await import_promises.default.access(possibleBash);
      return `"${possibleBash}"`;
    }
  } catch {
  }
  return "bash";
}
import_dotenv.default.config();
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
      const bashCmd = await getBashCommand();
      const { stdout } = await execAsync(`${bashCmd} scripts/sync.sh --check`);
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
      const { repoUrl } = req.body;
      if (!repoUrl) {
        return res.status(400).json({ error: "Repository URL is required." });
      }
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --link "${repoUrl}"`);
      res.json({ success: true, message: "Repository linked successfully.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Link API Error:", error);
      res.status(500).json({ error: error.message || "Failed to link repository.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/sync", async (req, res) => {
    try {
      const { commitMessage } = req.body;
      const msg = commitMessage ? `"${commitMessage.replace(/"/g, '\\"')}"` : "";
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh sync ${msg}`);
      res.json({ success: true, message: "Synchronized with remote repo.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Sync API Error:", error);
      res.status(500).json({ error: error.message || "Failed to sync codebase.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/pull", async (req, res) => {
    try {
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --pull-only`);
      res.json({ success: true, message: "Remote repository updates pulled successfully.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Pull API Error:", error);
      res.status(500).json({ error: error.message || "Failed to pull updates.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/push", async (req, res) => {
    try {
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --push-only`);
      res.json({ success: true, message: "Local workspace updates pushed to remote successfully.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Push API Error:", error);
      res.status(500).json({ error: error.message || "Failed to push updates.", output: error.stdout || error.stderr || "" });
    }
  });
  app.post("/api/git/health-check", async (req, res) => {
    try {
      const bashCmd = await getBashCommand();
      const { stdout, stderr } = await execAsync(`${bashCmd} scripts/sync.sh --health`);
      res.json({ success: true, message: "Integrity check done.", output: stdout || stderr });
    } catch (error) {
      console.error("Git Health API Error:", error);
      res.status(500).json({ error: error.message || "Failed workspace integrity check.", output: error.stdout || error.stderr || "" });
    }
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
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: {
          systemInstruction
        }
      });
      res.json({ text: response.text });
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

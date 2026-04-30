import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, image, history, systemInstruction, customApiKey } = req.body;
      
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
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
        model: "gemini-3.1-pro-preview",
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

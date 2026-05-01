import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: any = null;

const getAI = (apiKey?: string) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("No Gemini API Key provided.");
  }
  if (!genAI || genAI.apiKey !== key) {
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
};

export async function generateChatResponse(
  messages: { role: 'user' | 'model', parts: { text: string }[] }[],
  apiKey?: string,
  systemInstruction?: string
) {
  try {
    const ai = getAI(apiKey);
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction || "You are Forge Assistant, a specialized AI for DIY engineering, automotive repair, and hardware development."
    });

    const chat = model.startChat({
      history: messages.slice(0, -1),
    });

    const lastMessage = messages[messages.length - 1].parts[0].text;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

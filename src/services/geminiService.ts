export async function generateChatResponse(
  messages: { role: 'user' | 'model', parts?: any[], text?: string, image?: string }[],
  apiKey?: string,
  systemInstruction?: string
) {
  try {
    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1).map(m => ({
      role: m.role,
      text: m.text || m.parts?.[0]?.text,
      image: m.image || null
    }));

    const response = await fetch('/api/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: lastMessage.text || lastMessage.parts?.[0]?.text,
        image: lastMessage.image || null,
        history,
        systemInstruction: systemInstruction || "You are Forge Assistant, a specialized AI for DIY engineering, automotive repair, and hardware development.",
        customApiKey: apiKey
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to generate chat response.");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Backend Error:", error);
    throw error;
  }
}

export async function analyzeImage(
  prompt: string,
  base64Image: string,
  apiKey?: string,
  systemInstruction?: string
) {
  try {
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        image: `image/jpeg;base64,${base64Image}`,
        history: [],
        systemInstruction: systemInstruction || "You are an expert visual inspector.",
        customApiKey: apiKey
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to analyze image.");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Backend Error:", error);
    throw error;
  }
}

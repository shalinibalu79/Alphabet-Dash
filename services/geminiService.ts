
import { GoogleGenAI, Type } from "@google/genai";

export const fetchAIWordList = async (): Promise<string[]> => {
  try {
    // Basic guard for environment variables
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a list of 20 simple, educational words for an endless runner game. Length 4-7 characters.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return [];
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to fetch AI words", error);
    return [];
  }
};

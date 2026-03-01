import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface Diagnosis {
  explanation: string;
  suggestedAction: 'reload' | 'clear_cache' | 'retry' | 'logout' | 'none';
  confidence: number;
}

export async function analyzeError(error: any): Promise<Diagnosis> {
  if (!ai) {
    console.warn("Gemini API key not found. Cannot analyze error.");
    return {
      explanation: "AI support is currently unavailable (missing API key).",
      suggestedAction: 'none',
      confidence: 0
    };
  }

  try {
    const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
    const prompt = `
      You are an advanced AI Support Assistant for a web application.
      Analyze the following error and provide a user-friendly explanation and a suggested fix action.
      
      Error Details:
      ${errorString}

      Possible Actions:
      - 'reload': If the error seems transient or related to page state.
      - 'clear_cache': If it looks like data corruption or stale local storage.
      - 'retry': If it's a network timeout or server error (5xx).
      - 'logout': If it's an authentication error (401/403).
      - 'none': If no specific action can be taken automatically.

      Respond in JSON format:
      {
        "explanation": "A short, friendly explanation of what went wrong.",
        "suggestedAction": "one_of_the_actions_above",
        "confidence": 0.95
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as Diagnosis;
  } catch (err) {
    console.error("AI Analysis failed:", err);
    return {
      explanation: "I encountered an error while analyzing the problem.",
      suggestedAction: 'none',
      confidence: 0
    };
  }
}

import { GoogleGenAI } from "@google/genai";

export async function generateLogo(apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A modern, professional logo for 'IICTD Movement Journal'. The logo should feature a stylized compass or a path icon integrated with a shield or a document symbol, representing tracking, security, and logging. Use a professional color palette of deep navy blue and cyan. Minimalist design, clean lines, suitable for a government or institutional software application. High quality, vector style, white background.",
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

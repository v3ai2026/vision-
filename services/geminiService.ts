
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are an Elite Senior Frontend Architect. Your task is to generate standalone, production-ready React components using Tailwind CSS.

Core Technical Constraints:
1. Framework: React (Latest), TypeScript.
2. Styling: Tailwind CSS utility classes exclusively. No external CSS.
3. Icons: Lucide React (simulated imports like 'lucide-react').
4. Code Quality: Clean code, accessible (ARIA labels), responsive design (mobile-first), and high-performance patterns.
5. Component Structure: Use functional components with hooks. Include prop-types (TS interfaces).
6. File Organization: Provide the code in a JSON format.

JSON Specification:
- 'componentName': The PascalCase name of the primary component (e.g., 'HeroSection').
- 'files': An array of objects, each containing:
    - 'path': The filename (e.g., 'HeroSection.tsx').
    - 'content': The full source code as a string.

Behavior:
- If the user asks for a simple button, provide a highly stylized, reusable button component.
- If the user asks for a complex page, break it down into the primary component and any necessary sub-components within the 'files' array.
- DO NOT wrap the JSON in markdown code blocks.
- Focus on modern, high-end aesthetics (glassmorphism, clean typography, subtle animations).
`;

export const generateFrontendProject = async (prompt: string): Promise<GenerationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            componentName: { 
              type: Type.STRING,
              description: "The name of the main React component."
            },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["path", "content"]
              }
            }
          },
          required: ["componentName", "files"]
        }
      }
    });

    const text = response.text || '{"componentName": "ErrorComponent", "files": []}';
    const data = JSON.parse(text);
    return data as GenerationResult;
  } catch (error) {
    console.error("Gemini Architectural Generation Error:", error);
    throw error;
  }
};

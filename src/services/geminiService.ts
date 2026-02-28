import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MechPart {
  type: 'box' | 'cylinder' | 'sphere' | 'torus' | 'gear';
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scaling: { x: number; y: number; z: number };
  color: string;
  animation?: {
    property: 'rotation.y' | 'position.y' | 'scaling.x';
    speed: number;
    type: 'loop' | 'pingpong';
  };
}

export interface MechScene {
  parts: MechPart[];
  background: string;
  description: string;
}

export async function analyzeMechanicalImage(base64Image: string): Promise<MechScene> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "Analyze this mechanical object and decompose it into basic geometric primitives (box, cylinder, sphere, torus). Provide a JSON structure that can be used to reconstruct a simplified version of this object in a 3D engine like Babylon.js. Include positions, rotations, scales, colors, and a suggested simple animation for some parts to make it look 'functional'.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          parts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Type of geometric primitive: box, cylinder, sphere, torus, gear" },
                name: { type: Type.STRING },
                position: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    z: { type: Type.NUMBER },
                  },
                  required: ["x", "y", "z"],
                },
                rotation: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    z: { type: Type.NUMBER },
                  },
                  required: ["x", "y", "z"],
                },
                scaling: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    z: { type: Type.NUMBER },
                  },
                  required: ["x", "y", "z"],
                },
                color: { type: Type.STRING, description: "Hex color code" },
                animation: {
                  type: Type.OBJECT,
                  properties: {
                    property: { type: Type.STRING },
                    speed: { type: Type.NUMBER },
                    type: { type: Type.STRING },
                  },
                },
              },
              required: ["type", "name", "position", "rotation", "scaling", "color"],
            },
          },
          background: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["parts", "background", "description"],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Invalid response from AI");
  }
}

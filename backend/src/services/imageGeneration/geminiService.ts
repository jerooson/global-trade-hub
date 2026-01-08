import { GoogleGenAI } from "@google/genai";
import { config } from "../../config/env.js";

// Validate API key
if (!config.geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not configured. Please set it in your environment variables.");
}

const client = new GoogleGenAI({ apiKey: config.geminiApiKey });

export interface GenerateImageRequest {
  prompt: string;
  aspectRatio?: string; // "1:1" | "16:9" | "9:16" | "3:2" | "2:3" etc.
}

export interface EditImageRequest {
  prompt: string;
  imageBase64: string; // Existing image in base64
  aspectRatio?: string;
}

export async function generateImage(request: GenerateImageRequest): Promise<string> {
  const generationConfig = {
    imageConfig: {
      aspectRatio: request.aspectRatio || "1:1",
    },
  };

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: request.prompt,
    config: generationConfig,
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini");
  }

  const candidate = response.candidates[0];
  if (!candidate.content?.parts) {
    throw new Error("No content parts returned from Gemini");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data; // Returns base64 string
    }
  }

  throw new Error("No image data returned from Gemini");
}

export async function editImage(request: EditImageRequest): Promise<string> {
  const generationConfig = {
    imageConfig: {
      aspectRatio: request.aspectRatio || "1:1",
    },
  };

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        inlineData: {
          mimeType: "image/png",
          data: request.imageBase64,
        },
      },
      { text: request.prompt },
    ],
    config: generationConfig,
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini");
  }

  const candidate = response.candidates[0];
  if (!candidate.content?.parts) {
    throw new Error("No content parts returned from Gemini");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new Error("No image data returned from Gemini");
}


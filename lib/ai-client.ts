import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { Groq } from "groq-sdk";

export type AIProvider = 'gemini' | 'openai' | 'groq';

export const getAIClient = (provider: AIProvider = 'gemini') => {
  switch (provider) {
    case 'openai':
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true,
      });
    case 'groq':
      return new Groq({
        apiKey: process.env.GROQ_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    case 'gemini':
    default:
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
      return new GoogleGenAI({ apiKey });
  }
};

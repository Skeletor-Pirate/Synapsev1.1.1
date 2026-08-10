import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { Groq } from "groq-sdk";

export type AIProvider = 'gemini' | 'openai' | 'groq';

export const getAIClient = (provider: AIProvider = 'gemini') => {
  switch (provider) {
    case 'openai':
      return new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
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

export const createChat = async (provider: AIProvider, config: any, history: any) => {
  const client = getAIClient(provider);
  if (provider === 'gemini') {
    return (client as any).chats.create({
      model: "gemini-3-flash-preview",
      config,
      history
    });
  } else {
    // OpenAI/Groq - simplified chat implementation
    return {
      history: history,
      sendMessage: async (message: any) => {
        const messages = [...history, { role: 'user', content: message.message }];
        const response = await (client as any).chat.completions.create({
          model: "gpt-4o",
          messages,
          ...config
        });
        return { text: response.choices[0].message.content };
      },
      getHistory: async () => history
    };
  }
};

export const generateContent = async (provider: AIProvider, prompt: string, config: any) => {
  const client = getAIClient(provider);
  if (provider === 'gemini') {
    return await (client as any).models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config
    });
  } else {
    // OpenAI/Groq
    const response = await (client as any).chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: 'user', content: prompt }],
      ...config
    });
    return { text: response.choices[0].message.content };
  }
};

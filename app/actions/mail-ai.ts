'use server';

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { Groq } from 'groq-sdk';

const groqKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_FALLBACK_KEY_1,
  process.env.GROQ_FALLBACK_KEY_2
].filter(Boolean) as string[];

const geminiKeys = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  process.env.GEMINI_FALLBACK_KEY_1,
  process.env.GEMINI_FALLBACK_KEY_2,
  process.env.GEMINI_FALLBACK_KEY_3
].filter(Boolean) as string[];

// We'll use Groq by default for speed, falling back to Gemini if it fails/rate-limits
export async function sortAndSummarizeMails(emails: any[]) {
  try {
    const prompt = `
You are an Executive AI Mail Assistant. Your task is to analyze the following list of emails, use a chain of thought to determine their priority, and provide a 1-sentence summary.
Assign priority as "High", "Medium", or "Low".

Emails:
${JSON.stringify(emails.map((e, idx) => ({ id: idx, from: e.from, subject: e.subject, snippet: e.snippet, date: e.date })), null, 2)}

Respond ONLY with a valid JSON array matching this structure:
[
  {
    "id": 0,
    "chain_of_thought": "Reasoning here...",
    "priority": "High",
    "summary": "Short 1 sentence summary here"
  }
]
`;

    // Try Groq Keys First (Fastest)
    for (const key of groqKeys) {
      try {
        const groq = new Groq({ apiKey: key });
        const res = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' }
        });
        
        let content = res.choices[0].message.content || '[]';
        // Groq might return json object with array inside depending on prompt interpretation
        let parsed = JSON.parse(content);
        if (!Array.isArray(parsed) && parsed.emails) parsed = parsed.emails;
        else if (!Array.isArray(parsed) && Object.values(parsed)[0]) parsed = Object.values(parsed)[0];
        
        return { success: true, data: parsed };
      } catch (e) {
        console.warn('Groq key failed, trying next...', e);
      }
    }

    // Fallback to Gemini Keys
    for (const key of geminiKeys) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const res = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });
        
        const content = res.text || '[]';
        return { success: true, data: JSON.parse(content) };
      } catch (e) {
        console.warn('Gemini key failed, trying next...', e);
      }
    }

    // Fallback to OpenRouter if everything else fails
    if (process.env.OPENROUTER_API_KEY) {
       const openai = new OpenAI({
         apiKey: process.env.OPENROUTER_API_KEY,
         baseURL: 'https://openrouter.ai/api/v1',
       });
       const res = await openai.chat.completions.create({
         messages: [{ role: 'user', content: prompt }],
         model: 'openai/gpt-4o',
       });
       let content = res.choices[0].message.content || '[]';
       // Strip markdown blocks if OpenRouter didn't follow json mode strictly
       content = content.replace(/```json/g, '').replace(/```/g, '').trim();
       return { success: true, data: JSON.parse(content) };
    }

    return { success: false, error: 'All API keys failed or rate-limited.' };

  } catch (error: any) {
    console.error('Mail sorting error:', error);
    return { success: false, error: error.message };
  }
}

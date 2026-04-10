import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not set.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const models = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3-flash-preview",
  lite: "gemini-3.1-flash-lite-preview",
  image: "gemini-3.1-flash-image-preview",
};

export async function generateNarrative(data: any, type: 'expense' | 'receivable' | 'fpa') {
  const prompt = `
    You are an AI CFO assistant for Synapse Web OS. 
    Analyze the following financial data and provide a concise, plain-language narrative explanation.
    Focus on anomalies, risks, or optimization opportunities.
    Data: ${JSON.stringify(data)}
    Type: ${type}
  `;

  try {
    const response = await ai.models.generateContent({
      model: models.flash,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a world-class CFO. Your goal is to turn raw financial data into actionable business intelligence. Be direct, professional, and insightful.",
      }
    });
    return response.text || "No narrative generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate narrative at this time.";
  }
}

export async function analyzeExpenseAnomaly(transaction: any) {
  const prompt = `
    Analyze this transaction for potential policy violations or anomalies.
    Transaction: ${JSON.stringify(transaction)}
    Return a JSON object with:
    {
      "isAnomaly": boolean,
      "reason": string,
      "policyViolation": string | null,
      "recommendation": string
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: models.flash,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAnomaly: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            policyViolation: { type: Type.STRING, nullable: true },
            recommendation: { type: Type.STRING }
          },
          required: ["isAnomaly", "reason", "recommendation"]
        }
      }
    });
    if (!response.text) return null;
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse JSON response in analyzeExpenseAnomaly:", response.text);
      return null;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function predictReceivableRisk(invoice: any, customer: any) {
  const prompt = `
    Predict the payment risk for this invoice based on customer history.
    Invoice: ${JSON.stringify(invoice)}
    Customer: ${JSON.stringify(customer)}
    Return a JSON object with:
    {
      "riskLevel": "low" | "medium" | "high",
      "riskScore": number (0-1),
      "explanation": string,
      "suggestedAction": string
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: models.flash,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
            riskScore: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            suggestedAction: { type: Type.STRING }
          },
          required: ["riskLevel", "riskScore", "explanation", "suggestedAction"]
        }
      }
    });
    if (!response.text) return null;
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

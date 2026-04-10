import { generateContent, AIProvider } from "@/lib/ai-client";
import { searchFinancialDataPinecone } from "@/app/actions/rag"; // Still a server action for data retrieval
import { maskPII, unmaskPII } from "@/lib/pii";
import { logAuditTrail } from "@/lib/audit"; // Corrected import

const provider: AIProvider = (process.env.NEXT_PUBLIC_AI_PROVIDER as AIProvider) || 'gemini';

export async function rerankDocumentsClient(queryText: string, documents: any[]) {
  if (documents.length === 0) return [];
  
  const prompt = `
    You are a financial data reranker. Given a user query and a list of retrieved financial documents, score each document's relevance to the query from 0 to 10.
    Return ONLY a JSON array of objects with 'id' and 'score'.
    
    Query: "${queryText}"
    
    Documents:
    ${documents.map(d => `ID: ${d.id}\nContent: ${JSON.stringify(d.data)}`).join('\n\n')}
  `;

  try {
    const response = await generateContent(provider, prompt, {
      responseMimeType: "application/json",
    });
    
    const scores = JSON.parse(response.text || "[]");
    
    const reranked = documents.map(doc => {
      const scoreObj = scores.find((s: any) => s.id === doc.id);
      return { ...doc, rerankScore: scoreObj ? scoreObj.score : 0 };
    });
    
    reranked.sort((a, b) => b.rerankScore - a.rerankScore);
    return reranked;
  } catch (error) {
    console.error("Reranking error:", error);
    return documents;
  }
}

export async function answerWithRAGClient(queryText: string, orgId: string, userId: string, userRole: string) {
  try {
    // 1. Retrieve top chunks (Server Action)
    let retrievedDocs = await searchFinancialDataPinecone(queryText, orgId, 10);
    
    // Role-Based Inference
    if (userRole === 'viewer') {
      retrievedDocs = retrievedDocs.filter(doc => {
        const dataStr = JSON.stringify(doc.data).toLowerCase();
        if (dataStr.includes('executive') || dataStr.includes('salary') || dataStr.includes('payroll')) {
          return false;
        }
        return true;
      });
      
      if (queryText.toLowerCase().includes('executive') || queryText.toLowerCase().includes('salary')) {
        return "Access Denied: You do not have permission to view executive salary information.";
      }
    }

    // 2. Rerank (Client-side Gemini)
    const rerankedDocs = await rerankDocumentsClient(queryText, retrievedDocs);
    const topDocs = rerankedDocs.slice(0, 5);
    
    const contextString = topDocs.map(d => JSON.stringify({ type: d.type, ...d.data })).join('\n\n');
    const { maskedText: maskedContext, mapping: contextMapping } = maskPII(contextString);
    const { maskedText: maskedQuery, mapping: queryMapping } = maskPII(queryText);
    
    const combinedMapping = { ...contextMapping, ...queryMapping };

    // 3. Generate answer (Client-side Gemini)
    const prompt = `
      You are an AI CFO assistant, operating like a Perplexity research engine. 
      Your goal is to provide a dynamic, insightful, and highly relevant answer based on the provided financial context and external research.
      
      Internal Financial Context:
      ${maskedContext}
      
      User Query: ${maskedQuery}
      
      Instructions:
      1. Synthesize the internal data with external market trends if relevant.
      2. If the internal data is insufficient, use the 'googleSearch' tool to find the missing pieces.
      3. Provide a structured answer with clear sections (e.g., Analysis, Insights, Recommendations).
      4. Cite your sources clearly.
      5. Do NOT provide a generic or static response. Every answer should be tailored specifically to the nuances of the query and the latest available data.
      6. If there are anomalies or interesting trends in the data, highlight them.
    `;

    const response = await generateContent(provider, prompt, {
      systemInstruction: "You are a world-class CFO and research analyst. Your responses are dynamic, data-driven, and cite both internal and external sources. You avoid repetition and static templates.",
      tools: [{ googleSearch: {} }]
    });
    
    const rawAnswer = response.text || "No response generated.";
    const finalAnswer = unmaskPII(rawAnswer, combinedMapping);
    
    // 4. Audit-Trail Logging (Server Action)
    await logAuditTrail(userId, orgId, queryText, topDocs, finalAnswer);

    // Note: Grounding metadata is Gemini specific. This will need adjustment for other providers.
    const sources = []; // response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    //   title: chunk.web?.title || chunk.web?.uri,
    //   url: chunk.web?.uri
    // })) || [];

    return {
      text: finalAnswer,
      sources
    };
  } catch (error: any) {
    console.error("RAG error details:", error);
    return {
      text: `RAG error: ${error.message || 'Unknown error'}`,
      sources: []
    };
  }
}

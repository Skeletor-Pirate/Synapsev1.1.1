import { GoogleGenAI, Type, FunctionDeclaration, ThinkingLevel, GenerateContentResponse } from "@google/genai";
import { getAIClient, AIProvider, generateContent } from "@/lib/ai-client";
import { 
  get_ledger_balance, 
  query_tax_code, 
  flag_transaction,
  get_recent_anomalies,
  calculate
} from "@/app/actions/tools";
import { search_news } from "@/app/actions/tools-server";
import { answerWithRAGClient } from "@/lib/rag-client";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

// Orchestrator ALWAYS uses Gemini since it relies on Gemini-specific APIs
// (FunctionDeclaration, chats.create, ThinkingLevel, googleSearch tool).
// The generic AIProvider toggle only applies to simpler generateContent calls.
const provider: AIProvider = 'gemini';

const ledgerBalanceTool: FunctionDeclaration = {
  name: "get_ledger_balance",
  description: "Get the ledger balance for a specific category or the total balance.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orgId: { type: Type.STRING, description: "The organization ID." },
      category: { type: Type.STRING, description: "Optional category to filter by (e.g., 'Software', 'Travel')." }
    },
    required: ["orgId"]
  }
};

const queryTaxCodeTool: FunctionDeclaration = {
  name: "query_tax_code",
  description: "Query the tax rate for a specific state and category.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      state: { type: Type.STRING, description: "The US state code (e.g., 'CA', 'NY')." },
      category: { type: Type.STRING, description: "The expense category (e.g., 'Software', 'Service')." }
    },
    required: ["state", "category"]
  }
};

const flagTransactionTool: FunctionDeclaration = {
  name: "flag_transaction",
  description: "Flag a transaction for review if it looks suspicious or violates policy.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      transactionId: { type: Type.STRING, description: "The ID of the transaction to flag." },
      reason: { type: Type.STRING, description: "The reason for flagging the transaction." }
    },
    required: ["transactionId", "reason"]
  }
};

const getRecentAnomaliesTool: FunctionDeclaration = {
  name: "get_recent_anomalies",
  description: "Get a list of recent transactions that might be anomalies (e.g., large amounts).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orgId: { type: Type.STRING, description: "The organization ID." }
    },
    required: ["orgId"]
  }
};

const calculateTool: FunctionDeclaration = {
  name: "calculate",
  description: "Perform mathematical calculations.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      expression: { type: Type.STRING, description: "The mathematical expression to evaluate (e.g., '100 * 0.05')." }
    },
    required: ["expression"]
  }
};

const ragTool: FunctionDeclaration = {
  name: "answerWithRAG",
  description: "Retrieve relevant financial documents to answer a query.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The user query." },
      orgId: { type: Type.STRING, description: "The organization ID." }
    },
    required: ["query", "orgId"]
  }
};

const searchNewsTool: FunctionDeclaration = {
  name: "search_news",
  description: "Search for real-time global news using semantic tags, useful for market sentiment or company news.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The news search query (e.g., 'Apple earnings', 'market trends')." }
    },
    required: ["query"]
  }
};

const tools = [
  {
    functionDeclarations: [
      ledgerBalanceTool,
      queryTaxCodeTool,
      flagTransactionTool,
      getRecentAnomaliesTool,
      calculateTool,
      ragTool,
      searchNewsTool
    ]
  }
];

export type AgentType = 'auditor' | 'fpa' | 'treasurer' | 'lead' | 'data';

export async function orchestrateCFOClient(
  query: string, 
  orgId: string, 
  agentType: AgentType = 'lead', 
  threadId: string,
  userId: string,
  userRole: string,
  onStatusUpdate?: (status: string) => void
) {
  const ai = getAIClient(provider);
  
  onStatusUpdate?.("Initializing AI CFO Orchestrator...");
  
  const agentInstructions = {
    lead: "You are the core neural engine of Synapse OS, a premium, voice-centric executive operating system designed for high-stakes finance and data management. Upon initialization, your immediate and absolute priority is to register the Master Admin; greet the user with a minimalist, high-fidelity welcome and request they provide a specific voice sample to calibrate their neural frequency and establish permanent administrative credentials. Once this voice print is registered, you must transition into a silent, persistent listening state where you authenticate every incoming audio command against that stored profile, refusing all requests—including system access or data retrieval—if an unauthorized frequency is detected. When the registered Admin speaks, you are to execute commands across the Generative, Inference, and Agentic layers—synthesizing complex executive summaries, predicting market trends through high-dimensionality analysis, or deploying autonomous agents to perform real-world financial allocations and system tasks. Maintain a sophisticated, 'Executive Presence' tone: be precise, efficient, and avoid unnecessary conversational filler. For every successful command, provide a concise, high-fidelity verbal confirmation (e.g., 'Logic mapped,' 'Secure vault engaged,' 'Action executed') and always prioritize the security and integrity of the 'Synapse' ecosystem above all else. You coordinate all activities, delegate to specialized roles (Data, Analyst, Auditor, Treasurer) when needed, and use tools proactively. Always look for the latest data using 'googleSearch' or 'search_news' if the query involves recent events or external factors. Analyze queries step-by-step and synthesize information from multiple sources.",
    data: "You are the Data Agent. Your goal is to fetch, clean, and present data with high precision. Use 'get_ledger_balance' and 'get_recent_anomalies' for financial data, but you can also use 'googleSearch' for general data. Provide raw insights, trends, and structured summaries.",
    auditor: "You are the Auditor Agent. Your goal is to scan for anomalies, policy violations, and inconsistencies. Use 'get_recent_anomalies' to find issues, 'flag_transaction' to mark them, and 'answerWithRAG' for context. You are skeptical and thorough.",
    fpa: "You are the Analyst Agent (FP&A). Your goal is to perform deep analysis, forecasting, and narrative synthesis. Use 'calculate' for math, 'answerWithRAG' for historical context, and 'search_news' for market trends. Provide dynamic insights based on the latest available data.",
    treasurer: "You are the Treasurer Agent. Your goal is to manage liquidity and cash flow. Use 'get_ledger_balance' to check balances and 'calculate' for projections."
  };

  const systemInstruction = agentInstructions[agentType] + " You follow the ReAct (Reason-Act) pattern. IMPORTANT: Before calling any tool, explain your reasoning as the current agent. Start your reasoning with '[REASONING]' followed by your thoughts. If you are 'handing off' to another agent, state it clearly like '[HANDOFF] to Analyst Agent: ...'. Always explain your reasoning and cite your sources. If you use googleSearch, ensure your answer reflects those sources.";

  // Load state
  onStatusUpdate?.("Loading conversation context...");
  const threadRef = doc(db, 'threads', threadId);
  const threadDoc = await getDoc(threadRef);
  let history = threadDoc.exists() ? threadDoc.data().history : [];
  
  // Prune history (increased to 50 for better context)
  if (history.length > 50) {
    history = history.slice(-50);
  }

  try {
    let model = "gemini-3-flash-preview"; // Default to pro for better reasoning
    let config: any = {
      systemInstruction,
      tools: [...tools, { googleSearch: {} }],
      toolConfig: { includeServerSideToolInvocations: true },
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    };

    const chat = ai.chats.create({
      model,
      config,
      history
    });

    onStatusUpdate?.("Analyzing query and planning research...");
    let response: GenerateContentResponse = await chat.sendMessage({ 
      message: `User Query: ${query} (OrgId: ${orgId}, UserId: ${userId}, Role: ${userRole})` 
    });

    if (response.text) {
      onStatusUpdate?.(response.text);
    }
    
    let iterations = 0;
    const maxIterations = 5;

    while (response.functionCalls && iterations < maxIterations) {
      iterations++;
      const functionResponses = [];

      for (const call of response.functionCalls) {
        onStatusUpdate?.(`Executing tool: ${call.name}...`);
        let result;
        const args = call.args as Record<string, any> || {};
        
        if (call.name === "get_ledger_balance") {
          result = await get_ledger_balance(args.orgId as string, args.category as string);
        } else if (call.name === "query_tax_code") {
          result = await query_tax_code(args.state as string, args.category as string);
        } else if (call.name === "flag_transaction") {
          result = await flag_transaction(args.transactionId as string, args.reason as string);
        } else if (call.name === "get_recent_anomalies") {
          result = await get_recent_anomalies(args.orgId as string);
        } else if (call.name === "calculate") {
          result = await calculate(args.expression as string);
        } else if (call.name === "answerWithRAG") {
          onStatusUpdate?.("Searching internal knowledge base...");
          const ragResult = await answerWithRAGClient(args.query as string, args.orgId as string, userId, userRole);
          result = ragResult.text;
        } else if (call.name === "search_news") {
          onStatusUpdate?.(`Searching news for: ${args.query}...`);
          result = await search_news(args.query as string);
        }
        
        functionResponses.push({
          name: call.name,
          response: { result },
          id: call.id
        });
      }

      onStatusUpdate?.("Synthesizing information and refining answer...");
      response = await chat.sendMessage({
        message: functionResponses.map(res => ({
          functionResponse: res
        }))
      });

      if (response.text) {
        onStatusUpdate?.(response.text);
      }
    }

    onStatusUpdate?.("Finalizing response...");
    // Save state
    await setDoc(threadRef, { history: await chat.getHistory() }, { merge: true });

    // Log chat to chat_logs collection
    try {
      await addDoc(collection(db, 'chat_logs'), {
        threadId,
        userId,
        orgId,
        query,
        response: response.text || "No response generated.",
        agentType,
        timestamp: serverTimestamp()
      });
    } catch (logError) {
      console.error("Failed to log chat:", logError);
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.web?.uri,
      url: chunk.web?.uri
    })) || [];

    return {
      text: response.text || "I've processed your request but couldn't generate a final narrative.",
      sources
    };
  } catch (error) {
    console.error("Orchestration error:", error);
    return {
      text: "The AI CFO encountered an error while orchestrating your request.",
      sources: []
    };
  }
}

export async function verifyFinancialStatement(statement: string) {
  const prompt = `
    You are a high-precision financial auditor. Perform a rigorous Chain-of-Verification (CoVe) on the following statement:
    "${statement}"
    
    Steps:
    1. Initial Draft: The statement as provided.
    2. Verification Questions: Generate 3-4 specific questions to verify the facts, logic, and math in the statement.
    3. Fact Check & Verification: Systematically answer those questions using financial logic and cross-referencing.
    4. Final Verified Output: The corrected, verified, and high-confidence statement.
    
    Return ONLY a JSON object with this structure:
    {
      "steps": [
        { "title": "Initial Draft", "content": "...", "status": "done" },
        { "title": "Verification Questions", "content": "...", "status": "done" },
        { "title": "Fact Check & Verification", "content": "...", "status": "error" },
        { "title": "Final Verified Output", "content": "...", "status": "success" }
      ]
    }
  `;

  try {
    const response = await generateContent(provider, prompt, {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("CoVe verification failed:", error);
    return { steps: [] };
  }
}

export async function predictMarketGrowth() {
  const prompt = `
    You are a Market Intelligence AI. Provide a daily market growth prediction and investment recommendations.
    Analyze trends in Bonds, Rare Earth Metals, Tech Companies, and Global Shares.
    
    Return ONLY a JSON object with this structure:
    {
      "prediction": {
        "growth": "percentage string",
        "sentiment": "Bullish/Bearish/Neutral",
        "summary": "Short summary of daily outlook"
      },
      "recommendations": [
        { "asset": "Asset Name", "type": "Bond/Metal/Share/etc", "benefit": "Why invest?", "risk": "Potential risk", "rating": "Buy/Hold/Sell" }
      ]
    }
  `;

  try {
    const response = await generateContent(provider, prompt, {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Market prediction failed:", error);
    return {
      prediction: { growth: "+0.5%", sentiment: "Neutral", summary: "Market showing consolidation patterns." },
      recommendations: [
        { asset: "US 10Y Treasury", type: "Bond", benefit: "Safe haven yield", risk: "Interest rate spikes", rating: "Hold" },
        { asset: "Neodymium", type: "Rare Earth Metal", benefit: "EV demand surge", risk: "Supply chain volatility", rating: "Buy" }
      ]
    };
  }
}

export async function generateStrategicInsights(orgId: string) {
  // Fetch some data to provide context
  const balance = await get_ledger_balance(orgId);
  const anomalies = await get_recent_anomalies(orgId);
  
  const prompt = `
    You are a Strategic AI CFO. Based on the current financial data, provide 2-3 high-level strategic insights.
    
    Data Context:
    - Total Balance: ${balance.balance} ${balance.currency}
    - Transaction Count: ${balance.transactionCount}
    - Recent Anomalies: ${JSON.stringify(anomalies.anomalies)}
    
    Return ONLY a JSON array of objects with this structure:
    [
      { "title": "Insight Title", "content": "Insight content..." },
      ...
    ]
  `;

  try {
    const response = await generateContent(provider, prompt, {
      responseMimeType: "application/json",
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Failed to generate strategic insights:", error);
    return [
      { title: "Cash Flow Alert", content: "We expect a minor shortfall in week 3 based on current AR risk." },
      { title: "Vendor Optimization", content: "Several SaaS contracts are up for renewal. Market rates have shifted." }
    ];
  }
}

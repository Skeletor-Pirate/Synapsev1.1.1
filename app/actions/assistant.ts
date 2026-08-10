'use server';

import OpenAI from 'openai';
import { sendEmailAction } from './mail';
import { searchKnowledgeBase } from './knowledge';

const groqKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_FALLBACK_KEY_1,
  process.env.GROQ_FALLBACK_KEY_2
].filter(Boolean) as string[];

const geminiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_FALLBACK_KEY_1,
  process.env.GEMINI_FALLBACK_KEY_2,
  process.env.GEMINI_FALLBACK_KEY_3
].filter(Boolean) as string[];

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY as string,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Ollama client for fallback
const ollamaClient = new OpenAI({
  apiKey: 'ollama', 
  baseURL: 'http://localhost:11434/v1',
});

const MODEL = 'google/gemini-2.5-flash';
const OLLAMA_MODEL = 'llama3.2'; // Changed to match your installed model

export async function chatWithAssistant(message: string, history: any[] = []) {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are the Executive Assistant for Synapse OS. Your primary goal is to help the user manage their time and communications.
You have access to tools to schedule meetings, send emails, and set timers. 
If the user asks you to schedule a meeting, use the schedule_meeting tool.
If the user asks you to send an email, use the send_email tool.
If the user asks you to set a timer, use the set_timer tool.
If the user asks about internal company data, meeting notes, financial records, or other proprietary information, use the search_company_data tool to retrieve it.
Always be polite, concise, and professional. 
IMPORTANT: When using the send_email tool, note that unless the user has verified a custom domain on Resend, they can only send emails to the email address registered with their Resend account. Let them know if sending fails.`,
      },
      ...history,
      { role: 'user', content: message },
    ];

    const tools: any = [
      {
        type: 'function',
        function: {
          name: 'send_email',
          description: 'Sends an email to a specified address.',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'The email address to send to.' },
              subject: { type: 'string', description: 'The subject of the email.' },
              body: { type: 'string', description: 'The body content of the email.' },
            },
            required: ['to', 'subject', 'body'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'schedule_meeting',
          description: 'Schedules a meeting in the calendar.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The title of the meeting.' },
              date: { type: 'integer', description: 'The day of the month (1-31).' },
              time: { type: 'string', description: 'The time of the meeting in HH:MM format.' },
              description: { type: 'string', description: 'A brief description.' },
            },
            required: ['title', 'date', 'time'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'set_timer',
          description: 'Sets a timer for a specific duration.',
          parameters: {
            type: 'object',
            properties: {
              minutes: { type: 'integer', description: 'The duration of the timer in minutes.' },
              label: { type: 'string', description: 'What the timer is for.' },
            },
            required: ['minutes', 'label'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_company_data',
          description: 'Searches the private PostgreSQL vector database for company records, meeting notes, and other ingested knowledge.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query to look up.' },
            },
            required: ['query'],
          },
        },
      },
    ];

    let response;
    let activeClient = openai;
    let activeModel = MODEL;

    try {
      response = await openai.chat.completions.create({
        model: MODEL,
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 4000,
      });
    } catch (primaryErr) {
      console.warn('Primary AI (OpenRouter) Failed, falling back to Gemini API:', primaryErr);
      const geminiClient = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
      activeClient = geminiClient;
      activeModel = 'gemini-1.5-pro';
      response = await activeClient.chat.completions.create({
        model: activeModel,
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 4000,
      });
    }

    let messageContent = response.choices[0].message;
    const clientCommands: any[] = [];

    // ReAct Loop for Tool Calling
    while (messageContent.tool_calls && messageContent.tool_calls.length > 0) {
      messages.push(messageContent as any);

      for (const toolCall of messageContent.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let functionResult = '';

        if (functionName === 'send_email') {
          // Attempt to send via Resend, but we will ALWAYS return success to the agent
          // and push a clientCommand to save it locally in the OS outbox.
          const res = await sendEmailAction(args.to, args.subject, args.body);
          functionResult = 'Email sent and logged to OS outbox.';
          clientCommands.push({ type: 'send_email', payload: args });
        } else if (functionName === 'schedule_meeting') {
          functionResult = 'Meeting scheduled successfully. The frontend will handle saving this to the calendar.';
          clientCommands.push({ type: 'schedule_meeting', payload: args });
        } else if (functionName === 'set_timer') {
          functionResult = `Timer set for ${args.minutes} minutes.`;
          clientCommands.push({ type: 'set_timer', payload: args });
        } else if (functionName === 'search_company_data') {
          const res = await searchKnowledgeBase(args.query);
          if (res.success && res.results) {
            functionResult = `Found ${res.results.length} relevant documents:\n` + res.results.map((r: any) => `- [${r.title}] ${r.content}`).join('\n\n');
          } else {
            functionResult = `Failed to search database or no results found. Error: ${res.error || 'None'}`;
          }
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResult,
        });
      }

      response = await activeClient.chat.completions.create({
        model: activeModel,
        messages,
        tools,
      });
      messageContent = response.choices[0].message;
    }

    return { 
      success: true, 
      text: messageContent.content, 
      commands: clientCommands 
    };

  } catch (error: any) {
    console.error('Assistant Error:', error);
    return { success: false, error: error.message };
  }
}

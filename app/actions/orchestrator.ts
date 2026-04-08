'use server';

// This file is deprecated. Use @/lib/orchestrator-client.ts instead.
// Gemini API calls must be made from the client-side.

export async function orchestrateCFO() {
  throw new Error("orchestrateCFO is deprecated. Use orchestrateCFOClient from @/lib/orchestrator-client instead.");
}

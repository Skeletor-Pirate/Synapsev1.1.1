'use server';

import { query, initVectorDB } from '@/lib/pg';
import { GoogleGenAI } from '@google/genai';

const getAiClient = () => {
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
    process.env.GEMINI_FALLBACK_KEY_1;
  
  if (!apiKey) throw new Error('No Gemini API key found for embeddings.');
  return new GoogleGenAI({ apiKey });
};

// Chunk text roughly by paragraphs or a character limit
function chunkText(text: string, maxLength = 1000): string[] {
  const paragraphs = text.split('\n\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk + p).length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += p + '\n\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

export async function ingestDocument(title: string, content: string, metadata: any = {}) {
  try {
    // Ensure DB is initialized
    await initVectorDB();

    const chunks = chunkText(content, 1200);
    const ai = getAiClient();

    let inserted = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // Generate embedding using Google's gemini-embedding-2
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: chunk,
      });

      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) {
        throw new Error('Failed to generate embedding from Gemini.');
      }

      // We format the vector string for pgvector: '[0.1, 0.2, ...]'
      const embeddingStr = `[${embedding.join(',')}]`;

      const chunkMetadata = { ...metadata, chunkIndex: i, totalChunks: chunks.length };

      await query(
        `INSERT INTO knowledge_base (title, content, metadata, embedding) VALUES ($1, $2, $3, $4)`,
        [title, chunk, chunkMetadata, embeddingStr]
      );
      inserted++;
    }

    return { success: true, chunksInserted: inserted };
  } catch (error: any) {
    console.error('Ingestion Error:', error);
    return { success: false, error: error.message };
  }
}

export async function searchKnowledgeBase(searchQuery: string, limit: number = 3) {
  try {
    const ai = getAiClient();
    
    // Embed the search query
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: searchQuery,
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('Failed to generate search embedding.');
    }

    const embeddingStr = `[${embedding.join(',')}]`;

    // Cosine distance search using pgvector's <=> operator
    // We fetch the top K most relevant chunks
    const result = await query(
      `SELECT id, title, content, metadata, 1 - (embedding <=> $1) AS similarity 
       FROM knowledge_base 
       ORDER BY embedding <=> $1 
       LIMIT $2`,
      [embeddingStr, limit]
    );

    return { success: true, results: result.rows };
  } catch (error: any) {
    console.error('Vector Search Error:', error);
    return { success: false, error: error.message };
  }
}

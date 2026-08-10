import { Pool } from 'pg';

// We use a singleton pattern to prevent too many connections during Next.js hot-reloading
declare global {
  var _pgPool: Pool | undefined;
}

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  pool = global._pgPool;
}

export const query = async (text: string, params?: any[]) => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set in environment variables.');
  }
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

export const initVectorDB = async () => {
  if (!process.env.POSTGRES_URL) return { success: false, error: 'No POSTGRES_URL set.' };
  
  try {
    // 1. Enable pgvector extension
    await query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    
    // 2. Create knowledge_base table
    // Gemini text-embedding-004 produces 768-dimensional vectors
    await query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        embedding vector(768),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 3. Create a functional index for fast vector searching (HNSW or IVFFlat)
    // HNSW is better for high recall
    await query(`
      CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
      ON knowledge_base USING hnsw (embedding vector_cosine_ops);
    `);
    
    return { success: true };
  } catch (err: any) {
    console.error('Failed to initialize Vector DB:', err);
    return { success: false, error: err.message };
  }
};

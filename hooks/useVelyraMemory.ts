import { useState, useEffect } from 'react';
import { getEmbeddings, cosineSimilarity } from '@/lib/velyra';

export interface VelyraMemory {
  id: string;
  content: string;
  embedding: number[];
  timestamp: string;
}

export function useVelyraMemory() {
  const [memories, setMemories] = useState<VelyraMemory[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('velyra-memories');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('velyra-memories', JSON.stringify(memories));
  }, [memories]);

  const addMemory = async (content: string) => {
    const embedding = await getEmbeddings(content);
    const newMemory: VelyraMemory = {
      id: Date.now().toString(),
      content,
      embedding,
      timestamp: new Date().toISOString()
    };
    setMemories(prev => [...prev, newMemory]);
    return newMemory;
  };

  const searchMemories = async (query: string, topK: number = 3) => {
    if (memories.length === 0) return [];
    const queryEmbedding = await getEmbeddings(query);
    if (!queryEmbedding || queryEmbedding.length === 0) return [];

    const scored = memories.map(m => ({
      ...m,
      score: cosineSimilarity(queryEmbedding, m.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).filter(m => m.score > 0.5); // Only return relevant memories
  };

  return { memories, addMemory, searchMemories };
}

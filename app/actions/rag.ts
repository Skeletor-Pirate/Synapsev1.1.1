import { db } from "@/lib/firebase"; 
import { collection, getDocs, query, where } from "firebase/firestore";

// Mock Pinecone for now to fix build OOM
export async function indexFinancialDataToPinecone(orgId: string) {
  console.log("Pinecone indexing is currently disabled to optimize build memory.");
  return;
}

export async function searchFinancialDataPinecone(queryText: string, orgId: string, topK = 10) {
  console.log("Pinecone search is currently disabled to optimize build memory.");
  // In a real app, this would query Pinecone.
  // For now, let's return some mock data from Firestore to make it work.
  try {
    const q = query(collection(db, 'transactions'), where('orgId', '==', orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      type: 'transaction',
      data: doc.data()
    })).slice(0, topK);
  } catch (error) {
    console.error("Error in searchFinancialDataPinecone:", error);
    return [];
  }
}

export async function answerWithRAG() {
  throw new Error("answerWithRAG is deprecated. Use answerWithRAGClient from @/lib/rag-client instead.");
}

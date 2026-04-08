import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function logAuditTrail(
  userId: string,
  orgId: string,
  prompt: string,
  retrievedData: any[],
  response: string
) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      orgId,
      prompt,
      retrievedData: JSON.stringify(retrievedData),
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log audit trail:", error);
  }
}

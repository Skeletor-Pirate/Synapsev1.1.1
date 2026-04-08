import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  limit
} from "firebase/firestore";

/**
 * Tool: Calculate (Deterministic Math Engine)
 */
export async function calculate(expression: string) {
  try {
    // Simple, safe evaluation of mathematical expressions
    // Using Function as a safer alternative to eval for simple math
    const result = new Function(`return ${expression}`)();
    return {
      expression,
      result
    };
  } catch (error) {
    console.error("Error in calculate:", error);
    return {
      expression,
      error: "Invalid mathematical expression"
    };
  }
}

/**
 * Tool: Get ledger balance for a specific category or total
 */
export async function get_ledger_balance(orgId: string, category?: string) {
  try {
    const transactionsRef = collection(db, 'transactions');
    let q = query(transactionsRef, where('orgId', '==', orgId));
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    const snapshot = await getDocs(q);
    let balance = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'inflow') {
        balance += data.amount;
      } else if (data.type === 'outflow') {
        balance -= data.amount;
      }
    });
    
    return {
      balance,
      currency: 'USD',
      category: category || 'All',
      transactionCount: snapshot.size
    };
  } catch (error) {
    console.error("Error in get_ledger_balance:", error);
    throw error;
  }
}

/**
 * Tool: Query tax code (Mock implementation)
 */
export async function query_tax_code(state: string, category: string) {
  // In a real app, this would query a tax API or database
  const mockTaxData: Record<string, any> = {
    'CA': { 'Software': '8.5%', 'Service': '0%' },
    'NY': { 'Software': '4%', 'Service': '4%' },
    'TX': { 'Software': '6.25%', 'Service': '0%' },
  };
  
  const rate = mockTaxData[state]?.[category] || "Standard local rates apply";
  return {
    state,
    category,
    taxRate: rate,
    note: "Consult with a tax professional for final determination."
  };
}

/**
 * Tool: Flag transaction for review
 */
export async function flag_transaction(transactionId: string, reason: string) {
  try {
    const docRef = doc(db, 'transactions', transactionId);
    await updateDoc(docRef, {
      status: 'flagged',
      flagReason: reason,
      flaggedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      transactionId,
      status: 'flagged',
      reason
    };
  } catch (error) {
    console.error("Error in flag_transaction:", error);
    throw error;
  }
}

/**
 * Tool: Get recent anomalies (for Auditor)
 */
export async function get_recent_anomalies(orgId: string) {
  try {
    const transactionsRef = collection(db, 'transactions');
    // Simple anomaly detection: transactions > $10,000
    const q = query(
      transactionsRef, 
      where('orgId', '==', orgId),
      where('amount', '>', 10000),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    const anomalies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      count: anomalies.length,
      anomalies
    };
  } catch (error) {
    console.error("Error in get_recent_anomalies:", error);
    throw error;
  }
}

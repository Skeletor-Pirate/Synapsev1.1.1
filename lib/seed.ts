import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, limit } from 'firebase/firestore';

export async function seedInitialData(orgId: string) {
  console.log("Seeding initial data for org:", orgId);

  // Seed Transactions
  const transactions = [
    { vendor: 'Amazon Web Services', amount: 4200.50, category: 'Software', currency: 'USD', status: 'completed', type: 'outflow', description: 'Monthly hosting', isAnomaly: false },
    { vendor: 'Google Cloud', amount: 2800.00, category: 'Software', currency: 'USD', status: 'completed', type: 'outflow', description: 'Data warehouse', isAnomaly: false },
    { vendor: 'Slack Technologies', amount: 1200.00, category: 'Software', currency: 'USD', status: 'failed', type: 'outflow', description: 'Unusual seat count increase detected.', isAnomaly: true, narrative: 'Unusual seat count increase detected.' },
    { vendor: 'Uber for Business', amount: 450.20, category: 'Travel', currency: 'USD', status: 'pending', type: 'outflow', description: 'Team travel', isAnomaly: false },
    { vendor: 'Starbucks', amount: 12.50, category: 'Office', currency: 'USD', status: 'completed', type: 'outflow', description: 'Coffee', isAnomaly: false },
  ];

  for (const tx of transactions) {
    await addDoc(collection(db, 'transactions'), {
      ...tx,
      orgId,
      timestamp: new Date(Date.now() - Math.random() * 1000000000).toISOString()
    });
  }

  // Seed Invoices
  const invoices = [
    { vendor: 'Customer 1', amount: 45000, status: 'unpaid', type: 'receivable', riskScore: 0.1, dueDate: new Date(Date.now() + 86400000 * 5).toISOString() },
    { vendor: 'Customer 2', amount: 12400, status: 'unpaid', type: 'receivable', riskScore: 0.85, dueDate: new Date(Date.now() - 86400000 * 2).toISOString() },
    { vendor: 'Customer 3', amount: 8900, status: 'unpaid', type: 'receivable', riskScore: 0.45, dueDate: new Date(Date.now() + 86400000 * 12).toISOString() },
  ];

  for (const inv of invoices) {
    await addDoc(collection(db, 'invoices'), {
      ...inv,
      orgId
    });
  }

  // Seed Alerts
  const alerts = [
    { type: 'anomaly', title: 'Spend Anomaly Detected', message: 'Unusual spend at Slack Technologies ($1.2k).', isRead: false },
    { type: 'warning', title: 'High Risk Receivable', message: 'Invoice for Customer 2 is 2 days overdue and at high risk.', isRead: false },
  ];

  for (const alert of alerts) {
    await addDoc(collection(db, 'alerts'), {
      ...alert,
      orgId,
      timestamp: new Date().toISOString()
    });
  }

  // Seed Forecasts
  const forecasts = [
    { name: 'Q2 2026 Forecast', scenario: 'Base Case', createdAt: new Date().toISOString(), data: { revenue: 1200000, burn: 450000 } },
    { name: 'Q2 2026 Forecast', scenario: 'Optimistic', createdAt: new Date().toISOString(), data: { revenue: 1500000, burn: 400000 } },
  ];

  for (const f of forecasts) {
    await addDoc(collection(db, 'forecasts'), { ...f, orgId });
  }

  // Seed Vendor Contracts
  const contracts = [
    { vendorName: 'AWS India', renewalDate: '2026-05-12T00:00:00Z', annualSpend: 45200, score: 92, status: 'Active' },
    { vendorName: 'Google Workspace', renewalDate: '2026-04-22T00:00:00Z', annualSpend: 12800, score: 88, status: 'Expiring' },
  ];

  for (const c of contracts) {
    await addDoc(collection(db, 'vendor_contracts'), { ...c, orgId });
  }

  // Seed Investments
  const investments = [
    { instrument: 'FD - HDFC', amount: 120000, yield: 7.2, maturityDate: '2026-06-15T00:00:00Z' },
    { instrument: 'Liquid Fund - ICICI', amount: 85000, yield: 6.8, maturityDate: '2026-03-30T00:00:00Z' },
  ];

  for (const i of investments) {
    await addDoc(collection(db, 'investments'), { ...i, orgId });
  }
}

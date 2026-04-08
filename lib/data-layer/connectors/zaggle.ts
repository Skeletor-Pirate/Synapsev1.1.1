import axios from 'axios';
import { z } from 'zod';
import { dq } from '../quality/expectations';

const ZaggleExpenseSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  merchant: z.string(),
  date: z.string(),
  category: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
});

export type ZaggleExpense = z.infer<typeof ZaggleExpenseSchema>;

export class ZaggleConnector {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ZAGGLE_API_KEY || '';
    this.baseUrl = process.env.ZAGGLE_BASE_URL || 'https://api.zaggle.com/v1';
  }

  async fetchExpenses(): Promise<ZaggleExpense[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/expenses`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const expenses = response.data.data;

      // Data Quality Checks
      expenses.forEach((expense: any) => {
        dq.clear();
        dq.expectColumnToExist(expense, 'id')
          .expectColumnValuesToBeOfType(expense, 'amount', 'number')
          .expectColumnValuesToBeOfType(expense, 'merchant', 'string')
          .validateSchema(expense, ZaggleExpenseSchema);

        const report = dq.getReport();
        if (!report.success) {
          console.warn('Zaggle Data Quality Warning:', JSON.stringify(report.statistics));
        }
      });

      return expenses;
    } catch (error) {
      console.error('Zaggle Connector Error:', error);
      throw error;
    }
  }
}

export const zaggle = new ZaggleConnector();

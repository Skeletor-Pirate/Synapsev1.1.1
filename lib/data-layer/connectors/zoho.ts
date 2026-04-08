import axios from 'axios';
import { z } from 'zod';
import { dq } from '../quality/expectations';

const ZohoInvoiceSchema = z.object({
  invoice_id: z.string(),
  customer_name: z.string(),
  status: z.string(),
  total: z.number(),
  balance: z.number(),
  date: z.string(),
  due_date: z.string(),
});

export type ZohoInvoice = z.infer<typeof ZohoInvoiceSchema>;

export class ZohoBooksConnector {
  private clientId: string;
  private clientSecret: string;
  private organizationId: string;
  private refreshToken: string;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = process.env.ZOHO_BOOKS_CLIENT_ID || '';
    this.clientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET || '';
    this.organizationId = process.env.ZOHO_BOOKS_ORGANIZATION_ID || '';
    this.refreshToken = process.env.ZOHO_BOOKS_REFRESH_TOKEN || '';
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
        params: {
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        },
      });

      this.accessToken = response.data.access_token;
      return this.accessToken!;
    } catch (error) {
      console.error('Zoho Books Refresh Token Error:', error);
      throw error;
    }
  }

  async fetchInvoices(): Promise<ZohoInvoice[]> {
    try {
      if (!this.accessToken) {
        await this.refreshAccessToken();
      }

      const response = await axios.get(`https://books.zoho.com/api/v3/invoices`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${this.accessToken}`,
        },
        params: {
          organization_id: this.organizationId,
        },
      });

      const invoices = response.data.invoices;

      // Data Quality Checks
      invoices.forEach((invoice: any) => {
        dq.clear();
        dq.expectColumnToExist(invoice, 'invoice_id')
          .expectColumnValuesToBeOfType(invoice, 'total', 'number')
          .expectColumnValuesToBeOfType(invoice, 'customer_name', 'string')
          .validateSchema(invoice, ZohoInvoiceSchema);

        const report = dq.getReport();
        if (!report.success) {
          console.warn('Zoho Books Data Quality Warning:', JSON.stringify(report.statistics));
        }
      });

      return invoices;
    } catch (error) {
      console.error('Zoho Books Connector Error:', error);
      throw error;
    }
  }
}

export const zoho = new ZohoBooksConnector();

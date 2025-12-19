/**
 * Demo routes - initialize demo data
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ApiRequest, ApiResponse, ServerContext } from '../types.js';

export function initDemo(ctx: ServerContext) {
  return async (_req: ApiRequest, res: ApiResponse): Promise<void> => {
    const acmeDir = path.join(ctx.basePath, 'ACME');

    // Check if ACME already exists
    if (fs.existsSync(acmeDir)) {
      res.json({ success: true, message: 'ACME demo already exists', created: false });
      return;
    }

    try {
      // Create ACME persona directory structure
      fs.mkdirSync(acmeDir, { recursive: true });
      fs.mkdirSync(path.join(acmeDir, 'clients'), { recursive: true });

      // Create demo provider
      const demoProvider = {
        name: 'ACME Services Inc.',
        address: {
          street: '123 Demo Street',
          city: '12345 Demo City'
        },
        email: 'billing@acme-demo.example',
        phone: '+1 555-0123',
        bank: {
          name: 'Demo Bank',
          iban: 'DE89370400440532013000',
          bic: 'COBADEFFXXX'
        },
        taxNumber: '123/456/78901',
        vatId: 'DE123456789',
        countryCode: 'DE'
      };
      fs.writeFileSync(
        path.join(acmeDir, 'provider.json'),
        JSON.stringify(demoProvider, null, 2)
      );

      // Create demo clients showcasing different scenarios
      const demoClients = [
        {
          folder: 'hourly-consulting',
          client: {
            name: 'Hourly Consulting Client',
            address: { street: '456 Client Ave', city: '54321 Client Town' },
            language: 'en',
            invoicePrefix: 'HC',
            nextInvoiceNumber: 1,
            service: {
              description: 'IT Consulting Services',
              billingType: 'hourly',
              rate: 150,
              currency: 'USD'
            },
            countryCode: 'US',
            paymentTermsDays: 30
          }
        },
        {
          folder: 'daily-development',
          client: {
            name: 'Daily Rate Development',
            address: { street: '789 Dev Blvd', city: '10115 Berlin' },
            language: 'de',
            invoicePrefix: 'DD',
            nextInvoiceNumber: 1,
            service: {
              description: 'Softwareentwicklung',
              billingType: 'daily',
              rate: 800,
              currency: 'EUR'
            },
            countryCode: 'DE',
            paymentTermsDays: 14,
            taxRate: 19
          }
        },
        {
          folder: 'fixed-project',
          client: {
            name: 'Fixed Price Project',
            address: { street: '321 Project Lane', city: '99999 Project City' },
            language: 'en',
            invoicePrefix: 'FP',
            nextInvoiceNumber: 1,
            service: {
              description: 'Website Redesign Project',
              billingType: 'fixed',
              rate: 5000,
              currency: 'EUR'
            },
            countryCode: 'DE',
            paymentTermsDays: 14
          }
        },
        {
          folder: 'german-b2g',
          client: {
            name: 'German Public Sector',
            address: { street: 'Amtsstraße 1', city: '10117 Berlin' },
            language: 'de',
            invoicePrefix: 'B2G',
            nextInvoiceNumber: 1,
            service: {
              description: 'IT-Dienstleistungen',
              billingType: 'daily',
              rate: 1200,
              currency: 'EUR'
            },
            countryCode: 'DE',
            paymentTermsDays: 30,
            taxRate: 19,
            eInvoice: {
              leitwegId: '04011000-1234512345-12',
              preferredFormat: 'xrechnung'
            }
          }
        }
      ];

      for (const { folder, client } of demoClients) {
        const clientDir = path.join(acmeDir, 'clients', folder);
        fs.mkdirSync(clientDir, { recursive: true });
        fs.writeFileSync(
          path.join(clientDir, 'customer_data.json'),
          JSON.stringify(client, null, 2)
        );
      }

      res.json({
        success: true,
        message: 'ACME demo persona created with example clients',
        created: true,
        persona: 'ACME',
        clients: demoClients.map(c => c.folder)
      });
    } catch (err) {
      console.error('Failed to create ACME demo:', err);
      res.error('Failed to create demo data', 500);
    }
  };
}

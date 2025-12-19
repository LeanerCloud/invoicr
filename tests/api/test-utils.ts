/**
 * Shared test utilities for API tests
 */
import * as http from 'http';

// Helper to make HTTP requests to the server
export function httpRequest(options: {
  method: string;
  path: string;
  port: number;
  body?: object;
}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: options.port,
      path: options.path,
      method: options.method,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 500,
            body: data ? JSON.parse(data) : null
          });
        } catch {
          resolve({ status: res.statusCode || 500, body: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Test fixtures
export const validProvider = {
  name: 'Test Provider GmbH',
  address: { street: 'Teststraße 1', city: '10115 Berlin' },
  phone: '+49 30 12345678',
  email: 'test@provider.de',
  bank: { name: 'Test Bank', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX' },
  taxNumber: '27/123/45678',
  vatId: 'DE123456789',
  countryCode: 'DE'
};

export const validClient = {
  name: 'Test Client GmbH',
  address: { street: 'Kundenstraße 2', city: '80331 München' },
  language: 'de',
  invoicePrefix: 'TC',
  nextInvoiceNumber: 1,
  service: { description: 'Consulting', billingType: 'hourly', rate: 100, currency: 'EUR' },
  email: { to: ['client@test.de'] },
  countryCode: 'DE',
  taxRate: 0.19
};

// Default test port base (each test file uses offset to avoid conflicts)
export const TEST_PORT_BASE = 39850;
export const TEST_PERSONA = 'test-persona';

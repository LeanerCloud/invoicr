import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseInvoiceArgs,
  findConfigPaths,
  buildLineItems,
  calculateTotals,
  parseBillingMonth,
  generateFilePaths,
  formatLineItemDisplay,
  buildDryRunOutput
} from '../src/invoice-utils.js';
import { Client, Translations, ResolvedLineItem } from '../src/types.js';

describe('parseInvoiceArgs', () => {
  it('should parse basic args correctly', () => {
    const result = parseInvoiceArgs(['acme-client', '40']);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.clientFolder).toBe('acme-client');
      expect(result.quantity).toBe(40);
      expect(result.isDryRun).toBe(false);
      expect(result.shouldEmail).toBe(false);
      expect(result.isTestMode).toBe(false);
    }
  });

  it('should parse all flags', () => {
    const result = parseInvoiceArgs(['client', '10', '--dry-run', '--email', '--test', '--month=12-2025']);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.isDryRun).toBe(true);
      expect(result.shouldEmail).toBe(true);
      expect(result.isTestMode).toBe(true);
      expect(result.monthArg).toBe('--month=12-2025');
    }
  });

  it('should return error for missing arguments', () => {
    const result = parseInvoiceArgs(['acme']);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('Missing required arguments');
    }
  });

  it('should return error for invalid quantity', () => {
    const result = parseInvoiceArgs(['client', 'abc']);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('positive number');
    }
  });

  it('should return error for zero quantity', () => {
    const result = parseInvoiceArgs(['client', '0']);
    expect('error' in result).toBe(true);
  });

  it('should return error for negative quantity', () => {
    const result = parseInvoiceArgs(['client', '-5']);
    expect('error' in result).toBe(true);
  });

  it('should parse decimal quantity', () => {
    const result = parseInvoiceArgs(['client', '10.5']);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.quantity).toBe(10.5);
    }
  });
});

describe('findConfigPaths', () => {
  const testDir = '/tmp/invoicr-config-test';
  const installDir = '/tmp/invoicr-install-test';

  beforeEach(() => {
    // Create test directories
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'clients', 'test-client'), { recursive: true });
    fs.mkdirSync(installDir, { recursive: true });
    fs.mkdirSync(path.join(installDir, 'examples'), { recursive: true });
  });

  afterEach(() => {
    // Clean up test directories
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.rmSync(installDir, { recursive: true, force: true });
  });

  it('should find provider in cwd', () => {
    fs.writeFileSync(path.join(testDir, 'provider.json'), '{}');
    const result = findConfigPaths('test-client', testDir, installDir);
    expect(result.providerPath).toBe(path.join(testDir, 'provider.json'));
  });

  it('should find provider in install dir as fallback', () => {
    fs.writeFileSync(path.join(installDir, 'provider.json'), '{}');
    const result = findConfigPaths('test-client', testDir, installDir);
    expect(result.providerPath).toBe(path.join(installDir, 'provider.json'));
  });

  it('should return null when provider not found', () => {
    const result = findConfigPaths('test-client', testDir, installDir);
    expect(result.providerPath).toBeNull();
  });

  it('should find client in cwd/clients/', () => {
    fs.writeFileSync(path.join(testDir, 'clients', 'test-client', 'test-client.json'), '{}');
    const result = findConfigPaths('test-client', testDir, installDir);
    expect(result.clientPath).toBe(path.join(testDir, 'clients', 'test-client', 'test-client.json'));
  });

  it('should find client in cwd legacy location', () => {
    fs.mkdirSync(path.join(testDir, 'legacy-client'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'legacy-client', 'legacy-client.json'), '{}');
    const result = findConfigPaths('legacy-client', testDir, installDir);
    expect(result.clientPath).toBe(path.join(testDir, 'legacy-client', 'legacy-client.json'));
  });

  it('should find client in examples as fallback', () => {
    fs.writeFileSync(path.join(installDir, 'examples', 'acme-hourly.json'), '{}');
    const result = findConfigPaths('acme-hourly', testDir, installDir);
    expect(result.clientPath).toBe(path.join(installDir, 'examples', 'acme-hourly.json'));
  });

  it('should return null when client not found', () => {
    const result = findConfigPaths('nonexistent', testDir, installDir);
    expect(result.clientPath).toBeNull();
  });
});

describe('buildLineItems', () => {
  const mockClient: Client = {
    name: 'Test',
    address: { street: '123', city: 'Test City' },
    language: 'en',
    invoicePrefix: 'T',
    nextInvoiceNumber: 1,
    service: {
      description: 'Consulting',
      billingType: 'hourly',
      rate: 100,
      currency: 'USD'
    }
  };

  it('should build single line item from service', () => {
    const result = buildLineItems(mockClient, 40, 'en');
    expect(result.length).toBe(1);
    expect(result[0].quantity).toBe(40);
    expect(result[0].rate).toBe(100);
    expect(result[0].total).toBe(4000);
    expect(result[0].billingType).toBe('hourly');
  });

  it('should handle fixed billing type', () => {
    const fixedClient = {
      ...mockClient,
      service: { ...mockClient.service, billingType: 'fixed' as const }
    };
    const result = buildLineItems(fixedClient, 5000, 'en');
    expect(result[0].total).toBe(5000);
  });

  it('should use line items from config when present', () => {
    const multiClient = {
      ...mockClient,
      lineItems: [
        { description: 'Dev', quantity: 20, rate: 150, billingType: 'hourly' as const },
        { description: 'Review', quantity: 5, rate: 175, billingType: 'hourly' as const }
      ]
    };
    const result = buildLineItems(multiClient, 999, 'en'); // CLI quantity ignored
    expect(result.length).toBe(2);
    expect(result[0].quantity).toBe(20);
    expect(result[1].quantity).toBe(5);
  });
});

describe('calculateTotals', () => {
  const lineItems: ResolvedLineItem[] = [
    { description: 'Item 1', quantity: 10, rate: 100, billingType: 'hourly', total: 1000 },
    { description: 'Item 2', quantity: 5, rate: 200, billingType: 'hourly', total: 1000 }
  ];

  it('should calculate totals without tax', () => {
    const result = calculateTotals(lineItems, 0);
    expect(result.subtotal).toBe(2000);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(2000);
  });

  it('should calculate totals with tax', () => {
    const result = calculateTotals(lineItems, 0.19);
    expect(result.subtotal).toBe(2000);
    expect(result.taxAmount).toBe(380);
    expect(result.totalAmount).toBe(2380);
  });
});

describe('parseBillingMonth', () => {
  it('should default to previous month', () => {
    const result = parseBillingMonth();
    const now = new Date();
    const expectedMonth = now.getMonth() - 1;
    expect(result.getMonth()).toBe(expectedMonth < 0 ? 11 : expectedMonth);
  });

  it('should parse month argument', () => {
    const result = parseBillingMonth('--month=06-2025');
    expect(result.getMonth()).toBe(5); // June = 5 (0-indexed)
    expect(result.getFullYear()).toBe(2025);
  });
});

describe('generateFilePaths', () => {
  const translations = { filePrefix: 'Invoice' } as Translations;

  it('should generate correct file paths', () => {
    const billingMonth = new Date(2025, 10, 15); // November 2025
    const result = generateFilePaths('/path/to/client.json', translations, 'AC-1', billingMonth);
    expect(result.docxPath).toContain('Invoice_AC-1_November_2025.docx');
    expect(result.pdfPath).toContain('Invoice_AC-1_November_2025.pdf');
  });
});

describe('formatLineItemDisplay', () => {
  it('should format hourly item', () => {
    const item: ResolvedLineItem = {
      description: 'Consulting',
      quantity: 10,
      rate: 100,
      billingType: 'hourly',
      total: 1000
    };
    const result = formatLineItemDisplay(item, 0, 'USD', 'en');
    expect(result).toContain('1. Consulting');
    expect(result).toContain('10 hour(s)');
    expect(result).toContain('$100.00');
    expect(result).toContain('$1,000.00');
  });

  it('should format daily item', () => {
    const item: ResolvedLineItem = {
      description: 'Project Work',
      quantity: 5,
      rate: 800,
      billingType: 'daily',
      total: 4000
    };
    const result = formatLineItemDisplay(item, 1, 'EUR', 'de');
    expect(result).toContain('2. Project Work');
    expect(result).toContain('5 day(s)');
  });

  it('should format fixed item without quantity x rate', () => {
    const item: ResolvedLineItem = {
      description: 'Setup Fee',
      quantity: 500,
      rate: 1,
      billingType: 'fixed',
      total: 500
    };
    const result = formatLineItemDisplay(item, 0, 'USD', 'en');
    expect(result).toContain('Setup Fee');
    expect(result).toContain('$500.00');
    expect(result).not.toContain('×');
  });
});

describe('buildDryRunOutput', () => {
  const mockClient: Client = {
    name: 'Acme Corp',
    address: { street: '123', city: 'Test' },
    language: 'en',
    invoicePrefix: 'AC',
    nextInvoiceNumber: 1,
    service: { description: 'Test', billingType: 'hourly', rate: 100, currency: 'USD' },
    email: { to: ['test@example.com'] }
  };

  const lineItems: ResolvedLineItem[] = [
    { description: 'Consulting', quantity: 40, rate: 100, billingType: 'hourly', total: 4000 }
  ];

  it('should build complete dry run output', () => {
    const result = buildDryRunOutput(
      mockClient, 'AC-1', '15 Nov 2025', '15 Dec 2025', 'November 2025',
      lineItems, 4000, 0, 0, 4000, 'USD', 'en',
      '/path/to/invoice.docx', '/path/to/invoice.pdf', false
    );

    expect(result).toContain('DRY RUN');
    expect(result).toContain('Acme Corp');
    expect(result).toContain('AC-1');
    expect(result).toContain('Due Date');
    expect(result).toContain('$4,000.00');
    expect(result).toContain('No files were generated');
  });

  it('should include email info when requested', () => {
    const result = buildDryRunOutput(
      mockClient, 'AC-1', '15 Nov 2025', undefined, 'November 2025',
      lineItems, 4000, 0, 0, 4000, 'USD', 'en',
      '/path/to/invoice.docx', '/path/to/invoice.pdf', true
    );

    expect(result).toContain('Email:');
    expect(result).toContain('test@example.com');
  });

  it('should show tax when taxRate > 0', () => {
    const result = buildDryRunOutput(
      mockClient, 'AC-1', '15 Nov 2025', undefined, 'November 2025',
      lineItems, 4000, 760, 0.19, 4760, 'USD', 'en',
      '/path/to/invoice.docx', '/path/to/invoice.pdf', false
    );

    expect(result).toContain('Subtotal');
    expect(result).toContain('Tax (19%)');
    expect(result).toContain('$4,760.00');
  });
});

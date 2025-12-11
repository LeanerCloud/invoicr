import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildDocument, TemplateName } from '../src/templates/index.js';
import { loadLogo } from '../src/templates/common.js';
import { InvoiceContext, ResolvedLineItem, BankDetails, Provider, Client, Translations } from '../src/types.js';

// Create a test PNG file for logo testing
const testLogoPath = '/tmp/test-invoicr-logo.png';
// Minimal 1x1 PNG (base64-decoded)
const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

beforeAll(() => {
  fs.writeFileSync(testLogoPath, minimalPng);
});

afterAll(() => {
  if (fs.existsSync(testLogoPath)) {
    fs.unlinkSync(testLogoPath);
  }
});

// Helper to create minimal mock context for testing
function createMockContext(overrides: Partial<InvoiceContext> = {}): InvoiceContext {
  const bankDetails: BankDetails = {
    name: 'Test Bank',
    iban: 'DE12345678901234567890',
    bic: 'TESTBIC'
  };

  const provider: Provider = {
    name: 'Test Provider',
    address: { street: '123 Main St', city: 'Berlin 10115' },
    phone: '+49 123 456789',
    email: 'test@example.com',
    bank: bankDetails,
    taxNumber: '123/456/789'
  };

  const client: Client = {
    name: 'Acme Corp',
    address: { street: '456 Business Ave', city: 'New York, NY 10001' },
    language: 'en',
    invoicePrefix: 'AC',
    nextInvoiceNumber: 1,
    service: {
      description: 'Consulting Services',
      billingType: 'hourly',
      rate: 150,
      currency: 'USD'
    }
  };

  const translations: Translations = {
    invoice: 'Invoice',
    serviceProvider: 'Service Provider',
    client: 'Client',
    invoiceNr: 'Invoice No.',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    servicePeriod: 'Service Period',
    projectReference: 'Project Reference',
    serviceChargesIntro: 'Services rendered:',
    description: 'Description',
    quantity: 'Quantity',
    days: 'days',
    hours: 'hours',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    taxNote: 'No VAT charged',
    paymentTerms: 'Payment due within {{days}} days',
    paymentImmediate: 'Payment due upon receipt',
    thankYou: 'Thank you for your business!',
    bankDetails: 'Bank Details',
    bank: 'Bank',
    iban: 'IBAN',
    bic: 'BIC',
    taxNumber: 'Tax Number',
    vatId: 'VAT ID',
    country: 'Country',
    filePrefix: 'Invoice',
    email: {
      subject: 'Invoice {{invoiceNumber}}',
      body: 'Please find attached invoice {{invoiceNumber}}'
    }
  };

  const lineItems: ResolvedLineItem[] = [{
    description: 'Consulting Services',
    quantity: 40,
    rate: 150,
    billingType: 'hourly',
    total: 6000
  }];

  return {
    provider,
    client,
    translations,
    invoiceNumber: 'AC-1',
    invoiceDate: '15 Nov 2025',
    servicePeriod: 'November 2025',
    monthName: 'November 2025',
    totalAmount: 6000,
    quantity: 40,
    rate: 150,
    billingType: 'hourly',
    currency: 'USD',
    lang: 'en',
    serviceDescription: 'Consulting Services, November 2025',
    emailServiceDescription: 'Consulting Services, November 2025',
    bankDetails,
    lineItems,
    subtotal: 6000,
    taxAmount: 0,
    taxRate: 0,
    ...overrides
  };
}

describe('buildDocument', () => {
  describe('default template', () => {
    it('should build a default document', () => {
      const ctx = createMockContext();
      const doc = buildDocument(ctx, 'default');

      expect(doc).toBeDefined();
      // Document object from docx library has internal structure
      expect(typeof doc).toBe('object');
    });

    it('should handle German language', () => {
      const ctx = createMockContext({
        lang: 'de',
        translations: {
          ...createMockContext().translations,
          invoice: 'Rechnung',
          taxNote: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'
        }
      });
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should include due date when provided', () => {
      const ctx = createMockContext({ dueDate: '15 Dec 2025' });
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should include project reference when provided', () => {
      const ctx = createMockContext();
      ctx.client.projectReference = 'Project Alpha';
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle fixed billing type', () => {
      const ctx = createMockContext({
        billingType: 'fixed',
        lineItems: [{
          description: 'Development Milestone',
          quantity: 5000,
          rate: 1,
          billingType: 'fixed',
          total: 5000
        }]
      });
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle daily billing type', () => {
      const ctx = createMockContext({
        billingType: 'daily',
        lineItems: [{
          description: 'Daily Consulting',
          quantity: 5,
          rate: 1200,
          billingType: 'daily',
          total: 6000
        }]
      });
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle tax calculation', () => {
      const ctx = createMockContext({
        taxRate: 0.19,
        subtotal: 6000,
        taxAmount: 1140,
        totalAmount: 7140
      });
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle multiple line items', () => {
      const ctx = createMockContext({
        lineItems: [
          { description: 'Development', quantity: 40, rate: 150, billingType: 'hourly', total: 6000 },
          { description: 'Code Review', quantity: 8, rate: 175, billingType: 'hourly', total: 1400 },
          { description: 'Setup Fee', quantity: 500, rate: 1, billingType: 'fixed', total: 500 }
        ],
        subtotal: 7900,
        totalAmount: 7900
      });
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle provider with VAT ID', () => {
      const ctx = createMockContext();
      ctx.provider.vatId = 'DE123456789';
      ctx.lang = 'de';
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle provider with logo path (non-existent file)', () => {
      const ctx = createMockContext();
      ctx.provider.logoPath = 'non-existent-logo.png';
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle null payment terms (immediate payment)', () => {
      const ctx = createMockContext();
      ctx.client.paymentTermsDays = null;
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle payment terms with days', () => {
      const ctx = createMockContext();
      ctx.client.paymentTermsDays = 30;
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });
  });

  describe('minimal template', () => {
    it('should build a minimal document', () => {
      const ctx = createMockContext();
      const doc = buildDocument(ctx, 'minimal');
      expect(doc).toBeDefined();
      expect(typeof doc).toBe('object');
    });

    it('should handle due date', () => {
      const ctx = createMockContext({ dueDate: '15 Dec 2025' });
      const doc = buildDocument(ctx, 'minimal');
      expect(doc).toBeDefined();
    });

    it('should handle tax in German', () => {
      const ctx = createMockContext({ lang: 'de', taxRate: 0 });
      const doc = buildDocument(ctx, 'minimal');
      expect(doc).toBeDefined();
    });

    it('should handle provider with VAT ID', () => {
      const ctx = createMockContext();
      ctx.provider.vatId = 'DE123456789';
      const doc = buildDocument(ctx, 'minimal');
      expect(doc).toBeDefined();
    });
  });

  describe('detailed template', () => {
    it('should build a detailed document', () => {
      const ctx = createMockContext();
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
      expect(typeof doc).toBe('object');
    });

    it('should handle provider with country', () => {
      const ctx = createMockContext();
      ctx.provider.address.country = 'Germany';
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });

    it('should handle client with country', () => {
      const ctx = createMockContext();
      ctx.client.address.country = 'USA';
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });

    it('should handle translated country', () => {
      const ctx = createMockContext();
      ctx.provider.address.country = { de: 'Deutschland', en: 'Germany' };
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });

    it('should handle due date with emphasis', () => {
      const ctx = createMockContext({ dueDate: '15 Dec 2025' });
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });

    it('should handle project reference', () => {
      const ctx = createMockContext();
      ctx.client.projectReference = 'Enterprise Migration';
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });

    it('should handle VAT ID display', () => {
      const ctx = createMockContext();
      ctx.provider.vatId = 'DE123456789';
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });

    it('should handle German language for reference label', () => {
      const ctx = createMockContext({ lang: 'de' });
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });
  });

  describe('template selection', () => {
    it('should default to default template when not specified', () => {
      const ctx = createMockContext();
      const doc = buildDocument(ctx);
      expect(doc).toBeDefined();
    });

    it('should handle invalid template name by using default', () => {
      const ctx = createMockContext();
      // @ts-expect-error - testing invalid template name
      const doc = buildDocument(ctx, 'invalid');
      expect(doc).toBeDefined();
    });
  });

  describe('logo loading edge cases', () => {
    it('should load a valid PNG logo file', () => {
      const ctx = createMockContext();
      ctx.provider.logoPath = testLogoPath;
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should load a valid PNG logo in minimal template', () => {
      const ctx = createMockContext();
      ctx.provider.logoPath = testLogoPath;
      const doc = buildDocument(ctx, 'minimal');
      expect(doc).toBeDefined();
    });

    it('should load a valid PNG logo in detailed template', () => {
      const ctx = createMockContext();
      ctx.provider.logoPath = testLogoPath;
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });
  });

  describe('all-fixed items with tax', () => {
    it('should handle all-fixed line items with tax calculation', () => {
      const ctx = createMockContext({
        billingType: 'fixed',
        lineItems: [
          { description: 'Setup Fee', quantity: 1000, rate: 1, billingType: 'fixed', total: 1000 },
          { description: 'License Fee', quantity: 2000, rate: 1, billingType: 'fixed', total: 2000 }
        ],
        subtotal: 3000,
        taxRate: 0.19,
        taxAmount: 570,
        totalAmount: 3570
      });
      const doc = buildDocument(ctx, 'default');
      expect(doc).toBeDefined();
    });

    it('should handle all-fixed items with tax in minimal template', () => {
      const ctx = createMockContext({
        billingType: 'fixed',
        lineItems: [
          { description: 'Flat Fee', quantity: 5000, rate: 1, billingType: 'fixed', total: 5000 }
        ],
        subtotal: 5000,
        taxRate: 0.07,
        taxAmount: 350,
        totalAmount: 5350
      });
      const doc = buildDocument(ctx, 'minimal');
      expect(doc).toBeDefined();
    });

    it('should handle all-fixed items with tax in detailed template', () => {
      const ctx = createMockContext({
        billingType: 'fixed',
        lineItems: [
          { description: 'Project Milestone 1', quantity: 10000, rate: 1, billingType: 'fixed', total: 10000 }
        ],
        subtotal: 10000,
        taxRate: 0.20,
        taxAmount: 2000,
        totalAmount: 12000
      });
      const doc = buildDocument(ctx, 'detailed');
      expect(doc).toBeDefined();
    });
  });
});

describe('loadLogo', () => {
  it('should return null for undefined logo path', () => {
    const result = loadLogo(undefined);
    expect(result).toBeNull();
  });

  it('should return null for non-existent file', () => {
    const result = loadLogo('/non/existent/path.png');
    expect(result).toBeNull();
  });

  it('should load a valid PNG file', () => {
    const result = loadLogo(testLogoPath);
    expect(result).not.toBeNull();
  });

  it('should return null for unsupported file extension', () => {
    // Create a temp file with unsupported extension
    const unsupportedPath = '/tmp/test-invoicr-logo.svg';
    fs.writeFileSync(unsupportedPath, '<svg></svg>');
    try {
      const result = loadLogo(unsupportedPath);
      expect(result).toBeNull();
    } finally {
      fs.unlinkSync(unsupportedPath);
    }
  });

  it('should handle jpg extension', () => {
    const jpgPath = '/tmp/test-invoicr-logo.jpg';
    // Create a minimal valid file (not a real JPG but tests the extension handling)
    fs.writeFileSync(jpgPath, minimalPng);
    try {
      const result = loadLogo(jpgPath);
      expect(result).not.toBeNull();
    } finally {
      fs.unlinkSync(jpgPath);
    }
  });

  it('should handle jpeg extension', () => {
    const jpegPath = '/tmp/test-invoicr-logo.jpeg';
    fs.writeFileSync(jpegPath, minimalPng);
    try {
      const result = loadLogo(jpegPath);
      expect(result).not.toBeNull();
    } finally {
      fs.unlinkSync(jpegPath);
    }
  });

  it('should handle gif extension', () => {
    const gifPath = '/tmp/test-invoicr-logo.gif';
    fs.writeFileSync(gifPath, minimalPng);
    try {
      const result = loadLogo(gifPath);
      expect(result).not.toBeNull();
    } finally {
      fs.unlinkSync(gifPath);
    }
  });

  it('should handle bmp extension', () => {
    const bmpPath = '/tmp/test-invoicr-logo.bmp';
    fs.writeFileSync(bmpPath, minimalPng);
    try {
      const result = loadLogo(bmpPath);
      expect(result).not.toBeNull();
    } finally {
      fs.unlinkSync(bmpPath);
    }
  });

  it('should handle absolute paths', () => {
    const result = loadLogo(testLogoPath); // Already absolute
    expect(result).not.toBeNull();
  });
});

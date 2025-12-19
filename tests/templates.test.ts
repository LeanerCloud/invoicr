import { describe, it, expect } from 'vitest';
import {
  generateInvoiceFromTemplate,
  getBuiltInTemplates,
  isBuiltInTemplate,
  getTemplatePath,
  contextToTemplateData,
  listTemplates,
} from '../src/lib/template-generator.js';
import { InvoiceContext, ResolvedLineItem, BankDetails, Provider, Client, Translations } from '../src/types.js';

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

describe('Template Generator', () => {
  describe('getBuiltInTemplates', () => {
    it('should return list of built-in templates', () => {
      const templates = getBuiltInTemplates();
      expect(templates).toContain('default');
      expect(templates).toContain('minimal');
      expect(templates).toContain('detailed');
      expect(templates).toHaveLength(3);
    });
  });

  describe('isBuiltInTemplate', () => {
    it('should return true for built-in templates', () => {
      expect(isBuiltInTemplate('default')).toBe(true);
      expect(isBuiltInTemplate('minimal')).toBe(true);
      expect(isBuiltInTemplate('detailed')).toBe(true);
    });

    it('should return false for custom templates', () => {
      expect(isBuiltInTemplate('my-custom')).toBe(false);
      expect(isBuiltInTemplate('custom-template')).toBe(false);
    });
  });

  describe('getTemplatePath', () => {
    it('should return path for built-in templates', () => {
      const path = getTemplatePath('default');
      expect(path).toContain('templates');
      expect(path).toContain('default.docx');
    });

    it('should throw for non-existent template', () => {
      expect(() => getTemplatePath('non-existent-template')).toThrow('Template not found');
    });
  });

  describe('listTemplates', () => {
    it('should list built-in templates', () => {
      const result = listTemplates();
      expect(result.builtIn).toContain('default');
      expect(result.builtIn).toContain('minimal');
      expect(result.builtIn).toContain('detailed');
      expect(result.custom).toHaveLength(0);
    });
  });

  describe('contextToTemplateData', () => {
    it('should convert context to template data', () => {
      const ctx = createMockContext();
      const data = contextToTemplateData(ctx);

      expect(data.invoiceNumber).toBe('AC-1');
      expect(data.invoiceDate).toBe('15 Nov 2025');
      expect(data.provider.name).toBe('Test Provider');
      expect(data.client.name).toBe('Acme Corp');
      expect(data.lineItems).toHaveLength(1);
      expect(data.totalAmount).toBe('$6,000.00');
    });

    it('should handle German language', () => {
      const ctx = createMockContext({ lang: 'de', currency: 'EUR' });
      const data = contextToTemplateData(ctx);

      expect(data.translations.invoice).toBe('Invoice');
      expect(data.totalAmount).toContain('€');
    });

    it('should handle tax rate', () => {
      const ctx = createMockContext({
        taxRate: 0.19,
        taxAmount: 1140,
        totalAmount: 7140
      });
      const data = contextToTemplateData(ctx);

      expect(data.taxRate).toBe(19);
    });

    it('should include payment terms', () => {
      const ctx = createMockContext();
      ctx.client.paymentTermsDays = 30;
      const data = contextToTemplateData(ctx);

      expect(data.paymentTerms).toContain('30');
    });

    it('should handle immediate payment', () => {
      const ctx = createMockContext();
      ctx.client.paymentTermsDays = undefined;
      const data = contextToTemplateData(ctx);

      expect(data.paymentTerms).toBe('Payment due upon receipt');
    });
  });

  describe('generateInvoiceFromTemplate', () => {
    it('should generate DOCX buffer with default template', async () => {
      const ctx = createMockContext();
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // DOCX files start with PK (ZIP signature)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    });

    it('should generate DOCX buffer with minimal template', async () => {
      const ctx = createMockContext();
      const buffer = await generateInvoiceFromTemplate(ctx, 'minimal');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should generate DOCX buffer with detailed template', async () => {
      const ctx = createMockContext();
      const buffer = await generateInvoiceFromTemplate(ctx, 'detailed');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle German language context', async () => {
      const ctx = createMockContext({
        lang: 'de',
        currency: 'EUR',
        translations: {
          ...createMockContext().translations,
          invoice: 'Rechnung',
          taxNote: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'
        }
      });
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle due date', async () => {
      const ctx = createMockContext({ dueDate: '15 Dec 2025' });
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle project reference', async () => {
      const ctx = createMockContext();
      ctx.client.projectReference = 'Project Alpha';
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle fixed billing type', async () => {
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
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle multiple line items', async () => {
      const ctx = createMockContext({
        lineItems: [
          { description: 'Development', quantity: 40, rate: 150, billingType: 'hourly', total: 6000 },
          { description: 'Code Review', quantity: 8, rate: 175, billingType: 'hourly', total: 1400 },
          { description: 'Setup Fee', quantity: 500, rate: 1, billingType: 'fixed', total: 500 }
        ],
        subtotal: 7900,
        totalAmount: 7900
      });
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle tax calculation', async () => {
      const ctx = createMockContext({
        taxRate: 0.19,
        subtotal: 6000,
        taxAmount: 1140,
        totalAmount: 7140
      });
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle provider with VAT ID', async () => {
      const ctx = createMockContext();
      ctx.provider.vatId = 'DE123456789';
      const buffer = await generateInvoiceFromTemplate(ctx, 'default');

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle provider with country', async () => {
      const ctx = createMockContext();
      ctx.provider.address.country = 'Germany';
      const buffer = await generateInvoiceFromTemplate(ctx, 'detailed');

      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should handle translated country object', async () => {
      const ctx = createMockContext();
      ctx.provider.address.country = { de: 'Deutschland', en: 'Germany' };
      const buffer = await generateInvoiceFromTemplate(ctx, 'detailed');

      expect(buffer).toBeInstanceOf(Buffer);
    });
  });
});

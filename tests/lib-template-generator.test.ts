import { describe, it, expect } from 'vitest';
import { contextToTemplateData } from '../src/lib/template-generator.js';
import { buildInvoiceContext } from '../src/lib/invoice-builder.js';
import type { Client, Provider, Translations } from '../src/types.js';

describe('template-generator', () => {
  const provider: Provider = {
    name: 'Test Provider',
    address: { street: '123 Main St', city: 'Berlin 10115' },
    phone: '+49 123 456789',
    email: 'test@example.com',
    bank: { name: 'Test Bank', iban: 'DE12345678901234567890', bic: 'TESTBIC' },
    taxNumber: '123/456/789'
  };

  const baseClient: Client = {
    name: 'Acme Corp',
    address: { street: '456 Business Ave', city: 'New York, NY 10001' },
    language: 'en',
    invoicePrefix: 'AC',
    nextInvoiceNumber: 5,
    service: {
      description: 'Consulting Services',
      billingType: 'hourly',
      rate: 100,
      currency: 'USD'
    },
    taxRate: 0.19
  };

  const translations: Translations = {
    invoice: 'Invoice',
    serviceProvider: 'Service Provider',
    client: 'Client',
    invoiceNr: 'Invoice Nr.',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    servicePeriod: 'Service Period',
    projectReference: 'Project Reference',
    serviceChargesIntro: 'For the following services:',
    description: 'Description',
    quantity: 'Quantity',
    days: 'Days',
    hours: 'Hours',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    taxNote: 'Tax exempt',
    paymentTerms: 'Payment Terms',
    paymentImmediate: 'Due immediately',
    thankYou: 'Thank you!',
    bankDetails: 'Bank Details',
    bank: 'Bank',
    iban: 'IBAN',
    bic: 'BIC',
    taxNumber: 'Tax Number',
    vatId: 'VAT ID',
    country: 'Country',
    filePrefix: 'Invoice',
    email: { subject: 'Invoice', body: 'Invoice body' }
  };

  describe('contextToTemplateData', () => {
    it('defaults legalText and conversionNote to empty strings when unset', () => {
      const ctx = buildInvoiceContext(provider, baseClient, translations, { quantity: 40 });
      const data = contextToTemplateData(ctx);

      expect(data.legalText).toBe('');
      expect(data.conversionNote).toBe('');
    });

    it('passes through the client legalText', () => {
      const client: Client = { ...baseClient, legalText: 'Late payments incur a 5% fee per month overdue.' };
      const ctx = buildInvoiceContext(provider, client, translations, { quantity: 40 });
      const data = contextToTemplateData(ctx);

      expect(data.legalText).toBe('Late payments incur a 5% fee per month overdue.');
    });

    it('passes through the conversion note set on the context', () => {
      const ctx = buildInvoiceContext(provider, baseClient, translations, { quantity: 40 });
      ctx.conversionNote = 'Converted: 4000.00 USD = 2000.00 EUR (rate: 1 USD = 0.5000 EUR, as of 2024-03-15).';
      const data = contextToTemplateData(ctx);

      expect(data.conversionNote).toBe(ctx.conversionNote);
    });

    it('does not append the service period to line item descriptions', () => {
      const ctx = buildInvoiceContext(provider, baseClient, translations, { quantity: 40 });
      const data = contextToTemplateData(ctx);

      expect(data.lineItems[0].description).toBe('Consulting Services');
      expect(data.lineItems[0].description).not.toContain(ctx.monthName);
    });
  });
});

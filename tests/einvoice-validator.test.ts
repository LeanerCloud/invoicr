import { describe, it, expect } from 'vitest';
import { validateForEInvoice, hasRequiredFields } from '../src/einvoice/validator.js';
import type { InvoiceContext } from '../src/types.js';

// Helper to create a minimal valid invoice context
function createValidContext(): InvoiceContext {
  return {
    provider: {
      name: 'Test Provider GmbH',
      address: { street: 'Teststraße 1', city: '10115 Berlin' },
      phone: '+49 30 12345678',
      email: 'test@provider.de',
      bank: { name: 'Test Bank', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX' },
      taxNumber: '27/123/45678',
      vatId: 'DE123456789'
    },
    client: {
      name: 'Test Client GmbH',
      address: { street: 'Kundenstraße 2', city: '80331 München' },
      language: 'de',
      invoicePrefix: 'TC',
      nextInvoiceNumber: 1,
      service: { description: 'Consulting', billingType: 'hourly', rate: 100, currency: 'EUR' },
      email: { to: ['client@test.de'] }
    },
    translations: {
      invoice: 'Rechnung',
      serviceProvider: 'Dienstleister',
      client: 'Kunde',
      invoiceNr: 'Rechnungsnr.',
      invoiceDate: 'Rechnungsdatum',
      dueDate: 'Fälligkeitsdatum',
      servicePeriod: 'Leistungszeitraum',
      projectReference: 'Projektreferenz',
      serviceChargesIntro: 'Für folgende Leistungen erlaube ich mir zu berechnen:',
      description: 'Beschreibung',
      quantity: 'Menge',
      days: 'Tage',
      hours: 'Stunden',
      unitPrice: 'Einzelpreis',
      total: 'Gesamt',
      subtotal: 'Zwischensumme',
      tax: 'USt.',
      taxNote: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
      paymentTerms: 'Zahlungsziel:',
      paymentImmediate: 'Zahlbar sofort ohne Abzug',
      thankYou: 'Vielen Dank für Ihr Vertrauen!',
      bankDetails: 'Bankverbindung',
      bank: 'Bank',
      iban: 'IBAN',
      bic: 'BIC',
      taxNumber: 'Steuernummer',
      vatId: 'USt-IdNr.',
      country: 'Land',
      filePrefix: 'Rechnung',
      email: { subject: 'Rechnung', body: 'Rechnung' }
    },
    invoiceNumber: 'TC-001',
    invoiceDate: '15.12.2024',
    dueDate: '14.01.2025',
    servicePeriod: 'November 2024',
    monthName: 'November 2024',
    totalAmount: 1190,
    quantity: 10,
    rate: 100,
    billingType: 'hourly',
    currency: 'EUR',
    lang: 'de',
    serviceDescription: 'Consulting',
    emailServiceDescription: 'Consulting',
    bankDetails: { name: 'Test Bank', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX' },
    lineItems: [
      { description: 'Consulting', quantity: 10, rate: 100, billingType: 'hourly', total: 1000 }
    ],
    subtotal: 1000,
    taxAmount: 190,
    taxRate: 0.19
  };
}

describe('validateForEInvoice', () => {
  describe('common validations', () => {
    it('should pass for valid context with XRechnung', () => {
      const ctx = createValidContext();
      ctx.client.eInvoice = { leitwegId: '991-12345-67' };
      const result = validateForEInvoice(ctx, 'xrechnung', 'DE', 'DE');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when provider has no VAT ID or tax number', () => {
      const ctx = createValidContext();
      ctx.provider.vatId = undefined;
      ctx.provider.taxNumber = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider must have either VAT ID or Tax Number');
    });

    it('should fail when provider has no email', () => {
      const ctx = createValidContext();
      ctx.provider.email = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider email is required (BT-34: Seller electronic address)');
    });

    it('should fail when provider has no name', () => {
      const ctx = createValidContext();
      ctx.provider.name = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider name is required');
    });

    it('should fail when provider has no street address', () => {
      const ctx = createValidContext();
      ctx.provider.address.street = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider street address is required');
    });

    it('should fail when client has no name', () => {
      const ctx = createValidContext();
      ctx.client.name = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Client name is required');
    });

    it('should fail when invoice has no number', () => {
      const ctx = createValidContext();
      ctx.invoiceNumber = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invoice number is required (BT-1)');
    });

    it('should fail when invoice has no date', () => {
      const ctx = createValidContext();
      ctx.invoiceDate = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invoice date is required (BT-2)');
    });

    it('should fail when invoice has no line items', () => {
      const ctx = createValidContext();
      ctx.lineItems = [];
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one line item is required');
    });

    it('should warn when client has no email', () => {
      const ctx = createValidContext();
      ctx.client.email = undefined;
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.warnings).toContain('Client email missing - Buyer electronic address (BT-49) will be empty');
    });

    it('should warn when bank details missing IBAN', () => {
      const ctx = createValidContext();
      ctx.bankDetails.iban = '';
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.warnings).toContain('IBAN is recommended for payment instructions');
    });
  });

  describe('XRechnung validations', () => {
    it('should fail when provider has no VAT ID', () => {
      const ctx = createValidContext();
      ctx.provider.vatId = undefined;
      ctx.client.eInvoice = { leitwegId: '991-12345-67' };
      const result = validateForEInvoice(ctx, 'xrechnung', 'DE', 'DE');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider VAT ID is required for XRechnung (BT-31)');
    });

    it('should warn when no Leitweg-ID or buyer reference', () => {
      const ctx = createValidContext();
      const result = validateForEInvoice(ctx, 'xrechnung', 'DE', 'DE');
      expect(result.warnings).toContain('No Leitweg-ID or Buyer Reference set. Required for B2G invoices (BT-10)');
    });

    it('should warn on potentially invalid Leitweg-ID format', () => {
      const ctx = createValidContext();
      ctx.client.eInvoice = { leitwegId: 'invalid' };
      const result = validateForEInvoice(ctx, 'xrechnung', 'DE', 'DE');
      expect(result.warnings.some(w => w.includes('Leitweg-ID format may be invalid'))).toBe(true);
    });

    it('should not warn on valid Leitweg-ID format', () => {
      const ctx = createValidContext();
      ctx.client.eInvoice = { leitwegId: '99-12345-67' };
      const result = validateForEInvoice(ctx, 'xrechnung', 'DE', 'DE');
      expect(result.warnings.some(w => w.includes('Leitweg-ID format may be invalid'))).toBe(false);
    });
  });

  describe('ZUGFeRD validations', () => {
    it('should warn when provider has no VAT ID', () => {
      const ctx = createValidContext();
      ctx.provider.vatId = undefined;
      const result = validateForEInvoice(ctx, 'zugferd', 'DE', 'DE');
      expect(result.warnings).toContain('Provider VAT ID is recommended for ZUGFeRD');
    });
  });

  describe('CIUS-RO validations', () => {
    it('should fail when provider has no tax number', () => {
      const ctx = createValidContext();
      ctx.provider.taxNumber = '';
      ctx.provider.vatId = 'RO123456'; // Has VAT ID but no tax number
      const result = validateForEInvoice(ctx, 'cius-ro', 'RO', 'RO');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Provider Tax Number (CUI) is required for CIUS-RO');
    });

    it('should warn when no buyer reference', () => {
      const ctx = createValidContext();
      const result = validateForEInvoice(ctx, 'cius-ro', 'RO', 'RO');
      expect(result.warnings).toContain('Buyer reference is recommended for CIUS-RO invoices');
    });
  });

  describe('UBL validations', () => {
    it('should pass with minimal requirements', () => {
      const ctx = createValidContext();
      const result = validateForEInvoice(ctx, 'ubl', 'US', 'US');
      expect(result.valid).toBe(true);
    });
  });
});

describe('hasRequiredFields', () => {
  it('should return true for valid context', () => {
    const ctx = createValidContext();
    expect(hasRequiredFields(ctx)).toBe(true);
  });

  it('should return false when provider name is missing', () => {
    const ctx = createValidContext();
    ctx.provider.name = '';
    expect(hasRequiredFields(ctx)).toBe(false);
  });

  it('should return false when provider email is missing', () => {
    const ctx = createValidContext();
    ctx.provider.email = '';
    expect(hasRequiredFields(ctx)).toBe(false);
  });

  it('should return false when client name is missing', () => {
    const ctx = createValidContext();
    ctx.client.name = '';
    expect(hasRequiredFields(ctx)).toBe(false);
  });

  it('should return false when invoice number is missing', () => {
    const ctx = createValidContext();
    ctx.invoiceNumber = '';
    expect(hasRequiredFields(ctx)).toBe(false);
  });

  it('should return false when line items are empty', () => {
    const ctx = createValidContext();
    ctx.lineItems = [];
    expect(hasRequiredFields(ctx)).toBe(false);
  });

  it('should return false when neither VAT ID nor tax number is present', () => {
    const ctx = createValidContext();
    ctx.provider.vatId = undefined;
    ctx.provider.taxNumber = '';
    expect(hasRequiredFields(ctx)).toBe(false);
  });

  it('should return true when only VAT ID is present', () => {
    const ctx = createValidContext();
    ctx.provider.taxNumber = '';
    expect(hasRequiredFields(ctx)).toBe(true);
  });

  it('should return true when only tax number is present', () => {
    const ctx = createValidContext();
    ctx.provider.vatId = undefined;
    ctx.provider.taxNumber = '27/123/45678';
    expect(hasRequiredFields(ctx)).toBe(true);
  });
});

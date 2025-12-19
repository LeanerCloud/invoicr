import { describe, it, expect } from 'vitest';
import {
  mapInvoiceContext,
  getUnitCode,
  getVATCategoryCode,
  formatDateToISO,
  generateEInvoiceFilename
} from '../src/einvoice/mapper.js';
import type { InvoiceContext } from '../src/types.js';

// Helper to create a minimal valid invoice context
function createValidContext(): InvoiceContext {
  return {
    provider: {
      name: 'Test Provider GmbH',
      address: { street: 'Teststraße 1', city: '10115 Berlin' },
      phone: '+49 30 12345678',
      email: 'test@provider.de',
      bank: { name: 'Test Bank', iban: 'DE89 3704 0044 0532 0130 00', bic: 'COBADEFFXXX' },
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
      email: { to: ['client@test.de'] },
      eInvoice: { leitwegId: '991-12345-67' }
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
      paymentTerms: 'Zahlungsziel: 30 Tage',
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
    bankDetails: { name: 'Test Bank', iban: 'DE89 3704 0044 0532 0130 00', bic: 'COBADEFFXXX' },
    lineItems: [
      { description: 'Consulting', quantity: 10, rate: 100, billingType: 'hourly', total: 1000 },
      { description: 'Setup', quantity: 1, rate: 200, billingType: 'fixed', total: 200 }
    ],
    subtotal: 1200,
    taxAmount: 228,
    taxRate: 0.19
  };
}

describe('getUnitCode', () => {
  it('should return HUR for hourly billing', () => {
    expect(getUnitCode('hourly')).toBe('HUR');
  });

  it('should return DAY for daily billing', () => {
    expect(getUnitCode('daily')).toBe('DAY');
  });

  it('should return C62 for fixed billing', () => {
    expect(getUnitCode('fixed')).toBe('C62');
  });
});

describe('getVATCategoryCode', () => {
  it('should return S for standard rate', () => {
    expect(getVATCategoryCode(0.19)).toBe('S');
    expect(getVATCategoryCode(0.07)).toBe('S');
    expect(getVATCategoryCode(0.05)).toBe('S');
  });

  it('should return E for exempt (0%)', () => {
    expect(getVATCategoryCode(0)).toBe('E');
  });

  it('should return O for negative rates', () => {
    expect(getVATCategoryCode(-0.01)).toBe('O');
  });
});

describe('formatDateToISO', () => {
  it('should convert German date format to ISO', () => {
    expect(formatDateToISO('15.12.2024', 'de')).toBe('2024-12-15');
    expect(formatDateToISO('01.01.2025', 'de')).toBe('2025-01-01');
    expect(formatDateToISO('31.12.2024', 'de')).toBe('2024-12-31');
  });

  it('should convert English date format to ISO', () => {
    expect(formatDateToISO('15 Dec 2024', 'en')).toBe('2024-12-15');
    expect(formatDateToISO('1 Jan 2025', 'en')).toBe('2025-01-01');
    expect(formatDateToISO('31 Dec 2024', 'en')).toBe('2024-12-31');
  });

  it('should handle all English month abbreviations', () => {
    expect(formatDateToISO('1 Jan 2024', 'en')).toBe('2024-01-01');
    expect(formatDateToISO('1 Feb 2024', 'en')).toBe('2024-02-01');
    expect(formatDateToISO('1 Mar 2024', 'en')).toBe('2024-03-01');
    expect(formatDateToISO('1 Apr 2024', 'en')).toBe('2024-04-01');
    expect(formatDateToISO('1 May 2024', 'en')).toBe('2024-05-01');
    expect(formatDateToISO('1 Jun 2024', 'en')).toBe('2024-06-01');
    expect(formatDateToISO('1 Jul 2024', 'en')).toBe('2024-07-01');
    expect(formatDateToISO('1 Aug 2024', 'en')).toBe('2024-08-01');
    expect(formatDateToISO('1 Sep 2024', 'en')).toBe('2024-09-01');
    expect(formatDateToISO('1 Oct 2024', 'en')).toBe('2024-10-01');
    expect(formatDateToISO('1 Nov 2024', 'en')).toBe('2024-11-01');
    expect(formatDateToISO('1 Dec 2024', 'en')).toBe('2024-12-01');
  });
});

describe('generateEInvoiceFilename', () => {
  it('should generate correct filename for xrechnung', () => {
    const ctx = createValidContext();
    const filename = generateEInvoiceFilename(ctx, 'xrechnung', 'xml');
    expect(filename).toBe('Rechnung_TC-001_November_2024_xrechnung.xml');
  });

  it('should generate correct filename for zugferd', () => {
    const ctx = createValidContext();
    const filename = generateEInvoiceFilename(ctx, 'zugferd', 'pdf');
    expect(filename).toBe('Rechnung_TC-001_November_2024_zugferd.pdf');
  });

  it('should sanitize invoice number with special characters', () => {
    const ctx = createValidContext();
    ctx.invoiceNumber = 'TC/001-2024';
    const filename = generateEInvoiceFilename(ctx, 'xrechnung', 'xml');
    expect(filename).toBe('Rechnung_TC_001-2024_November_2024_xrechnung.xml');
  });
});

describe('mapInvoiceContext', () => {
  it('should map invoice number correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-1']).toBe('TC-001');
  });

  it('should map invoice date to ISO format', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-2']).toBe('2024-12-15');
  });

  it('should set invoice type code to 380 (commercial invoice)', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-3']).toBe('380');
  });

  it('should map currency correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-5']).toBe('EUR');
  });

  it('should map due date when present', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-9']).toBe('2025-01-14');
  });

  it('should map Leitweg-ID as buyer reference', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-10']).toBe('991-12345-67');
  });

  it('should use project reference as fallback for buyer reference', () => {
    const ctx = createValidContext();
    ctx.client.eInvoice = undefined;
    ctx.client.projectReference = 'Project-2024-001';
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-10']).toBe('Project-2024-001');
  });

  it('should map seller information correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-27']).toBe('Test Provider GmbH');
    expect(data['BT-31']).toBe('DE123456789');
    expect(data['BT-32']).toBe('27/123/45678');
    expect(data['BT-34']).toBe('test@provider.de');
    expect(data['BT-35']).toBe('Teststraße 1');
    expect(data['BT-37']).toBe('10115 Berlin');
    expect(data['BT-40']).toBe('DE');
  });

  it('should map buyer information correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-44']).toBe('Test Client GmbH');
    expect(data['BT-49']).toBe('client@test.de');
    expect(data['BT-50']).toBe('Kundenstraße 2');
    expect(data['BT-52']).toBe('80331 München');
    expect(data['BT-55']).toBe('DE');
  });

  it('should map payment information correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-81']).toBe('58'); // SEPA credit transfer
    expect(data['BT-83']).toBe('Test Bank');
    expect(data['BT-84']).toBe('DE89370400440532013000'); // IBAN without spaces
    expect(data['BT-86']).toBe('COBADEFFXXX');
  });

  it('should map totals correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-106']).toBe(1200); // Sum of line net amounts
    expect(data['BT-109']).toBe(1200); // Total without VAT
    expect(data['BT-110']).toBe(228);  // VAT amount
    expect(data['BT-112']).toBe(1190); // Total with VAT (from context)
    expect(data['BT-115']).toBe(1190); // Payable amount
  });

  it('should map VAT breakdown correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data.vatBreakdown).toHaveLength(1);
    expect(data.vatBreakdown[0]['BT-116']).toBe(1200); // Taxable amount
    expect(data.vatBreakdown[0]['BT-117']).toBe(228);  // Tax amount
    expect(data.vatBreakdown[0]['BT-118']).toBe('S');  // Standard rate
    expect(data.vatBreakdown[0]['BT-119']).toBe(19);   // 19%
  });

  it('should map line items correctly', () => {
    const ctx = createValidContext();
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data.lines).toHaveLength(2);

    // First line: hourly consulting
    expect(data.lines[0]['BT-126']).toBe('1');
    expect(data.lines[0]['BT-129']).toBe(10);
    expect(data.lines[0]['BT-130']).toBe('HUR'); // Hour
    expect(data.lines[0]['BT-131']).toBe(1000);
    expect(data.lines[0]['BT-146']).toBe(100);
    expect(data.lines[0]['BT-153']).toBe('Consulting');
    expect(data.lines[0]['BT-151']).toBe('S');
    expect(data.lines[0]['BT-152']).toBe(19);

    // Second line: fixed setup
    expect(data.lines[1]['BT-126']).toBe('2');
    expect(data.lines[1]['BT-129']).toBe(1);
    expect(data.lines[1]['BT-130']).toBe('C62'); // Unit
    expect(data.lines[1]['BT-131']).toBe(200);
    expect(data.lines[1]['BT-146']).toBe(200);
    expect(data.lines[1]['BT-153']).toBe('Setup');
  });

  it('should handle zero tax rate (exempt)', () => {
    const ctx = createValidContext();
    ctx.taxRate = 0;
    ctx.taxAmount = 0;
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data.vatBreakdown[0]['BT-118']).toBe('E'); // Exempt
    expect(data.vatBreakdown[0]['BT-119']).toBe(0);
    expect(data.lines[0]['BT-151']).toBe('E');
    expect(data.lines[0]['BT-152']).toBe(0);
  });

  it('should handle client without email', () => {
    const ctx = createValidContext();
    ctx.client.email = undefined;
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    expect(data['BT-49']).toBeUndefined();
  });

  it('should handle client email with name format', () => {
    const ctx = createValidContext();
    ctx.client.email = { to: ['Max Mustermann <max@test.de>'] };
    const data = mapInvoiceContext(ctx, 'xrechnung', 'DE', 'DE');
    // BT-49 is "Buyer electronic address" - should extract the email, not the name
    expect(data['BT-49']).toBe('max@test.de');
  });

  it('should map for different countries correctly', () => {
    const ctx = createValidContext();
    ctx.client.email = { to: ['us@test.com'] };
    ctx.currency = 'USD';
    const data = mapInvoiceContext(ctx, 'ubl', 'US', 'US');
    expect(data['BT-40']).toBe('US');
    expect(data['BT-55']).toBe('US');
    expect(data['BT-5']).toBe('USD');
  });
});

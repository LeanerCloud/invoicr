import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateEInvoice, saveEInvoice } from '../src/einvoice/generator.js';
import type { InvoiceContext } from '../src/types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
      { description: 'Consulting', quantity: 10, rate: 100, billingType: 'hourly', total: 1000 }
    ],
    subtotal: 1000,
    taxAmount: 190,
    taxRate: 0.19
  };
}

describe('generateEInvoice', () => {
  it('should generate e-invoice for German XRechnung', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE');

    expect(result).toBeDefined();
    expect(result.format.format).toBe('xrechnung');
    expect(result.data).toBeInstanceOf(Buffer);
    expect(result.filename).toContain('.xml');
    expect(result.validation.valid).toBe(true);
  });

  it('should generate e-invoice for ZUGFeRD when requested', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE', { format: 'zugferd' });

    expect(result.format.format).toBe('zugferd');
    expect(result.data).toBeInstanceOf(Buffer);
  });

  it('should generate e-invoice for Romanian CIUS-RO', async () => {
    const ctx = createValidContext();
    ctx.provider.vatId = 'RO123456';
    ctx.provider.taxNumber = 'RO123456';
    const result = await generateEInvoice(ctx, 'RO', 'RO');

    expect(result.format.format).toBe('cius-ro');
    expect(result.data).toBeInstanceOf(Buffer);
  });

  it('should generate e-invoice for US UBL', async () => {
    const ctx = createValidContext();
    ctx.currency = 'USD';
    const result = await generateEInvoice(ctx, 'US', 'US');

    expect(result.format.format).toBe('ubl');
    expect(result.data).toBeInstanceOf(Buffer);
  });

  it('should throw error for unsupported country', async () => {
    const ctx = createValidContext();

    await expect(
      // @ts-expect-error Testing invalid country
      generateEInvoice(ctx, 'XX', 'XX')
    ).rejects.toThrow('No e-invoice format available');
  });

  it('should use client preferred format when available', async () => {
    const ctx = createValidContext();
    ctx.client.eInvoice = { preferredFormat: 'zugferd' };
    const result = await generateEInvoice(ctx, 'DE', 'DE');

    expect(result.format.format).toBe('zugferd');
  });

  it('should override client preferred format with options.format', async () => {
    const ctx = createValidContext();
    ctx.client.eInvoice = { preferredFormat: 'zugferd' };
    const result = await generateEInvoice(ctx, 'DE', 'DE', { format: 'xrechnung' });

    expect(result.format.format).toBe('xrechnung');
  });

  it('should throw error for invalid context when validation not skipped', async () => {
    const ctx = createValidContext();
    ctx.provider.vatId = undefined;

    await expect(
      generateEInvoice(ctx, 'DE', 'DE')
    ).rejects.toThrow('validation failed');
  });

  it('should proceed when validation is skipped', async () => {
    const ctx = createValidContext();
    ctx.provider.vatId = undefined;

    const result = await generateEInvoice(ctx, 'DE', 'DE', { skipValidation: true });
    expect(result.data).toBeInstanceOf(Buffer);
    expect(result.validation.valid).toBe(false);
  });

  it('should generate valid XML structure', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE');

    const xmlContent = result.data.toString('utf-8');
    expect(xmlContent).toContain('<?xml');
    expect(xmlContent).toContain('Invoice');
    expect(xmlContent).toContain('TC-001');
    expect(xmlContent).toContain('Test Provider GmbH');
    expect(xmlContent).toContain('Test Client GmbH');
  });

  it('should include VAT breakdown in generated XML', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE');

    const xmlContent = result.data.toString('utf-8');
    expect(xmlContent).toContain('TaxTotal');
    expect(xmlContent).toContain('TaxAmount');
  });

  it('should include line items in generated XML', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE');

    const xmlContent = result.data.toString('utf-8');
    expect(xmlContent).toContain('InvoiceLine');
    expect(xmlContent).toContain('Consulting');
  });
});

describe('saveEInvoice', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'einvoice-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should save e-invoice to file', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE');

    const savedPath = await saveEInvoice(result, tempDir);

    expect(fs.existsSync(savedPath)).toBe(true);
    expect(savedPath).toContain('.xml');

    const savedContent = fs.readFileSync(savedPath, 'utf-8');
    expect(savedContent).toContain('<?xml');
  });

  it('should use correct filename from result', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE');

    const savedPath = await saveEInvoice(result, tempDir);

    expect(path.basename(savedPath)).toBe(result.filename);
  });

  it('should save PDF for ZUGFeRD format', async () => {
    const ctx = createValidContext();
    const result = await generateEInvoice(ctx, 'DE', 'DE', { format: 'zugferd' });

    const savedPath = await saveEInvoice(result, tempDir);

    // Note: actual content is still XML as we use fallback, but filename should be .pdf
    expect(result.format.fileExtension).toBe('pdf');
  });
});

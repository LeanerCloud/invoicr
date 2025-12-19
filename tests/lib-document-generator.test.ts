import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  generateDocx,
  generateDocuments,
  convertToPdf,
  generateOutputPaths,
  isLibreOfficeAvailable,
  getLibreOfficeVersion
} from '../src/lib/document-generator.js';
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

describe('document-generator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-docgen-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('generateDocx', () => {
    it('should generate a DOCX file', async () => {
      const ctx = createValidContext();
      const result = await generateDocx(ctx, tempDir);

      expect(result.docxPath).toContain('.docx');
      expect(result.docxBuffer).toBeInstanceOf(Buffer);
      expect(fs.existsSync(result.docxPath)).toBe(true);
    });

    it('should use correct filename format', async () => {
      const ctx = createValidContext();
      const result = await generateDocx(ctx, tempDir);

      expect(result.docxPath).toContain('Rechnung_TC-001_November_2024.docx');
    });

    it('should use specified template', async () => {
      const ctx = createValidContext();
      const result = await generateDocx(ctx, tempDir, 'minimal');

      expect(result.docxBuffer).toBeInstanceOf(Buffer);
      expect(fs.existsSync(result.docxPath)).toBe(true);
    });

    it('should use detailed template', async () => {
      const ctx = createValidContext();
      const result = await generateDocx(ctx, tempDir, 'detailed');

      expect(result.docxBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle multiple line items', async () => {
      const ctx = createValidContext();
      ctx.lineItems = [
        { description: 'Development', quantity: 20, rate: 100, billingType: 'hourly', total: 2000 },
        { description: 'Testing', quantity: 10, rate: 80, billingType: 'hourly', total: 800 },
        { description: 'Setup', quantity: 1, rate: 500, billingType: 'fixed', total: 500 }
      ];
      ctx.subtotal = 3300;
      ctx.taxAmount = 627;
      ctx.totalAmount = 3927;

      const result = await generateDocx(ctx, tempDir);

      expect(result.docxBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateOutputPaths', () => {
    it('should generate correct paths', () => {
      const ctx = createValidContext();
      const result = generateOutputPaths(ctx, '/output/dir');

      expect(result.docxPath).toBe('/output/dir/Rechnung_TC-001_November_2024.docx');
      expect(result.pdfPath).toBe('/output/dir/Rechnung_TC-001_November_2024.pdf');
    });

    it('should handle spaces in month name', () => {
      const ctx = createValidContext();
      ctx.monthName = 'December 2024';
      const result = generateOutputPaths(ctx, '/output');

      expect(result.docxPath).toContain('December_2024');
    });

    it('should use translation file prefix', () => {
      const ctx = createValidContext();
      ctx.translations.filePrefix = 'Invoice';
      const result = generateOutputPaths(ctx, '/output');

      expect(result.docxPath).toContain('Invoice_');
    });
  });

  describe('isLibreOfficeAvailable', () => {
    it('should return a boolean', () => {
      const result = isLibreOfficeAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getLibreOfficeVersion', () => {
    it('should return string or null', () => {
      const result = getLibreOfficeVersion();
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('convertToPdf', () => {
    it('should throw error when LibreOffice not available or conversion fails', async () => {
      const ctx = createValidContext();
      const { docxPath } = await generateDocx(ctx, tempDir);

      // This may throw if LibreOffice isn't installed, which is expected behavior
      try {
        const pdfPath = convertToPdf(docxPath);
        // If LibreOffice is installed, check that PDF was created
        expect(fs.existsSync(pdfPath)).toBe(true);
      } catch (error) {
        // Expected if LibreOffice not installed
        expect((error as Error).message).toContain('PDF conversion failed');
      }
    });

    it('should throw for non-existent docx file', () => {
      expect(() => convertToPdf('/nonexistent/file.docx')).toThrow();
    });
  });

  describe('generateDocuments', () => {
    it('should generate both DOCX and PDF', async () => {
      const ctx = createValidContext();

      try {
        const result = await generateDocuments(ctx, tempDir);

        expect(result.docxPath).toContain('.docx');
        expect(result.pdfPath).toContain('.pdf');
        expect(result.docxBuffer).toBeInstanceOf(Buffer);
        expect(fs.existsSync(result.docxPath)).toBe(true);
        expect(fs.existsSync(result.pdfPath)).toBe(true);
      } catch (error) {
        // Expected if LibreOffice not installed
        expect((error as Error).message).toContain('PDF conversion failed');
      }
    });

    it('should use specified template for document generation', async () => {
      const ctx = createValidContext();

      try {
        const result = await generateDocuments(ctx, tempDir, 'detailed');
        expect(result.docxBuffer.length).toBeGreaterThan(0);
      } catch (error) {
        // Expected if LibreOffice not installed
        expect((error as Error).message).toContain('PDF conversion failed');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle zero tax rate', async () => {
      const ctx = createValidContext();
      ctx.taxRate = 0;
      ctx.taxAmount = 0;

      const result = await generateDocx(ctx, tempDir);
      expect(result.docxBuffer.length).toBeGreaterThan(0);
    });

    it('should handle English translations', async () => {
      const ctx = createValidContext();
      ctx.lang = 'en';
      ctx.translations.filePrefix = 'Invoice';

      const result = await generateDocx(ctx, tempDir);
      expect(result.docxPath).toContain('Invoice_');
    });

    it('should handle daily billing type', async () => {
      const ctx = createValidContext();
      ctx.billingType = 'daily';
      ctx.lineItems = [
        { description: 'Consulting', quantity: 5, rate: 800, billingType: 'daily', total: 4000 }
      ];

      const result = await generateDocx(ctx, tempDir);
      expect(result.docxBuffer.length).toBeGreaterThan(0);
    });

    it('should handle fixed billing type', async () => {
      const ctx = createValidContext();
      ctx.billingType = 'fixed';
      ctx.lineItems = [
        { description: 'Project Setup', quantity: 1, rate: 5000, billingType: 'fixed', total: 5000 }
      ];

      const result = await generateDocx(ctx, tempDir);
      expect(result.docxBuffer.length).toBeGreaterThan(0);
    });

    it('should handle provider with logo path', async () => {
      const ctx = createValidContext();
      ctx.provider.logoPath = '/nonexistent/logo.png';

      const result = await generateDocx(ctx, tempDir);
      expect(result.docxBuffer.length).toBeGreaterThan(0);
    });

    it('should handle client with project reference', async () => {
      const ctx = createValidContext();
      ctx.client.projectReference = 'PROJECT-2024-001';

      const result = await generateDocx(ctx, tempDir);
      expect(result.docxBuffer.length).toBeGreaterThan(0);
    });
  });
});

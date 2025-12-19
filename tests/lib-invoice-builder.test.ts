import { describe, it, expect } from 'vitest';
import {
  calculateTotals,
  buildLineItems,
  buildServiceDescription,
  generateInvoiceNumber,
  getServicePeriod,
  buildInvoiceContext,
  getDefaultBillingMonth,
  parseMonthArg,
  incrementInvoiceNumber
} from '../src/lib/invoice-builder.js';
import type { Client, Provider, Translations, ResolvedLineItem } from '../src/types.js';

describe('invoice-builder', () => {
  const validProvider: Provider = {
    name: 'Test Provider',
    address: { street: '123 Main St', city: 'Berlin 10115' },
    phone: '+49 123 456789',
    email: 'test@example.com',
    bank: { name: 'Test Bank', iban: 'DE12345678901234567890', bic: 'TESTBIC' },
    taxNumber: '123/456/789'
  };

  const validClient: Client = {
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

  describe('calculateTotals', () => {
    it('should calculate subtotal, tax, and total', () => {
      const lineItems: ResolvedLineItem[] = [
        { description: 'Item 1', quantity: 10, rate: 100, billingType: 'hourly', total: 1000 },
        { description: 'Item 2', quantity: 5, rate: 50, billingType: 'hourly', total: 250 }
      ];

      const result = calculateTotals(lineItems, 0.19);

      expect(result.subtotal).toBe(1250);
      expect(result.taxAmount).toBeCloseTo(237.5);
      expect(result.totalAmount).toBeCloseTo(1487.5);
    });

    it('should handle zero tax rate', () => {
      const lineItems: ResolvedLineItem[] = [
        { description: 'Item 1', quantity: 10, rate: 100, billingType: 'hourly', total: 1000 }
      ];

      const result = calculateTotals(lineItems, 0);

      expect(result.subtotal).toBe(1000);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1000);
    });

    it('should handle empty line items', () => {
      const result = calculateTotals([], 0.19);

      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe('buildLineItems', () => {
    it('should build line items from single service', () => {
      const result = buildLineItems(validClient, 40, 'en');

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Consulting Services');
      expect(result[0].quantity).toBe(40);
      expect(result[0].rate).toBe(100);
      expect(result[0].total).toBe(4000);
    });

    it('should build line items from client lineItems config', () => {
      const clientWithLineItems: Client = {
        ...validClient,
        lineItems: [
          { description: 'Development', quantity: 20, rate: 100, billingType: 'hourly' },
          { description: 'Setup', quantity: 500, rate: 1, billingType: 'fixed' }
        ]
      };

      const result = buildLineItems(clientWithLineItems, 0, 'en');

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Development');
      expect(result[0].total).toBe(2000);
      expect(result[1].description).toBe('Setup');
      expect(result[1].total).toBe(500); // Fixed billing uses quantity as total
    });

    it('should handle fixed billing type', () => {
      const clientWithFixed: Client = {
        ...validClient,
        service: {
          ...validClient.service,
          billingType: 'fixed'
        }
      };

      const result = buildLineItems(clientWithFixed, 500, 'en');

      expect(result[0].total).toBe(500); // For fixed, quantity IS the total
    });
  });

  describe('buildServiceDescription', () => {
    it('should append month to service description', () => {
      const result = buildServiceDescription(validClient, 'November 2024', 'en');
      expect(result).toBe('Consulting Services, November 2024');
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number from prefix and number', () => {
      const result = generateInvoiceNumber(validClient);
      expect(result).toBe('AC-5');
    });
  });

  describe('getServicePeriod', () => {
    it('should return service period in English', () => {
      const date = new Date(2024, 10, 15); // November 2024
      const result = getServicePeriod(date, 'en');

      expect(result.monthName).toBe('November 2024');
      expect(result.servicePeriod).toBe('November 2024');
    });

    it('should return service period in German', () => {
      const date = new Date(2024, 10, 15); // November 2024
      const result = getServicePeriod(date, 'de');

      expect(result.monthName).toBe('November 2024');
      expect(result.servicePeriod).toContain('Nov');
      expect(result.servicePeriod).toContain('2024');
    });
  });

  describe('getDefaultBillingMonth', () => {
    it('should return previous month', () => {
      const now = new Date();
      const result = getDefaultBillingMonth();

      const expectedMonth = now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1;
      expect(result.getMonth()).toBe(expectedMonth);
    });
  });

  describe('parseMonthArg', () => {
    it('should parse MM-YYYY format', () => {
      const result = parseMonthArg('11-2024');

      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });

    it('should parse single digit month', () => {
      const result = parseMonthArg('1-2025');

      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('incrementInvoiceNumber', () => {
    it('should return new client with incremented invoice number', () => {
      const result = incrementInvoiceNumber(validClient);

      expect(result.nextInvoiceNumber).toBe(6);
      expect(validClient.nextInvoiceNumber).toBe(5); // Original unchanged
    });
  });

  describe('buildInvoiceContext', () => {
    it('should build complete invoice context', () => {
      const result = buildInvoiceContext(
        validProvider,
        validClient,
        translations,
        { quantity: 40 }
      );

      expect(result.invoiceNumber).toBe('AC-5');
      expect(result.quantity).toBe(40);
      expect(result.rate).toBe(100);
      expect(result.subtotal).toBe(4000);
      expect(result.taxAmount).toBeCloseTo(760);
      expect(result.totalAmount).toBeCloseTo(4760);
      expect(result.lineItems).toHaveLength(1);
    });

    it('should use provided billing month', () => {
      const billingMonth = new Date(2024, 5, 15); // June 2024
      const result = buildInvoiceContext(
        validProvider,
        validClient,
        translations,
        { quantity: 40, billingMonth }
      );

      expect(result.monthName).toBe('June 2024');
    });

    it('should calculate due date when payment terms set', () => {
      const clientWithTerms: Client = {
        ...validClient,
        paymentTermsDays: 30
      };

      const result = buildInvoiceContext(
        validProvider,
        clientWithTerms,
        translations,
        { quantity: 40 }
      );

      expect(result.dueDate).toBeDefined();
    });

    it('should use client bank details if specified', () => {
      const clientWithBank: Client = {
        ...validClient,
        bank: { name: 'Client Bank', iban: 'US123456789', bic: 'CLIENTBIC' }
      };

      const result = buildInvoiceContext(
        validProvider,
        clientWithBank,
        translations,
        { quantity: 40 }
      );

      expect(result.bankDetails.name).toBe('Client Bank');
    });
  });
});

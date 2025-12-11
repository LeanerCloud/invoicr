import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getHistory, saveToHistory, getLastInvoice, getInvoicesForMonth, InvoiceRecord } from '../src/history.js';

describe('history', () => {
  const testDir = '/tmp/invoicr-test-history';
  const historyPath = path.join(testDir, 'history.json');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Remove history file if exists
    if (fs.existsSync(historyPath)) {
      fs.unlinkSync(historyPath);
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(historyPath)) {
      fs.unlinkSync(historyPath);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  describe('getHistory', () => {
    it('should return empty array if history file does not exist', () => {
      const result = getHistory(testDir);
      expect(result).toEqual([]);
    });

    it('should return invoices from history file', () => {
      const history = {
        invoices: [
          { invoiceNumber: 'AC-1', date: '2025-11-01', month: 'November 2025', quantity: 40, rate: 150, totalAmount: 6000, currency: 'USD', pdfPath: '/path/to/invoice.pdf' }
        ]
      };
      fs.writeFileSync(historyPath, JSON.stringify(history));

      const result = getHistory(testDir);
      expect(result.length).toBe(1);
      expect(result[0].invoiceNumber).toBe('AC-1');
    });

    it('should return empty array on invalid JSON', () => {
      fs.writeFileSync(historyPath, 'invalid json');
      const result = getHistory(testDir);
      expect(result).toEqual([]);
    });
  });

  describe('saveToHistory', () => {
    const testRecord: InvoiceRecord = {
      invoiceNumber: 'AC-1',
      date: '2025-11-15',
      month: 'November 2025',
      quantity: 40,
      rate: 150,
      totalAmount: 6000,
      currency: 'USD',
      pdfPath: '/path/to/invoice.pdf'
    };

    it('should create history file if it does not exist', () => {
      saveToHistory(testDir, testRecord);

      expect(fs.existsSync(historyPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      expect(data.invoices.length).toBe(1);
      expect(data.invoices[0].invoiceNumber).toBe('AC-1');
    });

    it('should append to existing history', () => {
      saveToHistory(testDir, testRecord);
      saveToHistory(testDir, { ...testRecord, invoiceNumber: 'AC-2' });

      const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      expect(data.invoices.length).toBe(2);
      expect(data.invoices[0].invoiceNumber).toBe('AC-1');
      expect(data.invoices[1].invoiceNumber).toBe('AC-2');
    });
  });

  describe('getLastInvoice', () => {
    it('should return undefined if no history', () => {
      const result = getLastInvoice(testDir);
      expect(result).toBeUndefined();
    });

    it('should return the last invoice', () => {
      const record1: InvoiceRecord = {
        invoiceNumber: 'AC-1',
        date: '2025-10-15',
        month: 'October 2025',
        quantity: 30,
        rate: 150,
        totalAmount: 4500,
        currency: 'USD',
        pdfPath: '/path/to/invoice1.pdf'
      };
      const record2: InvoiceRecord = {
        invoiceNumber: 'AC-2',
        date: '2025-11-15',
        month: 'November 2025',
        quantity: 40,
        rate: 150,
        totalAmount: 6000,
        currency: 'USD',
        pdfPath: '/path/to/invoice2.pdf'
      };

      saveToHistory(testDir, record1);
      saveToHistory(testDir, record2);

      const result = getLastInvoice(testDir);
      expect(result?.invoiceNumber).toBe('AC-2');
    });
  });

  describe('getInvoicesForMonth', () => {
    it('should return empty array if no invoices for month', () => {
      const result = getInvoicesForMonth(testDir, 'November 2025');
      expect(result).toEqual([]);
    });

    it('should return only invoices for specified month', () => {
      const oct: InvoiceRecord = {
        invoiceNumber: 'AC-1',
        date: '2025-10-15',
        month: 'October 2025',
        quantity: 30,
        rate: 150,
        totalAmount: 4500,
        currency: 'USD',
        pdfPath: '/path/to/invoice1.pdf'
      };
      const nov1: InvoiceRecord = {
        invoiceNumber: 'AC-2',
        date: '2025-11-15',
        month: 'November 2025',
        quantity: 40,
        rate: 150,
        totalAmount: 6000,
        currency: 'USD',
        pdfPath: '/path/to/invoice2.pdf'
      };
      const nov2: InvoiceRecord = {
        invoiceNumber: 'AC-3',
        date: '2025-11-20',
        month: 'November 2025',
        quantity: 10,
        rate: 150,
        totalAmount: 1500,
        currency: 'USD',
        pdfPath: '/path/to/invoice3.pdf'
      };

      saveToHistory(testDir, oct);
      saveToHistory(testDir, nov1);
      saveToHistory(testDir, nov2);

      const result = getInvoicesForMonth(testDir, 'November 2025');
      expect(result.length).toBe(2);
      expect(result[0].invoiceNumber).toBe('AC-2');
      expect(result[1].invoiceNumber).toBe('AC-3');
    });
  });
});

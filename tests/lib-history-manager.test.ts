import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getHistoryPath,
  loadHistory,
  saveHistory,
  addHistoryEntry,
  getLastInvoice,
  getInvoiceByNumber,
  getInvoicesByMonth,
  getInvoicesByYear,
  getTotalRevenue,
  getInvoiceCount,
  hasHistory,
  deleteInvoice,
  clearHistory,
  type InvoiceHistoryEntry
} from '../src/lib/history-manager.js';

describe('history-manager', () => {
  let tempDir: string;

  const sampleEntry: InvoiceHistoryEntry = {
    invoiceNumber: 'AC-001',
    date: '2024-11-15',
    month: 'November 2024',
    quantity: 40,
    rate: 100,
    totalAmount: 4000,
    currency: 'USD'
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoicr-history-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getHistoryPath', () => {
    it('should return path to history.json', () => {
      const result = getHistoryPath('/some/client/dir');
      expect(result).toBe('/some/client/dir/history.json');
    });
  });

  describe('loadHistory', () => {
    it('should return empty history for nonexistent file', () => {
      const result = loadHistory(tempDir);
      expect(result.invoices).toEqual([]);
    });

    it('should load existing history', () => {
      const historyPath = path.join(tempDir, 'history.json');
      fs.writeFileSync(historyPath, JSON.stringify({ invoices: [sampleEntry] }));

      const result = loadHistory(tempDir);
      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].invoiceNumber).toBe('AC-001');
    });

    it('should handle corrupted JSON gracefully', () => {
      const historyPath = path.join(tempDir, 'history.json');
      fs.writeFileSync(historyPath, 'invalid json');

      const result = loadHistory(tempDir);
      expect(result.invoices).toEqual([]);
    });
  });

  describe('saveHistory', () => {
    it('should save history to file', () => {
      saveHistory(tempDir, { invoices: [sampleEntry] });

      const historyPath = path.join(tempDir, 'history.json');
      expect(fs.existsSync(historyPath)).toBe(true);

      const saved = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      expect(saved.invoices).toHaveLength(1);
    });
  });

  describe('addHistoryEntry', () => {
    it('should add entry to empty history', () => {
      const result = addHistoryEntry(tempDir, sampleEntry);

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0]).toEqual(sampleEntry);
    });

    it('should append entry to existing history', () => {
      addHistoryEntry(tempDir, sampleEntry);
      const secondEntry = { ...sampleEntry, invoiceNumber: 'AC-002' };

      const result = addHistoryEntry(tempDir, secondEntry);

      expect(result.invoices).toHaveLength(2);
      expect(result.invoices[1].invoiceNumber).toBe('AC-002');
    });
  });

  describe('getLastInvoice', () => {
    it('should return null for empty history', () => {
      const result = getLastInvoice(tempDir);
      expect(result).toBeNull();
    });

    it('should return most recent invoice', () => {
      addHistoryEntry(tempDir, sampleEntry);
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002' });

      const result = getLastInvoice(tempDir);
      expect(result?.invoiceNumber).toBe('AC-002');
    });
  });

  describe('getInvoiceByNumber', () => {
    it('should find invoice by number', () => {
      addHistoryEntry(tempDir, sampleEntry);
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002' });

      const result = getInvoiceByNumber(tempDir, 'AC-001');
      expect(result?.invoiceNumber).toBe('AC-001');
    });

    it('should return null for nonexistent invoice', () => {
      addHistoryEntry(tempDir, sampleEntry);

      const result = getInvoiceByNumber(tempDir, 'AC-999');
      expect(result).toBeNull();
    });
  });

  describe('getInvoicesByMonth', () => {
    it('should filter invoices by month', () => {
      addHistoryEntry(tempDir, sampleEntry);
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002', month: 'December 2024' });

      const result = getInvoicesByMonth(tempDir, 'November 2024');
      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe('AC-001');
    });

    it('should return empty array for no matches', () => {
      addHistoryEntry(tempDir, sampleEntry);

      const result = getInvoicesByMonth(tempDir, 'January 2025');
      expect(result).toHaveLength(0);
    });
  });

  describe('getInvoicesByYear', () => {
    it('should filter invoices by year', () => {
      addHistoryEntry(tempDir, sampleEntry);
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002', month: 'January 2025', date: '2025-01-15' });

      const result = getInvoicesByYear(tempDir, 2024);
      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe('AC-001');
    });
  });

  describe('getTotalRevenue', () => {
    it('should sum all invoice totals', () => {
      addHistoryEntry(tempDir, { ...sampleEntry, totalAmount: 1000 });
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002', totalAmount: 2000 });

      const result = getTotalRevenue(tempDir);
      expect(result).toBe(3000);
    });

    it('should filter by currency when specified', () => {
      addHistoryEntry(tempDir, { ...sampleEntry, totalAmount: 1000, currency: 'USD' });
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002', totalAmount: 2000, currency: 'EUR' });

      const result = getTotalRevenue(tempDir, 'USD');
      expect(result).toBe(1000);
    });

    it('should return 0 for empty history', () => {
      const result = getTotalRevenue(tempDir);
      expect(result).toBe(0);
    });
  });

  describe('getInvoiceCount', () => {
    it('should return number of invoices', () => {
      addHistoryEntry(tempDir, sampleEntry);
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002' });

      const result = getInvoiceCount(tempDir);
      expect(result).toBe(2);
    });

    it('should return 0 for empty history', () => {
      const result = getInvoiceCount(tempDir);
      expect(result).toBe(0);
    });
  });

  describe('hasHistory', () => {
    it('should return false when no history file exists', () => {
      const result = hasHistory(tempDir);
      expect(result).toBe(false);
    });

    it('should return true when history file exists', () => {
      addHistoryEntry(tempDir, sampleEntry);

      const result = hasHistory(tempDir);
      expect(result).toBe(true);
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice by number', () => {
      addHistoryEntry(tempDir, sampleEntry);
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002' });

      const result = deleteInvoice(tempDir, 'AC-001');

      expect(result).toBe(true);
      expect(getInvoiceCount(tempDir)).toBe(1);
      expect(getInvoiceByNumber(tempDir, 'AC-001')).toBeNull();
    });

    it('should return false for nonexistent invoice', () => {
      addHistoryEntry(tempDir, sampleEntry);

      const result = deleteInvoice(tempDir, 'AC-999');

      expect(result).toBe(false);
      expect(getInvoiceCount(tempDir)).toBe(1);
    });
  });

  describe('clearHistory', () => {
    it('should remove all invoices', () => {
      addHistoryEntry(tempDir, sampleEntry);
      addHistoryEntry(tempDir, { ...sampleEntry, invoiceNumber: 'AC-002' });

      clearHistory(tempDir);

      expect(getInvoiceCount(tempDir)).toBe(0);
      expect(hasHistory(tempDir)).toBe(true); // File still exists but empty
    });
  });
});

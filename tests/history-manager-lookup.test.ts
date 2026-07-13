import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  findInvoiceAttachments,
  findHistoryEntryByPdf,
  type InvoiceHistoryEntry,
} from '../src/lib/history-manager.js';

describe('history-manager file lookups', () => {
  const dir = '/tmp/invoicr-test-lookup';

  function entry(overrides: Partial<InvoiceHistoryEntry>): InvoiceHistoryEntry {
    return {
      invoiceNumber: 'SM-1',
      date: '2026-07-07',
      month: 'June 2026',
      quantity: 1,
      rate: 1,
      totalAmount: 1,
      currency: 'USD',
      ...overrides,
    };
  }

  beforeEach(() => {
    fs.mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('findInvoiceAttachments', () => {
    it('prefers the recorded pdfPath when it still exists', () => {
      const pdf = path.join(dir, 'Invoice_SM-15_June_2026.pdf');
      fs.writeFileSync(pdf, 'x');
      expect(findInvoiceAttachments(dir, 'SM-15', pdf).pdfPath).toBe(pdf);
    });

    it('falls back to a bounded filename match (SM-1 does not match SM-15)', () => {
      fs.writeFileSync(path.join(dir, 'Invoice_SM-15_June_2026.pdf'), 'x');
      // Only the SM-15 file exists; looking for SM-1 must NOT match it.
      expect(findInvoiceAttachments(dir, 'SM-1').pdfPath).toBeNull();

      fs.writeFileSync(path.join(dir, 'Invoice_SM-1_May_2026.pdf'), 'x');
      expect(findInvoiceAttachments(dir, 'SM-1').pdfPath).toBe(
        path.join(dir, 'Invoice_SM-1_May_2026.pdf')
      );
    });

    it('locates a matching e-invoice XML alongside the PDF', () => {
      fs.writeFileSync(path.join(dir, 'Invoice_SM-15_June_2026.pdf'), 'x');
      fs.writeFileSync(path.join(dir, 'Invoice_SM-15_June_2026.xml'), '<x/>');
      const result = findInvoiceAttachments(dir, 'SM-15');
      expect(result.eInvoicePath).toBe(path.join(dir, 'Invoice_SM-15_June_2026.xml'));
    });

    it('returns null pdfPath when nothing matches', () => {
      expect(findInvoiceAttachments(dir, 'SM-99').pdfPath).toBeNull();
    });
  });

  describe('findHistoryEntryByPdf', () => {
    function writeHistory(entries: InvoiceHistoryEntry[]) {
      fs.writeFileSync(path.join(dir, 'history.json'), JSON.stringify({ invoices: entries }));
    }

    it('matches by exact recorded pdfPath', () => {
      const pdf = path.join(dir, 'Invoice_SM-15_June_2026.pdf');
      writeHistory([entry({ invoiceNumber: 'SM-15', pdfPath: pdf })]);
      expect(findHistoryEntryByPdf(dir, pdf)?.invoiceNumber).toBe('SM-15');
    });

    it('falls back to a bounded filename match without matching a prefix number', () => {
      writeHistory([
        entry({ invoiceNumber: 'SM-1', month: 'May 2026' }),
        entry({ invoiceNumber: 'SM-15', month: 'June 2026' }),
      ]);
      // History pdfPaths are absent; match by the filename's bounded invoice number.
      const found = findHistoryEntryByPdf(dir, '/somewhere/Invoice_SM-15_June_2026.pdf');
      expect(found?.invoiceNumber).toBe('SM-15');
    });

    it('returns null when no entry matches', () => {
      writeHistory([entry({ invoiceNumber: 'SM-1' })]);
      expect(findHistoryEntryByPdf(dir, '/x/Invoice_SM-99_June_2026.pdf')).toBeNull();
    });
  });
});

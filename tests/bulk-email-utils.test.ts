import { describe, it, expect } from 'vitest';
import {
  parseClientInvoiceSpec,
  normalizeMonthName,
  selectInvoice
} from '../src/lib/bulk-email-utils.js';
import type { InvoiceHistoryEntry } from '../src/lib/history-manager.js';

function entry(overrides: Partial<InvoiceHistoryEntry> = {}): InvoiceHistoryEntry {
  return {
    invoiceNumber: 'SM-1',
    date: '2026-07-07',
    month: 'June 2026',
    quantity: 1,
    rate: 100,
    totalAmount: 100,
    currency: 'USD',
    ...overrides,
  };
}

describe('parseClientInvoiceSpec', () => {
  it('parses a bare client with no invoice number', () => {
    expect(parseClientInvoiceSpec('shiftmarkets')).toEqual({ client: 'shiftmarkets' });
  });

  it('parses client:invoice into client and invoiceNumber', () => {
    expect(parseClientInvoiceSpec('shiftmarkets:SM-15')).toEqual({
      client: 'shiftmarkets',
      invoiceNumber: 'SM-15',
    });
  });

  it('splits on the first colon only', () => {
    // Defensive: invoice numbers never contain a colon, but be explicit.
    expect(parseClientInvoiceSpec('a:b:c')).toEqual({ client: 'a', invoiceNumber: 'b:c' });
  });

  it('treats a trailing colon with no invoice number as bare client', () => {
    expect(parseClientInvoiceSpec('shiftmarkets:')).toEqual({ client: 'shiftmarkets' });
  });
});

describe('normalizeMonthName', () => {
  it('normalizes MM-YYYY to the history month name', () => {
    expect(normalizeMonthName('06-2026')).toBe('June 2026');
  });

  it('normalizes ISO YYYY-MM to the history month name', () => {
    expect(normalizeMonthName('2026-06')).toBe('June 2026');
  });

  it('handles single-digit and December correctly', () => {
    expect(normalizeMonthName('1-2026')).toBe('January 2026');
    expect(normalizeMonthName('12-2025')).toBe('December 2025');
  });
});

describe('selectInvoice', () => {
  it('errors with no-history on an empty list', () => {
    const result = selectInvoice([]);
    expect(result.entry).toBeUndefined();
    expect(result.error?.reason).toBe('no-history');
  });

  it('selects the most recent invoice by default', () => {
    const invoices = [entry({ invoiceNumber: 'SM-1' }), entry({ invoiceNumber: 'SM-2' })];
    expect(selectInvoice(invoices).entry?.invoiceNumber).toBe('SM-2');
  });

  it('selects an explicit invoice number', () => {
    const invoices = [entry({ invoiceNumber: 'SM-1' }), entry({ invoiceNumber: 'SM-2' })];
    expect(selectInvoice(invoices, { invoiceNumber: 'SM-1' }).entry?.invoiceNumber).toBe('SM-1');
  });

  it('errors with invoice-not-found and lists available numbers', () => {
    const invoices = [entry({ invoiceNumber: 'SM-1' }), entry({ invoiceNumber: 'SM-2' })];
    const result = selectInvoice(invoices, { invoiceNumber: 'SM-9' });
    expect(result.error?.reason).toBe('invoice-not-found');
    expect(result.error?.available).toEqual(['SM-1', 'SM-2']);
  });

  it('selects the most recent invoice matching a month', () => {
    const invoices = [
      entry({ invoiceNumber: 'SM-1', month: 'May 2026' }),
      entry({ invoiceNumber: 'SM-2', month: 'June 2026' }),
      entry({ invoiceNumber: 'SM-3', month: 'June 2026' }),
    ];
    expect(selectInvoice(invoices, { monthName: 'June 2026' }).entry?.invoiceNumber).toBe('SM-3');
  });

  it('errors with month-not-found and lists unique available months', () => {
    const invoices = [
      entry({ invoiceNumber: 'SM-1', month: 'May 2026' }),
      entry({ invoiceNumber: 'SM-2', month: 'June 2026' }),
    ];
    const result = selectInvoice(invoices, { monthName: 'July 2026' });
    expect(result.error?.reason).toBe('month-not-found');
    expect(result.error?.available).toEqual(['May 2026', 'June 2026']);
  });

  it('prefers explicit invoice number over month', () => {
    const invoices = [
      entry({ invoiceNumber: 'SM-1', month: 'May 2026' }),
      entry({ invoiceNumber: 'SM-2', month: 'June 2026' }),
    ];
    const result = selectInvoice(invoices, { invoiceNumber: 'SM-1', monthName: 'June 2026' });
    expect(result.entry?.invoiceNumber).toBe('SM-1');
  });
});

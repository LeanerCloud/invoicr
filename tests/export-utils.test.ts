import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  scanDirectoryForHistory,
  collectAllRecords,
  escapeCsvCell,
  formatAsCsv,
  formatAsJson,
  formatRecords,
  ExportRecord
} from '../src/commands/export-utils.js';

describe('escapeCsvCell', () => {
  it('should wrap value in quotes', () => {
    expect(escapeCsvCell('test')).toBe('"test"');
  });

  it('should escape double quotes', () => {
    expect(escapeCsvCell('say "hello"')).toBe('"say ""hello"""');
  });

  it('should handle empty string', () => {
    expect(escapeCsvCell('')).toBe('""');
  });

  it('should handle values with commas', () => {
    expect(escapeCsvCell('a,b,c')).toBe('"a,b,c"');
  });
});

describe('formatAsCsv', () => {
  it('should format records as CSV', () => {
    const records: ExportRecord[] = [{
      invoiceNumber: 'AC-1',
      date: '2025-11-15',
      client: 'acme',
      month: 'November 2025',
      quantity: 40,
      rate: 150,
      totalAmount: 6000,
      currency: 'USD',
      pdfPath: '/path/to/invoice.pdf'
    }];

    const result = formatAsCsv(records);

    expect(result).toContain('Invoice Number,Date,Client');
    expect(result).toContain('"AC-1"');
    expect(result).toContain('"2025-11-15"');
    expect(result).toContain('"acme"');
    expect(result).toContain('"6000.00"');
  });

  it('should handle multiple records', () => {
    const records: ExportRecord[] = [
      {
        invoiceNumber: 'AC-1', date: '2025-11-15', client: 'acme', month: 'Nov 2025',
        quantity: 40, rate: 150, totalAmount: 6000, currency: 'USD', pdfPath: '/a.pdf'
      },
      {
        invoiceNumber: 'AC-2', date: '2025-12-15', client: 'acme', month: 'Dec 2025',
        quantity: 30, rate: 150, totalAmount: 4500, currency: 'USD', pdfPath: '/b.pdf'
      }
    ];

    const result = formatAsCsv(records);
    const lines = result.split('\n');
    expect(lines.length).toBe(3); // header + 2 data rows
  });
});

describe('formatAsJson', () => {
  it('should format records as JSON', () => {
    const records: ExportRecord[] = [{
      invoiceNumber: 'AC-1',
      date: '2025-11-15',
      client: 'acme',
      month: 'November 2025',
      quantity: 40,
      rate: 150,
      totalAmount: 6000,
      currency: 'USD',
      pdfPath: '/path/to/invoice.pdf'
    }];

    const result = formatAsJson(records);
    const parsed = JSON.parse(result);

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed[0].invoiceNumber).toBe('AC-1');
    expect(parsed[0].totalAmount).toBe(6000);
  });

  it('should produce pretty-printed JSON', () => {
    const records: ExportRecord[] = [{
      invoiceNumber: 'AC-1', date: '2025-11-15', client: 'acme', month: 'Nov',
      quantity: 40, rate: 150, totalAmount: 6000, currency: 'USD', pdfPath: '/a.pdf'
    }];

    const result = formatAsJson(records);
    expect(result).toContain('\n'); // Should have newlines (pretty-printed)
  });
});

describe('formatRecords', () => {
  const records: ExportRecord[] = [{
    invoiceNumber: 'AC-1', date: '2025-11-15', client: 'acme', month: 'Nov',
    quantity: 40, rate: 150, totalAmount: 6000, currency: 'USD', pdfPath: '/a.pdf'
  }];

  it('should format as CSV by default', () => {
    const result = formatRecords(records, 'csv');
    expect(result).toContain('Invoice Number');
    expect(result).toContain('"AC-1"');
  });

  it('should format as JSON when specified', () => {
    const result = formatRecords(records, 'json');
    const parsed = JSON.parse(result);
    expect(parsed[0].invoiceNumber).toBe('AC-1');
  });
});

describe('scanDirectoryForHistory', () => {
  const testDir = '/tmp/invoicr-export-test';

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should return empty array for non-existent directory', () => {
    const result = scanDirectoryForHistory('/non/existent/path');
    expect(result).toEqual([]);
  });

  it('should return empty array when no history files', () => {
    fs.mkdirSync(path.join(testDir, 'clients', 'acme'), { recursive: true });
    const result = scanDirectoryForHistory(testDir, 'clients');
    expect(result).toEqual([]);
  });

  it('should find history files in client directories', () => {
    fs.mkdirSync(path.join(testDir, 'clients', 'acme'), { recursive: true });
    fs.writeFileSync(
      path.join(testDir, 'clients', 'acme', 'history.json'),
      JSON.stringify({
        invoices: [{
          invoiceNumber: 'AC-1',
          date: '2025-11-15',
          month: 'November 2025',
          quantity: 40,
          rate: 150,
          totalAmount: 6000,
          currency: 'USD',
          pdfPath: '/path/invoice.pdf'
        }]
      })
    );

    const result = scanDirectoryForHistory(testDir, 'clients');
    expect(result.length).toBe(1);
    expect(result[0].invoiceNumber).toBe('AC-1');
    expect(result[0].client).toBe('acme');
  });

  it('should filter by client name', () => {
    fs.mkdirSync(path.join(testDir, 'clients', 'acme'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'clients', 'other'), { recursive: true });

    const historyData = JSON.stringify({
      invoices: [{ invoiceNumber: 'X-1', date: '2025-11-15', month: 'Nov',
        quantity: 1, rate: 100, totalAmount: 100, currency: 'USD', pdfPath: '/x.pdf' }]
    });

    fs.writeFileSync(path.join(testDir, 'clients', 'acme', 'history.json'), historyData);
    fs.writeFileSync(path.join(testDir, 'clients', 'other', 'history.json'), historyData);

    const result = scanDirectoryForHistory(testDir, 'clients', 'acme');
    expect(result.length).toBe(1);
    expect(result[0].client).toBe('acme');
  });
});

describe('collectAllRecords', () => {
  const testDir = '/tmp/invoicr-collect-test';
  const installDir = '/tmp/invoicr-collect-install';

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(installDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.rmSync(installDir, { recursive: true, force: true });
  });

  it('should return empty array when no history', () => {
    const result = collectAllRecords(testDir, installDir);
    expect(result).toEqual([]);
  });

  it('should collect from multiple directories', () => {
    fs.mkdirSync(path.join(testDir, 'clients', 'client1'), { recursive: true });
    fs.mkdirSync(path.join(installDir, 'examples', 'example1'), { recursive: true });

    fs.writeFileSync(
      path.join(testDir, 'clients', 'client1', 'history.json'),
      JSON.stringify({
        invoices: [{ invoiceNumber: 'C1-1', date: '2025-11-15', month: 'Nov',
          quantity: 1, rate: 100, totalAmount: 100, currency: 'USD', pdfPath: '/a.pdf' }]
      })
    );

    fs.writeFileSync(
      path.join(installDir, 'examples', 'example1', 'history.json'),
      JSON.stringify({
        invoices: [{ invoiceNumber: 'E1-1', date: '2025-10-15', month: 'Oct',
          quantity: 1, rate: 100, totalAmount: 100, currency: 'USD', pdfPath: '/b.pdf' }]
      })
    );

    const result = collectAllRecords(testDir, installDir);
    expect(result.length).toBe(2);
  });

  it('should sort by date (newest first)', () => {
    fs.mkdirSync(path.join(testDir, 'clients', 'client1'), { recursive: true });
    fs.writeFileSync(
      path.join(testDir, 'clients', 'client1', 'history.json'),
      JSON.stringify({
        invoices: [
          { invoiceNumber: 'OLD', date: '2025-01-15', month: 'Jan',
            quantity: 1, rate: 100, totalAmount: 100, currency: 'USD', pdfPath: '/a.pdf' },
          { invoiceNumber: 'NEW', date: '2025-12-15', month: 'Dec',
            quantity: 1, rate: 100, totalAmount: 100, currency: 'USD', pdfPath: '/b.pdf' }
        ]
      })
    );

    const result = collectAllRecords(testDir, installDir);
    expect(result[0].invoiceNumber).toBe('NEW');
    expect(result[1].invoiceNumber).toBe('OLD');
  });
});

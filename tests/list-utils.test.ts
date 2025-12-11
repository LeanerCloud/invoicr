import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  findClients,
  formatRate,
  formatTableRow,
  buildClientListOutput,
  ClientInfo
} from '../src/commands/list-utils.js';

describe('formatRate', () => {
  it('should format USD rate', () => {
    expect(formatRate(100, 'USD')).toBe('$100');
  });

  it('should format EUR rate', () => {
    expect(formatRate(100, 'EUR')).toBe('100€');
  });

  it('should default to EUR format for unknown currency', () => {
    expect(formatRate(100, 'GBP')).toBe('100€');
  });
});

describe('formatTableRow', () => {
  it('should pad columns to specified widths', () => {
    const result = formatTableRow(['a', 'bb', 'ccc'], [5, 5, 5]);
    expect(result).toBe('a      bb     ccc  ');
  });

  it('should handle empty columns', () => {
    const result = formatTableRow(['', 'test'], [3, 6]);
    expect(result).toBe('     test  ');
  });
});

describe('findClients', () => {
  const testDir = '/tmp/invoicr-list-test';

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should return empty array when no clients exist', () => {
    const result = findClients(testDir);
    expect(result).toEqual([]);
  });

  it('should find clients in clients/ directory', () => {
    fs.mkdirSync(path.join(testDir, 'clients', 'acme'), { recursive: true });
    fs.writeFileSync(
      path.join(testDir, 'clients', 'acme', 'acme.json'),
      JSON.stringify({
        name: 'Acme Corp',
        invoicePrefix: 'AC',
        nextInvoiceNumber: 5,
        language: 'en',
        service: { billingType: 'hourly', rate: 150, currency: 'USD' }
      })
    );

    const result = findClients(testDir);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Acme Corp');
    expect(result[0].invoicePrefix).toBe('AC');
    expect(result[0].nextInvoiceNumber).toBe(5);
    expect(result[0].billingType).toBe('hourly');
    expect(result[0].rate).toBe(150);
    expect(result[0].currency).toBe('USD');
  });

  it('should find legacy clients in root directory', () => {
    fs.mkdirSync(path.join(testDir, 'old-client'), { recursive: true });
    fs.writeFileSync(
      path.join(testDir, 'old-client', 'old-client.json'),
      JSON.stringify({
        name: 'Old Client',
        invoicePrefix: 'OC',
        nextInvoiceNumber: 1,
        language: 'de',
        service: { billingType: 'daily', dailyRate: 1200, currency: 'EUR' }
      })
    );

    const result = findClients(testDir);
    expect(result.length).toBe(1);
    expect(result[0].folder).toContain('legacy');
    expect(result[0].rate).toBe(1200);
  });

  it('should skip invalid JSON files', () => {
    fs.mkdirSync(path.join(testDir, 'clients', 'bad'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'clients', 'bad', 'bad.json'), 'not json');

    const result = findClients(testDir);
    expect(result).toEqual([]);
  });

  it('should skip special directories', () => {
    fs.mkdirSync(path.join(testDir, 'node_modules', 'fake'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'dist', 'fake'), { recursive: true });
    fs.mkdirSync(path.join(testDir, '.hidden', 'fake'), { recursive: true });

    const result = findClients(testDir);
    expect(result).toEqual([]);
  });

  it('should not duplicate clients found in both locations', () => {
    // Create same client in both clients/ and root
    fs.mkdirSync(path.join(testDir, 'clients', 'same'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'same'), { recursive: true });
    fs.writeFileSync(
      path.join(testDir, 'clients', 'same', 'same.json'),
      JSON.stringify({ name: 'Same', invoicePrefix: 'S', nextInvoiceNumber: 1, service: {} })
    );
    fs.writeFileSync(
      path.join(testDir, 'same', 'same.json'),
      JSON.stringify({ name: 'Same Legacy', invoicePrefix: 'SL', nextInvoiceNumber: 1, service: {} })
    );

    const result = findClients(testDir);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Same'); // Should prefer clients/ version
  });
});

describe('buildClientListOutput', () => {
  it('should return no clients message when empty', () => {
    const result = buildClientListOutput([]);
    expect(result).toContain('No clients found');
    expect(result).toContain('invoicr-new');
  });

  it('should build table output with clients', () => {
    const clients: ClientInfo[] = [
      {
        folder: 'acme',
        name: 'Acme Corp',
        invoicePrefix: 'AC',
        nextInvoiceNumber: 5,
        billingType: 'hourly',
        rate: 150,
        currency: 'USD',
        language: 'en'
      },
      {
        folder: 'test',
        name: 'Test Company',
        invoicePrefix: 'TC',
        nextInvoiceNumber: 1,
        billingType: 'daily',
        rate: 1200,
        currency: 'EUR',
        language: 'de'
      }
    ];

    const result = buildClientListOutput(clients);

    expect(result).toContain('Available clients');
    expect(result).toContain('Folder');
    expect(result).toContain('Name');
    expect(result).toContain('Prefix');
    expect(result).toContain('Acme Corp');
    expect(result).toContain('Test Company');
    expect(result).toContain('$150');
    expect(result).toContain('1200€');
    expect(result).toContain('Total: 2 client(s)');
    expect(result).toContain('invoicr <folder> <quantity>');
  });

  it('should truncate long names', () => {
    const clients: ClientInfo[] = [{
      folder: 'very-long-folder-name-that-exceeds-limit',
      name: 'A Very Long Company Name That Should Be Truncated',
      invoicePrefix: 'VL',
      nextInvoiceNumber: 1,
      billingType: 'hourly',
      rate: 100,
      currency: 'USD',
      language: 'en'
    }];

    const result = buildClientListOutput(clients);
    // Names should be truncated
    expect(result).not.toContain('very-long-folder-name-that-exceeds-limit');
    expect(result).not.toContain('A Very Long Company Name That Should Be Truncated');
  });
});

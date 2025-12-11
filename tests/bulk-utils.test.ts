import { describe, it, expect } from 'vitest';
import {
  validateBulkConfig,
  buildInvoiceArgs,
  buildInvoiceCommand,
  formatProgress,
  buildSummaryOutput,
  BulkInvoice
} from '../src/commands/bulk-utils.js';

describe('validateBulkConfig', () => {
  it('should validate correct config', () => {
    const result = validateBulkConfig({
      invoices: [
        { client: 'acme', quantity: 40 },
        { client: 'other', quantity: 10, month: '11-2025', email: true }
      ]
    });

    expect('config' in result).toBe(true);
    if ('config' in result) {
      expect(result.config.invoices.length).toBe(2);
    }
  });

  it('should reject non-object config', () => {
    const result = validateBulkConfig(null);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors[0].message).toContain('JSON object');
    }
  });

  it('should reject config without invoices array', () => {
    const result = validateBulkConfig({ something: 'else' });
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors[0].message).toContain('invoices');
    }
  });

  it('should reject invoice without client', () => {
    const result = validateBulkConfig({
      invoices: [{ quantity: 40 }]
    });
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors[0].message).toContain('client');
    }
  });

  it('should reject invoice with invalid quantity', () => {
    const result = validateBulkConfig({
      invoices: [{ client: 'acme', quantity: 'abc' }]
    });
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors[0].message).toContain('quantity');
    }
  });

  it('should reject invoice with zero quantity', () => {
    const result = validateBulkConfig({
      invoices: [{ client: 'acme', quantity: 0 }]
    });
    expect('errors' in result).toBe(true);
  });

  it('should reject invoice with negative quantity', () => {
    const result = validateBulkConfig({
      invoices: [{ client: 'acme', quantity: -10 }]
    });
    expect('errors' in result).toBe(true);
  });

  it('should reject invalid month type', () => {
    const result = validateBulkConfig({
      invoices: [{ client: 'acme', quantity: 40, month: 123 }]
    });
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors[0].message).toContain('month');
    }
  });

  it('should reject invalid email type', () => {
    const result = validateBulkConfig({
      invoices: [{ client: 'acme', quantity: 40, email: 'yes' }]
    });
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors[0].message).toContain('email');
    }
  });

  it('should collect multiple errors', () => {
    const result = validateBulkConfig({
      invoices: [
        { client: '', quantity: -1 },
        { quantity: 0 }
      ]
    });
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });

  it('should reject non-object invoice entries', () => {
    const result = validateBulkConfig({
      invoices: ['not an object']
    });
    expect('errors' in result).toBe(true);
  });
});

describe('buildInvoiceArgs', () => {
  it('should build basic args', () => {
    const invoice: BulkInvoice = { client: 'acme', quantity: 40 };
    const result = buildInvoiceArgs(invoice, false);
    expect(result).toEqual(['acme', '40']);
  });

  it('should include month when specified', () => {
    const invoice: BulkInvoice = { client: 'acme', quantity: 40, month: '11-2025' };
    const result = buildInvoiceArgs(invoice, false);
    expect(result).toContain('--month=11-2025');
  });

  it('should include email flag when specified', () => {
    const invoice: BulkInvoice = { client: 'acme', quantity: 40, email: true };
    const result = buildInvoiceArgs(invoice, false);
    expect(result).toContain('--email');
  });

  it('should not include email flag when false', () => {
    const invoice: BulkInvoice = { client: 'acme', quantity: 40, email: false };
    const result = buildInvoiceArgs(invoice, false);
    expect(result).not.toContain('--email');
  });

  it('should include dry-run flag when specified', () => {
    const invoice: BulkInvoice = { client: 'acme', quantity: 40 };
    const result = buildInvoiceArgs(invoice, true);
    expect(result).toContain('--dry-run');
  });

  it('should include all options together', () => {
    const invoice: BulkInvoice = { client: 'acme', quantity: 40, month: '11-2025', email: true };
    const result = buildInvoiceArgs(invoice, true);
    expect(result).toEqual(['acme', '40', '--month=11-2025', '--email', '--dry-run']);
  });
});

describe('buildInvoiceCommand', () => {
  it('should build full command string', () => {
    const result = buildInvoiceCommand('/path/to/invoice.js', ['acme', '40']);
    expect(result).toBe('node "/path/to/invoice.js" acme 40');
  });

  it('should handle paths with spaces', () => {
    const result = buildInvoiceCommand('/path with spaces/invoice.js', ['acme', '40']);
    expect(result).toBe('node "/path with spaces/invoice.js" acme 40');
  });

  it('should join multiple args', () => {
    const result = buildInvoiceCommand('/invoice.js', ['acme', '40', '--email', '--dry-run']);
    expect(result).toBe('node "/invoice.js" acme 40 --email --dry-run');
  });
});

describe('formatProgress', () => {
  it('should format progress string', () => {
    const result = formatProgress(1, 5, 'acme', 40);
    expect(result).toBe('[1/5] acme (qty: 40)');
  });

  it('should handle large numbers', () => {
    const result = formatProgress(100, 1000, 'client', 50000);
    expect(result).toBe('[100/1000] client (qty: 50000)');
  });
});

describe('buildSummaryOutput', () => {
  it('should show success count', () => {
    const result = buildSummaryOutput(5, 0, false);
    expect(result).toContain('Bulk Generation Complete');
    expect(result).toContain('Success: 5');
    expect(result).not.toContain('Errors');
  });

  it('should show error count when present', () => {
    const result = buildSummaryOutput(3, 2, false);
    expect(result).toContain('Success: 3');
    expect(result).toContain('Errors:  2');
  });

  it('should show dry-run message when in dry-run mode', () => {
    const result = buildSummaryOutput(5, 0, true);
    expect(result).toContain('dry-run mode');
    expect(result).toContain('no files were generated');
  });

  it('should include all elements when both errors and dry-run', () => {
    const result = buildSummaryOutput(3, 2, true);
    expect(result).toContain('Success: 3');
    expect(result).toContain('Errors:  2');
    expect(result).toContain('dry-run mode');
  });
});

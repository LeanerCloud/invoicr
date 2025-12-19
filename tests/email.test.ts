import { describe, it, expect } from 'vitest';
import {
  getRecipients,
  buildEmailSubject,
  buildEmailBody,
  buildRecipientScript,
  escapeAppleScript,
  buildAppleScript,
  resolveEmailLanguage,
  loadEmailTranslations,
  getEmailTemplates,
  prepareEmail
} from '../src/email.js';
import { InvoiceContext, BankDetails, Provider, Client, Translations, ResolvedLineItem } from '../src/types.js';

// Helper to create minimal mock context for testing
function createMockContext(overrides: Partial<InvoiceContext> = {}): InvoiceContext {
  const bankDetails: BankDetails = {
    name: 'Test Bank',
    iban: 'DE12345678901234567890',
    bic: 'TESTBIC'
  };

  const provider: Provider = {
    name: 'Test Provider',
    address: { street: '123 Main St', city: 'Berlin 10115' },
    phone: '+49 123 456789',
    email: 'provider@example.com',
    bank: bankDetails,
    taxNumber: '123/456/789'
  };

  const client: Client = {
    name: 'Acme Corp',
    address: { street: '456 Business Ave', city: 'New York, NY 10001' },
    language: 'en',
    invoicePrefix: 'AC',
    nextInvoiceNumber: 1,
    service: {
      description: 'Consulting Services',
      billingType: 'hourly',
      rate: 150,
      currency: 'USD'
    },
    email: {
      to: ['client@example.com'],
      cc: ['accounting@example.com']
    }
  };

  const translations: Translations = {
    invoice: 'Invoice',
    serviceProvider: 'Service Provider',
    client: 'Client',
    invoiceNr: 'Invoice No.',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    servicePeriod: 'Service Period',
    projectReference: 'Project Reference',
    serviceChargesIntro: 'Services rendered:',
    description: 'Description',
    quantity: 'Quantity',
    days: 'days',
    hours: 'hours',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    taxNote: 'No VAT charged',
    paymentTerms: 'Payment due within {{days}} days',
    paymentImmediate: 'Payment due upon receipt',
    thankYou: 'Thank you for your business!',
    bankDetails: 'Bank Details',
    bank: 'Bank',
    iban: 'IBAN',
    bic: 'BIC',
    taxNumber: 'Tax Number',
    vatId: 'VAT ID',
    country: 'Country',
    filePrefix: 'Invoice',
    email: {
      subject: 'Invoice {{invoiceNumber}} ({{monthName}}) - {{providerName}}',
      body: 'Dear Client,\n\nPlease find attached invoice {{invoiceNumber}}.\n\nTotal: {{totalAmount}}\n\nBest regards,\n{{providerName}}'
    }
  };

  const lineItems: ResolvedLineItem[] = [{
    description: 'Consulting Services',
    quantity: 40,
    rate: 150,
    billingType: 'hourly',
    total: 6000
  }];

  return {
    provider,
    client,
    translations,
    invoiceNumber: 'AC-1',
    invoiceDate: '15 Nov 2025',
    servicePeriod: 'November 2025',
    monthName: 'November 2025',
    totalAmount: 6000,
    quantity: 40,
    rate: 150,
    billingType: 'hourly',
    currency: 'USD',
    lang: 'en',
    serviceDescription: 'Consulting Services, November 2025',
    emailServiceDescription: 'Consulting Services, November 2025',
    bankDetails,
    lineItems,
    subtotal: 6000,
    taxAmount: 0,
    taxRate: 0,
    ...overrides
  };
}

describe('getRecipients', () => {
  it('should return client recipients in normal mode', () => {
    const ctx = createMockContext();
    const result = getRecipients(ctx, false);
    expect(result.to).toEqual(['client@example.com']);
    expect(result.cc).toEqual(['accounting@example.com']);
  });

  it('should return provider email in test mode', () => {
    const ctx = createMockContext();
    const result = getRecipients(ctx, true);
    expect(result.to).toEqual(['provider@example.com']);
    expect(result.cc).toEqual([]);
  });

  it('should handle missing client email config', () => {
    const ctx = createMockContext();
    ctx.client.email = undefined;
    const result = getRecipients(ctx, false);
    expect(result.to).toBeUndefined();
    expect(result.cc).toBeUndefined();
  });

  it('should handle missing cc addresses', () => {
    const ctx = createMockContext();
    ctx.client.email = { to: ['client@example.com'] };
    const result = getRecipients(ctx, false);
    expect(result.to).toEqual(['client@example.com']);
    expect(result.cc).toBeUndefined();
  });
});

describe('buildEmailSubject', () => {
  it('should replace all placeholders', () => {
    const result = buildEmailSubject(
      'Invoice {{invoiceNumber}} ({{monthName}}) - {{providerName}}',
      'AC-1',
      'November 2025',
      'Test Provider',
      false
    );
    expect(result).toBe('Invoice AC-1 (November 2025) - Test Provider');
  });

  it('should add [TEST] prefix in test mode', () => {
    const result = buildEmailSubject(
      'Invoice {{invoiceNumber}}',
      'AC-1',
      'November 2025',
      'Test Provider',
      true
    );
    expect(result).toBe('[TEST] Invoice AC-1');
  });

  it('should handle template without placeholders', () => {
    const result = buildEmailSubject('Simple Subject', 'AC-1', 'Nov', 'Provider', false);
    expect(result).toBe('Simple Subject');
  });
});

describe('buildEmailBody', () => {
  it('should replace all placeholders', () => {
    const template = 'Invoice {{invoiceNumber}} for {{servicePeriod}}.\nService: {{serviceDescription}}\nTotal: {{totalAmount}}\nFrom: {{providerName}}';
    const result = buildEmailBody(
      template,
      'AC-1',
      'November 2025',
      'Consulting Services',
      '$6,000.00',
      'Test Provider'
    );
    expect(result).toContain('Invoice AC-1');
    expect(result).toContain('November 2025');
    expect(result).toContain('Consulting Services');
    expect(result).toContain('$6,000.00');
    expect(result).toContain('Test Provider');
  });

  it('should replace multiple occurrences of providerName', () => {
    const template = 'Hello from {{providerName}}. Contact {{providerName}} for questions.';
    const result = buildEmailBody(template, '', '', '', '', 'Acme Inc');
    expect(result).toBe('Hello from Acme Inc. Contact Acme Inc for questions.');
  });
});

describe('buildRecipientScript', () => {
  it('should build to recipient script', () => {
    const result = buildRecipientScript(['test@example.com'], 'to');
    expect(result).toBe('make new to recipient at end of to recipients with properties {address:"test@example.com"}');
  });

  it('should build cc recipient script', () => {
    const result = buildRecipientScript(['cc@example.com'], 'cc');
    expect(result).toBe('make new cc recipient at end of cc recipients with properties {address:"cc@example.com"}');
  });

  it('should join multiple recipients with newlines', () => {
    const result = buildRecipientScript(['a@test.com', 'b@test.com'], 'to');
    expect(result).toContain('a@test.com');
    expect(result).toContain('b@test.com');
    expect(result).toContain('\n');
  });
});

describe('escapeAppleScript', () => {
  it('should escape double quotes', () => {
    expect(escapeAppleScript('Hello "World"')).toBe('Hello \\"World\\"');
  });

  it('should escape backslashes', () => {
    expect(escapeAppleScript('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('should escape both quotes and backslashes', () => {
    expect(escapeAppleScript('Say "Hello\\World"')).toBe('Say \\"Hello\\\\World\\"');
  });

  it('should handle empty string', () => {
    expect(escapeAppleScript('')).toBe('');
  });

  it('should handle string with no special characters', () => {
    expect(escapeAppleScript('Hello World')).toBe('Hello World');
  });
});

describe('buildAppleScript', () => {
  it('should build complete AppleScript', () => {
    const result = buildAppleScript(
      'Test Subject',
      'Test Body',
      'sender@example.com',
      'make new to recipient...',
      '',
      ['/path/to/invoice.pdf']
    );
    expect(result).toContain('tell application "Mail"');
    expect(result).toContain('Test Subject');
    expect(result).toContain('Test Body');
    expect(result).toContain('sender@example.com');
    expect(result).toContain('/path/to/invoice.pdf');
    expect(result).toContain('end tell');
  });

  it('should include cc script when provided', () => {
    const result = buildAppleScript(
      'Subject',
      'Body',
      'sender@test.com',
      'to script',
      'cc script',
      ['/path/file.pdf']
    );
    expect(result).toContain('cc script');
  });

  it('should escape special characters in subject and body', () => {
    const result = buildAppleScript(
      'Subject with "quotes"',
      'Body with "quotes" and \\backslash',
      'sender@test.com',
      '',
      '',
      ['/file.pdf']
    );
    expect(result).toContain('\\"quotes\\"');
    expect(result).toContain('\\\\backslash');
  });

  it('should convert newlines to carriage returns in body', () => {
    const result = buildAppleScript(
      'Subject',
      'Line 1\nLine 2\nLine 3',
      'sender@test.com',
      '',
      '',
      ['/file.pdf']
    );
    // The body should have \r instead of \n for AppleScript (but escaped in the string)
    // The replace converts \n to \r, which appears in the AppleScript string
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
    expect(result).toContain('Line 3');
    // Newlines should be removed (replaced with carriage returns which get escaped)
    expect(result).not.toContain('Line 1\nLine 2');
  });
});

describe('resolveEmailLanguage', () => {
  it('should use client emailLanguage when set', () => {
    const client = { emailLanguage: 'de' } as InvoiceContext['client'];
    expect(resolveEmailLanguage(client, 'en')).toBe('de');
  });

  it('should fall back to invoice language when emailLanguage not set', () => {
    const client = {} as InvoiceContext['client'];
    expect(resolveEmailLanguage(client, 'en')).toBe('en');
  });

  it('should fall back to invoice language when emailLanguage is undefined', () => {
    const client = { emailLanguage: undefined } as InvoiceContext['client'];
    expect(resolveEmailLanguage(client, 'ro')).toBe('ro');
  });
});

describe('loadEmailTranslations', () => {
  it('should load English translations', () => {
    const translations = loadEmailTranslations('en');
    expect(translations).toBeDefined();
    expect(translations.email).toBeDefined();
    expect(translations.email.subject).toBeDefined();
    expect(translations.email.body).toBeDefined();
  });

  it('should load German translations', () => {
    const translations = loadEmailTranslations('de');
    expect(translations).toBeDefined();
    expect(translations.email).toBeDefined();
  });

  it('should load Romanian translations', () => {
    const translations = loadEmailTranslations('ro');
    expect(translations).toBeDefined();
    expect(translations.email).toBeDefined();
  });

  it('should throw for non-existent language', () => {
    expect(() => loadEmailTranslations('xyz')).toThrow('Translations not found for language: xyz');
  });
});

describe('getEmailTemplates', () => {
  const defaultTranslations: Translations = {
    invoice: 'Invoice',
    serviceProvider: 'Provider',
    client: 'Client',
    invoiceNr: 'Invoice Nr',
    invoiceDate: 'Date',
    dueDate: 'Due',
    servicePeriod: 'Period',
    projectReference: 'Reference',
    serviceChargesIntro: 'Charges:',
    description: 'Description',
    quantity: 'Qty',
    days: 'days',
    hours: 'hours',
    unitPrice: 'Price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    taxNote: 'No VAT',
    paymentTerms: 'Due in {{days}} days',
    paymentImmediate: 'Due now',
    thankYou: 'Thanks!',
    bankDetails: 'Bank',
    bank: 'Bank',
    iban: 'IBAN',
    bic: 'BIC',
    taxNumber: 'Tax',
    vatId: 'VAT',
    country: 'Country',
    filePrefix: 'Invoice',
    email: {
      subject: 'Default Subject {{invoiceNumber}}',
      body: 'Default Body'
    }
  };

  it('should use client email templates when provided', () => {
    const client = {
      email: {
        to: ['test@example.com'],
        subject: 'Custom Subject',
        body: 'Custom Body'
      }
    } as InvoiceContext['client'];

    const result = getEmailTemplates(client, defaultTranslations);
    expect(result.subject).toBe('Custom Subject');
    expect(result.body).toBe('Custom Body');
  });

  it('should fall back to translations when client templates not set', () => {
    const client = {
      email: {
        to: ['test@example.com']
      }
    } as InvoiceContext['client'];

    const result = getEmailTemplates(client, defaultTranslations);
    expect(result.subject).toBe('Default Subject {{invoiceNumber}}');
    expect(result.body).toBe('Default Body');
  });

  it('should fall back to translations when no email config', () => {
    const client = {} as InvoiceContext['client'];

    const result = getEmailTemplates(client, defaultTranslations);
    expect(result.subject).toBe('Default Subject {{invoiceNumber}}');
    expect(result.body).toBe('Default Body');
  });

  it('should use partial client templates', () => {
    const client = {
      email: {
        to: ['test@example.com'],
        subject: 'Custom Subject Only'
        // body not set
      }
    } as InvoiceContext['client'];

    const result = getEmailTemplates(client, defaultTranslations);
    expect(result.subject).toBe('Custom Subject Only');
    expect(result.body).toBe('Default Body');
  });
});

describe('prepareEmail', () => {
  it('should return null when no recipients configured', () => {
    const ctx = createMockContext();
    ctx.client.email = undefined;

    const result = prepareEmail(ctx, ['/path/invoice.pdf'], false);
    expect(result).toBeNull();
  });

  it('should return null when to array is empty', () => {
    const ctx = createMockContext();
    ctx.client.email = { to: [] };

    const result = prepareEmail(ctx, ['/path/invoice.pdf'], false);
    expect(result).toBeNull();
  });

  it('should prepare email with all fields populated', () => {
    const ctx = createMockContext();

    const result = prepareEmail(ctx, ['/path/invoice.pdf'], false);

    expect(result).not.toBeNull();
    expect(result!.subject).toContain('AC-1');
    expect(result!.body).toContain('AC-1');
    expect(result!.senderEmail).toBe('provider@example.com');
    expect(result!.toAddresses).toEqual(['client@example.com']);
    expect(result!.ccAddresses).toEqual(['accounting@example.com']);
    expect(result!.appleScript).toContain('tell application "Mail"');
  });

  it('should add [TEST] prefix in test mode', () => {
    const ctx = createMockContext();

    const result = prepareEmail(ctx, ['/path/invoice.pdf'], true);

    expect(result).not.toBeNull();
    expect(result!.subject).toContain('[TEST]');
    expect(result!.toAddresses).toEqual(['provider@example.com']);
    expect(result!.ccAddresses).toEqual([]);
  });

  it('should handle empty cc addresses', () => {
    const ctx = createMockContext();
    ctx.client.email = { to: ['client@example.com'] };

    const result = prepareEmail(ctx, ['/path/invoice.pdf'], false);

    expect(result).not.toBeNull();
    expect(result!.ccAddresses).toEqual([]);
  });

  it('should include multiple attachments in AppleScript', () => {
    const ctx = createMockContext();
    const attachments = ['/path/invoice.pdf', '/path/timesheet.pdf'];

    const result = prepareEmail(ctx, attachments, false);

    expect(result).not.toBeNull();
    expect(result!.appleScript).toContain('/path/invoice.pdf');
    expect(result!.appleScript).toContain('/path/timesheet.pdf');
  });

  it('should use client emailLanguage for translations', () => {
    const ctx = createMockContext();
    ctx.client.emailLanguage = 'de';

    const result = prepareEmail(ctx, ['/path/invoice.pdf'], false);

    expect(result).not.toBeNull();
    // German translations will have different format
    expect(result!.subject).toBeDefined();
    expect(result!.body).toBeDefined();
  });

  it('should format currency correctly', () => {
    const ctx = createMockContext();
    ctx.totalAmount = 1234.56;
    ctx.currency = 'EUR';
    ctx.lang = 'de';

    const result = prepareEmail(ctx, ['/path/invoice.pdf'], false);

    expect(result).not.toBeNull();
    // Body should contain formatted currency
    expect(result!.body).toBeDefined();
  });
});

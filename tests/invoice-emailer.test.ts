import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the OS-specific email module so no AppleScript runs during tests.
const createEmail = vi.fn();
const createBatchEmail = vi.fn(() => true);

vi.mock('../src/email.js', () => ({
  createEmail: (...args: unknown[]) => createEmail(...args),
  createBatchEmail: (...args: unknown[]) => createBatchEmail(...args),
}));

import { sendInvoiceEmails } from '../src/lib/invoice-emailer.js';
import type { GeneratedInvoiceInfo } from '../src/lib/email-grouper.js';
import type { ClientInfo } from '../src/lib/config-manager.js';
import type { Client, Provider } from '../src/types.js';

const provider: Provider = {
  name: 'Test Provider',
  address: { street: '1 St', city: 'Berlin' },
  phone: '+49 000',
  email: 'provider@example.com',
  bank: { name: 'Bank', iban: 'DE00', bic: 'BIC' },
  taxNumber: '123',
};

function makeClient(name: string, to: string): Client {
  return {
    name,
    address: { street: '1 St', city: 'NY' },
    language: 'en',
    invoicePrefix: 'TC',
    nextInvoiceNumber: 1,
    service: { description: 'Consulting', billingType: 'fixed', rate: 1, currency: 'USD' },
    email: { to: [to], cc: [] },
  };
}

function makeClientInfo(folder: string, client: Client): ClientInfo {
  return {
    name: folder,
    directory: `/fake/clients/${folder}`,
    configPath: `/fake/clients/${folder}/customer_data.json`,
    client,
  };
}

function makeInvoice(folder: string, invoiceNumber: string): GeneratedInvoiceInfo {
  return {
    clientName: folder,
    clientDisplayName: folder,
    invoiceNumber,
    monthName: 'June 2026',
    totalAmount: 1000,
    currency: 'USD',
    pdfPath: `/fake/clients/${folder}/${invoiceNumber}.pdf`,
  };
}

beforeEach(() => {
  createEmail.mockClear();
  createBatchEmail.mockClear();
  createBatchEmail.mockReturnValue(true);
});

describe('sendInvoiceEmails', () => {
  it('combines invoices that share a recipient into one batch email', () => {
    const shared = 'shared@example.com';
    const clients = [
      makeClientInfo('a', makeClient('Client A', shared)),
      makeClientInfo('b', makeClient('Client B', shared)),
    ];
    const invoices = [makeInvoice('a', 'A-1'), makeInvoice('b', 'B-1')];

    const result = sendInvoiceEmails(invoices, provider, clients);

    expect(createBatchEmail).toHaveBeenCalledTimes(1);
    expect(createEmail).not.toHaveBeenCalled();
    // Batch email got both invoices
    expect(createBatchEmail.mock.calls[0][0]).toHaveLength(2);
    expect(result).toMatchObject({ emailSuccess: 1, emailError: 0 });
    expect(result.groups).toEqual([
      { email: shared, invoiceNumbers: ['A-1', 'B-1'], mode: 'batch', success: true },
    ]);
  });

  it('sends separate emails for clients with different recipients', () => {
    const clients = [
      makeClientInfo('a', makeClient('Client A', 'a@example.com')),
      makeClientInfo('b', makeClient('Client B', 'b@example.com')),
    ];
    const invoices = [makeInvoice('a', 'A-1'), makeInvoice('b', 'B-1')];

    const result = sendInvoiceEmails(invoices, provider, clients);

    expect(createBatchEmail).not.toHaveBeenCalled();
    expect(createEmail).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ emailSuccess: 2, emailError: 0 });
    expect(result.groups).toHaveLength(2);
    expect(result.groups.every(g => g.mode === 'single' && g.success)).toBe(true);
  });

  it('sends one email per invoice when noBatch is set, even with a shared recipient', () => {
    const shared = 'shared@example.com';
    const clients = [
      makeClientInfo('a', makeClient('Client A', shared)),
      makeClientInfo('b', makeClient('Client B', shared)),
    ];
    const invoices = [makeInvoice('a', 'A-1'), makeInvoice('b', 'B-1')];

    const result = sendInvoiceEmails(invoices, provider, clients, { noBatch: true });

    expect(createBatchEmail).not.toHaveBeenCalled();
    expect(createEmail).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ emailSuccess: 2, emailError: 0 });
    expect(result.groups.map(g => g.email)).toEqual([shared, shared]);
  });

  it('passes test mode through to the batch email', () => {
    const shared = 'shared@example.com';
    const clients = [
      makeClientInfo('a', makeClient('Client A', shared)),
      makeClientInfo('b', makeClient('Client B', shared)),
    ];
    const invoices = [makeInvoice('a', 'A-1'), makeInvoice('b', 'B-1')];

    sendInvoiceEmails(invoices, provider, clients, { isTestMode: true });

    expect(createBatchEmail.mock.calls[0][2]).toBe(true);
  });

  it('counts a failed batch email as an error', () => {
    createBatchEmail.mockReturnValue(false);
    const shared = 'shared@example.com';
    const clients = [
      makeClientInfo('a', makeClient('Client A', shared)),
      makeClientInfo('b', makeClient('Client B', shared)),
    ];
    const invoices = [makeInvoice('a', 'A-1'), makeInvoice('b', 'B-1')];

    const result = sendInvoiceEmails(invoices, provider, clients);

    expect(result).toMatchObject({ emailSuccess: 0, emailError: 1 });
    expect(result.groups).toEqual([
      { email: shared, invoiceNumbers: ['A-1', 'B-1'], mode: 'batch', success: false },
    ]);
  });
});

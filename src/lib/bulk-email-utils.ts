/**
 * Bulk Email Utilities
 * Pure helpers for the `invoicr-bulk-email` command: parsing client/invoice
 * specs and normalizing month arguments to the format stored in history.
 */
import { getServicePeriod, parseMonthArg } from './invoice-builder.js';
import { InvoiceHistoryEntry } from './history-manager.js';

export interface ClientInvoiceSpec {
  client: string;
  /** Explicit invoice number (e.g. "SM-15"), if provided via `client:INVOICE`. */
  invoiceNumber?: string;
}

/**
 * Parse a `client` or `client:INVOICE` positional argument.
 * Invoice numbers never contain a colon, so the first colon is the separator.
 */
export function parseClientInvoiceSpec(arg: string): ClientInvoiceSpec {
  const idx = arg.indexOf(':');
  if (idx === -1) {
    return { client: arg };
  }
  const client = arg.slice(0, idx);
  const invoiceNumber = arg.slice(idx + 1).trim();
  return invoiceNumber ? { client, invoiceNumber } : { client };
}

/**
 * Normalize a `MM-YYYY` (or ISO `YYYY-MM`) month argument to the month name
 * stored in invoice history (e.g. "June 2026"). History always stores the
 * en-US long month/year regardless of client language.
 */
export function normalizeMonthName(monthArg: string): string {
  return getServicePeriod(parseMonthArg(monthArg), 'en').monthName;
}

export type InvoiceSelectionErrorReason =
  | 'no-history'
  | 'invoice-not-found'
  | 'month-not-found';

export interface InvoiceSelection {
  entry?: InvoiceHistoryEntry;
  error?: {
    reason: InvoiceSelectionErrorReason;
    /** Available invoice numbers (or months) to show the user on failure. */
    available: string[];
  };
}

/**
 * Select a single invoice from a client's history:
 *   - by explicit `invoiceNumber`, else
 *   - by `monthName` (most recent invoice for that month), else
 *   - the most recent invoice overall.
 * Returns a structured error (with the available options) when nothing matches.
 */
export function selectInvoice(
  invoices: InvoiceHistoryEntry[],
  opts: { invoiceNumber?: string; monthName?: string } = {}
): InvoiceSelection {
  if (invoices.length === 0) {
    return { error: { reason: 'no-history', available: [] } };
  }

  if (opts.invoiceNumber) {
    const entry = invoices.find(i => i.invoiceNumber === opts.invoiceNumber);
    if (!entry) {
      return {
        error: { reason: 'invoice-not-found', available: invoices.map(i => i.invoiceNumber) }
      };
    }
    return { entry };
  }

  if (opts.monthName) {
    const matches = invoices.filter(i => i.month === opts.monthName);
    if (matches.length === 0) {
      return {
        error: { reason: 'month-not-found', available: [...new Set(invoices.map(i => i.month))] }
      };
    }
    // Most recent invoice for that month
    return { entry: matches[matches.length - 1] };
  }

  return { entry: invoices[invoices.length - 1] };
}

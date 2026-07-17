/**
 * Invoice Emailer
 * Shared orchestration for emailing already-generated invoices: groups them by
 * recipient into batch emails (or sends individually with --no-batch-email).
 * Used by `invoicr-bulk --email`, `invoicr-bulk-email`, and the API server.
 */
import { Provider } from '../types.js';
import { ClientInfo } from './config-manager.js';
import { buildInvoiceContext } from './invoice-builder.js';
import { loadTranslations } from '../api/helpers/translations.js';
import { createEmail, createBatchEmail, BatchInvoiceInfo } from '../email.js';
import { GeneratedInvoiceInfo, groupInvoicesByEmail, getPrimaryEmail } from './email-grouper.js';

export interface SendInvoiceEmailsOptions {
  isTestMode?: boolean;
  /** Send one email per invoice instead of grouping by recipient. */
  noBatch?: boolean;
}

/** Outcome for one email draft (a single invoice or a grouped batch). */
export interface EmailGroupResult {
  email: string;
  invoiceNumbers: string[];
  mode: 'single' | 'batch';
  success: boolean;
}

export interface SendInvoiceEmailsResult {
  emailSuccess: number;
  emailError: number;
  /** Per-draft results, in send order. */
  groups: EmailGroupResult[];
}

/**
 * Create a single-invoice email draft. `createEmail` never throws (it logs its
 * own AppleScript failures), so a completed call is treated as success —
 * matching the existing bulk behavior.
 */
function sendSingle(
  invoice: GeneratedInvoiceInfo,
  clientInfo: ClientInfo,
  provider: Provider,
  isTestMode: boolean
): void {
  const translations = loadTranslations(clientInfo.client.language);
  const context = buildInvoiceContext(provider, clientInfo.client, translations, {
    quantity: 1,
    billingMonth: new Date(),
  });

  // Override with the actual invoice's recorded data
  context.invoiceNumber = invoice.invoiceNumber;
  context.monthName = invoice.monthName;
  context.totalAmount = invoice.totalAmount;

  const attachments = [invoice.pdfPath];
  if (invoice.eInvoicePath) {
    attachments.push(invoice.eInvoicePath);
  }

  createEmail(context, attachments, isTestMode);
}

/**
 * Email a set of already-generated invoices, grouped by recipient.
 *
 * @param invoices  Invoices to email (must reference existing PDF paths).
 * @param provider  Provider config (sender + test-mode recipient).
 * @param clients   Client info for every client referenced by `invoices`.
 */
export function sendInvoiceEmails(
  invoices: GeneratedInvoiceInfo[],
  provider: Provider,
  clients: ClientInfo[],
  options: SendInvoiceEmailsOptions = {}
): SendInvoiceEmailsResult {
  const { isTestMode = false, noBatch = false } = options;
  const clientMap = new Map(clients.map(c => [c.name, c]));

  const groups: EmailGroupResult[] = [];
  let emailSuccess = 0;
  let emailError = 0;

  const record = (result: EmailGroupResult): void => {
    groups.push(result);
    if (result.success) emailSuccess++;
    else emailError++;
  };

  // Send a single-invoice draft, logging + recording its outcome.
  const handleSingle = (invoice: GeneratedInvoiceInfo, email: string, label: string): void => {
    const clientInfo = clientMap.get(invoice.clientName);
    if (!clientInfo) {
      console.error(`✗ Unknown client for invoice ${invoice.invoiceNumber}`);
      record({ email, invoiceNumbers: [invoice.invoiceNumber], mode: 'single', success: false });
      return;
    }
    let success = true;
    try {
      sendSingle(invoice, clientInfo, provider, isTestMode);
      console.log(`✓ Email draft created for ${label} (1 invoice)`);
    } catch {
      console.error(`✗ Failed to create email for ${label}`);
      success = false;
    }
    record({ email, invoiceNumbers: [invoice.invoiceNumber], mode: 'single', success });
  };

  // Individual mode: one email per invoice, no grouping.
  if (noBatch) {
    for (const invoice of invoices) {
      const clientInfo = clientMap.get(invoice.clientName);
      const email = clientInfo ? getPrimaryEmail(clientInfo.client) ?? invoice.clientName : invoice.clientName;
      handleSingle(invoice, email, invoice.clientDisplayName || invoice.clientName);
    }
    return { emailSuccess, emailError, groups };
  }

  // Batch mode: group by recipient; single-invoice groups still use a plain email.
  const grouped = groupInvoicesByEmail(invoices, clients);

  for (const [email, groupInvoices] of grouped) {
    if (groupInvoices.length === 1) {
      handleSingle(groupInvoices[0], email, email);
      continue;
    }

    const batchInfos: BatchInvoiceInfo[] = [];
    for (const invoice of groupInvoices) {
      const clientInfo = clientMap.get(invoice.clientName);
      if (!clientInfo) continue;
      batchInfos.push({
        client: clientInfo.client,
        invoiceNumber: invoice.invoiceNumber,
        monthName: invoice.monthName,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        pdfPath: invoice.pdfPath,
        eInvoicePath: invoice.eInvoicePath,
      });
    }

    let success = false;
    try {
      success = createBatchEmail(batchInfos, provider, isTestMode);
    } catch {
      success = false;
    }
    if (success) {
      console.log(`✓ Batch email draft created for ${email} (${batchInfos.length} invoices)`);
    } else {
      console.error(`✗ Failed to create batch email for ${email}`);
    }
    record({ email, invoiceNumbers: batchInfos.map(b => b.invoiceNumber), mode: 'batch', success });
  }

  return { emailSuccess, emailError, groups };
}

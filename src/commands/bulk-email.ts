#!/usr/bin/env node
/**
 * CLI command to bulk-send already-generated invoices.
 * Selects existing invoices from history (by number, month, or most recent) and
 * emails them, grouping by recipient into batch emails like `invoicr-bulk --email`
 * — without regenerating anything.
 *
 * Usage: invoicr-bulk-email <client[:invoice]> [client[:invoice]...] [options]
 */
import {
  getDefaultPaths,
  getClientInfo,
  loadProvider,
  loadHistory,
  findInvoiceAttachments,
  sendInvoiceEmails,
  parseClientInvoiceSpec,
  normalizeMonthName,
  selectInvoice,
  groupInvoicesByEmail,
  type ClientInfo,
  type GeneratedInvoiceInfo,
  type Provider
} from '../lib/index.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  printHelp();
  process.exit(args.length === 0 ? 1 : 0);
}

const isTestMode = args.includes('--test');
const noBatch = args.includes('--no-batch-email');
const isDryRun = args.includes('--dry-run');

const monthFlag = args.find(a => a.startsWith('--month='));
const monthArg = monthFlag ? monthFlag.split('=')[1] : undefined;
const monthName = monthArg ? normalizeMonthName(monthArg) : undefined;

const specs = args.filter(a => !a.startsWith('--')).map(parseClientInvoiceSpec);

if (specs.length === 0) {
  console.error('Error: no clients specified.');
  printHelp();
  process.exit(1);
}

const paths = getDefaultPaths();

let provider: Provider;
try {
  provider = loadProvider(paths.provider);
} catch (err) {
  console.error(err instanceof Error ? err.message : 'Failed to load provider.json');
  process.exit(1);
}

const clientInfos = new Map<string, ClientInfo>();
const invoices: GeneratedInvoiceInfo[] = [];
let hadError = false;

for (const spec of specs) {
  const clientInfo = getClientInfo(paths.clients, spec.client);
  if (!clientInfo) {
    console.error(`✗ ${spec.client}: client not found`);
    hadError = true;
    continue;
  }

  if (!clientInfo.client.email?.to?.length) {
    console.error(`✗ ${spec.client}: no email recipients configured`);
    hadError = true;
    continue;
  }

  const history = loadHistory(clientInfo.directory);
  const selection = selectInvoice(history.invoices, {
    invoiceNumber: spec.invoiceNumber,
    monthName
  });

  if (selection.error || !selection.entry) {
    reportSelectionError(spec.client, selection);
    hadError = true;
    continue;
  }

  const entry = selection.entry;
  const { pdfPath, eInvoicePath } = findInvoiceAttachments(
    clientInfo.directory,
    entry.invoiceNumber,
    entry.pdfPath
  );

  if (!pdfPath) {
    console.error(`✗ ${spec.client}: PDF not found for invoice ${entry.invoiceNumber}`);
    hadError = true;
    continue;
  }

  clientInfos.set(spec.client, clientInfo);
  invoices.push({
    clientName: spec.client,
    clientDisplayName: clientInfo.client.name,
    invoiceNumber: entry.invoiceNumber,
    monthName: entry.month,
    totalAmount: entry.totalAmount,
    currency: entry.currency,
    pdfPath,
    eInvoicePath
  });
}

if (invoices.length === 0) {
  console.error('\nNo invoices to send.');
  process.exit(1);
}

// Show the plan (which invoices land in which email)
console.log(`\n${isDryRun ? 'Would send' : 'Sending'} ${invoices.length} invoice(s)${noBatch ? '' : ', grouped by recipient'}:`);
printPlan(invoices, clientInfos);

if (isDryRun) {
  console.log('\n(dry run - no email drafts created)');
  process.exit(hadError ? 1 : 0);
}

console.log('');
const { emailSuccess, emailError } = sendInvoiceEmails(
  invoices,
  provider,
  [...clientInfos.values()],
  { isTestMode, noBatch }
);

console.log(`\nEmail summary: ${emailSuccess} sent, ${emailError} failed`);
if (isTestMode) {
  console.log('(test mode - emails sent to provider)');
}

process.exit(hadError || emailError > 0 ? 1 : 0);

function reportSelectionError(
  client: string,
  selection: { error?: { reason: string; available: string[] } }
): void {
  const err = selection.error;
  if (!err) {
    console.error(`✗ ${client}: no invoice found`);
    return;
  }
  if (err.reason === 'no-history') {
    console.error(`✗ ${client}: no invoice history found`);
  } else if (err.reason === 'invoice-not-found') {
    console.error(`✗ ${client}: invoice not found. Available: ${err.available.join(', ')}`);
  } else if (err.reason === 'month-not-found') {
    console.error(`✗ ${client}: no invoice for ${monthName}. Available months: ${err.available.join(', ')}`);
  }
}

function printPlan(
  invoiceList: GeneratedInvoiceInfo[],
  infos: Map<string, ClientInfo>
): void {
  if (noBatch) {
    for (const inv of invoiceList) {
      const to = infos.get(inv.clientName)?.client.email?.to?.join(', ') || '?';
      console.log(`  ${inv.invoiceNumber} (${inv.currency} ${inv.totalAmount}, ${inv.monthName}) -> ${to}`);
    }
    return;
  }

  // Preview the same grouping the sender will use.
  const groups = groupInvoicesByEmail(invoiceList, [...infos.values()]);
  for (const [email, list] of groups) {
    console.log(`  ${email}:`);
    for (const inv of list) {
      console.log(`    - ${inv.invoiceNumber} (${inv.currency} ${inv.totalAmount}, ${inv.monthName})`);
    }
  }
}

function printHelp(): void {
  console.log('invoicr-bulk-email - Email already-generated invoices in bulk\n');
  console.log('Usage: invoicr-bulk-email <client[:invoice]> [client[:invoice]...] [options]\n');
  console.log('Selects existing invoices from history and emails them, grouping invoices');
  console.log('for clients that share a recipient into a single batch email (like');
  console.log('invoicr-bulk --email) - without regenerating anything.\n');
  console.log('Invoice selection per client:');
  console.log('  client:INVOICE   Email that specific invoice (e.g. shiftmarkets:SM-15)');
  console.log('  client           Email the invoice for --month if given, else the most recent\n');
  console.log('Options:');
  console.log('  --month=MM-YYYY     Select each bare client\'s invoice for this billing month');
  console.log('  --no-batch-email    Send one email per invoice instead of grouping by recipient');
  console.log('  --test              Send to the provider email (test mode)');
  console.log('  --dry-run           Show what would be emailed without creating drafts');
  console.log('  --help, -h          Show this help message\n');
  console.log('Examples:');
  console.log('  invoicr-bulk-email shiftmarkets:SM-15 shift-cxm:CXM-7');
  console.log('  invoicr-bulk-email shiftmarkets shift-cxm --month=06-2026');
  console.log('  invoicr-bulk-email archera --dry-run');
}

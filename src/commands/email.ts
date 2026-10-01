#!/usr/bin/env node
/**
 * CLI command to email an existing invoice
 * Usage: invoicr-email <client-folder> [invoice-number] [--test]
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { validateProvider, validateClient } from '../schemas/index.js';
import { buildInvoiceContext, getDefaultBillingMonth } from '../lib/invoice-builder.js';
import { createEmail } from '../email.js';
import { loadTranslations } from '../api/helpers/translations.js';
import { Provider, Client } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const isTestMode = args.includes('--test');
const positionalArgs = args.filter(a => !a.startsWith('--'));

if (positionalArgs.length < 1) {
  printHelp();
  process.exit(1);
}

const clientFolder = positionalArgs[0];
const requestedInvoiceNumber = positionalArgs[1];

// Load configuration files
const cwd = process.cwd();
const installDir = path.join(__dirname, '..', '..');

const cwdProviderPath = path.join(cwd, 'provider.json');
const installProviderPath = path.join(installDir, 'provider.json');
const providerPath = fs.existsSync(cwdProviderPath) ? cwdProviderPath : installProviderPath;

const cwdNewPath = path.join(cwd, 'clients', clientFolder, 'customer_data.json');
const cwdClientsPath = path.join(cwd, 'clients', clientFolder, `${clientFolder}.json`);
const cwdLegacyPath = path.join(cwd, clientFolder, `${clientFolder}.json`);
const installNewPath = path.join(installDir, 'clients', clientFolder, 'customer_data.json');
const installClientsPath = path.join(installDir, 'clients', clientFolder, `${clientFolder}.json`);
const installLegacyPath = path.join(installDir, clientFolder, `${clientFolder}.json`);

const clientPath = fs.existsSync(cwdNewPath) ? cwdNewPath :
                   fs.existsSync(cwdClientsPath) ? cwdClientsPath :
                   fs.existsSync(cwdLegacyPath) ? cwdLegacyPath :
                   fs.existsSync(installNewPath) ? installNewPath :
                   fs.existsSync(installClientsPath) ? installClientsPath :
                   fs.existsSync(installLegacyPath) ? installLegacyPath :
                   '';

if (!fs.existsSync(providerPath)) {
  console.error('Provider config not found. Run invoicr-init first.');
  process.exit(1);
}
if (!clientPath || !fs.existsSync(clientPath)) {
  console.error(`Client config not found: ${clientFolder}`);
  process.exit(1);
}

// Load and validate
let provider: Provider;
let client: Client;

try {
  provider = validateProvider(JSON.parse(fs.readFileSync(providerPath, 'utf8')));
} catch (err) {
  console.error(err instanceof Error ? err.message : 'Failed to load provider.json');
  process.exit(1);
}

try {
  client = validateClient(JSON.parse(fs.readFileSync(clientPath, 'utf8')));
} catch (err) {
  console.error(err instanceof Error ? err.message : 'Failed to load client config');
  process.exit(1);
}

// Load invoice history
const outputDir = path.dirname(clientPath);
const historyPath = path.join(outputDir, 'history.json');

interface HistoryEntry {
  invoiceNumber: string;
  date: string;
  month: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  currency: string;
  pdfPath?: string;
}

let invoices: HistoryEntry[] = [];
if (fs.existsSync(historyPath)) {
  try {
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    invoices = history.invoices || [];
  } catch {
    // ignore
  }
}

if (invoices.length === 0) {
  console.error('No invoice history found. Generate an invoice first.');
  process.exit(1);
}

// Find the invoice to email
let invoice: HistoryEntry;
if (requestedInvoiceNumber) {
  const found = invoices.find(i => i.invoiceNumber === requestedInvoiceNumber);
  if (!found) {
    console.error(`Invoice ${requestedInvoiceNumber} not found in history.`);
    console.error('Available invoices:');
    invoices.forEach(i => console.error(`  ${i.invoiceNumber} - ${i.month}`));
    process.exit(1);
  }
  invoice = found;
} else {
  // Default to the most recent invoice
  invoice = invoices[invoices.length - 1];
  console.log(`Using most recent invoice: ${invoice.invoiceNumber} (${invoice.month})`);
}

// Find the PDF file
let pdfPath = invoice.pdfPath;
if (!pdfPath || !fs.existsSync(pdfPath)) {
  // Try to find PDF in the output directory
  const files = fs.readdirSync(outputDir).filter(f =>
    f.endsWith('.pdf') && f.includes(invoice.invoiceNumber)
  );
  if (files.length > 0) {
    pdfPath = path.join(outputDir, files[0]);
  } else {
    console.error(`PDF file not found for invoice ${invoice.invoiceNumber}`);
    process.exit(1);
  }
}

// Check for e-invoice XML
const eInvoiceFiles = fs.readdirSync(outputDir).filter(f =>
  f.endsWith('.xml') && f.includes(invoice.invoiceNumber)
);

const attachments = [pdfPath];
if (eInvoiceFiles.length > 0) {
  attachments.push(path.join(outputDir, eInvoiceFiles[0]));
}

// Build invoice context for email
const translations = loadTranslations(client.language);

let billingMonth: Date;
if (invoice.month) {
  const parsedDate = new Date(invoice.month + ' 1');
  billingMonth = !isNaN(parsedDate.getTime()) ? parsedDate : getDefaultBillingMonth();
} else {
  billingMonth = getDefaultBillingMonth();
}

const ctx = buildInvoiceContext(provider, client, translations, {
  quantity: invoice.quantity || 1,
  billingMonth
});

// Override with actual invoice data (the invoice may have been billed in a
// different currency than the client's current config, e.g. after a currency
// conversion was applied at generation time)
ctx.invoiceNumber = invoice.invoiceNumber;
ctx.monthName = invoice.month;
ctx.totalAmount = invoice.totalAmount;
ctx.quantity = invoice.quantity;
ctx.rate = invoice.rate;
ctx.currency = (invoice.currency as 'EUR' | 'USD') || ctx.currency;

// Show summary
console.log(`\nEmailing invoice ${invoice.invoiceNumber} (${invoice.month})`);
console.log(`  To:   ${client.email?.to?.join(', ') || 'N/A'}`);
if (client.email?.cc?.length) {
  console.log(`  CC:   ${client.email.cc.join(', ')}`);
}
console.log(`  PDF:  ${path.basename(pdfPath)}`);
if (eInvoiceFiles.length > 0) {
  console.log(`  XML:  ${eInvoiceFiles[0]}`);
}
if (isTestMode) {
  console.log(`  MODE: TEST (sending to ${provider.email})`);
}
console.log('');

// Send
createEmail(ctx, attachments, isTestMode);

function printHelp(): void {
  console.log('invoicr-email - Email an existing invoice via Mail.app\n');
  console.log('Usage: invoicr-email <client-folder> [invoice-number] [options]\n');
  console.log('Arguments:');
  console.log('  client-folder     Client directory name');
  console.log('  invoice-number    Invoice number (e.g., AR-1). Defaults to most recent.\n');
  console.log('Options:');
  console.log('  --test            Send to provider email instead of client (test mode)');
  console.log('  --help, -h        Show this help message\n');
  console.log('Examples:');
  console.log('  invoicr-email archera');
  console.log('  invoicr-email archera AR-1');
  console.log('  invoicr-email archera AR-1 --test');
}

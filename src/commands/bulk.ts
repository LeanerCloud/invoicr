#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  validateBulkConfig,
  buildInvoiceArgs,
  buildInvoiceCommand,
  formatProgress,
  buildSummaryOutput,
  parseCliArgs,
  BulkConfig
} from './bulk-utils.js';
import {
  getDefaultPaths,
  getClientInfo,
  loadProvider,
  getPrimaryEmail
} from '../lib/index.js';
import { createBatchEmail, createEmail, type BatchInvoiceInfo } from '../email.js';
import { buildInvoiceContext } from '../lib/invoice-builder.js';
import { loadTranslations } from '../api/helpers/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log('Usage: invoicr-bulk <config-file> [options]');
  console.log('       invoicr-bulk client1:qty1 client2:qty2 [...] [options]');
  console.log('');
  console.log('Generate multiple invoices from a config file or CLI arguments');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run           Preview all invoices without generating');
  console.log('  --month=MM-YYYY     Set billing month for all invoices (CLI mode)');
  console.log('  --email             Create email drafts for all invoices');
  console.log('  --no-batch-email    Send individual emails instead of grouping by recipient');
  console.log('  --test              Send test emails to provider instead of client');
  console.log('  --help, -h          Show this help message');
  console.log('');
  console.log('Email grouping:');
  console.log('  When using --email, invoices for clients with the same email address');
  console.log('  are automatically combined into a single email with multiple attachments.');
  console.log('  Use --no-batch-email to send individual emails for each invoice.');
  console.log('');
  console.log('CLI mode examples:');
  console.log('  invoicr-bulk acme:40 other:10');
  console.log('  invoicr-bulk acme:40 other:10 --month=11-2025 --email');
  console.log('  invoicr-bulk acme:40 --dry-run');
  console.log('');
  console.log('Config file mode examples:');
  console.log('  invoicr-bulk monthly-invoices.json');
  console.log('  invoicr-bulk batch.json --dry-run');
  console.log('');
  console.log('Config file format (JSON):');
  console.log('  {');
  console.log('    "invoices": [');
  console.log('      { "client": "acme-hourly", "quantity": 40 },');
  console.log('      { "client": "acme-daily", "quantity": 5, "month": "10-2025" },');
  console.log('      { "client": "acme-fixed", "quantity": 15000, "email": true }');
  console.log('    ]');
  console.log('  }');
  process.exit(args.length === 0 ? 1 : 0);
}

// Determine mode: file or CLI args
const firstArg = args.find(a => !a.startsWith('--'));
const isFileMode = firstArg && (firstArg.endsWith('.json') || fs.existsSync(firstArg));

let config: BulkConfig;
let isDryRun: boolean;

// Check for batch email flags
const noBatchEmail = args.includes('--no-batch-email');
const isTestMode = args.includes('--test');

if (isFileMode) {
  // File mode
  const configFile = firstArg!;
  isDryRun = args.includes('--dry-run');

  const configPath = path.isAbsolute(configFile) ? configFile : path.join(process.cwd(), configFile);

  if (!fs.existsSync(configPath)) {
    console.error(`Error: config file not found: ${configPath}`);
    process.exit(1);
  }

  let configData: unknown;
  try {
    const rawData = fs.readFileSync(configPath, 'utf8');
    configData = JSON.parse(rawData);
  } catch (err) {
    console.error(`Error: failed to parse config file: ${err}`);
    process.exit(1);
  }

  const validationResult = validateBulkConfig(configData);
  if ('errors' in validationResult) {
    for (const error of validationResult.errors) {
      if (error.index >= 0) {
        console.error(`Error: invoice ${error.index + 1}: ${error.message}`);
      } else {
        console.error(`Error: ${error.message}`);
      }
    }
    process.exit(1);
  }

  config = validationResult.config;
} else {
  // CLI args mode
  const parseResult = parseCliArgs(args);
  if ('error' in parseResult) {
    console.error(`Error: ${parseResult.error}`);
    process.exit(1);
  }

  config = parseResult.config;
  isDryRun = parseResult.isDryRun;
}

// Check if any invoices need email
const hasEmailFlag = config.invoices.some(inv => inv.email);
const useBatchEmail = hasEmailFlag && !noBatchEmail && !isDryRun;

console.log(`Processing ${config.invoices.length} invoice(s)...`);
if (useBatchEmail) {
  console.log('(batch email mode - invoices will be grouped by recipient)');
}
console.log('');

// Get invoicr command path
const invoicrPath = path.join(__dirname, '..', 'invoice.js');

// Track generated invoices for batch email
interface GeneratedInvoice {
  clientName: string;
  pdfPath: string;
  eInvoicePath?: string;
  invoiceNumber: string;
  monthName: string;
  totalAmount: number;
  currency: string;
}
const generatedInvoices: GeneratedInvoice[] = [];

// Process each invoice
let successCount = 0;
let errorCount = 0;

for (let i = 0; i < config.invoices.length; i++) {
  const inv = config.invoices[i];

  console.log(formatProgress(i + 1, config.invoices.length, inv.client, inv.quantity));

  // Build command - suppress individual emails if batch mode enabled
  const invCopy = { ...inv };
  if (useBatchEmail && inv.email) {
    invCopy.email = false; // Don't send individual emails
  }

  const cmdArgs = buildInvoiceArgs(invCopy, isDryRun);
  const cmd = buildInvoiceCommand(invoicrPath, cmdArgs);

  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    successCount++;

    // Track generated invoice for batch email
    if (useBatchEmail && inv.email) {
      // Load client info to get paths
      const paths = getDefaultPaths();
      const clientInfo = getClientInfo(paths.clients, inv.client);

      if (clientInfo) {
        // Look up the invoice from history to get accurate data
        const historyPath = path.join(clientInfo.directory, 'history.json');
        if (fs.existsSync(historyPath)) {
          try {
            const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            const lastInvoice = history.invoices?.[history.invoices.length - 1];
            if (lastInvoice) {
              generatedInvoices.push({
                clientName: inv.client,
                pdfPath: lastInvoice.pdfPath,
                invoiceNumber: lastInvoice.invoiceNumber,
                monthName: lastInvoice.month,
                totalAmount: lastInvoice.totalAmount,
                currency: lastInvoice.currency || clientInfo.client.service.currency
              });
            }
          } catch {
            // History parsing failed, skip this invoice for batch email
            console.error(`  Warning: Could not load history for ${inv.client}`);
          }
        }
      }
    }

    console.log('');
  } catch {
    errorCount++;
    console.error(`  Error generating invoice for ${inv.client}`);
    console.log('');
  }
}

// Summary
console.log(buildSummaryOutput(successCount, errorCount, isDryRun));

// Send batch emails if enabled
if (useBatchEmail && generatedInvoices.length > 0) {
  console.log('\n=== Sending Batch Emails ===\n');

  const paths = getDefaultPaths();
  const provider = loadProvider(paths.provider);

  // Group invoices by email recipient
  const invoicesByEmail = new Map<string, GeneratedInvoice[]>();

  for (const invoice of generatedInvoices) {
    const clientInfo = getClientInfo(paths.clients, invoice.clientName);
    if (!clientInfo) continue;

    const email = getPrimaryEmail(clientInfo.client);
    if (!email) continue;

    const existing = invoicesByEmail.get(email) || [];
    existing.push(invoice);
    invoicesByEmail.set(email, existing);
  }

  // Send emails for each group
  let emailSuccess = 0;
  let emailError = 0;

  for (const [email, invoices] of invoicesByEmail) {
    if (invoices.length === 1) {
      // Single invoice - use regular email
      const invoice = invoices[0];
      const clientInfo = getClientInfo(paths.clients, invoice.clientName);
      if (!clientInfo) continue;

      const translations = loadTranslations(clientInfo.client.language);
      const context = buildInvoiceContext(provider, clientInfo.client, translations, {
        quantity: 1,
        billingMonth: new Date()
      });

      // Override with actual invoice data
      context.invoiceNumber = invoice.invoiceNumber;
      context.monthName = invoice.monthName;
      context.totalAmount = invoice.totalAmount;

      try {
        createEmail(context, [invoice.pdfPath], isTestMode);
        console.log(`✓ Email draft created for ${email} (1 invoice)`);
        emailSuccess++;
      } catch {
        console.error(`✗ Failed to create email for ${email}`);
        emailError++;
      }
    } else {
      // Multiple invoices - use batch email
      const batchInfos: BatchInvoiceInfo[] = [];

      for (const invoice of invoices) {
        const clientInfo = getClientInfo(paths.clients, invoice.clientName);
        if (!clientInfo) continue;

        batchInfos.push({
          client: clientInfo.client,
          invoiceNumber: invoice.invoiceNumber,
          monthName: invoice.monthName,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          pdfPath: invoice.pdfPath,
          eInvoicePath: invoice.eInvoicePath
        });
      }

      try {
        const success = createBatchEmail(batchInfos, provider, isTestMode);
        if (success) {
          console.log(`✓ Batch email draft created for ${email} (${invoices.length} invoices)`);
          emailSuccess++;
        } else {
          console.error(`✗ Failed to create batch email for ${email}`);
          emailError++;
        }
      } catch {
        console.error(`✗ Failed to create batch email for ${email}`);
        emailError++;
      }
    }
  }

  console.log(`\nEmail summary: ${emailSuccess} sent, ${emailError} failed`);
  if (isTestMode) {
    console.log('(test mode - emails sent to provider)');
  }
}

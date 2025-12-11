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
  buildSummaryOutput
} from './bulk-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log('Usage: invoicr-bulk <config-file> [options]');
  console.log('');
  console.log('Generate multiple invoices from a configuration file');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run         Preview all invoices without generating');
  console.log('  --help, -h        Show this help message');
  console.log('');
  console.log('Config file format (JSON):');
  console.log('  {');
  console.log('    "invoices": [');
  console.log('      { "client": "acme-hourly", "quantity": 40 },');
  console.log('      { "client": "acme-daily", "quantity": 5, "month": "10-2025" },');
  console.log('      { "client": "acme-fixed", "quantity": 15000, "email": true }');
  console.log('    ]');
  console.log('  }');
  console.log('');
  console.log('Each invoice entry can have:');
  console.log('  client    (required) Client folder name');
  console.log('  quantity  (required) Quantity/amount for invoice');
  console.log('  month     (optional) Billing month (MM-YYYY format)');
  console.log('  email     (optional) Create email draft (true/false)');
  console.log('');
  console.log('Examples:');
  console.log('  invoicr-bulk monthly-invoices.json');
  console.log('  invoicr-bulk batch.json --dry-run');
  process.exit(args.length === 0 ? 1 : 0);
}

// Get config file path
const configFile = args.find(a => !a.startsWith('--'));
const isDryRun = args.includes('--dry-run');

if (!configFile) {
  console.error('Error: config file is required');
  process.exit(1);
}

// Resolve config path
const configPath = path.isAbsolute(configFile) ? configFile : path.join(process.cwd(), configFile);

if (!fs.existsSync(configPath)) {
  console.error(`Error: config file not found: ${configPath}`);
  process.exit(1);
}

// Load and validate config
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

const config = validationResult.config;

console.log(`Processing ${config.invoices.length} invoice(s)...`);
console.log('');

// Get invoicr command path
const invoicrPath = path.join(__dirname, '..', 'invoice.js');

// Process each invoice
let successCount = 0;
let errorCount = 0;

for (let i = 0; i < config.invoices.length; i++) {
  const inv = config.invoices[i];

  console.log(formatProgress(i + 1, config.invoices.length, inv.client, inv.quantity));

  // Build command
  const cmdArgs = buildInvoiceArgs(inv, isDryRun);
  const cmd = buildInvoiceCommand(invoicrPath, cmdArgs);

  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    successCount++;
    console.log('');
  } catch {
    errorCount++;
    console.error(`  Error generating invoice for ${inv.client}`);
    console.log('');
  }
}

// Summary
console.log(buildSummaryOutput(successCount, errorCount, isDryRun));

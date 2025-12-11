#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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
interface BulkInvoice {
  client: string;
  quantity: number;
  month?: string;
  email?: boolean;
}

interface BulkConfig {
  invoices: BulkInvoice[];
}

let config: BulkConfig;
try {
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
} catch (err) {
  console.error(`Error: failed to parse config file: ${err}`);
  process.exit(1);
}

if (!config.invoices || !Array.isArray(config.invoices)) {
  console.error('Error: config file must contain an "invoices" array');
  process.exit(1);
}

// Validate each invoice entry
for (let i = 0; i < config.invoices.length; i++) {
  const inv = config.invoices[i];
  if (!inv.client) {
    console.error(`Error: invoice ${i + 1} is missing "client" field`);
    process.exit(1);
  }
  if (typeof inv.quantity !== 'number' || inv.quantity <= 0) {
    console.error(`Error: invoice ${i + 1} has invalid "quantity" (must be positive number)`);
    process.exit(1);
  }
}

console.log(`Processing ${config.invoices.length} invoice(s)...`);
console.log('');

// Get invoicr command path
const invoicrPath = path.join(__dirname, '..', 'invoice.js');

// Process each invoice
let successCount = 0;
let errorCount = 0;

for (let i = 0; i < config.invoices.length; i++) {
  const inv = config.invoices[i];

  console.log(`[${i + 1}/${config.invoices.length}] ${inv.client} (qty: ${inv.quantity})`);

  // Build command
  const cmdArgs: string[] = [inv.client, inv.quantity.toString()];

  if (inv.month) {
    cmdArgs.push(`--month=${inv.month}`);
  }
  if (inv.email) {
    cmdArgs.push('--email');
  }
  if (isDryRun) {
    cmdArgs.push('--dry-run');
  }

  const cmd = `node "${invoicrPath}" ${cmdArgs.join(' ')}`;

  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    successCount++;
    console.log('');
  } catch (err) {
    errorCount++;
    console.error(`  Error generating invoice for ${inv.client}`);
    console.log('');
  }
}

// Summary
console.log('=== Bulk Generation Complete ===');
console.log(`Success: ${successCount}`);
if (errorCount > 0) {
  console.log(`Errors:  ${errorCount}`);
}
if (isDryRun) {
  console.log('(dry-run mode - no files were generated)');
}

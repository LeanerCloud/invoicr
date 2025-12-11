#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { collectAllRecords, formatRecords } from './export-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: invoicr-export [options]');
  console.log('');
  console.log('Export invoice history to CSV or JSON format');
  console.log('');
  console.log('Options:');
  console.log('  --client=<name>   Export only invoices for specific client');
  console.log('  --format=csv|json Output format (default: csv)');
  console.log('  --output=<file>   Output file path (default: stdout)');
  console.log('  --help, -h        Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  invoicr-export                           # Export all to CSV (stdout)');
  console.log('  invoicr-export --format=json             # Export all to JSON');
  console.log('  invoicr-export --client=acme-hourly      # Export specific client');
  console.log('  invoicr-export --output=invoices.csv     # Export to file');
  process.exit(0);
}

// Parse options
const clientArg = args.find(a => a.startsWith('--client='));
const formatArg = args.find(a => a.startsWith('--format='));
const outputArg = args.find(a => a.startsWith('--output='));

const clientFilter = clientArg?.replace('--client=', '');
const format = (formatArg?.replace('--format=', '') || 'csv') as 'csv' | 'json';
const outputFile = outputArg?.replace('--output=', '');

if (format !== 'csv' && format !== 'json') {
  console.error('Error: format must be "csv" or "json"');
  process.exit(1);
}

// Find client directories
const cwd = process.cwd();
const installDir = path.join(__dirname, '..', '..');

// Collect all records
const allRecords = collectAllRecords(cwd, installDir, clientFilter);

if (allRecords.length === 0) {
  console.error('No invoice history found.');
  if (clientFilter) {
    console.error(`No invoices found for client: ${clientFilter}`);
  }
  console.error('Generate some invoices first, then export.');
  process.exit(1);
}

// Generate output
const output = formatRecords(allRecords, format);

// Write output
if (outputFile) {
  fs.writeFileSync(outputFile, output);
  console.log(`Exported ${allRecords.length} invoice(s) to ${outputFile}`);
} else {
  console.log(output);
}

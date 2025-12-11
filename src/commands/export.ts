#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { getHistory, InvoiceRecord } from '../history';

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
const format = formatArg?.replace('--format=', '') || 'csv';
const outputFile = outputArg?.replace('--output=', '');

if (format !== 'csv' && format !== 'json') {
  console.error('Error: format must be "csv" or "json"');
  process.exit(1);
}

// Find client directories
const cwd = process.cwd();
const installDir = path.join(__dirname, '..', '..');

interface ExportRecord extends InvoiceRecord {
  client: string;
}

const allRecords: ExportRecord[] = [];

function scanDirectory(baseDir: string, subDir: string = '') {
  const searchDir = subDir ? path.join(baseDir, subDir) : baseDir;

  if (!fs.existsSync(searchDir)) return;

  const entries = fs.readdirSync(searchDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const clientDir = path.join(searchDir, entry.name);
    const historyPath = path.join(clientDir, 'history.json');

    // Skip if no history file
    if (!fs.existsSync(historyPath)) continue;

    // Apply client filter if specified
    if (clientFilter && entry.name !== clientFilter) continue;

    const history = getHistory(clientDir);
    for (const record of history) {
      allRecords.push({
        ...record,
        client: entry.name
      });
    }
  }
}

// Scan for client directories
scanDirectory(cwd, 'clients');
scanDirectory(cwd);
scanDirectory(installDir, 'clients');
scanDirectory(installDir);
scanDirectory(installDir, 'examples');

// Sort by date (newest first)
allRecords.sort((a, b) => b.date.localeCompare(a.date));

if (allRecords.length === 0) {
  console.error('No invoice history found.');
  if (clientFilter) {
    console.error(`No invoices found for client: ${clientFilter}`);
  }
  console.error('Generate some invoices first, then export.');
  process.exit(1);
}

// Generate output
let output: string;

if (format === 'json') {
  output = JSON.stringify(allRecords, null, 2);
} else {
  // CSV format
  const headers = ['Invoice Number', 'Date', 'Client', 'Month', 'Quantity', 'Rate', 'Total Amount', 'Currency', 'PDF Path'];
  const rows = allRecords.map(r => [
    r.invoiceNumber,
    r.date,
    r.client,
    r.month,
    r.quantity.toString(),
    r.rate.toString(),
    r.totalAmount.toFixed(2),
    r.currency,
    r.pdfPath
  ]);

  output = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');
}

// Write output
if (outputFile) {
  fs.writeFileSync(outputFile, output);
  console.log(`Exported ${allRecords.length} invoice(s) to ${outputFile}`);
} else {
  console.log(output);
}

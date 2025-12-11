#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

const cwd = process.cwd();

interface ClientInfo {
  folder: string;
  name: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  billingType: string;
  rate: number;
  currency: string;
  language: string;
}

function findClients(): ClientInfo[] {
  const clients: ClientInfo[] = [];

  // Check clients/ directory first
  const clientsDir = path.join(cwd, 'clients');
  if (fs.existsSync(clientsDir)) {
    const folders = fs.readdirSync(clientsDir);
    for (const folder of folders) {
      const clientPath = path.join(clientsDir, folder, `${folder}.json`);
      if (fs.existsSync(clientPath)) {
        try {
          const client = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
          clients.push({
            folder,
            name: client.name || folder,
            invoicePrefix: client.invoicePrefix || '??',
            nextInvoiceNumber: client.nextInvoiceNumber || 1,
            billingType: client.service?.billingType || 'unknown',
            rate: client.service?.rate || client.service?.dailyRate || 0,
            currency: client.service?.currency || 'EUR',
            language: client.language || 'en'
          });
        } catch {
          // Skip invalid JSON files
        }
      }
    }
  }

  // Also check root directory for legacy client folders
  const rootEntries = fs.readdirSync(cwd);
  for (const folder of rootEntries) {
    if (folder === 'clients' || folder === 'node_modules' || folder === 'dist' || folder === 'examples' || folder.startsWith('.')) {
      continue;
    }
    const folderPath = path.join(cwd, folder);
    if (fs.statSync(folderPath).isDirectory()) {
      const clientPath = path.join(folderPath, `${folder}.json`);
      if (fs.existsSync(clientPath)) {
        // Don't add if already found in clients/
        if (clients.some(c => c.folder === folder)) {
          continue;
        }
        try {
          const client = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
          clients.push({
            folder: `${folder} (legacy)`,
            name: client.name || folder,
            invoicePrefix: client.invoicePrefix || '??',
            nextInvoiceNumber: client.nextInvoiceNumber || 1,
            billingType: client.service?.billingType || 'unknown',
            rate: client.service?.rate || client.service?.dailyRate || 0,
            currency: client.service?.currency || 'EUR',
            language: client.language || 'en'
          });
        } catch {
          // Skip invalid JSON files
        }
      }
    }
  }

  return clients;
}

function formatRate(rate: number, currency: string): string {
  if (currency === 'USD') {
    return `$${rate}`;
  }
  return `${rate}€`;
}

function main() {
  // Check if provider.json exists
  const providerPath = path.join(cwd, 'provider.json');
  if (!fs.existsSync(providerPath)) {
    console.log('No provider.json found in current directory.');
    console.log('Run "invoicr-init" to set up your invoicing workspace.');
    process.exit(1);
  }

  const clients = findClients();

  if (clients.length === 0) {
    console.log('No clients found.');
    console.log('\nTo create a client, run:');
    console.log('  invoicr-new');
    console.log('  # or: invoicr-new --from=acme-hourly  (to use an example template)');
    return;
  }

  console.log('Available clients:\n');

  // Table header
  const header = ['Folder', 'Name', 'Prefix', 'Next #', 'Type', 'Rate', 'Lang'];
  const colWidths = [20, 25, 8, 8, 8, 12, 6];

  const formatRow = (cols: string[]) => {
    return cols.map((col, i) => col.padEnd(colWidths[i])).join('  ');
  };

  console.log(formatRow(header));
  console.log('-'.repeat(colWidths.reduce((a, b) => a + b + 2, 0)));

  for (const client of clients) {
    console.log(formatRow([
      client.folder.slice(0, 18),
      client.name.slice(0, 23),
      client.invoicePrefix,
      String(client.nextInvoiceNumber),
      client.billingType,
      formatRate(client.rate, client.currency),
      client.language
    ]));
  }

  console.log(`\nTotal: ${clients.length} client(s)`);
  console.log('\nTo generate an invoice:');
  console.log('  invoicr <folder> <quantity>');
}

main();

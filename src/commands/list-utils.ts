import * as fs from 'fs';
import * as path from 'path';

export interface ClientInfo {
  folder: string;
  name: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  billingType: string;
  rate: number;
  currency: string;
  language: string;
}

/**
 * Find all client configurations in a directory
 */
export function findClients(cwd: string): ClientInfo[] {
  const clients: ClientInfo[] = [];

  // Check clients/ directory first
  const clientsDir = path.join(cwd, 'clients');
  if (fs.existsSync(clientsDir)) {
    const folders = fs.readdirSync(clientsDir);
    for (const folder of folders) {
      // Check for customer_data.json (new) or <folder>.json (legacy)
      const newClientPath = path.join(clientsDir, folder, 'customer_data.json');
      const legacyClientPath = path.join(clientsDir, folder, `${folder}.json`);
      const clientPath = fs.existsSync(newClientPath) ? newClientPath : legacyClientPath;
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
      // Check for customer_data.json (new) or <folder>.json (legacy)
      const newClientPath = path.join(folderPath, 'customer_data.json');
      const legacyClientPath = path.join(folderPath, `${folder}.json`);
      const clientPath = fs.existsSync(newClientPath) ? newClientPath : legacyClientPath;
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

/**
 * Format rate with currency symbol
 */
export function formatRate(rate: number, currency: string): string {
  if (currency === 'USD') {
    return `$${rate}`;
  }
  return `${rate}€`;
}

/**
 * Format a row of data for table display
 */
export function formatTableRow(cols: string[], colWidths: number[]): string {
  return cols.map((col, i) => col.padEnd(colWidths[i])).join('  ');
}

/**
 * Build table output for client list
 */
export function buildClientListOutput(clients: ClientInfo[]): string {
  if (clients.length === 0) {
    return 'No clients found.\n\nTo create a client, run:\n  invoicr-new\n  # or: invoicr-new --from=acme-hourly  (to use an example template)';
  }

  const lines: string[] = ['Available clients:', ''];

  // Table header
  const header = ['Folder', 'Name', 'Prefix', 'Next #', 'Type', 'Rate', 'Lang'];
  const colWidths = [20, 25, 8, 8, 8, 12, 6];

  lines.push(formatTableRow(header, colWidths));
  lines.push('-'.repeat(colWidths.reduce((a, b) => a + b + 2, 0)));

  for (const client of clients) {
    lines.push(formatTableRow([
      client.folder.slice(0, 18),
      client.name.slice(0, 23),
      client.invoicePrefix,
      String(client.nextInvoiceNumber),
      client.billingType,
      formatRate(client.rate, client.currency),
      client.language
    ], colWidths));
  }

  lines.push(`\nTotal: ${clients.length} client(s)`);
  lines.push('\nTo generate an invoice:');
  lines.push('  invoicr <folder> <quantity>');

  return lines.join('\n');
}

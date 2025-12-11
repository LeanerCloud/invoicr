import * as fs from 'fs';
import * as path from 'path';
import { getHistory, InvoiceRecord } from '../history.js';

export interface ExportRecord extends InvoiceRecord {
  client: string;
}

/**
 * Scan a directory for client history files
 */
export function scanDirectoryForHistory(
  baseDir: string,
  subDir: string = '',
  clientFilter?: string
): ExportRecord[] {
  const records: ExportRecord[] = [];
  const searchDir = subDir ? path.join(baseDir, subDir) : baseDir;

  if (!fs.existsSync(searchDir)) return records;

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
      records.push({
        ...record,
        client: entry.name
      });
    }
  }

  return records;
}

/**
 * Collect all invoice records from multiple directories
 */
export function collectAllRecords(
  cwd: string,
  installDir: string,
  clientFilter?: string
): ExportRecord[] {
  const allRecords: ExportRecord[] = [];

  // Scan for client directories
  allRecords.push(...scanDirectoryForHistory(cwd, 'clients', clientFilter));
  allRecords.push(...scanDirectoryForHistory(cwd, '', clientFilter));
  allRecords.push(...scanDirectoryForHistory(installDir, 'clients', clientFilter));
  allRecords.push(...scanDirectoryForHistory(installDir, '', clientFilter));
  allRecords.push(...scanDirectoryForHistory(installDir, 'examples', clientFilter));

  // Sort by date (newest first)
  allRecords.sort((a, b) => b.date.localeCompare(a.date));

  return allRecords;
}

/**
 * Escape a CSV cell value (handles quotes and commas)
 */
export function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Format records as CSV
 */
export function formatAsCsv(records: ExportRecord[]): string {
  const headers = ['Invoice Number', 'Date', 'Client', 'Month', 'Quantity', 'Rate', 'Total Amount', 'Currency', 'PDF Path'];
  const rows = records.map(r => [
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

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(','))
  ].join('\n');
}

/**
 * Format records as JSON
 */
export function formatAsJson(records: ExportRecord[]): string {
  return JSON.stringify(records, null, 2);
}

/**
 * Format records in the requested format
 */
export function formatRecords(records: ExportRecord[], format: 'csv' | 'json'): string {
  if (format === 'json') {
    return formatAsJson(records);
  }
  return formatAsCsv(records);
}

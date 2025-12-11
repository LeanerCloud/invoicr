import * as fs from 'fs';
import * as path from 'path';

export interface InvoiceRecord {
  invoiceNumber: string;
  date: string;
  month: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  currency: string;
  pdfPath: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    rate: number;
    billingType: string;
  }>;
}

export interface InvoiceHistory {
  invoices: InvoiceRecord[];
}

/**
 * Get the history file path for a client directory
 */
function getHistoryPath(clientDir: string): string {
  return path.join(clientDir, 'history.json');
}

/**
 * Load invoice history for a client
 */
export function getHistory(clientDir: string): InvoiceRecord[] {
  const historyPath = getHistoryPath(clientDir);
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf8')) as InvoiceHistory;
    return data.invoices || [];
  } catch {
    return [];
  }
}

/**
 * Save a new invoice record to history
 */
export function saveToHistory(clientDir: string, record: InvoiceRecord): void {
  const historyPath = getHistoryPath(clientDir);
  const history = getHistory(clientDir);

  // Append new record
  history.push(record);

  // Write back to file
  const data: InvoiceHistory = { invoices: history };
  fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));
}

/**
 * Get the last invoice record for a client (if any)
 */
export function getLastInvoice(clientDir: string): InvoiceRecord | undefined {
  const history = getHistory(clientDir);
  return history.length > 0 ? history[history.length - 1] : undefined;
}

/**
 * Get all invoices for a specific month
 */
export function getInvoicesForMonth(clientDir: string, month: string): InvoiceRecord[] {
  const history = getHistory(clientDir);
  return history.filter(inv => inv.month === month);
}

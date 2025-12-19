/**
 * History Manager
 * Manages invoice history for clients
 */
import * as fs from 'fs';
import * as path from 'path';

export interface InvoiceHistoryEntry {
  invoiceNumber: string;
  date: string;
  month: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  currency: string;
  pdfPath?: string;
}

export interface InvoiceHistory {
  invoices: InvoiceHistoryEntry[];
}

/**
 * Get the path to history.json for a client directory
 */
export function getHistoryPath(clientDir: string): string {
  return path.join(clientDir, 'history.json');
}

/**
 * Load invoice history for a client
 */
export function loadHistory(clientDir: string): InvoiceHistory {
  const historyPath = getHistoryPath(clientDir);

  if (!fs.existsSync(historyPath)) {
    return { invoices: [] };
  }

  try {
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    return { invoices: data.invoices || [] };
  } catch {
    return { invoices: [] };
  }
}

/**
 * Save invoice history for a client
 */
export function saveHistory(clientDir: string, history: InvoiceHistory): void {
  const historyPath = getHistoryPath(clientDir);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

/**
 * Add an entry to invoice history
 */
export function addHistoryEntry(
  clientDir: string,
  entry: InvoiceHistoryEntry
): InvoiceHistory {
  const history = loadHistory(clientDir);
  history.invoices.push(entry);
  saveHistory(clientDir, history);
  return history;
}

/**
 * Get the most recent invoice from history
 */
export function getLastInvoice(clientDir: string): InvoiceHistoryEntry | null {
  const history = loadHistory(clientDir);

  if (history.invoices.length === 0) {
    return null;
  }

  return history.invoices[history.invoices.length - 1];
}

/**
 * Get invoice by invoice number
 */
export function getInvoiceByNumber(
  clientDir: string,
  invoiceNumber: string
): InvoiceHistoryEntry | null {
  const history = loadHistory(clientDir);

  return history.invoices.find(inv => inv.invoiceNumber === invoiceNumber) || null;
}

/**
 * Get invoices by month
 */
export function getInvoicesByMonth(
  clientDir: string,
  month: string
): InvoiceHistoryEntry[] {
  const history = loadHistory(clientDir);

  return history.invoices.filter(inv => inv.month === month);
}

/**
 * Get invoices by year
 */
export function getInvoicesByYear(
  clientDir: string,
  year: number
): InvoiceHistoryEntry[] {
  const history = loadHistory(clientDir);
  const yearStr = year.toString();

  return history.invoices.filter(inv =>
    inv.month.includes(yearStr) || inv.date.includes(yearStr)
  );
}

/**
 * Get total revenue from history
 */
export function getTotalRevenue(clientDir: string, currency?: string): number {
  const history = loadHistory(clientDir);

  return history.invoices
    .filter(inv => !currency || inv.currency === currency)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
}

/**
 * Get invoice count
 */
export function getInvoiceCount(clientDir: string): number {
  const history = loadHistory(clientDir);
  return history.invoices.length;
}

/**
 * Check if history exists for a client
 */
export function hasHistory(clientDir: string): boolean {
  const historyPath = getHistoryPath(clientDir);
  return fs.existsSync(historyPath);
}

/**
 * Delete a specific invoice from history
 */
export function deleteInvoice(
  clientDir: string,
  invoiceNumber: string
): boolean {
  const history = loadHistory(clientDir);
  const initialLength = history.invoices.length;

  history.invoices = history.invoices.filter(
    inv => inv.invoiceNumber !== invoiceNumber
  );

  if (history.invoices.length < initialLength) {
    saveHistory(clientDir, history);
    return true;
  }

  return false;
}

/**
 * Clear all history for a client
 */
export function clearHistory(clientDir: string): void {
  saveHistory(clientDir, { invoices: [] });
}

/**
 * Bulk invoice configuration types and utilities
 */

export interface BulkInvoice {
  client: string;
  quantity: number;
  month?: string;
  email?: boolean;
}

export interface BulkConfig {
  invoices: BulkInvoice[];
}

export interface ValidationError {
  index: number;
  message: string;
}

/**
 * Parse and validate a bulk configuration object
 */
export function validateBulkConfig(data: unknown): { config: BulkConfig } | { errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ index: -1, message: 'Config must be a JSON object' }] };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.invoices || !Array.isArray(obj.invoices)) {
    return { errors: [{ index: -1, message: 'Config must contain an "invoices" array' }] };
  }

  const invoices = obj.invoices as unknown[];

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i] as Record<string, unknown>;

    if (!inv || typeof inv !== 'object') {
      errors.push({ index: i, message: 'Invoice entry must be an object' });
      continue;
    }

    if (!inv.client || typeof inv.client !== 'string') {
      errors.push({ index: i, message: 'Missing or invalid "client" field' });
    }

    if (typeof inv.quantity !== 'number' || inv.quantity <= 0) {
      errors.push({ index: i, message: 'Invalid "quantity" (must be positive number)' });
    }

    if (inv.month !== undefined && typeof inv.month !== 'string') {
      errors.push({ index: i, message: 'Invalid "month" (must be string in MM-YYYY format)' });
    }

    if (inv.email !== undefined && typeof inv.email !== 'boolean') {
      errors.push({ index: i, message: 'Invalid "email" (must be boolean)' });
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { config: { invoices: invoices as BulkInvoice[] } };
}

/**
 * Build command arguments for a single invoice
 */
export function buildInvoiceArgs(invoice: BulkInvoice, isDryRun: boolean): string[] {
  const cmdArgs: string[] = [invoice.client, invoice.quantity.toString()];

  if (invoice.month) {
    cmdArgs.push(`--month=${invoice.month}`);
  }
  if (invoice.email) {
    cmdArgs.push('--email');
  }
  if (isDryRun) {
    cmdArgs.push('--dry-run');
  }

  return cmdArgs;
}

/**
 * Build full command string for executing invoicr
 */
export function buildInvoiceCommand(invoicrPath: string, args: string[]): string {
  return `node "${invoicrPath}" ${args.join(' ')}`;
}

/**
 * Format progress indicator
 */
export function formatProgress(current: number, total: number, client: string, quantity: number): string {
  return `[${current}/${total}] ${client} (qty: ${quantity})`;
}

/**
 * Build summary output
 */
export function buildSummaryOutput(successCount: number, errorCount: number, isDryRun: boolean): string {
  const lines: string[] = [
    '=== Bulk Generation Complete ===',
    `Success: ${successCount}`
  ];

  if (errorCount > 0) {
    lines.push(`Errors:  ${errorCount}`);
  }

  if (isDryRun) {
    lines.push('(dry-run mode - no files were generated)');
  }

  return lines.join('\n');
}

/**
 * Parse CLI arguments into BulkConfig
 * Format: client1:qty1 client2:qty2 [--month=MM-YYYY] [--email]
 * Example: acme:40 other:10 --month=11-2025 --email
 */
export function parseCliArgs(args: string[]): { config: BulkConfig; isDryRun: boolean } | { error: string } {
  const invoices: BulkInvoice[] = [];
  let globalMonth: string | undefined;
  let globalEmail = false;
  let isDryRun = false;

  for (const arg of args) {
    if (arg === '--dry-run') {
      isDryRun = true;
    } else if (arg === '--email') {
      globalEmail = true;
    } else if (arg.startsWith('--month=')) {
      globalMonth = arg.replace('--month=', '');
    } else if (arg.includes(':')) {
      // Parse client:quantity format
      const parts = arg.split(':');
      if (parts.length !== 2) {
        return { error: `Invalid format "${arg}". Use client:quantity (e.g., acme:40)` };
      }
      const [client, qtyStr] = parts;
      const quantity = parseFloat(qtyStr);
      if (!client || isNaN(quantity) || quantity <= 0) {
        return { error: `Invalid entry "${arg}". Client must be non-empty and quantity must be positive` };
      }
      invoices.push({ client, quantity });
    } else if (!arg.startsWith('--')) {
      return { error: `Invalid argument "${arg}". Use client:quantity format (e.g., acme:40)` };
    }
  }

  if (invoices.length === 0) {
    return { error: 'No invoices specified. Use client:quantity format (e.g., acme:40 other:10)' };
  }

  // Apply global options to all invoices
  for (const inv of invoices) {
    if (globalMonth) inv.month = globalMonth;
    if (globalEmail) inv.email = true;
  }

  return { config: { invoices }, isDryRun };
}

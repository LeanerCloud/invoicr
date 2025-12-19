import * as fs from 'fs';
import * as path from 'path';
import { Provider, Client, Translations, InvoiceContext, ResolvedLineItem, BankDetails } from './types.js';
import { formatDate, formatCurrency, getServiceDescription, calculateDueDate } from './utils.js';

/**
 * Parse command line arguments for invoice generation
 */
export interface ParsedArgs {
  clientFolder: string;
  quantity: number;
  monthArg?: string;
  shouldEmail: boolean;
  isTestMode: boolean;
  isDryRun: boolean;
}

export function parseInvoiceArgs(args: string[]): ParsedArgs | { error: string } {
  const isDryRun = args.includes('--dry-run');
  const shouldEmail = args.includes('--email');
  const isTestMode = args.includes('--test');

  // Filter out flags to get positional arguments
  const positionalArgs = args.filter(a => !a.startsWith('--'));

  if (positionalArgs.length < 2) {
    return { error: 'Missing required arguments: <client-folder> <quantity>' };
  }

  const clientFolder = positionalArgs[0];
  const quantity = parseFloat(positionalArgs[1]);
  const monthArg = args.find(a => a.startsWith('--month='));

  if (isNaN(quantity) || quantity <= 0) {
    return { error: 'Quantity must be a positive number' };
  }

  return {
    clientFolder,
    quantity,
    monthArg,
    shouldEmail,
    isTestMode,
    isDryRun
  };
}

/**
 * Find configuration file paths for provider and client
 */
export interface ConfigPaths {
  providerPath: string | null;
  clientPath: string | null;
}

export function findConfigPaths(
  clientFolder: string,
  cwd: string,
  installDir: string
): ConfigPaths {
  // Provider: check cwd first, then installation directory
  const cwdProviderPath = path.join(cwd, 'provider.json');
  const installProviderPath = path.join(installDir, 'provider.json');
  const providerPath = fs.existsSync(cwdProviderPath) ? cwdProviderPath :
                       fs.existsSync(installProviderPath) ? installProviderPath : null;

  // Client: check cwd paths first, then installation directory paths
  // New format: customer_data.json, legacy format: <name>.json
  const cwdNewPath = path.join(cwd, 'clients', clientFolder, 'customer_data.json');
  const cwdClientsPath = path.join(cwd, 'clients', clientFolder, `${clientFolder}.json`);
  const cwdLegacyPath = path.join(cwd, clientFolder, `${clientFolder}.json`);
  const installNewPath = path.join(installDir, 'clients', clientFolder, 'customer_data.json');
  const installClientsPath = path.join(installDir, 'clients', clientFolder, `${clientFolder}.json`);
  const installLegacyPath = path.join(installDir, clientFolder, `${clientFolder}.json`);
  const examplePath = path.join(installDir, 'examples', `${clientFolder}.json`);

  const clientPath = fs.existsSync(cwdNewPath) ? cwdNewPath :
                     fs.existsSync(cwdClientsPath) ? cwdClientsPath :
                     fs.existsSync(cwdLegacyPath) ? cwdLegacyPath :
                     fs.existsSync(installNewPath) ? installNewPath :
                     fs.existsSync(installClientsPath) ? installClientsPath :
                     fs.existsSync(installLegacyPath) ? installLegacyPath :
                     fs.existsSync(examplePath) ? examplePath : null;

  return { providerPath, clientPath };
}

/**
 * Build resolved line items from client config
 */
export function buildLineItems(
  client: Client,
  quantity: number,
  lang: string
): ResolvedLineItem[] {
  const billingType = client.service.billingType || 'daily';
  const rate = client.service.rate || client.service.dailyRate || 0;

  if (client.lineItems && client.lineItems.length > 0) {
    // Multi-line item mode: use line items from config
    return client.lineItems.map(item => {
      const itemRate = item.rate;
      const itemTotal = item.billingType === 'fixed' ? item.quantity : item.quantity * itemRate;
      return {
        description: getServiceDescription(item.description, lang),
        quantity: item.quantity,
        rate: itemRate,
        billingType: item.billingType,
        total: itemTotal
      };
    });
  } else {
    // Single-service mode: build from service + CLI quantity
    let itemTotal: number;
    if (billingType === 'fixed') {
      itemTotal = quantity;
    } else {
      itemTotal = quantity * rate;
    }
    return [{
      description: getServiceDescription(client.service.description, lang),
      quantity,
      rate,
      billingType,
      total: itemTotal
    }];
  }
}

/**
 * Calculate invoice totals from line items
 */
export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export function calculateTotals(lineItems: ResolvedLineItem[], taxRate: number): InvoiceTotals {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;
  return { subtotal, taxAmount, totalAmount };
}

/**
 * Parse billing month from --month=MM-YYYY argument
 */
export function parseBillingMonth(monthArg?: string): Date {
  let billingMonth = new Date();
  // Default to previous month since we always charge for the previous month
  billingMonth = new Date(billingMonth.getFullYear(), billingMonth.getMonth() - 1, 28);

  if (monthArg) {
    const [month, year] = monthArg.replace('--month=', '').split('-');
    billingMonth = new Date(parseInt(year), parseInt(month) - 1, 28);
  }

  return billingMonth;
}

/**
 * Generate invoice file paths
 */
export interface InvoiceFilePaths {
  docxPath: string;
  pdfPath: string;
}

export function generateFilePaths(
  clientPath: string,
  translations: Translations,
  invoiceNumber: string,
  billingMonth: Date
): InvoiceFilePaths {
  const outputDir = path.dirname(clientPath);
  const monthStr = billingMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '_');
  const baseFilename = `${translations.filePrefix}_${invoiceNumber}_${monthStr}`;
  const docxPath = path.join(outputDir, `${baseFilename}.docx`);
  const pdfPath = path.join(outputDir, `${baseFilename}.pdf`);
  return { docxPath, pdfPath };
}

/**
 * Format line item for display (dry-run output)
 */
export function formatLineItemDisplay(
  item: ResolvedLineItem,
  index: number,
  currency: string,
  lang: string
): string {
  const unitLabel = item.billingType === 'hourly' ? 'hour(s)' : item.billingType === 'daily' ? 'day(s)' : '';
  if (item.billingType === 'fixed') {
    return `  ${index + 1}. ${item.description}: ${formatCurrency(item.total, currency, lang)}`;
  } else {
    return `  ${index + 1}. ${item.description}: ${item.quantity} ${unitLabel} × ${formatCurrency(item.rate, currency, lang)} = ${formatCurrency(item.total, currency, lang)}`;
  }
}

/**
 * Build dry-run preview output
 */
export function buildDryRunOutput(
  client: Client,
  invoiceNumber: string,
  invoiceDate: string,
  dueDate: string | undefined,
  servicePeriod: string,
  lineItems: ResolvedLineItem[],
  subtotal: number,
  taxAmount: number,
  taxRate: number,
  totalAmount: number,
  currency: string,
  lang: string,
  docxPath: string,
  pdfPath: string,
  shouldEmail: boolean
): string {
  const lines: string[] = [
    '=== DRY RUN - Invoice Preview ===',
    '',
    `Client:         ${client.name}`,
    `Invoice Number: ${invoiceNumber}`,
    `Invoice Date:   ${invoiceDate}`
  ];

  if (dueDate) {
    lines.push(`Due Date:       ${dueDate}`);
  }
  lines.push(`Service Period: ${servicePeriod}`);
  lines.push('');
  lines.push('Line Items:');

  lineItems.forEach((item, index) => {
    lines.push(formatLineItemDisplay(item, index, currency, lang));
  });

  lines.push('');

  if (taxRate > 0) {
    lines.push(`Subtotal:       ${formatCurrency(subtotal, currency, lang)}`);
    lines.push(`Tax (${(taxRate * 100).toFixed(0)}%):       ${formatCurrency(taxAmount, currency, lang)}`);
  }
  lines.push(`Total Amount:   ${formatCurrency(totalAmount, currency, lang)}`);
  lines.push('');
  lines.push(`Output DOCX:    ${docxPath}`);
  lines.push(`Output PDF:     ${pdfPath}`);

  if (shouldEmail) {
    lines.push(`Email:          Would send to ${client.email?.to?.join(', ') || 'N/A'}`);
  }

  lines.push('');
  lines.push('=== No files were generated ===');

  return lines.join('\n');
}

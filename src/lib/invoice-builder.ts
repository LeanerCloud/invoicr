/**
 * Invoice Builder
 * Builds invoice context and calculates totals
 */
import { Provider, Client, Translations, InvoiceContext, ResolvedLineItem } from '../types.js';
import { formatDate, getServiceDescription, calculateDueDate } from '../utils.js';
import { resolveBankDetails } from './bank-utils.js';
import { getExchangeRate, formatConversionNote } from './exchange-rate.js';

export interface BuildInvoiceOptions {
  quantity: number;
  billingMonth?: Date;
  lang?: 'de' | 'en';
  /** Override the displayed service period (e.g. "June 16 - 30") for half-month/custom billing periods */
  period?: string;
  /** Override the month/period fragment used in output filenames (defaults to a sanitized monthName/period) */
  filenameSuffix?: string;
}

/**
 * Calculate totals from line items
 */
export function calculateTotals(lineItems: ResolvedLineItem[], taxRate: number): {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return { subtotal, taxAmount, totalAmount };
}

/**
 * Build line items from client configuration
 */
export function buildLineItems(
  client: Client,
  quantity: number,
  lang: 'de' | 'en'
): ResolvedLineItem[] {
  const billingType = client.service.billingType || 'daily';
  const rate = client.service.rate || 0;

  // Multi-line item mode
  if (client.lineItems && client.lineItems.length > 0) {
    return client.lineItems.map(item => ({
      description: getServiceDescription(item.description, lang),
      quantity: item.quantity,
      rate: item.rate,
      billingType: item.billingType,
      total: item.billingType === 'fixed' ? item.quantity : item.quantity * item.rate
    }));
  }

  // Single-service mode
  const itemTotal = billingType === 'fixed' ? quantity : quantity * rate;
  return [{
    description: getServiceDescription(client.service.description, lang),
    quantity,
    rate,
    billingType,
    total: itemTotal
  }];
}

/**
 * Build service description with month
 */
export function buildServiceDescription(
  client: Client,
  monthName: string,
  lang: 'de' | 'en'
): string {
  const baseDescription = getServiceDescription(client.service.description, lang);
  return `${baseDescription}, ${monthName}`;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(client: Client): string {
  return `${client.invoicePrefix}-${client.nextInvoiceNumber}`;
}

/**
 * Calculate service period and month name from billing month
 */
export function getServicePeriod(billingMonth: Date, lang: 'de' | 'en'): {
  servicePeriod: string;
  monthName: string;
} {
  const monthName = billingMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  let servicePeriod: string;
  if (lang === 'de') {
    servicePeriod = billingMonth.toLocaleDateString('de-DE', {
      month: 'short',
      year: 'numeric'
    });
  } else {
    servicePeriod = monthName;
  }

  return { servicePeriod, monthName };
}

/**
 * Build a complete invoice context
 */
export function buildInvoiceContext(
  provider: Provider,
  client: Client,
  translations: Translations,
  options: BuildInvoiceOptions
): InvoiceContext {
  const { quantity, billingMonth = getDefaultBillingMonth(), lang = client.language || 'de', period, filenameSuffix } = options;

  // Calculate dates
  const invoiceDateObj = new Date();
  const invoiceDate = formatDate(invoiceDateObj, lang);
  const computed = getServicePeriod(billingMonth, lang);
  const servicePeriod = period || computed.servicePeriod;
  const monthName = period || computed.monthName;

  // Calculate due date if payment terms are set
  let dueDate: string | undefined;
  if (client.paymentTermsDays && client.paymentTermsDays > 0) {
    const dueDateObj = calculateDueDate(invoiceDateObj, client.paymentTermsDays);
    dueDate = formatDate(dueDateObj, lang);
  }

  // Build line items and calculate totals
  const lineItems = buildLineItems(client, quantity, lang);
  const taxRate = client.taxRate || 0;
  const { subtotal, taxAmount, totalAmount } = calculateTotals(lineItems, taxRate);

  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber(client);

  // Build service descriptions
  const serviceDescription = buildServiceDescription(client, monthName, lang);
  const emailLang = client.emailLanguage || lang;
  const emailServiceDescription = buildServiceDescription(client, monthName, emailLang);

  // Get bank details
  const bankDetails = resolveBankDetails(client, provider)!;
  const billingType = client.service.billingType || 'daily';
  const currency = client.service.currency || 'EUR';
  const rate = client.service.rate || 0;

  return {
    provider,
    client,
    translations,
    invoiceNumber,
    invoiceDate,
    dueDate,
    servicePeriod,
    monthName,
    filenameSuffix,
    totalAmount,
    quantity,
    rate,
    billingType,
    currency,
    lang,
    serviceDescription,
    emailServiceDescription,
    bankDetails,
    lineItems,
    subtotal,
    taxAmount,
    taxRate
  };
}

/**
 * Convert an invoice context from its billing currency into
 * `service.invoiceCurrency`, using today's exchange rate, whenever
 * `invoiceCurrency` differs from `currency`. No-op otherwise.
 * `service.includeConversion` only controls whether the disclosure line
 * explaining the rate used is added to the invoice.
 */
export async function applyCurrencyConversion(ctx: InvoiceContext): Promise<InvoiceContext> {
  const { service } = ctx.client;
  const targetCurrency = service.invoiceCurrency;

  if (!targetCurrency || targetCurrency === ctx.currency) {
    return ctx;
  }

  const { rate, date } = await getExchangeRate(ctx.currency, targetCurrency);

  const lineItems = ctx.lineItems.map(item => ({
    ...item,
    rate: item.rate * rate,
    total: item.total * rate
  }));

  const conversionNote = service.includeConversion
    ? formatConversionNote(ctx.subtotal, ctx.currency, targetCurrency, rate, date, ctx.lang)
    : undefined;

  return {
    ...ctx,
    lineItems,
    rate: ctx.rate * rate,
    subtotal: ctx.subtotal * rate,
    taxAmount: ctx.taxAmount * rate,
    totalAmount: ctx.totalAmount * rate,
    currency: targetCurrency,
    conversionNote
  };
}

/**
 * Get default billing month (previous month)
 */
export function getDefaultBillingMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 28);
}

/**
 * Parse month argument to Date
 * Supports both YYYY-MM (ISO) and MM-YYYY formats
 */
export function parseMonthArg(monthArg: string): Date {
  const parts = monthArg.split('-');
  let year: number, month: number;

  if (parts[0].length === 4) {
    // YYYY-MM format (ISO)
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
  } else {
    // MM-YYYY format (legacy)
    month = parseInt(parts[0]) - 1;
    year = parseInt(parts[1]);
  }

  return new Date(year, month, 28);
}

/**
 * Increment the client's invoice number and return updated client
 */
export function incrementInvoiceNumber(client: Client): Client {
  return {
    ...client,
    nextInvoiceNumber: client.nextInvoiceNumber + 1
  };
}

import type { InvoiceContext, EInvoiceFormat, CountryCode, ResolvedLineItem } from '../types.js';

/**
 * E-Invoice data structure based on EN16931 Business Terms
 */
export interface EInvoiceData {
  // Document level
  'BT-1': string;   // Invoice number
  'BT-2': string;   // Invoice issue date (YYYY-MM-DD)
  'BT-3': string;   // Invoice type code (380 = Commercial invoice)
  'BT-5': string;   // Invoice currency code
  'BT-9'?: string;  // Payment due date
  'BT-10'?: string; // Buyer reference (Leitweg-ID for XRechnung)
  'BT-20'?: string; // Payment terms text

  // Seller (BG-4)
  'BT-27': string;  // Seller name
  'BT-31'?: string; // Seller VAT identifier
  'BT-32'?: string; // Seller tax registration number
  'BT-34': string;  // Seller electronic address (email)
  'BT-35': string;  // Seller address line 1
  'BT-37': string;  // Seller city
  'BT-38'?: string; // Seller postal code (extracted from city)
  'BT-40': string;  // Seller country code

  // Buyer (BG-7)
  'BT-44': string;  // Buyer name
  'BT-48'?: string; // Buyer VAT identifier
  'BT-49'?: string; // Buyer electronic address
  'BT-50': string;  // Buyer address line 1
  'BT-52': string;  // Buyer city
  'BT-53'?: string; // Buyer postal code
  'BT-55': string;  // Buyer country code

  // Payment (BG-16)
  'BT-81': string;  // Payment means type code
  'BT-83'?: string; // Payment account name
  'BT-84'?: string; // IBAN
  'BT-86'?: string; // BIC

  // Document totals (BG-22)
  'BT-106': number; // Sum of invoice line net amounts
  'BT-109': number; // Invoice total without VAT
  'BT-110': number; // Invoice total VAT amount
  'BT-112': number; // Invoice total with VAT
  'BT-115': number; // Amount due for payment

  // VAT breakdown (BG-23)
  vatBreakdown: VATBreakdown[];

  // Invoice lines (BG-25)
  lines: InvoiceLine[];
}

export interface VATBreakdown {
  'BT-116': number; // VAT category taxable amount
  'BT-117': number; // VAT category tax amount
  'BT-118': string; // VAT category code
  'BT-119': number; // VAT category rate (percentage)
}

export interface InvoiceLine {
  'BT-126': string;  // Line identifier
  'BT-129': number;  // Invoiced quantity
  'BT-130': string;  // Unit of measure code
  'BT-131': number;  // Line net amount
  'BT-146': number;  // Item net price
  'BT-153': string;  // Item name/description
  'BT-151': string;  // VAT category code
  'BT-152': number;  // VAT rate (percentage)
}

/**
 * Map billing type to UN/ECE unit code
 */
export function getUnitCode(billingType: 'hourly' | 'daily' | 'fixed'): string {
  switch (billingType) {
    case 'hourly': return 'HUR'; // Hour
    case 'daily': return 'DAY';  // Day
    case 'fixed': return 'C62';  // Unit (one)
    default: return 'C62';
  }
}

/**
 * Get VAT category code based on tax rate
 */
export function getVATCategoryCode(taxRate: number): string {
  if (taxRate === 0) return 'E';  // Exempt
  if (taxRate > 0) return 'S';    // Standard rate
  return 'O';                      // Not subject to VAT
}

/**
 * Parse localized date string to ISO format (YYYY-MM-DD)
 */
export function formatDateToISO(dateStr: string, lang: 'de' | 'en'): string {
  // Handle German format: DD.MM.YYYY
  if (lang === 'de') {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Handle English format: D MMM YYYY (e.g., "15 Dec 2024")
  if (lang === 'en') {
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const [day, monthStr, year] = parts;
      const month = months[monthStr] || '01';
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Fallback: try to parse as Date object
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Last resort: return as-is (may fail validation)
  return dateStr;
}

/**
 * Map InvoiceContext to e-invoice data structure
 */
export function mapInvoiceContext(
  ctx: InvoiceContext,
  format: EInvoiceFormat,
  providerCountryCode: CountryCode,
  clientCountryCode: CountryCode
): EInvoiceData {
  const invoiceDateISO = formatDateToISO(ctx.invoiceDate, ctx.lang);
  const dueDateISO = ctx.dueDate ? formatDateToISO(ctx.dueDate, ctx.lang) : undefined;

  // Determine VAT category based on tax setup
  const vatCategoryCode = getVATCategoryCode(ctx.taxRate);
  const vatRatePercent = ctx.taxRate * 100;

  // Get buyer reference
  const buyerReference = ctx.client.eInvoice?.leitwegId ||
                         ctx.client.eInvoice?.buyerReference ||
                         ctx.client.projectReference;

  // Get buyer email - extract email from "Name <email>" format or use as-is
  const rawEmail = ctx.client.email?.to?.[0] || '';
  const emailMatch = rawEmail.match(/<(.+)>/);
  const buyerEmail = emailMatch ? emailMatch[1] : rawEmail.trim();

  return {
    // Document level
    'BT-1': ctx.invoiceNumber,
    'BT-2': invoiceDateISO,
    'BT-3': '380', // Commercial invoice
    'BT-5': ctx.currency,
    'BT-9': dueDateISO,
    'BT-10': buyerReference,
    'BT-20': ctx.translations.paymentTerms,

    // Seller
    'BT-27': ctx.provider.name,
    'BT-31': ctx.provider.vatId,
    'BT-32': ctx.provider.taxNumber,
    'BT-34': ctx.provider.email,
    'BT-35': ctx.provider.address.street,
    'BT-37': ctx.provider.address.city,
    'BT-40': providerCountryCode,

    // Buyer
    'BT-44': ctx.client.name,
    'BT-49': buyerEmail || undefined,
    'BT-50': ctx.client.address.street,
    'BT-52': ctx.client.address.city,
    'BT-55': clientCountryCode,

    // Payment
    'BT-81': '58', // SEPA credit transfer
    'BT-83': ctx.bankDetails.name,
    'BT-84': ctx.bankDetails.iban.replace(/\s/g, ''),
    'BT-86': ctx.bankDetails.bic,

    // Totals
    'BT-106': ctx.subtotal,
    'BT-109': ctx.subtotal,
    'BT-110': ctx.taxAmount,
    'BT-112': ctx.totalAmount,
    'BT-115': ctx.totalAmount,

    // VAT breakdown
    vatBreakdown: [{
      'BT-116': ctx.subtotal,
      'BT-117': ctx.taxAmount,
      'BT-118': vatCategoryCode,
      'BT-119': vatRatePercent
    }],

    // Lines
    lines: ctx.lineItems.map((item, index) => mapLineItem(item, index, vatCategoryCode, vatRatePercent))
  };
}

function mapLineItem(
  item: ResolvedLineItem,
  index: number,
  vatCategoryCode: string,
  vatRatePercent: number
): InvoiceLine {
  return {
    'BT-126': String(index + 1),
    'BT-129': item.quantity,
    'BT-130': getUnitCode(item.billingType),
    'BT-131': item.total,
    'BT-146': item.rate,
    'BT-153': item.description,
    'BT-151': vatCategoryCode,
    'BT-152': vatRatePercent
  };
}

/**
 * Generate the output filename for an e-invoice
 */
export function generateEInvoiceFilename(
  ctx: InvoiceContext,
  format: EInvoiceFormat,
  fileExtension: string
): string {
  const sanitizedInvoiceNumber = ctx.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_');
  const sanitizedMonth = ctx.monthName.replace(/\s+/g, '_');
  return `${ctx.translations.filePrefix}_${sanitizedInvoiceNumber}_${sanitizedMonth}_${format}.${fileExtension}`;
}

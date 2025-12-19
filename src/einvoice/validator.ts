import type { InvoiceContext, EInvoiceFormat, CountryCode } from '../types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate an InvoiceContext for e-invoice generation
 */
export function validateForEInvoice(
  ctx: InvoiceContext,
  format: EInvoiceFormat,
  providerCountryCode: CountryCode,
  clientCountryCode: CountryCode
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Common validations for all formats
  validateCommon(ctx, errors, warnings);

  // Format-specific validations
  switch (format) {
    case 'xrechnung':
      validateXRechnung(ctx, providerCountryCode, errors, warnings);
      break;
    case 'zugferd':
      validateZUGFeRD(ctx, errors, warnings);
      break;
    case 'cius-ro':
      validateCIUSRO(ctx, errors, warnings);
      break;
    case 'ubl':
      // UBL has minimal additional requirements
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateCommon(
  ctx: InvoiceContext,
  errors: string[],
  warnings: string[]
): void {
  // Provider validations
  if (!ctx.provider.vatId && !ctx.provider.taxNumber) {
    errors.push('Provider must have either VAT ID or Tax Number');
  }

  if (!ctx.provider.email) {
    errors.push('Provider email is required (BT-34: Seller electronic address)');
  }

  if (!ctx.provider.name) {
    errors.push('Provider name is required');
  }

  if (!ctx.provider.address.street) {
    errors.push('Provider street address is required');
  }

  if (!ctx.provider.address.city) {
    errors.push('Provider city is required');
  }

  // Client validations
  if (!ctx.client.name) {
    errors.push('Client name is required');
  }

  if (!ctx.client.address.street) {
    errors.push('Client street address is required');
  }

  if (!ctx.client.address.city) {
    errors.push('Client city is required');
  }

  if (!ctx.client.email?.to?.length) {
    warnings.push('Client email missing - Buyer electronic address (BT-49) will be empty');
  }

  // Invoice validations
  if (!ctx.invoiceNumber) {
    errors.push('Invoice number is required (BT-1)');
  }

  if (!ctx.invoiceDate) {
    errors.push('Invoice date is required (BT-2)');
  }

  if (ctx.lineItems.length === 0) {
    errors.push('At least one line item is required');
  }

  // Bank details for payment
  if (!ctx.bankDetails.iban) {
    warnings.push('IBAN is recommended for payment instructions');
  }
}

function validateXRechnung(
  ctx: InvoiceContext,
  providerCountryCode: CountryCode,
  errors: string[],
  warnings: string[]
): void {
  // XRechnung requires Leitweg-ID for B2G (but we can't enforce it for B2B)
  if (!ctx.client.eInvoice?.leitwegId && !ctx.client.eInvoice?.buyerReference) {
    warnings.push('No Leitweg-ID or Buyer Reference set. Required for B2G invoices (BT-10)');
  }

  // Validate Leitweg-ID format if provided
  if (ctx.client.eInvoice?.leitwegId) {
    const leitwegId = ctx.client.eInvoice.leitwegId;
    // Leitweg-ID format: XX-XXXX...XXX-XX (numbers, letters, hyphens)
    if (!/^\d{2}-[A-Z0-9-]+-\d{2}$/.test(leitwegId)) {
      warnings.push(`Leitweg-ID format may be invalid: ${leitwegId}. Expected format: XX-XXXXX-XX`);
    }
  }

  // VAT ID required for XRechnung
  if (!ctx.provider.vatId) {
    errors.push('Provider VAT ID is required for XRechnung (BT-31)');
  }

  // Seller electronic address required (v3.0.1+)
  if (!ctx.provider.email) {
    errors.push('Provider email is required for XRechnung (BT-34)');
  }
}

function validateZUGFeRD(
  ctx: InvoiceContext,
  errors: string[],
  warnings: string[]
): void {
  // ZUGFeRD is generally less strict than XRechnung
  if (!ctx.provider.vatId) {
    warnings.push('Provider VAT ID is recommended for ZUGFeRD');
  }
}

function validateCIUSRO(
  ctx: InvoiceContext,
  errors: string[],
  warnings: string[]
): void {
  // Romanian-specific validations
  // CUI (Romanian fiscal code) validation
  if (!ctx.provider.taxNumber) {
    errors.push('Provider Tax Number (CUI) is required for CIUS-RO');
  }

  // Romanian invoices require buyer reference
  if (!ctx.client.eInvoice?.buyerReference) {
    warnings.push('Buyer reference is recommended for CIUS-RO invoices');
  }
}

/**
 * Check if all required fields are present for e-invoice generation
 */
export function hasRequiredFields(ctx: InvoiceContext): boolean {
  return !!(
    ctx.provider.name &&
    ctx.provider.email &&
    ctx.provider.address.street &&
    ctx.provider.address.city &&
    (ctx.provider.vatId || ctx.provider.taxNumber) &&
    ctx.client.name &&
    ctx.client.address.street &&
    ctx.client.address.city &&
    ctx.invoiceNumber &&
    ctx.invoiceDate &&
    ctx.lineItems.length > 0
  );
}

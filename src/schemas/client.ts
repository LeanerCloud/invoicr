import { z } from 'zod/v4';
import { addressSchema, bankSchema, countryCodeSchema } from './provider.js';

export const serviceDescriptionSchema = z.union([
  z.string(),
  z.object({ de: z.string().optional(), en: z.string().optional() })
]);

export const serviceSchema = z.object({
  description: serviceDescriptionSchema,
  billingType: z.enum(['hourly', 'daily', 'fixed']),
  rate: z.number().optional(),
  dailyRate: z.number().optional(),
  currency: z.enum(['EUR', 'USD'])
});

export const emailConfigSchema = z.object({
  to: z.array(z.string()).min(1, 'At least one recipient is required'),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  subject: z.string().optional(), // Custom email subject template
  body: z.string().optional()     // Custom email body template
});

export const lineItemSchema = z.object({
  description: serviceDescriptionSchema,
  quantity: z.number().positive('Quantity must be positive'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  billingType: z.enum(['hourly', 'daily', 'fixed'])
});

// E-invoice format types - all supported formats
export const eInvoiceFormatSchema = z.enum([
  'xrechnung',   // Germany: UBL-based XML
  'zugferd',     // Germany/Switzerland/Austria: PDF/A-3 with embedded XML
  'cius-ro',     // Romania: UBL with ANAF requirements
  'ubl',         // Generic: OASIS Universal Business Language
  'factur-x',    // France: Hybrid PDF with embedded XML
  'fatturapa',   // Italy: FatturaPA XML format for SDI
  'facturae',    // Spain: Spanish e-invoice format
  'peppol-bis',  // EU: PEPPOL Business Interoperability Specifications
  'nlcius',      // Netherlands: Dutch CIUS
  'ehf',         // Norway: EHF (Elektronisk Handelsformat)
  'oioubl',      // Denmark: OIOUBL format
  'finvoice',    // Finland: Finvoice format
  'ebinterface', // Austria: ebInterface format
  'isdoc',       // Czech Republic: ISDOC format
  'ksef'         // Poland: KSeF format
]);

// E-invoice configuration for clients
export const eInvoiceConfigSchema = z.object({
  // Germany B2G: Leitweg-ID (routing ID for public sector invoices)
  leitwegId: z.string().optional(),
  // General: Buyer reference (BT-10 in EN16931)
  buyerReference: z.string().optional(),
  // Preferred e-invoice format (overrides country default)
  preferredFormat: eInvoiceFormatSchema.optional()
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  address: addressSchema,
  language: z.enum(['de', 'en']),
  emailLanguage: z.enum(['de', 'en']).optional(),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  nextInvoiceNumber: z.number().int().positive('Invoice number must be a positive integer'),
  projectReference: z.string().optional(),
  service: serviceSchema,
  bank: bankSchema.optional(),
  paymentTermsDays: z.number().int().positive().nullable().optional(),
  email: emailConfigSchema.optional(),
  // Future fields (1.3.0+)
  taxRate: z.number().min(0).max(1).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  // Template name: 'default', 'minimal', 'detailed', or custom template name
  templateName: z.string().optional(),
  // E-invoice support (v2.0.0+)
  countryCode: countryCodeSchema.optional(),
  eInvoice: eInvoiceConfigSchema.optional()
});

export type ClientInput = z.input<typeof clientSchema>;
export type Client = z.output<typeof clientSchema>;
export type LineItem = z.output<typeof lineItemSchema>;
export type EInvoiceFormat = z.output<typeof eInvoiceFormatSchema>;
export type EInvoiceConfig = z.output<typeof eInvoiceConfigSchema>;

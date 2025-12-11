import { z } from 'zod/v4';
import { addressSchema, bankSchema } from './provider.js';

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
  cc: z.array(z.string()).optional()
});

export const lineItemSchema = z.object({
  description: serviceDescriptionSchema,
  quantity: z.number().positive('Quantity must be positive'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  billingType: z.enum(['hourly', 'daily', 'fixed'])
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
  template: z.enum(['default', 'minimal', 'detailed']).optional()
});

export type ClientInput = z.input<typeof clientSchema>;
export type Client = z.output<typeof clientSchema>;
export type LineItem = z.output<typeof lineItemSchema>;

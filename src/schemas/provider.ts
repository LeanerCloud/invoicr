import { z } from 'zod/v4';

export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  country: z.union([
    z.string(),
    z.object({ de: z.string().optional(), en: z.string().optional() })
  ]).optional()
});

export const bankSchema = z.object({
  name: z.string().min(1, 'Bank name is required'),
  iban: z.string().min(1, 'IBAN is required'),
  bic: z.string().min(1, 'BIC is required')
});

export const providerSchema = z.object({
  name: z.string().min(1, 'Provider name is required'),
  address: addressSchema,
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  bank: bankSchema,
  taxNumber: z.string().min(1, 'Tax number is required'),
  vatId: z.string().optional(),
  logoPath: z.string().optional()
});

export type ProviderInput = z.input<typeof providerSchema>;
export type Provider = z.output<typeof providerSchema>;

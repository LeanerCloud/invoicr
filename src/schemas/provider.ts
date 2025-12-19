import { z } from 'zod/v4';

// ISO 3166-1 alpha-2 country codes for e-invoice support
// Includes countries with established e-invoicing standards
export const countryCodeSchema = z.enum([
  'DE',  // Germany - XRechnung, ZUGFeRD
  'RO',  // Romania - CIUS-RO, ANAF e-Factura
  'US',  // USA - UBL
  'FR',  // France - Factur-X
  'IT',  // Italy - FatturaPA (SDI)
  'ES',  // Spain - Facturae
  'PL',  // Poland - KSeF
  'BE',  // Belgium - PEPPOL BIS
  'NL',  // Netherlands - NLCIUS
  'AT',  // Austria - ebInterface
  'PT',  // Portugal - CIUS-PT
  'SE',  // Sweden - PEPPOL BIS
  'NO',  // Norway - EHF
  'DK',  // Denmark - OIOUBL
  'FI',  // Finland - Finvoice
  'GR',  // Greece - myDATA
  'HU',  // Hungary - NAV Online Invoicing
  'SI',  // Slovenia - eSlog
  'SK',  // Slovakia - PEPPOL BIS
  'CZ',  // Czech Republic - ISDOC
  'GB',  // United Kingdom - PEPPOL BIS
  'CH',  // Switzerland - ZUGFeRD
  'LU',  // Luxembourg - PEPPOL BIS
  'IE'   // Ireland - PEPPOL BIS
]);

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
  logoPath: z.string().optional(),
  // E-invoice support (v2.0.0+)
  countryCode: countryCodeSchema.optional()
});

export type ProviderInput = z.input<typeof providerSchema>;
export type Provider = z.output<typeof providerSchema>;
export type CountryCode = z.output<typeof countryCodeSchema>;

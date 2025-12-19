/**
 * E-invoice formats index
 * Combines all regional format definitions
 */
import type { CountryCode, EInvoiceFormat } from '../../types.js';
import type { FormatInfo } from './types.js';

// Re-export types
export type { FormatInfo, CountryFormats } from './types.js';

// Import regional formats
import { EUROPE_FORMATS, EUROPE_COUNTRY_NAMES } from './europe.js';
import { ASIA_PACIFIC_FORMATS, ASIA_PACIFIC_COUNTRY_NAMES } from './asia-pacific.js';
import { MIDDLE_EAST_FORMATS, MIDDLE_EAST_COUNTRY_NAMES } from './middle-east.js';
import { LATIN_AMERICA_FORMATS, LATIN_AMERICA_COUNTRY_NAMES } from './latin-america.js';
import { AFRICA_FORMATS, AFRICA_COUNTRY_NAMES } from './africa.js';
import { NORTH_AMERICA_FORMATS, NORTH_AMERICA_COUNTRY_NAMES } from './north-america.js';

// Export regional formats for direct access
export { EU_FORMATS, NON_EU_EUROPE_FORMATS, EUROPE_FORMATS } from './europe.js';
export { ASIA_PACIFIC_FORMATS } from './asia-pacific.js';
export { MIDDLE_EAST_FORMATS } from './middle-east.js';
export { LATIN_AMERICA_FORMATS } from './latin-america.js';
export { AFRICA_FORMATS } from './africa.js';
export { NORTH_AMERICA_FORMATS } from './north-america.js';

/**
 * Combined format map for all countries
 */
export const FORMAT_MAP: Record<CountryCode, FormatInfo[]> = {
  ...EUROPE_FORMATS,
  ...ASIA_PACIFIC_FORMATS,
  ...MIDDLE_EAST_FORMATS,
  ...LATIN_AMERICA_FORMATS,
  ...AFRICA_FORMATS,
  ...NORTH_AMERICA_FORMATS
} as Record<CountryCode, FormatInfo[]>;

/**
 * Combined country names map
 */
export const COUNTRY_NAMES: Record<CountryCode, string> = {
  ...EUROPE_COUNTRY_NAMES,
  ...ASIA_PACIFIC_COUNTRY_NAMES,
  ...MIDDLE_EAST_COUNTRY_NAMES,
  ...LATIN_AMERICA_COUNTRY_NAMES,
  ...AFRICA_COUNTRY_NAMES,
  ...NORTH_AMERICA_COUNTRY_NAMES
} as Record<CountryCode, string>;

/**
 * Get available e-invoice formats for a country
 */
export function getAvailableFormats(countryCode: CountryCode): FormatInfo[] {
  return FORMAT_MAP[countryCode] || [];
}

/**
 * Get e-invoice formats available for a provider/client pair.
 * Only returns formats when both countries match (required for e-invoice).
 */
export function getFormatsForTransaction(
  providerCountryCode?: CountryCode,
  clientCountryCode?: CountryCode
): FormatInfo[] {
  // E-invoices require matching countries
  if (!providerCountryCode || !clientCountryCode) {
    return [];
  }

  if (providerCountryCode !== clientCountryCode) {
    return [];
  }

  return getAvailableFormats(providerCountryCode);
}

/**
 * Check if e-invoice can be generated for provider/client pair
 * E-invoices are supported for all countries with defined formats
 */
export function canGenerateEInvoice(
  providerCountryCode?: CountryCode,
  clientCountryCode?: CountryCode
): boolean {
  if (!providerCountryCode || !clientCountryCode) return false;
  // Allow cross-border e-invoicing for PEPPOL-compatible countries
  const providerFormats = getAvailableFormats(providerCountryCode);
  const clientFormats = getAvailableFormats(clientCountryCode);
  return providerFormats.length > 0 && clientFormats.length > 0;
}

/**
 * Get the default format for a country, optionally with a preferred format override
 */
export function getDefaultFormat(
  countryCode: CountryCode,
  preferredFormat?: EInvoiceFormat
): FormatInfo | null {
  const available = getAvailableFormats(countryCode);
  if (available.length === 0) return null;

  if (preferredFormat) {
    const preferred = available.find(f => f.format === preferredFormat);
    if (preferred) return preferred;
  }

  return available[0]; // Default to first available
}

/**
 * Get format info by format name
 */
export function getFormatInfo(format: EInvoiceFormat): FormatInfo | null {
  for (const countryFormats of Object.values(FORMAT_MAP)) {
    const found = countryFormats.find(f => f.format === format);
    if (found) return found;
  }
  return null;
}

/**
 * Get all countries that support a given format
 */
export function getCountriesForFormat(format: EInvoiceFormat): CountryCode[] {
  const countries: CountryCode[] = [];
  for (const [country, formats] of Object.entries(FORMAT_MAP)) {
    if (formats.some(f => f.format === format)) {
      countries.push(country as CountryCode);
    }
  }
  return countries;
}

/**
 * Get the primary country code for a given format (first country that supports it)
 */
export function getCountryForFormat(format: EInvoiceFormat): CountryCode | null {
  const countries = getCountriesForFormat(format);
  return countries.length > 0 ? countries[0] : null;
}

/**
 * Check if a format is valid for a country
 */
export function isFormatValidForCountry(
  format: EInvoiceFormat,
  countryCode: CountryCode
): boolean {
  const available = getAvailableFormats(countryCode);
  return available.some(f => f.format === format);
}

/**
 * Get all supported country codes
 */
export function getSupportedCountries(): CountryCode[] {
  return Object.keys(FORMAT_MAP) as CountryCode[];
}

/**
 * Get all supported formats across all countries
 */
export function getAllFormats(): EInvoiceFormat[] {
  const formats = new Set<EInvoiceFormat>();
  for (const countryFormats of Object.values(FORMAT_MAP)) {
    for (const format of countryFormats) {
      formats.add(format.format);
    }
  }
  return Array.from(formats);
}

/**
 * Get country name for display purposes
 */
export function getCountryName(countryCode: CountryCode): string {
  return COUNTRY_NAMES[countryCode] || countryCode;
}

/**
 * Get countries grouped by region for UI display
 */
export function getCountriesByRegion(): Record<string, CountryCode[]> {
  return {
    'Europe': Object.keys(EUROPE_FORMATS) as CountryCode[],
    'Asia-Pacific': Object.keys(ASIA_PACIFIC_FORMATS) as CountryCode[],
    'Middle East': Object.keys(MIDDLE_EAST_FORMATS) as CountryCode[],
    'Latin America': Object.keys(LATIN_AMERICA_FORMATS) as CountryCode[],
    'Africa': Object.keys(AFRICA_FORMATS) as CountryCode[],
    'North America': Object.keys(NORTH_AMERICA_FORMATS) as CountryCode[]
  };
}

/**
 * E-invoice formats
 *
 * This module re-exports from the formats subdirectory for backward compatibility.
 * For new code, consider importing directly from './formats/index.js'
 *
 * Supported regions:
 * - Europe (EU + non-EU)
 * - Asia-Pacific
 * - Middle East
 * - Latin America
 * - Africa
 * - North America
 */

// Re-export everything from the formats index
export {
  // Types
  type FormatInfo,
  type CountryFormats,

  // Format maps
  FORMAT_MAP,
  COUNTRY_NAMES,

  // Regional format exports
  EU_FORMATS,
  NON_EU_EUROPE_FORMATS,
  EUROPE_FORMATS,
  ASIA_PACIFIC_FORMATS,
  MIDDLE_EAST_FORMATS,
  LATIN_AMERICA_FORMATS,
  AFRICA_FORMATS,
  NORTH_AMERICA_FORMATS,

  // Functions
  getAvailableFormats,
  getFormatsForTransaction,
  canGenerateEInvoice,
  getDefaultFormat,
  getFormatInfo,
  getCountriesForFormat,
  getCountryForFormat,
  isFormatValidForCountry,
  getSupportedCountries,
  getAllFormats,
  getCountryName,
  getCountriesByRegion
} from './formats/index.js';

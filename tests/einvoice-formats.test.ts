import { describe, it, expect } from 'vitest';
import {
  getAvailableFormats,
  getFormatsForTransaction,
  canGenerateEInvoice,
  getDefaultFormat,
  getFormatInfo,
  getCountryForFormat,
  getCountriesForFormat,
  isFormatValidForCountry,
  getSupportedCountries,
  getAllFormats,
  getCountryName
} from '../src/einvoice/formats.js';

describe('getAvailableFormats', () => {
  it('should return XRechnung and ZUGFeRD for Germany (DE)', () => {
    const formats = getAvailableFormats('DE');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('xrechnung');
    expect(formats[1].format).toBe('zugferd');
  });

  it('should return CIUS-RO for Romania (RO)', () => {
    const formats = getAvailableFormats('RO');
    expect(formats).toHaveLength(1);
    expect(formats[0].format).toBe('cius-ro');
  });

  it('should return UBL for USA (US)', () => {
    const formats = getAvailableFormats('US');
    expect(formats).toHaveLength(1);
    expect(formats[0].format).toBe('ubl');
  });

  it('should return Factur-X and UBL for France (FR)', () => {
    const formats = getAvailableFormats('FR');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('factur-x');
    expect(formats[1].format).toBe('ubl');
  });

  it('should return FatturaPA for Italy (IT)', () => {
    const formats = getAvailableFormats('IT');
    expect(formats).toHaveLength(1);
    expect(formats[0].format).toBe('fatturapa');
  });

  it('should return Facturae and PEPPOL for Spain (ES)', () => {
    const formats = getAvailableFormats('ES');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('facturae');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return KSeF and PEPPOL for Poland (PL)', () => {
    const formats = getAvailableFormats('PL');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('ksef');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return NLCIUS and PEPPOL for Netherlands (NL)', () => {
    const formats = getAvailableFormats('NL');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('nlcius');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return ebInterface, ZUGFeRD and PEPPOL for Austria (AT)', () => {
    const formats = getAvailableFormats('AT');
    expect(formats).toHaveLength(3);
    expect(formats[0].format).toBe('ebinterface');
    expect(formats[1].format).toBe('zugferd');
    expect(formats[2].format).toBe('peppol-bis');
  });

  it('should return EHF and PEPPOL for Norway (NO)', () => {
    const formats = getAvailableFormats('NO');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('ehf');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return OIOUBL and PEPPOL for Denmark (DK)', () => {
    const formats = getAvailableFormats('DK');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('oioubl');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return Finvoice and PEPPOL for Finland (FI)', () => {
    const formats = getAvailableFormats('FI');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('finvoice');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return ISDOC and PEPPOL for Czech Republic (CZ)', () => {
    const formats = getAvailableFormats('CZ');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('isdoc');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return ZUGFeRD and PEPPOL for Switzerland (CH)', () => {
    const formats = getAvailableFormats('CH');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('zugferd');
    expect(formats[1].format).toBe('peppol-bis');
  });

  it('should return PEPPOL for UK (GB)', () => {
    const formats = getAvailableFormats('GB');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('peppol-bis');
    expect(formats[1].format).toBe('ubl');
  });

  it('should have correct file extensions', () => {
    const deFormats = getAvailableFormats('DE');
    expect(deFormats[0].fileExtension).toBe('xml'); // XRechnung
    expect(deFormats[1].fileExtension).toBe('pdf'); // ZUGFeRD
  });

  it('should have correct MIME types', () => {
    const deFormats = getAvailableFormats('DE');
    expect(deFormats[0].mimeType).toBe('application/xml');
    expect(deFormats[1].mimeType).toBe('application/pdf');
  });
});

describe('canGenerateEInvoice', () => {
  it('should return true when provider and client have same country code', () => {
    expect(canGenerateEInvoice('DE', 'DE')).toBe(true);
    expect(canGenerateEInvoice('RO', 'RO')).toBe(true);
    expect(canGenerateEInvoice('US', 'US')).toBe(true);
    expect(canGenerateEInvoice('FR', 'FR')).toBe(true);
    expect(canGenerateEInvoice('IT', 'IT')).toBe(true);
    expect(canGenerateEInvoice('ES', 'ES')).toBe(true);
    expect(canGenerateEInvoice('PL', 'PL')).toBe(true);
    expect(canGenerateEInvoice('NL', 'NL')).toBe(true);
    expect(canGenerateEInvoice('AT', 'AT')).toBe(true);
    expect(canGenerateEInvoice('GB', 'GB')).toBe(true);
    expect(canGenerateEInvoice('CH', 'CH')).toBe(true);
  });

  it('should allow cross-border e-invoicing when both countries have formats', () => {
    // Cross-border PEPPOL-compatible e-invoicing is supported
    expect(canGenerateEInvoice('DE', 'RO')).toBe(true);
    expect(canGenerateEInvoice('US', 'DE')).toBe(true);
    expect(canGenerateEInvoice('FR', 'IT')).toBe(true);
    expect(canGenerateEInvoice('ES', 'PL')).toBe(true);
  });

  it('should return false when provider country code is undefined', () => {
    expect(canGenerateEInvoice(undefined, 'DE')).toBe(false);
  });

  it('should return false when client country code is undefined', () => {
    expect(canGenerateEInvoice('DE', undefined)).toBe(false);
  });

  it('should return false when both country codes are undefined', () => {
    expect(canGenerateEInvoice(undefined, undefined)).toBe(false);
  });
});

describe('getFormatsForTransaction', () => {
  it('should return formats when provider and client countries match', () => {
    const formats = getFormatsForTransaction('DE', 'DE');
    expect(formats).toHaveLength(2);
    expect(formats[0].format).toBe('xrechnung');
    expect(formats[1].format).toBe('zugferd');
  });

  it('should return empty array when provider and client countries differ', () => {
    const formats = getFormatsForTransaction('DE', 'RO');
    expect(formats).toHaveLength(0);
  });

  it('should return empty array when provider country is undefined', () => {
    const formats = getFormatsForTransaction(undefined, 'DE');
    expect(formats).toHaveLength(0);
  });

  it('should return empty array when client country is undefined', () => {
    const formats = getFormatsForTransaction('DE', undefined);
    expect(formats).toHaveLength(0);
  });

  it('should return empty array when both countries are undefined', () => {
    const formats = getFormatsForTransaction(undefined, undefined);
    expect(formats).toHaveLength(0);
  });

  it('should return country-specific formats for matching countries', () => {
    // Romania
    const roFormats = getFormatsForTransaction('RO', 'RO');
    expect(roFormats).toHaveLength(1);
    expect(roFormats[0].format).toBe('cius-ro');

    // Italy
    const itFormats = getFormatsForTransaction('IT', 'IT');
    expect(itFormats).toHaveLength(1);
    expect(itFormats[0].format).toBe('fatturapa');

    // France (has 2 formats: Factur-X and UBL for Chorus Pro)
    const frFormats = getFormatsForTransaction('FR', 'FR');
    expect(frFormats).toHaveLength(2);
    expect(frFormats[0].format).toBe('factur-x');
    expect(frFormats[1].format).toBe('ubl');
  });
});

describe('getDefaultFormat', () => {
  it('should return first format as default for DE', () => {
    const format = getDefaultFormat('DE');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('xrechnung');
  });

  it('should return CIUS-RO as default for RO', () => {
    const format = getDefaultFormat('RO');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('cius-ro');
  });

  it('should return UBL as default for US', () => {
    const format = getDefaultFormat('US');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('ubl');
  });

  it('should return Factur-X as default for FR', () => {
    const format = getDefaultFormat('FR');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('factur-x');
  });

  it('should return FatturaPA as default for IT', () => {
    const format = getDefaultFormat('IT');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('fatturapa');
  });

  it('should return Facturae as default for ES', () => {
    const format = getDefaultFormat('ES');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('facturae');
  });

  it('should use preferred format if available', () => {
    const format = getDefaultFormat('DE', 'zugferd');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('zugferd');
  });

  it('should use preferred format for Austria', () => {
    const format = getDefaultFormat('AT', 'zugferd');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('zugferd');
  });

  it('should fallback to default if preferred format not available', () => {
    const format = getDefaultFormat('RO', 'xrechnung');
    expect(format).not.toBeNull();
    expect(format?.format).toBe('cius-ro'); // Falls back to default
  });

  it('should return first format if preferred format is undefined', () => {
    const format = getDefaultFormat('DE', undefined);
    expect(format?.format).toBe('xrechnung');
  });
});

describe('getFormatInfo', () => {
  it('should return format info for xrechnung', () => {
    const info = getFormatInfo('xrechnung');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('xrechnung');
    expect(info?.description).toContain('XRechnung');
  });

  it('should return format info for zugferd', () => {
    const info = getFormatInfo('zugferd');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('zugferd');
    expect(info?.description).toContain('ZUGFeRD');
  });

  it('should return format info for cius-ro', () => {
    const info = getFormatInfo('cius-ro');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('cius-ro');
    expect(info?.description).toContain('CIUS-RO');
  });

  it('should return format info for ubl', () => {
    const info = getFormatInfo('ubl');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('ubl');
    expect(info?.description).toContain('UBL');
  });

  it('should return format info for factur-x', () => {
    const info = getFormatInfo('factur-x');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('factur-x');
    expect(info?.description).toContain('Factur-X');
  });

  it('should return format info for fatturapa', () => {
    const info = getFormatInfo('fatturapa');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('fatturapa');
    expect(info?.description).toContain('FatturaPA');
  });

  it('should return format info for facturae', () => {
    const info = getFormatInfo('facturae');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('facturae');
    expect(info?.description).toContain('Facturae');
  });

  it('should return format info for peppol-bis', () => {
    const info = getFormatInfo('peppol-bis');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('peppol-bis');
    expect(info?.description).toContain('PEPPOL');
  });

  it('should return format info for ksef', () => {
    const info = getFormatInfo('ksef');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('ksef');
    expect(info?.description).toContain('KSeF');
  });

  it('should return format info for ehf', () => {
    const info = getFormatInfo('ehf');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('ehf');
    expect(info?.description).toContain('EHF');
  });

  it('should return format info for finvoice', () => {
    const info = getFormatInfo('finvoice');
    expect(info).not.toBeNull();
    expect(info?.format).toBe('finvoice');
    expect(info?.description).toContain('Finvoice');
  });
});

describe('getCountryForFormat', () => {
  it('should return DE for xrechnung', () => {
    expect(getCountryForFormat('xrechnung')).toBe('DE');
  });

  it('should return DE for zugferd', () => {
    expect(getCountryForFormat('zugferd')).toBe('DE');
  });

  it('should return RO for cius-ro', () => {
    expect(getCountryForFormat('cius-ro')).toBe('RO');
  });

  it('should return FR for ubl (first country in list)', () => {
    expect(getCountryForFormat('ubl')).toBe('FR');
  });

  it('should return FR for factur-x', () => {
    expect(getCountryForFormat('factur-x')).toBe('FR');
  });

  it('should return IT for fatturapa', () => {
    expect(getCountryForFormat('fatturapa')).toBe('IT');
  });

  it('should return ES for facturae', () => {
    expect(getCountryForFormat('facturae')).toBe('ES');
  });

  it('should return PL for ksef', () => {
    expect(getCountryForFormat('ksef')).toBe('PL');
  });
});

describe('getCountriesForFormat', () => {
  it('should return multiple countries for zugferd', () => {
    const countries = getCountriesForFormat('zugferd');
    expect(countries).toContain('DE');
    expect(countries).toContain('AT');
    expect(countries).toContain('CH');
  });

  it('should return multiple countries for peppol-bis', () => {
    const countries = getCountriesForFormat('peppol-bis');
    expect(countries.length).toBeGreaterThan(5);
    expect(countries).toContain('PL');
    expect(countries).toContain('BE');
    expect(countries).toContain('NL');
    expect(countries).toContain('AT');
    expect(countries).toContain('NO');
  });

  it('should return multiple countries for ubl', () => {
    const countries = getCountriesForFormat('ubl');
    expect(countries).toContain('US');
    expect(countries).toContain('FR');
    expect(countries).toContain('BE');
    expect(countries).toContain('GB');
  });

  it('should return single country for xrechnung', () => {
    const countries = getCountriesForFormat('xrechnung');
    expect(countries).toEqual(['DE']);
  });
});

describe('isFormatValidForCountry', () => {
  it('should return true for xrechnung in DE', () => {
    expect(isFormatValidForCountry('xrechnung', 'DE')).toBe(true);
  });

  it('should return true for zugferd in DE', () => {
    expect(isFormatValidForCountry('zugferd', 'DE')).toBe(true);
  });

  it('should return true for zugferd in AT', () => {
    expect(isFormatValidForCountry('zugferd', 'AT')).toBe(true);
  });

  it('should return true for zugferd in CH', () => {
    expect(isFormatValidForCountry('zugferd', 'CH')).toBe(true);
  });

  it('should return false for xrechnung in RO', () => {
    expect(isFormatValidForCountry('xrechnung', 'RO')).toBe(false);
  });

  it('should return false for xrechnung in US', () => {
    expect(isFormatValidForCountry('xrechnung', 'US')).toBe(false);
  });

  it('should return true for cius-ro in RO', () => {
    expect(isFormatValidForCountry('cius-ro', 'RO')).toBe(true);
  });

  it('should return false for cius-ro in DE', () => {
    expect(isFormatValidForCountry('cius-ro', 'DE')).toBe(false);
  });

  it('should return true for ubl in US', () => {
    expect(isFormatValidForCountry('ubl', 'US')).toBe(true);
  });

  it('should return true for peppol-bis in multiple countries', () => {
    expect(isFormatValidForCountry('peppol-bis', 'PL')).toBe(true);
    expect(isFormatValidForCountry('peppol-bis', 'BE')).toBe(true);
    expect(isFormatValidForCountry('peppol-bis', 'NL')).toBe(true);
    expect(isFormatValidForCountry('peppol-bis', 'AT')).toBe(true);
    expect(isFormatValidForCountry('peppol-bis', 'GB')).toBe(true);
  });
});

describe('getSupportedCountries', () => {
  it('should return all supported country codes', () => {
    const countries = getSupportedCountries();
    expect(countries.length).toBeGreaterThanOrEqual(24); // At least 24 countries (may grow)
    // Core European countries
    expect(countries).toContain('DE');
    expect(countries).toContain('RO');
    expect(countries).toContain('FR');
    expect(countries).toContain('IT');
    expect(countries).toContain('ES');
    expect(countries).toContain('PL');
    expect(countries).toContain('BE');
    expect(countries).toContain('NL');
    expect(countries).toContain('AT');
    expect(countries).toContain('GB');
    expect(countries).toContain('CH');
  });
});

describe('getAllFormats', () => {
  it('should return all unique formats', () => {
    const formats = getAllFormats();
    expect(formats.length).toBeGreaterThanOrEqual(14); // At least 14 unique formats
    expect(formats).toContain('xrechnung');
    expect(formats).toContain('zugferd');
    expect(formats).toContain('cius-ro');
    expect(formats).toContain('ubl');
    expect(formats).toContain('factur-x');
    expect(formats).toContain('fatturapa');
    expect(formats).toContain('facturae');
    expect(formats).toContain('peppol-bis');
    expect(formats).toContain('nlcius');
    expect(formats).toContain('ehf');
    expect(formats).toContain('oioubl');
    expect(formats).toContain('finvoice');
    expect(formats).toContain('ebinterface');
    expect(formats).toContain('isdoc');
    expect(formats).toContain('ksef');
  });
});

describe('getCountryName', () => {
  it('should return correct names for all countries', () => {
    expect(getCountryName('DE')).toBe('Germany');
    expect(getCountryName('RO')).toBe('Romania');
    expect(getCountryName('US')).toBe('United States');
    expect(getCountryName('FR')).toBe('France');
    expect(getCountryName('IT')).toBe('Italy');
    expect(getCountryName('ES')).toBe('Spain');
    expect(getCountryName('PL')).toBe('Poland');
    expect(getCountryName('BE')).toBe('Belgium');
    expect(getCountryName('NL')).toBe('Netherlands');
    expect(getCountryName('AT')).toBe('Austria');
    expect(getCountryName('PT')).toBe('Portugal');
    expect(getCountryName('SE')).toBe('Sweden');
    expect(getCountryName('NO')).toBe('Norway');
    expect(getCountryName('DK')).toBe('Denmark');
    expect(getCountryName('FI')).toBe('Finland');
    expect(getCountryName('GR')).toBe('Greece');
    expect(getCountryName('HU')).toBe('Hungary');
    expect(getCountryName('SI')).toBe('Slovenia');
    expect(getCountryName('SK')).toBe('Slovakia');
    expect(getCountryName('CZ')).toBe('Czech Republic');
    expect(getCountryName('GB')).toBe('United Kingdom');
    expect(getCountryName('CH')).toBe('Switzerland');
    expect(getCountryName('LU')).toBe('Luxembourg');
    expect(getCountryName('IE')).toBe('Ireland');
  });
});

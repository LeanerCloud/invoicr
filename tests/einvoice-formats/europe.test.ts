/**
 * Tests for European e-invoice formats
 */
import { describe, it, expect } from 'vitest';
import {
  getAvailableFormats,
  getDefaultFormat,
  isFormatValidForCountry,
  getCountryName
} from '../../src/einvoice/formats.js';
import type { CountryCode } from '../../src/types.js';

describe('European Union e-invoice formats', () => {
  // Germany
  describe('Germany (DE)', () => {
    it('should support XRechnung and ZUGFeRD', () => {
      const formats = getAvailableFormats('DE');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['xrechnung', 'zugferd']);
    });

    it('should default to XRechnung', () => {
      expect(getDefaultFormat('DE')?.format).toBe('xrechnung');
    });

    it('should have correct country name', () => {
      expect(getCountryName('DE')).toBe('Germany');
    });
  });

  // Romania
  describe('Romania (RO)', () => {
    it('should support CIUS-RO', () => {
      const formats = getAvailableFormats('RO');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('cius-ro');
    });

    it('should default to CIUS-RO', () => {
      expect(getDefaultFormat('RO')?.format).toBe('cius-ro');
    });
  });

  // France
  describe('France (FR)', () => {
    it('should support Factur-X and UBL', () => {
      const formats = getAvailableFormats('FR');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['factur-x', 'ubl']);
    });

    it('should default to Factur-X', () => {
      expect(getDefaultFormat('FR')?.format).toBe('factur-x');
    });
  });

  // Italy
  describe('Italy (IT)', () => {
    it('should support FatturaPA', () => {
      const formats = getAvailableFormats('IT');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fatturapa');
    });
  });

  // Spain
  describe('Spain (ES)', () => {
    it('should support Facturae and PEPPOL', () => {
      const formats = getAvailableFormats('ES');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['facturae', 'peppol-bis']);
    });
  });

  // Poland
  describe('Poland (PL)', () => {
    it('should support KSeF and PEPPOL', () => {
      const formats = getAvailableFormats('PL');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['ksef', 'peppol-bis']);
    });
  });

  // Belgium
  describe('Belgium (BE)', () => {
    it('should support PEPPOL and UBL', () => {
      const formats = getAvailableFormats('BE');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['peppol-bis', 'ubl']);
    });
  });

  // Netherlands
  describe('Netherlands (NL)', () => {
    it('should support NLCIUS and PEPPOL', () => {
      const formats = getAvailableFormats('NL');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['nlcius', 'peppol-bis']);
    });
  });

  // Austria
  describe('Austria (AT)', () => {
    it('should support ebInterface, ZUGFeRD, and PEPPOL', () => {
      const formats = getAvailableFormats('AT');
      expect(formats).toHaveLength(3);
      expect(formats.map(f => f.format)).toEqual(['ebinterface', 'zugferd', 'peppol-bis']);
    });
  });

  // Portugal
  describe('Portugal (PT)', () => {
    it('should support PEPPOL (CIUS-PT)', () => {
      const formats = getAvailableFormats('PT');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Sweden
  describe('Sweden (SE)', () => {
    it('should support PEPPOL (Svefaktura)', () => {
      const formats = getAvailableFormats('SE');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Norway
  describe('Norway (NO)', () => {
    it('should support EHF and PEPPOL', () => {
      const formats = getAvailableFormats('NO');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['ehf', 'peppol-bis']);
    });
  });

  // Denmark
  describe('Denmark (DK)', () => {
    it('should support OIOUBL and PEPPOL', () => {
      const formats = getAvailableFormats('DK');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['oioubl', 'peppol-bis']);
    });
  });

  // Finland
  describe('Finland (FI)', () => {
    it('should support Finvoice and PEPPOL', () => {
      const formats = getAvailableFormats('FI');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['finvoice', 'peppol-bis']);
    });
  });

  // Greece
  describe('Greece (GR)', () => {
    it('should support PEPPOL (myDATA compatible)', () => {
      const formats = getAvailableFormats('GR');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Hungary
  describe('Hungary (HU)', () => {
    it('should support PEPPOL (NAV Online compatible)', () => {
      const formats = getAvailableFormats('HU');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Slovenia
  describe('Slovenia (SI)', () => {
    it('should support PEPPOL (eSlog compatible)', () => {
      const formats = getAvailableFormats('SI');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Slovakia
  describe('Slovakia (SK)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('SK');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Czech Republic
  describe('Czech Republic (CZ)', () => {
    it('should support ISDOC and PEPPOL', () => {
      const formats = getAvailableFormats('CZ');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['isdoc', 'peppol-bis']);
    });
  });

  // Luxembourg
  describe('Luxembourg (LU)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('LU');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Ireland
  describe('Ireland (IE)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('IE');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Lithuania
  describe('Lithuania (LT)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('LT');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Latvia
  describe('Latvia (LV)', () => {
    it('should support PEPPOL (mandatory B2G from 2025)', () => {
      const formats = getAvailableFormats('LV');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Estonia
  describe('Estonia (EE)', () => {
    it('should support PEPPOL (mandatory from July 2025)', () => {
      const formats = getAvailableFormats('EE');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Serbia
  describe('Serbia (RS)', () => {
    it('should support Serbian e-Faktura', () => {
      const formats = getAvailableFormats('RS');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('sefaktura');
    });
  });

  // Croatia
  describe('Croatia (HR)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('HR');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Bulgaria
  describe('Bulgaria (BG)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('BG');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Malta
  describe('Malta (MT)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('MT');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });

  // Cyprus
  describe('Cyprus (CY)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('CY');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });
});

describe('Non-EU European e-invoice formats', () => {
  // United Kingdom
  describe('United Kingdom (GB)', () => {
    it('should support PEPPOL and UBL', () => {
      const formats = getAvailableFormats('GB');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['peppol-bis', 'ubl']);
    });
  });

  // Switzerland
  describe('Switzerland (CH)', () => {
    it('should support ZUGFeRD and PEPPOL', () => {
      const formats = getAvailableFormats('CH');
      expect(formats).toHaveLength(2);
      expect(formats.map(f => f.format)).toEqual(['zugferd', 'peppol-bis']);
    });
  });

  // Iceland
  describe('Iceland (IS)', () => {
    it('should support PEPPOL', () => {
      const formats = getAvailableFormats('IS');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });
  });
});

describe('European format validation', () => {
  it('should validate XRechnung only for Germany', () => {
    expect(isFormatValidForCountry('xrechnung', 'DE')).toBe(true);
    expect(isFormatValidForCountry('xrechnung', 'FR')).toBe(false);
    expect(isFormatValidForCountry('xrechnung', 'IT')).toBe(false);
  });

  it('should validate ZUGFeRD for Germany, Austria, Switzerland', () => {
    expect(isFormatValidForCountry('zugferd', 'DE')).toBe(true);
    expect(isFormatValidForCountry('zugferd', 'AT')).toBe(true);
    expect(isFormatValidForCountry('zugferd', 'CH')).toBe(true);
    expect(isFormatValidForCountry('zugferd', 'FR')).toBe(false);
  });

  it('should validate PEPPOL-BIS for many European countries', () => {
    const peppolCountries: CountryCode[] = [
      'ES', 'PL', 'BE', 'NL', 'AT', 'PT', 'SE', 'NO', 'DK', 'FI',
      'GR', 'HU', 'SI', 'SK', 'CZ', 'LU', 'IE', 'LT', 'LV', 'EE',
      'HR', 'BG', 'MT', 'CY', 'GB', 'CH', 'IS'
    ];
    for (const country of peppolCountries) {
      expect(isFormatValidForCountry('peppol-bis', country)).toBe(true);
    }
  });
});

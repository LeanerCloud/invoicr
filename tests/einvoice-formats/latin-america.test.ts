/**
 * Tests for Latin American e-invoice formats
 * Latin America has one of the most developed e-invoicing systems in the world
 */
import { describe, it, expect } from 'vitest';
import {
  getAvailableFormats,
  getDefaultFormat,
  isFormatValidForCountry,
  getCountryName
} from '../../src/einvoice/formats.js';

describe('Latin American e-invoice formats', () => {
  // Brazil
  describe('Brazil (BR)', () => {
    it('should support NF-e', () => {
      const formats = getAvailableFormats('BR');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('nfe');
    });

    it('should have correct country name', () => {
      expect(getCountryName('BR')).toBe('Brazil');
    });
  });

  // Mexico
  describe('Mexico (MX)', () => {
    it('should support CFDI', () => {
      const formats = getAvailableFormats('MX');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('cfdi');
    });

    it('should have correct country name', () => {
      expect(getCountryName('MX')).toBe('Mexico');
    });
  });

  // Argentina
  describe('Argentina (AR)', () => {
    it('should support Factura Electronica AFIP', () => {
      const formats = getAvailableFormats('AR');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fe-ar');
    });

    it('should have correct country name', () => {
      expect(getCountryName('AR')).toBe('Argentina');
    });
  });

  // Chile
  describe('Chile (CL)', () => {
    it('should support DTE', () => {
      const formats = getAvailableFormats('CL');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('dte');
    });

    it('should have correct country name', () => {
      expect(getCountryName('CL')).toBe('Chile');
    });
  });

  // Colombia
  describe('Colombia (CO)', () => {
    it('should support Factura Electronica DIAN', () => {
      const formats = getAvailableFormats('CO');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fe-co');
    });

    it('should have correct country name', () => {
      expect(getCountryName('CO')).toBe('Colombia');
    });
  });

  // Peru
  describe('Peru (PE)', () => {
    it('should support Factura Electronica SUNAT', () => {
      const formats = getAvailableFormats('PE');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fe-pe');
    });

    it('should have correct country name', () => {
      expect(getCountryName('PE')).toBe('Peru');
    });
  });

  // Ecuador
  describe('Ecuador (EC)', () => {
    it('should support Factura Electronica SRI', () => {
      const formats = getAvailableFormats('EC');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fe-ec');
    });

    it('should have correct country name', () => {
      expect(getCountryName('EC')).toBe('Ecuador');
    });
  });

  // Costa Rica
  describe('Costa Rica (CR)', () => {
    it('should support Factura Electronica Hacienda', () => {
      const formats = getAvailableFormats('CR');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fe-cr');
    });

    it('should have correct country name', () => {
      expect(getCountryName('CR')).toBe('Costa Rica');
    });
  });

  // Uruguay
  describe('Uruguay (UY)', () => {
    it('should support CFE', () => {
      const formats = getAvailableFormats('UY');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('cfe');
    });

    it('should have correct country name', () => {
      expect(getCountryName('UY')).toBe('Uruguay');
    });
  });

  // Panama
  describe('Panama (PA)', () => {
    it('should support Factura Electronica DGI', () => {
      const formats = getAvailableFormats('PA');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fe-pa');
    });

    it('should have correct country name', () => {
      expect(getCountryName('PA')).toBe('Panama');
    });
  });

  // Guatemala
  describe('Guatemala (GT)', () => {
    it('should support FEL', () => {
      const formats = getAvailableFormats('GT');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fel');
    });

    it('should have correct country name', () => {
      expect(getCountryName('GT')).toBe('Guatemala');
    });
  });

  // Dominican Republic
  describe('Dominican Republic (DO)', () => {
    it('should support e-CF', () => {
      const formats = getAvailableFormats('DO');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('ecf');
    });

    it('should have correct country name', () => {
      expect(getCountryName('DO')).toBe('Dominican Republic');
    });
  });

  // Bolivia
  describe('Bolivia (BO)', () => {
    it('should support Factura Electronica SIN', () => {
      const formats = getAvailableFormats('BO');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fe-bo');
    });

    it('should have correct country name', () => {
      expect(getCountryName('BO')).toBe('Bolivia');
    });
  });
});

describe('Latin American format validation', () => {
  it('should validate NF-e only for Brazil', () => {
    expect(isFormatValidForCountry('nfe', 'BR')).toBe(true);
    expect(isFormatValidForCountry('nfe', 'MX')).toBe(false);
  });

  it('should validate CFDI only for Mexico', () => {
    expect(isFormatValidForCountry('cfdi', 'MX')).toBe(true);
    expect(isFormatValidForCountry('cfdi', 'BR')).toBe(false);
  });

  it('should validate DTE only for Chile', () => {
    expect(isFormatValidForCountry('dte', 'CL')).toBe(true);
    expect(isFormatValidForCountry('dte', 'AR')).toBe(false);
  });
});

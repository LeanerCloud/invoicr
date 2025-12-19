/**
 * Tests for Middle East e-invoice formats
 */
import { describe, it, expect } from 'vitest';
import {
  getAvailableFormats,
  getDefaultFormat,
  isFormatValidForCountry,
  getCountryName
} from '../../src/einvoice/formats.js';

describe('Middle East e-invoice formats', () => {
  // Saudi Arabia
  describe('Saudi Arabia (SA)', () => {
    it('should support FATOORA/ZATCA', () => {
      const formats = getAvailableFormats('SA');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('fatoora');
    });

    it('should have correct country name', () => {
      expect(getCountryName('SA')).toBe('Saudi Arabia');
    });
  });

  // UAE
  describe('UAE (AE)', () => {
    it('should support PEPPOL BIS', () => {
      const formats = getAvailableFormats('AE');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });

    it('should have correct country name', () => {
      expect(getCountryName('AE')).toBe('United Arab Emirates');
    });
  });

  // Israel
  describe('Israel (IL)', () => {
    it('should support UBL', () => {
      const formats = getAvailableFormats('IL');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('ubl');
    });

    it('should have correct country name', () => {
      expect(getCountryName('IL')).toBe('Israel');
    });
  });

  // Turkey
  describe('Turkey (TR)', () => {
    it('should support e-Fatura', () => {
      const formats = getAvailableFormats('TR');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('efatura-tr');
    });

    it('should have correct country name', () => {
      expect(getCountryName('TR')).toBe('Turkey');
    });
  });

  // Jordan
  describe('Jordan (JO)', () => {
    it('should support JoFotara', () => {
      const formats = getAvailableFormats('JO');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('jofotara');
    });

    it('should have correct country name', () => {
      expect(getCountryName('JO')).toBe('Jordan');
    });
  });

  // Egypt
  describe('Egypt (EG)', () => {
    it('should support e-Receipt', () => {
      const formats = getAvailableFormats('EG');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('ereceipt-eg');
      expect(formats[0].fileExtension).toBe('json');
    });

    it('should have correct country name', () => {
      expect(getCountryName('EG')).toBe('Egypt');
    });
  });
});

describe('Middle East format validation', () => {
  it('should validate FATOORA only for Saudi Arabia', () => {
    expect(isFormatValidForCountry('fatoora', 'SA')).toBe(true);
    expect(isFormatValidForCountry('fatoora', 'AE')).toBe(false);
  });

  it('should validate e-Fatura only for Turkey', () => {
    expect(isFormatValidForCountry('efatura-tr', 'TR')).toBe(true);
    expect(isFormatValidForCountry('efatura-tr', 'SA')).toBe(false);
  });
});

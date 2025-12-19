/**
 * Tests for African e-invoice formats
 */
import { describe, it, expect } from 'vitest';
import {
  getAvailableFormats,
  getDefaultFormat,
  isFormatValidForCountry,
  getCountryName
} from '../../src/einvoice/formats.js';

describe('African e-invoice formats', () => {
  // South Africa
  describe('South Africa (ZA)', () => {
    it('should support PEPPOL BIS', () => {
      const formats = getAvailableFormats('ZA');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('peppol-bis');
    });

    it('should have correct country name', () => {
      expect(getCountryName('ZA')).toBe('South Africa');
    });
  });

  // Kenya
  describe('Kenya (KE)', () => {
    it('should support TIMS', () => {
      const formats = getAvailableFormats('KE');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('tims');
      expect(formats[0].fileExtension).toBe('json');
    });

    it('should have correct country name', () => {
      expect(getCountryName('KE')).toBe('Kenya');
    });
  });

  // Nigeria
  describe('Nigeria (NG)', () => {
    it('should support UBL', () => {
      const formats = getAvailableFormats('NG');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('ubl');
    });

    it('should have correct country name', () => {
      expect(getCountryName('NG')).toBe('Nigeria');
    });
  });

  // Ghana
  describe('Ghana (GH)', () => {
    it('should support e-VAT', () => {
      const formats = getAvailableFormats('GH');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('evat-gh');
    });

    it('should have correct country name', () => {
      expect(getCountryName('GH')).toBe('Ghana');
    });
  });

  // Tanzania
  describe('Tanzania (TZ)', () => {
    it('should support EFD', () => {
      const formats = getAvailableFormats('TZ');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('efd-tz');
      expect(formats[0].fileExtension).toBe('json');
    });

    it('should have correct country name', () => {
      expect(getCountryName('TZ')).toBe('Tanzania');
    });
  });

  // Rwanda
  describe('Rwanda (RW)', () => {
    it('should support EBM', () => {
      const formats = getAvailableFormats('RW');
      expect(formats).toHaveLength(1);
      expect(formats[0].format).toBe('ebm');
      expect(formats[0].fileExtension).toBe('json');
    });

    it('should have correct country name', () => {
      expect(getCountryName('RW')).toBe('Rwanda');
    });
  });
});

describe('African format validation', () => {
  it('should validate TIMS only for Kenya', () => {
    expect(isFormatValidForCountry('tims', 'KE')).toBe(true);
    expect(isFormatValidForCountry('tims', 'ZA')).toBe(false);
  });

  it('should validate e-VAT only for Ghana', () => {
    expect(isFormatValidForCountry('evat-gh', 'GH')).toBe(true);
    expect(isFormatValidForCountry('evat-gh', 'KE')).toBe(false);
  });
});

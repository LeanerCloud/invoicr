import { describe, it, expect } from 'vitest';
import {
  allLanguages,
  defaultActiveLanguages,
  defaultEmailContent,
  defaultUITranslations,
  defaultInvoiceEmailContent,
  getLanguageInfo,
} from './defaults';

describe('defaults', () => {
  describe('allLanguages', () => {
    it('should contain common languages', () => {
      const codes = allLanguages.map(l => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('de');
      expect(codes).toContain('fr');
      expect(codes).toContain('ro');
    });

    it('should have proper structure for each language', () => {
      allLanguages.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(typeof lang.code).toBe('string');
        expect(lang.code.length).toBeGreaterThanOrEqual(2);
        expect(lang.code.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('defaultActiveLanguages', () => {
    it('should contain en, de, and ro', () => {
      expect(defaultActiveLanguages).toEqual(['en', 'de', 'ro']);
    });
  });

  describe('defaultEmailContent', () => {
    it('should have content for all default active languages', () => {
      defaultActiveLanguages.forEach(lang => {
        expect(defaultEmailContent[lang]).toBeDefined();
        expect(defaultEmailContent[lang].subject).toBeTruthy();
        expect(defaultEmailContent[lang].body).toBeTruthy();
      });
    });

    it('should contain LeanerCloud in subjects', () => {
      expect(defaultEmailContent.en.subject).toContain('LeanerCloud');
      expect(defaultEmailContent.de.subject).toContain('LeanerCloud');
    });
  });

  describe('defaultUITranslations', () => {
    it('should have translations for all default active languages', () => {
      defaultActiveLanguages.forEach(lang => {
        expect(defaultUITranslations[lang]).toBeDefined();
        expect(defaultUITranslations[lang].generateInvoice).toBeTruthy();
        expect(defaultUITranslations[lang].save).toBeTruthy();
        expect(defaultUITranslations[lang].cancel).toBeTruthy();
      });
    });

    it('should have all required UI keys', () => {
      const requiredKeys = [
        'generateInvoice',
        'billingMonth',
        'quantity',
        'outputOptions',
        'generatePdf',
        'generateEInvoice',
        'preview',
        'invoiceDate',
        'dueDate',
        'subtotal',
        'tax',
        'total',
        'invoiceGenerated',
        'openPdf',
        'emailInvoice',
        'openEInvoice',
        'clients',
        'newClient',
        'editClient',
        'provider',
        'save',
        'cancel',
        'back',
        'loading',
      ];

      requiredKeys.forEach(key => {
        expect(defaultUITranslations.en).toHaveProperty(key);
      });
    });
  });

  describe('defaultInvoiceEmailContent', () => {
    it('should have content for all default active languages', () => {
      defaultActiveLanguages.forEach(lang => {
        expect(defaultInvoiceEmailContent[lang]).toBeDefined();
        expect(defaultInvoiceEmailContent[lang].subject).toBeTruthy();
        expect(defaultInvoiceEmailContent[lang].body).toBeTruthy();
      });
    });

    it('should contain placeholders in templates', () => {
      expect(defaultInvoiceEmailContent.en.subject).toContain('{{invoiceNumber}}');
      expect(defaultInvoiceEmailContent.en.body).toContain('{{monthName}}');
      expect(defaultInvoiceEmailContent.en.body).toContain('{{serviceDescription}}');
      expect(defaultInvoiceEmailContent.en.body).toContain('{{totalAmount}}');
    });
  });

  describe('getLanguageInfo', () => {
    it('should return language info for known languages', () => {
      const english = getLanguageInfo('en');
      expect(english.code).toBe('en');
      expect(english.name).toBe('English');
      expect(english.nativeName).toBe('English');

      const german = getLanguageInfo('de');
      expect(german.code).toBe('de');
      expect(german.name).toBe('German');
      expect(german.nativeName).toBe('Deutsch');
    });

    it('should return fallback for unknown language codes', () => {
      const unknown = getLanguageInfo('xyz');
      expect(unknown.code).toBe('xyz');
      expect(unknown.name).toBe('XYZ');
      expect(unknown.nativeName).toBe('xyz');
    });
  });
});

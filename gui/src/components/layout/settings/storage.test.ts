import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredLanguage,
  getStoredActiveLanguages,
  getStoredEmailContent,
  getStoredInvoiceEmailContent,
  getStoredUITranslations,
  getStoredPlaceholderLanguages,
} from './storage';
import { defaultActiveLanguages, defaultEmailContent, defaultInvoiceEmailContent, defaultUITranslations } from './defaults';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getStoredLanguage', () => {
    it('should return "en" when no language is stored', () => {
      expect(getStoredLanguage()).toBe('en');
    });

    it('should return stored language', () => {
      localStorage.setItem('invoicr_language', 'de');
      expect(getStoredLanguage()).toBe('de');
    });
  });

  describe('getStoredActiveLanguages', () => {
    it('should return default languages when nothing is stored', () => {
      expect(getStoredActiveLanguages()).toEqual(defaultActiveLanguages);
    });

    it('should return stored languages', () => {
      localStorage.setItem('invoicr_active_languages', JSON.stringify(['en', 'fr']));
      expect(getStoredActiveLanguages()).toEqual(['en', 'fr']);
    });

    it('should return default languages on invalid JSON', () => {
      localStorage.setItem('invoicr_active_languages', 'invalid json');
      expect(getStoredActiveLanguages()).toEqual(defaultActiveLanguages);
    });
  });

  describe('getStoredEmailContent', () => {
    it('should return default email content when nothing is stored', () => {
      expect(getStoredEmailContent()).toEqual(defaultEmailContent);
    });

    it('should merge stored with defaults', () => {
      const custom = { en: { subject: 'Custom Subject', body: 'Custom Body' } };
      localStorage.setItem('invoicr_email_translations', JSON.stringify(custom));
      const result = getStoredEmailContent();
      expect(result.en.subject).toBe('Custom Subject');
      expect(result.de).toEqual(defaultEmailContent.de);
    });

    it('should return defaults on invalid JSON', () => {
      localStorage.setItem('invoicr_email_translations', 'not json');
      expect(getStoredEmailContent()).toEqual(defaultEmailContent);
    });
  });

  describe('getStoredInvoiceEmailContent', () => {
    it('should return default invoice email content when nothing is stored', () => {
      expect(getStoredInvoiceEmailContent()).toEqual(defaultInvoiceEmailContent);
    });

    it('should merge stored with defaults', () => {
      const custom = { en: { subject: 'Invoice Subject', body: 'Invoice Body' } };
      localStorage.setItem('invoicr_invoice_email_translations', JSON.stringify(custom));
      const result = getStoredInvoiceEmailContent();
      expect(result.en.subject).toBe('Invoice Subject');
      expect(result.de).toEqual(defaultInvoiceEmailContent.de);
    });

    it('should return defaults on invalid JSON', () => {
      localStorage.setItem('invoicr_invoice_email_translations', 'bad json');
      expect(getStoredInvoiceEmailContent()).toEqual(defaultInvoiceEmailContent);
    });
  });

  describe('getStoredUITranslations', () => {
    it('should return default UI translations when nothing is stored', () => {
      expect(getStoredUITranslations()).toEqual(defaultUITranslations);
    });

    it('should deep merge stored UI translations', () => {
      const custom = {
        en: { generateInvoice: 'Create Invoice' },
        fr: { generateInvoice: 'Creer Facture' }
      };
      localStorage.setItem('invoicr_ui_translations', JSON.stringify(custom));
      const result = getStoredUITranslations();
      expect(result.en.generateInvoice).toBe('Create Invoice');
      expect(result.en.billingMonth).toBe(defaultUITranslations.en.billingMonth);
      expect(result.fr.generateInvoice).toBe('Creer Facture');
      expect(result.fr.billingMonth).toBe(defaultUITranslations.en.billingMonth);
    });

    it('should return defaults on invalid JSON', () => {
      localStorage.setItem('invoicr_ui_translations', 'not valid');
      expect(getStoredUITranslations()).toEqual(defaultUITranslations);
    });
  });

  describe('getStoredPlaceholderLanguages', () => {
    it('should return empty array when nothing is stored', () => {
      expect(getStoredPlaceholderLanguages()).toEqual([]);
    });

    it('should return stored placeholder languages', () => {
      localStorage.setItem('invoicr_placeholder_languages', JSON.stringify(['fr', 'es']));
      expect(getStoredPlaceholderLanguages()).toEqual(['fr', 'es']);
    });

    it('should return empty array on invalid JSON', () => {
      localStorage.setItem('invoicr_placeholder_languages', 'invalid');
      expect(getStoredPlaceholderLanguages()).toEqual([]);
    });
  });
});

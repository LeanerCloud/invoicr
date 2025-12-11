import { describe, it, expect } from 'vitest';
import { validateProvider, validateClient } from '../src/schemas/index.js';

describe('validateProvider', () => {
  const validProvider = {
    name: 'Test Provider',
    address: {
      street: '123 Main St',
      city: 'Berlin 10115'
    },
    phone: '+49 123 456789',
    email: 'test@example.com',
    bank: {
      name: 'Test Bank',
      iban: 'DE12345678901234567890',
      bic: 'TESTBIC'
    },
    taxNumber: '123/456/789'
  };

  it('should validate a valid provider config', () => {
    const result = validateProvider(validProvider);
    expect(result.name).toBe('Test Provider');
    expect(result.email).toBe('test@example.com');
  });

  it('should accept optional vatId', () => {
    const providerWithVat = { ...validProvider, vatId: 'DE123456789' };
    const result = validateProvider(providerWithVat);
    expect(result.vatId).toBe('DE123456789');
  });

  it('should accept optional logoPath', () => {
    const providerWithLogo = { ...validProvider, logoPath: 'logo.png' };
    const result = validateProvider(providerWithLogo);
    expect(result.logoPath).toBe('logo.png');
  });

  it('should throw on missing name', () => {
    const invalid = { ...validProvider, name: '' };
    expect(() => validateProvider(invalid)).toThrow('Invalid provider.json');
  });

  it('should throw on invalid email', () => {
    const invalid = { ...validProvider, email: 'not-an-email' };
    expect(() => validateProvider(invalid)).toThrow('Invalid provider.json');
  });

  it('should throw on missing bank details', () => {
    const invalid = { ...validProvider, bank: { name: '', iban: '', bic: '' } };
    expect(() => validateProvider(invalid)).toThrow('Invalid provider.json');
  });
});

describe('validateClient', () => {
  const validClient = {
    name: 'Acme Corp',
    address: {
      street: '456 Business Ave',
      city: 'New York, NY 10001'
    },
    language: 'en',
    invoicePrefix: 'AC',
    nextInvoiceNumber: 1,
    service: {
      description: 'Consulting Services',
      billingType: 'hourly',
      rate: 150,
      currency: 'USD'
    }
  };

  it('should validate a valid client config', () => {
    const result = validateClient(validClient);
    expect(result.name).toBe('Acme Corp');
    expect(result.invoicePrefix).toBe('AC');
  });

  it('should accept German language', () => {
    const germanClient = { ...validClient, language: 'de' };
    const result = validateClient(germanClient);
    expect(result.language).toBe('de');
  });

  it('should accept daily billing type', () => {
    const dailyClient = {
      ...validClient,
      service: { ...validClient.service, billingType: 'daily' }
    };
    const result = validateClient(dailyClient);
    expect(result.service.billingType).toBe('daily');
  });

  it('should accept fixed billing type', () => {
    const fixedClient = {
      ...validClient,
      service: { ...validClient.service, billingType: 'fixed' }
    };
    const result = validateClient(fixedClient);
    expect(result.service.billingType).toBe('fixed');
  });

  it('should accept EUR currency', () => {
    const eurClient = {
      ...validClient,
      service: { ...validClient.service, currency: 'EUR' }
    };
    const result = validateClient(eurClient);
    expect(result.service.currency).toBe('EUR');
  });

  it('should accept translated service description', () => {
    const translatedClient = {
      ...validClient,
      service: {
        ...validClient.service,
        description: { de: 'Beratung', en: 'Consulting' }
      }
    };
    const result = validateClient(translatedClient);
    expect(typeof result.service.description).toBe('object');
  });

  it('should accept optional emailLanguage', () => {
    const clientWithEmailLang = { ...validClient, emailLanguage: 'de' };
    const result = validateClient(clientWithEmailLang);
    expect(result.emailLanguage).toBe('de');
  });

  it('should accept optional projectReference', () => {
    const clientWithRef = { ...validClient, projectReference: 'Project Alpha' };
    const result = validateClient(clientWithRef);
    expect(result.projectReference).toBe('Project Alpha');
  });

  it('should accept optional paymentTermsDays', () => {
    const clientWithTerms = { ...validClient, paymentTermsDays: 30 };
    const result = validateClient(clientWithTerms);
    expect(result.paymentTermsDays).toBe(30);
  });

  it('should accept null paymentTermsDays for immediate payment', () => {
    const clientWithNull = { ...validClient, paymentTermsDays: null };
    const result = validateClient(clientWithNull);
    expect(result.paymentTermsDays).toBeNull();
  });

  it('should accept optional email config', () => {
    const clientWithEmail = {
      ...validClient,
      email: {
        to: ['client@example.com'],
        cc: ['accounting@example.com']
      }
    };
    const result = validateClient(clientWithEmail);
    expect(result.email?.to).toEqual(['client@example.com']);
    expect(result.email?.cc).toEqual(['accounting@example.com']);
  });

  it('should accept optional lineItems', () => {
    const clientWithLineItems = {
      ...validClient,
      lineItems: [
        { description: 'Development', quantity: 40, rate: 150, billingType: 'hourly' },
        { description: 'Setup', quantity: 500, rate: 1, billingType: 'fixed' }
      ]
    };
    const result = validateClient(clientWithLineItems);
    expect(result.lineItems?.length).toBe(2);
  });

  it('should accept optional taxRate', () => {
    const clientWithTax = { ...validClient, taxRate: 0.19 };
    const result = validateClient(clientWithTax);
    expect(result.taxRate).toBe(0.19);
  });

  it('should accept optional template', () => {
    const clientWithTemplate = { ...validClient, template: 'minimal' };
    const result = validateClient(clientWithTemplate);
    expect(result.template).toBe('minimal');
  });

  it('should throw on invalid language', () => {
    const invalid = { ...validClient, language: 'fr' };
    expect(() => validateClient(invalid)).toThrow('Invalid client config');
  });

  it('should throw on invalid billing type', () => {
    const invalid = {
      ...validClient,
      service: { ...validClient.service, billingType: 'monthly' }
    };
    expect(() => validateClient(invalid)).toThrow('Invalid client config');
  });

  it('should throw on invalid currency', () => {
    const invalid = {
      ...validClient,
      service: { ...validClient.service, currency: 'GBP' }
    };
    expect(() => validateClient(invalid)).toThrow('Invalid client config');
  });

  it('should throw on negative invoice number', () => {
    const invalid = { ...validClient, nextInvoiceNumber: -1 };
    expect(() => validateClient(invalid)).toThrow('Invalid client config');
  });

  it('should throw on taxRate > 1', () => {
    const invalid = { ...validClient, taxRate: 1.5 };
    expect(() => validateClient(invalid)).toThrow('Invalid client config');
  });

  it('should throw on invalid template', () => {
    const invalid = { ...validClient, template: 'custom' };
    expect(() => validateClient(invalid)).toThrow('Invalid client config');
  });
});

import { describe, it, expect } from 'vitest';
import PizZip from 'pizzip';
import {
  contextToTemplateData,
  generateFromTemplate,
  getBuiltInTemplates,
  getTemplatePath,
} from '../src/lib/template-generator.js';
import type { InvoiceContext } from '../src/types.js';

function makeContext(correspondentBic?: string): InvoiceContext {
  const translations = new Proxy({ email: { subject: 's', body: 'b' } }, {
    get: (target, key) => (key in target ? target[key as 'email'] : String(key)),
  });
  return {
    provider: {
      name: 'Provider',
      address: { street: '1 St', city: 'Berlin' },
      phone: '1',
      email: 'p@example.com',
      bank: { name: 'Bank', iban: 'DE00', bic: 'MAINBIC' },
      taxNumber: '1',
    },
    client: {
      name: 'Client',
      address: { street: '2 St', city: 'NY' },
      language: 'en',
      invoicePrefix: 'TC',
      nextInvoiceNumber: 1,
      service: { description: 'Consulting', billingType: 'fixed', rate: 1, currency: 'USD' },
      email: { to: ['c@example.com'] },
    },
    translations,
    invoiceNumber: 'TC-001',
    invoiceDate: '1 Oct 2026',
    servicePeriod: 'September 2026',
    monthName: 'September 2026',
    totalAmount: 100,
    quantity: 100,
    rate: 1,
    billingType: 'fixed',
    currency: 'USD',
    lang: 'en',
    serviceDescription: 'Consulting',
    emailServiceDescription: 'Consulting',
    bankDetails: { name: 'Bank', iban: 'DE00', bic: 'MAINBIC', correspondentBic },
    lineItems: [{ description: 'Consulting', quantity: 100, rate: 1, billingType: 'fixed', total: 100 }],
    subtotal: 100,
    taxAmount: 0,
    taxRate: 0,
  } as unknown as InvoiceContext;
}

async function renderText(template: string, correspondentBic?: string): Promise<string> {
  const buf = await generateFromTemplate(
    getTemplatePath(template),
    contextToTemplateData(makeContext(correspondentBic))
  );
  return new PizZip(buf).file('word/document.xml')!.asText().replace(/<[^>]+>/g, ' ');
}

describe.each(getBuiltInTemplates())('%s template correspondent BIC', (template) => {
  it('renders the correspondent BIC and label when the account has one', async () => {
    const text = await renderText(template, 'CORRBIC1');
    expect(text).toContain('CORRBIC1');
    expect(text).toContain('Correspondent Bank BIC');
  });

  it('omits the correspondent BIC line when the account has none', async () => {
    const text = await renderText(template);
    expect(text).toContain('MAINBIC');
    expect(text).not.toContain('Correspondent Bank BIC');
  });
});

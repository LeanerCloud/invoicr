/**
 * Template Generator
 * Generates DOCX invoices using docxtemplater with user-editable templates
 */
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const expressionParser = require('docxtemplater/expressions.js');
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { InvoiceContext } from '../types.js';
import { formatCurrency } from '../utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface TemplateData {
  provider: {
    name: string;
    address: { street: string; city: string; country?: string };
    phone: string;
    email: string;
    taxNumber: string;
    vatId?: string;
  };
  client: {
    name: string;
    address: { street: string; city: string; country?: string };
  };
  bank: {
    name: string;
    iban: string;
    bic: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  servicePeriod: string;
  projectRef: string;
  lineItems: Array<{
    description: string;
    quantity: string;
    rate: string;
    total: string;
  }>;
  subtotal: string;
  taxRate: number;
  tax: string;
  totalAmount: string;
  currency: string;
  taxNote: string;
  paymentTerms: string;
  /** Billing-type-specific quantity column header (e.g., "Tage", "Stunden", "Qty") */
  quantityHeader: string;
  /** Whether to show tax-related rows (false when taxRate is 0) */
  showTax: boolean;
  translations: Record<string, string>;
}

/**
 * Get path to built-in templates directory
 */
export function getBuiltInTemplatesDir(): string {
  return path.join(__dirname, '../../templates');
}

/**
 * Get list of built-in template names
 */
export function getBuiltInTemplates(): string[] {
  return ['default', 'minimal', 'detailed'];
}

/**
 * Check if a template name is a built-in template
 */
export function isBuiltInTemplate(templateName: string): boolean {
  return getBuiltInTemplates().includes(templateName);
}

/**
 * Get the path to a template file
 * Checks persona's custom templates first, then falls back to built-in
 */
export function getTemplatePath(
  templateName: string,
  personaDir?: string
): string {
  // Check for custom template in persona folder first
  if (personaDir) {
    const customPath = path.join(personaDir, 'templates', `${templateName}.docx`);
    if (fs.existsSync(customPath)) {
      return customPath;
    }
  }

  // Fall back to built-in templates
  const builtInPath = path.join(getBuiltInTemplatesDir(), `${templateName}.docx`);
  if (fs.existsSync(builtInPath)) {
    return builtInPath;
  }

  throw new Error(`Template not found: ${templateName}`);
}

/**
 * List all available templates for a persona
 */
export function listTemplates(personaDir?: string): { builtIn: string[]; custom: string[] } {
  const builtIn = getBuiltInTemplates();
  const custom: string[] = [];

  if (personaDir) {
    const customTemplatesDir = path.join(personaDir, 'templates');
    if (fs.existsSync(customTemplatesDir)) {
      const files = fs.readdirSync(customTemplatesDir);
      for (const file of files) {
        if (file.endsWith('.docx') && !file.startsWith('.')) {
          const name = path.basename(file, '.docx');
          // Don't include if it shadows a built-in
          if (!builtIn.includes(name)) {
            custom.push(name);
          }
        }
      }
    }
  }

  return { builtIn, custom };
}

/**
 * Convert InvoiceContext to TemplateData for docxtemplater
 */
export function contextToTemplateData(ctx: InvoiceContext): TemplateData {
  const t = ctx.translations;
  const currency = ctx.currency;
  const lang = ctx.lang;

  // Format payment terms
  const paymentDays = ctx.client?.paymentTermsDays;
  const paymentTerms = paymentDays
    ? t.paymentTerms?.replace('{{days}}', paymentDays.toString()) || ''
    : t.paymentImmediate || '';

  // Tax note (for German invoices not charging VAT)
  const taxNote = (lang === 'de' && ctx.taxRate === 0 && t.taxNote) ? t.taxNote : '';

  // Determine quantity column header based on billing type
  let quantityHeader: string;
  if (ctx.billingType === 'daily') {
    quantityHeader = t.days || 'Days';
  } else if (ctx.billingType === 'hourly') {
    quantityHeader = t.hours || 'Hours';
  } else {
    quantityHeader = t.quantity || 'Qty';
  }

  // Get country string (handle potential object structure)
  const getCountryString = (country: string | { de?: string; en?: string } | undefined): string => {
    if (!country) return '';
    if (typeof country === 'string') return country;
    return country[lang as 'de' | 'en'] || country.en || '';
  };

  return {
    provider: {
      name: ctx.provider.name,
      address: {
        street: ctx.provider.address.street,
        city: ctx.provider.address.city,
        country: getCountryString(ctx.provider.address.country),
      },
      phone: ctx.provider.phone,
      email: ctx.provider.email,
      taxNumber: ctx.provider.taxNumber,
      vatId: ctx.provider.vatId || '',
    },
    client: {
      name: ctx.client.name,
      address: {
        street: ctx.client.address.street,
        city: ctx.client.address.city,
        country: getCountryString(ctx.client.address.country),
      },
    },
    bank: {
      name: ctx.bankDetails.name,
      iban: ctx.bankDetails.iban,
      bic: ctx.bankDetails.bic,
    },
    invoiceNumber: ctx.invoiceNumber,
    invoiceDate: ctx.invoiceDate,
    dueDate: ctx.dueDate || '',
    servicePeriod: ctx.servicePeriod,
    projectRef: ctx.client.projectReference || '',
    lineItems: ctx.lineItems.map(item => ({
      description: `${item.description}, ${ctx.monthName}`,
      quantity: item.quantity.toString(),
      rate: formatCurrency(item.rate, currency, lang),
      total: formatCurrency(item.total, currency, lang),
    })),
    subtotal: formatCurrency(ctx.subtotal, currency, lang),
    taxRate: ctx.taxRate * 100,
    tax: formatCurrency(ctx.taxAmount, currency, lang),
    totalAmount: formatCurrency(ctx.totalAmount, currency, lang),
    currency,
    taxNote,
    paymentTerms,
    quantityHeader,
    showTax: ctx.taxRate > 0,
    translations: {
      invoice: t.invoice || 'Invoice',
      invoiceNr: t.invoiceNr || 'Invoice No.',
      invoiceDate: t.invoiceDate || 'Date',
      dueDate: t.dueDate || 'Due Date',
      servicePeriod: t.servicePeriod || 'Service Period',
      projectReference: t.projectReference || 'Project Reference',
      serviceProvider: t.serviceProvider || 'Service Provider',
      client: t.client || 'Client',
      description: t.description || 'Description',
      quantity: t.quantity || 'Qty',
      rate: t.unitPrice || 'Rate',
      total: t.total || 'Total',
      subtotal: t.subtotal || 'Subtotal',
      tax: (t.tax || 'Tax').replace('{{rate}}', String(Math.round(ctx.taxRate * 100))),
      totalAmount: t.total || 'Total',
      bankDetails: t.bankDetails || 'Bank Details',
      bank: t.bank || 'Bank',
      iban: t.iban || 'IBAN',
      bic: t.bic || 'BIC',
      taxNumber: t.taxNumber || 'Tax Number',
      vatId: t.vatId || 'VAT ID',
      reference: lang === 'de' ? 'Verwendungszweck' : 'Reference',
      thankYou: t.thankYou || 'Thank you for your business!',
      serviceChargesIntro: t.serviceChargesIntro || 'Services rendered:',
    },
  };
}

/**
 * Generate a DOCX from a template and invoice data
 */
export async function generateFromTemplate(
  templatePath: string,
  data: TemplateData
): Promise<Buffer> {
  // Read template
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  // Create docxtemplater instance with expression parser for nested property access
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: expressionParser,
  });

  // Render with data
  doc.render(data);

  // Generate output buffer
  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return buf;
}

/**
 * Generate invoice DOCX using a template
 */
export async function generateInvoiceFromTemplate(
  ctx: InvoiceContext,
  templateName: string = 'default',
  personaDir?: string
): Promise<Buffer> {
  const templatePath = getTemplatePath(templateName, personaDir);
  const data = contextToTemplateData(ctx);
  return generateFromTemplate(templatePath, data);
}

/**
 * Copy a built-in template to a persona's custom templates for editing
 */
export function copyTemplateForEditing(
  templateName: string,
  personaDir: string,
  newName?: string
): string {
  const sourcePath = path.join(getBuiltInTemplatesDir(), `${templateName}.docx`);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Built-in template not found: ${templateName}`);
  }

  const templatesDir = path.join(personaDir, 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const targetName = newName || `${templateName}-custom`;
  const targetPath = path.join(templatesDir, `${targetName}.docx`);

  fs.copyFileSync(sourcePath, targetPath);
  return targetPath;
}

/**
 * Delete a custom template
 */
export function deleteCustomTemplate(
  templateName: string,
  personaDir: string
): void {
  if (isBuiltInTemplate(templateName)) {
    throw new Error('Cannot delete built-in templates');
  }

  const templatePath = path.join(personaDir, 'templates', `${templateName}.docx`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  fs.unlinkSync(templatePath);
}

/**
 * Rename a custom template
 */
export function renameCustomTemplate(
  oldName: string,
  newName: string,
  personaDir: string
): string {
  if (isBuiltInTemplate(oldName)) {
    throw new Error('Cannot rename built-in templates');
  }

  const safeName = newName.replace(/[^a-zA-Z0-9-_]/g, '_');
  if (isBuiltInTemplate(safeName)) {
    throw new Error(`Cannot use built-in template name: ${safeName}`);
  }

  const oldPath = path.join(personaDir, 'templates', `${oldName}.docx`);
  if (!fs.existsSync(oldPath)) {
    throw new Error(`Template not found: ${oldName}`);
  }

  const newPath = path.join(personaDir, 'templates', `${safeName}.docx`);
  if (fs.existsSync(newPath)) {
    throw new Error(`Template already exists: ${safeName}`);
  }

  fs.renameSync(oldPath, newPath);
  return newPath;
}

/**
 * Upload a custom template
 */
export function uploadCustomTemplate(
  personaDir: string,
  templateName: string,
  buffer: Buffer
): string {
  // Validate it's a valid DOCX by trying to open it
  try {
    new PizZip(buffer);
  } catch {
    throw new Error('Invalid DOCX file');
  }

  // Sanitize template name
  const safeName = templateName.replace(/[^a-zA-Z0-9-_]/g, '_');
  if (isBuiltInTemplate(safeName)) {
    throw new Error(`Cannot overwrite built-in template: ${safeName}`);
  }

  const templatesDir = path.join(personaDir, 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const targetPath = path.join(templatesDir, `${safeName}.docx`);
  fs.writeFileSync(targetPath, buffer);

  return targetPath;
}

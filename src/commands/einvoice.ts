#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Provider, Client, Translations, InvoiceContext, ResolvedLineItem, EInvoiceFormat, CountryCode } from '../types.js';
import { formatDate, getServiceDescription, calculateDueDate } from '../utils.js';
import { validateProvider, validateClient } from '../schemas/index.js';
import {
  canGenerateEInvoice,
  getDefaultFormat,
  getAvailableFormats,
  validateForEInvoice,
  generateEInvoice,
  saveEInvoice,
  getSupportedCountries,
  getCountryName
} from '../einvoice/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

// Check for --list-formats flag
if (args.includes('--list-formats')) {
  listFormats();
  process.exit(0);
}

// Check for --validate-only flag
const validateOnly = args.includes('--validate-only');

// Check for --format flag
const formatArg = args.find(a => a.startsWith('--format='));
const requestedFormat = formatArg ? formatArg.split('=')[1] as EInvoiceFormat : undefined;

// Filter out flags to get positional arguments
const positionalArgs = args.filter(a => !a.startsWith('--'));

if (positionalArgs.length < 1) {
  console.error('Usage: invoicr-einvoice <client-folder> [--format=FORMAT] [--validate-only]');
  console.error('');
  console.error('Generate e-invoice XML from existing invoice data.');
  console.error('');
  console.error('Options:');
  console.error('  --format=FORMAT    Specify e-invoice format (e.g., xrechnung, zugferd)');
  console.error('  --validate-only    Only validate, do not generate');
  console.error('  --list-formats     List available formats by country');
  console.error('  --help             Show this help message');
  console.error('');
  console.error('Examples:');
  console.error('  invoicr-einvoice acme-xrechnung');
  console.error('  invoicr-einvoice acme-daily --format=xrechnung');
  console.error('  invoicr-einvoice acme-hourly --validate-only');
  process.exit(1);
}

const clientFolder = positionalArgs[0];

// Load configuration files
const cwd = process.cwd();
const installDir = path.join(__dirname, '..', '..');

// Provider: check cwd first, then installation directory
const cwdProviderPath = path.join(cwd, 'provider.json');
const installProviderPath = path.join(installDir, 'provider.json');
const providerPath = fs.existsSync(cwdProviderPath) ? cwdProviderPath : installProviderPath;

// Client: check cwd paths first, then installation directory paths
// New format: customer_data.json, legacy format: <name>.json
const cwdNewPath = path.join(cwd, 'clients', clientFolder, 'customer_data.json');
const cwdClientsPath = path.join(cwd, 'clients', clientFolder, `${clientFolder}.json`);
const cwdLegacyPath = path.join(cwd, clientFolder, `${clientFolder}.json`);
const installNewPath = path.join(installDir, 'clients', clientFolder, 'customer_data.json');
const installClientsPath = path.join(installDir, 'clients', clientFolder, `${clientFolder}.json`);
const installLegacyPath = path.join(installDir, clientFolder, `${clientFolder}.json`);
const examplePath = path.join(installDir, 'examples', `${clientFolder}.json`);

const clientPath = fs.existsSync(cwdNewPath) ? cwdNewPath :
                   fs.existsSync(cwdClientsPath) ? cwdClientsPath :
                   fs.existsSync(cwdLegacyPath) ? cwdLegacyPath :
                   fs.existsSync(installNewPath) ? installNewPath :
                   fs.existsSync(installClientsPath) ? installClientsPath :
                   fs.existsSync(installLegacyPath) ? installLegacyPath :
                   examplePath;

if (!fs.existsSync(providerPath)) {
  console.error(`Provider config not found. Please create provider.json in ${cwd}`);
  process.exit(1);
}
if (!fs.existsSync(clientPath)) {
  console.error(`Client config not found: ${clientFolder}`);
  process.exit(1);
}

// Load and validate configurations
let provider: Provider;
let client: Client;

try {
  const providerData = JSON.parse(fs.readFileSync(providerPath, 'utf8'));
  provider = validateProvider(providerData);
} catch (err) {
  console.error('Failed to load provider.json:', err instanceof Error ? err.message : err);
  process.exit(1);
}

try {
  const clientData = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
  client = validateClient(clientData);
} catch (err) {
  console.error('Failed to load client config:', err instanceof Error ? err.message : err);
  process.exit(1);
}

// Check country codes
const providerCC = provider.countryCode as CountryCode | undefined;
const clientCC = client.countryCode as CountryCode | undefined;

if (!canGenerateEInvoice(providerCC, clientCC)) {
  if (!providerCC) {
    console.error('Error: Provider countryCode is not set.');
    console.error('Add "countryCode": "DE" (or appropriate country) to provider.json');
  }
  if (!clientCC) {
    console.error('Error: Client countryCode is not set.');
    console.error(`Add "countryCode": "DE" (or appropriate country) to ${clientPath}`);
  }
  if (providerCC && clientCC && providerCC !== clientCC) {
    console.error(`Error: Provider (${providerCC}) and client (${clientCC}) must be in the same country.`);
  }
  process.exit(1);
}

// Get format
const formatInfo = getDefaultFormat(providerCC!, requestedFormat);
if (!formatInfo) {
  console.error(`No e-invoice format available for country: ${providerCC}`);
  const available = getAvailableFormats(providerCC!);
  if (available.length > 0) {
    console.error('Available formats:');
    available.forEach(f => console.error(`  ${f.format}: ${f.description}`));
  }
  process.exit(1);
}

// Load translations
const lang = client.language || 'de';
const translationsPath = path.join(__dirname, '..', 'translations', `${lang}.json`);
const translations: Translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

// Get the most recent invoice from history
const historyPath = path.join(path.dirname(clientPath), 'history.json');
let lastInvoice: {
  invoiceNumber: string;
  date: string;
  month: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  currency: string;
} | undefined;

if (fs.existsSync(historyPath)) {
  const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  if (history.invoices && history.invoices.length > 0) {
    lastInvoice = history.invoices[history.invoices.length - 1];
  }
}

if (!lastInvoice) {
  console.error('No invoice history found. Generate an invoice first using invoicr.');
  process.exit(1);
}

// Build context from last invoice
const billingType = client.service.billingType || 'daily';
const currency = (lastInvoice.currency || client.service.currency || 'EUR') as 'EUR' | 'USD';
const rate = lastInvoice.rate || client.service.rate || 0;
const taxRate = client.taxRate || 0;

// Build line items
let lineItems: ResolvedLineItem[];
if (client.lineItems && client.lineItems.length > 0) {
  lineItems = client.lineItems.map(item => ({
    description: getServiceDescription(item.description, lang),
    quantity: item.quantity,
    rate: item.rate,
    billingType: item.billingType,
    total: item.billingType === 'fixed' ? item.quantity : item.quantity * item.rate
  }));
} else {
  const itemTotal = billingType === 'fixed' ? lastInvoice.quantity : lastInvoice.quantity * rate;
  lineItems = [{
    description: getServiceDescription(client.service.description, lang),
    quantity: lastInvoice.quantity,
    rate,
    billingType,
    total: itemTotal
  }];
}

const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
const taxAmount = subtotal * taxRate;

// Parse dates
const invoiceDateObj = new Date(lastInvoice.date);
const invoiceDate = formatDate(invoiceDateObj, lang);

let dueDate: string | undefined;
if (client.paymentTermsDays && client.paymentTermsDays > 0) {
  const dueDateObj = calculateDueDate(invoiceDateObj, client.paymentTermsDays);
  dueDate = formatDate(dueDateObj, lang);
}

// Build service description
const baseDescription = getServiceDescription(client.service.description, lang);
const serviceDescription = `${baseDescription}, ${lastInvoice.month}`;

// Get bank details
const bankDetails = client.bank || provider.bank;

// Build context
const ctx: InvoiceContext = {
  provider,
  client,
  translations,
  invoiceNumber: lastInvoice.invoiceNumber,
  invoiceDate,
  dueDate,
  servicePeriod: lastInvoice.month,
  monthName: lastInvoice.month,
  totalAmount: lastInvoice.totalAmount,
  quantity: lastInvoice.quantity,
  rate,
  billingType,
  currency,
  lang,
  serviceDescription,
  emailServiceDescription: serviceDescription,
  bankDetails,
  lineItems,
  subtotal,
  taxAmount,
  taxRate
};

// Validate
console.log(`\nValidating for ${formatInfo.format.toUpperCase()} (${formatInfo.description})...`);
const validation = validateForEInvoice(ctx, formatInfo.format, providerCC!, clientCC!);

if (validation.warnings.length > 0) {
  console.log('\nWarnings:');
  validation.warnings.forEach(w => console.log(`  ⚠ ${w}`));
}

if (!validation.valid) {
  console.error('\nValidation failed:');
  validation.errors.forEach(e => console.error(`  ✗ ${e}`));
  process.exit(1);
}

console.log('✓ Validation passed');

if (validateOnly) {
  console.log('\n--validate-only flag set, skipping generation');
  process.exit(0);
}

// Generate
console.log(`\nGenerating ${formatInfo.format.toUpperCase()} e-invoice...`);

const outputDir = path.dirname(clientPath);

generateEInvoice(ctx, providerCC!, clientCC!, {
  format: requestedFormat
}).then(async result => {
  const savedPath = await saveEInvoice(result, outputDir);
  console.log(`\n✓ E-invoice created: ${savedPath}`);
  console.log(`  Invoice: ${ctx.invoiceNumber}`);
  console.log(`  Format:  ${result.format.format} (${result.format.description})`);
}).catch(err => {
  console.error(`\nE-invoice generation failed: ${err.message}`);
  process.exit(1);
});

// Helper functions
function printHelp(): void {
  console.log('invoicr-einvoice - Generate e-invoices from existing invoice data');
  console.log('');
  console.log('Usage: invoicr-einvoice <client-folder> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --format=FORMAT    Specify e-invoice format');
  console.log('  --validate-only    Only validate, do not generate');
  console.log('  --list-formats     List available formats by country');
  console.log('  --help, -h         Show this help message');
  console.log('');
  console.log('Supported formats by country:');
  console.log('  Germany (DE):   xrechnung, zugferd');
  console.log('  Romania (RO):   cius-ro');
  console.log('  USA (US):       ubl');
  console.log('  France (FR):    factur-x, ubl');
  console.log('  Italy (IT):     fatturapa');
  console.log('  And many more... Use --list-formats for full list');
  console.log('');
  console.log('Requirements:');
  console.log('  - Both provider and client must have countryCode set');
  console.log('  - Provider and client must be in the same country');
  console.log('  - At least one invoice must exist in history');
}

function listFormats(): void {
  console.log('Available e-invoice formats by country:\n');

  const countries = getSupportedCountries();
  for (const country of countries) {
    const formats = getAvailableFormats(country);
    console.log(`${getCountryName(country)} (${country}):`);
    formats.forEach(f => {
      console.log(`  ${f.format.padEnd(15)} ${f.description}`);
    });
    console.log('');
  }
}

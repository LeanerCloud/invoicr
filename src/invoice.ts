#!/usr/bin/env node
import { Packer } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Provider, Client, Translations, InvoiceContext } from './types';
import { formatDate, formatCurrency, getServiceDescription } from './utils';
import { buildDocument } from './document';
import { createEmail } from './email';

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: npm run invoice <client-folder> <quantity> [--month=MM-YYYY] [--email] [--test]');
  console.error('');
  console.error('Examples:');
  console.error('  npm run invoice -- acme-hourly 40');
  console.error('  npm run invoice -- acme-daily 5 --month=10-2025');
  console.error('  npm run invoice -- acme-hourly 8 --email');
  console.error('  npm run invoice -- acme-daily 2 --email --test');
  process.exit(1);
}

const clientFolder = args[0];
const quantity = parseFloat(args[1]);
const monthArg = args.find(a => a.startsWith('--month='));
const shouldEmail = args.includes('--email');
const isTestMode = args.includes('--test');

// Load configuration files
// Check current working directory first, then fall back to installation directory
const cwd = process.cwd();
const installDir = path.join(__dirname, '..');

// Provider: check cwd first, then installation directory
const cwdProviderPath = path.join(cwd, 'provider.json');
const installProviderPath = path.join(installDir, 'provider.json');
const providerPath = fs.existsSync(cwdProviderPath) ? cwdProviderPath : installProviderPath;

// Client: check cwd paths first, then installation directory paths
const cwdClientsPath = path.join(cwd, 'clients', clientFolder, `${clientFolder}.json`);
const cwdLegacyPath = path.join(cwd, clientFolder, `${clientFolder}.json`);
const installClientsPath = path.join(installDir, 'clients', clientFolder, `${clientFolder}.json`);
const installLegacyPath = path.join(installDir, clientFolder, `${clientFolder}.json`);
const examplePath = path.join(installDir, 'examples', `${clientFolder}.json`);

const clientPath = fs.existsSync(cwdClientsPath) ? cwdClientsPath :
                   fs.existsSync(cwdLegacyPath) ? cwdLegacyPath :
                   fs.existsSync(installClientsPath) ? installClientsPath :
                   fs.existsSync(installLegacyPath) ? installLegacyPath :
                   examplePath;

if (!fs.existsSync(providerPath)) {
  console.error(`Provider config not found. Please create provider.json in ${cwd}`);
  console.error(`See provider.example.json for the expected format.`);
  process.exit(1);
}
if (!fs.existsSync(clientPath)) {
  console.error(`Client config not found: ${clientFolder}`);
  console.error(`Searched in: ${cwd}/clients/${clientFolder}/, ${cwd}/${clientFolder}/`);
  process.exit(1);
}

const provider: Provider = JSON.parse(fs.readFileSync(providerPath, 'utf8'));
const client: Client = JSON.parse(fs.readFileSync(clientPath, 'utf8'));

// Load translations
const lang = client.language || 'de';
const translationsPath = path.join(__dirname, 'translations', `${lang}.json`);
const translations: Translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

// Generate dates
let billingMonth = new Date();
// Default to previous month since we always charge for the previous month
billingMonth = new Date(billingMonth.getFullYear(), billingMonth.getMonth() - 1, 28);
if (monthArg) {
  const [month, year] = monthArg.replace('--month=', '').split('-');
  billingMonth = new Date(parseInt(year), parseInt(month) - 1, 28);
}

const invoiceDate = formatDate(new Date(), lang);
const lastOfMonth = new Date(billingMonth.getFullYear(), billingMonth.getMonth() + 1, 0);
const monthName = billingMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

let servicePeriod: string;
if (lang === 'de') {
  servicePeriod = billingMonth.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
} else {
  servicePeriod = monthName;
}

// Generate invoice number
const invoiceNumber = `${client.invoicePrefix}-${client.nextInvoiceNumber}`;

// Calculate totals
const billingType = client.service.billingType || 'daily';
const currency = client.service.currency || 'EUR';
const rate = client.service.rate || client.service.dailyRate || 0;
let totalAmount: number;

if (billingType === 'fixed') {
  totalAmount = quantity;
} else {
  totalAmount = quantity * rate;
}

// Build service description (append month for all billing types)
const baseDescription = getServiceDescription(client.service.description, lang);
const serviceDescription = `${baseDescription}, ${monthName}`;

// Build email service description (may use different language)
const emailLang = client.emailLanguage || lang;
const emailBaseDescription = getServiceDescription(client.service.description, emailLang);
const emailServiceDescription = `${emailBaseDescription}, ${monthName}`;

// Get bank details (client-specific or default)
const bankDetails = client.bank || provider.bank;

// Build context
const ctx: InvoiceContext = {
  provider,
  client,
  translations,
  invoiceNumber,
  invoiceDate,
  servicePeriod,
  monthName,
  totalAmount,
  quantity,
  rate,
  billingType,
  currency,
  lang,
  serviceDescription,
  emailServiceDescription,
  bankDetails
};

// Build document
const doc = buildDocument(ctx);

// Generate output filenames
const outputDir = path.dirname(clientPath);
const monthStr = billingMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '_');
const baseFilename = `${translations.filePrefix}_${invoiceNumber}_${monthStr}`;
const docxPath = path.join(outputDir, `${baseFilename}.docx`);
const pdfPath = path.join(outputDir, `${baseFilename}.pdf`);

// Generate DOCX and PDF
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(docxPath, buffer);
  console.log(`DOCX created: ${docxPath}`);

  // Convert to PDF using LibreOffice
  try {
    execSync(`soffice --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`, { stdio: 'inherit' });
    console.log(`PDF created: ${pdfPath}`);
  } catch (err) {
    console.error('PDF conversion failed. Make sure LibreOffice is installed.');
    console.error('Install with: brew install --cask libreoffice');
  }

  // Update next invoice number
  client.nextInvoiceNumber++;
  fs.writeFileSync(clientPath, JSON.stringify(client, null, 2));
  console.log(`Next invoice number updated to: ${client.nextInvoiceNumber}`);

  console.log(`\nInvoice ${invoiceNumber} generated successfully!`);
  const unitLabel = billingType === 'hourly' ? 'hour(s)' : billingType === 'daily' ? 'day(s)' : '';
  console.log(`Total: ${formatCurrency(totalAmount, currency, lang)} for ${quantity} ${unitLabel}`);

  // Create email if requested
  if (shouldEmail) {
    createEmail(ctx, pdfPath, isTestMode);
  }
});

#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Provider, Client, Translations, InvoiceContext, ResolvedLineItem, EInvoiceFormat, CountryCode } from './types.js';
import { formatDate, formatCurrency, getServiceDescription, calculateDueDate } from './utils.js';
import { generateInvoiceFromTemplate } from './lib/template-generator.js';
import { createEmail } from './email.js';
import { validateProvider, validateClient } from './schemas/index.js';
import { saveToHistory } from './history.js';
import { canGenerateEInvoice, getDefaultFormat, validateForEInvoice, generateEInvoice, saveEInvoice } from './einvoice/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

// Check for --dry-run flag
const isDryRun = args.includes('--dry-run');

// Check for --einvoice flag
const einvoiceArg = args.find(a => a.startsWith('--einvoice'));
const shouldGenerateEInvoice = einvoiceArg !== undefined;
const requestedEInvoiceFormat = einvoiceArg?.includes('=')
  ? einvoiceArg.split('=')[1] as EInvoiceFormat
  : undefined;

// Check for --template flag
const templateArg = args.find(a => a.startsWith('--template='));
const templateOverride = templateArg?.split('=')[1];

// Filter out flags to get positional arguments
const positionalArgs = args.filter(a => !a.startsWith('--'));

if (positionalArgs.length < 2) {
  console.error('Usage: invoicr <client-folder> <quantity> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --month=MM-YYYY     Specify billing month (default: previous month)');
  console.error('  --template=NAME     Use specific template (default, minimal, detailed, or custom)');
  console.error('  --email             Create email draft with invoice attached');
  console.error('  --test              Send test email to provider instead of client');
  console.error('  --dry-run           Preview invoice without generating files');
  console.error('  --einvoice          Generate e-invoice (auto-select format based on country)');
  console.error('  --einvoice=FORMAT   Generate e-invoice with specific format');
  console.error('                      Formats: xrechnung, zugferd, cius-ro, ubl, factur-x, etc.');
  console.error('');
  console.error('Examples:');
  console.error('  invoicr acme-hourly 40');
  console.error('  invoicr acme-daily 5 --month=10-2025');
  console.error('  invoicr acme-hourly 8 --email');
  console.error('  invoicr acme-daily 2 --dry-run');
  console.error('  invoicr acme-hourly 40 --einvoice');
  console.error('  invoicr acme-daily 5 --einvoice=xrechnung');
  console.error('  invoicr acme-daily 5 --template=minimal');
  process.exit(1);
}

const clientFolder = positionalArgs[0];
const quantity = parseFloat(positionalArgs[1]);
const monthArg = args.find(a => a.startsWith('--month='));
const shouldEmail = args.includes('--email');
const isTestMode = args.includes('--test');

if (isNaN(quantity) || quantity <= 0) {
  console.error('Error: quantity must be a positive number');
  process.exit(1);
}

// Load configuration files
// Check current working directory first, then fall back to installation directory
const cwd = process.cwd();
const installDir = path.join(__dirname, '..');

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
  console.error(`See provider.example.json for the expected format.`);
  console.error(`\nRun 'invoicr-init' to set up your invoicing workspace.`);
  process.exit(1);
}
if (!fs.existsSync(clientPath)) {
  console.error(`Client config not found: ${clientFolder}`);
  console.error(`Searched in: ${cwd}/clients/${clientFolder}/, ${cwd}/${clientFolder}/`);
  console.error(`\nRun 'invoicr-list' to see available clients.`);
  process.exit(1);
}

// Load and validate configurations
let provider: Provider;
let client: Client;

try {
  const providerData = JSON.parse(fs.readFileSync(providerPath, 'utf8'));
  provider = validateProvider(providerData);
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error('Failed to load provider.json');
  }
  process.exit(1);
}

try {
  const clientData = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
  client = validateClient(clientData);
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error('Failed to load client config');
  }
  process.exit(1);
}

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

const invoiceDateObj = new Date();
const invoiceDate = formatDate(invoiceDateObj, lang);
const lastOfMonth = new Date(billingMonth.getFullYear(), billingMonth.getMonth() + 1, 0);
const monthName = billingMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

// Calculate due date if payment terms are set
let dueDate: string | undefined;
if (client.paymentTermsDays && client.paymentTermsDays > 0) {
  const dueDateObj = calculateDueDate(invoiceDateObj, client.paymentTermsDays);
  dueDate = formatDate(dueDateObj, lang);
}

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
const taxRate = client.taxRate || 0;

// Build line items (from config or from service + CLI quantity)
let lineItems: ResolvedLineItem[];

if (client.lineItems && client.lineItems.length > 0) {
  // Multi-line item mode: use line items from config
  lineItems = client.lineItems.map(item => {
    const itemRate = item.rate;
    const itemTotal = item.billingType === 'fixed' ? item.quantity : item.quantity * itemRate;
    return {
      description: getServiceDescription(item.description, lang),
      quantity: item.quantity,
      rate: itemRate,
      billingType: item.billingType,
      total: itemTotal
    };
  });
} else {
  // Single-service mode: build from service + CLI quantity
  let itemTotal: number;
  if (billingType === 'fixed') {
    itemTotal = quantity;
  } else {
    itemTotal = quantity * rate;
  }
  lineItems = [{
    description: getServiceDescription(client.service.description, lang),
    quantity,
    rate,
    billingType,
    total: itemTotal
  }];
}

// Calculate subtotal, tax, and total
const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
const taxAmount = subtotal * taxRate;
const totalAmount = subtotal + taxAmount;

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
  dueDate,
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
  bankDetails,
  lineItems,
  subtotal,
  taxAmount,
  taxRate
};

// Generate output filenames
const outputDir = path.dirname(clientPath);
const monthStr = billingMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '_');
const baseFilename = `${translations.filePrefix}_${invoiceNumber}_${monthStr}`;
const docxPath = path.join(outputDir, `${baseFilename}.docx`);
const pdfPath = path.join(outputDir, `${baseFilename}.pdf`);

// Determine template name for display (CLI override takes precedence)
const effectiveTemplateName = templateOverride || client.templateName || 'default';

// Dry run - show summary and exit
if (isDryRun) {
  console.log('=== DRY RUN - Invoice Preview ===\n');
  console.log(`Client:         ${client.name}`);
  console.log(`Invoice Number: ${invoiceNumber}`);
  console.log(`Invoice Date:   ${invoiceDate}`);
  if (dueDate) {
    console.log(`Due Date:       ${dueDate}`);
  }
  console.log(`Service Period: ${servicePeriod}`);
  console.log(`Template:       ${effectiveTemplateName}`);
  console.log('');

  // Show line items
  console.log('Line Items:');
  lineItems.forEach((item, index) => {
    const unitLabel = item.billingType === 'hourly' ? 'hour(s)' : item.billingType === 'daily' ? 'day(s)' : '';
    if (item.billingType === 'fixed') {
      console.log(`  ${index + 1}. ${item.description}: ${formatCurrency(item.total, currency, lang)}`);
    } else {
      console.log(`  ${index + 1}. ${item.description}: ${item.quantity} ${unitLabel} × ${formatCurrency(item.rate, currency, lang)} = ${formatCurrency(item.total, currency, lang)}`);
    }
  });
  console.log('');

  // Show totals
  if (taxRate > 0) {
    console.log(`Subtotal:       ${formatCurrency(subtotal, currency, lang)}`);
    console.log(`Tax (${(taxRate * 100).toFixed(0)}%):       ${formatCurrency(taxAmount, currency, lang)}`);
  }
  console.log(`Total Amount:   ${formatCurrency(totalAmount, currency, lang)}`);
  console.log('');
  console.log(`Output DOCX:    ${docxPath}`);
  console.log(`Output PDF:     ${pdfPath}`);
  if (shouldEmail) {
    console.log(`Email:          Would send to ${client.email?.to?.join(', ') || 'N/A'}`);
  }
  if (shouldGenerateEInvoice) {
    const providerCC = provider.countryCode as CountryCode | undefined;
    const clientCC = client.countryCode as CountryCode | undefined;
    if (canGenerateEInvoice(providerCC, clientCC)) {
      const formatInfo = getDefaultFormat(providerCC!, requestedEInvoiceFormat);
      if (formatInfo) {
        console.log(`E-Invoice:      Would generate ${formatInfo.format.toUpperCase()} (${formatInfo.description})`);
      }
    } else {
      console.log(`E-Invoice:      Not available (country mismatch or missing countryCode)`);
    }
  }
  console.log('\n=== No files were generated ===');
  process.exit(0);
}

// Generate DOCX and PDF
generateInvoiceFromTemplate(ctx, effectiveTemplateName).then(buffer => {
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

  // Save to history
  // For fixed billing type, store qty=1 and rate=totalAmount for cleaner display
  const historyQuantity = billingType === 'fixed' ? 1 : quantity;
  const historyRate = billingType === 'fixed' ? totalAmount : rate;
  saveToHistory(outputDir, {
    invoiceNumber,
    date: invoiceDateObj.toISOString().split('T')[0],
    month: monthName,
    quantity: historyQuantity,
    rate: historyRate,
    totalAmount,
    currency,
    pdfPath
  });

  // Update next invoice number
  client.nextInvoiceNumber++;
  fs.writeFileSync(clientPath, JSON.stringify(client, null, 2));
  console.log(`Next invoice number updated to: ${client.nextInvoiceNumber}`);

  console.log(`\nInvoice ${invoiceNumber} generated successfully!`);
  const unitLabel = billingType === 'hourly' ? 'hour(s)' : billingType === 'daily' ? 'day(s)' : '';
  console.log(`Total: ${formatCurrency(totalAmount, currency, lang)} for ${quantity} ${unitLabel}`);

  // Create email if requested
  if (shouldEmail) {
    createEmail(ctx, [pdfPath], isTestMode);
  }

  // Generate e-invoice if requested
  if (shouldGenerateEInvoice) {
    const providerCC = provider.countryCode as CountryCode | undefined;
    const clientCC = client.countryCode as CountryCode | undefined;

    if (!canGenerateEInvoice(providerCC, clientCC)) {
      if (!providerCC || !clientCC) {
        console.error('\nE-invoice generation skipped: Both provider and client must have countryCode set.');
        console.error('Add "countryCode": "DE" (or appropriate country) to provider.json and client config.');
      } else if (providerCC !== clientCC) {
        console.error(`\nE-invoice generation skipped: Provider (${providerCC}) and client (${clientCC}) must be in the same country.`);
      }
    } else {
      // Get format info
      const formatInfo = getDefaultFormat(providerCC!, requestedEInvoiceFormat);
      if (!formatInfo) {
        console.error(`\nE-invoice generation failed: No format available for country ${providerCC}`);
      } else {
        // Validate before generation
        const validation = validateForEInvoice(ctx, formatInfo.format, providerCC!, clientCC!);

        if (validation.warnings.length > 0) {
          console.log('\nE-invoice warnings:');
          validation.warnings.forEach(w => console.log(`  ⚠ ${w}`));
        }

        if (!validation.valid) {
          console.error('\nE-invoice generation failed - validation errors:');
          validation.errors.forEach(e => console.error(`  ✗ ${e}`));
        } else {
          // Generate e-invoice
          console.log(`\nGenerating ${formatInfo.format.toUpperCase()} e-invoice...`);

          generateEInvoice(ctx, providerCC!, clientCC!, {
            format: requestedEInvoiceFormat
          }).then(async result => {
            // Save e-invoice file
            const savedPath = await saveEInvoice(result, outputDir);
            console.log(`E-invoice created: ${savedPath}`);
          }).catch(err => {
            console.error(`E-invoice generation error: ${err.message}`);
          });
        }
      }
    }
  }
});

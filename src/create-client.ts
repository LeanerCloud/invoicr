#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Client } from './types';

// Check current working directory first, then fall back to installation directory
const cwd = process.cwd();
const installDir = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string, defaultValue?: string): Promise<string> {
  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const fromArg = args.find(a => a.startsWith('--from='));
  const templateName = fromArg?.replace('--from=', '');

  let template: Partial<Client> = {};

  if (templateName) {
    // Check cwd first, then installation directory for templates
    const cwdClientPath = path.join(cwd, 'clients', templateName, `${templateName}.json`);
    const cwdLegacyPath = path.join(cwd, templateName, `${templateName}.json`);
    const installExamplePath = path.join(installDir, 'examples', `${templateName}.json`);
    const installClientPath = path.join(installDir, 'clients', templateName, `${templateName}.json`);

    if (fs.existsSync(cwdClientPath)) {
      template = JSON.parse(fs.readFileSync(cwdClientPath, 'utf8'));
      console.log(`Using client "${templateName}" as template\n`);
    } else if (fs.existsSync(cwdLegacyPath)) {
      template = JSON.parse(fs.readFileSync(cwdLegacyPath, 'utf8'));
      console.log(`Using client "${templateName}" as template\n`);
    } else if (fs.existsSync(installExamplePath)) {
      template = JSON.parse(fs.readFileSync(installExamplePath, 'utf8'));
      console.log(`Using example template "${templateName}"\n`);
    } else if (fs.existsSync(installClientPath)) {
      template = JSON.parse(fs.readFileSync(installClientPath, 'utf8'));
      console.log(`Using client "${templateName}" as template\n`);
    } else {
      console.error(`Template not found: ${templateName}`);
      console.error('Available examples: acme-hourly, acme-daily, acme-fixed');
      process.exit(1);
    }
  }

  console.log('Create New Client\n');

  // Basic info
  const folderName = await ask('Client folder name (lowercase, no spaces)');
  if (!folderName) {
    console.error('Folder name is required');
    process.exit(1);
  }

  // Create clients in current working directory
  const clientsDir = path.join(cwd, 'clients');
  const clientDir = path.join(clientsDir, folderName);
  if (fs.existsSync(clientDir)) {
    console.error(`Client folder already exists: ${folderName}`);
    process.exit(1);
  }

  // Ensure clients directory exists
  if (!fs.existsSync(clientsDir)) {
    fs.mkdirSync(clientsDir);
  }

  const name = await ask('Company name', template.name);
  const street = await ask('Street address', template.address?.street);
  const city = await ask('City (with postal code)', template.address?.city);

  // Invoice settings
  const language = await ask('Invoice language (de/en)', template.language || 'en') as 'de' | 'en';
  const emailLanguage = await ask('Email language (de/en, leave empty for same as invoice)', template.emailLanguage || '');
  const invoicePrefix = await ask('Invoice prefix', template.invoicePrefix || folderName.toUpperCase().slice(0, 2));
  const projectReference = await ask('Project reference (optional)', template.projectReference || '');

  // Service details
  console.log('\nService Details:');
  const serviceDescription = await ask('Service description',
    typeof template.service?.description === 'string' ? template.service.description : '');
  const billingType = await ask('Billing type (hourly/daily/fixed)', template.service?.billingType || 'hourly') as 'hourly' | 'daily' | 'fixed';
  const rate = parseFloat(await ask('Rate', template.service?.rate?.toString() || '100'));
  const currency = await ask('Currency (EUR/USD)', template.service?.currency || 'EUR') as 'EUR' | 'USD';

  // Payment
  const paymentTermsStr = await ask('Payment terms in days (leave empty for "upon receipt")',
    template.paymentTermsDays?.toString() || '');
  const paymentTermsDays = paymentTermsStr ? parseInt(paymentTermsStr) : null;

  // Bank (optional override)
  console.log('\nBank Details (leave empty to use provider default):');
  const bankName = await ask('Bank name', template.bank?.name || '');
  let bank = undefined;
  if (bankName) {
    const iban = await ask('IBAN', template.bank?.iban || '');
    const bic = await ask('BIC', template.bank?.bic || '');
    bank = { name: bankName, iban, bic };
  }

  // Email
  console.log('\nEmail Settings:');
  const emailTo = await ask('Email To (comma-separated)', template.email?.to?.join(', ') || '');
  const emailCc = await ask('Email CC (comma-separated, optional)', template.email?.cc?.join(', ') || '');

  // Build client object
  const client: Client = {
    name,
    address: { street, city },
    language,
    invoicePrefix,
    nextInvoiceNumber: 1,
    service: {
      description: serviceDescription,
      billingType,
      rate,
      currency
    },
    paymentTermsDays,
    email: {
      to: emailTo.split(',').map(e => e.trim()).filter(Boolean),
      cc: emailCc ? emailCc.split(',').map(e => e.trim()).filter(Boolean) : undefined
    }
  };

  // Add optional fields
  if (emailLanguage) {
    client.emailLanguage = emailLanguage as 'de' | 'en';
  }
  if (projectReference) {
    client.projectReference = projectReference;
  }
  if (bank) {
    client.bank = bank;
  }

  // Create folder and save
  fs.mkdirSync(clientDir);
  const clientPath = path.join(clientDir, `${folderName}.json`);
  fs.writeFileSync(clientPath, JSON.stringify(client, null, 2));

  console.log(`\nClient created: ${clientPath}`);
  console.log(`\nTo generate an invoice, run:`);
  console.log(`  invoicr ${folderName} <quantity>`);
  console.log(`  # or: npm run invoice -- ${folderName} <quantity>`);

  rl.close();
}

main().catch(err => {
  console.error(err);
  rl.close();
  process.exit(1);
});

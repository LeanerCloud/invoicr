#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const cwd = process.cwd();

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

function askYesNo(question: string, defaultYes: boolean = true): Promise<boolean> {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise(resolve => {
    rl.question(`${question} ${hint}: `, answer => {
      const a = answer.trim().toLowerCase();
      if (a === '') {
        resolve(defaultYes);
      } else {
        resolve(a === 'y' || a === 'yes');
      }
    });
  });
}

async function main() {
  const providerPath = path.join(cwd, 'provider.json');

  console.log('Invoicr Setup Wizard\n');
  console.log('This will create a provider.json file in the current directory.\n');

  // Check if provider.json already exists
  if (fs.existsSync(providerPath)) {
    const overwrite = await askYesNo('provider.json already exists. Overwrite?', false);
    if (!overwrite) {
      console.log('Aborted.');
      rl.close();
      return;
    }
  }

  // Gather provider info
  console.log('Provider Information (your business details):\n');

  const name = await ask('Business/Your name');
  if (!name) {
    console.error('Name is required');
    rl.close();
    process.exit(1);
  }

  const street = await ask('Street address');
  const city = await ask('City (with postal code)');
  const country = await ask('Country (optional)');

  const phone = await ask('Phone number');
  const email = await ask('Email address');

  console.log('\nBank Details:\n');
  const bankName = await ask('Bank name');
  const iban = await ask('IBAN');
  const bic = await ask('BIC/SWIFT');

  console.log('\nTax Information:\n');
  const taxNumber = await ask('Tax number');
  const vatId = await ask('VAT ID (optional, for EU businesses)');

  // Build provider object
  const provider: Record<string, unknown> = {
    name,
    address: {
      street,
      city,
      ...(country && { country })
    },
    phone,
    email,
    bank: {
      name: bankName,
      iban,
      bic
    },
    taxNumber,
    ...(vatId && { vatId })
  };

  // Write provider.json
  fs.writeFileSync(providerPath, JSON.stringify(provider, null, 2));
  console.log(`\nCreated: ${providerPath}`);

  // Ask about creating a sample client
  const createClient = await askYesNo('\nWould you like to create a sample client?', true);

  if (createClient) {
    const clientsDir = path.join(cwd, 'clients');
    if (!fs.existsSync(clientsDir)) {
      fs.mkdirSync(clientsDir);
    }

    console.log('\nClient Information:\n');

    const clientFolder = await ask('Client folder name (lowercase, no spaces)', 'sample-client');
    const clientDir = path.join(clientsDir, clientFolder);

    if (fs.existsSync(clientDir)) {
      console.log(`Client folder already exists: ${clientDir}`);
    } else {
      fs.mkdirSync(clientDir);

      const clientName = await ask('Client/Company name', 'Sample Company');
      const clientStreet = await ask('Client street address', '123 Main Street');
      const clientCity = await ask('Client city', 'New York, NY 10001');

      const language = await ask('Invoice language (de/en)', 'en') as 'de' | 'en';
      const invoicePrefix = await ask('Invoice prefix', clientFolder.toUpperCase().slice(0, 2));

      const billingType = await ask('Billing type (hourly/daily/fixed)', 'hourly') as 'hourly' | 'daily' | 'fixed';
      const rate = parseFloat(await ask('Rate', '100'));
      const currency = await ask('Currency (EUR/USD)', 'USD') as 'EUR' | 'USD';

      const paymentDays = await ask('Payment terms in days (leave empty for immediate)', '30');

      const clientEmail = await ask('Client email (for invoices)');

      const client = {
        name: clientName,
        address: {
          street: clientStreet,
          city: clientCity
        },
        language,
        invoicePrefix,
        nextInvoiceNumber: 1,
        service: {
          description: 'Professional Services',
          billingType,
          rate,
          currency
        },
        ...(paymentDays && { paymentTermsDays: parseInt(paymentDays) }),
        ...(clientEmail && {
          email: {
            to: [clientEmail]
          }
        })
      };

      const clientPath = path.join(clientDir, `${clientFolder}.json`);
      fs.writeFileSync(clientPath, JSON.stringify(client, null, 2));
      console.log(`\nCreated: ${clientPath}`);
    }
  }

  console.log('\nSetup complete!');
  console.log('\nNext steps:');
  console.log('  1. Edit provider.json to add any missing details');
  console.log('  2. Create or edit client configs in the clients/ folder');
  console.log('  3. Run: invoicr <client-name> <quantity>');
  console.log('  4. Run: invoicr list    to see available clients');

  rl.close();
}

main().catch(err => {
  console.error(err);
  rl.close();
  process.exit(1);
});

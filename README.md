# invoicr

A TypeScript CLI tool that generates DOCX and PDF invoices from JSON configuration files, with optional email integration for macOS.

## Features

- Generate professional invoices in DOCX and PDF formats
- Multi-language support (German & English)
- Flexible billing: hourly, daily, or fixed rates
- Multiple currencies (EUR, USD)
- Email drafts with PDF attachment (macOS Mail.app)
- Separate email language from invoice language
- Interactive client creation wizard

## Prerequisites

- Node.js (v18+)
- LibreOffice (for PDF conversion)
- Mail.app (for email feature, macOS only)

```bash
# Install LibreOffice on macOS
brew install --cask libreoffice
```

## Installation

### From npm (global)

```bash
npm install -g invoicr
```

### From source

```bash
git clone https://github.com/LeanerCloud/invoicr.git
cd invoicr
npm install
npm run build
cp provider.example.json provider.json  # Edit with your details
```

## Usage

### Generate Invoice

```bash
# If installed globally
invoicr <client-folder> <quantity> [options]

# If running from source
npm run invoice -- <client-folder> <quantity> [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--month=MM-YYYY` | Generate invoice for a specific month |
| `--email` | Create email draft in Mail.app with PDF attached |
| `--test` | Send email to provider instead of client (for testing) |

#### Examples

```bash
# Generate invoice using example templates (no client setup needed)
invoicr acme-hourly 40        # 40 hours @ $150/hr
invoicr acme-daily 5          # 5 days @ €1,200/day
invoicr acme-fixed 15000      # Fixed $15,000

# Generate invoice for a past month
invoicr acme-hourly 80 --month=10-2025

# Generate invoice and create email draft
invoicr acme-daily 2 --email

# Test email (sends to your email instead of client)
invoicr acme-daily 2 --email --test

# Use your own client (after creating with invoicr-new)
invoicr myclient 10
```

### Create New Client

```bash
# If installed globally
invoicr-new
invoicr-new --from=acme-hourly  # Use example template
invoicr-new --from=myclient     # Use existing client as template

# If running from source
npm run new-client
npm run new-client -- --from=acme-daily
```

#### Available Templates

| Template | Billing | Description |
|----------|---------|-------------|
| `acme-hourly` | Hourly | USD, English, 30-day payment terms |
| `acme-daily` | Daily | EUR, German invoice + English email, translated descriptions |
| `acme-fixed` | Fixed | USD, custom bank account, payment upon receipt |

The command will prompt for:
- Client folder name
- Company name & address
- Invoice/email language
- Invoice prefix
- Project reference (optional)
- Service description, billing type, rate, currency
- Payment terms
- Bank details (optional)
- Email recipients (To/CC)

## Project Structure

```
invoicr/
├── src/
│   ├── invoice.ts          # Main entry point
│   ├── create-client.ts    # Client creation wizard
│   ├── document.ts         # Document generation
│   ├── email.ts            # Email functionality
│   ├── types.ts            # TypeScript interfaces
│   ├── utils.ts            # Formatting utilities
│   └── translations/
│       ├── de.json         # German translations
│       └── en.json         # English translations
├── examples/
│   ├── acme-hourly.json    # Hourly billing example
│   ├── acme-daily.json     # Daily billing example
│   └── acme-fixed.json     # Fixed amount example
├── clients/                # Your client configurations
│   └── <client>/
│       └── <client>.json
├── provider.json           # Your business details (create from example)
├── provider.example.json   # Example provider config
└── package.json
```

## Configuration

### provider.json

Copy `provider.example.json` to `provider.json` and fill in your business details:

```json
{
  "name": "Your Name",
  "address": {
    "street": "Street 123",
    "city": "12345 City, Country"
  },
  "phone": "+49 123 456789",
  "email": "email@example.com",
  "bank": {
    "name": "Bank Name",
    "iban": "DE00 0000 0000 0000 0000 00",
    "bic": "BICCODE"
  },
  "taxNumber": "12/345/67890",
  "vatId": "DE123456789"
}
```

### Client JSON

Create a folder for each client with a JSON file inside (e.g., `acme/acme.json`). See `examples/` for complete templates.

#### Hourly Billing (`examples/acme-hourly.json`)

```json
{
  "name": "Acme Corp",
  "address": {
    "street": "123 Main Street",
    "city": "New York, NY 10001"
  },
  "language": "en",
  "invoicePrefix": "AC",
  "nextInvoiceNumber": 1,
  "projectReference": "Website Redesign",
  "service": {
    "description": "Frontend Development Services",
    "billingType": "hourly",
    "rate": 150,
    "currency": "USD"
  },
  "paymentTermsDays": 30,
  "email": {
    "to": ["Jane Smith <jane@acme.com>"],
    "cc": ["Accounting <billing@acme.com>"]
  }
}
```

#### Daily Billing with Translated Descriptions (`examples/acme-daily.json`)

```json
{
  "name": "Acme GmbH",
  "address": {
    "street": "Musterstraße 42",
    "city": "10115 Berlin"
  },
  "language": "de",
  "emailLanguage": "en",
  "invoicePrefix": "ACM",
  "nextInvoiceNumber": 1,
  "projectReference": "Cloud Migration Project",
  "service": {
    "description": {
      "de": "Cloud-Infrastruktur & DevOps Beratung",
      "en": "Cloud Infrastructure & DevOps Consulting"
    },
    "billingType": "daily",
    "rate": 1200,
    "currency": "EUR"
  },
  "paymentTermsDays": 14,
  "email": {
    "to": ["Max Mustermann <max@acme.de>"],
    "cc": ["Buchhaltung <accounting@acme.de>"]
  }
}
```

#### Fixed Amount with Custom Bank (`examples/acme-fixed.json`)

```json
{
  "name": "Acme Industries Ltd",
  "address": {
    "street": "100 Business Park Drive",
    "city": "London, EC1A 1BB"
  },
  "language": "en",
  "invoicePrefix": "AI",
  "nextInvoiceNumber": 1,
  "projectReference": "Mobile App Development - Phase 2",
  "service": {
    "description": "Software Development - Milestone Payment",
    "billingType": "fixed",
    "rate": 0,
    "currency": "USD"
  },
  "bank": {
    "name": "Revolut",
    "iban": "GB00 REVO 0000 0000 0000 00",
    "bic": "REVOGB21"
  },
  "paymentTermsDays": null,
  "email": {
    "to": ["John Doe <john@acme-industries.com>"]
  }
}
```

**Notes:**
- `emailLanguage`: Use a different language for emails than the invoice
- `service.description`: Can be a string or an object with `de`/`en` translations
- `bank`: Optional. Overrides provider's bank details for this client
- `paymentTermsDays`: Set to `null` for "payable upon receipt"

### Configuration Options

| Field | Description |
|-------|-------------|
| `language` | Invoice language: `"de"` (German) or `"en"` (English) |
| `emailLanguage` | Optional. Email language if different from invoice |
| `invoicePrefix` | Prefix for invoice numbers (e.g., "AC" for AC-1, AC-2) |
| `billingType` | `"hourly"`, `"daily"`, or `"fixed"` |
| `currency` | `"EUR"` or `"USD"` |
| `rate` | Rate per hour/day (ignored for fixed billing) |
| `bank` | Optional. Overrides provider's bank details |
| `paymentTermsDays` | Optional. If null, shows "payable upon receipt" |
| `projectReference` | Optional. Shown in invoice details |
| `service.description` | String or object with `de`/`en` translations |
| `email.to` | Array of recipient email addresses |
| `email.cc` | Optional. Array of CC email addresses |

## Email Feature

When using the `--email` flag, the tool creates a draft email in Mail.app with:
- **From:** Provider's email address
- **To/CC:** Pre-filled from client config (supports "Name <email>" format)
- **Subject:** Invoice number and month (e.g., "Invoice AC-1 (November 2025) - Your Name")
- **Body:** Localized template with service description and amount
- **Attachment:** PDF invoice

### Email Languages

Set `emailLanguage` in the client config to use a different language for emails than the invoice. This is useful when:
- Invoice must be in German (for accounting)
- Client prefers English communication

### Test Mode

Use `--test` to send the email to yourself (provider email) instead of the client:

```bash
invoicr acme-daily 2 --email --test
```

The subject will be prefixed with `[TEST]`.

## Output

Invoices are generated in the client's folder:
- `Rechnung_AC-1_November_2025.docx` / `.pdf` (German)
- `Invoice_AC-1_November_2025.docx` / `.pdf` (English)

The `nextInvoiceNumber` in the client JSON is automatically incremented after each invoice.

## Development

```bash
# Run invoice without building (using ts-node)
npm run dev -- acme-hourly 8

# Build TypeScript
npm run build
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run invoice` | Generate an invoice |
| `npm run new-client` | Create a new client interactively |
| `npm run dev` | Run invoice.ts directly with ts-node |

## License

MIT

## Shameless Plug

This tool is brought to you by [LeanerCloud](https://leanercloud.com). We help companies reduce their AWS costs using a mix of services and tools such as [AutoSpotting](https://autospotting.io).

Are you a freelancer with clients running workloads on AWS and notice cost optimization opportunities unrelated to your work? If you refer a client to us, we'll give you **50% of our first cost optimization invoice** from that client.

[Get in touch](mailto:cristi@leanercloud.com?subject=invoicr%20client%20referral)!

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
- **NEW in 1.5.0:**
  - ESM modules (modern JavaScript module system)
  - Unit tests with Vitest (203 tests, 96% coverage)
- **In 1.4.0:**
  - Custom invoice templates (default, minimal, detailed)
  - `invoicr-export` - Export invoice history to CSV/JSON
  - `invoicr-bulk` - Generate multiple invoices at once
- **In 1.3.0:**
  - Multiple line items per invoice
  - Tax/VAT calculation with configurable rates
  - Logo support in invoice header
- **In 1.2.0:**
  - `invoicr-init` - Interactive setup wizard for new workspaces
  - `invoicr-list` - List all available clients
  - `--dry-run` - Preview invoice without generating files
  - Due date calculation based on payment terms
  - Invoice history tracking (history.json per client)
  - Config validation with helpful error messages

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
| `--dry-run` | Preview invoice details without generating files |

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

# Preview invoice without generating files
invoicr acme-hourly 40 --dry-run

# Use your own client (after creating with invoicr-new)
invoicr myclient 10
```

### Initialize Workspace

Set up a new invoicing workspace with provider details:

```bash
invoicr-init
```

This interactive wizard will:
1. Create `provider.json` with your business details
2. Optionally create a sample client

### List Clients

View all available clients in your workspace:

```bash
invoicr-list
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
| `acme-multiservice` | Mixed | Multiple line items with tax (1.3.0+) |
| `acme-minimal` | Hourly | Minimal template style (1.4.0+) |
| `acme-detailed` | Daily | Detailed template style (1.4.0+) |

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

## Workspace Layout

```
your-workspace/
├── provider.json           # Your business details
├── clients/
│   └── <client>/
│       ├── <client>.json   # Client configuration
│       └── history.json    # Invoice history (auto-generated)
└── invoices/               # Generated invoices (DOCX/PDF)
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
| `lineItems` | Optional. Array of line items (1.3.0+). Overrides single-service mode |
| `taxRate` | Optional. Tax rate as decimal (e.g., 0.19 for 19%) (1.3.0+) |
| `template` | Optional. Invoice template: `"default"`, `"minimal"`, or `"detailed"` (1.4.0+) |

### Multiple Line Items (1.3.0+)

For invoices with multiple services, use the `lineItems` array instead of the CLI quantity:

```json
{
  "name": "Multi-Service Client",
  "lineItems": [
    { "description": "Development", "quantity": 40, "rate": 150, "billingType": "hourly" },
    { "description": "Code Review", "quantity": 8, "rate": 175, "billingType": "hourly" },
    { "description": "Setup Fee", "quantity": 500, "rate": 1, "billingType": "fixed" }
  ],
  "taxRate": 0.19
}
```

When `lineItems` is present, the CLI quantity is ignored and all line items from the config are used.

### Logo Support (1.3.0+)

Add a logo to your invoices by specifying `logoPath` in `provider.json`:

```json
{
  "name": "Your Company",
  "logoPath": "logo.png"
}
```

Supported formats: PNG, JPG, GIF, BMP. The path can be absolute or relative to the current working directory.

### Invoice Templates (1.4.0+)

Choose from three invoice styles by setting `template` in your client config:

| Template | Description |
|----------|-------------|
| `default` | Full-featured layout with all details (default) |
| `minimal` | Clean, compact design with inline info |
| `detailed` | Extended layout with emphasized payment info |

```json
{
  "name": "My Client",
  "template": "minimal"
}
```

### Export History (1.4.0+)

Export your invoice history to CSV or JSON:

```bash
invoicr-export                           # Export all to CSV (stdout)
invoicr-export --format=json             # Export all to JSON
invoicr-export --client=acme-hourly      # Export specific client
invoicr-export --output=invoices.csv     # Export to file
```

### Bulk Generation (1.4.0+)

Generate multiple invoices from a configuration file:

```bash
invoicr-bulk batch.json
invoicr-bulk batch.json --dry-run        # Preview without generating
```

Config file format:
```json
{
  "invoices": [
    { "client": "acme-hourly", "quantity": 40 },
    { "client": "acme-daily", "quantity": 5, "month": "10-2025" },
    { "client": "acme-fixed", "quantity": 15000, "email": true }
  ]
}
```

Each invoice entry supports:
- `client` (required): Client folder name
- `quantity` (required): Quantity/amount for invoice
- `month` (optional): Billing month (MM-YYYY format)
- `email` (optional): Create email draft (true/false)

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
# Run invoice without building (using tsx)
npm run dev -- acme-hourly 8

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run invoice` | Generate an invoice |
| `npm run new-client` | Create a new client interactively |
| `npm run init` | Initialize a new workspace |
| `npm run list` | List available clients |
| `npm run dev` | Run invoice.ts directly with tsx |
| `npm test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## License

MIT

## Shameless Plug

This tool is brought to you by [LeanerCloud](https://leanercloud.com). We help companies reduce their AWS costs using a mix of services and tools such as [AutoSpotting](https://autospotting.io).

Are you a freelancer with clients running workloads on AWS and notice cost optimization opportunities unrelated to your work? If you refer a client to us, we'll give you **50% of our first cost optimization invoice** from that client.

[Get in touch](mailto:cristi@leanercloud.com?subject=invoicr%20client%20referral)!

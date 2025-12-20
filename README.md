# invoicr

A CLI tool and desktop app for generating DOCX/PDF invoices with e-invoice support.

## Features

- Generate professional invoices in DOCX and PDF formats
- Desktop GUI application (Tauri/React)
- E-invoice generation (XRechnung, ZUGFeRD, CIUS-RO, Factur-X, etc.)
- Multi-language support (German & English)
- Flexible billing: hourly, daily, or fixed rates
- Email drafts with PDF attachment (macOS)
- Multiple invoice templates
- REST API for integrations

## Quick Start

```bash
# Install globally
npm install -g invoicr

# Initialize workspace (creates provider.json)
invoicr-init

# Create a client
invoicr-new

# Generate an invoice
invoicr <client> <quantity>
invoicr acme-hourly 40 --email
```

## Prerequisites

- Node.js 18+
- LibreOffice (for PDF conversion): `brew install --cask libreoffice`

## GUI Application

A desktop application for visual invoice management.

### Installing the GUI

**Option 1: Via npm (recommended)**

```bash
npm install -g invoicr
invoicr-gui
```

The GUI binary is automatically downloaded during installation.

**Option 2: Download installer**

Download from [GitHub Releases](https://github.com/LeanerCloud/invoicr/releases):

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `Invoicr_x.x.x_aarch64.dmg` |
| macOS (Intel) | `Invoicr_x.x.x_x64.dmg` |
| Windows | `Invoicr_x.x.x_x64-setup.exe` |
| Linux (Debian/Ubuntu) | `invoicr_x.x.x_amd64.deb` |
| Linux (Portable) | `invoicr_x.x.x_amd64.AppImage` |

**Option 3: Build from source**

```bash
# Prerequisites: Rust (https://rustup.rs/)
git clone https://github.com/LeanerCloud/invoicr.git
cd invoicr && npm install && npm run build
cd gui && npm install && npm run tauri:build
```

### GUI Features

- Manage multiple business personas
- Configure provider and client settings
- Generate invoices with preview
- Select from multiple templates
- Configure e-invoicing per client
- View invoice history

## E-Invoice Generation

Generate electronic invoices in international formats.

### Supported Formats

| Region | Format | Countries |
|--------|--------|-----------|
| Europe | XRechnung | Germany |
| Europe | ZUGFeRD | Germany, Austria, Switzerland |
| Europe | CIUS-RO | Romania |
| Europe | Factur-X | France |
| Europe | FatturaPA | Italy |
| Europe | PEPPOL BIS | EU-wide |
| Americas | UBL | USA, Canada |

### Usage

```bash
invoicr-einvoice <client> --quantity=40
invoicr-einvoice <client> --quantity=40 --format=xrechnung
```

E-invoicing requires `countryCode` in both provider and client configs.

## CLI Commands

| Command | Description |
|---------|-------------|
| `invoicr <client> <qty>` | Generate invoice |
| `invoicr-init` | Initialize workspace |
| `invoicr-new` | Create new client |
| `invoicr-list` | List clients |
| `invoicr-bulk` | Bulk generation |
| `invoicr-export` | Export history |
| `invoicr-einvoice` | Generate e-invoice |
| `invoicr-server` | Start API server |
| `invoicr-gui` | Launch desktop app |

### Common Options

| Option | Description |
|--------|-------------|
| `--month=MM-YYYY` | Billing month |
| `--email` | Create email draft |
| `--dry-run` | Preview only |
| `--template=NAME` | Use specific template |

## API Server

REST API for programmatic access.

```bash
invoicr-server  # Starts on http://localhost:3456
```

Key endpoints:
- `GET /api/personas/:persona/clients` - List clients
- `POST /api/personas/:persona/invoice/generate` - Generate invoice
- `GET /api/einvoice/formats` - List e-invoice formats

## Configuration

See `examples/` for complete client configuration templates:
- `acme-hourly.json` - Hourly billing
- `acme-daily.json` - Daily billing with translations
- `acme-fixed.json` - Fixed amount
- `acme-romania.json` - Romanian e-invoice (CIUS-RO)
- `acme-xrechnung.json` - German e-invoice (XRechnung)

## Development

```bash
npm run build      # Compile TypeScript
npm test           # Run tests (700+ tests)
npm run dev        # Run with tsx
npm run api-server # Start API server
```

## License

MIT

## About

Built by [LeanerCloud](https://leanercloud.com). We help companies reduce AWS costs.

Freelancer with AWS clients? Refer them to us and get **50% of our first invoice**.
[Get in touch](mailto:cristi@leanercloud.com?subject=invoicr%20referral)!

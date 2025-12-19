/**
 * Script to generate DOCX template files with docxtemplater placeholders
 * Run with: npx tsx scripts/create-templates.ts
 */
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  Packer,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '..', 'templates');

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const thinBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
};

function createDefaultTemplate(): Document {
  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } }
    },
    sections: [{
      properties: {
        page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } }
      },
      children: [
        // Header: INVOICE title
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 },
          children: [new TextRun({ text: "{translations.invoice}", bold: true, size: 48 })]
        }),

        // Provider and Client side by side
        new Table({
          columnWidths: [4800, 4800],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 4800, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "{translations.serviceProvider}", bold: true, size: 20, color: "666666" })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "{provider.name}", bold: true })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{provider.address.street}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{provider.address.city}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("Tel: {provider.phone}")] }),
                    new Paragraph({ children: [new TextRun("E-Mail: {provider.email}")] })
                  ]
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 4800, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "{translations.client}", bold: true, size: 20, color: "666666" })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "{client.name}", bold: true })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{client.address.street}")] }),
                    new Paragraph({ children: [new TextRun("{client.address.city}")] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

        // Invoice details
        new Table({
          columnWidths: [2400, 3000],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.invoiceNr}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{invoiceNumber}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.invoiceDate}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{invoiceDate}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.dueDate}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{dueDate}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.servicePeriod}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{servicePeriod}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.projectReference}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{projectRef}")] })] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

        // Service intro
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun("{translations.serviceChargesIntro}")]
        }),

        // Line items header
        new Table({
          columnWidths: [4800, 1200, 1600, 2000],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: thinBorders, shading: { fill: "F5F5F5" }, width: { size: 4800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.description}", bold: true })] })] }),
                new TableCell({ borders: thinBorders, shading: { fill: "F5F5F5" }, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.quantity}", bold: true })] })] }),
                new TableCell({ borders: thinBorders, shading: { fill: "F5F5F5" }, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.rate}", bold: true })] })] }),
                new TableCell({ borders: thinBorders, shading: { fill: "F5F5F5" }, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.total}", bold: true })] })] })
              ]
            })
          ]
        }),

        // Line items loop (this will be repeated by docxtemplater)
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun("{#lineItems}{description} | {quantity} | {rate} | {total}{/lineItems}")]
        }),

        // Totals section
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        new Table({
          columnWidths: [6000, 1600, 2000],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
                new TableCell({ borders: noBorders, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.subtotal}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("{subtotal}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
                new TableCell({ borders: noBorders, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.tax} ({taxRate}%)", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("{tax}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
                new TableCell({ borders: { top: thinBorders.top, bottom: noBorders.bottom, left: noBorders.left, right: noBorders.right }, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.totalAmount}", bold: true, size: 24 })] })] }),
                new TableCell({ borders: { top: thinBorders.top, bottom: noBorders.bottom, left: noBorders.left, right: noBorders.right }, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{totalAmount}", bold: true, size: 24 })] })] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 300, after: 200 }, children: [] }),

        // Tax note (conditional)
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "{taxNote}", italics: true, size: 20 })]
        }),

        // Payment terms
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "{paymentTerms}", bold: true })]
        }),

        new Paragraph({
          spacing: { after: 400 },
          children: [new TextRun("{translations.thankYou}")]
        }),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // Bank details
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "{translations.bankDetails}", bold: true, size: 20, color: "666666" })]
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: "{translations.bank} ", size: 20 }), new TextRun({ text: "{bank.name}", size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: "{translations.iban} ", size: 20 }), new TextRun({ text: "{bank.iban}", size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: "{translations.bic} ", size: 20 }), new TextRun({ text: "{bank.bic}", size: 20 })]
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: "{translations.taxNumber} ", size: 20 }), new TextRun({ text: "{provider.taxNumber}", size: 20 })]
        }),
        new Paragraph({
          children: [new TextRun({ text: "{translations.vatId} ", size: 20 }), new TextRun({ text: "{provider.vatId}", size: 20 })]
        })
      ]
    }]
  });
}

function createMinimalTemplate(): Document {
  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } }
    },
    sections: [{
      properties: {
        page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } }
      },
      children: [
        // Header: INVOICE title
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
          children: [new TextRun({ text: "{translations.invoice}", bold: true, size: 48 })]
        }),

        // Compact invoice info line
        new Paragraph({
          spacing: { before: 200, after: 400 },
          children: [
            new TextRun({ text: "{invoiceNumber}", bold: true }),
            new TextRun({ text: "  |  {invoiceDate}" }),
            new TextRun({ text: "  |  {translations.dueDate}: {dueDate}" })
          ]
        }),

        // Provider and Client side by side (simplified)
        new Table({
          columnWidths: [4800, 4800],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 4800, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "{provider.name}", bold: true })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{provider.address.street}, {provider.address.city}")] }),
                    new Paragraph({ children: [new TextRun("{provider.email}")] })
                  ]
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 4800, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "{client.name}", bold: true })] }),
                    new Paragraph({ children: [new TextRun("{client.address.street}, {client.address.city}")] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

        // Line items (simplified)
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun("{#lineItems}{description} - {total}{/lineItems}")]
        }),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // Total
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
          children: [new TextRun({ text: "{translations.totalAmount}: {totalAmount}", bold: true, size: 24 })]
        }),

        new Paragraph({ spacing: { before: 300, after: 200 }, children: [] }),

        // Tax note
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "{taxNote}", italics: true, size: 18 })]
        }),

        // Payment terms (compact)
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "{paymentTerms}", size: 20 })]
        }),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // Compact bank details (single line)
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "{translations.bankDetails}: ", bold: true, size: 18 }),
            new TextRun({ text: "{bank.name} | {bank.iban} | {bank.bic}", size: 18 })
          ]
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "{translations.taxNumber}: ", size: 18 }),
            new TextRun({ text: "{provider.taxNumber}", size: 18 }),
            new TextRun({ text: "  |  {translations.vatId}: {provider.vatId}", size: 18 })
          ]
        })
      ]
    }]
  });
}

function createDetailedTemplate(): Document {
  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } }
    },
    sections: [{
      properties: {
        page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } }
      },
      children: [
        // Header with large title
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 },
          children: [new TextRun({ text: "{translations.invoice}", bold: true, size: 56 })]
        }),

        // Full provider and client details side by side
        new Table({
          columnWidths: [4800, 4800],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 4800, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "{translations.serviceProvider}", bold: true, size: 20, color: "666666" })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "{provider.name}", bold: true, size: 24 })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{provider.address.street}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{provider.address.city}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{provider.address.country}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("Tel: {provider.phone}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("E-Mail: {provider.email}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "{translations.taxNumber}: ", size: 20 }), new TextRun({ text: "{provider.taxNumber}", size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: "{translations.vatId}: ", size: 20 }), new TextRun({ text: "{provider.vatId}", size: 20 })] })
                  ]
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 4800, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "{translations.client}", bold: true, size: 20, color: "666666" })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "{client.name}", bold: true, size: 24 })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{client.address.street}")] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun("{client.address.city}")] }),
                    new Paragraph({ children: [new TextRun("{client.address.country}")] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

        // Invoice details box
        new Table({
          columnWidths: [2400, 3000],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.invoiceNr}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{invoiceNumber}", bold: true, size: 24 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.invoiceDate}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{invoiceDate}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.dueDate}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{dueDate}", bold: true, color: "CC0000" })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.servicePeriod}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{servicePeriod}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.projectReference}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{projectRef}")] })] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

        // Service description intro
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "{translations.serviceChargesIntro}", size: 22 })]
        }),

        // Line items
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun("{#lineItems}{description} | Qty: {quantity} | Rate: {rate} | Total: {total}{/lineItems}")]
        }),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // Totals
        new Table({
          columnWidths: [6000, 1600, 2000],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
                new TableCell({ borders: noBorders, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.subtotal}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("{subtotal}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
                new TableCell({ borders: noBorders, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.tax} ({taxRate}%)", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("{tax}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
                new TableCell({ borders: { top: thinBorders.top, bottom: noBorders.bottom, left: noBorders.left, right: noBorders.right }, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{translations.totalAmount}", bold: true, size: 26 })] })] }),
                new TableCell({ borders: { top: thinBorders.top, bottom: noBorders.bottom, left: noBorders.left, right: noBorders.right }, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{totalAmount}", bold: true, size: 26 })] })] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

        // Tax note
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "{taxNote}", italics: true, size: 20 })]
        }),

        // Payment terms with emphasis
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "{paymentTerms}", bold: true, size: 24 })]
        }),

        // Payment instructions box
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "{translations.bankDetails}", bold: true, size: 22, color: "666666" })]
        }),

        new Table({
          columnWidths: [2000, 7600],
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.bank}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{bank.name}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.iban}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{bank.iban}", bold: true })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.bic}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("{bank.bic}")] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{translations.reference}", bold: true })] })] }),
                new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "{invoiceNumber}", bold: true })] })] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 300 }, children: [] }),

        // Thank you message
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "{translations.thankYou}", italics: true })]
        })
      ]
    }]
  });
}

async function main() {
  // Ensure templates directory exists
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const templates = [
    { name: 'default', doc: createDefaultTemplate() },
    { name: 'minimal', doc: createMinimalTemplate() },
    { name: 'detailed', doc: createDetailedTemplate() },
  ];

  for (const { name, doc } of templates) {
    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(templatesDir, `${name}.docx`);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Created: ${outputPath}`);
  }

  console.log('\nAll templates created successfully!');
  console.log('\nPlaceholders available:');
  console.log('  - {provider.name}, {provider.address.street}, {provider.address.city}');
  console.log('  - {provider.phone}, {provider.email}, {provider.taxNumber}, {provider.vatId}');
  console.log('  - {client.name}, {client.address.street}, {client.address.city}');
  console.log('  - {invoiceNumber}, {invoiceDate}, {dueDate}, {servicePeriod}, {projectRef}');
  console.log('  - {#lineItems}...{/lineItems} - loop for line items');
  console.log('  - {subtotal}, {tax}, {taxRate}, {totalAmount}');
  console.log('  - {bank.name}, {bank.iban}, {bank.bic}');
  console.log('  - {translations.*} - all translation keys');
}

main().catch(console.error);

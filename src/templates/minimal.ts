import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
} from 'docx';
import { InvoiceContext } from '../types';
import { formatCurrency } from '../utils';
import { noBorders, loadLogo, buildLineItemsTable } from './common';

/**
 * Minimal template - Clean, compact invoice design
 * - No service period
 * - No project reference
 * - Compact bank details (single line)
 * - Simplified header
 */
export function buildMinimalDocument(ctx: InvoiceContext): Document {
  const { provider, client, translations: t, invoiceNumber, invoiceDate, lang, bankDetails, totalAmount, currency } = ctx;

  const logo = loadLogo(provider.logoPath);
  const children: (Paragraph | Table)[] = [];

  // Header with invoice title and optional logo
  if (logo) {
    children.push(new Table({
      columnWidths: [7200, 2400],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 7200, type: WidthType.DXA },
              children: [new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: t.invoice, bold: true, size: 48 })]
              })]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 2400, type: WidthType.DXA },
              children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [logo]
              })]
            })
          ]
        })
      ]
    }));
  } else {
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
      children: [new TextRun({ text: t.invoice, bold: true, size: 48 })]
    }));
  }

  // Compact invoice info line
  children.push(new Paragraph({
    spacing: { before: 200, after: 400 },
    children: [
      new TextRun({ text: `${invoiceNumber}`, bold: true }),
      new TextRun({ text: `  |  ${invoiceDate}` }),
      ctx.dueDate ? new TextRun({ text: `  |  ${t.dueDate}: ${ctx.dueDate}` }) : new TextRun('')
    ]
  }));

  // Two-column: Provider | Client (simplified)
  children.push(new Table({
    columnWidths: [4800, 4800],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 4800, type: WidthType.DXA },
            children: [
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: provider.name, bold: true })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun(`${provider.address.street}, ${provider.address.city}`)] }),
              new Paragraph({ children: [new TextRun(provider.email)] })
            ]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 4800, type: WidthType.DXA },
            children: [
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: client.name, bold: true })] }),
              new Paragraph({ children: [new TextRun(`${client.address.street}, ${client.address.city}`)] })
            ]
          })
        ]
      })
    ]
  }));

  children.push(new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }));

  // Line items
  children.push(buildLineItemsTable(ctx));

  children.push(new Paragraph({ spacing: { before: 300, after: 200 }, children: [] }));

  // Tax note for German invoices (only when NOT charging VAT)
  if (lang === 'de' && t.taxNote && ctx.taxRate === 0) {
    children.push(new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: t.taxNote, italics: true, size: 18 })]
    }));
  }

  // Payment terms (compact)
  const paymentDays = client.paymentTermsDays;
  const paymentText = paymentDays
    ? t.paymentTerms.replace('{{days}}', paymentDays.toString())
    : t.paymentImmediate;

  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: paymentText, size: 20 })]
  }));

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  // Compact bank details (single line format)
  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: t.bankDetails + ": ", bold: true, size: 18 }),
      new TextRun({ text: `${bankDetails.name} | ${bankDetails.iban} | ${bankDetails.bic}`, size: 18 })
    ]
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({ text: t.taxNumber + ": ", size: 18 }),
      new TextRun({ text: provider.taxNumber, size: 18 }),
      provider.vatId ? new TextRun({ text: `  |  ${t.vatId}: ${provider.vatId}`, size: 18 }) : new TextRun('')
    ]
  }));

  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } }
    },
    sections: [{
      properties: {
        page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } }
      },
      children
    }]
  });
}

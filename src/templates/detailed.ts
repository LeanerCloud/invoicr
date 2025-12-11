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
import { InvoiceContext } from '../types.js';
import { formatCurrency, getTranslatedCountry } from '../utils.js';
import { noBorders, loadLogo, buildLineItemsTable } from './common.js';

/**
 * Detailed template - Extended invoice with more information
 * - Full provider and client details
 * - Line item breakdown with individual subtotals
 * - Payment instructions section
 * - Terms and conditions note
 */
export function buildDetailedDocument(ctx: InvoiceContext): Document {
  const { provider, client, translations: t, invoiceNumber, invoiceDate, servicePeriod, billingType, lang, bankDetails, totalAmount, currency, lineItems, subtotal, taxAmount, taxRate, monthName } = ctx;

  const logo = loadLogo(provider.logoPath);
  const children: (Paragraph | Table)[] = [];

  // Header with logo
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
                children: [new TextRun({ text: t.invoice, bold: true, size: 56 })]
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
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  } else {
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 },
      children: [new TextRun({ text: t.invoice, bold: true, size: 56 })]
    }));
  }

  // Full provider and client details side by side
  children.push(new Table({
    columnWidths: [4800, 4800],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 4800, type: WidthType.DXA },
            children: [
              new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: t.serviceProvider, bold: true, size: 20, color: "666666" })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: provider.name, bold: true, size: 24 })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun(provider.address.street)] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun(provider.address.city)] }),
              provider.address.country ? new Paragraph({ spacing: { after: 40 }, children: [new TextRun(getTranslatedCountry(provider.address.country, lang) || '')] }) : new Paragraph({ children: [] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun(`Tel: ${provider.phone}`)] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun(`E-Mail: ${provider.email}`)] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${t.taxNumber}: `, size: 20 }), new TextRun({ text: provider.taxNumber, size: 20 })] }),
              provider.vatId ? new Paragraph({ children: [new TextRun({ text: `${t.vatId}: `, size: 20 }), new TextRun({ text: provider.vatId, size: 20 })] }) : new Paragraph({ children: [] })
            ]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 4800, type: WidthType.DXA },
            children: [
              new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: t.client, bold: true, size: 20, color: "666666" })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: client.name, bold: true, size: 24 })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun(client.address.street)] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun(client.address.city)] }),
              client.address.country ? new Paragraph({ children: [new TextRun(getTranslatedCountry(client.address.country, lang) || '')] }) : new Paragraph({ children: [] })
            ]
          })
        ]
      })
    ]
  }));

  children.push(new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }));

  // Invoice details box
  const invoiceDetailsRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 2400, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: t.invoiceNr, bold: true })] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: invoiceNumber, bold: true, size: 24 })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 2400, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: t.invoiceDate, bold: true })] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(invoiceDate)] })]
        })
      ]
    })
  ];

  if (ctx.dueDate) {
    invoiceDetailsRows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 2400, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: t.dueDate, bold: true })] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: ctx.dueDate, bold: true, color: "CC0000" })] })]
        })
      ]
    }));
  }

  if (billingType !== 'fixed') {
    invoiceDetailsRows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 2400, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: t.servicePeriod, bold: true })] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(servicePeriod)] })]
        })
      ]
    }));
  }

  if (client.projectReference) {
    invoiceDetailsRows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 2400, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: t.projectReference, bold: true })] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(client.projectReference)] })]
        })
      ]
    }));
  }

  children.push(new Table({
    columnWidths: [2400, 3000],
    rows: invoiceDetailsRows
  }));

  children.push(new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }));

  // Service description intro
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: t.serviceChargesIntro, size: 22 })]
  }));

  // Line items table
  children.push(buildLineItemsTable(ctx));

  children.push(new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }));

  // Tax note for German invoices (only when NOT charging VAT)
  if (lang === 'de' && t.taxNote && ctx.taxRate === 0) {
    children.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: t.taxNote, italics: true, size: 20 })]
    }));
  }

  // Payment terms with emphasis
  const paymentDays = client.paymentTermsDays;
  const paymentText = paymentDays
    ? t.paymentTerms.replace('{{days}}', paymentDays.toString())
    : t.paymentImmediate;

  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: paymentText, bold: true, size: 24 })]
  }));

  // Payment instructions box
  children.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: t.bankDetails, bold: true, size: 22, color: "666666" })]
  }));

  children.push(new Table({
    columnWidths: [2000, 7600],
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t.bank, bold: true })] })] }),
          new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(bankDetails.name)] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t.iban, bold: true })] })] }),
          new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: bankDetails.iban, bold: true })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t.bic, bold: true })] })] }),
          new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(bankDetails.bic)] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: lang === 'de' ? 'Verwendungszweck' : 'Reference', bold: true })] })] }),
          new TableCell({ borders: noBorders, width: { size: 7600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: invoiceNumber, bold: true })] })] })
        ]
      })
    ]
  }));

  children.push(new Paragraph({ spacing: { before: 300 }, children: [] }));

  // Thank you message
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: t.thankYou, italics: true })]
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

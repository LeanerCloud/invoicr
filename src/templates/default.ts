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
import { getTranslatedCountry } from '../utils';
import { noBorders, loadLogo, buildLineItemsTable } from './common';

export function buildDefaultDocument(ctx: InvoiceContext): Document {
  const { provider, client, translations: t, invoiceNumber, invoiceDate, servicePeriod, billingType, lang, bankDetails } = ctx;

  // Build invoice details rows
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
          children: [new Paragraph({ children: [new TextRun(invoiceNumber)] })]
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
          children: [new Paragraph({ children: [new TextRun(ctx.dueDate)] })]
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

  const logo = loadLogo(provider.logoPath);
  const children: (Paragraph | Table)[] = [];

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
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  } else {
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 },
      children: [new TextRun({ text: t.invoice, bold: true, size: 48 })]
    }));
  }

  children.push(
    new Table({
      columnWidths: [4800, 4800],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 4800, type: WidthType.DXA },
              children: [
                new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: t.serviceProvider, bold: true, size: 20, color: "666666" })] }),
                new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: provider.name, bold: true })] }),
                new Paragraph({ spacing: { after: 40 }, children: [new TextRun(provider.address.street)] }),
                new Paragraph({ spacing: { after: 40 }, children: [new TextRun(provider.address.city + (provider.address.country ? ', ' + getTranslatedCountry(provider.address.country, lang) : ''))] }),
                new Paragraph({ spacing: { after: 40 }, children: [new TextRun(`Tel: ${provider.phone}`)] }),
                new Paragraph({ children: [new TextRun(`E-Mail: ${provider.email}`)] })
              ]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 4800, type: WidthType.DXA },
              children: [
                new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: t.client, bold: true, size: 20, color: "666666" })] }),
                new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: client.name, bold: true })] }),
                new Paragraph({ spacing: { after: 40 }, children: [new TextRun(client.address.street)] }),
                new Paragraph({ children: [new TextRun(client.address.city)] })
              ]
            })
          ]
        })
      ]
    }),

    new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

    new Table({
      columnWidths: [2400, 3000],
      rows: invoiceDetailsRows
    }),

    new Paragraph({ spacing: { before: 400, after: 200 }, children: [] }),

    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun(t.serviceChargesIntro)]
    }),

    buildLineItemsTable(ctx),

    new Paragraph({ spacing: { before: 300, after: 200 }, children: [] })
  );

  // Tax note for German invoices (only when NOT charging VAT)
  if (lang === 'de' && t.taxNote && ctx.taxRate === 0) {
    children.push(new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: t.taxNote, italics: true, size: 20 })]
    }));
  }

  // Payment terms
  const paymentDays = client.paymentTermsDays;
  const paymentText = paymentDays
    ? t.paymentTerms.replace('{{days}}', paymentDays.toString())
    : t.paymentImmediate;

  children.push(new Paragraph({
    spacing: { after: 300 },
    children: [new TextRun({ text: paymentText, bold: true })]
  }));

  children.push(new Paragraph({
    spacing: { after: 400 },
    children: [new TextRun(t.thankYou)]
  }));

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  // Bank details
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: t.bankDetails, bold: true, size: 20, color: "666666" })]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: t.bank + " ", size: 20 }), new TextRun({ text: bankDetails.name, size: 20 })]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: t.iban + " ", size: 20 }), new TextRun({ text: bankDetails.iban, size: 20 })]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: t.bic + " ", size: 20 }), new TextRun({ text: bankDetails.bic, size: 20 })]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: t.taxNumber + " ", size: 20 }), new TextRun({ text: provider.taxNumber, size: 20 })]
    })
  );

  if (lang === 'de' && provider.vatId) {
    children.push(new Paragraph({
      children: [new TextRun({ text: t.vatId + " ", size: 20 }), new TextRun({ text: provider.vatId, size: 20 })]
    }));
  }

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

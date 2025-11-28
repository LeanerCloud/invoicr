import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ITableCellBorders,
} from 'docx';
import { InvoiceContext } from './types';
import { formatCurrency, formatQuantity } from './utils';

// Border styles
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders: ITableCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function buildLineItemsTable(ctx: InvoiceContext): Table {
  const { translations: t, billingType, serviceDescription, quantity, rate, totalAmount, currency, lang } = ctx;

  if (billingType === 'fixed') {
    return new Table({
      columnWidths: [7200, 2400],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 7200, type: WidthType.DXA },
                            children: [new Paragraph({ children: [new TextRun({ text: t.description, bold: true })] })]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 2400, type: WidthType.DXA },
                            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t.total, bold: true })] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 7200, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun(serviceDescription)] })]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 2400, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(totalAmount, currency, lang))] })]
            })
          ]
        })
      ]
    });
  }

  const quantityLabel = billingType === 'hourly' ? t.hours : t.days;

  return new Table({
    columnWidths: [4800, 1600, 1600, 1600],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 4800, type: WidthType.DXA },
                        children: [new Paragraph({ children: [new TextRun({ text: t.description, bold: true })] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: quantityLabel, bold: true })] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t.unitPrice, bold: true })] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t.total, bold: true })] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 4800, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun(serviceDescription)] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(formatQuantity(quantity, lang))] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(rate, currency, lang))] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(totalAmount, currency, lang))] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 4800, type: WidthType.DXA },
            children: [new Paragraph({ children: [] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ children: [] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t.total, bold: true })] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
                        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(totalAmount, currency, lang), bold: true })] })]
          })
        ]
      })
    ]
  });
}

export function buildDocument(ctx: InvoiceContext): Document {
  const { provider, client, translations: t, invoiceNumber, invoiceDate, servicePeriod, billingType, lang, bankDetails, totalAmount, currency } = ctx;

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

  // Add service period for hourly/daily
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

  // Add project reference if defined
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

  // Build document children
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 },
      children: [new TextRun({ text: t.invoice, bold: true, size: 48 })]
    }),

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
                new Paragraph({ spacing: { after: 40 }, children: [new TextRun(provider.address.city)] }),
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
  ];

  // Add tax note for German invoices
  if (lang === 'de' && t.taxNote) {
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

  // Thank you
  children.push(new Paragraph({
    spacing: { after: 400 },
    children: [new TextRun(t.thankYou)]
  }));

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  // Footer: Bank details
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

  // Add VAT ID for German invoices
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

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
  ImageRun,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { InvoiceContext } from './types';
import { formatCurrency, formatQuantity, getTranslatedCountry } from './utils';

// Border styles
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders: ITableCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// Load logo image if it exists
function loadLogo(logoPath: string | undefined): ImageRun | null {
  if (!logoPath) return null;

  try {
    // Resolve path relative to cwd or absolute
    const resolvedPath = path.isAbsolute(logoPath) ? logoPath : path.join(process.cwd(), logoPath);

    if (!fs.existsSync(resolvedPath)) {
      console.warn(`Logo file not found: ${resolvedPath}`);
      return null;
    }

    const imageData = fs.readFileSync(resolvedPath);
    const ext = path.extname(logoPath).toLowerCase();

    // Determine image type
    let type: 'png' | 'jpg' | 'gif' | 'bmp';
    if (ext === '.png') type = 'png';
    else if (ext === '.jpg' || ext === '.jpeg') type = 'jpg';
    else if (ext === '.gif') type = 'gif';
    else if (ext === '.bmp') type = 'bmp';
    else {
      console.warn(`Unsupported logo format: ${ext}`);
      return null;
    }

    return new ImageRun({
      data: imageData,
      type,
      transformation: {
        width: 120,
        height: 40
      }
    });
  } catch (err) {
    console.warn(`Failed to load logo: ${err}`);
    return null;
  }
}

function buildLineItemsTable(ctx: InvoiceContext): Table {
  const { translations: t, lineItems, currency, lang, subtotal, taxAmount, taxRate, totalAmount, monthName } = ctx;

  // Check if all items are fixed (simple 2-column layout)
  const allFixed = lineItems.every(item => item.billingType === 'fixed');

  if (allFixed) {
    const rows: TableRow[] = [
      // Header row
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
      })
    ];

    // Line item rows
    lineItems.forEach(item => {
      const description = `${item.description}, ${monthName}`;
      rows.push(new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 7200, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun(description)] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 2400, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(item.total, currency, lang))] })]
          })
        ]
      }));
    });

    // Add subtotal/tax/total rows if tax is applied
    if (taxRate > 0) {
      rows.push(
        // Subtotal
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 7200, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t.subtotal, bold: true })] })]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 2400, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(subtotal, currency, lang))] })]
            })
          ]
        }),
        // Tax
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              width: { size: 7200, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${t.tax} (${(taxRate * 100).toFixed(0)}%)`, bold: true })] })]
            }),
            new TableCell({
              borders: noBorders,
              width: { size: 2400, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(taxAmount, currency, lang))] })]
            })
          ]
        })
      );
    }

    // Total row
    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 7200, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t.total, bold: true })] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 2400, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(totalAmount, currency, lang), bold: true })] })]
        })
      ]
    }));

    return new Table({ columnWidths: [7200, 2400], rows });
  }

  // Mixed billing types - use 4-column layout
  const rows: TableRow[] = [
    // Header row
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
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t.quantity, bold: true })] })]
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
    })
  ];

  // Line item rows
  lineItems.forEach(item => {
    const description = `${item.description}, ${monthName}`;
    const quantityDisplay = item.billingType === 'fixed' ? '-' : formatQuantity(item.quantity, lang);
    const rateDisplay = item.billingType === 'fixed' ? '-' : formatCurrency(item.rate, currency, lang);

    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 4800, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(description)] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 1600, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(quantityDisplay)] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 1600, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(rateDisplay)] })]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 1600, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(item.total, currency, lang))] })]
        })
      ]
    }));
  });

  // Add subtotal/tax/total rows if tax is applied
  if (taxRate > 0) {
    rows.push(
      // Subtotal
      new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: 4800, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
          new TableCell({ borders: noBorders, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: t.subtotal, bold: true })] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(subtotal, currency, lang))] })]
          })
        ]
      }),
      // Tax
      new TableRow({
        children: [
          new TableCell({ borders: noBorders, width: { size: 4800, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
          new TableCell({ borders: noBorders, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${t.tax} (${(taxRate * 100).toFixed(0)}%)`, bold: true })] })]
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 1600, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(formatCurrency(taxAmount, currency, lang))] })]
          })
        ]
      })
    );
  }

  // Total row
  rows.push(new TableRow({
    children: [
      new TableCell({ borders: noBorders, width: { size: 4800, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
      new TableCell({ borders: noBorders, width: { size: 1600, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
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
  }));

  return new Table({ columnWidths: [4800, 1600, 1600, 1600], rows });
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

  // Add due date if available
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

  // Load logo if configured
  const logo = loadLogo(provider.logoPath);

  // Build header row with optional logo
  const headerContent: (TextRun | ImageRun)[] = [new TextRun({ text: t.invoice, bold: true, size: 48 })];

  // Build document children
  const children: (Paragraph | Table)[] = [];

  // If logo exists, create a header table with logo on right
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

  // Add tax note for German invoices (only when NOT charging VAT)
  // The taxNote is for Kleinunternehmer who are exempt from VAT
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

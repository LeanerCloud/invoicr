import {
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
import { InvoiceContext } from '../types';
import { formatCurrency, formatQuantity } from '../utils';

// Border styles
export const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
export const noBorders: ITableCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// Load logo image if it exists
export function loadLogo(logoPath: string | undefined): ImageRun | null {
  if (!logoPath) return null;

  try {
    const resolvedPath = path.isAbsolute(logoPath) ? logoPath : path.join(process.cwd(), logoPath);

    if (!fs.existsSync(resolvedPath)) {
      console.warn(`Logo file not found: ${resolvedPath}`);
      return null;
    }

    const imageData = fs.readFileSync(resolvedPath);
    const ext = path.extname(logoPath).toLowerCase();

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
      transformation: { width: 120, height: 40 }
    });
  } catch (err) {
    console.warn(`Failed to load logo: ${err}`);
    return null;
  }
}

// Build line items table (shared across templates)
export function buildLineItemsTable(ctx: InvoiceContext): Table {
  const { translations: t, lineItems, currency, lang, subtotal, taxAmount, taxRate, totalAmount, monthName } = ctx;

  const allFixed = lineItems.every(item => item.billingType === 'fixed');

  if (allFixed) {
    const rows: TableRow[] = [
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

    if (taxRate > 0) {
      rows.push(
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

  // Mixed billing types - 4-column layout
  const rows: TableRow[] = [
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

  if (taxRate > 0) {
    rows.push(
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

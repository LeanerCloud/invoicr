import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  batchEmailInvoices: vi.fn(),
  emailInvoice: vi.fn(),
  open: vi.fn(),
  deleteMutate: vi.fn(),
  // Mutable history the mocked hook reads on each render.
  state: { invoices: [] as Array<Record<string, unknown>> },
}));

vi.mock('../../services/api', () => ({
  fileApi: {
    batchEmailInvoices: mocks.batchEmailInvoices,
    emailInvoice: mocks.emailInvoice,
    open: mocks.open,
  },
}));

vi.mock('../../hooks/useClients', () => ({
  useClient: () => ({
    data: { client: { name: 'Client A', service: { currency: 'USD', billingType: 'fixed' } } },
    isLoading: false,
  }),
  useClientHistory: () => ({
    data: { invoices: mocks.state.invoices },
    isLoading: false,
    error: null,
  }),
  useDeleteInvoice: () => ({ mutate: mocks.deleteMutate, isPending: false }),
}));

import { InvoiceHistory } from './InvoiceHistory';

function invoice(number: string, month: string, pdf?: string) {
  return {
    invoiceNumber: number,
    date: '2026-07-07',
    month,
    quantity: 1,
    rate: 1,
    totalAmount: 100,
    currency: 'USD',
    pdfPath: pdf,
  };
}

beforeEach(() => {
  mocks.batchEmailInvoices.mockReset();
  mocks.state.invoices = [
    invoice('SM-1', 'May 2026', '/x/Invoice_SM-1_May_2026.pdf'),
    invoice('SM-2', 'June 2026', '/x/Invoice_SM-2_June_2026.pdf'),
  ];
});

describe('InvoiceHistory bulk email', () => {
  it('has no action bar until an invoice is selected', () => {
    render(<InvoiceHistory persona="p" clientName="clientA" onBack={() => {}} />);
    expect(screen.queryByRole('button', { name: /selected/i })).not.toBeInTheDocument();
  });

  it('bulk-emails all selected invoices via the batch endpoint', async () => {
    mocks.batchEmailInvoices.mockResolvedValue({
      success: true,
      message: 'Created 1 email draft(s) with 2 invoice(s)',
      results: [{ email: 'a@b.com', count: 2, success: true }],
    });

    const user = userEvent.setup();
    render(<InvoiceHistory persona="p" clientName="clientA" onBack={() => {}} />);

    await user.click(screen.getByLabelText('Select all invoices'));
    await user.click(screen.getByRole('button', { name: /Email 2 selected/i }));

    expect(mocks.batchEmailInvoices).toHaveBeenCalledWith('p', [
      { clientName: 'clientA', pdfPath: '/x/Invoice_SM-1_May_2026.pdf' },
      { clientName: 'clientA', pdfPath: '/x/Invoice_SM-2_June_2026.pdf' },
    ]);
    expect(await screen.findByText(/Created 1 email draft/)).toBeInTheDocument();
  });

  it('emails only the individually selected invoice', async () => {
    mocks.batchEmailInvoices.mockResolvedValue({
      success: true,
      message: 'Created 1 email draft(s) with 1 invoice(s)',
      results: [{ email: 'a@b.com', count: 1, success: true }],
    });

    const user = userEvent.setup();
    render(<InvoiceHistory persona="p" clientName="clientA" onBack={() => {}} />);

    await user.click(screen.getByLabelText('Select invoice SM-2'));
    await user.click(screen.getByRole('button', { name: /Email 1 selected/i }));

    expect(mocks.batchEmailInvoices).toHaveBeenCalledWith('p', [
      { clientName: 'clientA', pdfPath: '/x/Invoice_SM-2_June_2026.pdf' },
    ]);
  });

  it('does not let an invoice without a PDF be selected', async () => {
    mocks.state.invoices = [invoice('SM-3', 'July 2026', undefined)];
    const user = userEvent.setup();
    render(<InvoiceHistory persona="p" clientName="clientA" onBack={() => {}} />);

    const checkbox = screen.getByLabelText('Invoice SM-3 has no PDF') as HTMLInputElement;
    expect(checkbox).toBeDisabled();

    // Select-all should select nothing when there are no emailable invoices.
    await user.click(screen.getByLabelText('Select all invoices'));
    expect(screen.queryByRole('button', { name: /selected/i })).not.toBeInTheDocument();
  });
});

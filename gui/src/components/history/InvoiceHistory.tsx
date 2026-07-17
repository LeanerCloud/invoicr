import { ArrowLeft, History, FileText, Calendar, Loader2, AlertCircle, Eye, Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useClient, useClientHistory, useDeleteInvoice } from '../../hooks/useClients';
import { InvoiceHistoryEntry, fileApi } from '../../services/api';

interface InvoiceHistoryProps {
  persona: string;
  clientName: string;
  onBack: () => void;
}

export function InvoiceHistory({ persona, clientName, onBack }: InvoiceHistoryProps) {
  const { data: clientData, isLoading: clientLoading } = useClient(persona, clientName);
  const { data: historyData, isLoading: historyLoading, error } = useClientHistory(persona, clientName);
  const deleteInvoiceMutation = useDeleteInvoice(persona, clientName);

  const isLoading = clientLoading || historyLoading;
  const invoices = historyData?.invoices || [];
  const client = clientData?.client;
  const currencySymbol = client?.service.currency === 'EUR' ? '\u20AC' : '$';

  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalQuantity = invoices.reduce((sum, inv) => sum + inv.quantity, 0);

  // Bulk email selection (only invoices that have a PDF can be emailed)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkEmailing, setIsBulkEmailing] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ success: boolean; message: string } | null>(null);

  const emailableNumbers = invoices.filter(inv => inv.pdfPath).map(inv => inv.invoiceNumber);
  const allSelected = emailableNumbers.length > 0 && emailableNumbers.every(n => selected.has(n));

  const toggleOne = (invoiceNumber: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(invoiceNumber)) next.delete(invoiceNumber);
      else next.add(invoiceNumber);
      return next;
    });
    setBulkResult(null);
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(emailableNumbers));
    setBulkResult(null);
  };

  const handleBulkEmail = async () => {
    const chosen = invoices.filter(inv => selected.has(inv.invoiceNumber) && inv.pdfPath);
    if (chosen.length === 0 || isBulkEmailing) return;

    setIsBulkEmailing(true);
    setBulkResult(null);
    try {
      const result = await fileApi.batchEmailInvoices(
        persona,
        chosen.map(inv => ({ clientName, pdfPath: inv.pdfPath! }))
      );
      setBulkResult({ success: result.success, message: result.message });
      if (result.success) setSelected(new Set());
    } catch (err) {
      setBulkResult({ success: false, message: (err as Error).message || 'Failed to send emails' });
    } finally {
      setIsBulkEmailing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">Failed to load history</h3>
          <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <History className="w-7 h-7 mr-3 text-primary-600" />
          Invoice History
        </h1>
        <p className="text-gray-500 mt-1">
          Past invoices for {client?.name}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="text-2xl font-semibold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Billed</p>
          <p className="text-2xl font-semibold text-primary-600">
            {currencySymbol}{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Quantity</p>
          <p className="text-2xl font-semibold text-gray-900">
            {totalQuantity.toLocaleString()} {client?.service.billingType === 'hourly' ? 'hrs' :
              client?.service.billingType === 'daily' ? 'days' : 'units'}
          </p>
        </div>
      </div>

      {/* Bulk email result */}
      {bulkResult && (
        <div
          className={`mb-4 rounded-lg border p-3 text-sm ${
            bulkResult.success
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {bulkResult.message}
        </div>
      )}

      {/* Bulk email action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm text-blue-800">
            {selected.size} invoice{selected.size === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBulkEmail}
              disabled={isBulkEmailing}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isBulkEmailing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-1.5" />
              )}
              Email {selected.size} selected
            </button>
          </div>
        </div>
      )}

      {/* Invoice List */}
      {invoices.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-gray-600 font-medium">No invoices yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Generated invoices will appear here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={emailableNumbers.length === 0}
                    aria-label="Select all invoices"
                    className="rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.invoiceNumber}
                  invoice={invoice}
                  currencySymbol={currencySymbol}
                  billingType={client?.service.billingType || 'hourly'}
                  persona={persona}
                  clientName={clientName}
                  selected={selected.has(invoice.invoiceNumber)}
                  onToggleSelect={() => toggleOne(invoice.invoiceNumber)}
                  onDelete={() => deleteInvoiceMutation.mutate(invoice.invoiceNumber)}
                  isDeleting={deleteInvoiceMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface InvoiceRowProps {
  invoice: InvoiceHistoryEntry;
  currencySymbol: string;
  billingType: string;
  persona: string;
  clientName: string;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function InvoiceRow({ invoice, currencySymbol, billingType, persona, clientName, selected, onToggleSelect, onDelete, isDeleting }: InvoiceRowProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const quantityLabel = billingType === 'hourly' ? 'hrs' :
    billingType === 'daily' ? 'days' : 'units';

  const handleOpenPdf = async () => {
    if (invoice.pdfPath && !isOpening) {
      setIsOpening(true);
      try {
        await fileApi.open(invoice.pdfPath);
      } catch (err) {
        console.error('Failed to open PDF:', err);
      } finally {
        setIsOpening(false);
      }
    }
  };

  const handleEmailInvoice = async () => {
    if (invoice.pdfPath && !isEmailing) {
      setIsEmailing(true);
      try {
        await fileApi.emailInvoice(persona, clientName, invoice.pdfPath);
      } catch (err) {
        console.error('Failed to email invoice:', err);
      } finally {
        setIsEmailing(false);
      }
    }
  };

  return (
    <tr className={`transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <td className="px-4 py-3">
        {invoice.pdfPath ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Select invoice ${invoice.invoiceNumber}`}
            className="rounded border-gray-300 cursor-pointer"
          />
        ) : (
          <input
            type="checkbox"
            disabled
            aria-label={`Invoice ${invoice.invoiceNumber} has no PDF`}
            className="rounded border-gray-300 cursor-not-allowed opacity-40"
          />
        )}
      </td>
      <td className="px-4 py-3">
        <span className="font-mono font-medium text-gray-900">
          {invoice.invoiceNumber}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-gray-700">{invoice.month}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="w-4 h-4 mr-1.5" />
          {invoice.date}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-gray-700">
          {invoice.quantity} {quantityLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-gray-700">
          {currencySymbol}{invoice.rate.toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-medium text-gray-900">
          {currencySymbol}{invoice.totalAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-red-600">Delete?</span>
            <button
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}
              disabled={isDeleting}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            {invoice.pdfPath ? (
              <>
                <button
                  onClick={handleOpenPdf}
                  disabled={isOpening}
                  className="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-600 text-sm rounded hover:bg-primary-100 transition-colors disabled:opacity-50"
                  title="Open PDF"
                >
                  {isOpening ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleEmailInvoice}
                  disabled={isEmailing}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                  title="Email Invoice"
                >
                  {isEmailing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </button>
              </>
            ) : (
              <span className="text-gray-400 text-sm mr-1">—</span>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-2 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
              title="Delete Invoice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

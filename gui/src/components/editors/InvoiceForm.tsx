import { useState, useMemo } from 'react';
import { ArrowLeft, FileText, Loader2, AlertCircle, Check, Calendar, FileSpreadsheet, Mail, Pencil } from 'lucide-react';
import { useClient } from '../../hooks/useClients';
import { useInvoicePreview, useGenerateInvoice, useLibreOfficeStatus } from '../../hooks/useInvoice';
import { useTemplates } from '../../hooks/useTemplates';
import { fileApi, templatesApi } from '../../services/api';

interface InvoiceFormProps {
  persona: string;
  clientName: string;
  onBack: () => void;
}

export function InvoiceForm({ persona, clientName, onBack }: InvoiceFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [month, setMonth] = useState(() => {
    // Default to previous month (invoices are typically for the previous month)
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generatePdf, setGeneratePdf] = useState(true);
  const [generateEInvoice, setGenerateEInvoice] = useState(false);
  const [selectedEInvoiceFormat, setSelectedEInvoiceFormat] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    docxPath: string;
    pdfPath?: string;
    eInvoicePath?: string;
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
  } | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isOpeningTemplate, setIsOpeningTemplate] = useState(false);

  const { data: clientData, isLoading: clientLoading } = useClient(persona, clientName);
  const { data: previewData, isLoading: previewLoading, error: previewError } = useInvoicePreview(
    persona,
    clientName,
    quantity,
    month
  );
  const { data: libreOfficeStatus } = useLibreOfficeStatus();
  const { data: templatesData } = useTemplates(persona);
  const generateMutation = useGenerateInvoice(persona);

  const client = clientData?.client;
  const preview = previewData?.context;
  const canGenerateEInvoice = previewData?.canGenerateEInvoice ?? false;
  const availableFormats = previewData?.availableEInvoiceFormats ?? [];
  const currencySymbol = client?.service.currency === 'EUR' ? '\u20AC' : '$';

  const allTemplates = useMemo(() => {
    if (!templatesData) return [];
    return [...templatesData.builtIn, ...templatesData.custom];
  }, [templatesData]);

  const quantityLabel = client?.service.billingType === 'hourly' ? 'Hours' :
    client?.service.billingType === 'daily' ? 'Days' : 'Units';

  const handleGenerate = async () => {
    setGenerationResult(null);
    try {
      const result = await generateMutation.mutateAsync({
        clientName,
        quantity,
        month,
        template: selectedTemplate || undefined,
        generatePdf: generatePdf && libreOfficeStatus?.available,
        generateEInvoice: generateEInvoice && canGenerateEInvoice,
        eInvoiceFormat: selectedEInvoiceFormat || undefined,
      });
      setGenerationResult(result);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleOpenDocument = async (path: string) => {
    try {
      await fileApi.open(path);
    } catch (err) {
      console.error('Failed to open document:', err);
    }
  };

  const handleEmailInvoice = async () => {
    if (!generationResult?.pdfPath) return;
    setIsEmailing(true);
    try {
      await fileApi.emailInvoice(
        persona,
        clientName,
        generationResult.pdfPath,
        generationResult.eInvoicePath
      );
    } catch (err) {
      console.error('Failed to email invoice:', err);
    } finally {
      setIsEmailing(false);
    }
  };

  const handleOpenTemplate = async () => {
    const templateToOpen = selectedTemplate || 'default';
    setIsOpeningTemplate(true);
    try {
      await templatesApi.open(persona, templateToOpen);
    } catch (err) {
      console.error('Failed to open template:', err);
    } finally {
      setIsOpeningTemplate(false);
    }
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <FileText className="w-7 h-7 mr-3 text-primary-600" />
          Generate Invoice
        </h1>
        <p className="text-gray-500 mt-1">
          Create an invoice for {client?.name}
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Invoice Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {quantityLabel}
            </label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <div className="flex gap-2">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Default</option>
                {allTemplates.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleOpenTemplate}
                disabled={isOpeningTemplate}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                title="Edit template in word processor"
              >
                {isOpeningTemplate ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* PDF Generation */}
          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              id="generatePdf"
              checked={generatePdf}
              onChange={(e) => setGeneratePdf(e.target.checked)}
              disabled={!libreOfficeStatus?.available}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="generatePdf" className="ml-2 block text-sm text-gray-700">
              Generate PDF
              {!libreOfficeStatus?.available && (
                <span className="text-gray-400 ml-1">(LibreOffice not available)</span>
              )}
            </label>
          </div>
        </div>

        {/* E-Invoice Options */}
        {canGenerateEInvoice && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="generateEInvoice"
                checked={generateEInvoice}
                onChange={(e) => setGenerateEInvoice(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="generateEInvoice" className="ml-2 block text-sm font-medium text-gray-700">
                <FileSpreadsheet className="w-4 h-4 inline mr-1" />
                Generate E-Invoice
              </label>
            </div>

            {generateEInvoice && availableFormats.length > 0 && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Invoice Format
                </label>
                <select
                  value={selectedEInvoiceFormat}
                  onChange={(e) => setSelectedEInvoiceFormat(e.target.value)}
                  className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Auto-detect</option>
                  {availableFormats.map((f) => (
                    <option key={f.format} value={f.format}>{f.description}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      {previewLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600 mr-2" />
            <span className="text-gray-500">Calculating preview...</span>
          </div>
        </div>
      ) : previewError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Preview Error</h3>
            <p className="text-red-600 text-sm mt-1">{(previewError as Error).message}</p>
          </div>
        </div>
      ) : preview ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Preview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Invoice Number:</span>
              <span className="ml-2 font-mono font-medium">{preview.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">Invoice Date:</span>
              <span className="ml-2">{preview.invoiceDate}</span>
            </div>
            <div>
              <span className="text-gray-500">Period:</span>
              <span className="ml-2">{preview.monthName}</span>
            </div>
            {preview.dueDate && (
              <div>
                <span className="text-gray-500">Due Date:</span>
                <span className="ml-2">{preview.dueDate}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Rate:</span>
              <span className="ml-2">{currencySymbol}{preview.rate.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Subtotal:</span>
              <span className="ml-2">{currencySymbol}{preview.subtotal.toFixed(2)}</span>
            </div>
            {preview.taxAmount > 0 && (
              <div>
                <span className="text-gray-500">Tax:</span>
                <span className="ml-2">{currencySymbol}{preview.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="col-span-2 pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-medium">Total:</span>
              <span className="ml-2 text-xl font-semibold text-primary-600">
                {currencySymbol}{preview.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Generation Result */}
      {generationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <Check className="w-6 h-6 text-green-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-green-800 font-medium text-lg">Invoice Generated Successfully</h3>
              <p className="text-green-700 mt-1">
                Invoice {generationResult.invoiceNumber} for {currencySymbol}
                {generationResult.totalAmount.toFixed(2)} has been created.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleOpenDocument(generationResult.docxPath)}
                  className="inline-flex items-center px-3 py-2 bg-white border border-green-300 text-green-700 text-sm rounded-md hover:bg-green-100 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Open DOCX
                </button>

                {generationResult.pdfPath && (
                  <button
                    onClick={() => handleOpenDocument(generationResult.pdfPath!)}
                    className="inline-flex items-center px-3 py-2 bg-white border border-green-300 text-green-700 text-sm rounded-md hover:bg-green-100 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open PDF
                  </button>
                )}

                {generationResult.eInvoicePath && (
                  <button
                    onClick={() => handleOpenDocument(generationResult.eInvoicePath!)}
                    className="inline-flex items-center px-3 py-2 bg-white border border-green-300 text-green-700 text-sm rounded-md hover:bg-green-100 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Open E-Invoice
                  </button>
                )}

                {generationResult.pdfPath && client?.email?.to && (
                  <button
                    onClick={handleEmailInvoice}
                    disabled={isEmailing}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isEmailing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Email Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || quantity <= 0}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Generate Invoice
            </>
          )}
        </button>
      </div>

      {/* Generation Error */}
      {generateMutation.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Generation Failed</h3>
            <p className="text-red-600 text-sm mt-1">{(generateMutation.error as Error).message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

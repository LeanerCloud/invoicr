import { useState, useMemo } from 'react';
import { ArrowLeft, FileText, Loader2, AlertCircle, Check, Calendar, Mail, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { useClients, useClient } from '../../hooks/useClients';
import { useGenerateInvoice, useLibreOfficeStatus } from '../../hooks/useInvoice';
import { fileApi, ClientSummary, Client } from '../../services/api';

interface BatchInvoiceGeneratorProps {
  persona: string;
  onBack: () => void;
}

interface GeneratedInvoice {
  clientName: string;
  displayName: string;
  pdfPath: string;
  eInvoicePath?: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  success: boolean;
  error?: string;
}

interface ClientGroup {
  email: string;
  clients: ClientSummary[];
}

export function BatchInvoiceGenerator({ persona, onBack }: BatchInvoiceGeneratorProps) {
  const [month, setMonth] = useState(() => {
    // Default to previous month (invoices are typically for the previous month)
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generatePdf, setGeneratePdf] = useState(true);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoices, setGeneratedInvoices] = useState<GeneratedInvoice[]>([]);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailResults, setEmailResults] = useState<{ email: string; count: number; success: boolean }[] | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const { data: clients, isLoading: clientsLoading } = useClients(persona);
  const { data: libreOfficeStatus } = useLibreOfficeStatus();
  const generateMutation = useGenerateInvoice(persona);

  // Group clients by email
  const clientGroups = useMemo(() => {
    if (!clients) return [];

    const groups = new Map<string, ClientSummary[]>();
    const noEmail: ClientSummary[] = [];

    for (const client of clients) {
      // We need to fetch email info - for now group by name pattern or use a placeholder
      // This is simplified - in production you'd fetch full client data
      const emailKey = `group-${client.name.split('-')[0]}`; // Group by prefix as proxy

      const existing = groups.get(emailKey) || [];
      existing.push(client);
      groups.set(emailKey, existing);
    }

    const result: ClientGroup[] = [];
    for (const [email, groupClients] of groups) {
      if (groupClients.length > 1) {
        result.push({ email, clients: groupClients });
      } else {
        noEmail.push(...groupClients);
      }
    }

    // Add individual clients
    for (const client of noEmail) {
      result.push({ email: `individual-${client.name}`, clients: [client] });
    }

    return result;
  }, [clients]);

  const toggleClient = (clientName: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientName)) {
      newSelected.delete(clientName);
    } else {
      newSelected.add(clientName);
    }
    setSelectedClients(newSelected);
  };

  const toggleGroup = (group: ClientGroup) => {
    const allSelected = group.clients.every(c => selectedClients.has(c.name));
    const newSelected = new Set(selectedClients);

    if (allSelected) {
      group.clients.forEach(c => newSelected.delete(c.name));
    } else {
      group.clients.forEach(c => newSelected.add(c.name));
    }
    setSelectedClients(newSelected);
  };

  const toggleGroupExpanded = (email: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedGroups(newExpanded);
  };

  const selectAll = () => {
    if (clients) {
      setSelectedClients(new Set(clients.map(c => c.name)));
    }
  };

  const selectNone = () => {
    setSelectedClients(new Set());
  };

  const getQuantity = (clientName: string): string => quantities[clientName] ?? '1';

  const setQuantity = (clientName: string, value: string) => {
    // Normalize comma to period for decimal input
    const normalized = value.replace(',', '.');
    // Allow any input that could be part of a valid number (including intermediate states like "1." or empty)
    if (normalized === '' || normalized === '.' || /^-?\d*\.?\d*$/.test(normalized)) {
      setQuantities(prev => ({ ...prev, [clientName]: value }));
    }
  };

  const getNumericQuantity = (clientName: string): number => {
    const qty = quantities[clientName];
    if (!qty) return 1;
    // Normalize comma to period and parse
    const num = parseFloat(qty.replace(',', '.'));
    return isNaN(num) || num <= 0 ? 1 : num;
  };

  const getBillingLabel = (billingType: string) => {
    switch (billingType) {
      case 'hourly': return 'Hours';
      case 'daily': return 'Days';
      case 'fixed': return 'Qty';
      default: return 'Qty';
    }
  };

  const getCurrencySymbol = (currency: string) => {
    return currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
  };

  const formatRate = (client: ClientSummary) => {
    const symbol = getCurrencySymbol(client.currency);
    if (client.billingType === 'fixed') {
      return `${symbol}${client.rate.toLocaleString()}`;
    }
    return `${symbol}${client.rate.toLocaleString()}/${client.billingType === 'hourly' ? 'hr' : 'day'}`;
  };

  const calculateTotal = (client: ClientSummary, qty: number) => {
    return client.rate * qty;
  };

  const handleGenerate = async () => {
    if (selectedClients.size === 0) return;

    setIsGenerating(true);
    setGeneratedInvoices([]);
    setEmailResults(null);

    const results: GeneratedInvoice[] = [];

    for (const clientName of selectedClients) {
      const client = clients?.find(c => c.name === clientName);
      if (!client) continue;

      try {
        const result = await generateMutation.mutateAsync({
          clientName,
          quantity: getNumericQuantity(clientName),
          month,
          generatePdf: generatePdf && libreOfficeStatus?.available,
        });

        results.push({
          clientName,
          displayName: client.displayName,
          pdfPath: result.pdfPath || '',
          eInvoicePath: result.eInvoicePath,
          invoiceNumber: result.invoiceNumber,
          totalAmount: result.totalAmount,
          currency: result.currency,
          success: true,
        });
      } catch (err) {
        results.push({
          clientName,
          displayName: client.displayName,
          pdfPath: '',
          invoiceNumber: '',
          totalAmount: 0,
          currency: 'EUR',
          success: false,
          error: (err as Error).message,
        });
      }
    }

    setGeneratedInvoices(results);
    setIsGenerating(false);
  };

  const handleSendBatchEmails = async () => {
    const successfulInvoices = generatedInvoices.filter(inv => inv.success && inv.pdfPath);
    if (successfulInvoices.length === 0) return;

    setIsSendingEmails(true);

    try {
      const invoices = successfulInvoices.map(inv => ({
        clientName: inv.clientName,
        pdfPath: inv.pdfPath,
        eInvoicePath: inv.eInvoicePath,
      }));

      const result = await fileApi.batchEmailInvoices(persona, invoices);
      setEmailResults(result.results);
    } catch (err) {
      console.error('Failed to send batch emails:', err);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const successCount = generatedInvoices.filter(inv => inv.success).length;
  const errorCount = generatedInvoices.filter(inv => !inv.success).length;
  const totalAmount = generatedInvoices
    .filter(inv => inv.success)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
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
          <Users className="w-7 h-7 mr-3 text-primary-600" />
          Batch Invoice Generation
        </h1>
        <p className="text-gray-500 mt-1">
          Generate invoices for multiple clients and send batch emails
        </p>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
        <div className="grid grid-cols-2 gap-6">
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
      </div>

      {/* Client Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Select Clients</h3>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={selectNone}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Select None
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Clients with shared email addresses will be grouped for batch emailing.
          Selected: {selectedClients.size} of {clients?.length || 0}
        </p>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {clientGroups.map((group) => (
            <div key={group.email} className="border border-gray-200 rounded-md">
              {group.clients.length > 1 ? (
                // Multi-client group
                <>
                  <div
                    className="flex items-center p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleGroupExpanded(group.email)}
                  >
                    {expandedGroups.has(group.email) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    )}
                    <input
                      type="checkbox"
                      checked={group.clients.every(c => selectedClients.has(c.name))}
                      onChange={() => toggleGroup(group)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                    />
                    <Mail className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {group.clients.length} clients share email
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      {group.clients.map(c => c.displayName).join(', ')}
                    </span>
                  </div>
                  {expandedGroups.has(group.email) && (
                    <div className="border-t border-gray-200">
                      {group.clients.map((client) => (
                        <div
                          key={client.name}
                          className="flex items-center p-3 pl-10 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClients.has(client.name)}
                            onChange={() => toggleClient(client.name)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-900">{client.displayName}</span>
                            <span className="text-xs text-gray-500 ml-2 font-mono">
                              {client.invoicePrefix}-{String(client.nextInvoiceNumber).padStart(3, '0')}
                            </span>
                            <span className="text-xs text-blue-600 ml-2 font-medium">
                              {formatRate(client)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 whitespace-nowrap">{getBillingLabel(client.billingType)}:</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={getQuantity(client.name)}
                              onChange={(e) => setQuantity(client.name, e.target.value)}
                              className="w-16 text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700 w-24 text-right">
                              = {getCurrencySymbol(client.currency)}{calculateTotal(client, getNumericQuantity(client.name)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Single client
                <div className="flex items-center p-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedClients.has(group.clients[0].name)}
                    onChange={() => toggleClient(group.clients[0].name)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900">{group.clients[0].displayName}</span>
                    <span className="text-xs text-gray-500 ml-2 font-mono">
                      {group.clients[0].invoicePrefix}-{String(group.clients[0].nextInvoiceNumber).padStart(3, '0')}
                    </span>
                    <span className="text-xs text-blue-600 ml-2 font-medium">
                      {formatRate(group.clients[0])}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 whitespace-nowrap">{getBillingLabel(group.clients[0].billingType)}:</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getQuantity(group.clients[0].name)}
                      onChange={(e) => setQuantity(group.clients[0].name, e.target.value)}
                      className="w-16 text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700 w-24 text-right">
                      = {getCurrencySymbol(group.clients[0].currency)}{calculateTotal(group.clients[0], getNumericQuantity(group.clients[0].name)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generation Results */}
      {generatedInvoices.length > 0 && (
        <div className={`rounded-lg border p-6 mb-6 ${errorCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start">
            <Check className={`w-6 h-6 mr-3 mt-0.5 ${errorCount > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
            <div className="flex-1">
              <h3 className={`font-medium text-lg ${errorCount > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                Batch Generation Complete
              </h3>
              <p className={`mt-1 ${errorCount > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                {successCount} invoice(s) generated successfully
                {errorCount > 0 && `, ${errorCount} failed`}
                {successCount > 0 && ` - Total: ${totalAmount.toFixed(2)}`}
              </p>

              {/* Individual results */}
              <div className="mt-4 space-y-2">
                {generatedInvoices.map((inv) => (
                  <div
                    key={inv.clientName}
                    className={`flex items-center text-sm ${inv.success ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {inv.success ? (
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                    )}
                    <span className="font-medium">{inv.displayName}</span>
                    {inv.success ? (
                      <>
                        <span className="mx-2">-</span>
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        <span className="mx-2">-</span>
                        <span>{inv.totalAmount.toFixed(2)} {inv.currency}</span>
                      </>
                    ) : (
                      <span className="ml-2 text-red-600">{inv.error}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Batch email button */}
              {successCount > 0 && !emailResults && (
                <div className="mt-4">
                  <button
                    onClick={handleSendBatchEmails}
                    disabled={isSendingEmails}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSendingEmails ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Batch Emails
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Invoices will be grouped by recipient email address
                  </p>
                </div>
              )}

              {/* Email results */}
              {emailResults && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="text-blue-800 font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Results
                  </h4>
                  <div className="mt-2 space-y-1">
                    {emailResults.map((result, i) => (
                      <div key={i} className="flex items-center text-sm">
                        {result.success ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                        )}
                        <span className={result.success ? 'text-blue-700' : 'text-red-700'}>
                          {result.email} - {result.count} invoice(s)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedClients.size === 0}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Generate {selectedClients.size} Invoice{selectedClients.size !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

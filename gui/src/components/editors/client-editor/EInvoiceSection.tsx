import { ChevronDown, ChevronRight } from 'lucide-react';
import type { EInvoiceSectionProps } from './types';

export function EInvoiceSection({
  register,
  showEInvoice,
  setShowEInvoice,
  watchedCountryCode,
  eInvoiceFormats,
}: EInvoiceSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setShowEInvoice(!showEInvoice)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-medium text-gray-900">E-Invoice Configuration</h2>
        {showEInvoice ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {showEInvoice && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            Configure e-invoice settings for electronic invoice generation.
            Available formats for {watchedCountryCode}:
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Format
            </label>
            <select
              {...register('eInvoice.preferredFormat')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Auto-detect</option>
              {eInvoiceFormats.map((format) => (
                <option key={format.format} value={format.format}>
                  {format.description || format.format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {watchedCountryCode === 'DE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leitweg-ID
              </label>
              <input
                type="text"
                {...register('eInvoice.leitwegId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                placeholder="04011000-1234512345-12"
              />
              <p className="text-gray-500 text-xs mt-1">
                Required for German public sector (B2G) invoices
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer Reference
            </label>
            <input
              type="text"
              {...register('eInvoice.buyerReference')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="PO-2024-001"
            />
            <p className="text-gray-500 text-xs mt-1">
              Purchase order or reference number from the buyer
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

import type { InvoiceSettingsSectionProps } from './types';

export function InvoiceSettingsSection({
  register,
  errors,
}: InvoiceSettingsSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Settings</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Prefix *
            </label>
            <input
              type="text"
              {...register('invoicePrefix', { required: 'Invoice prefix is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="ACME"
            />
            {errors.invoicePrefix && (
              <p className="text-red-500 text-sm mt-1">{errors.invoicePrefix.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Invoice Number
            </label>
            <input
              type="number"
              {...register('nextInvoiceNumber', { valueAsNumber: true, min: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              min={1}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('taxRate', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="19"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms (days)
            </label>
            <input
              type="number"
              {...register('paymentTermsDays', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="14"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Reference
          </label>
          <input
            type="text"
            {...register('projectReference')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Project #12345"
          />
        </div>
      </div>
    </section>
  );
}

import type { ServiceSectionProps } from './types';
import { BILLING_TYPES, CURRENCIES } from './types';

export function ServiceSection({
  register,
  errors,
}: ServiceSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Service Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Description *
          </label>
          <input
            type="text"
            {...register('service.description', { required: 'Service description is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Software Development Services"
          />
          {errors.service?.description && (
            <p className="text-red-500 text-sm mt-1">{errors.service.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Type
            </label>
            <select
              {...register('service.billingType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {BILLING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('service.rate', { valueAsNumber: true, required: 'Rate is required', min: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="100.00"
            />
            {errors.service?.rate && (
              <p className="text-red-500 text-sm mt-1">{errors.service.rate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              {...register('service.currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

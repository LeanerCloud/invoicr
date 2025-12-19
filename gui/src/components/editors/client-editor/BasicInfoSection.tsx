import type { BasicInfoSectionProps } from './types';
import { LANGUAGES } from './types';

export function BasicInfoSection({
  register,
  errors,
  isEdit,
  directoryName,
  setDirectoryName,
  countries,
}: BasicInfoSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Name *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Client name is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Acme Corporation"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Directory Name
            </label>
            <input
              type="text"
              value={directoryName}
              onChange={(e) => setDirectoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="acme-corporation"
            />
            <p className="text-gray-500 text-xs mt-1">Folder name for this client's files</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              {...register('language')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              {...register('countryCode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            {...register('address.street', { required: 'Street address is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="456 Client Avenue"
          />
          {errors.address?.street && (
            <p className="text-red-500 text-sm mt-1">{errors.address.street.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City / Postal Code *
          </label>
          <input
            type="text"
            {...register('address.city', { required: 'City is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="54321 Metropolis"
          />
          {errors.address?.city && (
            <p className="text-red-500 text-sm mt-1">{errors.address.city.message}</p>
          )}
        </div>
      </div>
    </section>
  );
}

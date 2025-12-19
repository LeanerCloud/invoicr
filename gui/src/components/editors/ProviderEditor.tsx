import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Save, Building2, AlertCircle, Loader2, FileText, ChevronRight } from 'lucide-react';
import { useProvider, useSaveProvider } from '../../hooks/useProvider';
import { useTemplates } from '../../hooks/useTemplates';
import { Provider, countriesApi } from '../../services/api';

interface ProviderEditorProps {
  persona: string;
  onNavigateToTemplates?: () => void;
}

export function ProviderEditor({ persona, onNavigateToTemplates }: ProviderEditorProps) {
  const { data: provider, isLoading, error } = useProvider(persona);
  const { data: templates } = useTemplates(persona);
  const saveProvider = useSaveProvider(persona);
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Provider>({
    defaultValues: {
      name: '',
      address: { street: '', city: '' },
      email: '',
      phone: '',
      bank: { name: '', iban: '', bic: '' },
      taxNumber: '',
      vatId: '',
      countryCode: 'DE',
    },
  });

  useEffect(() => {
    if (provider) {
      reset(provider);
    }
  }, [provider, reset]);

  // Fetch available countries on mount
  useEffect(() => {
    countriesApi.getAll()
      .then(setCountries)
      .catch(err => {
        console.error('Failed to fetch countries:', err);
        setCountries([
          { code: 'DE', name: 'Germany' },
          { code: 'RO', name: 'Romania' },
          { code: 'US', name: 'United States' },
        ]);
      });
  }, []);

  const onSubmit = async (data: Provider) => {
    try {
      await saveProvider.mutateAsync(data);
    } catch (err) {
      console.error('Failed to save provider:', err);
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
          <h3 className="text-red-800 font-medium">Failed to load provider</h3>
          <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Building2 className="w-7 h-7 mr-3 text-primary-600" />
          Provider Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Configure your business information for invoices
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Business name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your Business Name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                {...register('address.street', { required: 'Street address is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123 Business Street"
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
                placeholder="12345 City"
              />
              {errors.address?.city && (
                <p className="text-red-500 text-sm mt-1">{errors.address.city.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="billing@yourbusiness.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+49 123 456789"
              />
            </div>
          </div>
        </section>

        {/* Tax Information */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Number
              </label>
              <input
                type="text"
                {...register('taxNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123/456/78901"
              />
              <p className="text-gray-500 text-xs mt-1">Your local tax identification number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VAT ID
              </label>
              <input
                type="text"
                {...register('vatId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="DE123456789"
              />
              <p className="text-gray-500 text-xs mt-1">EU VAT identification number (required for e-invoicing)</p>
            </div>
          </div>
        </section>

        {/* Bank Information */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Bank Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                {...register('bank.name', { required: 'Bank name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your Bank"
              />
              {errors.bank?.name && (
                <p className="text-red-500 text-sm mt-1">{errors.bank.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN *
              </label>
              <input
                type="text"
                {...register('bank.iban', { required: 'IBAN is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                placeholder="DE89 3704 0044 0532 0130 00"
              />
              {errors.bank?.iban && (
                <p className="text-red-500 text-sm mt-1">{errors.bank.iban.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BIC/SWIFT
              </label>
              <input
                type="text"
                {...register('bank.bic')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                placeholder="COBADEFFXXX"
              />
            </div>
          </div>
        </section>

        {/* Invoice Templates Summary */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-500 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Invoice Templates</h2>
            </div>
            {onNavigateToTemplates && (
              <button
                type="button"
                onClick={onNavigateToTemplates}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                Manage Templates
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-3">
            Invoice templates are DOCX files that control the layout and styling of generated invoices.
            You can upload custom templates or use the built-in ones.
          </p>

          {templates && (
            <div className="flex flex-wrap gap-2">
              {templates.builtIn.map((name) => (
                <div
                  key={name}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {name}
                </div>
              ))}
              {templates.custom.map((name) => (
                <div
                  key={name}
                  className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                >
                  {name}
                  <span className="ml-1 text-xs text-primary-500">(custom)</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || saveProvider.isPending}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveProvider.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Provider
          </button>
        </div>

        {saveProvider.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            Provider settings saved successfully!
          </div>
        )}

        {saveProvider.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Failed to save: {(saveProvider.error as Error).message}
          </div>
        )}
      </form>
    </div>
  );
}

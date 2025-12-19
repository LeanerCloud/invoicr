import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Save, ArrowLeft, User, AlertCircle, Loader2 } from 'lucide-react';
import { useClient, useCreateClient, useUpdateClient } from '../../hooks/useClients';
import { useProvider } from '../../hooks/useProvider';
import { useTemplates } from '../../hooks/useTemplates';
import { Client, eInvoiceApi, countriesApi, EInvoiceFormatInfo } from '../../services/api';
import { getStoredInvoiceEmailContent, getStoredLanguage, type Language } from '../layout/SettingsModal';
import {
  BasicInfoSection,
  InvoiceSettingsSection,
  TemplateSection,
  ServiceSection,
  EInvoiceSection,
  ClientEmailSection,
} from './client-editor';

interface ClientEditorProps {
  persona: string;
  clientName?: string;
  onBack: () => void;
  onSaved: () => void;
}

export function ClientEditor({ persona, clientName, onBack, onSaved }: ClientEditorProps) {
  const isEdit = !!clientName;
  const { data: clientData, isLoading, error } = useClient(persona, clientName || '');
  const { data: provider } = useProvider(persona);
  const { data: templates } = useTemplates(persona);
  const createClient = useCreateClient(persona);
  const updateClient = useUpdateClient(persona);
  const [showEInvoice, setShowEInvoice] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [directoryName, setDirectoryName] = useState('');
  const [eInvoiceFormats, setEInvoiceFormats] = useState<EInvoiceFormatInfo[]>([]);
  const [countriesMatch, setCountriesMatch] = useState(false);
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<Client>({
    defaultValues: {
      name: '',
      address: { street: '', city: '' },
      language: 'en',
      invoicePrefix: '',
      nextInvoiceNumber: 1,
      service: {
        description: '',
        billingType: 'hourly',
        rate: 0,
        currency: 'EUR',
      },
      countryCode: 'DE',
      taxRate: 0,
      paymentTermsDays: 14,
    },
  });

  const watchedName = watch('name');
  const watchedCountryCode = watch('countryCode');
  const watchedLanguage = watch('language') as Language;

  useEffect(() => {
    if (clientData?.client) {
      reset(clientData.client);
      if (clientData.client.eInvoice) {
        setShowEInvoice(true);
      }
      if (clientData.client.email?.subject || clientData.client.email?.body) {
        setShowEmail(true);
      }
      if (clientData.client.templateName) {
        setShowTemplate(true);
      }
    }
  }, [clientData, reset]);

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

  // Auto-generate directory name from client name
  useEffect(() => {
    if (!isEdit && watchedName) {
      const slug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setDirectoryName(slug);
    }
  }, [watchedName, isEdit]);

  // Fetch e-invoice formats when provider and client countries are known
  useEffect(() => {
    const providerCountry = provider?.countryCode;
    const clientCountry = watchedCountryCode;

    if (providerCountry && clientCountry) {
      eInvoiceApi.getFormatsForTransaction(providerCountry, clientCountry)
        .then(result => {
          setEInvoiceFormats(result.formats);
          setCountriesMatch(result.countriesMatch);
        })
        .catch(err => {
          console.error('Failed to fetch e-invoice formats:', err);
          setEInvoiceFormats([]);
          setCountriesMatch(false);
        });
    } else {
      setEInvoiceFormats([]);
      setCountriesMatch(false);
    }
  }, [provider?.countryCode, watchedCountryCode]);

  // Auto-populate email template when client is loaded and email is empty
  useEffect(() => {
    if (clientData?.client) {
      const client = clientData.client;
      if (!client.email?.body && !client.email?.subject) {
        const lang = (client.language || getStoredLanguage()) as Language;
        const emailContent = getStoredInvoiceEmailContent();
        const content = emailContent[lang];
        setValue('email.subject', content.subject);
        setValue('email.body', content.body);
      }
    }
  }, [clientData, setValue]);

  const onSubmit = async (data: Client) => {
    try {
      if (isEdit) {
        await updateClient.mutateAsync({ name: clientName, client: data });
      } else {
        await createClient.mutateAsync({ directoryName, client: data });
      }
      onSaved();
    } catch (err) {
      console.error('Failed to save client:', err);
    }
  };

  const loadEmailFromSettings = () => {
    const lang = (watchedLanguage || getStoredLanguage()) as Language;
    const emailContent = getStoredInvoiceEmailContent();
    const content = emailContent[lang];
    setValue('email.subject', content.subject, { shouldDirty: true });
    setValue('email.body', content.body, { shouldDirty: true });
  };

  const isPending = createClient.isPending || updateClient.isPending;
  const saveError = createClient.error || updateClient.error;

  if (isLoading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error && isEdit) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">Failed to load client</h3>
          <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <User className="w-7 h-7 mr-3 text-primary-600" />
          {isEdit ? 'Edit Client' : 'New Client'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <BasicInfoSection
          register={register}
          errors={errors}
          isEdit={isEdit}
          directoryName={directoryName}
          setDirectoryName={setDirectoryName}
          countries={countries}
        />

        <InvoiceSettingsSection register={register} errors={errors} />

        <TemplateSection
          register={register}
          errors={errors}
          showTemplate={showTemplate}
          setShowTemplate={setShowTemplate}
          templates={templates}
        />

        <ServiceSection register={register} errors={errors} />

        {countriesMatch && eInvoiceFormats.length > 0 && (
          <EInvoiceSection
            register={register}
            errors={errors}
            showEInvoice={showEInvoice}
            setShowEInvoice={setShowEInvoice}
            watchedCountryCode={watchedCountryCode || 'DE'}
            eInvoiceFormats={eInvoiceFormats}
          />
        )}

        <ClientEmailSection
          register={register}
          errors={errors}
          showEmail={showEmail}
          setShowEmail={setShowEmail}
          loadEmailFromSettings={loadEmailFromSettings}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isDirty || isPending}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Failed to save: {(saveError as Error).message}
          </div>
        )}
      </form>
    </div>
  );
}

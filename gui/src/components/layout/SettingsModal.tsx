import { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import { translationsApi } from '../../services/api';
import type { UITranslations, InvoiceEmailTranslations } from './settings/types';
import {
  defaultUITranslations,
  defaultInvoiceEmailContent,
  getLanguageInfo,
} from './settings/defaults';
import {
  getStoredLanguage,
  getStoredActiveLanguages,
  getStoredInvoiceEmailContent,
  getStoredUITranslations,
  getStoredPlaceholderLanguages,
} from './settings/storage';
import { EmailTemplatesSection } from './settings/EmailTemplatesSection';
import { UITranslationsSection } from './settings/UITranslationsSection';
import { ContributeSection } from './settings/ContributeSection';

// Re-export types and functions for backwards compatibility
export type { Language, EmailContent, InvoiceEmailContent, EmailTranslations, InvoiceEmailTranslations, UITranslations } from './settings/types';
export { getStoredLanguage, getStoredActiveLanguages, getStoredEmailContent, getStoredInvoiceEmailContent, getStoredUITranslations } from './settings/storage';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [language, setLanguage] = useState<string>(getStoredLanguage());
  const [activeLanguages, setActiveLanguages] = useState<string[]>(getStoredActiveLanguages());
  const [invoiceEmailContent, setInvoiceEmailContent] = useState<InvoiceEmailTranslations>(getStoredInvoiceEmailContent());
  const [uiTranslations, setUITranslations] = useState<Record<string, UITranslations>>(getStoredUITranslations());
  const [editingLang, setEditingLang] = useState<string | null>(null);
  const [editingUILang, setEditingUILang] = useState<string | null>(null);
  const [placeholderLanguages, setPlaceholderLanguages] = useState<string[]>(getStoredPlaceholderLanguages());

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('invoicr_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('invoicr_active_languages', JSON.stringify(activeLanguages));
  }, [activeLanguages]);

  useEffect(() => {
    localStorage.setItem('invoicr_invoice_email_translations', JSON.stringify(invoiceEmailContent));
  }, [invoiceEmailContent]);

  useEffect(() => {
    localStorage.setItem('invoicr_ui_translations', JSON.stringify(uiTranslations));
  }, [uiTranslations]);

  useEffect(() => {
    localStorage.setItem('invoicr_placeholder_languages', JSON.stringify(placeholderLanguages));
  }, [placeholderLanguages]);

  const handleAddLanguage = async (code: string) => {
    if (activeLanguages.includes(code)) return;

    try {
      const result = await translationsApi.get(code);

      setActiveLanguages(prev => [...prev, code]);

      if (!result.exists) {
        setPlaceholderLanguages(prev => [...prev, code]);
      }

      const trans = result.translation as Record<string, unknown>;
      const uiTrans = (trans?.ui as UITranslations) ||
                      (trans?.translations as UITranslations) ||
                      (typeof trans?.generateInvoice === 'string' ? trans as unknown as UITranslations : null);

      const invoiceTrans = trans?.invoice as Record<string, unknown> | undefined;
      const emailTrans = (invoiceTrans?.email as { subject?: string; body?: string }) ||
                         (trans?.email as { subject?: string; body?: string });

      setInvoiceEmailContent(prev => ({
        ...prev,
        [code]: prev[code] || (emailTrans?.subject ? {
          subject: emailTrans.subject,
          body: emailTrans.body || defaultInvoiceEmailContent.en.body
        } : { ...defaultInvoiceEmailContent.en })
      }));

      const hasUITranslations = uiTrans && typeof uiTrans.generateInvoice === 'string';
      setUITranslations(prev => ({
        ...prev,
        [code]: prev[code] || (hasUITranslations ? { ...defaultUITranslations.en, ...uiTrans } : { ...defaultUITranslations.en })
      }));

      if (result.exists && hasUITranslations) {
        setPlaceholderLanguages(prev => prev.filter(l => l !== code));
      }

      setEditingLang(code);
    } catch (err) {
      console.error('Failed to fetch translation:', err);
      setActiveLanguages(prev => [...prev, code]);
      setPlaceholderLanguages(prev => [...prev, code]);
      setInvoiceEmailContent(prev => ({
        ...prev,
        [code]: { ...defaultInvoiceEmailContent.en }
      }));
      setUITranslations(prev => ({
        ...prev,
        [code]: { ...defaultUITranslations.en }
      }));
    }
  };

  const handleRemoveLanguage = (code: string) => {
    if (code === 'en') return;
    setActiveLanguages(prev => prev.filter(l => l !== code));
    setPlaceholderLanguages(prev => prev.filter(l => l !== code));
    if (language === code) {
      setLanguage('en');
    }
    if (editingLang === code) {
      setEditingLang(null);
    }
    if (editingUILang === code) {
      setEditingUILang(null);
    }
  };

  const handleSubjectChange = (lang: string, value: string) => {
    setInvoiceEmailContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], subject: value }
    }));
  };

  const handleBodyChange = (lang: string, value: string) => {
    setInvoiceEmailContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], body: value }
    }));
  };

  const handleResetToDefault = (lang: string) => {
    const defaultContent = defaultInvoiceEmailContent[lang] || defaultInvoiceEmailContent.en;
    setInvoiceEmailContent(prev => ({
      ...prev,
      [lang]: defaultContent
    }));
  };

  const handleUITranslationChange = (lang: string, key: keyof UITranslations, value: string) => {
    setUITranslations(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [key]: value }
    }));
  };

  const handleResetUIToDefault = (lang: string) => {
    const defaultTrans = defaultUITranslations[lang] || defaultUITranslations.en;
    setUITranslations(prev => ({
      ...prev,
      [lang]: defaultTrans
    }));
  };

  const handleSubmitTranslation = async () => {
    const issueTitle = 'Translation Contribution';
    const issueBody = `## Translation Contribution

I'd like to contribute translations for Invoicr.

### How to add your translations:

1. Use the **Copy** button next to each language in Settings to copy the translation JSON
2. Paste the JSON below for each language you want to contribute

### My Translations:

<!-- Paste your copied translations here, one language at a time -->

\`\`\`json
// Paste your translation JSON here
\`\`\`

---
Submitted via Invoicr Settings`;

    const url = `https://github.com/LeanerCloud/invoicr/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=translation`;

    try {
      const { open } = await import('@tauri-apps/api/shell');
      await open(url);
    } catch (err) {
      console.error('Failed to open link:', err);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Language Setting */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-gray-500" />
              Language
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Select your preferred language for emails and templates.
            </p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {activeLanguages.map((code) => {
                const lang = getLanguageInfo(code);
                return (
                  <option key={code} value={code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                );
              })}
            </select>
          </section>

          {/* Invoice Email Templates */}
          <EmailTemplatesSection
            activeLanguages={activeLanguages}
            invoiceEmailContent={invoiceEmailContent}
            placeholderLanguages={placeholderLanguages}
            editingLang={editingLang}
            setEditingLang={setEditingLang}
            onAddLanguage={handleAddLanguage}
            onRemoveLanguage={handleRemoveLanguage}
            onSubjectChange={handleSubjectChange}
            onBodyChange={handleBodyChange}
            onResetToDefault={handleResetToDefault}
          />

          {/* UI Translations */}
          <UITranslationsSection
            activeLanguages={activeLanguages}
            uiTranslations={uiTranslations}
            invoiceEmailContent={invoiceEmailContent}
            placeholderLanguages={placeholderLanguages}
            editingUILang={editingUILang}
            setEditingUILang={setEditingUILang}
            onAddLanguage={handleAddLanguage}
            onRemoveLanguage={handleRemoveLanguage}
            onUITranslationChange={handleUITranslationChange}
            onResetUIToDefault={handleResetUIToDefault}
          />

          {/* Contribute Translations */}
          <ContributeSection onSubmitTranslation={handleSubmitTranslation} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

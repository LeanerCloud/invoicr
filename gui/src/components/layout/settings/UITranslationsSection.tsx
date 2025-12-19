import { useState } from 'react';
import { Type, ChevronDown, ChevronRight, RotateCcw, Trash2, AlertCircle, Copy, Check } from 'lucide-react';
import type { UITranslations, InvoiceEmailTranslations } from './types';
import { uiTranslationLabels } from './types';
import { defaultUITranslations, defaultInvoiceEmailContent, getLanguageInfo } from './defaults';
import { LanguageSearchDropdown } from './LanguageSearchDropdown';

interface UITranslationsSectionProps {
  activeLanguages: string[];
  uiTranslations: Record<string, UITranslations>;
  invoiceEmailContent: InvoiceEmailTranslations;
  placeholderLanguages: string[];
  editingUILang: string | null;
  setEditingUILang: (lang: string | null) => void;
  onAddLanguage: (code: string) => void;
  onRemoveLanguage: (code: string) => void;
  onUITranslationChange: (lang: string, key: keyof UITranslations, value: string) => void;
  onResetUIToDefault: (lang: string) => void;
}

export function UITranslationsSection({
  activeLanguages,
  uiTranslations,
  invoiceEmailContent,
  placeholderLanguages,
  editingUILang,
  setEditingUILang,
  onAddLanguage,
  onRemoveLanguage,
  onUITranslationChange,
  onResetUIToDefault,
}: UITranslationsSectionProps) {
  const [translationsExpanded, setTranslationsExpanded] = useState(false);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  const isPlaceholder = (code: string) => placeholderLanguages.includes(code);

  const handleCopyTranslation = async (code: string) => {
    const langInfo = getLanguageInfo(code);
    const translations = uiTranslations[code] || defaultUITranslations.en;
    const emailContent = invoiceEmailContent[code] || defaultInvoiceEmailContent.en;

    const unifiedTranslation = {
      code,
      name: langInfo.name,
      nativeName: langInfo.nativeName,
      ui: translations,
      invoice: {
        email: emailContent
      }
    };

    const jsonStr = JSON.stringify(unifiedTranslation, null, 2);

    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopiedLang(code);
      setTimeout(() => setCopiedLang(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section>
      <button
        onClick={() => setTranslationsExpanded(!translationsExpanded)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3"
      >
        <span className="flex items-center">
          <Type className="w-4 h-4 mr-2 text-gray-500" />
          UI Translations
        </span>
        {translationsExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {translationsExpanded && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Customize the UI text strings for each language. Contribute your translations to the project!
          </p>

          <div className="mb-4">
            <LanguageSearchDropdown
              activeLanguages={activeLanguages}
              onAddLanguage={onAddLanguage}
              placeholder="Search and add a language..."
            />
          </div>

          <div className="space-y-3">
            {activeLanguages.map((code) => {
              const lang = getLanguageInfo(code);
              const translations = uiTranslations[code] || defaultUITranslations.en;
              const isNew = isPlaceholder(code);
              return (
                <div
                  key={code}
                  className={`border rounded-lg overflow-hidden ${
                    editingUILang === code ? 'border-primary-300' : isNew ? 'border-amber-300' : 'border-gray-200'
                  }`}
                >
                  <div className={`flex items-center ${isNew ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <button
                      onClick={() => setEditingUILang(editingUILang === code ? null : code)}
                      className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {lang.name} ({lang.nativeName})
                        </span>
                        {isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Needs translation
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {editingUILang === code ? 'Click to collapse' : 'Click to edit'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleCopyTranslation(code)}
                      className={`px-3 py-3 transition-colors ${
                        copiedLang === code
                          ? 'text-green-500'
                          : 'text-gray-400 hover:text-primary-600'
                      }`}
                      title={copiedLang === code ? 'Copied!' : 'Copy translation JSON'}
                    >
                      {copiedLang === code ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {code !== 'en' && (
                      <button
                        onClick={() => onRemoveLanguage(code)}
                        className="px-3 py-3 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove language"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {editingUILang === code && (
                    <div className="p-4 space-y-3 bg-white max-h-64 overflow-y-auto">
                      {isNew && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 mb-3">
                          <strong>Placeholder text:</strong> English strings are shown as placeholders. Please translate them to {lang.name}.
                        </div>
                      )}
                      {(Object.keys(uiTranslationLabels) as (keyof UITranslations)[]).map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <label className="text-xs text-gray-500 w-40 flex-shrink-0">
                            {uiTranslationLabels[key]}
                          </label>
                          <input
                            type="text"
                            value={translations[key] || ''}
                            placeholder={defaultUITranslations.en[key]}
                            onChange={(e) => onUITranslationChange(code, key, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => onResetUIToDefault(code)}
                        className="inline-flex items-center px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors mt-2"
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Reset to Default
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

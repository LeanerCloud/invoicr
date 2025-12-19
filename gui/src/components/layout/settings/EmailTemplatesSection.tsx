import { useState } from 'react';
import { Mail, RotateCcw, Trash2, AlertCircle, Copy, Check } from 'lucide-react';
import type { InvoiceEmailTranslations } from './types';
import { defaultInvoiceEmailContent, getLanguageInfo } from './defaults';
import { LanguageSearchDropdown } from './LanguageSearchDropdown';

interface EmailTemplatesSectionProps {
  activeLanguages: string[];
  invoiceEmailContent: InvoiceEmailTranslations;
  placeholderLanguages: string[];
  editingLang: string | null;
  setEditingLang: (lang: string | null) => void;
  onAddLanguage: (code: string) => void;
  onRemoveLanguage: (code: string) => void;
  onSubjectChange: (lang: string, value: string) => void;
  onBodyChange: (lang: string, value: string) => void;
  onResetToDefault: (lang: string) => void;
}

export function EmailTemplatesSection({
  activeLanguages,
  invoiceEmailContent,
  placeholderLanguages,
  editingLang,
  setEditingLang,
  onAddLanguage,
  onRemoveLanguage,
  onSubjectChange,
  onBodyChange,
  onResetToDefault,
}: EmailTemplatesSectionProps) {
  const [copiedEmailLang, setCopiedEmailLang] = useState<string | null>(null);

  const isPlaceholder = (code: string) => placeholderLanguages.includes(code);

  const handleCopyEmailTemplate = async (code: string) => {
    const langInfo = getLanguageInfo(code);
    const emailContent = invoiceEmailContent[code] || defaultInvoiceEmailContent.en;

    const emailTemplate = {
      code,
      name: langInfo.name,
      nativeName: langInfo.nativeName,
      email: emailContent
    };

    const jsonStr = JSON.stringify(emailTemplate, null, 2);

    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopiedEmailLang(code);
      setTimeout(() => setCopiedEmailLang(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center">
        <Mail className="w-4 h-4 mr-2 text-gray-500" />
        Invoice Email Templates
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Customize the email sent with invoices. Use placeholders like {'{{invoiceNumber}}'}, {'{{monthName}}'}, {'{{serviceDescription}}'}, {'{{totalAmount}}'}.
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
          const content = invoiceEmailContent[code] || defaultInvoiceEmailContent.en;
          const isNew = isPlaceholder(code);
          return (
            <div
              key={code}
              className={`border rounded-lg overflow-hidden ${
                editingLang === code ? 'border-primary-300' : isNew ? 'border-amber-300' : 'border-gray-200'
              }`}
            >
              <div className={`flex items-center ${isNew ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <button
                  onClick={() => setEditingLang(editingLang === code ? null : code)}
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
                    {editingLang === code ? 'Click to collapse' : 'Click to edit'}
                  </span>
                </button>
                <button
                  onClick={() => handleCopyEmailTemplate(code)}
                  className={`px-3 py-3 transition-colors ${
                    copiedEmailLang === code
                      ? 'text-green-500'
                      : 'text-gray-400 hover:text-primary-600'
                  }`}
                  title={copiedEmailLang === code ? 'Copied!' : 'Copy email template JSON'}
                >
                  {copiedEmailLang === code ? (
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

              {editingLang === code && (
                <div className="p-4 space-y-4 bg-white">
                  {isNew && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                      <strong>Placeholder text:</strong> English strings are shown as placeholders. Please translate them to {lang.name}.
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={content.subject}
                      onChange={(e) => onSubjectChange(code, e.target.value)}
                      placeholder={defaultInvoiceEmailContent.en.subject}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${isNew ? 'border-amber-300 bg-amber-50' : 'border-gray-300'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Body
                    </label>
                    <textarea
                      value={content.body}
                      onChange={(e) => onBodyChange(code, e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
                    />
                  </div>

                  <button
                    onClick={() => onResetToDefault(code)}
                    className="inline-flex items-center px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
    </section>
  );
}

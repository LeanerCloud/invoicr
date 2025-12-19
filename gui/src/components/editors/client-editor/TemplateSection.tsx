import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { TemplateSectionProps } from './types';

export function TemplateSection({
  register,
  showTemplate,
  setShowTemplate,
  templates,
}: TemplateSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setShowTemplate(!showTemplate)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-gray-500 mr-3" />
          <h2 className="text-lg font-medium text-gray-900">Invoice Template</h2>
        </div>
        {showTemplate ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {showTemplate && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            Select an invoice template for this client. Templates can be customized in Word or Pages.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Template
            </label>
            <select
              {...register('templateName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Default Template</option>
              <optgroup label="Built-in Templates">
                {templates?.builtIn.map((name) => (
                  <option key={name} value={name}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </option>
                ))}
              </optgroup>
              {templates?.custom && templates.custom.length > 0 && (
                <optgroup label="Custom Templates">
                  {templates.custom.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-gray-500 text-xs mt-1">
              Manage templates in the Templates section of the sidebar
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

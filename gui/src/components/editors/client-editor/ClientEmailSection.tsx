import { ChevronDown, ChevronRight, Mail, FileDown } from 'lucide-react';
import type { EmailTemplateSectionProps } from './types';
import { EMAIL_PLACEHOLDERS } from './types';

export function ClientEmailSection({
  register,
  showEmail,
  setShowEmail,
  loadEmailFromSettings,
}: EmailTemplateSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setShowEmail(!showEmail)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <div className="flex items-center">
          <Mail className="w-5 h-5 text-gray-500 mr-3" />
          <h2 className="text-lg font-medium text-gray-900">Email Template</h2>
        </div>
        {showEmail ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {showEmail && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Customize the email subject and body for this client.
            </p>
            <button
              type="button"
              onClick={loadEmailFromSettings}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Load from Settings
            </button>
          </div>

          {/* Available Placeholders */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Available placeholders:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {EMAIL_PLACEHOLDERS.map((p) => (
                <div key={p.placeholder} className="flex items-start">
                  <code className="text-primary-600 bg-primary-50 px-1 rounded mr-1">{p.placeholder}</code>
                  <span className="text-gray-500">{p.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Recipients
            </label>
            <input
              type="text"
              {...register('email.to.0')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="billing@client.com"
            />
            <p className="text-gray-500 text-xs mt-1">Primary recipient email address</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CC Recipients
            </label>
            <input
              type="text"
              {...register('email.cc.0')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="accounting@client.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              {...register('email.subject')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Invoice {{invoiceNumber}} ({{monthName}}) - {{providerName}}"
            />
            <p className="text-gray-500 text-xs mt-1">
              Click "Load from Settings" to use your default template
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body
            </label>
            <textarea
              {...register('email.body')}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder={`Hello,

Please find attached invoice {{invoiceNumber}} for {{servicePeriod}}.

Service: {{serviceDescription}}
Amount: {{totalAmount}}

Best regards,
{{providerName}}`}
            />
          </div>
        </div>
      )}
    </section>
  );
}

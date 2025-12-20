import { X, ExternalLink, Mail, Github, Cloud } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { getStoredLanguage, getStoredEmailContent } from './SettingsModal';

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  const language = getStoredLanguage();
  const emailContent = getStoredEmailContent();
  const content = emailContent[language];

  const mailtoLink = `mailto:?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.body)}&reply-to=contact@leanercloud.com`;

  const handleOpenLink = async (url: string) => {
    try {
      await open(url);
    } catch (err) {
      console.error('Failed to open link:', err);
      // Fallback: try window.open
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">About Invoicr</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* What is Invoicr */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              What is Invoicr?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Invoicr is a free, open-source invoicing tool designed for freelancers and consultants.
              It generates professional invoices, supports multiple
              clients and billing types (hourly, daily, fixed), and can create e-invoices for
              compliance with EU regulations like XRechnung and ZUGFeRD.
            </p>
          </section>

          {/* Built by LeanerCloud */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Built by LeanerCloud
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Invoicr is built and maintained by{' '}
              <button
                onClick={() => handleOpenLink('https://leanercloud.com')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                LeanerCloud
              </button>
              . We specialize in AWS cost optimization and help businesses reduce
              their AWS bills by 10-35% through a mix of services and tools.
            </p>
          </section>

          {/* Refer a Client */}
          <section className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Cloud className="w-4 h-4 mr-2 text-primary-600" />
              Know someone paying too much for AWS?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Send them an introduction to LeanerCloud with one click. We'd love to help them out,
              and we offer a generous referral bonus if things work out!
            </p>
            <button
              onClick={() => handleOpenLink(mailtoLink)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Introduction Email
            </button>
          </section>

          {/* Links */}
          <section className="pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleOpenLink('https://github.com/LeanerCloud/invoicr')}
                className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Github className="w-4 h-4 mr-1.5" />
                View on GitHub
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
              <button
                onClick={() => handleOpenLink('https://leanercloud.com')}
                className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Cloud className="w-4 h-4 mr-1.5" />
                LeanerCloud.com
                <ExternalLink className="w-3 h-3 ml-1" />
              </button>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Made with care for the freelance community
          </p>
        </div>
      </div>
    </div>
  );
}

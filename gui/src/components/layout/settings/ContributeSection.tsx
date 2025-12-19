import { Copy } from 'lucide-react';

interface ContributeSectionProps {
  onSubmitTranslation: () => void;
}

export function ContributeSection({ onSubmitTranslation }: ContributeSectionProps) {
  return (
    <section className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-2">How to contribute translations:</h4>
      <ol className="text-sm text-gray-600 space-y-1 mb-3 list-decimal list-inside">
        <li>Edit the translations above for your language</li>
        <li>Click the <Copy className="w-3 h-3 inline mx-1" /> copy button to copy the JSON</li>
        <li>Click the button below to open a GitHub issue</li>
        <li>Paste your translations in the issue</li>
      </ol>
      <button
        onClick={onSubmitTranslation}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
      >
        Open GitHub Issue
      </button>
    </section>
  );
}

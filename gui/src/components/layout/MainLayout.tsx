import { ReactNode } from 'react';
import { open } from '@tauri-apps/plugin-shell';

interface MainLayoutProps {
  children: ReactNode;
}

const handleOpenLink = async (url: string) => {
  try {
    await open(url);
  } catch (err) {
    console.error('Failed to open link:', err);
    window.open(url, '_blank');
  }
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            <button
              onClick={() => handleOpenLink('https://github.com/LeanerCloud/invoicr')}
              className="hover:text-primary-600 transition-colors"
            >
              Invoicr
            </button>
            <span className="text-gray-400 font-normal text-base ml-2">
              by{' '}
              <button
                onClick={() => handleOpenLink('https://leanercloud.com')}
                className="hover:text-primary-600 transition-colors"
              >
                LeanerCloud
              </button>
            </span>
          </h1>
        </div>
        <button
          onClick={() => handleOpenLink('https://www.npmjs.com/package/invoicr')}
          className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          v{__APP_VERSION__}
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

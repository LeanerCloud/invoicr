import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import type { LanguageOption } from './types';
import { allLanguages } from './defaults';

interface LanguageSearchDropdownProps {
  activeLanguages: string[];
  onAddLanguage: (code: string) => void;
  placeholder?: string;
}

export function LanguageSearchDropdown({
  activeLanguages,
  onAddLanguage,
  placeholder = "Search and add a language..."
}: LanguageSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter languages that aren't already active
  const availableLanguages = allLanguages.filter(
    lang => !activeLanguages.includes(lang.code) &&
    (lang.name.toLowerCase().includes(search.toLowerCase()) ||
     lang.nativeName.toLowerCase().includes(search.toLowerCase()) ||
     lang.code.toLowerCase().includes(search.toLowerCase()))
  );

  // Check if search could be a valid language code (2-3 letters)
  const isValidCode = /^[a-z]{2,3}$/i.test(search.trim());
  const searchAsCode = search.trim().toLowerCase();
  const codeAlreadyExists = allLanguages.some(l => l.code === searchAsCode) || activeLanguages.includes(searchAsCode);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onAddLanguage(code);
    setSearch('');
    setIsOpen(false);
    setShowCustomForm(false);
  };

  const handleAddCustom = () => {
    if (isValidCode && !codeAlreadyExists) {
      // Add to allLanguages dynamically
      const newLang: LanguageOption = {
        code: searchAsCode,
        name: customName || search.trim(),
        nativeName: customName || search.trim()
      };
      allLanguages.push(newLang);
      handleSelect(searchAsCode);
      setCustomName('');
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowCustomForm(false);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {isOpen && availableLanguages.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-primary-50 flex items-center justify-between"
            >
              <span className="font-medium text-gray-900">{lang.name}</span>
              <span className="text-gray-500">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && availableLanguages.length === 0 && search && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          {!showCustomForm ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 text-center">
                No languages found matching "{search}"
              </p>
              {isValidCode && !codeAlreadyExists && (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="w-full px-3 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-md hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add "{searchAsCode}" as new language
                </button>
              )}
              {!isValidCode && search.length > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  Tip: Enter a 2-3 letter language code (e.g., "fr", "es", "ja")
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Add custom language: <span className="font-mono bg-gray-100 px-1 rounded">{searchAsCode}</span>
              </p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Language name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={`e.g., ${search.charAt(0).toUpperCase() + search.slice(1)}`}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="flex-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustom}
                  disabled={!customName.trim()}
                  className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Language
                </button>
              </div>
              <p className="text-xs text-gray-400">
                English strings will be used as placeholders for translation.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

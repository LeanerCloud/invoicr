import { useState } from 'react';
import { X } from 'lucide-react';
import { personasApi } from '../../services/api';

interface NewPersonaModalProps {
  onClose: () => void;
  onCreated: (personaName: string) => void;
}

export function NewPersonaModal({ onClose, onCreated }: NewPersonaModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setError('Name can only contain letters, numbers, dashes and underscores');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await personasApi.create(name);
      onCreated(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">New Business Activity</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Freelancing, Consulting"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be used as the folder name and displayed in the sidebar
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Users, Plus, Search, FileText, History, Edit, Trash2, Copy, Loader2, AlertCircle } from 'lucide-react';
import { useClients, useDeleteClient, useCloneClient } from '../../hooks/useClients';
import { ClientSummary } from '../../services/api';

interface ClientListProps {
  persona: string;
  onSelectClient: (name: string) => void;
  onEditClient: (name: string) => void;
  onViewHistory: (name: string) => void;
  onCreateClient: () => void;
}

export function ClientList({ persona, onSelectClient, onEditClient, onViewHistory, onCreateClient }: ClientListProps) {
  const { data: clients, isLoading, error } = useClients(persona);
  const deleteClient = useDeleteClient(persona);
  const cloneClient = useCloneClient(persona);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [cloneConfirm, setCloneConfirm] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [clonePrefix, setClonePrefix] = useState('');
  const [cloneResetCounter, setCloneResetCounter] = useState(true);

  const filteredClients = clients?.filter((client) =>
    client.displayName.toLowerCase().includes(search.toLowerCase()) ||
    client.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleDelete = async (name: string) => {
    try {
      await deleteClient.mutateAsync(name);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  };

  const handleStartClone = (name: string, displayName: string, invoicePrefix: string) => {
    setCloneConfirm(name);
    setCloneName(displayName);
    setClonePrefix(invoicePrefix);
    setCloneResetCounter(true);
  };

  const handleClone = async (sourceName: string) => {
    if (!cloneName.trim()) return;
    const newDirectoryName = cloneName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    try {
      await cloneClient.mutateAsync({
        name: sourceName,
        newDirectoryName,
        newDisplayName: cloneName,
        newInvoicePrefix: clonePrefix || undefined,
        resetCounter: cloneResetCounter,
      });
      setCloneConfirm(null);
      setCloneName('');
      setClonePrefix('');
    } catch (err) {
      console.error('Failed to clone client:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">Failed to load clients</h3>
          <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Users className="w-7 h-7 mr-3 text-primary-600" />
            Clients
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your client list and generate invoices
          </p>
        </div>
        <button
          onClick={onCreateClient}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          {search ? (
            <>
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-gray-600 font-medium">No clients found</h3>
              <p className="text-gray-500 text-sm mt-1">Try a different search term</p>
            </>
          ) : (
            <>
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-gray-600 font-medium">No clients yet</h3>
              <p className="text-gray-500 text-sm mt-1">Create your first client to get started</p>
              <button
                onClick={onCreateClient}
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {filteredClients.map((client) => (
            <ClientRow
              key={client.name}
              client={client}
              onSelect={() => onSelectClient(client.name)}
              onEdit={() => onEditClient(client.name)}
              onViewHistory={() => onViewHistory(client.name)}
              onDelete={() => setDeleteConfirm(client.name)}
              isDeleting={deleteConfirm === client.name}
              onConfirmDelete={() => handleDelete(client.name)}
              onCancelDelete={() => setDeleteConfirm(null)}
              deleteInProgress={deleteClient.isPending}
              onClone={() => handleStartClone(client.name, client.displayName, client.invoicePrefix)}
              isCloning={cloneConfirm === client.name}
              cloneName={cloneName}
              onCloneNameChange={setCloneName}
              clonePrefix={clonePrefix}
              onClonePrefixChange={setClonePrefix}
              cloneResetCounter={cloneResetCounter}
              onCloneResetCounterChange={setCloneResetCounter}
              onConfirmClone={() => handleClone(client.name)}
              onCancelClone={() => { setCloneConfirm(null); setCloneName(''); setClonePrefix(''); }}
              cloneInProgress={cloneClient.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ClientRowProps {
  client: ClientSummary;
  onSelect: () => void;
  onEdit: () => void;
  onViewHistory: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  deleteInProgress: boolean;
  onClone: () => void;
  isCloning: boolean;
  cloneName: string;
  onCloneNameChange: (name: string) => void;
  clonePrefix: string;
  onClonePrefixChange: (prefix: string) => void;
  cloneResetCounter: boolean;
  onCloneResetCounterChange: (reset: boolean) => void;
  onConfirmClone: () => void;
  onCancelClone: () => void;
  cloneInProgress: boolean;
}

function ClientRow({
  client,
  onSelect,
  onEdit,
  onViewHistory,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  deleteInProgress,
  onClone,
  isCloning,
  cloneName,
  onCloneNameChange,
  clonePrefix,
  onClonePrefixChange,
  cloneResetCounter,
  onCloneResetCounterChange,
  onConfirmClone,
  onCancelClone,
  cloneInProgress,
}: ClientRowProps) {
  const currencySymbol = client.currency === 'EUR' ? '\u20AC' : '$';

  if (isCloning) {
    return (
      <div className="p-4 bg-blue-50">
        <p className="text-blue-800 font-medium mb-3">
          Clone "{client.displayName}"
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">New client name</label>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => onCloneNameChange(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              placeholder="Enter new client name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Invoice prefix</label>
            <input
              type="text"
              value={clonePrefix}
              onChange={(e) => onClonePrefixChange(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-mono"
              placeholder="e.g., ACM"
              maxLength={10}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={cloneResetCounter}
              onChange={(e) => onCloneResetCounterChange(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Reset invoice counter to 1
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirmClone}
            disabled={cloneInProgress || !cloneName.trim()}
            className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {cloneInProgress ? 'Cloning...' : 'Clone'}
          </button>
          <button
            onClick={onCancelClone}
            disabled={cloneInProgress}
            className="px-3 py-1.5 bg-white text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (isDeleting) {
    return (
      <div className="p-4 bg-red-50">
        <p className="text-red-800 font-medium mb-3">
          Delete "{client.displayName}"?
        </p>
        <p className="text-red-600 text-sm mb-4">
          This will delete the client configuration and all history. This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirmDelete}
            disabled={deleteInProgress}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteInProgress ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onCancelDelete}
            disabled={deleteInProgress}
            className="px-3 py-1.5 bg-white text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <button
            onClick={onSelect}
            className="text-left group"
          >
            <h3 className="text-gray-900 font-medium group-hover:text-primary-600 transition-colors truncate">
              {client.displayName}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="font-mono">{client.invoicePrefix}-{String(client.nextInvoiceNumber).padStart(3, '0')}</span>
              <span>{currencySymbol}</span>
              <span className="uppercase">{client.language}</span>
              {client.countryCode && (
                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium">
                  {client.countryCode}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={onSelect}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            title="Create Invoice"
          >
            <FileText className="w-4 h-4" />
          </button>
          {client.hasHistory && (
            <button
              onClick={onViewHistory}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
              title="View History"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClone}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            title="Clone Client"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            title="Edit Client"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

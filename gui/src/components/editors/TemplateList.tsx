import { useState, useRef } from 'react';
import { FileText, Download, Trash2, Loader2, AlertCircle, Lock, Copy, ExternalLink, Upload, Pencil, FolderOpen } from 'lucide-react';
import { useTemplates, useDeleteTemplate, useDownloadTemplate, useCopyTemplate, useOpenTemplate, useUploadTemplate, useRenameTemplate, useOpenTemplatesFolder } from '../../hooks/useTemplates';
import { ConfirmModal } from '../common/ConfirmModal';

interface TemplateListProps {
  persona: string;
}

export function TemplateList({ persona }: TemplateListProps) {
  const { data: templates, isLoading, error, refetch } = useTemplates(persona);
  const deleteTemplate = useDeleteTemplate(persona);
  const downloadTemplate = useDownloadTemplate(persona);
  const copyTemplate = useCopyTemplate(persona);
  const openTemplate = useOpenTemplate(persona);
  const uploadTemplate = useUploadTemplate(persona);
  const renameTemplate = useRenameTemplate(persona);
  const openFolder = useOpenTemplatesFolder(persona);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [copyingName, setCopyingName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Copy modal state
  const [templateToCopy, setTemplateToCopy] = useState<string | null>(null);
  const [newCopyName, setNewCopyName] = useState('');
  const [copyError, setCopyError] = useState<string | null>(null);

  // Rename modal state
  const [templateToRename, setTemplateToRename] = useState<string | null>(null);
  const [newRenameName, setNewRenameName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setDeletingName(templateToDelete);
    setDeleteError(null);
    try {
      await deleteTemplate.mutateAsync(templateToDelete);
      setTemplateToDelete(null);
    } catch (err) {
      setDeleteError((err as Error).message || 'Failed to delete template');
      setTemplateToDelete(null);
    } finally {
      setDeletingName(null);
    }
  };

  const handleDownload = async (name: string) => {
    try {
      await downloadTemplate.mutateAsync(name);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Show copy modal with suggested name
  const handleCopyClick = (name: string) => {
    setTemplateToCopy(name);
    setNewCopyName(`${name}-custom`);
    setCopyError(null);
  };

  // Confirm copy with custom name
  const handleCopyConfirm = async () => {
    if (!templateToCopy || !newCopyName.trim()) return;

    setCopyingName(templateToCopy);
    setCopyError(null);
    try {
      const result = await copyTemplate.mutateAsync({
        name: templateToCopy,
        newName: newCopyName.trim()
      });
      // Open the copied template for editing
      await openTemplate.mutateAsync(result.name);
      setTemplateToCopy(null);
      setNewCopyName('');
    } catch (err) {
      setCopyError((err as Error).message || 'Failed to copy template');
    } finally {
      setCopyingName(null);
    }
  };

  // Show rename modal
  const handleRenameClick = (name: string) => {
    setTemplateToRename(name);
    setNewRenameName(name);
    setRenameError(null);
  };

  // Confirm rename
  const handleRenameConfirm = async () => {
    if (!templateToRename || !newRenameName.trim()) return;
    if (newRenameName.trim() === templateToRename) {
      setTemplateToRename(null);
      return;
    }

    setIsRenaming(true);
    setRenameError(null);
    try {
      await renameTemplate.mutateAsync({
        oldName: templateToRename,
        newName: newRenameName.trim()
      });
      setTemplateToRename(null);
      setNewRenameName('');
    } catch (err) {
      setRenameError((err as Error).message || 'Failed to rename template');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleOpen = async (name: string) => {
    try {
      await openTemplate.mutateAsync(name);
    } catch (err) {
      console.error('Open failed:', err);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Get template name from filename (without extension)
    const name = file.name.replace(/\.docx$/i, '');

    setUploadError(null);
    try {
      await uploadTemplate.mutateAsync({ name, file });
      refetch();
    } catch (err) {
      setUploadError((err as Error).message || 'Failed to upload template');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <h3 className="text-red-800 font-medium">Failed to load templates</h3>
          <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const builtInTemplates = templates?.builtIn || [];
  const customTemplates = templates?.custom || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <FileText className="w-7 h-7 mr-3 text-primary-600" />
          Invoice Templates
        </h1>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => openFolder.mutate()}
            disabled={openFolder.isPending}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Open templates folder in Finder"
          >
            {openFolder.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FolderOpen className="w-4 h-4 mr-2" />
            )}
            Open Folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadTemplate.isPending}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {uploadTemplate.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Template
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Invoice templates control how your invoices look. Download a template, edit it in Word or Pages,
        then upload your customized version. Use placeholders like <code className="bg-gray-100 px-1 rounded">{'{provider.name}'}</code> that
        will be replaced with actual data.
      </p>

      {/* Built-in Templates */}
      <section className="mb-8">
        <h2 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
          <Lock className="w-4 h-4 mr-2 text-gray-400" />
          Built-in Templates
        </h2>
        <div className="grid gap-3">
          {builtInTemplates.map((name) => (
            <div
              key={name}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-primary-600 mr-2" />
                    <h3 className="font-medium text-gray-900 capitalize">{name}</h3>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      built-in
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {name === 'default' && 'Standard professional invoice layout'}
                    {name === 'minimal' && 'Clean, compact invoice design'}
                    {name === 'detailed' && 'Comprehensive B2B invoice format'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(name)}
                    disabled={downloadTemplate.isPending}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="Download template"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyClick(name)}
                    disabled={copyingName === name}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="Copy and edit"
                  >
                    {copyingName === name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpen(name)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="Open in Word/Pages"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Templates */}
      <section>
        <h2 className="text-lg font-medium text-gray-700 mb-3">Custom Templates</h2>
        {customTemplates.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-8 text-center">
            <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">No custom templates yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Click "Copy and edit" on a built-in template to create your first custom template
            </p>
            <button
              onClick={() => handleCopyClick('default')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Create from default template
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {customTemplates.map((name) => (
              <div
                key={name}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-primary-600 mr-2" />
                      <h3 className="font-medium text-gray-900">{name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Custom template</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(name)}
                      disabled={downloadTemplate.isPending}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      title="Download template"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpen(name)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      title="Open in Word/Pages"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRenameClick(name)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      title="Rename template"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplateToDelete(name);
                      }}
                      disabled={deletingName === name}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete template"
                    >
                      {deletingName === name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Placeholder Reference */}
      <section className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Available Placeholders</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Provider:</strong> {'{provider.name}'}, {'{provider.address.street}'}, {'{provider.email}'}, {'{provider.phone}'}</p>
          <p><strong>Client:</strong> {'{client.name}'}, {'{client.address.street}'}, {'{client.address.city}'}</p>
          <p><strong>Invoice:</strong> {'{invoiceNumber}'}, {'{invoiceDate}'}, {'{dueDate}'}, {'{servicePeriod}'}</p>
          <p><strong>Totals:</strong> {'{subtotal}'}, {'{tax}'}, {'{taxRate}'}, {'{totalAmount}'}</p>
          <p><strong>Line items:</strong> {'{#lineItems}'}{'{description}'} - {'{total}'}{'{/lineItems}'}</p>
          <p><strong>Bank:</strong> {'{bank.name}'}, {'{bank.iban}'}, {'{bank.bic}'}</p>
        </div>
      </section>

      {/* Upload Error Display */}
      {uploadError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">Failed to upload template</h4>
              <p className="text-red-600 text-sm mt-1">{uploadError}</p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="ml-3 text-red-500 hover:text-red-700"
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Delete Error Display */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">Failed to delete template</h4>
              <p className="text-red-600 text-sm mt-1">{deleteError}</p>
            </div>
            <button
              onClick={() => setDeleteError(null)}
              className="ml-3 text-red-500 hover:text-red-700"
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!templateToDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${templateToDelete}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={!!deletingName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTemplateToDelete(null)}
      />

      {/* Copy Template Modal */}
      {templateToCopy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Copy Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a name for the new template:
            </p>
            <input
              type="text"
              value={newCopyName}
              onChange={(e) => setNewCopyName(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm mb-4"
              placeholder="Template name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCopyConfirm();
                if (e.key === 'Escape') {
                  setTemplateToCopy(null);
                  setNewCopyName('');
                }
              }}
            />
            {copyError && (
              <p className="text-red-600 text-sm mb-4">{copyError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setTemplateToCopy(null);
                  setNewCopyName('');
                  setCopyError(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyConfirm}
                disabled={!newCopyName.trim() || !!copyingName}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {copyingName ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Copying...
                  </span>
                ) : (
                  'Copy & Edit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Template Modal */}
      {templateToRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rename Template</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the new name for "{templateToRename}":
            </p>
            <input
              type="text"
              value={newRenameName}
              onChange={(e) => setNewRenameName(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm mb-4"
              placeholder="Template name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameConfirm();
                if (e.key === 'Escape') {
                  setTemplateToRename(null);
                  setNewRenameName('');
                }
              }}
            />
            {renameError && (
              <p className="text-red-600 text-sm mb-4">{renameError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setTemplateToRename(null);
                  setNewRenameName('');
                  setRenameError(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameConfirm}
                disabled={!newRenameName.trim() || isRenaming}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isRenaming ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Renaming...
                  </span>
                ) : (
                  'Rename'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

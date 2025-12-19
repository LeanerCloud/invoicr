import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-amber-500',
      iconBg: 'bg-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      icon: 'text-blue-500',
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${styles.iconBg} mr-3`}>
              <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${styles.button}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

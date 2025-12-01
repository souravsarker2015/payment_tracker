import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const typeStyles = {
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        danger: 'bg-red-50 text-red-800 border-red-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200'
    };

    const iconColor = {
        warning: 'text-yellow-600',
        danger: 'text-red-600',
        info: 'text-blue-600'
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Invisible backdrop for click-to-close functionality */}
            <div
                className="absolute inset-0 bg-transparent"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${iconColor[type]}`}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {message}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${type === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-yellow-600 hover:bg-yellow-700'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

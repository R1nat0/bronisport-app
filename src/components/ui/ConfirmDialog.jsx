import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  title = 'Подтверждение', 
  message, 
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm, 
  onCancel,
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Title */}
          <h2 className="text-xl font-bold text-on-surface mb-2 font-headline">
            {title}
          </h2>

          {/* Message */}
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-container-high/80 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors ${
                isDangerous
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;

import React from 'react';

const Alert = ({ 
  type = 'info',  // 'success', 'error', 'warning', 'info'
  title,
  message,
  onClose,
  icon = true,
  className = ''
}) => {
  // Material Design 3 Color System
  const alertConfig = {
    success: {
      bgColor: 'bg-[#e8f5e9]',  // surface with green tint
      borderColor: 'border-[#4caf50]',
      titleColor: 'text-[#1b5e20]',  // dark green
      messageColor: 'text-[#2e7d32]',  // medium green
      iconColor: 'text-[#4caf50]',  // success green
      icon: 'check_circle'
    },
    error: {
      bgColor: 'bg-[#ffebee]',  // surface with red tint
      borderColor: 'border-[#f44336]',
      titleColor: 'text-[#b71c1c]',  // dark red
      messageColor: 'text-[#d32f2f]',  // medium red
      iconColor: 'text-[#f44336]',  // error red
      icon: 'error'
    },
    warning: {
      bgColor: 'bg-[#fff3e0]',  // surface with orange tint
      borderColor: 'border-[#ff9800]',
      titleColor: 'text-[#e65100]',  // dark orange
      messageColor: 'text-[#f57c00]',  // medium orange
      iconColor: 'text-[#ff9800]',  // warning orange
      icon: 'warning'
    },
    info: {
      bgColor: 'bg-[#e3f2fd]',  // surface with blue tint
      borderColor: 'border-[#2196f3]',
      titleColor: 'text-[#0d47a1]',  // dark blue
      messageColor: 'text-[#1565c0]',  // medium blue
      iconColor: 'text-[#2196f3]',  // info blue
      icon: 'info'
    }
  };

  const config = alertConfig[type] || alertConfig.info;

  return (
    <div 
      className={`
        ${config.bgColor} 
        ${config.borderColor}
        border-l-4 
        rounded-lg 
        p-4 
        flex 
        gap-3
        ${className}
      `}
      role="alert"
    >
      {icon && (
        <span className={`material-symbols-outlined ${config.iconColor} flex-shrink-0 text-2xl`}>
          {config.icon}
        </span>
      )}
      
      <div className="flex-1">
        {title && (
          <h3 className={`font-bold text-sm ${config.titleColor} mb-1`}>
            {title}
          </h3>
        )}
        {message && (
          <p className={`text-sm ${config.messageColor}`}>
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${config.iconColor} hover:opacity-70 transition-opacity`}
          aria-label="Закрыть"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      )}
    </div>
  );
};

export default Alert;

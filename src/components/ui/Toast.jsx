import React, { useEffect } from 'react';

const Toast = ({ 
  type = 'info',
  message,
  onClose,
  duration = 3000,
  className = ''
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Material Design 3 Color System + Glass Morphism
  const toastConfig = {
    success: { 
      bgColor: 'bg-[#388e3c]',  // success green
      borderColor: 'border border-[#4caf50]/30',
      icon: 'check_circle',
      shadowColor: 'shadow-lg shadow-[#4caf50]/20'
    },
    error: { 
      bgColor: 'bg-[#d32f2f]',  // error red
      borderColor: 'border border-[#f44336]/30',
      icon: 'error',
      shadowColor: 'shadow-lg shadow-[#f44336]/20'
    },
    warning: { 
      bgColor: 'bg-[#f57c00]',  // warning orange
      borderColor: 'border border-[#ff9800]/30',
      icon: 'warning',
      shadowColor: 'shadow-lg shadow-[#ff9800]/20'
    },
    info: { 
      bgColor: 'bg-[#1565c0]',  // info blue
      borderColor: 'border border-[#2196f3]/30',
      icon: 'info',
      shadowColor: 'shadow-lg shadow-[#2196f3]/20'
    }
  };

  const config = toastConfig[type] || toastConfig.info;

  return (
    <div 
      className={`
        ${config.bgColor} 
        ${config.borderColor}
        ${config.shadowColor}
        text-white 
        rounded-2xl 
        px-5 
        py-3.5
        flex 
        items-center 
        gap-3 
        backdrop-blur-sm
        animate-in 
        fade-in 
        slide-in-from-bottom-5 
        duration-300
        ${className}
      `} 
      role="status"
    >
      <span className="material-symbols-outlined flex-shrink-0 text-5">{config.icon}</span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 hover:opacity-80 transition-opacity p-1" 
        aria-label="Закрыть"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};

export default Toast;

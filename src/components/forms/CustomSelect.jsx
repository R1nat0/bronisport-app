import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Выберите опцию',
  icon = 'expand_more',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen]);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          {label}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-surface-container-high rounded-xl px-4 py-3 text-left font-medium text-on-surface flex items-center justify-between hover:border-primary-fixed/50 transition-colors"
      >
        <span className={value ? 'text-on-surface' : 'text-on-surface-variant'}>
          {selectedLabel}
        </span>
        <span
          className={`material-symbols-outlined transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          {icon}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl border border-surface-container-high shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left font-medium transition-colors ${
                value === option.value
                  ? 'bg-primary-fixed/20 text-primary'
                  : 'text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;

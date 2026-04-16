import React from 'react';

const CustomSearchInput = ({ 
  value, 
  onChange, 
  placeholder = 'Поиск...',
  onClear = null
}) => {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <span className="material-symbols-outlined text-xl">search</span>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-surface-container-high rounded-xl pl-12 pr-12 py-3 font-medium text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 focus:border-transparent transition-all"
      />

      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      )}
    </div>
  );
};

export default CustomSearchInput;

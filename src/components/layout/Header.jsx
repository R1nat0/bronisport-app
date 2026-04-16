import React from 'react';

const Header = ({ title, subtitle = null, highlightText = null, rightAction = null, showBack = false, onBack = null }) => {
  return (
    <header className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 flex-1">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-on-surface hover:bg-surface rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight mb-1 tracking-tight font-headline">
            {title} {highlightText && <br/>}
            {highlightText && <span className="text-primary-fixed">{highlightText}</span>}
          </h1>
          {subtitle && (
            <p className="text-sm text-on-surface-variant">{subtitle}</p>
          )}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
};

export default Header;

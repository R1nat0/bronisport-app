import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const AuthRequired = ({ 
  icon = 'lock',
  title = 'Требуется вход',
  description = 'Войдите чтобы получить доступ к этой функции',
  buttonText = 'Войти'
}) => {
  const { setIsAuthModalOpen } = useAuth();

  return (
    <div className="h-[calc(100vh-140px)] bg-gradient-to-br from-primary/5 to-primary-fixed/5 flex items-center justify-center p-3">
      <div className="text-center max-w-sm w-full">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 bg-primary-fixed/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary-fixed">
              {icon}
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-on-surface mb-2 font-headline">
          {title}
        </h2>

        {/* Description */}
        <p className="text-on-surface-variant text-xs leading-relaxed mb-5">
          {description}
        </p>

        {/* Action Button */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full px-4 py-2.5 bg-primary-fixed text-on-primary-fixed rounded-xl font-bold text-sm hover:bg-primary-fixed/90 active:scale-95 transition-all shadow-md"
        >
          {buttonText}
        </button>

        {/* Secondary text */}
        <p className="text-[10px] text-on-surface-variant mt-3">
          Это займет всего пару секунд ✨
        </p>
      </div>
    </div>
  );
};

export default AuthRequired;

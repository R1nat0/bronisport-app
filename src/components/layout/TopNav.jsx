import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const TopNav = () => {
  const { isAuthenticated, setIsAuthModalOpen } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-surface-container-high px-4 py-3 flex justify-between items-center">
      <Link to="/" className="text-xl font-black text-primary tracking-tighter font-headline">
        Брониспорт
      </Link>
      {!isAuthenticated && (
        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="px-4 py-1.5 rounded-full font-headline text-xs font-bold bg-primary text-on-primary active:scale-95 transition-transform hover:bg-primary/90"
        >
          Войти
        </button>
      )}
    </nav>
  );
};

export default TopNav;

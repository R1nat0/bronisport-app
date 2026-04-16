import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { path: '/', label: 'Поиск', icon: 'explore' },
    { path: '/bookings', label: 'Брони', icon: 'calendar_today' },
    { path: '/favorites', label: 'Избранное', icon: 'favorite' },
    { path: '/profile', label: 'Профиль', icon: 'person' }
  ];

  const isActive = (path) => currentPath === path;

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-surface-container-high px-6 py-2 flex justify-between items-center z-50">
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive(tab.path)
              ? 'text-primary'
              : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-2xl">
            {tab.icon}
          </span>
          <span className="text-[10px] font-bold">{tab.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default BottomNav;

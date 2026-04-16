import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import TopNav from './TopNav.jsx';

const Layout = () => {
  const mainRef = useRef(null);
  const location = useLocation();
  const scrollPositionsRef = useRef({});

  useEffect(() => {
    // Сохраняем позицию скролла перед переходом на новую страницу
    return () => {
      if (mainRef.current) {
        scrollPositionsRef.current[location.pathname] = mainRef.current.scrollTop;
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    // Восстанавливаем позицию скролла при переходе на страницу
    if (mainRef.current) {
      const savedPosition = scrollPositionsRef.current[location.pathname];
      if (savedPosition !== undefined) {
        // Есть сохраненная позиция - восстанавливаем
        mainRef.current.scrollTop = savedPosition;
      } else {
        // Новая страница - скроллим в начало
        mainRef.current.scrollTop = 0;
      }
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Top Navigation */}
      <TopNav />

      {/* Основной контент */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pt-[60px] pb-20">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Layout;

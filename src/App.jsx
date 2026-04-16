import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { AlertProvider } from './context/AlertContext.jsx';
import { AppRoutes } from './router.jsx';
import AlertContainer from './components/ui/AlertContainer.jsx';
import AuthModal from './components/ui/AuthModal.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { queryClient } from './api/queryClient.js';
import './index.css';

function AppContent() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();

  return (
    <>
      <AppRoutes />
      <AlertContainer />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AlertProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;

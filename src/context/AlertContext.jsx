import React, { createContext, useState, useCallback } from 'react';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const alert = { id, message, type, duration };
    
    setAlerts(prev => [...prev, alert]);
    
    if (duration) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const success = useCallback((message, duration = 4000) => {
    return showAlert(message, 'success', duration);
  }, [showAlert]);

  const error = useCallback((message, duration = 4000) => {
    return showAlert(message, 'error', duration);
  }, [showAlert]);

  const warning = useCallback((message, duration = 4000) => {
    return showAlert(message, 'warning', duration);
  }, [showAlert]);

  const info = useCallback((message, duration = 4000) => {
    return showAlert(message, 'info', duration);
  }, [showAlert]);

  const value = {
    showAlert,
    removeAlert,
    success,
    error,
    warning,
    info,
    alerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

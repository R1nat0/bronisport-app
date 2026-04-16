import React from 'react';
import Toast from './Toast';
import { useAlert } from '../../context/AlertContext';

const AlertContainer = () => {
  const { alerts, removeAlert } = useAlert();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <Toast
            type={alert.type}
            message={alert.message}
            duration={0}  // We manage the removal via context
            onClose={() => removeAlert(alert.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;

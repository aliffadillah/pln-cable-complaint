import { useState, useCallback } from 'react';

interface AlertConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autoClose?: boolean;
  duration?: number;
}

interface AlertState extends AlertConfig {
  isVisible: boolean;
}

export function useCustomAlert() {
  const [alert, setAlert] = useState<AlertState>({
    isVisible: false,
    message: '',
    type: 'info',
    autoClose: true,
    duration: 3000
  });

  const showAlert = useCallback((config: AlertConfig) => {
    setAlert({
      ...config,
      isVisible: true
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Helper functions for different alert types
  const showSuccess = useCallback((message: string, autoClose = true, duration = 3000) => {
    showAlert({ message, type: 'success', autoClose, duration });
  }, [showAlert]);

  const showError = useCallback((message: string, autoClose = true, duration = 4000) => {
    showAlert({ message, type: 'error', autoClose, duration });
  }, [showAlert]);

  const showWarning = useCallback((message: string, autoClose = true, duration = 3500) => {
    showAlert({ message, type: 'warning', autoClose, duration });
  }, [showAlert]);

  const showInfo = useCallback((message: string, autoClose = true, duration = 3000) => {
    showAlert({ message, type: 'info', autoClose, duration });
  }, [showAlert]);

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}

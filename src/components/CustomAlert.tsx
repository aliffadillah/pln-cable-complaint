import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import './CustomAlert.css';

interface CustomAlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function CustomAlert({ 
  message, 
  type = 'info', 
  onClose, 
  autoClose = true,
  duration = 3000 
}: CustomAlertProps) {
  
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <XCircle size={24} />;
      case 'warning':
        return <AlertCircle size={24} />;
      case 'info':
      default:
        return <Info size={24} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'custom-alert-success';
      case 'error':
        return 'custom-alert-error';
      case 'warning':
        return 'custom-alert-warning';
      case 'info':
      default:
        return 'custom-alert-info';
    }
  };

  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className={`custom-alert-box ${getTypeClass()}`} onClick={(e) => e.stopPropagation()}>
        <div className="custom-alert-icon">
          {getIcon()}
        </div>
        <div className="custom-alert-content">
          <p>{message}</p>
        </div>
        <button className="custom-alert-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

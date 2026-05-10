import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const ToastComponent = () => {
    if (!toast) return null;
    return (
      <div className={`toast show toast-${toast.type}`}>
        {toast.message}
      </div>
    );
  };

  return { showToast, ToastComponent };
};

import React, { createContext, useState, useContext, useCallback } from 'react';
import ToastNotification from '../components/ToastNotification'; // Import the ToastNotification component

// 1. Create the Toast Context
const ToastContext = createContext(null);

// 2. Create a custom hook to use the Toast Context
export const useToast = () => {
  return useContext(ToastContext);
};

// 3. Create the Toast Provider component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Function to show a toast message
  // useCallback memoizes the function to prevent unnecessary re-renders of children
  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
  }, []);

  // Function to hide the toast message
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  // The value provided to consumers of this context
  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};
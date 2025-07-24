import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext'; // <--- ADD THIS IMPORT

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider> {/* <--- ADD THIS OPENING TAG */}
          <MainLayout />
        </ToastProvider> {/* <--- ADD THIS CLOSING TAG */}
      </AuthProvider>
    </Router>
  );
}

export default App;
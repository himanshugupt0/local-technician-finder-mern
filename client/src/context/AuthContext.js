import React, { createContext, useState, useEffect, useContext } from 'react'; // <--- CORRECTED THIS LINE

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // <--- NEW STATE: Add loading

  // Effect to initialize state from localStorage on component mount
  useEffect(() => {
    console.log('AuthContext: Initializing from localStorage...');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const storedUserId = localStorage.getItem('userId');

    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
      setUserId(storedUserId);
      console.log('AuthContext: Found token in localStorage. Setting state.');
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserId(null);
      console.log('AuthContext: No token found in localStorage. Setting state to logged out.');
    }
    setLoading(false); // Auth state is now initialized
    console.log('AuthContext: Finished initialization. Loading set to false.');
    console.log('AuthContext: Current state after init: isLoggedIn:', !!token, 'userRole:', role, 'userId:', storedUserId, 'loading:', false);
  }, []); // Runs only once on mount of AuthProvider

  const login = (token, role, id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', id);
    setIsLoggedIn(true);
    setUserRole(role);
    setUserId(id);
    console.log('AuthContext: Login function called. State updated. isLoggedIn:', true, 'userRole:', role, 'userId:', id);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserId(null);
    console.log('AuthContext: Logout function called. State updated. isLoggedIn:', false);
  };

  // The value provided to consumers of this context
  const value = {
    isLoggedIn,
    userRole,
    userId,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
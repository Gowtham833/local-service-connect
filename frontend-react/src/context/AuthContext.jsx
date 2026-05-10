import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('sc_user') || 'null'));
  const [token, setToken] = useState(localStorage.getItem('sc_token'));
  const [role, setRole] = useState(localStorage.getItem('sc_role'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on mount
    if (token) {
      // Potentially verify token with backend here
    }
    setLoading(false);
  }, [token]);

  const login = (userData, userToken, userRole) => {
    localStorage.setItem('sc_user', JSON.stringify(userData));
    localStorage.setItem('sc_token', userToken);
    localStorage.setItem('sc_role', userRole);
    setUser(userData);
    setToken(userToken);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem('sc_user');
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_role');
    setUser(null);
    setToken(null);
    setRole(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

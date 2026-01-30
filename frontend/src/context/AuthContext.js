import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('fieldops_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('fieldops_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token, ...userData } = response.data;
    localStorage.setItem('fieldops_token', token);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (companyData) => {
    const response = await axios.post(`${API}/company/register`, companyData);
    const { token, ...userData } = response.data;
    localStorage.setItem('fieldops_token', token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fieldops_token');
    setUser(null);
  }, []);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('fieldops_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const value = useMemo(() => ({
    user, loading, login, register, logout, getAuthHeader, checkAuth
  }), [user, loading, login, register, logout, getAuthHeader, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

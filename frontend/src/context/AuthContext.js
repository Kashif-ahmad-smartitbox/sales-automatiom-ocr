import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token, ...userData } = response.data;
    localStorage.setItem('fieldops_token', token);
    setUser(userData);
    return userData;
  };

  const register = async (companyData) => {
    const response = await axios.post(`${API}/company/register`, companyData);
    const { token, ...userData } = response.data;
    localStorage.setItem('fieldops_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('fieldops_token');
    setUser(null);
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('fieldops_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getAuthHeader, checkAuth }}>
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

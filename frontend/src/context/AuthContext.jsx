import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attempt to restore user profile on mount
  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/users/profile');
      setUser(res.data);
    } catch (err) {
      console.error('Session restoration failed:', err.message);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Event listener for interceptor logouts
    const handleLogoutEvent = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = res.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data?.error || 'Login failed';
    }
  };

  const registerCompany = async (name, email, password, companyName) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, companyName });
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err.message);
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  };

  const value = {
    user,
    loading,
    login,
    registerCompany,
    logout,
    refreshUser: checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

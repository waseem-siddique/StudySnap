import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Fetch user profile when token changes
  useEffect(() => {
    const fetchUser = async () => {
      // Set loading true immediately when token changes
      setLoading(true);
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:5000/api/users/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // User will be fetched automatically by the above effect
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('instructionsShown');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/users/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to refresh user', err);
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    refreshUser,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
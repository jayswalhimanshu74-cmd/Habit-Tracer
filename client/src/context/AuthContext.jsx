// client/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '../services/api';
import { jwtDecode } from "jwt-decode";

const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const payload = jwtDecode(token);
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
const AuthContext = createContext();

// Only store what the UI actually needs — never persist sensitive fields
const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      // Check token expiry before trusting stored session
      if (!isTokenValid(token)) {
        // Token is expired — clear everything and send to login
        clearSession();
      } else {
        try {
          setUser(JSON.parse(storedUser));
          // ↑ safe parse — corrupted JSON won't crash the app
        } catch {
          // Corrupted localStorage — clear and start fresh
          clearSession();
        }
      }
    }

    setLoading(false);
  }, [clearSession]);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Login failed');
      }

      const { token, user } = res.data;
      const safeUser = sanitizeUser(user);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(safeUser));
      setUser(safeUser);
      return safeUser;

    } catch (err) {
      // Normalize error message for the calling component
      const message = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await authService.register({ name, email, password });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Registration failed');
      }

      const { token, user } = res.data;
      const safeUser = sanitizeUser(user);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(safeUser));
      setUser(safeUser);
      return safeUser;

    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
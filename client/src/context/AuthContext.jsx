import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './useAuth';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/api';

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = jwtDecode(token);
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

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
      if (!isTokenValid(token)) {
        setTimeout(() => clearSession(), 0);
      } else {
        try {
          const parsed = JSON.parse(storedUser);
          setTimeout(() => {
            setUser(parsed);
            setLoading(false);
          }, 0);
          return;
        } catch {
          setTimeout(() => clearSession(), 0);
        }
      }
    }
    setTimeout(() => setLoading(false), 0);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authService.login({ email, password });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Login failed');
      }

      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(sanitizeUser(user)));
      setUser(sanitizeUser(user));

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed';
      throw new Error(message, { cause: err });
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const res = await authService.register({ name, email, password });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Registration failed');
      }

      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(sanitizeUser(user)));
      setUser(sanitizeUser(user));

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed';
      throw new Error(message, { cause: err });
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
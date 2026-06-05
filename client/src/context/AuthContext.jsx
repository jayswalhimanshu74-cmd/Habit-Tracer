import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './useAuth'; // ✅ import from useAuth
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
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
          const parsed = JSON.parse(storedUser);  // ✅ declare parsed
        setTimeout(() => setUser(parsed), 0);   // ✅ use it deferred
        } catch {
          setTimeout(() => clearSession(), 0);
        }
      }
    }
    setLoading(false);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(sanitizeUser(user)));
      setUser(sanitizeUser(user));
    } catch (err) {
      throw new Error('Login failed', { cause: err });
    }
  }, []);

  const register = useCallback(async (name, username, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { name, username, email, password });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(sanitizeUser(user)));
      setUser(sanitizeUser(user));
    } catch (err) {
      throw new Error('Registration failed', { cause: err });
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
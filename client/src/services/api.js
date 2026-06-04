// client/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extract data from standard response format
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ✅ Don't redirect if already on login or register — avoids infinite loop
      const isAuthPage = ['/login', '/register'].includes(window.location.pathname);
      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const habitService = {
  getHabits: () => api.get('/habits'),
  createHabit: (data) => api.post('/habits', data),
  updateHabit: (id, data) => api.put(`/habits/${id}`, data),
  deleteHabit: (id) => api.delete(`/habits/${id}`),
  toggleHabit: (id) => api.post(`/habits/${id}/toggle`),
  getLogs: (id) => api.get(`/habits/${id}/logs`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const userService = {
  getProfile: (username) => api.get(`/users/${username}`),
};

export const leaderboardService = {
  getLeaderboard: () => api.get('/leaderboard'),
};

export const challengeService = {
  getToday: () => api.get('/challenges/today'),
  complete: (challengeId) => api.post('/challenges/complete', { challengeId }),
};

export const insightService = {
  getSmartInsights: () => api.get('/insights/smart'),
};

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary'),
};

export const exportService = {
  getCSV: () => api.get('/export/csv', { responseType: 'blob' }),
  getPDF: () => api.get('/export/pdf', { responseType: 'blob' }),
};

export default api;

import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 Unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        // Redirect to login only if not already on the login page
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error(error.message || 'An unknown error occurred');
  }
);

// --- API Methods ---

export const authAPI = {
    login: async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const response = await apiClient.post('/users/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (response.data.access_token) {
            localStorage.setItem('accessToken', response.data.access_token);
        }
        return response.data;
    },
    signup: (email, password) => apiClient.post('/users/signup', { email, password }),
    logout: () => localStorage.removeItem('accessToken')
};

export const transactionAPI = {
  create: (data) => apiClient.post('/transactions/', data).then(res => res.data),
  getAll: (params = {}) => apiClient.get('/transactions/', { params }).then(res => res.data),
  delete: (id) => apiClient.delete(`/transactions/${id}`).then(res => res.data)
};

export const statsAPI = {
  getMonthlyStats: () => apiClient.get('/stats/monthly').then(res => res.data),
  getCategoryStats: (type) => apiClient.get('/stats/categories', { params: { type } }).then(res => res.data),
  getTrendStats: () => apiClient.get('/stats/trends').then(res => res.data),
  getCurrentMonthStats: () => apiClient.get('/stats/current-month').then(res => res.data)
};

const api = {
  auth: authAPI,
  transactions: transactionAPI,
  stats: statsAPI,
};

export default api;

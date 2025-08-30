import axios from 'axios';

// Use an environment variable for the backend URL.
// This allows it to work both locally and in production.
const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API_URL,
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
  
  getAll: (filters = {}) => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null && v !== '')
    );
    return apiClient.get('/transactions/', { params: cleanFilters }).then(res => res.data);
  },

  update: (id, data) => apiClient.put(`/transactions/${id}`, data).then(res => res.data),

  delete: (id) => apiClient.delete(`/transactions/${id}`).then(res => res.data)
};

export const statsAPI = {
  getMonthlyStats: () => apiClient.get('/stats/monthly').then(res => res.data),
  getCategoryStats: (type) => apiClient.get('/stats/categories', { params: { type } }).then(res => res.data),
  getTrendStats: () => apiClient.get('/stats/trends').then(res => res.data),
  getDashboardStats: () => apiClient.get('/stats/dashboard').then(res => res.data),
  getPeopleStats: () => apiClient.get('/stats/people').then(res => res.data),
};

export const peopleAPI = {
  getAll: () => apiClient.get('/people').then(res => res.data)
};

const api = {
  auth: authAPI,
  transactions: transactionAPI,
  stats: statsAPI,
  people: peopleAPI
};

export default api;

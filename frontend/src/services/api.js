import axios from 'axios';

// Use an environment variable for the backend URL.
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
    // ✨ MODIFIED: Handle 404 specifically
    if (error.response?.status === 404) {
        throw new Error("Not Found");
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

export const accountAPI = {
    getAll: () => apiClient.get('/accounts').then(res => res.data),
    create: (data) => apiClient.post('/accounts', data).then(res => res.data),
    update: (id, data) => apiClient.put(`/accounts/${id}`, data).then(res => res.data),
    delete: (id) => apiClient.delete(`/accounts/${id}`).then(res => res.data),
};

export const transactionAPI = {
  create: (data) => apiClient.post('/transactions/', data).then(res => res.data),
  getAll: (filters = {}, accountId) => {
    const params = { ...filters };
    if (accountId && accountId !== 'all') {
        params.account_id = accountId;
    }
    return apiClient.get('/transactions/', { params }).then(res => res.data);
  },
  update: (id, data) => apiClient.put(`/transactions/${id}`, data).then(res => res.data),
  delete: (id) => apiClient.delete(`/transactions/${id}`).then(res => res.data)
};

export const statsAPI = {
  getDashboardStats: (accountId) => {
    const params = accountId && accountId !== 'all' ? { account_id: accountId } : {};
    return apiClient.get('/stats/dashboard', { params }).then(res => res.data);
  },
  getMonthlyStats: (accountId) => {
    const params = accountId && accountId !== 'all' ? { account_id: accountId } : {};
    return apiClient.get('/stats/monthly', { params }).then(res => res.data);
  },
  getCategoryStats: (type, accountId) => {
    const params = { type };
    if (accountId && accountId !== 'all') {
        params.account_id = accountId;
    }
    return apiClient.get('/stats/categories', { params }).then(res => res.data);
  },
  // ✨ REPLACED `getTrendStats` with `getGranularTrendStats` ✨
  getGranularTrendStats: (params) => {
    return apiClient.get('/stats/trends_granular', { params }).then(res => res.data);
  },
  getPeopleStats: (accountId) => {
    const params = accountId && accountId !== 'all' ? { account_id: accountId } : {};
    return apiClient.get('/stats/people', { params }).then(res => res.data);
  },
};

export const peopleAPI = {
  getAll: () => apiClient.get('/people').then(res => res.data)
};

const api = {
  auth: authAPI,
  accounts: accountAPI,
  transactions: transactionAPI,
  stats: statsAPI,
  people: peopleAPI
};

export default api;
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch (e) {
    return true;
  }
};

apiClient.interceptors.request.use(
  async (config) => {
    let accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    if (isTokenExpired(accessToken)) {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;

      if (refreshToken && !isTokenExpired(refreshToken)) {
        try {
          const response = await axios.post(`${API_URL}/users/token/refresh`, { refresh_token: refreshToken });
          const { access_token, refresh_token } = response.data;
          storage.setItem('accessToken', access_token);
          storage.setItem('refreshToken', refresh_token);
          accessToken = access_token;
        } catch (error) {
          authAPI.logout(); // Clear all tokens on failure
          if (window.location.pathname !== '/login') window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        authAPI.logout();
      }
    }
    
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
        authAPI.logout();
        window.location.href = '/login';
    }
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error(error.message || 'An unknown error occurred');
  }
);


export const authAPI = {
    login: async (email, password, rememberMe) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const response = await apiClient.post('/users/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const { access_token, refresh_token } = response.data;
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('accessToken', access_token);
        storage.setItem('refreshToken', refresh_token);
        return response.data;
    },
    signup: async (email, password) => {
        const response = await apiClient.post('/users/signup', { email, password });
        const { access_token, refresh_token } = response.data;
        // Sign up always creates a persistent session by default
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
    },
    verifyEmail: (token) => apiClient.get(`/users/verify-email?token=${token}`).then(res => res.data),
    resendVerification: () => apiClient.post('/users/resend-verification').then(res => res.data),
};

export const accountAPI = {
    getAll: () => apiClient.get('/accounts').then(res => res.data),
    create: (data) => apiClient.post('/accounts', data).then(res => res.data),
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
  getGranularTrendStats: (params) => {
    return apiClient.get('/stats/trends_granular', { params }).then(res => res.data);
  },
  getPeopleStats: (accountId) => {
    const params = accountId && accountId !== 'all' ? { account_id: accountId } : {};
    return apiClient.get('/stats/people', { params }).then(res => res.data);
  },
};

export const peopleAPI = {
  getAll: () => apiClient.get('/people').then(res => res.data),
  settleUp: (name, account_id) => apiClient.post(`/people/${name}/settle`, { account_id }).then(res => res.data),
};

const api = { 
  auth: authAPI, 
  accounts: accountAPI, 
  transactions: transactionAPI, 
  stats: statsAPI, 
  people: peopleAPI 
};

export default api;


import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    }
    
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    throw new Error(error.message || 'Network error occurred');
  }
);

// Transaction API functions
export const transactionAPI = {
  // Create new transaction
  create: async (transactionData) => {
    const response = await apiClient.post('/transactions/', transactionData);
    return response.data;
  },

  // Get all transactions
  getAll: async (params = {}) => {
    const response = await apiClient.get('/transactions/', { params });
    return response.data;
  },

  // Get transaction by ID
  getById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  // Delete transaction
  delete: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  }
};

// Statistics API functions
export const statsAPI = {
  // Get monthly statistics
  getMonthlyStats: async () => {
    const response = await apiClient.get('/stats/monthly');
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async (type) => {
    const response = await apiClient.get('/stats/categories', {
      params: { type }
    });
    return response.data;
  },

  // Get trend statistics
  getTrendStats: async () => {
    const response = await apiClient.get('/stats/trends');
    return response.data;
  },

  // Get current month statistics
  getCurrentMonthStats: async () => {
    const response = await apiClient.get('/stats/current-month');
    return response.data;
  }
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

// Export default API object
const api = {
  transactions: transactionAPI,
  stats: statsAPI,
  health: healthAPI
};

export default api;
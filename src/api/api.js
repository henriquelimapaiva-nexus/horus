import axios from 'axios';

// Pega a URL do arquivo .env ou usa localhost como fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('🔌 Conectando à API:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

// Ajustamos para garantir que o /api esteja na base, evitando repetir em cada chamada
const BASE_URL = import.meta.env.VITE_API_URL || 'https://horus-backend-gzcp.onrender.com';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

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
    // Pegamos o token que foi salvo no Login
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
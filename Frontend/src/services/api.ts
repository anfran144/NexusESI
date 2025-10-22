import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Crear instancia de Axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Removido withCredentials ya que JWT no requiere cookies
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Si el token ha expirado (401), limpiar el estado de autenticación
    if (error.response?.status === 401) {
      useAuthStore.getState().resetAuth();
      // Solo redirigir si no estamos en una página de auth
      if (!window.location.pathname.includes('/sign-in') && 
          !window.location.pathname.includes('/sign-up') &&
          !window.location.pathname.includes('/forgot-password') &&
          !window.location.pathname.includes('/reset-password') &&
          !window.location.pathname.includes('/otp')) {
        // Usar setTimeout para evitar interferir con navegación programática
        setTimeout(() => {
          window.location.href = '/sign-in';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { api };

// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
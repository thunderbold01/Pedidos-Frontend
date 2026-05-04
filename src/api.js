// src/api.js
import axios from 'axios';

// URL da API no Render
const API_URL = 'https://pedidos-backend-eljk.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Interceptor de Request - Adiciona token JWT
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de Response
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Erro de rede (API offline)
        if (!error.response) {
            console.error('API offline ou sem internet');
            return Promise.reject(error);
        }
        
        // Token expirado - tentar renovar
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken
                    });
                    
                    const newToken = res.data.access;
                    localStorage.setItem('access_token', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.clear();
                    sessionStorage.clear();
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } else {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

// ==================== FUNÇÕES AUXILIARES ====================

export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
};

export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
};

export default api;

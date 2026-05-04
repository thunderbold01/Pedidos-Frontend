// src/api.js
import axios from 'axios';

// URL da API - Prioridade: .env > produção Render > localhost
const API_URL = import.meta.env.VITE_API_URL || 'https://pedidos-backend-eljk.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 segundos
});

// ==================== INTERCEPTOR DE REQUEST ====================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==================== INTERCEPTOR DE RESPONSE ====================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Se não houver resposta do servidor
        if (!error.response) {
            console.error('Erro de conexão com o servidor');
            return Promise.reject({
                ...error,
                message: 'Não foi possível conectar ao servidor. Verifique sua internet.'
            });
        }
        
        // Se erro 401 (não autorizado) e não é retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('Sem refresh token');
                }
                
                // Tentar renovar o token
                const response = await axios.post(`${API_URL}/token/refresh/`, {
                    refresh: refreshToken
                });
                
                const { access } = response.data;
                localStorage.setItem('access_token', access);
                originalRequest.headers.Authorization = `Bearer ${access}`;
                
                // Retentar a requisição original
                return api(originalRequest);
            } catch (refreshError) {
                // Limpar tudo e redirecionar para login
                localStorage.clear();
                sessionStorage.clear();
                
                // Só redireciona se não estiver já na página de login
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/register') {
                    window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            }
        }
        
        // Se erro 403 (proibido)
        if (error.response?.status === 403) {
            console.warn('Acesso negado:', error.response.data);
        }
        
        // Se erro 500 (erro interno do servidor)
        if (error.response?.status === 500) {
            console.error('Erro interno do servidor:', error.response.data);
        }
        
        return Promise.reject(error);
    }
);

// ==================== FUNÇÕES AUXILIARES ====================

// Verificar se está autenticado
export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
};

// Obter usuário logado
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/user/me/');
        return response.data;
    } catch (error) {
        return null;
    }
};

// Login
export const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
};

// Verificar 2FA
export const verify2FA = async (email, code) => {
    const response = await api.post('/auth/verify-2fa/', { email, code });
    return response.data;
};

// Registro
export const register = async (data) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
};

// Logout
export const logout = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken });
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    } finally {
        localStorage.clear();
        sessionStorage.clear();
    }
};

// Salvar tokens
export const saveTokens = (access, refresh) => {
    localStorage.setItem('access_token', access);
    if (refresh) {
        localStorage.setItem('refresh_token', refresh);
    }
};

// Limpar tokens
export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
};

export default api;

// src/api.js - VERSÃO CORRIGIDA (sem import circular)
import axios from 'axios';

// ==================== CONFIGURAÇÃO ====================
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const LOCAL_API_URL = 'http://localhost:8000/api';
const PROD_API_URL = 'https://pedidos-backend-fium.onrender.com/api'; // USE A URL CORRETA
const API_URL = isDevelopment ? LOCAL_API_URL : PROD_API_URL;

console.log(`🔧 API: ${API_URL} (${isDevelopment ? 'dev' : 'prod'})`);

// ==================== INSTÂNCIA AXIOS ====================
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 30000,
});

// ==================== INTERCEPTORES ====================
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refresh = localStorage.getItem('refresh_token');
            if (refresh) {
                try {
                    const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
                    localStorage.setItem('access_token', res.data.access);
                    original.headers.Authorization = `Bearer ${res.data.access}`;
                    return api(original);
                } catch (e) {
                    localStorage.clear();
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ==================== FUNÇÕES AUXILIARES ====================
export const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
};

export const isAuth = () => !!localStorage.getItem('access_token');

// ==================== AUTENTICAÇÃO ====================
export const login = async (email, password) => {
    try {
        const res = await api.post('/auth/login/', { email, password });
        const { access, refresh, user } = res.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (user) localStorage.setItem('user_data', JSON.stringify(user));
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || 'Erro ao fazer login' };
    }
};

export const logout = async () => {
    try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) await api.post('/auth/logout/', { refresh });
    } catch (e) {}
    finally { clearAuth(); }
};

export const getUser = async () => {
    try {
        const res = await api.get('/user/me/');
        localStorage.setItem('user_data', JSON.stringify(res.data));
        return { success: true, user: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== PEDIDOS ====================
export const getPedidos = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.estado) params.append('estado', filters.estado);
        if (filters.tipo) params.append('tipo', filters.tipo);
        if (filters.busca) params.append('busca', filters.busca);
        const url = `/pedidos/${params.toString() ? `?${params}` : ''}`;
        const res = await api.get(url);
        return { success: true, pedidos: res.data.pedidos || [], total: res.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const criarPedido = async (dados) => {
    try {
        const res = await api.post('/pedidos/criar/', dados);
        return { success: true, pedido_id: res.data.pedido_id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const aprovarPedido = async (id, dados = {}) => {
    try {
        const res = await api.post(`/pedidos/${id}/aprovar/`, dados);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const rejeitarPedido = async (id, comentario) => {
    try {
        const res = await api.post(`/pedidos/${id}/rejeitar/`, { comentario });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== DASHBOARD ====================
export const getDashboard = async () => {
    try {
        const res = await api.get('/dashboard/');
        return { success: true, stats: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== NOTIFICAÇÕES ====================
export const getNotificacoes = async () => {
    try {
        const res = await api.get('/notificacoes/');
        return { success: true, notificacoes: res.data.notificacoes || [], nao_lidas: res.data.nao_lidas || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const marcarLida = async (id) => {
    try {
        await api.post(`/notificacoes/${id}/ler/`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== COLETIVAS ====================
export const getMinhasColetivas = async () => {
    try {
        const res = await api.get('/coletivas/minhas/');
        return { success: true, coletivas: res.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const aceitarColetiva = async (id) => {
    try {
        const res = await api.post(`/coletivas/${id}/aceitar/`);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const recusarColetiva = async (id) => {
    try {
        const res = await api.post(`/coletivas/${id}/recusar/`);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== EXPORTAÇÃO PADRÃO ====================
export default api;

// src/api.js
import axios from 'axios';

const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const LOCAL_API_URL = 'http://localhost:8000/api';
const PROD_API_URL = 'https://pedidos-backend-fium.onrender.com/api';
const API_URL = isDevelopment ? LOCAL_API_URL : PROD_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 30000,
});

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

export const getUser = async () => {
    try {
        const res = await api.get('/user/me/');
        localStorage.setItem('user_data', JSON.stringify(res.data));
        return { success: true, user: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== SEGURANÇA (APENAS O NECESSÁRIO) ====================
export const getSaidasPorData = async (data) => {
    try {
        const res = await api.get(`/seguranca/saidas-data/?data=${data}`);
        return { success: true, saidas: res.data.saidas || [], total: res.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const marcarSaida = async (pedidoId, hora) => {
    try {
        const data = hora ? { hora_saida: hora } : {};
        const res = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, data);
        return { success: true, hora: res.data.hora };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const marcarRetorno = async (pedidoId, hora) => {
    try {
        const data = hora ? { hora_retorno: hora } : {};
        const res = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, data);
        return { success: true, hora: res.data.hora, atrasado: res.data.atrasado, tempo_atraso: res.data.tempo_atraso };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const getNotificacoes = async () => {
    try {
        const res = await api.get('/notificacoes/');
        return { success: true, notificacoes: res.data.notificacoes || [], nao_lidas: res.data.nao_lidas || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const marcarNotificacaoLida = async (id) => {
    try {
        await api.post(`/notificacoes/${id}/ler/`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getDashboard = async () => {
    try {
        const res = await api.get('/dashboard/');
        return { success: true, stats: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export default api;

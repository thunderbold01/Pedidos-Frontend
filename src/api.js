// src/api.js - VERSÃO COMPLETA CORRIGIDA
import axios from 'axios';

// ==================== CONFIGURAÇÃO DE AMBIENTE ====================
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// URLs da API
const LOCAL_API_URL = 'http://localhost:8000/api';
const PROD_API_URL = 'https://pedidos-backend-fium.onrender.com/api';

const API_URL = isDevelopment ? LOCAL_API_URL : PROD_API_URL;

if (isDevelopment) {
    console.log(`🔧 API configurada para: ${API_URL}`);
}

// ==================== CRIAÇÃO DA INSTÂNCIA ====================
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
    withCredentials: false,
});

// ==================== INTERCEPTOR DE REQUEST ====================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (isDevelopment && config.method === 'get') {
            config.params = { ...config.params, _t: Date.now() };
        }
        
        if (isDevelopment) {
            console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// ==================== INTERCEPTOR DE RESPONSE ====================
api.interceptors.response.use(
    (response) => {
        if (isDevelopment) {
            console.log(`📥 ${response.status} ${response.config.url}`);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        if (!error.response) {
            return Promise.reject({
                message: isDevelopment ? 'Não foi possível conectar ao servidor.' : 'Erro de conexão.',
                type: 'NETWORK_ERROR'
            });
        }
        
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/refresh/`, {
                        refresh: refreshToken
                    });
                    const newToken = response.data.access;
                    localStorage.setItem('access_token', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    clearAuthData();
                    redirectToLogin();
                    return Promise.reject({ message: 'Sessão expirada.', type: 'SESSION_EXPIRED' });
                }
            } else {
                clearAuthData();
                redirectToLogin();
                return Promise.reject({ message: 'Sessão inválida.', type: 'NO_TOKEN' });
            }
        }
        
        return Promise.reject({
            message: error.response?.data?.error || error.message || 'Erro desconhecido',
            type: 'UNKNOWN_ERROR',
            status: error.response?.status
        });
    }
);

// ==================== FUNÇÕES AUXILIARES ====================
export const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    sessionStorage.clear();
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() < payload.exp * 1000;
    } catch {
        return !!token;
    }
};

export const redirectToLogin = () => {
    const publicPaths = ['/login', '/register', '/2fa'];
    if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
    }
};

export const saveUserData = (user) => {
    localStorage.setItem('user_data', JSON.stringify(user));
};

export const getUserData = () => {
    try {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

// ==================== AUTENTICAÇÃO ====================
export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login/', { email, password });
        const { access, refresh, user } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (user) saveUserData(user);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message || 'Erro ao fazer login', status: error.status };
    }
};

export const register = async (userData) => {
    try {
        const response = await api.post('/auth/register/', userData);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message || 'Erro ao criar conta' };
    }
};

export const logout = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken });
        }
    } catch (error) {
        console.error('Erro no logout:', error);
    } finally {
        clearAuthData();
    }
};

export const verify2FA = async (email, code) => {
    try {
        const response = await api.post('/auth/verify-2fa/', { email, code });
        const { access, refresh, user } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (user) saveUserData(user);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message || 'Código inválido' };
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await api.get('/user/me/');
        saveUserData(response.data);
        return { success: true, user: response.data };
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
        if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
        if (filters.data_fim) params.append('data_fim', filters.data_fim);
        
        const url = `/pedidos/${params.toString() ? `?${params}` : ''}`;
        const response = await api.get(url);
        return { success: true, pedidos: response.data.pedidos || [], total: response.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getPedidoDetalhes = async (pedidoId) => {
    try {
        const response = await api.get(`/pedidos/${pedidoId}/`);
        return { success: true, pedido: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const criarPedido = async (dados) => {
    try {
        const response = await api.post('/pedidos/criar/', dados);
        return { success: true, pedido: response.data, pedido_id: response.data.pedido_id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const aprovarPedido = async (pedidoId, dadosAprovacao = {}) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/aprovar/`, dadosAprovacao);
        return { success: true, message: response.data.message, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const rejeitarPedido = async (pedidoId, comentario) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/rejeitar/`, { comentario });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const passarPedido = async (pedidoId) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/passar/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const passarPedidoDITE = async (pedidoId, destino) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/passar-dite/`, { destino });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const editarDatasPedido = async (pedidoId, dataSaida, dataVolta, motivo) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/editar-datas/`, {
            data_saida: dataSaida,
            data_volta: dataVolta,
            motivo: motivo
        });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== SEGURANÇA ====================
export const getSegurancaDashboard = async () => {
    try {
        const response = await api.get('/seguranca/dashboard/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const marcarSaida = async (pedidoId, horaSaida = null) => {
    try {
        const data = horaSaida ? { hora_saida: horaSaida } : {};
        const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, data);
        return { success: true, message: response.data.message, hora: response.data.hora };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const marcarRetorno = async (pedidoId, horaRetorno = null) => {
    try {
        const data = horaRetorno ? { hora_retorno: horaRetorno } : {};
        const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, data);
        return { 
            success: true, 
            message: response.data.message, 
            atrasado: response.data.atrasado, 
            tempo_atraso: response.data.tempo_atraso
        };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== SAÍDAS COLETIVAS ====================
export const getMinhasColetivas = async () => {
    try {
        const response = await api.get('/coletivas/minhas/');
        return { success: true, coletivas: response.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getTodasColetivas = async () => {
    try {
        const response = await api.get('/coletivas/todas/');
        return { success: true, coletivas: response.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const aceitarColetiva = async (conviteId) => {
    try {
        const response = await api.post(`/coletivas/${conviteId}/aceitar/`);
        return { success: true, message: response.data.message, pedido_id: response.data.pedido_id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const recusarColetiva = async (conviteId) => {
    try {
        const response = await api.post(`/coletivas/${conviteId}/recusar/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const criarSaidaColetiva = async (dados) => {
    try {
        const response = await api.post('/coletivas/criar/', dados);
        return { success: true, message: response.data.message, id: response.data.id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const listarColetivas = async (status = null) => {
    try {
        const url = status ? `/coletivas/listar/?status=${status}` : '/coletivas/listar/';
        const response = await api.get(url);
        return { success: true, coletivas: response.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const detalheColetiva = async (coletivaId) => {
    try {
        const response = await api.get(`/coletivas/${coletivaId}/`);
        return { success: true, coletiva: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const encerrarColetiva = async (coletivaId) => {
    try {
        const response = await api.post(`/coletivas/${coletivaId}/encerrar/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const confirmarSaidaColetiva = async (coletivaId) => {
    try {
        const response = await api.post(`/coletivas/${coletivaId}/confirmar-saida/`);
        return { success: true, message: response.data.message, total: response.data.total_confirmados };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== NOTIFICAÇÕES ====================
export const getNotificacoes = async () => {
    try {
        const response = await api.get('/notificacoes/');
        return { success: true, notificacoes: response.data.notificacoes || [], nao_lidas: response.data.nao_lidas || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const marcarNotificacaoLida = async (notificacaoId) => {
    try {
        await api.post(`/notificacoes/${notificacaoId}/ler/`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const marcarTodasNotificacoesLidas = async () => {
    try {
        await api.post('/notificacoes/ler-todas/');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== DASHBOARD ====================
export const getDashboard = async () => {
    try {
        const response = await api.get('/dashboard/');
        return { success: true, stats: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== RELATÓRIOS ====================
export const getRelatorios = async () => {
    try {
        const response = await api.get('/relatorios/');
        return { success: true, relatorios: response.data.relatorios || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const criarRelatorio = async (dados) => {
    try {
        const response = await api.post('/relatorios/criar/', dados);
        return { success: true, relatorio: response.data, relatorio_id: response.data.relatorio_id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const downloadRelatorio = async (relatorioId) => {
    try {
        const response = await api.get(`/relatorios/${relatorioId}/download/`, { responseType: 'blob' });
        return { success: true, blob: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteRelatorio = async (relatorioId) => {
    try {
        await api.delete(`/relatorios/${relatorioId}/delete/`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getRelatorioSeguranca = async (tipo = 'diario', data = null, mes = null, ano = null) => {
    try {
        let url = `/relatorios/seguranca/?tipo=${tipo}`;
        if (data) url += `&data=${data}`;
        if (mes) url += `&mes=${mes}`;
        if (ano) url += `&ano=${ano}`;
        const response = await api.get(url);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const relatorioColetivasDITE = async () => {
    try {
        const response = await api.get('/relatorios/dite/coletivas/');
        return { success: true, relatorio: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== ALERTAS ====================
export const getAlertasAtraso = async () => {
    try {
        const response = await api.get('/seguranca/alertas-atraso/');
        return { success: true, alertas: response.data.alertas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== ADMIN ====================
export const getUsuarios = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        const url = `/admin/users/${params.toString() ? `?${params}` : ''}`;
        const response = await api.get(url);
        return { success: true, users: response.data.users || [], total: response.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const aprovarUsuario = async (userId) => {
    try {
        const response = await api.post(`/admin/users/${userId}/approve/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const bloquearUsuario = async (userId, bloquear = true) => {
    try {
        const response = await api.post(`/admin/users/${userId}/block/`, { action: bloquear ? 'block' : 'unblock' });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const alterarRoleUsuario = async (userId, role) => {
    try {
        const response = await api.post(`/admin/users/${userId}/role/`, { role });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const getAdminLogs = async (level = null, limit = 100) => {
    try {
        let url = `/admin/logs/?limit=${limit}`;
        if (level) url += `&level=${level}`;
        const response = await api.get(url);
        return { success: true, logs: response.data.logs || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getAdminStats = async () => {
    try {
        const response = await api.get('/admin/stats/');
        return { success: true, stats: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== EXPORTAÇÃO PADRÃO ====================
export default api;

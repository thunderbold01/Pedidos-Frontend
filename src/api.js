// src/api.js - VERSÃO COMPLETA COM TODAS AS EXPORTAÇÕES
import axios from 'axios';

// ==================== CONFIGURAÇÃO DE AMBIENTE ====================
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const isProduction = !isDevelopment;

// URLs da API
const LOCAL_API_URL = 'http://localhost:8000/api';
const PROD_API_URL = 'https://pedidos-backend-fium.onrender.com/api';

// Escolhe a URL baseada no ambiente
const API_URL = isDevelopment ? LOCAL_API_URL : PROD_API_URL;

// Só mostra logs em desenvolvimento
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
            config.params = {
                ...config.params,
                _t: Date.now()
            };
        }
        
        if (isDevelopment) {
            console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
    },
    (error) => {
        if (isDevelopment) {
            console.error('❌ Erro no request:', error);
        }
        return Promise.reject(error);
    }
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
            if (isDevelopment) {
                console.error('🌐 Erro de conexão:', error.message);
            }
            return Promise.reject({
                message: isDevelopment 
                    ? 'Não foi possível conectar ao servidor.'
                    : 'Erro de conexão. Tente novamente.',
                type: 'NETWORK_ERROR'
            });
        }
        
        if (error.response.status === 403) {
            return Promise.reject({
                message: error.response.data?.error || 'Acesso negado.',
                type: 'FORBIDDEN',
                status: 403
            });
        }
        
        // Token expirado (401) - tentar renovar
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    if (isDevelopment) {
                        console.log('🔄 Tentando renovar token...');
                    }
                    
                    const response = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken
                    });
                    
                    const newToken = response.data.access;
                    localStorage.setItem('access_token', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    
                    return api(originalRequest);
                } catch (refreshError) {
                    if (isDevelopment) {
                        console.error('❌ Falha ao renovar token');
                    }
                    clearTokens();
                    redirectToLogin();
                    return Promise.reject({
                        message: 'Sessão expirada. Faça login novamente.',
                        type: 'SESSION_EXPIRED'
                    });
                }
            } else {
                clearTokens();
                redirectToLogin();
                return Promise.reject({
                    message: 'Sessão inválida. Faça login novamente.',
                    type: 'NO_TOKEN'
                });
            }
        }
        
        const errorMessage = isDevelopment
            ? (error.response?.data?.error || error.message || 'Erro desconhecido')
            : 'Ocorreu um erro. Tente novamente.';
        
        return Promise.reject({
            message: errorMessage,
            type: 'UNKNOWN_ERROR',
            status: error.response?.status
        });
    }
);

// ==================== FUNÇÕES AUXILIARES (EXPORTADAS) ====================

// ✅ EXPORTADA - Limpar tokens
export const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    sessionStorage.clear();
};

// ✅ EXPORTADA - Verificar autenticação
export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        return Date.now() < exp;
    } catch {
        return !!token;
    }
};

// ✅ EXPORTADA - Redirecionar para login
export const redirectToLogin = () => {
    const publicPaths = ['/login', '/register', '/2fa'];
    if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
    }
};

// ✅ EXPORTADA - Salvar dados do usuário
export const saveUserData = (user) => {
    localStorage.setItem('user_data', JSON.stringify(user));
};

// ✅ EXPORTADA - Obter dados do usuário
export const getUserData = () => {
    try {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

// ✅ EXPORTADA - Login
export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login/', { email, password });
        const { access, refresh, user } = response.data;
        
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (user) saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Erro ao fazer login',
            status: error.status
        };
    }
};

// ✅ EXPORTADA - Logout
export const logout = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken });
        }
    } catch (error) {
        if (isDevelopment) {
            console.error('Erro no logout:', error);
        }
    } finally {
        clearTokens();
    }
};

// ✅ EXPORTADA - Obter usuário atual
export const getUser = async () => {
    try {
        const response = await api.get('/user/me/');
        saveUserData(response.data);
        return { success: true, user: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== FUNÇÕES DE PEDIDOS ====================
export const getPedidos = async (filtros = {}) => {
    try {
        const params = new URLSearchParams();
        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.tipo) params.append('tipo', filtros.tipo);
        if (filtros.busca) params.append('busca', filtros.busca);
        if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
        
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

export const aprovarPedido = async (pedidoId) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/aprovar/`);
        return { success: true, message: response.data.message };
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

// ==================== FUNÇÕES DE SEGURANÇA ====================
export const getSegurancaDashboard = async () => {
    try {
        const response = await api.get('/seguranca/dashboard/');
        return { success: true, stats: response.data };
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

// ==================== FUNÇÕES DE SAÍDAS COLETIVAS ====================
export const getMinhasColetivas = async () => {
    try {
        const response = await api.get('/coletivas/minhas/');
        return { success: true, coletivas: response.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const aceitarColetiva = async (conviteId) => {
    try {
        const response = await api.post(`/coletivas/${conviteId}/aceitar/`);
        return { success: true, message: response.data.message };
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

// ==================== FUNÇÕES DE NOTIFICAÇÕES ====================
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

// ==================== FUNÇÕES DE DASHBOARD ====================
export const getDashboard = async () => {
    try {
        const response = await api.get('/dashboard/');
        return { success: true, stats: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== FUNÇÕES DE RELATÓRIOS ====================
export const getRelatorios = async () => {
    try {
        const response = await api.get('/relatorios/');
        return { success: true, relatorios: response.data.relatorios || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== FUNÇÕES DE ALERTAS ====================
export const getAlertasAtraso = async () => {
    try {
        const response = await api.get('/seguranca/alertas-atraso/');
        return { success: true, alertas: response.data.alertas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== EXPORTAÇÃO PADRÃO ====================
export default api;

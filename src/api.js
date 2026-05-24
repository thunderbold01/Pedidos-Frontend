// src/api.js - VERSÃO COMPLETA E CORRIGIDA
import axios from 'axios';

// ==================== CONFIGURAÇÃO DE AMBIENTE ====================
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const isVercel = window.location.hostname.includes('vercel.app');

// URLs da API
const LOCAL_API_URL = 'http://localhost:8000/api';
const PROD_API_URL = 'https://pedidos-backend-fium.onrender.com/api';
const VERCEL_API_URL = 'https://pedidos-backend-fium.onrender.com/api';

// Escolhe a URL baseada no ambiente
let API_URL;
if (isDevelopment) {
    API_URL = LOCAL_API_URL;
} else if (isVercel) {
    API_URL = VERCEL_API_URL;
} else {
    API_URL = PROD_API_URL;
}

console.log(`🔧 API configurada para: ${API_URL} (${isDevelopment ? 'Desenvolvimento Local' : isVercel ? 'Vercel' : 'Produção'})`);

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
        
        // Adicionar timestamp para evitar cache (GET requests)
        if (config.method === 'get') {
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
        console.error('❌ Erro no request:', error);
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
        
        // Erro de rede (API offline)
        if (!error.response) {
            console.error('🌐 Erro de conexão:', error.message);
            return Promise.reject({
                message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
                type: 'NETWORK_ERROR',
                original: error
            });
        }
        
        // Erro 403 - Sem permissão
        if (error.response.status === 403) {
            console.error('🔒 Acesso negado:', error.response.data);
            return Promise.reject({
                message: error.response.data?.error || 'Você não tem permissão para esta ação.',
                type: 'FORBIDDEN',
                status: 403,
                original: error
            });
        }
        
        // Erro 404 - Não encontrado
        if (error.response.status === 404) {
            console.warn('🔍 Recurso não encontrado:', error.response.config.url);
            return Promise.reject({
                message: 'Recurso não encontrado.',
                type: 'NOT_FOUND',
                status: 404,
                original: error
            });
        }
        
        // Erro 422 - Validação
        if (error.response.status === 422) {
            console.warn('⚠️ Erro de validação:', error.response.data);
            return Promise.reject({
                message: error.response.data?.error || 'Dados inválidos.',
                type: 'VALIDATION_ERROR',
                errors: error.response.data,
                status: 422,
                original: error
            });
        }
        
        // Erro 500 - Servidor
        if (error.response.status >= 500) {
            console.error('💥 Erro no servidor:', error.response.status, error.response.data);
            return Promise.reject({
                message: 'Erro interno do servidor. Tente novamente mais tarde.',
                type: 'SERVER_ERROR',
                status: error.response.status,
                original: error
            });
        }
        
        // Token expirado (401) - tentar renovar
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    console.log('🔄 Tentando renovar token...');
                    
                    const response = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken
                    });
                    
                    const { access } = response.data;
                    localStorage.setItem('access_token', access);
                    
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                    
                } catch (refreshError) {
                    console.error('❌ Falha ao renovar token:', refreshError);
                    clearAuthData();
                    redirectToLogin();
                    return Promise.reject({
                        message: 'Sessão expirada. Faça login novamente.',
                        type: 'SESSION_EXPIRED',
                        original: refreshError
                    });
                }
            } else {
                console.warn('⚠️ Sem refresh token, redirecionando para login');
                clearAuthData();
                redirectToLogin();
                return Promise.reject({
                    message: 'Sessão inválida. Faça login novamente.',
                    type: 'NO_TOKEN',
                    original: error
                });
            }
        }
        
        // Outros erros
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.response?.data?.detail ||
                           error.message ||
                           'Erro desconhecido';
        
        return Promise.reject({
            message: errorMessage,
            type: 'UNKNOWN_ERROR',
            status: error.response?.status,
            data: error.response?.data,
            original: error
        });
    }
);

// ==================== FUNÇÕES AUXILIARES ====================

// Limpar dados de autenticação
export const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    sessionStorage.clear();
};

// Verificar se está autenticado
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

// Redirecionar para login
export const redirectToLogin = () => {
    if (window.location.pathname !== '/login' && 
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/2fa') {
        window.location.href = '/login';
    }
};

// Obter dados do usuário do localStorage
export const getUserData = () => {
    try {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
};

// Salvar dados do usuário
export const saveUserData = (user) => {
    localStorage.setItem('user_data', JSON.stringify(user));
};

// Obter token
export const getToken = () => {
    return localStorage.getItem('access_token');
};

// Obter refresh token
export const getRefreshToken = () => {
    return localStorage.getItem('refresh_token');
};

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

// Login
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

// Registro
export const register = async (userData) => {
    try {
        const response = await api.post('/auth/register/', userData);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao criar conta',
            details: error.data
        };
    }
};

// Logout
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

// Verificar 2FA
export const verify2FA = async (email, code) => {
    try {
        const response = await api.post('/auth/verify-2fa/', { email, code });
        const { access, refresh, user } = response.data;
        
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (user) saveUserData(user);
        
        return { success: true, user };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Código inválido'
        };
    }
};

// ==================== FUNÇÕES DE USUÁRIO ====================

// Obter dados do usuário atual
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/user/me/');
        saveUserData(response.data);
        return { success: true, user: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar dados do usuário'
        };
    }
};

// Atualizar perfil
export const updateProfile = async (data) => {
    try {
        const response = await api.patch('/user/me/update/', data);
        saveUserData(response.data);
        return { success: true, user: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao atualizar perfil'
        };
    }
};

// Alterar senha
export const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
    try {
        const response = await api.post('/auth/password/change/', {
            old_password: oldPassword,
            new_password: newPassword,
            confirm_new_password: confirmNewPassword
        });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao alterar senha'
        };
    }
};

// Solicitar reset de senha
export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post('/auth/password/reset/', { email });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Email não encontrado'
        };
    }
};

// ==================== FUNÇÕES DE PEDIDOS ====================

// Listar pedidos
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
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar pedidos'
        };
    }
};

// Criar pedido
export const createPedido = async (pedidoData) => {
    try {
        const response = await api.post('/pedidos/criar/', pedidoData);
        return { success: true, pedido: response.data, pedido_id: response.data.pedido_id };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao criar pedido'
        };
    }
};

// Obter detalhes do pedido
export const getPedidoDetalhes = async (pedidoId) => {
    try {
        const response = await api.get(`/pedidos/${pedidoId}/`);
        return { success: true, pedido: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar detalhes do pedido'
        };
    }
};

// Aprovar pedido
export const aprovarPedido = async (pedidoId, data = {}) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/aprovar/`, data);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao aprovar pedido'
        };
    }
};

// Rejeitar pedido
export const rejeitarPedido = async (pedidoId, comentario) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/rejeitar/`, { comentario });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao rejeitar pedido'
        };
    }
};

// Encaminhar pedido (DITE)
export const encaminharPedidoDITE = async (pedidoId, destino) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/passar-dite/`, { destino });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao encaminhar pedido'
        };
    }
};

// Encaminhar pedido (Direção/Administração)
export const encaminharPedido = async (pedidoId) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/passar/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao encaminhar pedido'
        };
    }
};

// Editar datas do pedido
export const editarDatasPedido = async (pedidoId, dataSaida, dataVolta, motivo) => {
    try {
        const response = await api.post(`/pedidos/${pedidoId}/editar-datas/`, {
            data_saida: dataSaida,
            data_volta: dataVolta,
            motivo: motivo
        });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao editar datas'
        };
    }
};

// ==================== FUNÇÕES DE SEGURANÇA ====================

// Dashboard segurança
export const getSegurancaDashboard = async () => {
    try {
        const response = await api.get('/seguranca/dashboard/');
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar dashboard'
        };
    }
};

// Saídas de hoje
export const getSaidasHoje = async () => {
    try {
        const response = await api.get('/seguranca/saidas-hoje/');
        return { success: true, saidas: response.data.saidas || [], total: response.data.total };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar saídas'
        };
    }
};

// Saídas por data
export const getSaidasData = async (data) => {
    try {
        const response = await api.get(`/seguranca/saidas-data/?data=${data}`);
        return { success: true, saidas: response.data.saidas || [], total: response.data.total };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar saídas'
        };
    }
};

// Marcar saída
export const marcarSaida = async (pedidoId, hora = null) => {
    try {
        const data = hora ? { hora_saida: hora } : {};
        const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, data);
        return { success: true, message: response.data.message, hora: response.data.hora };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao registrar saída'
        };
    }
};

// Marcar retorno
export const marcarRetorno = async (pedidoId, hora = null) => {
    try {
        const data = hora ? { hora_retorno: hora } : {};
        const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, data);
        return { 
            success: true, 
            message: response.data.message,
            atrasado: response.data.atrasado,
            tempo_atraso: response.data.tempo_atraso
        };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao registrar retorno'
        };
    }
};

// Relatório completo de segurança
export const getRelatorioCompleto = async (data) => {
    try {
        const response = await api.get(`/seguranca/relatorio-completo/?data=${data}`);
        return { success: true, relatorio: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao gerar relatório'
        };
    }
};

// Enviar relatório
export const enviarRelatorio = async (data) => {
    try {
        const response = await api.post('/seguranca/enviar-relatorio/', { data });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao enviar relatório'
        };
    }
};

// ==================== FUNÇÕES DE SAÍDAS COLETIVAS ====================

// Criar saída coletiva
export const criarSaidaColetiva = async (data) => {
    try {
        const response = await api.post('/coletivas/criar/', data);
        return { success: true, coletiva: response.data, id: response.data.id };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao criar saída coletiva'
        };
    }
};

// Listar saídas coletivas
export const listarSaidasColetivas = async (status = null) => {
    try {
        const url = status ? `/coletivas/listar/?status=${status}` : '/coletivas/listar/';
        const response = await api.get(url);
        return { success: true, coletivas: response.data.coletivas || [], total: response.data.total };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar saídas coletivas'
        };
    }
};

// Minhas saídas coletivas (estudante)
export const getMinhasColetivas = async () => {
    try {
        const response = await api.get('/coletivas/minhas/');
        return { success: true, coletivas: response.data.coletivas || [] };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar suas saídas coletivas'
        };
    }
};

// Aceitar convite coletiva
export const aceitarColetiva = async (conviteId) => {
    try {
        const response = await api.post(`/coletivas/${conviteId}/aceitar/`);
        return { success: true, message: response.data.message, pedido_id: response.data.pedido_id };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao aceitar convite'
        };
    }
};

// Recusar convite coletiva
export const recusarColetiva = async (conviteId) => {
    try {
        const response = await api.post(`/coletivas/${conviteId}/recusar/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao recusar convite'
        };
    }
};

// Encerrar saída coletiva
export const encerrarSaidaColetiva = async (coletivaId) => {
    try {
        const response = await api.post(`/coletivas/${coletivaId}/encerrar/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao encerrar saída coletiva'
        };
    }
};

// Confirmar saída coletiva
export const confirmarSaidaColetiva = async (coletivaId) => {
    try {
        const response = await api.post(`/coletivas/${coletivaId}/confirmar-saida/`);
        return { success: true, message: response.data.message, total: response.data.total_confirmados };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.error || error.message || 'Erro ao confirmar saída coletiva'
        };
    }
};

// ==================== FUNÇÕES DE NOTIFICAÇÕES ====================

// Listar notificações
export const getNotificacoes = async () => {
    try {
        const response = await api.get('/notificacoes/');
        return { success: true, notificacoes: response.data.notificacoes || [], nao_lidas: response.data.nao_lidas || 0 };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar notificações'
        };
    }
};

// Marcar notificação como lida
export const marcarNotificacaoLida = async (notificacaoId) => {
    try {
        await api.post(`/notificacoes/${notificacaoId}/ler/`);
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao marcar notificação'
        };
    }
};

// Marcar todas como lidas
export const marcarTodasNotificacoesLidas = async () => {
    try {
        await api.post('/notificacoes/ler-todas/');
        return { success: true };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao marcar notificações'
        };
    }
};

// ==================== FUNÇÕES DE RELATÓRIOS ====================

// Listar relatórios
export const getRelatorios = async () => {
    try {
        const response = await api.get('/relatorios/');
        return { success: true, relatorios: response.data.relatorios || [], total: response.data.total };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar relatórios'
        };
    }
};

// Criar relatório
export const criarRelatorio = async (titulo, dataInicio, dataFim) => {
    try {
        const response = await api.post('/relatorios/criar/', {
            titulo: titulo,
            tipo: 'PERSONALIZADO',
            data_inicio: dataInicio,
            data_fim: dataFim
        });
        return { success: true, relatorio: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao criar relatório'
        };
    }
};

// Baixar relatório
export const baixarRelatorio = async (relatorioId) => {
    try {
        const response = await api.get(`/relatorios/download/${relatorioId}/`, { responseType: 'blob' });
        return { success: true, blob: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao baixar relatório'
        };
    }
};

// Deletar relatório
export const deletarRelatorio = async (relatorioId) => {
    try {
        const response = await api.delete(`/relatorios/${relatorioId}/delete/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao deletar relatório'
        };
    }
};

// ==================== FUNÇÕES DE DASHBOARD ====================

// Dashboard principal
export const getDashboard = async () => {
    try {
        const response = await api.get('/dashboard/');
        return { success: true, stats: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar dashboard'
        };
    }
};

// ==================== FUNÇÕES DE ADMIN ====================

// Listar todos os usuários (admin)
export const getUsuarios = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        
        const response = await api.get(`/admin/users/${params.toString() ? `?${params}` : ''}`);
        return { success: true, users: response.data.users || [], total: response.data.total };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar usuários'
        };
    }
};

// Aprovar usuário (admin)
export const aprovarUsuario = async (userId) => {
    try {
        const response = await api.post(`/admin/users/${userId}/approve/`);
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao aprovar usuário'
        };
    }
};

// Bloquear/Desbloquear usuário (admin)
export const toggleUserBlock = async (userId, block = true) => {
    try {
        const action = block ? 'block' : 'unblock';
        const response = await api.post(`/admin/users/${userId}/block/`, { action });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao alterar status do usuário'
        };
    }
};

// Alterar papel do usuário (admin)
export const changeUserRole = async (userId, role) => {
    try {
        const response = await api.post(`/admin/users/${userId}/role/`, { role });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao alterar papel do usuário'
        };
    }
};

// Resetar senha (admin)
export const resetUserPassword = async (userId, newPassword) => {
    try {
        const response = await api.post(`/admin/users/${userId}/reset-password/`, { password: newPassword });
        return { success: true, message: response.data.message };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao resetar senha'
        };
    }
};

// ==================== ALERTAS ====================

// Alertas de atraso
export const getAlertasAtraso = async () => {
    try {
        const response = await api.get('/seguranca/alertas-atraso/');
        return { success: true, alertas: response.data.alertas || [], total: response.data.total };
    } catch (error) {
        return { 
            success: false, 
            error: error.message || 'Erro ao carregar alertas'
        };
    }
};

// ==================== EXPORTAÇÃO PADRÃO ====================
export default api;

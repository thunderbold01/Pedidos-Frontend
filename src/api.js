// src/api.js - VERSÃO COMPLETA COM TODAS AS FUNÇÕES DE SEGURANÇA
import axios from 'axios';

// ==================== CONFIGURAÇÃO ====================
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const LOCAL_API_URL = 'http://localhost:8000/api';
const PROD_API_URL = 'https://pedidos-backend-fium.onrender.com/api';
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
        const res = await api.post('/auth/login/', { email, password });
        const { access, refresh, user } = res.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (user) saveUserData(user);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || 'Erro ao fazer login' };
    }
};

export const register = async (userData) => {
    try {
        const res = await api.post('/auth/register/', userData);
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const logout = async () => {
    try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) await api.post('/auth/logout/', { refresh });
    } catch (e) {}
    finally { clearAuth(); }
};

export const verify2FA = async (email, code) => {
    try {
        const res = await api.post('/auth/verify-2fa/', { email, code });
        const { access, refresh, user } = res.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        if (user) saveUserData(user);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || 'Código inválido' };
    }
};

export const getCurrentUser = async () => {
    try {
        const res = await api.get('/user/me/');
        saveUserData(res.data);
        return { success: true, user: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateProfile = async (data) => {
    try {
        const res = await api.patch('/user/me/update/', data);
        saveUserData(res.data);
        return { success: true, user: res.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const changePassword = async (oldPassword, newPassword, confirmNewPassword) => {
    try {
        const res = await api.post('/auth/password/change/', {
            old_password: oldPassword,
            new_password: newPassword,
            confirm_new_password: confirmNewPassword
        });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const res = await api.post('/auth/password/reset/', { email });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
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
        const res = await api.get(url);
        return { success: true, pedidos: res.data.pedidos || [], total: res.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getPedidoDetalhes = async (id) => {
    try {
        const res = await api.get(`/pedidos/${id}/`);
        return { success: true, pedido: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const criarPedido = async (dados) => {
    try {
        const res = await api.post('/pedidos/criar/', dados);
        return { success: true, pedido_id: res.data.pedido_id, pedido: res.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const aprovarPedido = async (id, dados = {}) => {
    try {
        const res = await api.post(`/pedidos/${id}/aprovar/`, dados);
        return { success: true, message: res.data.message, data: res.data };
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

export const passarPedido = async (id) => {
    try {
        const res = await api.post(`/pedidos/${id}/passar/`);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const passarPedidoDITE = async (id, destino) => {
    try {
        const res = await api.post(`/pedidos/${id}/passar-dite/`, { destino });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const editarDatasPedido = async (id, dataSaida, dataVolta, motivo) => {
    try {
        const res = await api.post(`/pedidos/${id}/editar-datas/`, {
            data_saida: dataSaida,
            data_volta: dataVolta,
            motivo: motivo
        });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== SEGURANÇA (COMPLETO) ====================
export const getSegurancaDashboard = async () => {
    try {
        const res = await api.get('/seguranca/dashboard/');
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getSaidasHoje = async () => {
    try {
        const res = await api.get('/seguranca/saidas-hoje/');
        return { success: true, saidas: res.data.saidas || [], total: res.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getSaidasSemana = async () => {
    try {
        const res = await api.get('/seguranca/saidas-semana/');
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getSaidasPorData = async (data) => {
    try {
        const res = await api.get(`/seguranca/saidas-data/?data=${data}`);
        return { success: true, saidas: res.data.saidas || [], total: res.data.total || 0, data: res.data.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getColetivasHoje = async () => {
    try {
        const res = await api.get('/seguranca/coletivas-hoje/');
        return { success: true, coletivas: res.data.coletivas || [], total: res.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const marcarSaida = async (pedidoId, horaSaida = null) => {
    try {
        const data = horaSaida ? { hora_saida: horaSaida } : {};
        const res = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, data);
        return { success: true, message: res.data.message, hora: res.data.hora };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const marcarRetorno = async (pedidoId, horaRetorno = null) => {
    try {
        const data = horaRetorno ? { hora_retorno: horaRetorno } : {};
        const res = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, data);
        return {
            success: true,
            message: res.data.message,
            hora: res.data.hora,
            atrasado: res.data.atrasado,
            tempo_atraso: res.data.tempo_atraso
        };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== RELATÓRIOS DE SEGURANÇA ====================
export const getRelatorioDiarioSeguranca = async (data = null) => {
    try {
        const url = data ? `/seguranca/relatorio-diario/?data=${data}` : '/seguranca/relatorio-diario/';
        const res = await api.get(url);
        return { success: true, relatorio: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getRelatorioSemanalSeguranca = async () => {
    try {
        const res = await api.get('/seguranca/relatorio-semanal/');
        return { success: true, relatorio: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getRelatorioMensalSeguranca = async (mes, ano) => {
    try {
        const res = await api.get(`/seguranca/relatorio-mensal/?mes=${mes}&ano=${ano}`);
        return { success: true, relatorio: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getRelatorioSaidasSeguranca = async (data = null) => {
    try {
        const url = data ? `/seguranca/relatorio-saidas/?data=${data}` : '/seguranca/relatorio-saidas/';
        const res = await api.get(url);
        return { success: true, relatorio: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getRelatorioCompletoSeguranca = async (data = null) => {
    try {
        const url = data ? `/seguranca/relatorio-completo/?data=${data}` : '/seguranca/relatorio-completo/';
        const res = await api.get(url);
        return { success: true, relatorio: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const enviarRelatorioSaidas = async (data = null) => {
    try {
        const payload = data ? { data } : {};
        const res = await api.post('/seguranca/enviar-relatorio/', payload);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== ALERTAS DE ATRASO ====================
export const getAlertasAtraso = async () => {
    try {
        const res = await api.get('/seguranca/alertas-atraso/');
        return { success: true, alertas: res.data.alertas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== SAÍDAS COLETIVAS ====================
export const criarSaidaColetiva = async (dados) => {
    try {
        const res = await api.post('/coletivas/criar/', dados);
        return { success: true, message: res.data.message, id: res.data.id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const listarColetivas = async (status = null) => {
    try {
        const url = status ? `/coletivas/listar/?status=${status}` : '/coletivas/listar/';
        const res = await api.get(url);
        return { success: true, coletivas: res.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const detalheColetiva = async (id) => {
    try {
        const res = await api.get(`/coletivas/${id}/`);
        return { success: true, coletiva: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const encerrarColetiva = async (id) => {
    try {
        const res = await api.post(`/coletivas/${id}/encerrar/`);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const confirmarSaidaColetiva = async (id) => {
    try {
        const res = await api.post(`/coletivas/${id}/confirmar-saida/`);
        return { success: true, message: res.data.message, total: res.data.total_confirmados };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const getMinhasColetivas = async () => {
    try {
        const res = await api.get('/coletivas/minhas/');
        return { success: true, coletivas: res.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getTodasMinhasColetivas = async () => {
    try {
        const res = await api.get('/coletivas/todas/');
        return { success: true, coletivas: res.data.coletivas || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const aceitarColetiva = async (conviteId) => {
    try {
        const res = await api.post(`/coletivas/${conviteId}/aceitar/`);
        return { success: true, message: res.data.message, pedido_id: res.data.pedido_id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const recusarColetiva = async (conviteId) => {
    try {
        const res = await api.post(`/coletivas/${conviteId}/recusar/`);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
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

export const marcarNotificacaoLida = async (id) => {
    try {
        await api.post(`/notificacoes/${id}/ler/`);
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

export const enviarNotificacao = async (usuarioId, mensagem, tipo = 'SISTEMA', pedidoId = null) => {
    try {
        const payload = { usuario_id: usuarioId, mensagem, tipo };
        if (pedidoId) payload.pedido_id = pedidoId;
        const res = await api.post('/notificacoes/enviar/', payload);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== DASHBOARD GERAL ====================
export const getDashboard = async () => {
    try {
        const res = await api.get('/dashboard/');
        return { success: true, stats: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== RELATÓRIOS GERAIS ====================
export const getRelatorios = async () => {
    try {
        const res = await api.get('/relatorios/');
        return { success: true, relatorios: res.data.relatorios || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const criarRelatorio = async (dados) => {
    try {
        const res = await api.post('/relatorios/criar/', dados);
        return { success: true, relatorio: res.data, relatorio_id: res.data.relatorio_id };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const downloadRelatorio = async (id) => {
    try {
        const res = await api.get(`/relatorios/${id}/download/`, { responseType: 'blob' });
        return { success: true, blob: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteRelatorio = async (id) => {
    try {
        await api.delete(`/relatorios/${id}/delete/`);
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
        const res = await api.get(url);
        return { success: true, data: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const relatorioColetivasDITE = async () => {
    try {
        const res = await api.get('/relatorios/dite/coletivas/');
        return { success: true, relatorio: res.data };
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
        const res = await api.get(url);
        return { success: true, users: res.data.users || [], total: res.data.total || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const aprovarUsuario = async (userId) => {
    try {
        const res = await api.post(`/admin/users/${userId}/approve/`);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const bloquearUsuario = async (userId, bloquear = true) => {
    try {
        const res = await api.post(`/admin/users/${userId}/block/`, { action: bloquear ? 'block' : 'unblock' });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const alterarRoleUsuario = async (userId, role) => {
    try {
        const res = await api.post(`/admin/users/${userId}/role/`, { role });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const getAdminLogs = async (level = null, limit = 100) => {
    try {
        let url = `/admin/logs/?limit=${limit}`;
        if (level) url += `&level=${level}`;
        const res = await api.get(url);
        return { success: true, logs: res.data.logs || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getAdminStats = async () => {
    try {
        const res = await api.get('/admin/stats/');
        return { success: true, stats: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getAdminMonitor = async () => {
    try {
        const res = await api.get('/admin/monitor/');
        return { success: true, monitor: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getAdminConfig = async () => {
    try {
        const res = await api.get('/admin/config/');
        return { success: true, config: res.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateAdminConfig = async (configData) => {
    try {
        const res = await api.post('/admin/config/', configData);
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== FEEDBACK ====================
export const getFeedbacks = async () => {
    try {
        const res = await api.get('/feedback/');
        return { success: true, feedbacks: res.data.feedbacks || [] };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const criarFeedback = async (dados) => {
    try {
        const res = await api.post('/feedback/create/', dados);
        return { success: true, feedback: res.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

export const responderFeedback = async (feedbackId, resposta, status = 'RESOLVED') => {
    try {
        const res = await api.post(`/feedback/${feedbackId}/respond/`, { response: resposta, status });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== WEBHOOK ====================
export const webhookAtualizarStatus = async (pedidoId, status, token) => {
    try {
        const res = await api.post('/webhook/atualizar-status/', { pedido_id: pedidoId, status }, {
            headers: { 'X-Webhook-Token': token }
        });
        return { success: true, message: res.data.message };
    } catch (error) {
        return { success: false, error: error.response?.data?.error || error.message };
    }
};

// ==================== EXPORTAÇÃO PADRÃO ====================
export default api;

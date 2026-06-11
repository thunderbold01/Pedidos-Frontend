// src/pages/DashboardSeguranca.jsx - VERSÃO CORRIGIDA
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // ==================== STATE ====================
  const [saidasHoje, setSaidasHoje] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalRegistro, setModalRegistro] = useState(null);
  const [horaManual, setHoraManual] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(null);
  
  const navigate = useNavigate();

  // ==================== THEME ====================
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('security-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    localStorage.setItem('security-theme', themeMode);
  }, [themeMode]);

  // ==================== CORES ====================
  const colors = {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    bg: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceAlt: isDark ? '#334155' : '#F1F5F9',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
  };

  // ==================== RELÓGIO ====================
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==================== CARREGAR DADOS ====================
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Usar a data selecionada para buscar saídas
      const [dashboardRes, saidasRes] = await Promise.all([
        api.get('/seguranca/dashboard/'),
        api.get(`/seguranca/saidas-data/?data=${dataSelecionada}`)
      ]);
      
      setStats(dashboardRes.data);
      setSaidasHoje(saidasRes.data.saidas || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada]);

  const carregarNotificacoes = useCallback(async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  }, []);

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
  }, [carregarDados]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      carregarDados();
      carregarNotificacoes();
    }, 30000);
    return () => clearInterval(interval);
  }, [carregarDados]);

  // ==================== AÇÕES ====================
  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
  };

  const registrarSaida = async (pedidoId) => {
    if (!confirm('✅ Confirmar SAÍDA do estudante?')) return;
    try {
      const data = horaManual ? { hora_saida: horaManual } : {};
      const res = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, data);
      alert(`✅ Saída registrada às ${res.data.hora}`);
      setModalRegistro(null);
      setHoraManual('');
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  const registrarRetorno = async (pedidoId) => {
    if (!confirm('✅ Confirmar RETORNO do estudante?')) return;
    try {
      const data = horaManual ? { hora_retorno: horaManual } : {};
      const res = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, data);
      let msg = `✅ Retorno registrado às ${res.data.hora}`;
      if (res.data.atrasado) msg += ` ⚠️ ATRASO de ${res.data.tempo_atraso} minutos!`;
      alert(msg);
      setModalRegistro(null);
      setHoraManual('');
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  const enviarRelatorio = async () => {
    if (!confirm('📊 Enviar relatório do dia para a DITE?')) return;
    setModalRelatorio('enviando');
    try {
      await api.post('/seguranca/enviar-relatorio/', { data: dataSelecionada });
      alert('✅ Relatório enviado para a DITE com sucesso!');
    } catch (err) {
      alert('❌ Erro ao enviar relatório: ' + (err.response?.data?.error || err.message));
    } finally {
      setModalRelatorio(null);
    }
  };

  const gerarRelatorioCompleto = async () => {
    setModalRelatorio('gerando');
    try {
      const res = await api.get(`/seguranca/relatorio-completo/?data=${dataSelecionada}`);
      
      // Criar e baixar arquivo TXT
      const blob = new Blob([res.data.texto_relatorio], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_seguranca_${dataSelecionada}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('✅ Relatório gerado e baixado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao gerar relatório: ' + (err.response?.data?.error || err.message));
    } finally {
      setModalRelatorio(null);
    }
  };

  // ==================== FILTROS ====================
  const saidasFiltradas = saidasHoje.filter(s => {
    if (filtroStatus !== 'todos' && s.estado !== filtroStatus) return false;
    if (searchTerm && !s.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusInfo = (estado) => {
    const statusMap = {
      'APROVADO': { label: 'Aguardando Saída', color: colors.warning, icon: '⏳' },
      'EM_ANDAMENTO': { label: 'Em Andamento', color: colors.info, icon: '🚶' },
      'FINALIZADO': { label: 'Finalizado', color: colors.success, icon: '✅' }
    };
    return statusMap[estado] || { label: estado, color: colors.textMuted, icon: '📋' };
  };

  // ==================== RENDER ====================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; left: -280px !important; z-index: 1000 !important; transition: left 0.3s ease !important; }
          .sidebar.open { left: 0 !important; }
          .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; backdrop-filter: blur(2px); }
          .overlay.show { display: block; }
          .main-content { margin-left: 0 !important; width: 100% !important; }
          .table-responsive { overflow-x: auto; }
          table { min-width: 550px; }
        }
      `}</style>

      {/* Overlay Mobile */}
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 260, background: colors.surface, borderRight: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0
      }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, background: colors.primary, borderRadius: 10,
              display: 'grid', placeItems: 'center', color: '#FFF', fontSize: 18
            }}>🔒</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>SEGURANÇA</div>
              <div style={{ fontSize: 10, color: colors.primary }}>PORTARIA</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', margin: '8px', background: colors.surfaceAlt, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: colors.primary,
              display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 600, fontSize: 16
            }}>{user?.nome?.charAt(0) || user?.username?.charAt(0) || 'S'}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.nome || user?.username || 'Segurança'}</div>
              <div style={{ fontSize: 11, color: colors.primary }}>Portaria</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setFiltroStatus('todos')} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8,
            background: filtroStatus === 'todos' ? colors.primary + '15' : 'transparent',
            color: filtroStatus === 'todos' ? colors.primary : colors.textMuted,
            fontWeight: filtroStatus === 'todos' ? 600 : 500, fontSize: 13, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
          }}>
            <span>📋</span> Todos
          </button>
          <button onClick={() => setFiltroStatus('APROVADO')} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8,
            background: filtroStatus === 'APROVADO' ? colors.primary + '15' : 'transparent',
            color: filtroStatus === 'APROVADO' ? colors.primary : colors.textMuted,
            fontWeight: filtroStatus === 'APROVADO' ? 600 : 500, fontSize: 13, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
          }}>
            <span>⏳</span> Aguardando Saída
          </button>
          <button onClick={() => setFiltroStatus('EM_ANDAMENTO')} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8,
            background: filtroStatus === 'EM_ANDAMENTO' ? colors.primary + '15' : 'transparent',
            color: filtroStatus === 'EM_ANDAMENTO' ? colors.primary : colors.textMuted,
            fontWeight: filtroStatus === 'EM_ANDAMENTO' ? 600 : 500, fontSize: 13, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
          }}>
            <span>🚶</span> Em Andamento
          </button>
          <button onClick={() => setFiltroStatus('FINALIZADO')} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8,
            background: filtroStatus === 'FINALIZADO' ? colors.primary + '15' : 'transparent',
            color: filtroStatus === 'FINALIZADO' ? colors.primary : colors.textMuted,
            fontWeight: filtroStatus === 'FINALIZADO' ? 600 : 500, fontSize: 13, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
          }}>
            <span>✅</span> Finalizados
          </button>
        </nav>

        <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}` }}>
          <button onClick={() => setThemeMode(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: '10px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`,
            borderRadius: 8, color: colors.text, cursor: 'pointer', fontSize: 12, marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{isDark ? '☀ Claro' : '🌙 Escuro'}</span>
            <span>{isDark ? '🌞' : '🌛'}</span>
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: '10px', background: colors.danger + '15', color: colors.danger,
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600
          }}>
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{
          background: colors.surface, borderBottom: `1px solid ${colors.border}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(true)} style={{
              display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: colors.text,
              '@media (max-width: 768px)': { display: 'block' }
            }}>☰</button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Controle de Portaria</h1>
              <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{horaAtual}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.surfaceAlt, padding: '6px 12px', borderRadius: 8 }}>
              <span>📅</span>
              <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} style={{
                border: 'none', background: 'transparent', fontSize: 13, color: colors.text, outline: 'none'
              }} />
            </div>
            <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{
              position: 'relative', width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.border}`,
              background: colors.surface, cursor: 'pointer', display: 'grid', placeItems: 'center'
            }}>
              🔔
              {notificacoesNaoLidas > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: colors.danger,
                  color: '#FFF', borderRadius: '50%', fontSize: 9, display: 'grid', placeItems: 'center'
                }}>{notificacoesNaoLidas}</span>
              )}
            </button>
          </div>
        </header>

        {/* Notificações Dropdown */}
        {showNotifDropdown && (
          <div style={{
            position: 'absolute', top: 70, right: 24, width: 320, background: colors.surface,
            border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 100, maxHeight: 400, overflow: 'auto'
          }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, fontWeight: 600 }}>Notificações</div>
            {notificacoes.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>Nenhuma notificação</div>
            ) : (
              notificacoes.map(n => (
                <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{
                  padding: 12, borderBottom: `1px solid ${colors.border}`, cursor: 'pointer',
                  background: n.lida ? 'transparent' : colors.primary + '10'
                }}>
                  <div style={{ fontSize: 12 }}>{n.mensagem}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{n.data}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>📋</span>
                <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total_saidas || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Autorizados Hoje</div></div>
              </div>
            </div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>🚶</span>
                <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.em_andamento || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Em Andamento</div></div>
              </div>
            </div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.finalizados || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Finalizados</div></div>
              </div>
            </div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div><div style={{ fontSize: 24, fontWeight: 700, color: colors.danger }}>{stats.atrasados || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Atrasos</div></div>
              </div>
            </div>
          </div>

          {/* Barra de Busca */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }}>🔍</span>
              <input type="text" placeholder="Buscar estudante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
                width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${colors.border}`, borderRadius: 8,
                background: colors.surface, color: colors.text, outline: 'none'
              }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={enviarRelatorio} disabled={modalRelatorio === 'enviando'} style={{
                padding: '10px 16px', background: colors.primary, color: '#FFF', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
              }}>📧 Enviar Relatório</button>
              <button onClick={gerarRelatorioCompleto} disabled={modalRelatorio === 'gerando'} style={{
                padding: '10px 16px', background: colors.success, color: '#FFF', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
              }}>📄 Gerar Relatório</button>
            </div>
          </div>

          {/* Tabela de Saídas */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p>Carregando...</p>
            </div>
          ) : saidasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 48, opacity: 0.5 }}>📭</span>
              <p style={{ marginTop: 12, color: colors.textMuted }}>Nenhuma saída encontrada para esta data</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>ESTUDANTE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>CURSO/CLASSE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>SAÍDA PREVISTA</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>RETORNO PREVISTO</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600 }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {saidasFiltradas.map(s => {
                    const statusInfo = getStatusInfo(s.estado);
                    const podeRegistrarSaida = s.estado === 'APROVADO';
                    const podeRegistrarRetorno = s.estado === 'EM_ANDAMENTO';
                    
                    return (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600 }}>{s.estudante_nome}</div>
                          <div style={{ fontSize: 11, color: colors.textMuted }}>ID: #{s.id}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div>{s.estudante_curso || '-'}</div>
                          <div style={{ fontSize: 11, color: colors.textMuted }}>{s.estudante_classe || '-'}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>{s.data_saida_prevista || '-'}</td>
                        <td style={{ padding: '14px 16px' }}>{s.data_volta_prevista || '-'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                            borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusInfo.color + '15',
                            color: statusInfo.color
                          }}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          {s.atrasado && <span style={{ marginLeft: 8, color: colors.danger, fontSize: 11 }}>⚠️ Atraso: {s.tempo_atraso}min</span>}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {podeRegistrarSaida && (
                              <button onClick={() => setModalRegistro({ type: 'saida', pedidoId: s.id })} style={{
                                padding: '6px 12px', background: colors.success, color: '#FFF', border: 'none',
                                borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600
                              }}>✅ Registrar Saída</button>
                            )}
                            {podeRegistrarRetorno && (
                              <button onClick={() => setModalRegistro({ type: 'retorno', pedidoId: s.id })} style={{
                                padding: '6px 12px', background: colors.info, color: '#FFF', border: 'none',
                                borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600
                              }}>🔙 Registrar Retorno</button>
                            )}
                            {!podeRegistrarSaida && !podeRegistrarRetorno && s.estado === 'FINALIZADO' && (
                              <span style={{ fontSize: 11, color: colors.textMuted }}>✓ Concluído</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Registro de Horário */}
      {modalRegistro && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => { setModalRegistro(null); setHoraManual(''); }}>
          <div style={{ background: colors.surface, borderRadius: 16, width: '90%', maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>
              {modalRegistro.type === 'saida' ? '✅ Registrar Saída' : '🔙 Registrar Retorno'}
            </h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Horário (opcional - deixe em branco para usar atual):</label>
              <input type="time" value={horaManual} onChange={e => setHoraManual(e.target.value)} style={{
                width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 8,
                background: colors.surfaceAlt, color: colors.text
              }} />
              <small style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, display: 'block' }}>Formato HH:MM</small>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setModalRegistro(null); setHoraManual(''); }} style={{
                flex: 1, padding: 12, background: colors.surfaceAlt, border: 'none', borderRadius: 8, cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={() => {
                if (modalRegistro.type === 'saida') registrarSaida(modalRegistro.pedidoId);
                else registrarRetorno(modalRegistro.pedidoId);
              }} style={{
                flex: 1, padding: 12, background: modalRegistro.type === 'saida' ? colors.success : colors.info,
                color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer'
              }}>
                {modalRegistro.type === 'saida' ? '✅ Registrar' : '🔙 Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSeguranca;

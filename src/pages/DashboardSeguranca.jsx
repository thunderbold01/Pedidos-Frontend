// src/pages/DashboardSeguranca.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } } from 'react-router-dom';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // -------------------- ESTADOS --------------------
  const [saidasHoje, setSaidasHoje] = useState([]);
  const [stats, setStats] = useState({ total_saidas: 0, em_andamento: 0, finalizados: 0, atrasados: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalRegistro, setModalRegistro] = useState(null); // { tipo, pedidoId, nome }
  const [horaManual, setHoraManual] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(null); // 'diario', 'semanal', 'mensal', 'completo'
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [enviandoRelatorio, setEnviandoRelatorio] = useState(false);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  const navigate = useNavigate();

  // -------------------- TEMA (ESCURO/CLARO) --------------------
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

  const colors = {
    primary: '#2563EB',
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

  // -------------------- RELÓGIO --------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------- CARREGAR DADOS (dashboard + saídas da data) --------------------
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Dashboard (stats gerais do dia)
      const dashRes = await api.get('/seguranca/dashboard/');
      setStats(dashRes.data);

      // 2. Saídas da data selecionada
      const saidasRes = await api.get(`/seguranca/saidas-data/?data=${dataSelecionada}`);
      setSaidasHoje(saidasRes.data.saidas || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.error || err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada]);

  // Carregar notificações
  const carregarNotificacoes = useCallback(async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {
      console.error('Erro notificações:', err);
    }
  }, []);

  // Auto‑refresh a cada 30 segundos
  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    const interval = setInterval(() => {
      carregarDados();
      carregarNotificacoes();
    }, 30000);
    return () => clearInterval(interval);
  }, [carregarDados, carregarNotificacoes]);

  // -------------------- AÇÕES PRINCIPAIS --------------------
  const registrarSaida = async (pedidoId) => {
    if (!confirm('✅ Confirmar SAÍDA do estudante?')) return;
    try {
      const data = horaManual ? { hora_saida: horaManual } : {};
      const res = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, data);
      alert(`✅ Saída registrada às ${res.data.hora || horaManual || 'agora'}`);
      setModalRegistro(null);
      setHoraManual('');
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      alert(`❌ Erro: ${err.response?.data?.error || err.message}`);
    }
  };

  const registrarRetorno = async (pedidoId) => {
    if (!confirm('✅ Confirmar RETORNO do estudante?')) return;
    try {
      const data = horaManual ? { hora_retorno: horaManual } : {};
      const res = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, data);
      let msg = `✅ Retorno registrado às ${res.data.hora || horaManual || 'agora'}`;
      if (res.data.atrasado) msg += ` ⚠️ ATRASO de ${res.data.tempo_atraso} minutos!`;
      alert(msg);
      setModalRegistro(null);
      setHoraManual('');
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      alert(`❌ Erro: ${err.response?.data?.error || err.message}`);
    }
  };

  const enviarRelatorioDia = async () => {
    if (!confirm('📧 Enviar relatório do dia para a DITE?')) return;
    setEnviandoRelatorio(true);
    try {
      await api.post('/seguranca/enviar-relatorio/', { data: dataSelecionada });
      alert('✅ Relatório enviado com sucesso!');
    } catch (err) {
      alert(`❌ Erro ao enviar: ${err.response?.data?.error || err.message}`);
    } finally {
      setEnviandoRelatorio(false);
    }
  };

  const gerarRelatorio = async (tipo) => {
    setGerandoRelatorio(true);
    setModalRelatorio(null);
    try {
      let url = '';
      if (tipo === 'diario') url = `/seguranca/relatorio-diario/?data=${dataSelecionada}`;
      else if (tipo === 'semanal') url = '/seguranca/relatorio-semanal/';
      else if (tipo === 'mensal') url = `/seguranca/relatorio-mensal/?mes=${mesSelecionado}&ano=${anoSelecionado}`;
      else if (tipo === 'completo') url = `/seguranca/relatorio-completo/?data=${dataSelecionada}`;
      else return;

      const res = await api.get(url);
      const texto = res.data.texto || res.data.texto_relatorio || JSON.stringify(res.data, null, 2);
      const blob = new Blob([texto], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_${tipo}_${new Date().toISOString().slice(0,10)}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
      alert('✅ Relatório baixado com sucesso!');
    } catch (err) {
      alert(`❌ Erro ao gerar relatório: ${err.response?.data?.error || err.message}`);
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
  };

  const marcarTodasLidas = async () => {
    try {
      await api.post('/notificacoes/ler-todas/');
      carregarNotificacoes();
    } catch (err) {}
  };

  // -------------------- FILTROS --------------------
  const saidasFiltradas = saidasHoje.filter(s => {
    if (filtroStatus !== 'todos' && s.estado !== filtroStatus) return false;
    if (searchTerm && !s.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusInfo = (estado) => {
    const map = {
      'APROVADO': { label: 'Aguardando Saída', icon: '⏳', color: colors.warning, bg: '#F59E0B15' },
      'EM_ANDAMENTO': { label: 'Em Andamento', icon: '🚶', color: colors.info, bg: '#3B82F615' },
      'FINALIZADO': { label: 'Finalizado', icon: '✅', color: colors.success, bg: '#10B98115' },
    };
    return map[estado] || { label: estado, icon: '📋', color: colors.textMuted, bg: '#64748B15' };
  };

  // -------------------- RENDER --------------------
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .sidebar { position: fixed; left: -280px; z-index: 1000; transition: left 0.3s; }
          .sidebar.open { left: 0; }
          .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; backdrop-filter: blur(2px); }
          .overlay.show { display: block; }
          .main-content { margin-left: 0 !important; width: 100% !important; }
          .table-responsive { overflow-x: auto; }
          table { min-width: 600px; }
        }
      `}</style>

      {/* Overlay mobile */}
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 260, background: colors.surface, borderRight: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0
      }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: colors.primary, borderRadius: 10, display: 'grid', placeItems: 'center', color: '#FFF', fontSize: 18 }}>🔒</div>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>SEGURANÇA</div><div style={{ fontSize: 10, color: colors.primary }}>PORTARIA</div></div>
          </div>
        </div>

        <div style={{ padding: '16px', margin: '8px', background: colors.surfaceAlt, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.primary, display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 600, fontSize: 16 }}>
              {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'S'}
            </div>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{user?.nome || user?.username || 'Segurança'}</div><div style={{ fontSize: 11, color: colors.primary }}>Portaria</div></div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { id: 'todos', label: 'Todos', icon: '📋' },
            { id: 'APROVADO', label: 'Aguardando Saída', icon: '⏳' },
            { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: '🚶' },
            { id: 'FINALIZADO', label: 'Finalizados', icon: '✅' },
          ].map(item => (
            <button key={item.id} onClick={() => setFiltroStatus(item.id)} style={{
              width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8,
              background: filtroStatus === item.id ? colors.primary + '15' : 'transparent',
              color: filtroStatus === item.id ? colors.primary : colors.textMuted,
              fontWeight: filtroStatus === item.id ? 600 : 500, fontSize: 13, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
            }}><span>{item.icon}</span> {item.label}</button>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}` }}>
          <button onClick={() => setThemeMode(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: '10px', background: colors.surfaceAlt, border: `1px solid ${colors.border}`,
            borderRadius: 8, cursor: 'pointer', fontSize: 12, marginBottom: 8,
            display: 'flex', justifyContent: 'space-between'
          }}><span>{isDark ? '☀ Claro' : '🌙 Escuro'}</span><span>{isDark ? '🌞' : '🌛'}</span></button>
          <button onClick={onLogout} style={{
            width: '100%', padding: '10px', background: colors.danger + '15', color: colors.danger,
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600
          }}>🚪 Sair</button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          background: colors.surface, borderBottom: `1px solid ${colors.border}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>☰</button>
            <div><h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Controle de Portaria</h1><p style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{horaAtual}</p></div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.surfaceAlt, padding: '6px 12px', borderRadius: 8 }}>
              <span>📅</span>
              <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', color: colors.text }} />
            </div>
            <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{
              position: 'relative', width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.border}`,
              background: colors.surface, cursor: 'pointer', display: 'grid', placeItems: 'center'
            }}>
              🔔{notificacoesNaoLidas > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: colors.danger, color: '#FFF', borderRadius: '50%', fontSize: 9, display: 'grid', placeItems: 'center' }}>{notificacoesNaoLidas}</span>}
            </button>
          </div>
        </header>

        {/* Dropdown notificações */}
        {showNotifDropdown && (
          <div style={{
            position: 'absolute', top: 70, right: 24, width: 320, background: colors.surface,
            border: `1px solid ${colors.border}`, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 100, maxHeight: 400, overflow: 'auto'
          }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Notificações</span>
              {notificacoesNaoLidas > 0 && <button onClick={marcarTodasLidas} style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 11 }}>Marcar todas como lidas</button>}
            </div>
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

        {/* Conteúdo principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Cards de estatísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>📋</span>
                <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total_saidas || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Autorizados Hoje</div></div>
              </div>
            </div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🚶</span>
                <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.em_andamento || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Em Andamento</div></div>
              </div>
            </div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <div><div style={{ fontSize: 24, fontWeight: 700 }}>{stats.finalizados || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Finalizados</div></div>
              </div>
            </div>
            <div style={{ background: colors.surface, borderRadius: 12, padding: 16, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <div><div style={{ fontSize: 24, fontWeight: 700, color: colors.danger }}>{stats.atrasados || 0}</div><div style={{ fontSize: 11, color: colors.textMuted }}>Atrasos</div></div>
              </div>
            </div>
          </div>

          {/* Barra de busca e ações */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }}>🔍</span>
              <input type="text" placeholder="Buscar estudante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
                width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${colors.border}`,
                borderRadius: 8, background: colors.surface, color: colors.text, outline: 'none'
              }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModalRelatorio('diario')} disabled={gerandoRelatorio} style={{ padding: '10px 16px', background: colors.info, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📄 Relatório Diário</button>
              <button onClick={() => setModalRelatorio('semanal')} disabled={gerandoRelatorio} style={{ padding: '10px 16px', background: colors.info, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📅 Semanal</button>
              <button onClick={() => setModalRelatorio('mensal')} disabled={gerandoRelatorio} style={{ padding: '10px 16px', background: colors.info, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📆 Mensal</button>
              <button onClick={() => setModalRelatorio('completo')} disabled={gerandoRelatorio} style={{ padding: '10px 16px', background: colors.success, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📋 Completo</button>
              <button onClick={enviarRelatorioDia} disabled={enviandoRelatorio} style={{ padding: '10px 16px', background: colors.primary, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📧 Enviar para DITE</button>
            </div>
          </div>

          {/* Tabela de saídas */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p>Carregando...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40, color: colors.danger, background: colors.surface, borderRadius: 12 }}>
              ⚠️ {error}
              <button onClick={carregarDados} style={{ marginLeft: 16, padding: '4px 12px', background: colors.primary, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Tentar novamente</button>
            </div>
          ) : saidasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: 48, opacity: 0.5 }}>📭</span>
              <p style={{ marginTop: 12, color: colors.textMuted }}>Nenhum estudante autorizado nesta data</p>
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
                    const status = getStatusInfo(s.estado);
                    const podeSaida = s.estado === 'APROVADO';
                    const podeRetorno = s.estado === 'EM_ANDAMENTO';
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
                        <td style={{ padding: '14px 16px' }}>{s.hora_saida_prevista || s.data_saida_prevista || '-'}</td>
                        <td style={{ padding: '14px 16px' }}>{s.hora_volta_prevista || s.data_volta_prevista || '-'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: status.bg, color: status.color }}>{status.icon} {status.label}</span>
                          {s.atrasado && <span style={{ marginLeft: 8, color: colors.danger, fontSize: 11 }}>⚠️ Atraso: {s.tempo_atraso}min</span>}
                          {s.hora_saida_real && !s.atrasado && <span style={{ marginLeft: 8, color: colors.success, fontSize: 11 }}>✅ Saiu: {s.hora_saida_real}</span>}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {podeSaida && <button onClick={() => setModalRegistro({ tipo: 'saida', pedidoId: s.id, nome: s.estudante_nome })} style={{ padding: '6px 12px', background: colors.success, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✅ Registrar Saída</button>}
                          {podeRetorno && <button onClick={() => setModalRegistro({ tipo: 'retorno', pedidoId: s.id, nome: s.estudante_nome })} style={{ padding: '6px 12px', background: colors.info, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>🔙 Registrar Retorno</button>}
                          {!podeSaida && !podeRetorno && s.estado === 'FINALIZADO' && <span style={{ fontSize: 11, color: colors.textMuted }}>✓ Concluído</span>}
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

      {/* Modal para registro de horário (saída/retorno) */}
      {modalRegistro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setModalRegistro(null); setHoraManual(''); }}>
          <div style={{ background: colors.surface, borderRadius: 16, width: '90%', maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>{modalRegistro.tipo === 'saida' ? '✅ Registrar Saída' : '🔙 Registrar Retorno'}</h3>
            <p style={{ marginBottom: 16, fontSize: 13, color: colors.textMuted }}>Estudante: <strong>{modalRegistro.nome}</strong></p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Horário (opcional):</label>
              <input type="time" value={horaManual} onChange={e => setHoraManual(e.target.value)} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.surfaceAlt, color: colors.text }} />
              <small style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, display: 'block' }}>Deixe em branco para usar o horário atual</small>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setModalRegistro(null); setHoraManual(''); }} style={{ flex: 1, padding: 12, background: colors.surfaceAlt, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => {
                if (modalRegistro.tipo === 'saida') registrarSaida(modalRegistro.pedidoId);
                else registrarRetorno(modalRegistro.pedidoId);
              }} style={{ flex: 1, padding: 12, background: modalRegistro.tipo === 'saida' ? colors.success : colors.info, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{modalRegistro.tipo === 'saida' ? '✅ Registrar' : '🔙 Registrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para escolher período do relatório mensal */}
      {modalRelatorio === 'mensal' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalRelatorio(null)}>
          <div style={{ background: colors.surface, borderRadius: 16, width: '90%', maxWidth: 350, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>📅 Período do Relatório Mensal</h3>
            <select value={mesSelecionado} onChange={e => setMesSelecionado(parseInt(e.target.value))} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: `1px solid ${colors.border}` }}>
              {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>)}
            </select>
            <input type="number" value={anoSelecionado} onChange={e => setAnoSelecionado(parseInt(e.target.value))} style={{ width: '100%', padding: 10, marginBottom: 20, borderRadius: 8, border: `1px solid ${colors.border}` }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setModalRelatorio(null)} style={{ flex: 1, padding: 10, background: colors.surfaceAlt, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => gerarRelatorio('mensal')} style={{ flex: 1, padding: 10, background: colors.primary, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Baixar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modais para outros tipos de relatório (executam imediatamente) */}
      {modalRelatorio === 'diario' && gerarRelatorio('diario')}
      {modalRelatorio === 'semanal' && gerarRelatorio('semanal')}
      {modalRelatorio === 'completo' && gerarRelatorio('completo')}
    </div>
  );
};

export default DashboardSeguranca;

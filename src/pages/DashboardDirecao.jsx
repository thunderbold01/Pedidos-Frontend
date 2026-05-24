import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ============================================================
// DASHBOARD DITE — PAINEL DA DIREÇÃO
// Com auto-refresh, tema persistente e sem flicker
// ============================================================
const DashboardDITE = ({ user, onLogout }) => {
  // ==================== ESTADOS ====================
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('painel');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroData, setFiltroData] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [modalGerarRel, setModalGerarRel] = useState(false);
  const [relPeriodo, setRelPeriodo] = useState({ inicio: '', fim: '' });
  const [gerando, setGerando] = useState(false);
  const [relatorios, setRelatorios] = useState([]);
  const [horaAtual, setHoraAtual] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  // ==================== THEME COM PERSISTÊNCIA ====================
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('dite-theme');
    if (saved) return saved; // Usa a preferência salva
    // Primeira vez: detecta do sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [themeMode, setThemeMode] = useState(getInitialTheme);

  const isDark = themeMode === 'dark';

  const toggleTheme = useCallback((newMode) => {
    setThemeMode(newMode);
    localStorage.setItem('dite-theme', newMode); // Salva permanentemente
  }, []);

  // ==================== CORES ESTÁVEIS (evita re-render flicker) ====================
  const C = useMemo(() => ({
    gold: '#D4A017',
    goldDark: '#A67C00',
    neonGold: isDark ? 'rgba(212,160,23,0.35)' : 'rgba(212,160,23,0.18)',
    neonGoldSoft: isDark ? 'rgba(212,160,23,0.12)' : 'rgba(212,160,23,0.06)',
    bg: isDark ? '#080808' : '#FEFCF3',
    bgGradient: isDark
      ? 'linear-gradient(180deg, #0C0A09 0%, #080808 40%, #0A0908 100%)'
      : 'linear-gradient(180deg, #FFFBF0 0%, #FEFCF3 40%, #FAF7ED 100%)',
    surface: isDark ? '#111010' : '#FFFFFF',
    surfaceAlt: isDark ? '#1A1919' : '#F9F8F4',
    surfaceHover: isDark ? '#222020' : '#F0EDE5',
    border: isDark ? '#2A2828' : '#E8E4D9',
    borderStrong: isDark ? '#3A3838' : '#D4CFC0',
    text: isDark ? '#F5F2EC' : '#1A1814',
    textMuted: isDark ? '#8A8578' : '#78716C',
    textSoft: isDark ? '#5A564E' : '#A8A29E',
    success: isDark ? '#4ADE80' : '#15803D',
    successNeon: isDark ? 'rgba(74,222,128,0.25)' : 'rgba(21,128,61,0.12)',
    danger: isDark ? '#F87171' : '#DC2626',
    dangerNeon: isDark ? 'rgba(248,113,113,0.25)' : 'rgba(220,38,38,0.12)',
    warning: isDark ? '#FBBF24' : '#D97706',
    warningNeon: isDark ? 'rgba(251,191,36,0.25)' : 'rgba(217,119,6,0.12)',
    info: isDark ? '#60A5FA' : '#2563EB',
    infoNeon: isDark ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.12)',
    shadow: isDark
      ? '0 1px 3px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)'
      : '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
    shadowHover: isDark
      ? '0 4px 12px rgba(0,0,0,0.7), 0 16px 48px rgba(0,0,0,0.5)'
      : '0 4px 12px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)',
    glass: isDark ? 'rgba(17,16,16,0.85)' : 'rgba(255,255,255,0.88)',
    glassBorder: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  }), [isDark]);

  const notifRef = useRef(null);
  const navigate = useNavigate();

  // ==================== RELÓGIO ====================
  useEffect(() => {
    const t = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  // ==================== AUTO-REFRESH (polling + focus) ====================
  useEffect(() => {
    // Polling a cada 30 segundos
    const interval = setInterval(() => {
      carregarDados();
      carregarNotificacoes();
    }, 30000);

    // Refresh quando a aba volta a ficar ativa
    const handleVisibility = () => {
      if (!document.hidden) {
        carregarDados();
        carregarNotificacoes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [filtroEstado, filtroData]); // Recarrega quando filtros mudam

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ==================== API CALLS ====================
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/pedidos/';
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
      if (filtroData) params.append('data_saida', filtroData);
      if (params.toString()) url += `?${params.toString()}`;
      const [pedRes, statsRes] = await Promise.all([api.get(url), api.get('/dashboard/')]);
      setPedidos(pedRes.data.pedidos || []);
      setStats(statsRes.data);
    } catch (err) { console.error('Erro ao carregar dados:', err); }
    finally { setLoading(false); }
  }, [filtroEstado, filtroData]);

  const carregarNotificacoes = useCallback(async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  }, []);

  const carregarRelatorios = useCallback(async () => {
    try { const res = await api.get('/relatorios/'); setRelatorios(res.data.relatorios || []); } catch (err) {}
  }, []);

  // Carregamento inicial
  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    carregarRelatorios();
  }, []);

  const marcarNotificacaoLida = async (id) => {
    try { await api.post(`/notificacoes/${id}/ler/`); carregarNotificacoes(); } catch (err) {}
  };

  const aprovarPedido = async (id) => {
    if (!confirm('Confirmar aprovação deste pedido?')) return;
    try { await api.post(`/pedidos/${id}/aprovar/`); carregarDados(); carregarNotificacoes(); }
    catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Não foi possível aprovar')); }
  };

  const rejeitarPedido = async (id) => {
    const motivo = prompt('Informe o motivo da rejeição:');
    if (!motivo) return;
    try { await api.post(`/pedidos/${id}/rejeitar/`, { comentario: motivo }); carregarDados(); carregarNotificacoes(); }
    catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Não foi possível rejeitar')); }
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      carregarDados(); carregarNotificacoes();
      alert(`Pedido ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro desconhecido';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const motivo = prompt('Motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else { alert(`Erro: ${msg}`); }
    }
  };

  const handleEncaminhar = async (pedidoId) => {
    if (!confirm('Encaminhar este pedido para a Administração?')) return;
    try { await api.post(`/pedidos/${pedidoId}/passar/`); carregarDados(); carregarNotificacoes(); }
    catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar')); }
  };

  const gerarRelatorio = async () => {
    if (!relPeriodo.inicio || !relPeriodo.fim) { alert('Selecione o período do relatório'); return; }
    setGerando(true);
    try {
      await api.post('/relatorios/criar/', {
        titulo: `Relatório DITE - ${new Date().toLocaleDateString('pt-BR')}`,
        tipo: 'PERSONALIZADO', descricao: 'Relatório gerado pela DITE',
        data_inicio: relPeriodo.inicio, data_fim: relPeriodo.fim
      });
      alert('Relatório gerado com sucesso!'); carregarRelatorios();
    } catch (err) { alert('Erro ao gerar relatório: ' + (err.response?.data?.error || err.message)); }
    finally { setGerando(false); setModalGerarRel(false); }
  };

  const baixarRelatorio = async (id) => {
    try {
      const res = await api.get(`/relatorios/download/${id}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `relatorio_${id}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { alert('Erro ao baixar relatório'); }
  };

  const formatarData = (d) => {
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatarDataCompleta = (d) => {
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  // ==================== MEMOIZED DATA ====================
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p =>
      p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm) ||
      p.estudante_curso?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pedidos, searchTerm]);

  const totalAprovados = stats.pedidos_aprovados || 0;
  const totalRejeitados = stats.pedidos_rejeitados || 0;
  const totalPendentes = stats.meus_pedidos_pendentes || 0;
  const totalGeral = stats.total_pedidos || 0;
  const totalAndamento = stats.em_andamento || 0;
  const totalAtrasos = stats.atrasos_hoje || 0;
  const totalFinalizados = stats.finalizados || pedidos.filter(p => p.estado === 'FINALIZADO').length;

  // ==================== SUB-COMPONENTS ====================

  const StatusBadge = ({ estado }) => {
    const config = {
      'APROVADO': { bg: C.successNeon, color: C.success, neon: isDark ? '0 0 6px rgba(74,222,128,0.3)' : 'none' },
      'REJEITADO': { bg: C.dangerNeon, color: C.danger, neon: isDark ? '0 0 6px rgba(248,113,113,0.3)' : 'none' },
      'EM_ANDAMENTO': { bg: C.warningNeon, color: C.warning, neon: isDark ? '0 0 6px rgba(251,191,36,0.3)' : 'none' },
      'FINALIZADO': { bg: `${C.textSoft}15`, color: C.textMuted, neon: 'none' },
      'PENDENTE_DITE': { bg: C.warningNeon, color: C.warning, neon: isDark ? '0 0 6px rgba(251,191,36,0.2)' : 'none' },
      'PENDENTE_DIRECAO': { bg: C.neonGoldSoft, color: C.gold, neon: isDark ? '0 0 6px rgba(212,160,23,0.3)' : 'none' },
      'PENDENTE_ADMIN': { bg: C.infoNeon, color: C.info, neon: isDark ? '0 0 6px rgba(96,165,250,0.3)' : 'none' },
    };
    const s = config[estado] || { bg: C.surfaceAlt, color: C.textMuted, neon: 'none' };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
        borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        background: s.bg, color: s.color, boxShadow: s.neon,
        border: `1px solid ${s.color}20`, textTransform: 'uppercase'
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: `0 0 3px ${s.color}` }} />
        {estado.replace(/_/g, ' ')}
      </span>
    );
  };

  const StatCard = ({ icon, label, value, subtitle, color, neonColor, isGold = false }) => (
    <div style={{
      background: isGold
        ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`
        : C.surface,
      borderRadius: 18, padding: '22px 20px', position: 'relative', overflow: 'hidden',
      boxShadow: isGold ? `0 4px 24px ${C.neonGold}` : C.shadow,
      border: isGold ? 'none' : `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 130, transition: 'all .25s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = isGold ? `0 8px 32px ${C.neonGold}` : C.shadowHover;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = isGold ? `0 4px 24px ${C.neonGold}` : C.shadow;
    }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: isGold
          ? `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`
          : `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: isGold ? 0.6 : 0.4
      }} />

      <div style={{
        position: 'absolute', top: -20, right: -20, width: 100, height: 100,
        background: isGold
          ? 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)'
          : `radial-gradient(circle, ${neonColor} 0%, transparent 70%)`,
        borderRadius: '50%', opacity: 0.6, pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: isGold ? 'rgba(0,0,0,0.15)' : `${neonColor}`,
            display: 'grid', placeItems: 'center', fontSize: 16,
            boxShadow: isGold ? 'none' : `0 0 10px ${neonColor}`
          }}>{icon}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: isGold ? 'rgba(0,0,0,0.5)' : C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>{label}</div>
        </div>
        <div style={{
          fontSize: 36, fontWeight: 900, lineHeight: 1, letterSpacing: -1.5,
          color: isGold ? '#000' : color
        }}>{value}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: isGold ? 'rgba(0,0,0,0.5)' : C.textMuted, marginTop: 8, fontWeight: 500 }}>{subtitle}</div>
        )}
      </div>

      {!isGold && (
        <div style={{ position: 'relative', zIndex: 1, marginTop: 12 }}>
          <div style={{ height: 3, background: C.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${totalGeral > 0 ? Math.min((parseInt(value) / totalGeral) * 100, 100) : 0}%`,
              background: color, borderRadius: 2,
              boxShadow: `0 0 6px ${color}60`,
              transition: 'width 0.6s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  );

  const TabButton = ({ label, count, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: '8px 16px',
      border: `1px solid ${active ? C.gold : C.border}`,
      borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500,
      background: active ? C.neonGoldSoft : 'transparent',
      color: active ? C.gold : C.textMuted,
      fontFamily: 'inherit', letterSpacing: 0.3,
      transition: 'all .2s ease',
      boxShadow: active && isDark ? `0 0 10px ${C.neonGold}` : 'none'
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.surfaceAlt; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {label} {count !== undefined && count > 0 && <span style={{ opacity: 0.7, marginLeft: 2 }}>({count})</span>}
    </button>
  );

  // ==================== RENDER ====================
  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: C.bgGradient,
      color: C.text,
      fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
      transition: 'background .3s ease, color .3s ease'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg};-webkit-font-smoothing:antialiased}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInScale{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ds-fade{animation:fadeIn .35s cubic-bezier(.4,0,.2,1) both}
        .ds-fade-scale{animation:fadeInScale .3s cubic-bezier(.4,0,.2,1) both}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        input,select,button{font-family:inherit}

        @media(max-width:1024px){.ds-stats-grid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:768px){
          .ds-sidebar{position:fixed!important;left:-300px!important;top:0!important;bottom:0!important;z-index:1000!important;transition:left .35s cubic-bezier(.4,0,.2,1)!important;width:280px!important;}
          .ds-sidebar.open{left:0!important;}
          .ds-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;backdrop-filter:blur(6px);}
          .ds-overlay.show{display:block;animation:fadeIn .2s ease;}
          .ds-toggle{display:grid!important;}
          .ds-main{margin-left:0!important;}
          .ds-content{padding:16px!important;}
          .ds-header{padding:12px 16px!important;}
          .ds-stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
          .ds-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .ds-table{min-width:640px;}
          .ds-toolbar{flex-direction:column!important;}
          .ds-toolbar>input{min-width:100%!important;}
          .ds-tabs{overflow-x:auto;flex-wrap:nowrap!important;padding-bottom:4px;}
          .ds-tabs button{white-space:nowrap;flex-shrink:0;}
        }
        @media(max-width:480px){.ds-stats-grid{grid-template-columns:1fr!important;}}
      `}</style>

      {/* OVERLAY MOBILE */}
      <div className={`ds-overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`ds-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: 260, background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh',
        position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
        overflowY: 'auto', transition: 'all .3s ease'
      }}>
        <div style={{ padding: '28px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
            <div style={{
              position: 'absolute', bottom: -1, left: 20, right: 20, height: 1,
              background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.4,
              boxShadow: isDark ? `0 0 6px ${C.neonGold}` : 'none'
            }} />
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
              display: 'grid', placeItems: 'center', color: '#000', fontWeight: 900, fontSize: 18,
              boxShadow: isDark ? `0 4px 16px ${C.neonGold}` : `0 4px 12px rgba(212,160,23,0.2)`
            }}>D</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>DITE</div>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>Direção</div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ margin: '0 14px 16px', padding: 14, background: C.neonGoldSoft, borderRadius: 14, border: `1px solid ${C.gold}15`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            display: 'grid', placeItems: 'center', color: '#000', fontWeight: 800, fontSize: 16, flexShrink: 0
          }}>
            {(user?.nome || user?.username || 'D').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nome || user?.username || 'Usuário'}</div>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold, boxShadow: `0 0 4px ${C.gold}`, animation: 'pulse 2s infinite' }} />
              Online
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 10px', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.textSoft, letterSpacing: 2, padding: '0 12px 12px', textTransform: 'uppercase' }}>Navegação</div>
          {[
            { id: 'painel', icon: '◈', label: 'Painel Geral', filter: 'todos' },
            { id: 'pendentes', icon: '◷', label: 'Pendentes', filter: 'PENDENTE_DIRECAO' },
            { id: 'aprovados', icon: '✓', label: 'Aprovados', filter: 'APROVADO' },
            { id: 'rejeitados', icon: '✕', label: 'Rejeitados', filter: 'REJEITADO' },
            { id: 'andamento', icon: '→', label: 'Em Andamento', filter: 'EM_ANDAMENTO' },
            { id: 'finalizados', icon: '▣', label: 'Finalizados', filter: 'FINALIZADO' },
          ].map(item => {
            const isActive = abaAtiva === 'painel' && filtroEstado === item.filter;
            return (
              <button key={item.id} onClick={() => { setAbaAtiva('painel'); setFiltroEstado(item.filter); setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '11px 14px', border: 'none',
                background: isActive ? C.neonGoldSoft : 'transparent',
                color: isActive ? C.gold : C.textMuted,
                fontWeight: isActive ? 700 : 500, fontSize: 13, borderRadius: 10,
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 2, fontFamily: 'inherit', transition: 'all .2s ease'
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.text; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; } }}
              >
                <span style={{ fontSize: 14, width: 22, textAlign: 'center', opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.gold, boxShadow: `0 0 3px ${C.gold}` }} />}
              </button>
            );
          })}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '16px 12px' }} />

          <div style={{ fontSize: 9, fontWeight: 800, color: C.textSoft, letterSpacing: 2, padding: '12px 12px 10px', textTransform: 'uppercase' }}>Sistema</div>
          <button onClick={() => { setAbaAtiva('relatorios'); setMobileMenuOpen(false); }} style={{
            width: '100%', padding: '11px 14px', border: 'none',
            background: abaAtiva === 'relatorios' ? C.neonGoldSoft : 'transparent',
            color: abaAtiva === 'relatorios' ? C.gold : C.textMuted,
            fontWeight: abaAtiva === 'relatorios' ? 700 : 500, fontSize: 13, borderRadius: 10,
            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 2, fontFamily: 'inherit', transition: 'all .2s ease'
          }}
          onMouseEnter={(e) => { if (abaAtiva !== 'relatorios') { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.text; } }}
          onMouseLeave={(e) => { if (abaAtiva !== 'relatorios') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; } }}
          >
            <span style={{ fontSize: 14, width: 22, textAlign: 'center', opacity: abaAtiva === 'relatorios' ? 1 : 0.5 }}>▥</span>
            <span style={{ flex: 1 }}>Relatórios</span>
          </button>
        </nav>

        {/* Theme Toggle */}
        <div style={{ padding: '0 14px' }}>
          <button onClick={() => toggleTheme(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: '12px 14px', background: C.surfaceAlt,
            border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: C.text, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            transition: 'all .2s ease', marginBottom: 8
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{isDark ? '☀' : '☾'}</span>
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 11,
              background: isDark ? C.gold : C.borderStrong,
              position: 'relative', transition: 'background .3s ease',
              boxShadow: isDark ? `0 0 6px ${C.neonGold}` : 'none'
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: isDark ? '#000' : '#fff',
                position: 'absolute', top: 3,
                left: isDark ? 21 : 3,
                transition: 'left .3s cubic-bezier(.4,0,.2,1)',
                boxShadow: '0 1px 3px rgba(0,0,0,.3)'
              }} />
            </div>
          </button>
        </div>

        {/* Logout */}
        <div style={{ padding: '10px 14px 20px' }}>
          <button onClick={onLogout} style={{
            width: '100%', padding: '12px 14px',
            background: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.05)',
            border: `1px solid ${isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)'}`,
            borderRadius: 10, color: C.danger, cursor: 'pointer', fontWeight: 700,
            fontSize: 12, display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'inherit', transition: 'all .2s ease'
          }}>
            <span style={{ fontSize: 14 }}>↗</span> Encerrar sessão
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <main className="ds-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="ds-header" style={{
          background: C.glass, borderBottom: `1px solid ${C.glassBorder}`,
          padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', transition: 'all .3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setMobileMenuOpen(true)} className="ds-toggle" style={{
              display: 'none', width: 38, height: 38, background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center', color: C.text, fontSize: 16
            }}>☰</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>
                {abaAtiva === 'painel' ? 'Painel da Direção' : 'Relatórios'}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: C.gold, fontWeight: 600 }}>{horaAtual}</span>
                <span style={{ opacity: 0.3 }}>·</span>
                {formatarDataCompleta(filtroData)}
                <span style={{ opacity: 0.3 }}>·</span>
                <span style={{ color: C.textSoft, fontSize: 10 }}>Auto-sync ativo</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <span style={{ fontSize: 13, opacity: .5 }}>◉</span>
              <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} style={{
                border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, color: C.text, fontFamily: 'inherit', outline: 'none', cursor: 'pointer'
              }} />
            </div>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifDropdown(s => !s)} style={{
                width: 38, height: 38, borderRadius: 10, background: C.surfaceAlt,
                border: `1px solid ${C.border}`, cursor: 'pointer', display: 'grid',
                placeItems: 'center', color: C.text, position: 'relative', fontSize: 14
              }}>
                ◉
                {notificacoesNaoLidas > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, padding: '0 5px',
                    background: C.gold, color: '#000', borderRadius: 9, fontSize: 9, fontWeight: 800,
                    display: 'grid', placeItems: 'center', border: `2px solid ${isDark ? '#080808' : '#FEFCF3'}`,
                    boxShadow: `0 0 6px ${C.neonGold}`, animation: 'pulse 2s infinite'
                  }}>{notificacoesNaoLidas}</span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="ds-fade-scale" style={{
                  position: 'absolute', right: 0, top: 46, width: 340,
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
                  boxShadow: isDark ? `0 16px 48px rgba(0,0,0,.6), 0 0 12px ${C.neonGoldSoft}` : '0 16px 48px rgba(0,0,0,.12)',
                  zIndex: 50, maxHeight: 420, overflowY: 'auto', overflow: 'hidden'
                }}>
                  <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 12, color: C.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceAlt }}>
                    Notificações
                    {notificacoesNaoLidas > 0 && <span style={{ background: C.gold, color: '#000', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800 }}>{notificacoesNaoLidas}</span>}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notificacoes.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Nenhuma notificação</div>
                      : notificacoes.map(n => (
                        <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{
                          padding: 14, borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                          background: n.lida ? 'transparent' : C.neonGoldSoft,
                          borderLeft: n.lida ? '3px solid transparent' : `3px solid ${C.gold}`
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{n.mensagem}</div>
                          {n.data && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{n.data}</div>}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="ds-content" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, flex: 1, overflowY: 'auto' }}>

          {abaAtiva === 'painel' && (
            <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* STATS */}
              <div className="ds-stats-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard icon="◷" label="Pendentes" value={totalPendentes} subtitle="Aguardando análise" color={C.gold} neonColor={C.neonGold} />
                <StatCard icon="✓" label="Aprovados" value={totalAprovados} subtitle="Autorizados" color={C.success} neonColor={C.successNeon} />
                <StatCard icon="✕" label="Rejeitados" value={totalRejeitados} subtitle="Negados" color={C.danger} neonColor={C.dangerNeon} />
                <StatCard icon="◈" label="Total Geral" value={totalGeral} subtitle="Pedidos no sistema" color="#000" neonColor={C.neonGold} isGold />
              </div>

              {/* SECONDARY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Em Andamento', value: totalAndamento, color: C.warning, neon: C.warningNeon },
                  { label: 'Finalizados', value: totalFinalizados, color: C.textMuted, neon: `${C.textSoft}20` },
                  { label: 'Atrasos Hoje', value: totalAtrasos, color: C.danger, neon: C.dangerNeon },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                    padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: C.shadow, transition: 'all .25s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = isDark ? `0 4px 20px rgba(0,0,0,.5), 0 0 10px ${item.neon}` : '0 4px 20px rgba(0,0,0,.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; }}
                  >
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{item.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginTop: 4, letterSpacing: -.5 }}>{item.value}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
                  </div>
                ))}
              </div>

              {/* TOOLBAR */}
              <div className="ds-toolbar" style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16,
                boxShadow: C.shadow, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'
              }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, fontSize: 13, pointerEvents: 'none' }}>⌕</span>
                  <input type="text" placeholder="Buscar estudante, curso ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
                    width: '100%', padding: '11px 14px 11px 38px', background: C.surfaceAlt,
                    border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none', transition: 'all .2s ease'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = isDark ? `0 0 10px ${C.neonGold}` : '0 0 0 3px rgba(212,160,23,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{
                  padding: '11px 14px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600
                }}>
                  <option value="todos">Todos os estados</option>
                  <option value="PENDENTE_DIRECAO">Pendentes</option>
                  <option value="APROVADO">Aprovados</option>
                  <option value="REJEITADO">Rejeitados</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="FINALIZADO">Finalizados</option>
                </select>
                <button onClick={() => setModalGerarRel(true)} style={{
                  padding: '11px 20px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                  color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                  fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: isDark ? `0 4px 16px ${C.neonGold}` : '0 4px 12px rgba(212,160,23,0.2)'
                }}>
                  <span style={{ fontSize: 13 }}>▥</span> Gerar Relatório
                </button>
              </div>

              {/* TABS */}
              <div className="ds-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <TabButton label="Todos" count={totalGeral} active={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')} />
                <TabButton label="Pendentes" count={totalPendentes} active={filtroEstado === 'PENDENTE_DIRECAO'} onClick={() => setFiltroEstado('PENDENTE_DIRECAO')} />
                <TabButton label="Aprovados" count={totalAprovados} active={filtroEstado === 'APROVADO'} onClick={() => setFiltroEstado('APROVADO')} />
                <TabButton label="Rejeitados" count={totalRejeitados} active={filtroEstado === 'REJEITADO'} onClick={() => setFiltroEstado('REJEITADO')} />
                <TabButton label="Em Andamento" count={totalAndamento} active={filtroEstado === 'EM_ANDAMENTO'} onClick={() => setFiltroEstado('EM_ANDAMENTO')} />
                <TabButton label="Finalizados" count={totalFinalizados} active={filtroEstado === 'FINALIZADO'} onClick={() => setFiltroEstado('FINALIZADO')} />
              </div>

              {/* TABLE */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                  <div style={{
                    width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.gold,
                    borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite'
                  }} />
                  <div style={{ color: C.textMuted, fontSize: 12, fontWeight: 500 }}>Carregando pedidos...</div>
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, color: C.textMuted, border: `1px dashed ${C.borderStrong}`, borderRadius: 16, background: C.surface }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: .15, color: C.gold }}>◈</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nenhum pedido encontrado</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>Tente ajustar os filtros ou a busca</div>
                </div>
              ) : (
                <div className="ds-table-wrap" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow }}>
                  <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                        {['ID', 'ESTUDANTE', 'CURSO / CLASSE', 'TIPO', 'DATA SAÍDA', 'STATUS', 'AÇÕES'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, color: C.textMuted, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((pedido, idx) => (
                        <tr key={pedido.id} style={{
                          borderBottom: `1px solid ${C.border}`,
                          background: hoveredRow === pedido.id ? C.neonGoldSoft : (idx % 2 === 0 ? 'transparent' : C.surfaceAlt + '40'),
                          transition: 'background .15s ease'
                        }}
                        onMouseEnter={() => setHoveredRow(pedido.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: C.gold }}>#{pedido.id}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: C.text }}>{pedido.estudante_nome}</div>
                            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{pedido.estudante_email || '-'}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ color: C.text, fontWeight: 500 }}>{pedido.estudante_curso || '-'}</div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>{pedido.estudante_classe || '-'}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ display: 'inline-block', padding: '4px 10px', background: C.surfaceAlt, borderRadius: 6, fontSize: 10, fontWeight: 600, color: C.text, border: `1px solid ${C.border}` }}>{pedido.tipo_display}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ color: C.text, fontWeight: 500 }}>{pedido.data_saida}</div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>{pedido.hora_saida}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}><StatusBadge estado={pedido.estado} /></td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button onClick={() => setModalDetalhes(pedido)} style={{
                                width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
                                background: 'transparent', cursor: 'pointer', color: C.textMuted, fontSize: 11,
                                display: 'grid', placeItems: 'center', transition: 'all .15s'
                              }} title="Ver detalhes">◈</button>
                              {pedido.acoes_disponiveis?.includes('aprovar') && (
                                <button onClick={() => aprovarPedido(pedido.id)} style={{
                                  width: 30, height: 30, borderRadius: 8, border: 'none',
                                  background: C.success, color: '#fff', cursor: 'pointer', fontSize: 11,
                                  display: 'grid', placeItems: 'center', fontWeight: 800,
                                  boxShadow: isDark ? `0 0 6px ${C.successNeon}` : 'none'
                                }} title="Aprovar">✓</button>
                              )}
                              {pedido.acoes_disponiveis?.includes('rejeitar') && (
                                <button onClick={() => rejeitarPedido(pedido.id)} style={{
                                  width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.danger}25`,
                                  background: `${C.danger}08`, color: C.danger, cursor: 'pointer', fontSize: 11,
                                  display: 'grid', placeItems: 'center',
                                  boxShadow: isDark ? `0 0 6px ${C.dangerNeon}` : 'none'
                                }} title="Rejeitar">✕</button>
                              )}
                              {pedido.estado === 'PENDENTE_DIRECAO' && (
                                <button onClick={() => handleEncaminhar(pedido.id)} style={{
                                  width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.gold}25`,
                                  background: C.neonGoldSoft, color: C.gold, cursor: 'pointer', fontSize: 11,
                                  display: 'grid', placeItems: 'center',
                                  boxShadow: isDark ? `0 0 6px ${C.neonGoldSoft}` : 'none'
                                }} title="Encaminhar">→</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RELATÓRIOS */}
          {abaAtiva === 'relatorios' && (
            <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: -.3 }}>Relatórios Gerados</div>
                <button onClick={() => setModalGerarRel(true)} style={{
                  padding: '10px 18px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                  color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                  fontSize: 11, fontFamily: 'inherit', boxShadow: isDark ? `0 4px 16px ${C.neonGold}` : '0 4px 12px rgba(212,160,23,0.2)'
                }}>+ Novo Relatório</button>
              </div>

              {relatorios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, color: C.textMuted, border: `1px dashed ${C.borderStrong}`, borderRadius: 16, background: C.surface }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: .15, color: C.gold }}>▥</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nenhum relatório gerado</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>Clique em "Novo Relatório" para criar o primeiro</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {relatorios.map(r => (
                    <div key={r.id} style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                      padding: 20, boxShadow: C.shadow, display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer', transition: 'all .25s ease', flexWrap: 'wrap', gap: 12
                    }}
                    onClick={() => baixarRelatorio(r.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = isDark ? `0 8px 40px rgba(0,0,0,.5), 0 0 12px ${C.neonGoldSoft}` : '0 8px 40px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = `${C.gold}30`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.borderColor = C.border; }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.titulo}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Criado em {r.created_at} · Por: {r.criado_por}</div>
                      </div>
                      <div style={{ padding: '8px 16px', background: C.neonGoldSoft, border: `1px solid ${C.gold}20`, borderRadius: 8, color: C.gold, fontSize: 11, fontWeight: 700, boxShadow: isDark ? `0 0 6px ${C.neonGoldSoft}` : 'none' }}>BAIXAR CSV →</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ==================== MODAL DETALHES ==================== */}
      {modalDetalhes && (
        <div onClick={() => setModalDetalhes(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} className="ds-fade-scale" style={{
            background: C.surface, borderRadius: 20, width: '100%', maxWidth: 540,
            border: `1px solid ${C.border}`,
            boxShadow: isDark ? `0 24px 80px rgba(0,0,0,.5), 0 0 20px ${C.neonGoldSoft}` : '0 24px 80px rgba(0,0,0,.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: -1, left: 24, right: 24, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: .3 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Pedido #{modalDetalhes.id}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>{modalDetalhes.estudante_nome}</div>
              </div>
              <button onClick={() => setModalDetalhes(null)} style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                background: 'transparent', cursor: 'pointer', color: C.textMuted, fontSize: 14,
                display: 'grid', placeItems: 'center'
              }}>✕</button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Curso', value: modalDetalhes.estudante_curso || '-' },
                { label: 'Classe', value: modalDetalhes.estudante_classe || '-' },
                { label: 'Email', value: modalDetalhes.estudante_email || '-' },
                { label: 'Tipo de Saída', value: modalDetalhes.tipo_display },
                { label: 'Data de Saída', value: modalDetalhes.data_saida },
                { label: 'Hora de Saída', value: modalDetalhes.hora_saida },
                { label: 'Retorno Previsto', value: modalDetalhes.hora_volta_prevista || '-' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0', borderBottom: i < 6 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}

              <div style={{ padding: '14px 0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Status</div>
                <StatusBadge estado={modalDetalhes.estado} />
              </div>

              {modalDetalhes.justificativa && (
                <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginTop: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Justificativa</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{modalDetalhes.justificativa}</div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {modalDetalhes.acoes_disponiveis?.includes('aprovar') && (
                <button onClick={() => { aprovarPedido(modalDetalhes.id); setModalDetalhes(null); }} style={{
                  flex: 1, padding: '12px 16px', background: C.success, color: '#fff', border: 'none',
                  borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                  boxShadow: isDark ? `0 0 10px ${C.successNeon}` : 'none'
                }}>Aprovar</button>
              )}
              {modalDetalhes.acoes_disponiveis?.includes('rejeitar') && (
                <button onClick={() => { rejeitarPedido(modalDetalhes.id); setModalDetalhes(null); }} style={{
                  flex: 1, padding: '12px 16px', background: `${C.danger}10`, color: C.danger,
                  border: `1px solid ${C.danger}25`, borderRadius: 10, cursor: 'pointer',
                  fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                  boxShadow: isDark ? `0 0 10px ${C.dangerNeon}` : 'none'
                }}>Rejeitar</button>
              )}
              {modalDetalhes.estado === 'PENDENTE_DIRECAO' && (
                <button onClick={() => { handleEncaminhar(modalDetalhes.id); setModalDetalhes(null); }} style={{
                  flex: 1, padding: '12px 16px', background: C.neonGoldSoft, color: C.gold,
                  border: `1px solid ${C.gold}25`, borderRadius: 10, cursor: 'pointer',
                  fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                  boxShadow: isDark ? `0 0 10px ${C.neonGoldSoft}` : 'none'
                }}>Encaminhar</button>
              )}
              {!modalDetalhes.acoes_disponiveis?.includes('aprovar') && !modalDetalhes.acoes_disponiveis?.includes('rejeitar') && modalDetalhes.estado !== 'PENDENTE_DIRECAO' && (
                <button onClick={() => setModalDetalhes(null)} style={{
                  flex: 1, padding: '12px 16px', background: C.surfaceAlt, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer',
                  fontWeight: 600, fontSize: 12, fontFamily: 'inherit'
                }}>Fechar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL GERAR RELATÓRIO ==================== */}
      {modalGerarRel && (
        <div onClick={() => setModalGerarRel(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} className="ds-fade-scale" style={{
            background: C.surface, borderRadius: 20, width: '100%', maxWidth: 440,
            border: `1px solid ${C.border}`,
            boxShadow: isDark ? `0 24px 80px rgba(0,0,0,.5), 0 0 20px ${C.neonGoldSoft}` : '0 24px 80px rgba(0,0,0,.2)',
            padding: 28
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: -.3 }}>
              <span style={{ color: C.gold }}>▥</span> Gerar Relatório
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 24 }}>Selecione o período para gerar o relatório completo.</div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Data Início</label>
              <input type="date" value={relPeriodo.inicio} onChange={(e) => setRelPeriodo({ ...relPeriodo, inicio: e.target.value })} style={{
                width: '100%', padding: 14, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none', transition: 'all .2s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = isDark ? `0 0 10px ${C.neonGold}` : '0 0 0 3px rgba(212,160,23,0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Data Fim</label>
              <input type="date" value={relPeriodo.fim} onChange={(e) => setRelPeriodo({ ...relPeriodo, fim: e.target.value })} style={{
                width: '100%', padding: 14, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none', transition: 'all .2s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = isDark ? `0 0 10px ${C.neonGold}` : '0 0 0 3px rgba(212,160,23,0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalGerarRel(false)} style={{
                flex: 1, padding: '12px 16px', background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit'
              }}>Cancelar</button>
              <button onClick={gerarRelatorio} disabled={gerando} style={{
                flex: 1, padding: '12px 16px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                fontSize: 12, fontFamily: 'inherit', boxShadow: isDark ? `0 4px 16px ${C.neonGold}` : '0 4px 12px rgba(212,160,23,0.2)',
                opacity: gerando ? 0.6 : 1
              }}>{gerando ? 'Gerando...' : 'Gerar Relatório'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDITE;

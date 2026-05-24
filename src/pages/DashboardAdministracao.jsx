import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ============================================================
// DASHBOARD ADMINISTRACAO — Painel Administrativo
// Tema dourado com toques vermelhos, modo escuro/claro,
// auto-refresh, design premium sem emojis coloridos
// ============================================================
const DashboardAdministracao = ({ user, onLogout }) => {
  // ==================== ESTADOS ====================
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [coletivas, setColetivas] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DIRECAO');
  const [filtroData, setFiltroData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState({ data_inicio: '', data_fim: '' });
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [dadosAprovacao, setDadosAprovacao] = useState({
    data_saida: '', hora_saida: '07:00', data_volta: '', hora_volta: '19:00'
  });
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const navigate = useNavigate();
  const notifRef = useRef(null);

  // ==================== THEME ENGINE COM PERSISTENCIA ====================
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('admin-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const isDark = themeMode === 'dark';

  const toggleTheme = useCallback((newMode) => {
    setThemeMode(newMode);
    localStorage.setItem('admin-theme', newMode);
  }, []);

  // ==================== DESIGN TOKENS ====================
  const C = useMemo(() => ({
    gold: '#D4A017',
    goldLight: '#F0D060',
    goldDark: '#A67C00',
    goldSoft: isDark ? 'rgba(212,160,23,0.12)' : 'rgba(212,160,23,0.06)',
    goldGlow: isDark ? '0 0 16px rgba(212,160,23,0.2)' : '0 0 8px rgba(212,160,23,0.1)',
    red: isDark ? '#F87171' : '#DC2626',
    redSoft: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.06)',
    redGlow: isDark ? '0 0 16px rgba(248,113,113,0.15)' : '0 0 8px rgba(220,38,38,0.08)',
    green: isDark ? '#4ADE80' : '#15803D',
    greenSoft: isDark ? 'rgba(74,222,128,0.12)' : 'rgba(21,128,61,0.06)',
    bg: isDark ? '#0A0908' : '#FFFBF5',
    bgGradient: isDark
      ? 'linear-gradient(180deg, #0F0D0B 0%, #0A0908 50%, #0C0B09 100%)'
      : 'linear-gradient(180deg, #FFFBF5 0%, #FAF6ED 50%, #F8F3E8 100%)',
    surface: isDark ? '#141210' : '#FFFFFF',
    surfaceAlt: isDark ? '#1E1B18' : '#F9F7F2',
    surfaceHover: isDark ? '#282522' : '#F0EDE5',
    border: isDark ? '#2A2622' : '#E8E2D8',
    borderStrong: isDark ? '#3A3530' : '#D4CFC4',
    text: isDark ? '#F5F2ED' : '#1A1814',
    textMuted: isDark ? '#8A8278' : '#78716C',
    textSoft: isDark ? '#5A564E' : '#A8A29E',
    shadow: isDark
      ? '0 1px 3px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)'
      : '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)',
    shadowHover: isDark
      ? '0 4px 12px rgba(0,0,0,0.7), 0 16px 40px rgba(0,0,0,0.5)'
      : '0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.06)',
    glass: isDark ? 'rgba(20,18,16,0.9)' : 'rgba(255,255,255,0.9)',
    glassBorder: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  }), [isDark]);

  // ==================== RELOGIO ====================
  useEffect(() => {
    const t = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // ==================== AUTO-REFRESH ====================
  useEffect(() => {
    const interval = setInterval(() => {
      carregarDados();
      carregarNotificacoes();
    }, 30000);

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
  }, [filtroEstado, filtroData]);

  // ==================== FECHAR DROPDOWN AO CLICAR FORA ====================
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
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) { console.error('Erro:', err); }
    finally { setLoading(false); }
  }, [filtroEstado, filtroData]);

  const carregarColetivas = useCallback(async () => {
    try { const res = await api.get('/coletivas/listar/'); setColetivas(res.data.coletivas || []); } catch (err) {}
  }, []);

  const carregarRelatorios = useCallback(async () => {
    try { const res = await api.get('/relatorios/'); setRelatorios(res.data.relatorios || []); } catch (err) {}
  }, []);

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
    carregarColetivas();
    carregarRelatorios();
  }, []);

  const marcarNotificacaoLida = async (id) => {
    try { await api.post(`/notificacoes/${id}/ler/`); carregarNotificacoes(); } catch (err) {}
  };

  const abrirModalAprovacao = (pedidoId) => {
    const hoje = new Date().toISOString().split('T')[0];
    setDadosAprovacao({ data_saida: hoje, hora_saida: '07:00', data_volta: hoje, hora_volta: '19:00' });
    setModalAprovacao(pedidoId);
  };

  const confirmarAprovacao = async () => {
    try {
      await api.post(`/pedidos/${modalAprovacao}/aprovar/`, {
        data_saida: dadosAprovacao.data_saida, hora_saida: dadosAprovacao.hora_saida,
        data_volta: dadosAprovacao.data_volta, hora_volta: dadosAprovacao.hora_volta
      });
      alert('Pedido aprovado com sucesso!');
      setModalAprovacao(null);
      carregarDados(); carregarNotificacoes();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || err.message)); }
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      if (acao === 'aprovar') { abrirModalAprovacao(pedidoId); return; }
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      carregarDados(); carregarNotificacoes();
      alert(`Pedido ${acao === 'rejeitar' ? 'rejeitado' : 'encaminhado'} com sucesso!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const motivo = prompt('Motivo da rejeicao:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else { alert(`Erro: ${msg}`); }
    }
  };

  const handleEncaminhar = async (pedidoId) => {
    if (!confirm('Encaminhar este pedido para a Direcao?')) return;
    try {
      await api.post(`/pedidos/${pedidoId}/passar/`);
      carregarDados(); carregarNotificacoes();
      alert('Pedido encaminhado para a Direcao!');
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const gerarRelatorio = async () => {
    if (!dadosRelatorio.data_inicio || !dadosRelatorio.data_fim) { alert('Selecione o periodo'); return; }
    setGerandoRelatorio(true);
    try {
      await api.post('/relatorios/criar/', {
        titulo: `Relatorio Administracao - ${new Date().toLocaleDateString('pt-BR')}`,
        tipo: 'PERSONALIZADO', descricao: 'Relatorio gerado pela Administracao',
        data_inicio: dadosRelatorio.data_inicio, data_fim: dadosRelatorio.data_fim
      });
      alert('Relatorio gerado com sucesso!');
      carregarRelatorios(); setModalRelatorio(false);
      setDadosRelatorio({ data_inicio: '', data_fim: '' });
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || err.message)); }
    finally { setGerandoRelatorio(false); }
  };

  const baixarRelatorio = async (id) => {
    try {
      const res = await api.get(`/relatorios/download/${id}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `relatorio_${id}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { alert('Erro ao baixar'); }
  };

  // ==================== HELPERS ====================
  const formatarData = (d) => {
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p =>
      p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm)
    );
  }, [pedidos, searchTerm]);

  const totalAprovados = stats.pedidos_aprovados || 0;
  const totalRejeitados = stats.pedidos_rejeitados || 0;
  const totalPendentes = stats.meus_pedidos_pendentes || 0;
  const totalGeral = stats.total_pedidos || 0;
  const totalAndamento = stats.em_andamento || 0;
  const totalFinalizados = stats.finalizados || pedidos.filter(p => p.estado === 'FINALIZADO').length;

  // ==================== SUB-COMPONENTS ====================

  const StatusBadge = ({ estado }) => {
    const config = {
      'APROVADO': { bg: C.greenSoft, color: C.green, border: C.green + '20' },
      'REJEITADO': { bg: C.redSoft, color: C.red, border: C.red + '20' },
      'EM_ANDAMENTO': { bg: C.goldSoft, color: C.gold, border: C.gold + '20' },
      'FINALIZADO': { bg: `${C.textSoft}12`, color: C.textMuted, border: `${C.textSoft}15` },
      'PENDENTE_DITE': { bg: C.goldSoft, color: C.gold, border: C.gold + '20' },
      'PENDENTE_DIRECAO': { bg: C.goldSoft, color: C.gold, border: C.gold + '20' },
      'PENDENTE_ADMIN': { bg: C.goldSoft, color: C.gold, border: C.gold + '20' },
    };
    const s = config[estado] || { bg: C.surfaceAlt, color: C.textMuted, border: C.border };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
        borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'uppercase'
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
        {estado.replace(/_/g, ' ')}
      </span>
    );
  };

  const StatCard = ({ icon, label, value, subtitle, color, isAccent = false }) => (
    <div style={{
      background: isAccent ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})` : C.surface,
      borderRadius: 16, padding: '20px 18px', position: 'relative', overflow: 'hidden',
      boxShadow: isAccent ? C.goldGlow : C.shadow,
      border: isAccent ? 'none' : `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 115, transition: 'transform .2s ease, box-shadow .2s ease'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isAccent ? C.goldGlow : C.shadowHover; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isAccent ? C.goldGlow : C.shadow; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: isAccent ? 'rgba(255,255,255,0.25)' : `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: isAccent ? 0.5 : 0.4 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: isAccent ? 'rgba(0,0,0,0.12)' : `${color}15`,
            display: 'grid', placeItems: 'center', fontSize: 15, color: isAccent ? '#000' : color
          }}>{icon}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: isAccent ? 'rgba(0,0,0,0.5)' : C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: -1, color: isAccent ? '#000' : color }}>{value}</div>
        {subtitle && <div style={{ fontSize: 11, color: isAccent ? 'rgba(0,0,0,0.45)' : C.textMuted, marginTop: 6, fontWeight: 500 }}>{subtitle}</div>}
      </div>
      {!isAccent && (
        <div style={{ position: 'relative', marginTop: 10 }}>
          <div style={{ height: 3, background: C.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalGeral > 0 ? Math.min((parseInt(value) / totalGeral) * 100, 100) : 0}%`, background: color, borderRadius: 2, transition: 'width .5s ease' }} />
          </div>
        </div>
      )}
    </div>
  );

  const TabButton = ({ label, count, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: '8px 16px', border: `1px solid ${active ? C.gold : C.border}`,
      borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500,
      background: active ? C.goldSoft : 'transparent', color: active ? C.gold : C.textMuted,
      fontFamily: 'inherit', letterSpacing: 0.3, transition: 'all .2s ease'
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.surfaceAlt; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >{label} {count !== undefined && count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}</button>
  );

  // ==================== RENDER ====================
  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: C.bgGradient, color: C.text,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
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
          .ds-tabs{overflow-x:auto;flex-wrap:nowrap!important;padding-bottom:4px;}
          .ds-tabs button{white-space:nowrap;flex-shrink:0;}
        }
        @media(max-width:480px){.ds-stats-grid{grid-template-columns:1fr!important;}}
      `}</style>

      {/* OVERLAY MOBILE */}
      <div className={`ds-overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`ds-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: 260, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
        zIndex: 10, flexShrink: 0, overflowY: 'auto', transition: 'all .3s ease'
      }}>
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: -1, left: 20, right: 20, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.3 }} />
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: `linear-gradient(135deg, ${C.gold}, ${C.red})`,
              display: 'grid', placeItems: 'center', color: '#000', fontWeight: 900, fontSize: 17,
              boxShadow: C.goldGlow
            }}>A</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: -.3 }}>ADMINISTRACAO</div>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Gestao</div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ margin: '0 14px 16px', padding: 12, background: C.goldSoft, borderRadius: 12, border: `1px solid ${C.gold}12`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, display: 'grid', placeItems: 'center', color: '#000', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
            {(user?.nome || user?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nome || user?.username}</div>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, marginTop: 1 }}>Administrador</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 10px', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.textSoft, letterSpacing: 2, padding: '0 12px 10px', textTransform: 'uppercase' }}>Pedidos</div>
          {[
            { id: 'PENDENTE_DIRECAO', label: 'Pendentes', filter: 'PENDENTE_DIRECAO' },
            { id: 'APROVADO', label: 'Aprovados', filter: 'APROVADO' },
            { id: 'REJEITADO', label: 'Rejeitados', filter: 'REJEITADO' },
            { id: 'EM_ANDAMENTO', label: 'Em Andamento', filter: 'EM_ANDAMENTO' },
            { id: 'FINALIZADO', label: 'Finalizados', filter: 'FINALIZADO' },
          ].map(item => {
            const isActive = abaAtiva === 'pedidos' && filtroEstado === item.filter;
            return (
              <button key={item.id} onClick={() => { setAbaAtiva('pedidos'); setFiltroEstado(item.filter); setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '10px 14px', border: 'none', background: isActive ? C.goldSoft : 'transparent',
                color: isActive ? C.gold : C.textMuted, fontWeight: isActive ? 700 : 500, fontSize: 13, borderRadius: 8,
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2,
                fontFamily: 'inherit', transition: 'all .2s ease'
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.text; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; } }}
              >
                <span style={{ fontSize: 12, width: 20, textAlign: 'center', opacity: isActive ? 1 : 0.5 }}>■</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.gold }} />}
              </button>
            );
          })}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '14px 12px' }} />

          <div style={{ fontSize: 9, fontWeight: 800, color: C.textSoft, letterSpacing: 2, padding: '10px 12px 10px', textTransform: 'uppercase' }}>Modulos</div>
          {['coletivas', 'relatorios'].map(tab => (
            <button key={tab} onClick={() => { setAbaAtiva(tab); setMobileMenuOpen(false); }} style={{
              width: '100%', padding: '10px 14px', border: 'none', background: abaAtiva === tab ? C.goldSoft : 'transparent',
              color: abaAtiva === tab ? C.gold : C.textMuted, fontWeight: abaAtiva === tab ? 700 : 500, fontSize: 13, borderRadius: 8,
              cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2,
              fontFamily: 'inherit', transition: 'all .2s ease'
            }}
            onMouseEnter={(e) => { if (abaAtiva !== tab) { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={(e) => { if (abaAtiva !== tab) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textMuted; } }}
            >
              <span style={{ fontSize: 12, width: 20, textAlign: 'center', opacity: abaAtiva === tab ? 1 : 0.5 }}>◆</span>
              <span style={{ flex: 1 }}>{tab === 'coletivas' ? 'Coletivas' : 'Relatorios'}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div style={{ padding: '0 14px' }}>
          <button onClick={() => toggleTheme(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: '10px 14px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: C.text, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', transition: 'all .2s ease', marginBottom: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{isDark ? '☀' : '☾'}</span>
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: isDark ? C.gold : C.borderStrong, position: 'relative', transition: 'background .3s ease' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: isDark ? '#000' : '#fff', position: 'absolute', top: 3, left: isDark ? 19 : 3, transition: 'left .3s ease', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
            </div>
          </button>
        </div>

        {/* Logout */}
        <div style={{ padding: '10px 14px 20px' }}>
          <button onClick={onLogout} style={{
            width: '100%', padding: '10px 14px',
            background: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.05)',
            border: `1px solid ${isDark ? 'rgba(248,113,113,0.1)' : 'rgba(220,38,38,0.06)'}`,
            borderRadius: 8, color: C.red, cursor: 'pointer', fontWeight: 700, fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', transition: 'all .2s ease'
          }}>
            <span style={{ fontSize: 13 }}>↗</span> Sair
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <main className="ds-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="ds-header" style={{
          background: C.glass, borderBottom: `1px solid ${C.glassBorder}`, padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setMobileMenuOpen(true)} className="ds-toggle" style={{
              display: 'none', width: 36, height: 36, background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 8, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: C.text, fontSize: 15
            }}>☰</button>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>
                {abaAtiva === 'pedidos' ? 'Painel Administrativo' : abaAtiva === 'coletivas' ? 'Saidas Coletivas' : 'Relatorios'}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: C.gold, fontWeight: 600 }}>{horaAtual}</span>
                <span style={{ opacity: 0.3 }}>·</span>
                {formatarData(filtroData)}
                {lastUpdate && <><span style={{ opacity: 0.3 }}>·</span><span style={{ color: C.textSoft, fontSize: 10 }}>Sync {lastUpdate}</span></>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <span style={{ fontSize: 12, opacity: .5 }}>◉</span>
              <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 11, fontWeight: 600, color: C.text, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }} />
            </div>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifDropdown(s => !s)} style={{
                width: 36, height: 36, borderRadius: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                cursor: 'pointer', display: 'grid', placeItems: 'center', color: C.text, position: 'relative', fontSize: 13
              }}>
                ◉
                {notificacoesNaoLidas > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 4px',
                    background: C.red, color: '#fff', borderRadius: 8, fontSize: 8, fontWeight: 800,
                    display: 'grid', placeItems: 'center', border: `2px solid ${isDark ? '#0A0908' : '#FFFBF5'}`
                  }}>{notificacoesNaoLidas}</span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="ds-fade-scale" style={{
                  position: 'absolute', right: 0, top: 42, width: 320, background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadowHover,
                  zIndex: 50, maxHeight: 400, overflowY: 'auto'
                }}>
                  <div style={{ padding: 14, borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 11, color: C.text, background: C.surfaceAlt }}>Notificacoes</div>
                  {notificacoes.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Nenhuma notificacao</div>
                    : notificacoes.map(n => (
                      <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{
                        padding: 12, borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                        background: n.lida ? 'transparent' : C.goldSoft,
                        borderLeft: n.lida ? '3px solid transparent' : `3px solid ${C.gold}`
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{n.mensagem}</div>
                        {n.data && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{n.data}</div>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="ds-content" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, flex: 1, overflowY: 'auto' }}>

          {/* ==================== PEDIDOS ==================== */}
          {abaAtiva === 'pedidos' && (
            <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* STATS */}
              <div className="ds-stats-grid" style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard icon="◷" label="Pendentes" value={totalPendentes} subtitle="Aguardando analise" color={C.gold} />
                <StatCard icon="✓" label="Aprovados" value={totalAprovados} subtitle="Autorizados" color={C.green} />
                <StatCard icon="✕" label="Rejeitados" value={totalRejeitados} subtitle="Negados" color={C.red} />
                <StatCard icon="◈" label="Total Geral" value={totalGeral} subtitle="Pedidos no sistema" color="#000" isAccent />
              </div>

              {/* SECONDARY STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', boxShadow: C.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Em Andamento</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, marginTop: 2, letterSpacing: -.5 }}>{totalAndamento}</div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, boxShadow: `0 0 4px ${C.gold}` }} />
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', boxShadow: C.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Finalizados</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.textMuted, marginTop: 2, letterSpacing: -.5 }}>{totalFinalizados}</div>
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.textMuted }} />
                </div>
              </div>

              {/* TOOLBAR */}
              <div className="ds-toolbar" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, boxShadow: C.shadow, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, fontSize: 12, pointerEvents: 'none' }}>⌕</span>
                  <input type="text" placeholder="Buscar estudante ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
                    width: '100%', padding: '10px 12px 10px 34px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 12, outline: 'none', transition: 'border-color .2s'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                  />
                </div>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{
                  padding: '10px 12px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 11, outline: 'none', cursor: 'pointer', fontWeight: 600
                }}>
                  <option value="todos">Todos</option>
                  <option value="PENDENTE_DIRECAO">Pendentes</option>
                  <option value="APROVADO">Aprovados</option>
                  <option value="REJEITADO">Rejeitados</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="FINALIZADO">Finalizados</option>
                </select>
                <button onClick={() => setModalRelatorio(true)} style={{
                  padding: '10px 18px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                  color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
                  boxShadow: C.goldGlow
                }}>Relatorio</button>
              </div>

              {/* TABS */}
              <div className="ds-tabs" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <TabButton label="Todos" count={totalGeral} active={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')} />
                <TabButton label="Pendentes" count={totalPendentes} active={filtroEstado === 'PENDENTE_DIRECAO'} onClick={() => setFiltroEstado('PENDENTE_DIRECAO')} />
                <TabButton label="Aprovados" count={totalAprovados} active={filtroEstado === 'APROVADO'} onClick={() => setFiltroEstado('APROVADO')} />
                <TabButton label="Rejeitados" count={totalRejeitados} active={filtroEstado === 'REJEITADO'} onClick={() => setFiltroEstado('REJEITADO')} />
              </div>

              {/* TABLE */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin .8s linear infinite' }} />
                  <div style={{ color: C.textMuted, fontSize: 12 }}>Carregando...</div>
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: C.textMuted, border: `1px dashed ${C.borderStrong}`, borderRadius: 14, background: C.surface }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: .1 }}>◈</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Nenhum pedido encontrado</div>
                </div>
              ) : (
                <div className="ds-table-wrap" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: C.shadow }}>
                  <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                        {['ID', 'ESTUDANTE', 'CURSO', 'TIPO', 'DATA', 'STATUS', 'ACOES'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: C.textMuted, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((pedido, idx) => (
                        <tr key={pedido.id} style={{
                          borderBottom: `1px solid ${C.border}`,
                          background: hoveredRow === pedido.id ? C.goldSoft : (idx % 2 === 0 ? 'transparent' : C.surfaceAlt + '30'),
                          transition: 'background .15s ease'
                        }}
                        onMouseEnter={() => setHoveredRow(pedido.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: C.gold }}>#{pedido.id}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: C.text }}>{pedido.estudante_nome}</div>
                            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{pedido.estudante_email || '-'}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ color: C.text, fontWeight: 500 }}>{pedido.estudante_curso || '-'}</div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>{pedido.estudante_classe || '-'}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', background: C.surfaceAlt, borderRadius: 5, fontSize: 10, fontWeight: 600, color: C.text, border: `1px solid ${C.border}` }}>{pedido.tipo_display}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ color: C.text, fontWeight: 500 }}>{pedido.data_saida}</div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>{pedido.hora_saida}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}><StatusBadge estado={pedido.estado} /></td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                              <button onClick={() => navigate(`/pedido/${pedido.id}`)} style={{
                                width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent',
                                cursor: 'pointer', color: C.textMuted, fontSize: 10, display: 'grid', placeItems: 'center'
                              }} title="Detalhes">◈</button>
                              {pedido.acoes_disponiveis?.includes('aprovar') && (
                                <button onClick={() => abrirModalAprovacao(pedido.id)} style={{
                                  width: 28, height: 28, borderRadius: 6, border: 'none', background: C.green, color: '#fff',
                                  cursor: 'pointer', fontSize: 10, display: 'grid', placeItems: 'center', fontWeight: 800
                                }} title="Aprovar">✓</button>
                              )}
                              {pedido.acoes_disponiveis?.includes('rejeitar') && (
                                <button onClick={() => handleAcao(pedido.id, 'rejeitar')} style={{
                                  width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.red}20`, background: `${C.red}08`,
                                  color: C.red, cursor: 'pointer', fontSize: 10, display: 'grid', placeItems: 'center'
                                }} title="Rejeitar">✕</button>
                              )}
                              {pedido.estado === 'PENDENTE_DIRECAO' && (
                                <button onClick={() => handleEncaminhar(pedido.id)} style={{
                                  width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.gold}20`, background: C.goldSoft,
                                  color: C.gold, cursor: 'pointer', fontSize: 10, display: 'grid', placeItems: 'center'
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

          {/* ==================== COLETIVAS ==================== */}
          {abaAtiva === 'coletivas' && (
            <div className="ds-fade">
              {coletivas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: C.textMuted, border: `1px dashed ${C.borderStrong}`, borderRadius: 14, background: C.surface }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: .1 }}>◆</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Nenhuma saida coletiva</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                  {coletivas.map(c => (
                    <div key={c.id} style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                      overflow: 'hidden', boxShadow: C.shadow, transition: 'all .25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = C.shadowHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; }}
                    >
                      <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{c.titulo}</div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: c.encerrada ? `${C.textSoft}12` : C.greenSoft,
                          color: c.encerrada ? C.textMuted : C.green,
                          border: `1px solid ${c.encerrada ? `${C.textSoft}15` : C.green + '20'}`
                        }}>{c.encerrada ? 'ENCERRADA' : 'ATIVA'}</span>
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: C.textMuted, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span>Saida: {c.data_saida?.split('T')[0]}</span>
                          <span>Volta: {c.data_volta?.split('T')[0]}</span>
                          <span>Criador: {c.criador_nome || c.criador}</span>
                        </div>
                        <div style={{ height: 5, background: C.surfaceAlt, borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${((c.total_aceitos || 0) / (c.total_convidados || 1)) * 100}%`, height: '100%', background: C.green, borderRadius: 3, transition: 'width .5s ease' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
                          <span><strong style={{ color: C.text }}>{c.total_convidados || 0}</strong> convidados</span>
                          <span><strong style={{ color: C.green }}>{c.total_aceitos || 0}</strong> aceitos</span>
                          <span><strong style={{ color: C.red }}>{c.total_recusados || 0}</strong> recusados</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== RELATORIOS ==================== */}
          {abaAtiva === 'relatorios' && (
            <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Relatorios Gerados</div>
                <button onClick={() => setModalRelatorio(true)} style={{
                  padding: '8px 16px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                  color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit'
                }}>+ Novo</button>
              </div>
              {relatorios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: C.textMuted, border: `1px dashed ${C.borderStrong}`, borderRadius: 14, background: C.surface }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: .1 }}>▥</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Nenhum relatorio gerado</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {relatorios.map(r => (
                    <div key={r.id} onClick={() => baixarRelatorio(r.id)} style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18,
                      boxShadow: C.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'all .2s ease', flexWrap: 'wrap', gap: 10
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = C.shadowHover; e.currentTarget.style.borderColor = `${C.gold}30`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.borderColor = C.border; }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.titulo}</div>
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{r.created_at} · Por: {r.criado_por}</div>
                      </div>
                      <div style={{ padding: '6px 14px', background: C.goldSoft, border: `1px solid ${C.gold}15`, borderRadius: 6, color: C.gold, fontSize: 10, fontWeight: 700 }}>BAIXAR CSV</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ==================== MODAL APROVACAO ==================== */}
      {modalAprovacao && (
        <div onClick={() => setModalAprovacao(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(8px)',
          zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} className="ds-fade-scale" style={{
            background: C.surface, borderRadius: 18, width: '100%', maxWidth: 480,
            border: `1px solid ${C.border}`, boxShadow: C.shadowHover, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Aprovar Pedido</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Pedido #{modalAprovacao}</div>
              </div>
              <button onClick={() => setModalAprovacao(null)} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.textMuted, fontSize: 13, display: 'grid', placeItems: 'center' }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Data de Saida</label>
                <input type="date" value={dadosAprovacao.data_saida} onChange={(e) => setDadosAprovacao({ ...dadosAprovacao, data_saida: e.target.value })} style={{ width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Hora de Saida</label>
                <input type="time" value={dadosAprovacao.hora_saida} onChange={(e) => setDadosAprovacao({ ...dadosAprovacao, hora_saida: e.target.value })} style={{ width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Data de Retorno</label>
                <input type="date" value={dadosAprovacao.data_volta} onChange={(e) => setDadosAprovacao({ ...dadosAprovacao, data_volta: e.target.value })} style={{ width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Hora de Retorno</label>
                <input type="time" value={dadosAprovacao.hora_volta} onChange={(e) => setDadosAprovacao({ ...dadosAprovacao, hora_volta: e.target.value })} style={{ width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setModalAprovacao(null)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={confirmarAprovacao} style={{ flex: 1, padding: 12, background: C.green, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL RELATORIO ==================== */}
      {modalRelatorio && (
        <div onClick={() => setModalRelatorio(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(8px)',
          zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} className="ds-fade-scale" style={{
            background: C.surface, borderRadius: 18, width: '100%', maxWidth: 420,
            border: `1px solid ${C.border}`, boxShadow: C.shadowHover, padding: 24
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>
              <span style={{ color: C.gold }}>▥</span> Gerar Relatorio
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 20 }}>Selecione o periodo para gerar o relatorio.</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Data Inicio</label>
              <input type="date" value={dadosRelatorio.data_inicio} onChange={(e) => setDadosRelatorio({ ...dadosRelatorio, data_inicio: e.target.value })} style={{ width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Data Fim</label>
              <input type="date" value={dadosRelatorio.data_fim} onChange={(e) => setDadosRelatorio({ ...dadosRelatorio, data_fim: e.target.value })} style={{ width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalRelatorio(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={gerarRelatorio} disabled={gerandoRelatorio} style={{ flex: 1, padding: 12, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', opacity: gerandoRelatorio ? 0.6 : 1 }}>{gerandoRelatorio ? 'Gerando...' : 'Gerar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdministracao;

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardAdministracao = ({ user, onLogout }) => {
  // ==================== STATE MANAGEMENT ====================
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [coletivas, setColetivas] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Navigation
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DIRECAO');
  const [filtroData, setFiltroData] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  
  // UI States - Menu
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [horaAtual, setHoraAtual] = useState('');
  const [lastSync, setLastSync] = useState('');
  
  // Modals & Overlays
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  
  // Form Data
  const [dadosAprovacao, setDadosAprovacao] = useState({ data_saida: '', hora_saida: '07:00', data_volta: '', hora_volta: '19:00' });
  const [dadosRelatorio, setDadosRelatorio] = useState({ data_inicio: '', data_fim: '' });
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  
  // Notifications
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  const navigate = useNavigate();
  const notifRef = useRef(null);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ==================== THEME ENGINE ====================
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('admin-enterprise-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const isDark = themeMode === 'dark';

  const toggleTheme = useCallback((mode) => {
    setThemeMode(mode);
    localStorage.setItem('admin-enterprise-theme', mode);
  }, []);

  // ==================== DESIGN TOKENS ====================
  const T = useMemo(() => {
    const gold = '#C5A028';
    const goldDark = '#8F7010';
    const red = '#8B0000';
    
    const bgMain = isDark ? '#050505' : '#F4F4F0';
    const bgSurface = isDark ? '#121212' : '#FFFFFF';
    const textPrimary = isDark ? '#EAEAEA' : '#000000';
    const textSecondary = isDark ? '#A0A0A0' : '#555555';
    const border = isDark ? '#333333' : '#E0E0E0';
    
    const gradientGold = `linear-gradient(135deg, ${gold}, ${goldDark})`;
    const gradientRedBlack = `linear-gradient(135deg, ${red}, #000000)`;
    const shadowSoft = isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)';
    const shadowHover = isDark ? '0 8px 30px rgba(0,0,0,0.7)' : '0 8px 30px rgba(0,0,0,0.1)';

    return {
      gold, goldDark, red,
      bgMain, bgSurface,
      bgAlt: isDark ? '#1A1A1A' : '#FAFAFA',
      textPrimary, textSecondary,
      border,
      gradientGold, gradientRedBlack,
      shadowSoft, shadowHover,
      success: '#2E7D32',
      danger: '#C62828',
      glass: isDark ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.9)',
    };
  }, [isDark]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar dados quando filtros mudarem
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([carregarDados(), carregarNotificacoes()]);
        setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [filtroEstado, filtroData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      carregarDados();
      carregarNotificacoes();
      setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    const handleVis = () => !document.hidden && carregarDados();
    document.addEventListener('visibilitychange', handleVis);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVis); };
  }, [filtroEstado, filtroData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // API Functions
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
    } catch (err) { console.error('Error loading data:', err); }
    finally { setLoading(false); }
  }, [filtroEstado, filtroData]);

  const carregarNotificacoes = useCallback(async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  }, []);

  const carregarColetivas = useCallback(async () => {
    try { const res = await api.get('/coletivas/listar/'); setColetivas(res.data.coletivas || []); } catch (err) {}
  }, []);

  const carregarRelatorios = useCallback(async () => {
    try { const res = await api.get('/relatorios/'); setRelatorios(res.data.relatorios || []); } catch (err) {}
  }, []);

  useEffect(() => {
    carregarColetivas();
    carregarRelatorios();
  }, []);

  // Actions
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
      await api.post(`/pedidos/${modalAprovacao}/aprovar/`, dadosAprovacao);
      alert('✅ Pedido aprovado com sucesso.');
      setModalAprovacao(null);
      carregarDados();
    } catch (err) { alert('❌ Erro: ' + (err.response?.data?.error || 'Falha na aprovação')); }
  };

  const rejeitarPedido = async (id) => {
    const motivo = prompt('📝 Motivo da rejeição:');
    if (!motivo) return;
    try {
      await api.post(`/pedidos/${id}/rejeitar/`, { comentario: motivo });
      alert('✅ Pedido rejeitado.');
      carregarDados();
    } catch (err) { alert('❌ Erro: ' + (err.response?.data?.error || 'Falha na rejeição')); }
  };

  const encaminharPedido = async (id) => {
    if (!confirm('📤 Encaminhar para Direção?')) return;
    try {
      await api.post(`/pedidos/${id}/passar/`);
      alert('✅ Pedido encaminhado para Direção.');
      carregarDados();
    } catch (err) { alert('❌ Erro ao encaminhar'); }
  };

  const gerarRelatorio = async () => {
    if (!dadosRelatorio.data_inicio || !dadosRelatorio.data_fim) return alert('⚠️ Preencha as datas');
    setGerandoRelatorio(true);
    try {
      await api.post('/relatorios/criar/', {
        titulo: `Relatório Admin - ${new Date().toLocaleDateString()}`,
        tipo: 'PERSONALIZADO', descricao: 'Gerado via Painel Admin',
        data_inicio: dadosRelatorio.data_inicio, data_fim: dadosRelatorio.data_fim
      });
      alert('✅ Relatório gerado com sucesso.');
      carregarRelatorios();
      setModalRelatorio(false);
      setDadosRelatorio({ data_inicio: '', data_fim: '' });
    } catch (err) { alert('❌ Erro ao gerar relatório'); }
    finally { setGerandoRelatorio(false); }
  };

  const baixarRelatorio = async (id) => {
    try {
      const res = await api.get(`/relatorios/download/${id}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `relatorio_${id}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { alert('❌ Erro no download'); }
  };

  const formatarData = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-';
  
  const pedidosFiltrados = useMemo(() => pedidos.filter(p => 
    p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  ), [pedidos, searchTerm]);

  const sidebarWidth = sidebarCollapsed ? 80 : 260;

  // ==================== SUB-COMPONENTS ====================
  const StatusBadge = ({ status }) => {
    let color = T.textSecondary;
    let bg = T.bgAlt;
    let label = status.replace(/_/g, ' ');
    if (status.includes('APROVADO')) { color = T.success; bg = `${T.success}15`; }
    else if (status.includes('REJEITADO')) { color = T.danger; bg = `${T.danger}15`; }
    else if (status.includes('PENDENTE')) { color = T.gold; bg = `${T.gold}15`; }
    else if (status.includes('ANDAMENTO')) { color = '#1976D2'; bg = '#1976D215'; }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, backgroundColor: bg, color: color, border: `1px solid ${color}30`, textTransform: 'uppercase' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
        {label}
      </span>
    );
  };

  const StatCard = ({ title, value, sub, icon, isGold }) => (
    <div style={{
      background: isGold ? T.gradientGold : T.bgSurface,
      borderRadius: 2, padding: 24, boxShadow: T.shadowSoft,
      border: isGold ? 'none' : `1px solid ${T.border}`,
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = T.shadowHover; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadowSoft; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isGold ? 'rgba(255,255,255,0.3)' : T.gradientRedBlack }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: isGold ? 'rgba(0,0,0,0.6)' : T.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{title}</h3>
          <div style={{ fontSize: 36, fontWeight: 300, color: isGold ? '#000' : T.textPrimary, lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ fontSize: 24, color: isGold ? 'rgba(0,0,0,0.2)' : T.gold, opacity: 0.8 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 11, color: isGold ? 'rgba(0,0,0,0.5)' : T.textSecondary, marginTop: 12, borderTop: `1px solid ${isGold ? 'rgba(0,0,0,0.1)' : T.border}`, paddingTop: 12 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", backgroundColor: T.bgMain, color: T.textPrimary, transition: 'background 0.3s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; outline: none; }
        body { margin: 0; background: ${T.bgMain}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; borderRadius: 3px; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @media (max-width: 1024px) { 
          .grid-stats { grid-template-columns: repeat(2, 1fr) !important; } 
        }
        @media (max-width: 768px) {
          .sidebar-desktop { transform: translateX(-100%) !important; position: fixed !important; z-index: 1000 !important; transition: transform 0.3s ease !important; }
          .sidebar-desktop.open { transform: translateX(0) !important; }
          .overlay-mobile { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 999; backdrop-filter: blur(2px); }
          .overlay-mobile.show { display: block; }
          .main-content { margin-left: 0 !important; width: 100% !important; }
          .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -16px; padding: 0 16px; }
          table { min-width: 650px; width: 100%; }
          .content-padding { padding: 16px !important; }
          .header-padding { padding: 0 16px !important; }
          .action-buttons { flex-wrap: wrap; gap: 6px !important; }
          .action-buttons button { min-width: 32px !important; }
          .filter-container { flex-direction: column; align-items: stretch !important; }
          .filter-container > div { width: 100%; }
          .filter-container select, .filter-container input { width: 100% !important; }
        }
        @media (max-width: 480px) {
          .grid-stats { grid-template-columns: 1fr !important; }
          .stats-card { padding: 16px !important; }
        }
      `}</style>

      {/* Mobile Overlay */}
      <div className={`overlay-mobile ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`sidebar-desktop ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: sidebarWidth, background: T.bgSurface, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed',
        transition: 'width 0.3s ease, transform 0.3s ease',
        overflow: 'hidden', zIndex: 100
      }}>
        {/* Brand */}
        <div style={{ padding: 20, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start', gap: 12 }}>
          <div style={{ 
            width: 40, height: 40, background: T.gradientRedBlack, borderRadius: 2, 
            display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 800, fontSize: 18,
            cursor: 'pointer', flexShrink: 0
          }}>A</div>
          {(!sidebarCollapsed || isMobile) && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.5, color: T.textPrimary }}>ADMINISTRAÇÃO</div>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 600, letterSpacing: 1 }}>ENTERPRISE</div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        {!isMobile && (
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            position: 'absolute', right: -12, top: 30, width: 24, height: 24,
            background: T.gold, color: '#000', border: 'none', borderRadius: '50%',
            cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 101, boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <button onClick={() => setMobileMenuOpen(false)} style={{
            position: 'absolute', right: 10, top: 10, width: 30, height: 30,
            background: 'transparent', border: 'none', color: T.textSecondary,
            cursor: 'pointer', fontSize: 18
          }}>
            ✕
          </button>
        )}

        {/* User Info */}
        <div style={{ padding: 20, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: '50%', background: T.gradientGold,
            display: 'grid', placeItems: 'center', color: '#000', fontWeight: 700, fontSize: 14,
            flexShrink: 0
          }}>{user?.nome?.[0] || user?.username?.[0] || 'A'}</div>
          {(!sidebarCollapsed || isMobile) && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nome?.split(' ')[0] || user?.username || 'Admin'}</div>
              <div style={{ fontSize: 10, color: T.gold }}>Administrador</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 10, paddingLeft: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>GESTÃO DE PEDIDOS</div>
          
          {[
            { id: 'PENDENTE_DIRECAO', label: 'Pendentes', icon: '◷' },
            { id: 'APROVADO', label: 'Aprovados', icon: '✓' },
            { id: 'REJEITADO', label: 'Rejeitados', icon: '✕' },
            { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: '→' },
            { id: 'FINALIZADO', label: 'Finalizados', icon: '▣' },
          ].map(item => {
            const active = abaAtiva === 'pedidos' && filtroEstado === item.id;
            return (
              <button key={item.id} onClick={() => { setAbaAtiva('pedidos'); setFiltroEstado(item.id); if(isMobile) setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '12px 12px', border: 'none', borderRadius: 2, cursor: 'pointer',
                background: active ? `${T.gold}15` : 'transparent',
                color: active ? T.gold : T.textSecondary,
                fontWeight: active ? 600 : 500, fontSize: 13, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start'
              }}>
                <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{item.icon}</span>
                {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
              </button>
            );
          })}

          {(!sidebarCollapsed || isMobile) && <div style={{ height: 1, background: T.border, margin: '16px 0' }} />}
          {(!sidebarCollapsed || isMobile) && <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 10, paddingLeft: 10, letterSpacing: 1 }}>MÓDULOS</div>}
          
          <button onClick={() => { setAbaAtiva('coletivas'); if(isMobile) setMobileMenuOpen(false); }} style={{
            width: '100%', padding: '12px 12px', border: 'none', borderRadius: 2, cursor: 'pointer',
            background: abaAtiva === 'coletivas' ? `${T.gold}15` : 'transparent',
            color: abaAtiva === 'coletivas' ? T.gold : T.textSecondary,
            fontWeight: 600, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
            justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start'
          }}>
            <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>👥</span>
            {(!sidebarCollapsed || isMobile) && 'Coletivas'}
          </button>
          
          <button onClick={() => { setAbaAtiva('relatorios'); if(isMobile) setMobileMenuOpen(false); }} style={{
            width: '100%', padding: '12px 12px', border: 'none', borderRadius: 2, cursor: 'pointer',
            background: abaAtiva === 'relatorios' ? `${T.gold}15` : 'transparent',
            color: abaAtiva === 'relatorios' ? T.gold : T.textSecondary,
            fontWeight: 600, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
            justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start'
          }}>
            <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>📊</span>
            {(!sidebarCollapsed || isMobile) && 'Relatórios'}
          </button>
        </nav>

        {/* Footer */}
        <div style={{ padding: 20, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => toggleTheme(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: 10, background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 2, color: T.textSecondary, cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {isDark ? '☀ Modo Claro' : '🌙 Modo Escuro'}
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: 10, background: T.danger, color: '#FFF', border: 'none',
            borderRadius: 2, cursor: 'pointer', fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="main-content" style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        marginLeft: !isMobile ? sidebarWidth : 0,
        transition: 'margin-left 0.3s ease',
        width: !isMobile ? `calc(100% - ${sidebarWidth}px)` : '100%'
      }}>
        
        {/* Top Header */}
        <header className="header-padding" style={{
          height: 70, background: T.glass, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px',
          backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Mobile Toggle Button */}
            <button onClick={() => setMobileMenuOpen(true)} style={{
              display: isMobile ? 'flex' : 'none',
              background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.textPrimary
            }}>
              ☰
            </button>

            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: -0.5 }}>
                {abaAtiva === 'pedidos' ? 'CONTROLE DE PEDIDOS' : abaAtiva === 'coletivas' ? 'SAÍDAS COLETIVAS' : 'RELATÓRIOS'}
              </h1>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                {horaAtual} {lastSync && `• Sync: ${lastSync}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 2, border: `1px solid ${T.border}`,
              background: T.bgSurface, color: T.textPrimary, fontSize: 12, fontFamily: 'inherit'
            }} />
            
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{
                width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.border}`,
                background: T.bgSurface, cursor: 'pointer', position: 'relative', color: T.textPrimary
              }}>
                🔔
                {notificacoesNaoLidas > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, width: 16, height: 16,
                    background: T.red, color: '#FFF', borderRadius: '50%', fontSize: 9,
                    display: 'grid', placeItems: 'center', border: `2px solid ${T.bgSurface}`
                  }}>{notificacoesNaoLidas}</span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="fade-in" style={{
                  position: 'absolute', right: 0, top: 45, width: 320, background: T.bgSurface,
                  border: `1px solid ${T.border}`, boxShadow: T.shadowHover, borderRadius: 4, zIndex: 50
                }}>
                  <div style={{ padding: 12, borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 12 }}>NOTIFICAÇÕES</div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notificacoes.length === 0 ? <div style={{padding:20, textAlign:'center', color:T.textSecondary}}>Vazio</div> :
                      notificacoes.map(n => (
                        <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{
                          padding: 12, borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
                          background: n.lida ? 'transparent' : `${T.gold}08`
                        }}>
                          <div style={{fontSize:12, fontWeight:600}}>{n.mensagem}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="content-padding" style={{ flex: 1, overflowY: 'auto', padding: 30 }}>
          
          {/* PEDIDOS VIEW */}
          {abaAtiva === 'pedidos' && (
            <div className="fade-in">
              {/* Stats Grid - Atualiza corretamente */}
              <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
                <StatCard 
                  title="Pendentes" 
                  value={pedidos.filter(p => p.estado === 'PENDENTE_DIRECAO').length || 0} 
                  sub="Aguardando Ação" 
                  icon="◷" 
                />
                <StatCard 
                  title="Aprovados" 
                  value={pedidos.filter(p => p.estado === 'APROVADO').length || 0} 
                  sub="Autorizados" 
                  icon="✓" 
                />
                <StatCard 
                  title="Rejeitados" 
                  value={pedidos.filter(p => p.estado === 'REJEITADO').length || 0} 
                  sub="Negados" 
                  icon="✕" 
                />
                <StatCard 
                  title="Total Geral" 
                  value={pedidos.length || 0} 
                  sub="Volume Acumulado" 
                  icon="◈" 
                  isGold 
                />
              </div>

              {/* Filter Toolbar - Mobile Friendly */}
              <div className="filter-container" style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, 
                flexWrap: 'wrap', gap: 15, background: T.bgSurface, padding: 15, borderRadius: 2, border: `1px solid ${T.border}`
              }}>
                <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                    <input placeholder="Buscar por nome ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
                      width: '100%', padding: '10px 15px', borderRadius: 2, border: `1px solid ${T.border}`,
                      background: T.bgAlt, color: T.textPrimary, fontSize: 13
                    }} />
                  </div>
                  <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{
                    padding: '10px 15px', borderRadius: 2, border: `1px solid ${T.border}`,
                    background: T.bgAlt, color: T.textPrimary, fontSize: 13, cursor: 'pointer',
                    minWidth: 140
                  }}>
                    <option value="todos">Todos os Status</option>
                    <option value="PENDENTE_DIRECAO">Pendentes</option>
                    <option value="APROVADO">Aprovados</option>
                    <option value="REJEITADO">Rejeitados</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="FINALIZADO">Finalizados</option>
                  </select>
                </div>
                <button onClick={() => setModalRelatorio(true)} style={{
                  padding: '10px 20px', background: T.gradientRedBlack, color: '#FFF', border: 'none',
                  borderRadius: 2, cursor: 'pointer', fontWeight: 600, fontSize: 12, letterSpacing: 0.5,
                  boxShadow: '0 4px 10px rgba(139,0,0,0.2)', whiteSpace: 'nowrap'
                }}>GERAR RELATÓRIO</button>
              </div>

              {/* Data Table - Responsive */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: 50, color: T.textSecondary }}>Carregando dados...</div>
              ) : (
                <div className="table-responsive" style={{ background: T.bgSurface, borderRadius: 2, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.bgAlt, borderBottom: `2px solid ${T.border}` }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSecondary }}>ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSecondary }}>Estudante</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSecondary }}>Curso</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSecondary }}>Data Saída</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSecondary }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.textSecondary }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((p, i) => (
                        <tr key={p.id} style={{ 
                          borderBottom: `1px solid ${T.border}`, 
                          background: hoveredRow === p.id ? `${T.gold}08` : (i % 2 === 0 ? 'transparent' : `${T.bgAlt}50`),
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={() => setHoveredRow(p.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: T.gold, whiteSpace: 'nowrap' }}>#{p.id}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: T.textPrimary }}>{p.estudante_nome}</div>
                            <div style={{ fontSize: 10, color: T.textSecondary }}>{p.estudante_email}</div>
                          </td>
                          <td style={{ padding: '12px 16px', color: T.textSecondary, whiteSpace: 'nowrap' }}>{p.estudante_curso || '-'}</td>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                            <div>{formatarData(p.data_saida)}</div>
                            <div style={{ fontSize: 10, color: T.textSecondary }}>{p.hora_saida}</div>
                          </td>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}><StatusBadge status={p.estado} /></td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <div className="action-buttons" style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button onClick={() => setModalDetalhes(p)} style={{
                                width: 32, height: 32, borderRadius: 2, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', color: T.textSecondary,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                              }} title="Ver detalhes">👁</button>
                              
                              {p.acoes_disponiveis?.includes('aprovar') && (
                                <button onClick={() => abrirModalAprovacao(p.id)} style={{
                                  width: 32, height: 32, borderRadius: 2, border: 'none', background: T.success, color: '#FFF', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }} title="Aprovar">✓</button>
                              )}
                              
                              {p.acoes_disponiveis?.includes('rejeitar') && (
                                <button onClick={() => rejeitarPedido(p.id)} style={{
                                  width: 32, height: 32, borderRadius: 2, border: 'none', background: T.danger, color: '#FFF', cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }} title="Rejeitar">✕</button>
                              )}

                              {p.estado === 'PENDENTE_DIRECAO' && (
                                <button onClick={() => encaminharPedido(p.id)} style={{
                                  width: 32, height: 32, borderRadius: 2, border: `1px solid ${T.gold}`, background: 'transparent', color: T.gold, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }} title="Encaminhar">➜</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pedidosFiltrados.length === 0 && (
                        <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', color: T.textSecondary }}>Nenhum registro encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* COLETIVAS VIEW */}
          {abaAtiva === 'coletivas' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {coletivas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: T.textSecondary, background: T.bgSurface, borderRadius: 2 }}>Nenhuma saída coletiva criada</div>
                ) : (
                  coletivas.map(c => (
                    <div key={c.id} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, padding: 20, borderRadius: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{c.titulo}</h3>
                        <span style={{ fontSize: 10, fontWeight: 700, color: c.encerrada ? T.textSecondary : T.success }}>{c.encerrada ? 'ENCERRADA' : 'ATIVA'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 15 }}>{c.data_saida?.split('T')[0]} até {c.data_volta?.split('T')[0]}</div>
                      <div style={{ height: 4, background: T.bgAlt, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${((c.total_aceitos || 0) / (c.total_convidados || 1)) * 100}%`, height: '100%', background: T.gold }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, flexWrap: 'wrap' }}>
                        <span><strong>{c.total_convidados || 0}</strong> Convidados</span>
                        <span><strong style={{ color: T.success }}>{c.total_aceitos || 0}</strong> Aceitaram</span>
                        <span><strong style={{ color: T.danger }}>{c.total_recusados || 0}</strong> Recusaram</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* RELATORIOS VIEW */}
          {abaAtiva === 'relatorios' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Histórico de Relatórios</h2>
                <button onClick={() => setModalRelatorio(true)} style={{ padding: '8px 16px', background: T.gold, border: 'none', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}>NOVO RELATÓRIO</button>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {relatorios.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: T.textSecondary, background: T.bgSurface, borderRadius: 2 }}>Nenhum relatório gerado</div>
                ) : (
                  relatorios.map(r => (
                    <div key={r.id} onClick={() => baixarRelatorio(r.id)} style={{
                      background: T.bgSurface, border: `1px solid ${T.border}`, padding: 15, borderRadius: 2,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                      transition: 'all 0.2s', flexWrap: 'wrap', gap: 12
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.titulo}</div>
                        <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>{r.created_at}</div>
                      </div>
                      <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>BAIXAR CSV ↓</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Approval Modal */}
      {modalAprovacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20 }} onClick={() => setModalAprovacao(null)}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: T.bgSurface, width: '90%', maxWidth: 450, padding: 30, borderRadius: 2, border: `1px solid ${T.border}`, boxShadow: T.shadowHover }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, paddingBottom: 10, display: 'inline-block' }}>APROVAR PEDIDO #{modalAprovacao}</h2>
            <div style={{ display: 'grid', gap: 15 }}>
              <div><label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>DATA SAÍDA</label><input type="date" value={dadosAprovacao.data_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, data_saida: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} /></div>
              <div><label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>HORA SAÍDA</label><input type="time" value={dadosAprovacao.hora_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_saida: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div><label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>DATA VOLTA</label><input type="date" value={dadosAprovacao.data_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, data_volta: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} /></div>
                <div><label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>HORA VOLTA</label><input type="time" value={dadosAprovacao.hora_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_volta: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 25, flexWrap: 'wrap' }}>
              <button onClick={() => setModalAprovacao(null)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', fontWeight: 600 }}>CANCELAR</button>
              <button onClick={confirmarAprovacao} style={{ flex: 1, padding: 12, background: T.success, color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {modalRelatorio && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20 }} onClick={() => setModalRelatorio(null)}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: T.bgSurface, width: '90%', maxWidth: 400, padding: 30, borderRadius: 2, border: `1px solid ${T.border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>GERAR RELATÓRIO</h2>
            <div style={{ display: 'grid', gap: 15 }}>
              <input type="date" value={dadosRelatorio.data_inicio} onChange={e => setDadosRelatorio({...dadosRelatorio, data_inicio: e.target.value})} style={{ padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
              <input type="date" value={dadosRelatorio.data_fim} onChange={e => setDadosRelatorio({...dadosRelatorio, data_fim: e.target.value})} style={{ padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button onClick={() => setModalRelatorio(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer' }}>FECHAR</button>
              <button onClick={gerarRelatorio} disabled={gerandoRelatorio} style={{ flex: 1, padding: 10, background: T.gold, border: 'none', cursor: 'pointer', fontWeight: 600 }}>{gerandoRelatorio ? 'GERANDO...' : 'GERAR'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {modalDetalhes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20 }} onClick={() => setModalDetalhes(null)}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: T.bgSurface, width: '90%', maxWidth: 500, padding: 30, borderRadius: 2, border: `1px solid ${T.border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>Detalhes do Pedido #{modalDetalhes.id}</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <p><strong>Estudante:</strong> {modalDetalhes.estudante_nome}</p>
              <p><strong>Email:</strong> {modalDetalhes.estudante_email}</p>
              <p><strong>Curso:</strong> {modalDetalhes.estudante_curso || '-'}</p>
              <p><strong>Tipo:</strong> {modalDetalhes.tipo_display}</p>
              <p><strong>Data Saída:</strong> {modalDetalhes.data_saida}</p>
              <p><strong>Motivo:</strong> {modalDetalhes.motivo}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalDetalhes(null)} style={{ flex: 1, padding: 12, background: T.gold, border: 'none', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}>FECHAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdministracao;

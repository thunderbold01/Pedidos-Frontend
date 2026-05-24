import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ============================================================
// DASHBOARD ADMINISTRACAO — Enterprise Edition
// Design Premium: Gold Accents, Black Typography, Red/Black Gradients
// Fully Responsive, Dark Mode Detection, Auto-Refresh
// ============================================================
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
  
  // UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [horaAtual, setHoraAtual] = useState('');
  const [lastSync, setLastSync] = useState('');
  
  // Modals & Overlays
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [modalColetiva, setModalColetiva] = useState(false);
  
  // Form Data
  const [dadosAprovacao, setDadosAprovacao] = useState({ data_saida: '', hora_saida: '07:00', data_volta: '', hora_volta: '19:00' });
  const [dadosRelatorio, setDadosRelatorio] = useState({ data_inicio: '', data_fim: '' });
  const [dadosColetiva, setDadosColetiva] = useState({ titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24' });
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [criandoColetiva, setCriandoColetiva] = useState(false);
  
  // Notifications
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  const navigate = useNavigate();
  const notifRef = useRef(null);

  // ==================== THEME ENGINE (Persistent + System Detect) ====================
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

  // ==================== DESIGN TOKENS (Premium Palette) ====================
  const T = useMemo(() => {
    const gold = '#C5A028';
    const goldLight = '#E6C86E';
    const goldDark = '#8F7010';
    const red = '#8B0000';
    const black = '#0A0A0A';
    const white = '#FFFFFF';
    
    const bgMain = isDark ? '#050505' : '#F4F4F0';
    const bgSurface = isDark ? '#121212' : '#FFFFFF';
    const textPrimary = isDark ? '#EAEAEA' : '#000000';
    const textSecondary = isDark ? '#A0A0A0' : '#555555';
    const border = isDark ? '#333333' : '#E0E0E0';
    
    const gradientGold = `linear-gradient(135deg, ${gold}, ${goldDark})`;
    const gradientRedBlack = `linear-gradient(135deg, ${red}, #000000)`;
    const shadowSoft = isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)';
    const shadowHover = isDark ? '0 8px 30px rgba(0,0,0,0.7)' : '0 8px 30px rgba(0,0,0,0.1)';
    const glowGold = isDark ? `0 0 15px rgba(197, 160, 40, 0.15)` : `0 0 10px rgba(197, 160, 40, 0.1)`;

    return {
      gold, goldLight, goldDark, red, black, white,
      bgMain, bgSurface,
      bgAlt: isDark ? '#1A1A1A' : '#FAFAFA',
      textPrimary, textSecondary,
      border, borderStrong: isDark ? '#444' : '#CCC',
      gradientGold, gradientRedBlack,
      shadowSoft, shadowHover, glowGold,
      success: '#2E7D32',
      warning: '#F9A825',
      danger: '#C62828',
      glass: isDark ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.9)',
    };
  }, [isDark]);

  // ==================== EFFECTS & DATA LOADING ====================
  
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([carregarDados(), carregarNotificacoes()]);
        setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) { console.error(e); }
    };

    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    const handleVis = () => !document.hidden && fetchData();
    
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

  const criarColetiva = async () => {
    if (!dadosColetiva.titulo || !dadosColetiva.data_saida || !dadosColetiva.data_volta) {
      alert('⚠️ Preencha todos os campos obrigatórios');
      return;
    }
    setCriandoColetiva(true);
    try {
      await api.post('/coletivas/criar/', dadosColetiva);
      alert('✅ Saída coletiva criada com sucesso!');
      setModalColetiva(false);
      setDadosColetiva({ titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24' });
      carregarColetivas();
    } catch (err) {
      alert('❌ Erro ao criar saída coletiva: ' + (err.response?.data?.error || err.message));
    } finally {
      setCriandoColetiva(false);
    }
  };

  const gerarRelatorio = async () => {
    if (!dadosRelatorio.data_inicio || !dadosRelatorio.data_fim) return alert('Preencha as datas');
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

  const StatusBadge = ({ status }) => {
    let color = T.textSecondary;
    let bg = T.bgAlt;
    
    if (status.includes('APROVADO')) { color = T.success; bg = `${T.success}15`; }
    else if (status.includes('REJEITADO')) { color = T.danger; bg = `${T.danger}15`; }
    else if (status.includes('PENDENTE')) { color = T.gold; bg = `${T.gold}15`; }
    else if (status.includes('ANDAMENTO')) { color = '#1976D2'; bg = '#1976D215'; }

    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
        borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        backgroundColor: bg, color: color, border: `1px solid ${color}30`,
        textTransform: 'uppercase'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const StatCard = ({ title, value, sub, icon, isGold }) => (
    <div style={{
      background: isGold ? T.gradientGold : T.bgSurface,
      borderRadius: 2,
      padding: 24,
      boxShadow: T.shadowSoft,
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
      
      <div style={{ fontSize: 11, color: isGold ? 'rgba(0,0,0,0.5)' : T.textSecondary, marginTop: 12, borderTop: `1px solid ${isGold ? 'rgba(0,0,0,0.1)' : T.border}`, paddingTop: 12 }}>
        {sub}
      </div>
    </div>
  );

  return (
    <div style={{ 
      display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", 
      backgroundColor: T.bgMain, color: T.textPrimary, transition: 'background 0.3s ease' 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; outline: none; }
        body { margin: 0; background: ${T.bgMain}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.gold}; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @media (max-width: 1024px) { .grid-stats { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) {
          .sidebar { position: fixed; left: -280px; z-index: 1000; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .sidebar.open { left: 0; box-shadow: 10px 0 30px rgba(0,0,0,0.2); }
          .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; backdrop-filter: blur(2px); }
          .overlay.show { display: block; }
          .toggle-btn { display: flex !important; }
          .main-content { margin-left: 0 !important; }
          .table-wrap { overflow-x: auto; }
          table { min-width: 700px; }
        }
      `}</style>

      <div className={`overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: 260, background: T.bgSurface, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ padding: 30, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, background: T.gradientRedBlack, borderRadius: 2, 
              display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 800, fontSize: 18,
              boxShadow: '0 4px 10px rgba(139,0,0,0.3)'
            }}>A</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.5, color: T.textPrimary }}>ADMINISTRAÇÃO</div>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 600, letterSpacing: 1 }}>ENTERPRISE PORTAL</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 20, background: T.bgAlt }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '50%', background: T.textPrimary, color: T.bgSurface,
              display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 
            }}>{user?.nome?.[0] || 'U'}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nome || 'Usuário'}</div>
              <div style={{ fontSize: 10, color: T.gold }}>Gestor Senior</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 10, paddingLeft: 10, letterSpacing: 1 }}>GESTÃO DE PEDIDOS</div>
          
          {[
            { id: 'PENDENTE_DIRECAO', label: 'Pendentes', icon: '◷' },
            { id: 'APROVADO', label: 'Aprovados', icon: '✓' },
            { id: 'REJEITADO', label: 'Rejeitados', icon: '✕' },
            { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: '→' },
            { id: 'FINALIZADO', label: 'Finalizados', icon: '▣' },
          ].map(item => {
            const active = abaAtiva === 'pedidos' && filtroEstado === item.id;
            return (
              <button key={item.id} onClick={() => { setAbaAtiva('pedidos'); setFiltroEstado(item.id); setMobileMenuOpen(false); }} style={{
                width: '100%', padding: '12px 16px', border: 'none', borderRadius: 2, cursor: 'pointer',
                background: active ? `${T.gold}15` : 'transparent',
                color: active ? T.gold : T.textSecondary,
                fontWeight: active ? 600 : 500, fontSize: 13, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                borderLeft: active ? `3px solid ${T.gold}` : '3px solid transparent'
              }}>
                <span style={{ width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          <div style={{ height: 1, background: T.border, margin: '20px 0' }} />
          
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginBottom: 10, paddingLeft: 10, letterSpacing: 1 }}>MÓDULOS</div>
          
          <button onClick={() => { setAbaAtiva('coletivas'); setMobileMenuOpen(false); }} style={{
            width: '100%', padding: '12px 16px', border: 'none', borderRadius: 2, cursor: 'pointer',
            background: abaAtiva === 'coletivas' ? `${T.gold}15` : 'transparent',
            color: abaAtiva === 'coletivas' ? T.gold : T.textSecondary,
            fontWeight: 600, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ width: 20, textAlign: 'center' }}>👥</span> Coletivas
          </button>
          
          <button onClick={() => { setAbaAtiva('relatorios'); setMobileMenuOpen(false); }} style={{
            width: '100%', padding: '12px 16px', border: 'none', borderRadius: 2, cursor: 'pointer',
            background: abaAtiva === 'relatorios' ? `${T.gold}15` : 'transparent',
            color: abaAtiva === 'relatorios' ? T.gold : T.textSecondary,
            fontWeight: 600, fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ width: 20, textAlign: 'center' }}>📊</span> Relatórios
          </button>

          {/* Botão Nova Coletiva */}
          <div style={{ height: 1, background: T.border, margin: '20px 0' }} />
          
          <button onClick={() => setModalColetiva(true)} style={{
            width: '100%', padding: '12px 16px', border: 'none', borderRadius: 2, cursor: 'pointer',
            background: T.gradientGold, color: '#000', fontWeight: 700, fontSize: 13,
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, marginTop: 10
          }}>
            <span style={{ width: 20, textAlign: 'center' }}>➕</span> Nova Coletiva
          </button>
        </nav>

        <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
          <button onClick={() => toggleTheme(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: 10, background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 2, color: T.textSecondary, cursor: 'pointer', fontSize: 12, marginBottom: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            <span style={{ fontSize: 16 }}>{isDark ? '☀' : '☾'}</span>
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: 10, background: T.danger, color: '#FFF', border: 'none',
            borderRadius: 2, cursor: 'pointer', fontWeight: 600, fontSize: 12
          }}>ENCERRAR SESSÃO</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <header style={{
          height: 70, background: T.glass, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px',
          backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button className="toggle-btn" onClick={() => setMobileMenuOpen(true)} style={{
              display: 'none', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.textPrimary
            }}>☰</button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: -0.5 }}>
                {abaAtiva === 'pedidos' ? 'CONTROLE DE PEDIDOS' : abaAtiva === 'coletivas' ? 'SAÍDAS COLETIVAS' : 'RELATÓRIOS'}
              </h1>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
                {horaAtual} <span style={{margin:'0 5px'}}>•</span> {lastSync && `Sync: ${lastSync}`}
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

        <div style={{ flex: 1, overflowY: 'auto', padding: 30 }}>
          
          {/* PEDIDOS VIEW */}
          {abaAtiva === 'pedidos' && (
            <div className="fade-in">
              <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
                <StatCard title="Pendentes" value={stats.meus_pedidos_pendentes || 0} sub="Aguardando Ação" icon="◷" />
                <StatCard title="Aprovados" value={stats.pedidos_aprovados || 0} sub="Autorizados Hoje" icon="✓" />
                <StatCard title="Rejeitados" value={stats.pedidos_rejeitados || 0} sub="Negados" icon="✕" />
                <StatCard title="Total Geral" value={stats.total_pedidos || 0} sub="Volume Acumulado" icon="◈" isGold />
              </div>

              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, 
                flexWrap: 'wrap', gap: 15, background: T.bgSurface, padding: 15, borderRadius: 2, border: `1px solid ${T.border}`
              }}>
                <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                  <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                    <input placeholder="Buscar por nome ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
                      width: '100%', padding: '10px 15px', borderRadius: 2, border: `1px solid ${T.border}`,
                      background: T.bgAlt, color: T.textPrimary, fontSize: 13
                    }} />
                  </div>
                  <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{
                    padding: '10px 15px', borderRadius: 2, border: `1px solid ${T.border}`,
                    background: T.bgAlt, color: T.textPrimary, fontSize: 13, cursor: 'pointer'
                  }}>
                    <option value="todos">Todos os Status</option>
                    <option value="PENDENTE_DIRECAO">Pendentes</option>
                    <option value="APROVADO">Aprovados</option>
                    <option value="REJEITADO">Rejeitados</option>
                  </select>
                </div>
                <button onClick={() => setModalRelatorio(true)} style={{
                  padding: '10px 20px', background: T.gradientRedBlack, color: '#FFF', border: 'none',
                  borderRadius: 2, cursor: 'pointer', fontWeight: 600, fontSize: 12, letterSpacing: 0.5,
                  boxShadow: '0 4px 10px rgba(139,0,0,0.2)'
                }}>GERAR RELATÓRIO</button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 50, color: T.textSecondary }}>Carregando dados...</div>
              ) : (
                <div className="table-wrap" style={{ background: T.bgSurface, borderRadius: 2, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.bgAlt, borderBottom: `2px solid ${T.border}` }}>
                        {['ID', 'ESTUDANTE', 'CURSO', 'DATA SAÍDA', 'STATUS', 'AÇÕES'].map(h => (
                          <th key={h} style={{ padding: '15px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textSecondary, letterSpacing: 1 }}>{h}</th>
                        ))}
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
                          <td style={{ padding: '15px 20px', fontWeight: 700, color: T.gold }}>#{p.id}</td>
                          <td style={{ padding: '15px 20px' }}>
                            <div style={{ fontWeight: 600, color: T.textPrimary }}>{p.estudante_nome}</div>
                            <div style={{ fontSize: 11, color: T.textSecondary }}>{p.estudante_email}</div>
                          </td>
                          <td style={{ padding: '15px 20px', color: T.textSecondary }}>{p.estudante_curso || '-'}</td>
                          <td style={{ padding: '15px 20px' }}>
                            <div style={{ fontWeight: 500 }}>{formatarData(p.data_saida)}</div>
                            <div style={{ fontSize: 11, color: T.textSecondary }}>{p.hora_saida}</div>
                          </td>
                          <td style={{ padding: '15px 20px' }}><StatusBadge status={p.estado} /></td>
                          <td style={{ padding: '15px 20px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setModalDetalhes(p)} style={{
                                width: 28, height: 28, borderRadius: 2, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', color: T.textSecondary
                              }}>👁</button>
                              
                              {p.acoes_disponiveis?.includes('aprovar') && (
                                <button onClick={() => abrirModalAprovacao(p.id)} style={{
                                  width: 28, height: 28, borderRadius: 2, border: 'none', background: T.success, color: '#FFF', cursor: 'pointer', fontWeight: 700
                                }}>✓</button>
                              )}
                              
                              {p.acoes_disponiveis?.includes('rejeitar') && (
                                <button onClick={() => rejeitarPedido(p.id)} style={{
                                  width: 28, height: 28, borderRadius: 2, border: 'none', background: T.danger, color: '#FFF', cursor: 'pointer', fontWeight: 700
                                }}>✕</button>
                              )}

                              {p.estado === 'PENDENTE_DIRECAO' && (
                                <button onClick={() => encaminharPedido(p.id)} style={{
                                  width: 28, height: 28, borderRadius: 2, border: `1px solid ${T.gold}`, background: 'transparent', color: T.gold, cursor: 'pointer'
                                }}>➜</button>
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
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                marginBottom: 20, flexWrap: 'wrap', gap: 15
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>Saídas Coletivas</h2>
                <button onClick={() => setModalColetiva(true)} style={{
                  padding: '10px 20px', background: T.gradientGold, color: '#000', border: 'none',
                  borderRadius: 2, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span>➕</span> NOVA COLETIVA
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {coletivas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: T.textSecondary, background: T.bgSurface, borderRadius: 2 }}>
                    Nenhuma saída coletiva criada
                  </div>
                ) : (
                  coletivas.map(c => (
                    <div key={c.id} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, padding: 20, borderRadius: 2, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{c.titulo}</h3>
                        <span style={{ fontSize: 10, fontWeight: 700, color: c.encerrada ? T.textSecondary : T.success }}>
                          {c.encerrada ? 'ENCERRADA' : 'ATIVA'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 15 }}>
                        📅 {c.data_saida?.split('T')[0]} até {c.data_volta?.split('T')[0]}
                      </div>
                      <div style={{ marginBottom: 15 }}>
                        <div style={{ height: 4, background: T.bgAlt, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${((c.total_aceitos || 0) / (c.total_convidados || 1)) * 100}%`, height: '100%', background: T.gold }} />
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: T.textSecondary }}>
                          <span><strong style={{ color: T.textPrimary }}>{c.total_convidados || 0}</strong> Convidados</span>
                          <span><strong style={{ color: T.success }}>{c.total_aceitos || 0}</strong> Aceitaram</span>
                          <span><strong style={{ color: T.danger }}>{c.total_recusados || 0}</strong> Recusaram</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: T.textSecondary, borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 5 }}>
                        Criado por: {c.criador_nome || c.criador}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>Histórico de Relatórios</h2>
                <button onClick={() => setModalRelatorio(true)} style={{ padding: '8px 16px', background: T.gold, border: 'none', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}>NOVO RELATÓRIO</button>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {relatorios.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: T.textSecondary, background: T.bgSurface, borderRadius: 2 }}>
                    Nenhum relatório gerado
                  </div>
                ) : (
                  relatorios.map(r => (
                    <div key={r.id} onClick={() => baixarRelatorio(r.id)} style={{
                      background: T.bgSurface, border: `1px solid ${T.border}`, padding: 15, borderRadius: 2,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: T.textPrimary }}>{r.titulo}</div>
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

      {/* Modal Aprovação */}
      {modalAprovacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center' }} onClick={() => setModalAprovacao(null)}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: T.bgSurface, width: '100%', maxWidth: 450, padding: 30, borderRadius: 2, border: `1px solid ${T.border}`, boxShadow: T.shadowHover }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, paddingBottom: 10, display: 'inline-block' }}>APROVAR PEDIDO #{modalAprovacao}</h2>
            
            <div style={{ display: 'grid', gap: 15 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>DATA SAÍDA</label>
                <input type="date" value={dadosAprovacao.data_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, data_saida: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>HORA SAÍDA</label>
                <input type="time" value={dadosAprovacao.hora_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_saida: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>DATA VOLTA</label>
                  <input type="date" value={dadosAprovacao.data_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, data_volta: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>HORA VOLTA</label>
                  <input type="time" value={dadosAprovacao.hora_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_volta: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 25 }}>
              <button onClick={() => setModalAprovacao(null)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', fontWeight: 600 }}>CANCELAR</button>
              <button onClick={confirmarAprovacao} style={{ flex: 1, padding: 12, background: T.success, color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Relatório */}
      {modalRelatorio && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center' }} onClick={() => setModalRelatorio(null)}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: T.bgSurface, width: '100%', maxWidth: 400, padding: 30, borderRadius: 2, border: `1px solid ${T.border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>GERAR RELATÓRIO</h2>
            <div style={{ display: 'grid', gap: 15 }}>
              <input type="date" value={dadosRelatorio.data_inicio} onChange={e => setDadosRelatorio({...dadosRelatorio, data_inicio: e.target.value})} style={{ padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
              <input type="date" value={dadosRelatorio.data_fim} onChange={e => setDadosRelatorio({...dadosRelatorio, data_fim: e.target.value})} style={{ padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalRelatorio(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer' }}>FECHAR</button>
              <button onClick={gerarRelatorio} disabled={gerandoRelatorio} style={{ flex: 1, padding: 10, background: T.gold, border: 'none', cursor: 'pointer', fontWeight: 600 }}>{gerandoRelatorio ? 'GERANDO...' : 'GERAR'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Coletiva */}
      {modalColetiva && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center' }} onClick={() => setModalColetiva(false)}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ background: T.bgSurface, width: '100%', maxWidth: 480, padding: 30, borderRadius: 2, border: `1px solid ${T.border}`, boxShadow: T.shadowHover }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, borderBottom: `2px solid ${T.gold}`, paddingBottom: 10, display: 'inline-block' }}>NOVA SAÍDA COLETIVA</h2>
            
            <div style={{ display: 'grid', gap: 15 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>TÍTULO *</label>
                <input type="text" placeholder="Ex: Visita ao Museu" value={dadosColetiva.titulo} onChange={e => setDadosColetiva({...dadosColetiva, titulo: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>DESCRIÇÃO</label>
                <textarea placeholder="Detalhes da saída..." rows={3} value={dadosColetiva.descricao} onChange={e => setDadosColetiva({...dadosColetiva, descricao: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>DATA SAÍDA *</label>
                  <input type="datetime-local" value={dadosColetiva.data_saida} onChange={e => setDadosColetiva({...dadosColetiva, data_saida: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>DATA VOLTA *</label>
                  <input type="datetime-local" value={dadosColetiva.data_volta} onChange={e => setDadosColetiva({...dadosColetiva, data_volta: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, display: 'block', marginBottom: 5 }}>PRAZO PARA RESPOSTA (horas)</label>
                <input type="number" min="1" max="72" value={dadosColetiva.prazo_horas} onChange={e => setDadosColetiva({...dadosColetiva, prazo_horas: e.target.value})} style={{ width: '100%', padding: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textPrimary }} />
                <small style={{ fontSize: 10, color: T.textSecondary }}>Padrão: 24 horas</small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 25 }}>
              <button onClick={() => setModalColetiva(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', fontWeight: 600 }}>CANCELAR</button>
              <button onClick={criarColetiva} disabled={criandoColetiva} style={{ flex: 1, padding: 12, background: T.gradientGold, color: '#000', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{criandoColetiva ? 'CRIANDO...' : 'CRIAR COLETIVA'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdministracao;

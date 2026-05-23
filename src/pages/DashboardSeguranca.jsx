// src/pages/DashboardSeguranca.jsx - DESIGN PROFISSIONAL 2026
import { useState, useEffect, useMemo } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // === ESTADOS (Preservados para compatibilidade com backend) ===
  const [pedidosSaida, setPedidosSaida] = useState([]);
  const [pedidosAndamento, setPedidosAndamento] = useState([]);
  const [pedidosFinalizados, setPedidosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('saida');
  
  // ✅ FIX: Data inicializada corretamente com hoje
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [relatorio, setRelatorio] = useState(null);
  const [mostrarModalData, setMostrarModalData] = useState(false);
  const [dataRelatorio, setDataRelatorio] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [enviando, setEnviando] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [stats, setStats] = useState({ saidas_hoje: 0, em_andamento: 0, atrasos_hoje: 0 });
  const [filtroNome, setFiltroNome] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // === EFEITOS ===
  useEffect(() => {
    const atualizarHora = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    carregarDashboard();
    carregarDados();
    carregarNotificacoes();
  }, [dataSelecionada]);

  // === FUNÇÕES DE BACKEND (INTACTAS) ===
  const carregarDashboard = async () => {
    try {
      const res = await api.get('/seguranca/dashboard/');
      setStats(res.data);
    } catch (err) { console.error('Erro dashboard:', err); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) { console.error('Erro notificações:', err); }
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seguranca/saidas-data/?data=${dataSelecionada}`);
      const dados = response.data.saidas || [];
      setPedidosSaida(dados.filter(p => p.estado === 'APROVADO'));
      setPedidosAndamento(dados.filter(p => p.estado === 'EM_ANDAMENTO'));
      setPedidosFinalizados(dados.filter(p => p.estado === 'FINALIZADO'));
    } catch (err) {
      console.error('Erro carregar dados:', err);
      try {
        const res = await api.get('/pedidos/');
        const todos = res.data.pedidos || [];
        const filtrados = todos.filter(p => {
          const dataPedido = p.data_saida_confirmada?.split(' ')[0] || p.data_saida?.split(' ')[0];
          return dataPedido === dataSelecionada && 
            ['APROVADO', 'EM_ANDAMENTO', 'FINALIZADO'].includes(p.estado);
        });
        setPedidosSaida(filtrados.filter(p => p.estado === 'APROVADO'));
        setPedidosAndamento(filtrados.filter(p => p.estado === 'EM_ANDAMENTO'));
        setPedidosFinalizados(filtrados.filter(p => p.estado === 'FINALIZADO'));
      } catch (err2) { console.error('Fallback erro:', err2); }
    } finally { setLoading(false); }
  };

  const marcarSaida = async (pedidoId) => {
    if (!window.confirm('Confirmar registro de saída?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      alert(`Saída registrada às ${response.data.hora}`);
      carregarDados(); carregarDashboard();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Falha ao registrar saída'));
    }
  };

  const marcarSaidaAjustada = async (pedidoId) => {
    const hora = window.prompt('Informe a hora da saída (HH:MM):');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
      alert('Formato inválido. Use HH:MM');
      return;
    }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, { hora_saida: hora });
      alert(`Saída registrada: ${response.data.hora}`);
      carregarDados();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Falha'));
    }
  };

  const marcarRetorno = async (pedidoId) => {
    if (!window.confirm('Confirmar registro de retorno?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`);
      let msg = `Retorno registrado às ${response.data.hora}`;
      if (response.data.atrasado) msg += `\n⚠ Atenção: ${response.data.tempo_atraso} minutos de atraso`;
      alert(msg);
      carregarDados(); carregarDashboard();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Falha'));
    }
  };

  const marcarRetornoAjustado = async (pedidoId) => {
    const hora = window.prompt('Informe a hora do retorno (HH:MM):');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
      alert('Formato inválido. Use HH:MM');
      return;
    }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, { hora_retorno: hora });
      alert(`Retorno registrado: ${response.data.hora}`);
      carregarDados();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Falha'));
    }
  };

  const gerarRelatorioCompleto = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seguranca/relatorio-completo/?data=${dataRelatorio}`);
      setRelatorio(response.data);
      setMostrarModalData(false);
      alert('Relatório gerado com sucesso');
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao gerar relatório: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const enviarRelatorio = async () => {
    if (!relatorio) return;
    setEnviando(true);
    try {
      await api.post('/seguranca/enviar-relatorio/', { 
        data: relatorio.data,
        conteudo: relatorio.texto_relatorio 
      });
      alert('Relatório enviado para DITE');
      setRelatorio(null);
    } catch (err) {
      alert('Erro ao enviar: ' + (err.response?.data?.error || err.message));
    } finally { setEnviando(false); }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    return new Date(dataStr).toLocaleDateString('pt-BR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  // === FILTRO CLIENT-SIDE ===
  const filtrarPorNome = (lista) => {
    if (!filtroNome.trim()) return lista;
    const termo = filtroNome.toLowerCase();
    return lista.filter(p => 
      p.estudante_nome?.toLowerCase().includes(termo) ||
      p.estudante_curso?.toLowerCase().includes(termo)
    );
  };

  const saidaFiltrada = useMemo(() => filtrarPorNome(pedidosSaida), [pedidosSaida, filtroNome]);
  const andamentoFiltrado = useMemo(() => filtrarPorNome(pedidosAndamento), [pedidosAndamento, filtroNome]);
  const finalizadosFiltrado = useMemo(() => filtrarPorNome(pedidosFinalizados), [pedidosFinalizados, filtroNome]);

  // === ESTILOS MODERNOS ===
  const styles = {
    container: {
      display: 'flex', minHeight: '100vh', background: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#0F172A', fontSize: '14px'
    },
    
    // Sidebar
    sidebar: {
      width: 240, background: '#FFFFFF', borderRight: '1px solid #E2E8F0',
      padding: 20, display: 'flex', flexDirection: 'column', flexShrink: 0,
      transition: 'transform 0.3s ease', zIndex: 50
    },
    brand: {
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 4
    },
    brandIcon: {
      width: 36, height: 36, borderRadius: 10,
      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FFFFFF', fontSize: 16
    },
    brandText: { fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px' },
    
    userInfo: {
      display: 'flex', alignItems: 'center', gap: 12, padding: 14,
      background: '#F8FAFC', borderRadius: 12, marginBottom: 24, border: '1px solid #E2E8F0'
    },
    avatar: {
      width: 40, height: 40, borderRadius: 10,
      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FFFFFF', fontWeight: 600, fontSize: 16
    },
    userName: { fontSize: 14, fontWeight: 600, color: '#0F172A' },
    userRole: { fontSize: 12, color: '#64748B' },
    
    nav: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'auto' },
    navItem: {
      padding: '10px 14px', borderRadius: 8, border: 'none', background: 'transparent',
      textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#64748B',
      cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10
    },
    navActive: {
      background: 'linear-gradient(90deg, rgba(37,99,235,0.08) 0%, transparent 100%)',
      color: '#2563EB', fontWeight: 600, borderLeft: '3px solid #2563EB', paddingLeft: 11
    },
    logoutBtn: {
      padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA',
      borderRadius: 8, color: '#DC2626', fontWeight: 500, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 16
    },
    
    // Main
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
    
    // Header
    header: {
      height: 64, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 20 },
    pageTitle: { fontSize: 18, fontWeight: 600, color: '#0F172A' },
    pageSubtitle: { fontSize: 13, color: '#64748B' },
    clock: {
      background: '#EFF6FF', color: '#2563EB', padding: '5px 14px',
      borderRadius: 20, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      border: '1px solid #DBEAFE'
    },
    headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
    
    // Toolbar
    toolbar: {
      padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      gap: 16, flexWrap: 'wrap'
    },
    tabs: {
      display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 10,
      border: '1px solid #E2E8F0'
    },
    tabBtn: {
      padding: '7px 18px', border: 'none', background: 'transparent',
      borderRadius: 7, fontSize: 13, fontWeight: 500, color: '#64748B',
      cursor: 'pointer', transition: 'all 0.15s'
    },
    tabActive: {
      background: '#FFFFFF', color: '#0F172A', fontWeight: 600,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0'
    },
    
    // Search
    searchBox: {
      position: 'relative', width: 280, display: 'flex', alignItems: 'center'
    },
    searchInput: {
      width: '100%', padding: '9px 14px 9px 38px', border: '1px solid #E2E8F0',
      borderRadius: 10, fontSize: 13, outline: 'none', background: '#FFFFFF',
      transition: 'border-color 0.15s, box-shadow 0.15s'
    },
    searchIcon: {
      position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
      color: '#94A3B8', fontSize: 13
    },
    
    // Buttons
    btnPrimary: {
      padding: '9px 18px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 13,
      fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)', transition: 'transform 0.1s, box-shadow 0.1s'
    },
    btnOutline: {
      padding: '9px 18px', background: '#FFFFFF', border: '1px solid #E2E8F0',
      borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
      color: '#475569', display: 'flex', alignItems: 'center', gap: 8,
      transition: 'all 0.15s'
    },
    
    // Table
    tableContainer: {
      flex: 1, margin: '0 24px 24px', background: '#FFFFFF',
      border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    thead: {
      position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 5,
      borderBottom: '1px solid #E2E8F0'
    },
    th: {
      textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#64748B',
      textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.4px'
    },
    td: {
      padding: '14px 20px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle',
      color: '#0F172A'
    },
    
    // Table Cells
    userCell: { display: 'flex', alignItems: 'center', gap: 12 },
    avatarCell: {
      width: 36, height: 36, borderRadius: 8, background: '#E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: 13, color: '#475569'
    },
    userInfoCell: { display: 'flex', flexDirection: 'column', gap: 2 },
    userNameCell: { fontWeight: 600, fontSize: 14 },
    userCourseCell: { fontSize: 12, color: '#64748B' },
    
    // Badges
    badge: {
      padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 4
    },
    badgePending: { background: '#FEF9C3', color: '#854D0E' },
    badgeActive: { background: '#EFF6FF', color: '#2563EB' },
    badgeDone: { background: '#DCFCE7', color: '#166534' },
    badgeLate: { background: '#FEE2E2', color: '#991B1B' },
    
    // Action Buttons
    actionBtn: {
      padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 12,
      fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
      display: 'inline-flex', alignItems: 'center', gap: 6
    },
    btnConfirm: {
      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#FFFFFF',
      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)'
    },
    btnReturn: { background: '#EF4444', color: '#FFFFFF' },
    btnAdjust: { background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569' },
    
    // Modal
    modalOverlay: {
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, opacity: 0, visibility: 'hidden',
      transition: 'all 0.25s ease'
    },
    modalOverlayOpen: { opacity: 1, visibility: 'visible' },
    modalBox: {
      background: '#FFFFFF', width: '90%', maxWidth: 520, borderRadius: 20,
      padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transform: 'scale(0.98)', transition: 'transform 0.25s ease'
    },
    modalBoxOpen: { transform: 'scale(1)' },
    modalHeader: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E2E8F0'
    },
    modalTitle: { fontSize: 18, fontWeight: 600, color: '#0F172A' },
    modalClose: {
      width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0',
      background: '#FFFFFF', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#64748B',
      transition: 'all 0.15s'
    },
    modalBody: { display: 'flex', flexDirection: 'column', gap: 16 },
    modalFooter: {
      marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0',
      display: 'flex', gap: 12, justifyContent: 'flex-end'
    },
    formLabel: { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 },
    formInput: {
      padding: '11px 14px', border: '1px solid #E2E8F0', borderRadius: 10,
      fontSize: 14, outline: 'none', width: '100%', background: '#FFFFFF',
      transition: 'border-color 0.15s, box-shadow 0.15s'
    },
    
    // Notifications
    notifPanel: {
      position: 'fixed', top: 0, right: 0, width: 360, height: '100vh',
      background: '#FFFFFF', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      zIndex: 200, display: 'flex', flexDirection: 'column'
    },
    notifHeader: {
      padding: 20, borderBottom: '1px solid #E2E8F0',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    notifList: { flex: 1, overflowY: 'auto' },
    notifItem: {
      padding: 16, borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
      transition: 'background 0.15s'
    },
    
    // Empty State
    emptyState: {
      textAlign: 'center', padding: 60, color: '#64748B', fontSize: 14
    },
    
    // Loading
    loading: { textAlign: 'center', padding: 60, color: '#64748B' },
    spinner: {
      width: 32, height: 32, border: '3px solid #E2E8F0',
      borderTopColor: '#2563EB', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
    },
  };

  return (
    <div style={styles.container}>
      {/* CSS Global */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .modal-overlay.open { opacity: 1; visibility: visible; }
        .modal-overlay.open .modal-box { transform: scale(1); }
        @media (max-width: 1024px) {
          .sidebar { position: fixed; left: -240px; height: 100vh; }
          .sidebar.open { left: 0; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}><i className="fas fa-shield-alt"></i></div>
          <span style={styles.brandText}>Controle</span>
        </div>
        
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {(user?.nome || user?.username || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.userName}>{user?.nome || user?.username}</div>
            <div style={styles.userRole}>Segurança</div>
          </div>
        </div>
        
        <nav style={styles.nav}>
          <button 
            onClick={() => { setAbaAtiva('saida'); setSidebarOpen(false); }}
            style={{...styles.navItem, ...(abaAtiva === 'saida' && styles.navActive)}}
          >
            <i className="fas fa-sign-out-alt" style={{width: 16}}></i>
            Saída
          </button>
          <button 
            onClick={() => { setAbaAtiva('andamento'); setSidebarOpen(false); }}
            style={{...styles.navItem, ...(abaAtiva === 'andamento' && styles.navActive)}}
          >
            <i className="fas fa-arrow-right" style={{width: 16}}></i>
            Em Andamento
          </button>
          <button 
            onClick={() => { setAbaAtiva('finalizado'); setSidebarOpen(false); }}
            style={{...styles.navItem, ...(abaAtiva === 'finalizado' && styles.navActive)}}
          >
            <i className="fas fa-check" style={{width: 16}}></i>
            Finalizados
          </button>
        </nav>
        
        <button onClick={onLogout} style={styles.logoutBtn}>
          <i className="fas fa-sign-out-alt"></i> Encerrar sessão
        </button>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40,
        display: 'none', '@media (max-width: 1024px)': { display: 'block' }
      }} />}

      {/* Main Content */}
      <div className="main-wrapper" style={styles.mainWrapper}>
        
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              display: 'none', background: 'none', border: 'none', fontSize: 20,
              cursor: 'pointer', marginRight: 8, color: '#64748B',
              '@media (max-width: 1024px)': { display: 'block' }
            }}>
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 style={styles.pageTitle}>Controle de Acesso</h1>
              <p style={styles.pageSubtitle}>{user?.nome || user?.username} • {horaAtual}</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC',
              padding: '6px 12px', borderRadius: 10, border: '1px solid #E2E8F0'
            }}>
              <i className="fas fa-calendar" style={{color: '#94A3B8', fontSize: 13}}></i>
              <input 
                type="date" 
                value={dataSelecionada} 
                onChange={(e) => setDataSelecionada(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', fontSize: 13,
                  outline: 'none', color: '#0F172A', fontWeight: 500,
                  padding: '4px 0', width: 140
                }}
              />
            </div>
            <button 
              onClick={() => setShowNotificacoes(!showNotificacoes)}
              style={{...styles.btnOutline, padding: '8px 12px'}}
            >
              <i className="fas fa-bell"></i>
              {notificacoesNaoLidas > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                  background: '#EF4444', borderRadius: '50%', border: '2px solid #FFFFFF'
                }} />
              )}
            </button>
            <button onClick={carregarDados} style={{...styles.btnOutline, padding: '8px 12px'}}>
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.tabs}>
            <button 
              onClick={() => setAbaAtiva('saida')}
              style={{...styles.tabBtn, ...(abaAtiva === 'saida' && styles.tabActive)}}
            >
              Saída
            </button>
            <button 
              onClick={() => setAbaAtiva('andamento')}
              style={{...styles.tabBtn, ...(abaAtiva === 'andamento' && styles.tabActive)}}
            >
              Em Andamento
            </button>
            <button 
              onClick={() => setAbaAtiva('finalizado')}
              style={{...styles.tabBtn, ...(abaAtiva === 'finalizado' && styles.tabActive)}}
            >
              Finalizados
            </button>
          </div>
          
          <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
            <div style={styles.searchBox}>
              <i className="fas fa-search" style={styles.searchIcon}></i>
              <input 
                type="text" 
                placeholder="Buscar estudante..." 
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button 
              onClick={() => setMostrarModalData(true)}
              style={styles.btnPrimary}
            >
              <i className="fas fa-file-alt"></i> Relatório
            </button>
          </div>
        </div>

        {/* Table View */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Estudante</th>
                <th style={styles.th}>Curso</th>
                <th style={styles.th}>Horários</th>
                <th style={styles.th}>Status</th>
                <th style={{...styles.th, textAlign: 'right', width: 180}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{...styles.td, textAlign: 'center', padding: 40}}>
                  <div style={styles.spinner}></div>
                  Carregando...
                </td></tr>
              ) : (
                <>
                  {/* Empty States */}
                  {abaAtiva === 'saida' && saidaFiltrada.length === 0 && (
                    <tr><td colSpan="5" style={styles.emptyState}>
                      Nenhum registro de saída pendente
                    </td></tr>
                  )}
                  {abaAtiva === 'andamento' && andamentoFiltrado.length === 0 && (
                    <tr><td colSpan="5" style={styles.emptyState}>
                      Nenhum estudante em andamento
                    </td></tr>
                  )}
                  {abaAtiva === 'finalizado' && finalizadosFiltrado.length === 0 && (
                    <tr><td colSpan="5" style={styles.emptyState}>
                      Nenhum registro finalizado
                    </td></tr>
                  )}

                  {/* SAÍDA */}
                  {abaAtiva === 'saida' && saidaFiltrada.map(p => (
                    <tr key={p.id} style={{transition: 'background 0.15s'}}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={styles.avatarCell}>
                            {p.estudante_nome?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div style={styles.userInfoCell}>
                            <span style={styles.userNameCell}>{p.estudante_nome}</span>
                            <span style={styles.userCourseCell}>{p.estudante_matricula || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{color: '#475569'}}>{p.estudante_curso || '-'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4}}>
                          <div><span style={{color: '#64748B'}}>Saída: </span><strong>{p.hora_saida_prevista || '-'}</strong></div>
                          <div><span style={{color: '#64748B'}}>Retorno: </span><strong>{p.hora_volta_prevista || '-'}</strong></div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, ...styles.badgePending}}>Pendente</span>
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button 
                          onClick={() => marcarSaidaAjustada(p.id)}
                          style={{...styles.actionBtn, ...styles.btnAdjust, marginRight: 6}}
                          title="Ajustar horário"
                        >
                          <i className="fas fa-clock"></i>
                        </button>
                        <button 
                          onClick={() => marcarSaida(p.id)}
                          style={{...styles.actionBtn, ...styles.btnConfirm}}
                        >
                          Registrar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* ANDAMENTO */}
                  {abaAtiva === 'andamento' && andamentoFiltrado.map(p => (
                    <tr key={p.id} style={{transition: 'background 0.15s'}}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={{...styles.avatarCell, background: '#DBEAFE', color: '#2563EB'}}>
                            {p.estudante_nome?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div style={styles.userInfoCell}>
                            <span style={styles.userNameCell}>{p.estudante_nome}</span>
                            <span style={styles.userCourseCell}>{p.estudante_matricula || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{color: '#475569'}}>{p.estudante_curso || '-'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4}}>
                          <div><span style={{color: '#64748B'}}>Saiu: </span><strong style={{color: '#166534'}}>{p.hora_saida_real || '-'}</strong></div>
                          <div><span style={{color: '#64748B'}}>Prev. Retorno: </span><strong>{p.hora_volta_prevista || '-'}</strong></div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, ...styles.badgeActive}}>Em andamento</span>
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button 
                          onClick={() => marcarRetornoAjustado(p.id)}
                          style={{...styles.actionBtn, ...styles.btnAdjust, marginRight: 6}}
                          title="Ajustar horário"
                        >
                          <i className="fas fa-clock"></i>
                        </button>
                        <button 
                          onClick={() => marcarRetorno(p.id)}
                          style={{...styles.actionBtn, ...styles.btnReturn}}
                        >
                          Registrar retorno
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* FINALIZADO */}
                  {abaAtiva === 'finalizado' && finalizadosFiltrado.map(p => (
                    <tr key={p.id} style={{
                      transition: 'background 0.15s',
                      background: p.atrasado ? '#FEF2F2' : 'transparent'
                    }}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={{...styles.avatarCell, background: '#D1FAE5', color: '#059669'}}>
                            {p.estudante_nome?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div style={styles.userInfoCell}>
                            <span style={styles.userNameCell}>{p.estudante_nome}</span>
                            <span style={styles.userCourseCell}>{p.estudante_matricula || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{color: '#475569'}}>{p.estudante_curso || '-'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4}}>
                          <div><span style={{color: '#64748B'}}>Saída: </span>{p.hora_saida_real || '-'}</div>
                          <div><span style={{color: '#64748B'}}>Retorno: </span>{p.hora_retorno_real || '-'}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {p.atrasado ? (
                          <span style={{...styles.badge, ...styles.badgeLate}}>
                            <i className="fas fa-exclamation" style={{fontSize: 9}}></i>
                            Atraso {p.tempo_atraso}m
                          </span>
                        ) : (
                          <span style={{...styles.badge, ...styles.badgeDone}}>Concluído</span>
                        )}
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button 
                          style={{...styles.actionBtn, ...styles.btnAdjust}}
                          disabled
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Selecionar Data para Relatório */}
      <div 
        className={`modal-overlay ${mostrarModalData ? 'open' : ''}`} 
        onClick={() => setMostrarModalData(false)}
      >
        <div className={`modal-box ${mostrarModalData ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <span style={styles.modalTitle}>Gerar Relatório</span>
            <button onClick={() => setMostrarModalData(false)} style={styles.modalClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div style={styles.modalBody}>
            <label style={styles.formLabel}>Data do relatório</label>
            <input 
              type="date" 
              value={dataRelatorio} 
              onChange={(e) => setDataRelatorio(e.target.value)} 
              style={styles.formInput}
            />
          </div>
          <div style={styles.modalFooter}>
            <button 
              onClick={() => setMostrarModalData(false)} 
              style={styles.btnOutline}
            >
              Cancelar
            </button>
            <button 
              onClick={gerarRelatorioCompleto} 
              style={styles.btnPrimary}
            >
              Gerar relatório
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Relatório Completo */}
      {relatorio && (
        <div className="modal-overlay open" onClick={() => setRelatorio(null)}>
          <div style={{
            ...styles.modalBox, maxWidth: 700, maxHeight: '80vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }} className="modal-box open" onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Relatório • {relatorio.data}</span>
              <button onClick={() => setRelatorio(null)} style={styles.modalClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{...styles.modalBody, flex: 1, overflowY: 'auto', padding: '0 24px 24px'}}>
              {/* Resumo */}
              <div style={{
                background: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 20,
                border: '1px solid #E2E8F0'
              }}>
                <div style={{fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12}}>
                  Resumo do dia
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13
                }}>
                  <div><span style={{color: '#64748B'}}>Total autorizado:</span> <strong>{relatorio.total_autorizados}</strong></div>
                  <div><span style={{color: '#64748B'}}>Saídas registradas:</span> <strong>{relatorio.saidas_registradas}</strong></div>
                  <div><span style={{color: '#64748B'}}>Retornos registrados:</span> <strong>{relatorio.retornos_registrados}</strong></div>
                  <div><span style={{color: '#64748B'}}>Atrasos:</span> <strong style={{color: '#DC2626'}}>{relatorio.atrasos}</strong></div>
                </div>
              </div>
              
              {/* Lista */}
              <div style={{fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12}}>
                Lista completa
              </div>
              <div style={{border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden'}}>
                <table style={{...styles.table, fontSize: 12}}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>Estudante</th>
                      <th style={styles.th}>Saída</th>
                      <th style={styles.th}>Retorno</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.lista_completa?.map((item, idx) => (
                      <tr key={idx} style={item.atrasado ? {background: '#FEF2F2'} : {}}>
                        <td style={styles.td}>{item.estudante}</td>
                        <td style={styles.td}>{item.hora_saida_real || '—'}</td>
                        <td style={styles.td}>{item.hora_retorno_real || '—'}</td>
                        <td style={styles.td}>
                          {item.atrasado ? (
                            <span style={{...styles.badge, ...styles.badgeLate}}>Atrasado</span>
                          ) : item.hora_retorno_real ? (
                            <span style={{...styles.badge, ...styles.badgeDone}}>Concluído</span>
                          ) : item.hora_saida_real ? (
                            <span style={{...styles.badge, ...styles.badgeActive}}>Fora</span>
                          ) : (
                            <span style={{...styles.badge, ...styles.badgePending}}>Aguardando</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{...styles.modalFooter, padding: 16, background: '#F8FAFC', margin: 0}}>
              <button 
                onClick={() => window.open(
                  `data:text/plain;charset=utf-8,${encodeURIComponent(relatorio.texto_relatorio)}`, 
                  '_blank'
                )} 
                style={styles.btnOutline}
              >
                <i className="fas fa-file-alt"></i> Texto
              </button>
              <button 
                onClick={enviarRelatorio} 
                disabled={enviando}
                style={styles.btnPrimary}
              >
                {enviando ? 'Enviando...' : 'Enviar para DITE'}
              </button>
              <button 
                onClick={() => setRelatorio(null)} 
                style={styles.btnOutline}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações */}
      {showNotificacoes && (
        <>
          <div onClick={() => setShowNotificacoes(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 199
          }} />
          <div style={styles.notifPanel}>
            <div style={styles.notifHeader}>
              <span style={{fontSize: 16, fontWeight: 600}}>Notificações</span>
              <button onClick={() => setShowNotificacoes(false)} style={styles.modalClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={styles.notifList}>
              {notificacoes.length === 0 ? (
                <div style={styles.emptyState}>Sem notificações</div>
              ) : (
                notificacoes.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => { marcarNotificacaoLida(n.id); if(n.pedido_id) window.location.href = `/pedido/${n.pedido_id}`; }}
                    style={{
                      ...styles.notifItem,
                      background: n.lida ? '#FFFFFF' : '#FEFCE8',
                      borderLeft: n.lida ? 'none' : '3px solid #F59E0B'
                    }}
                  >
                    <div style={{fontSize: 13, color: '#0F172A', marginBottom: 4, lineHeight: 1.4}}>
                      {n.mensagem}
                    </div>
                    <div style={{fontSize: 11, color: '#94A3B8'}}>{n.data}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardSeguranca;

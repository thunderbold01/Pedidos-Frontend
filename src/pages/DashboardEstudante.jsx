// src/pages/DashboardEstudante.jsx - VERSÃO MODERNA E RESPONSIVA
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardEstudante = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [coletivas, setColetivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const navigate = useNavigate();

  // Relógio
  useEffect(() => {
    const atualizarHora = () => {
      const now = new Date();
      setHoraAtual(now.toLocaleTimeString('pt-BR'));
    };
    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarColetivas();
    carregarNotificacoes();
  }, []);

  const carregarDados = async () => {
    try {
      const res = await api.get('/pedidos/');
      setPedidos(res.data.pedidos || []);
    } catch (err) { 
      console.error('Erro:', err); 
    }
  };

  const carregarColetivas = async () => {
    try {
      const res = await api.get('/coletivas/minhas/');
      setColetivas(res.data.coletivas || []);
    } catch (err) { 
      console.error('Erro coletivas:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  };

  const aceitarColetiva = async (conviteId) => {
    if (!confirm('✅ Aceitar esta saída coletiva?')) return;
    try {
      await api.post(`/coletivas/${conviteId}/aceitar/`);
      alert('✅ Pedido aceito com sucesso! Você está autorizado a sair.');
      carregarColetivas();
      carregarDados();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao aceitar'));
    }
  };

  const getStatusInfo = (estado) => {
    const mapa = {
      'PENDENTE_DITE': { texto: 'Pendente', cor: '#D97706', bg: '#FEF9C3', icon: '⏳' },
      'PENDENTE_DIRECAO': { texto: 'Em análise', cor: '#7C3AED', bg: '#EDE9FE', icon: '🔍' },
      'PENDENTE_ADMIN': { texto: 'Aguardando', cor: '#2563EB', bg: '#DBEAFE', icon: '⏰' },
      'APROVADO': { texto: 'Aprovado', cor: '#059669', bg: '#DCFCE7', icon: '✅' },
      'REJEITADO': { texto: 'Rejeitado', cor: '#DC2626', bg: '#FEE2E2', icon: '❌' },
      'EM_ANDAMENTO': { texto: 'Em saída', cor: '#0284C7', bg: '#E0F2FE', icon: '🚶' },
      'FINALIZADO': { texto: 'Finalizado', cor: '#64748B', bg: '#F1F5F9', icon: '🏁' },
    };
    return mapa[estado] || { texto: estado, cor: '#64748B', bg: '#F1F5F9', icon: '📋' };
  };

  const pedidosFiltrados = filtroStatus === 'todos' 
    ? pedidos 
    : pedidos.filter(p => p.estado === filtroStatus);

  const pendentesCount = pedidos.filter(p => 
    ['PENDENTE_DITE', 'PENDENTE_DIRECAO', 'PENDENTE_ADMIN'].includes(p.estado)
  ).length;

  const aprovadosCount = pedidos.filter(p => p.estado === 'APROVADO').length;
  const concluidosCount = pedidos.filter(p => p.estado === 'FINALIZADO').length;

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #F8FAFC; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        .animate-fade { animation: fadeIn 0.3s ease-out; }
        
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; left: -280px !important; transition: left 0.3s ease !important; }
          .sidebar.open { left: 0 !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}><i className="fas fa-graduation-cap"></i></div>
          <div style={styles.brandText}>Estudante</div>
        </div>
        
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'E'}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.nome || user?.username}</div>
            <div style={styles.userRole}>
              <i className="fas fa-graduation-cap"></i> Estudante
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          <button onClick={() => navigate('/dashboard')} style={styles.navItem}>
            <i className="fas fa-home"></i> Início
          </button>
          <button onClick={() => navigate('/criar-pedido')} style={{...styles.navItem, ...styles.navItemPrimary}}>
            <i className="fas fa-plus-circle"></i> Novo Pedido
          </button>
          <button onClick={() => navigate('/coletivas')} style={{...styles.navItem, ...styles.navItemWarning}}>
            <i className="fas fa-users"></i> Coletivas
            {coletivas.length > 0 && <span style={styles.navBadge}>{coletivas.length}</span>}
          </button>
          <button onClick={() => navigate('/notificacoes')} style={styles.navItem}>
            <i className="fas fa-bell"></i> Notificações
            {notificacoesNaoLidas > 0 && <span style={styles.navBadge}>{notificacoesNaoLidas}</span>}
          </button>
        </nav>

        <button onClick={onLogout} style={styles.logoutBtn}>
          <i className="fas fa-sign-out-alt"></i> Sair
        </button>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={styles.overlay} />}

      {/* Main Content */}
      <div className="main-content" style={styles.mainContent}>
        {/* Header */}
        <header style={styles.header}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuToggle}>
            <i className="fas fa-bars"></i>
          </button>
          <div style={styles.headerTitle}>
            <h1>🎓 Olá, {user?.nome?.split(' ')[0] || user?.username}</h1>
            <p>{horaAtual}</p>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => navigate('/notificacoes')} style={styles.iconBtn}>
              <i className="fas fa-bell"></i>
              {notificacoesNaoLidas > 0 && <span style={styles.headerBadge}>{notificacoesNaoLidas}</span>}
            </button>
          </div>
        </header>

        {/* Welcome Banner */}
        <div style={styles.welcomeBanner}>
          <div>
            <h2>Bem-vindo ao Sistema de Pedidos</h2>
            <p>Gerencie suas saídas escolares de forma rápida e fácil</p>
          </div>
          <div style={styles.bannerIcon}>
            <i className="fas fa-paper-plane"></i>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#FEF9C3', color: '#D97706'}}>
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <div style={styles.statValue}>{pendentesCount}</div>
              <div style={styles.statLabel}>Pedidos Pendentes</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#DCFCE7', color: '#059669'}}>
              <i className="fas fa-check-circle"></i>
            </div>
            <div>
              <div style={styles.statValue}>{aprovadosCount}</div>
              <div style={styles.statLabel}>Aprovados</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: '#EFF6FF', color: '#2563EB'}}>
              <i className="fas fa-flag-checkered"></i>
            </div>
            <div>
              <div style={styles.statValue}>{concluidosCount}</div>
              <div style={styles.statLabel}>Concluídos</div>
            </div>
          </div>
        </div>

        {/* Coletivas Pendentes - Destaque */}
        {coletivas.length > 0 && (
          <div style={styles.coletivasBanner}>
            <div style={styles.coletivasHeader}>
              <i className="fas fa-bus"></i>
              <h3>Saídas Coletivas Disponíveis</h3>
              <span style={styles.coletivasCount}>{coletivas.length}</span>
            </div>
            <div style={styles.coletivasList}>
              {coletivas.map(c => (
                <div key={c.id} style={styles.coletivaCard}>
                  <div style={styles.coletivaInfo}>
                    <div style={styles.coletivaTitle}>{c.titulo}</div>
                    <div style={styles.coletivaDate}>
                      <i className="fas fa-calendar"></i> {c.data_saida}
                    </div>
                  </div>
                  <button onClick={() => aceitarColetiva(c.id)} style={styles.coletivaBtn}>
                    <i className="fas fa-check"></i> Aceitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={styles.filtersBar}>
          <button 
            onClick={() => setFiltroStatus('todos')} 
            style={{...styles.filterBtn, ...(filtroStatus === 'todos' && styles.filterActive)}}
          >
            Todos
          </button>
          <button 
            onClick={() => setFiltroStatus('PENDENTE_DITE')} 
            style={{...styles.filterBtn, ...(filtroStatus === 'PENDENTE_DITE' && styles.filterActive)}}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setFiltroStatus('APROVADO')} 
            style={{...styles.filterBtn, ...(filtroStatus === 'APROVADO' && styles.filterActive)}}
          >
            Aprovados
          </button>
          <button 
            onClick={() => setFiltroStatus('FINALIZADO')} 
            style={{...styles.filterBtn, ...(filtroStatus === 'FINALIZADO' && styles.filterActive)}}
          >
            Finalizados
          </button>
        </div>

        {/* Lista de Pedidos */}
        <div style={styles.pedidosContainer}>
          <div style={styles.pedidosHeader}>
            <h3><i className="fas fa-clipboard-list"></i> Meus Pedidos</h3>
            <span style={styles.pedidosCount}>{pedidosFiltrados.length} pedidos</span>
          </div>

          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <p>Carregando...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div style={styles.emptyState}>
              <i className="fas fa-inbox" style={{ fontSize: 56, color: '#CBD5E1', marginBottom: 16 }}></i>
              <p>Você ainda não tem pedidos</p>
              <button onClick={() => navigate('/criar-pedido')} style={styles.emptyBtn}>
                <i className="fas fa-plus"></i> Criar primeiro pedido
              </button>
            </div>
          ) : (
            <div style={styles.pedidosList}>
              {pedidosFiltrados.map(p => {
                const st = getStatusInfo(p.estado);
                return (
                  <div 
                    key={p.id} 
                    onClick={() => navigate(`/pedido/${p.id}`)} 
                    style={styles.pedidoCard}
                  >
                    <div style={styles.pedidoHeader}>
                      <div style={styles.pedidoId}>#{p.id}</div>
                      <span style={{...styles.pedidoStatus, background: st.bg, color: st.cor}}>
                        {st.icon} {st.texto}
                      </span>
                    </div>
                    <div style={styles.pedidoBody}>
                      <div style={styles.pedidoTitle}>{p.tipo_display}</div>
                      <div style={styles.pedidoDate}>
                        <i className="fas fa-calendar-alt"></i> {p.data_saida}
                      </div>
                    </div>
                    <div style={styles.pedidoFooter}>
                      <button style={styles.detalhesBtn}>
                        Ver detalhes <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#F8FAFC' },
  
  // Sidebar
  sidebar: {
    width: 280,
    background: '#FFFFFF',
    height: '100vh',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #E2E8F0',
    position: 'sticky',
    top: 0,
    transition: 'left 0.3s ease',
    zIndex: 100,
    '@media (max-width: 768px)': { position: 'fixed', left: '-280px' }
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
  brandIcon: { width: 40, height: 40, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 },
  brandText: { fontSize: 18, fontWeight: 700, color: '#1E293B' },
  userCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#F8FAFC', borderRadius: 16, marginBottom: 24 },
  userAvatar: { width: 48, height: 48, borderRadius: 50, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 18 },
  userName: { fontSize: 14, fontWeight: 600, color: '#1E293B' },
  userRole: { fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  navItem: { padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' },
  navItemPrimary: { background: '#EFF6FF', color: '#2563EB' },
  navItemWarning: { background: '#FEF9C3', color: '#D97706' },
  navBadge: { position: 'absolute', right: 16, background: '#DC2626', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, minWidth: 20, textAlign: 'center' },
  logoutBtn: { padding: '12px 16px', background: '#FEF2F2', border: 'none', borderRadius: 12, color: '#DC2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99, display: 'none', '@media (max-width: 768px)': { display: 'block' } },
  
  // Main content
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', '@media (max-width: 768px)': { marginLeft: 0 } },
  menuToggle: { display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', marginRight: 12, '@media (max-width: 768px)': { display: 'block' } },
  header: { background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  headerTitle: { flex: 1 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 12 },
  iconBtn: { position: 'relative', padding: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer' },
  headerBadge: { position: 'absolute', top: -5, right: -5, background: '#DC2626', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 20 },
  
  // Welcome Banner
  welcomeBanner: { background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 20, padding: '24px', margin: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' },
  bannerIcon: { fontSize: 48, opacity: 0.8 },
  
  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '0 24px', marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #E2E8F0', transition: 'transform 0.2s' },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  statValue: { fontSize: 24, fontWeight: 700, color: '#1E293B' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  
  // Coletivas
  coletivasBanner: { background: '#FEF9C3', borderRadius: 16, margin: '0 24px 24px', overflow: 'hidden', border: '1px solid #FDE68A' },
  coletivasHeader: { background: '#FDE68A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  coletivasCount: { marginLeft: 'auto', background: '#D97706', color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  coletivasList: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  coletivaCard: { background: '#fff', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  coletivaTitle: { fontWeight: 600, color: '#1E293B', marginBottom: 4 },
  coletivaDate: { fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 },
  coletivaBtn: { padding: '8px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  
  // Filters
  filtersBar: { display: 'flex', gap: 8, padding: '0 24px', marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 20, background: '#fff', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', color: '#64748B' },
  filterActive: { background: '#2563EB', color: '#fff', borderColor: '#2563EB' },
  
  // Pedidos
  pedidosContainer: { background: '#fff', margin: '0 24px 24px', borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden' },
  pedidosHeader: { padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  pedidosCount: { fontSize: 13, color: '#64748B', background: '#F1F5F9', padding: '4px 12px', borderRadius: 20 },
  pedidosList: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' },
  pedidoCard: { background: '#F8FAFC', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E2E8F0' },
  pedidoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  pedidoId: { fontSize: 12, color: '#64748B', fontFamily: 'monospace' },
  pedidoStatus: { padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  pedidoTitle: { fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 4 },
  pedidoDate: { fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 },
  pedidoFooter: { marginTop: 12, display: 'flex', justifyContent: 'flex-end' },
  detalhesBtn: { padding: '6px 12px', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#64748B', transition: 'all 0.2s' },
  
  // Loading & Empty
  loading: { textAlign: 'center', padding: 60, color: '#94A3B8' },
  spinner: { width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  emptyState: { textAlign: 'center', padding: 60, color: '#94A3B8' },
  emptyBtn: { marginTop: 16, padding: '10px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 },
};

// CSS adicional
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  .stat-card:hover, .pedido-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .pedido-card:hover .detalhes-btn {
    background: #2563EB;
    color: white;
    border-color: #2563EB;
  }
  
  @media (max-width: 768px) {
    .stats-grid { gap: 8px; }
    .welcome-banner { margin: 16px; padding: 20px; }
    .filters-bar { padding: 0 16px; }
    .pedidos-container { margin: 0 16px 24px; }
    .coletivas-banner { margin: 0 16px 24px; }
  }
`;
document.head.appendChild(styleSheet);

export default DashboardEstudante;

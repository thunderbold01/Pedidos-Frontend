import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [menuAtivo, setMenuAtivo] = useState('todos');
  const [menuMobile, setMenuMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
  }, [filtroEstado, menuAtivo]);

  const carregarDados = async () => {
    try {
      const [pedidosRes, statsRes] = await Promise.all([
        api.get(`/pedidos/${filtroEstado ? `?estado=${filtroEstado}` : ''}`),
        api.get('/dashboard/')
      ]);
      setPedidos(pedidosRes.data.pedidos || pedidosRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      const endpoint = `/pedidos/${pedidoId}/${acao}/`;
      const data = comentario ? { comentario } : {};
      await api.post(endpoint, data);
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro desconhecido';
      if (acao === 'rejeitar' && errorMsg.includes('motivo')) {
        const motivo = prompt('Informe o motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else {
        alert('Erro: ' + errorMsg);
      }
    }
  };

  const getStatusColor = (estado) => {
    const cores = {
      'PENDENTE_DITE': '#10b981',
      'PENDENTE_DIRECAO': '#f59e0b',
      'PENDENTE_ADMIN': '#ef4444',
      'APROVADO': '#10b981',
      'REJEITADO': '#ef4444'
    };
    return cores[estado] || '#6b7280';
  };

  const menuItems = [
    { id: 'todos', label: 'Todos Pedidos', icon: '📋' },
    { id: 'novo', label: 'Novo Pedido', icon: '➕', destaque: true, link: '/criar-pedido' },
    { id: 'notificacoes', label: 'Notificações', icon: '🔔', badge: notificacoesNaoLidas, link: '/notificacoes' },
    { id: 'PENDENTE_DITE', label: 'Pendentes DITE', icon: '🟢' },
    { id: 'PENDENTE_DIRECAO', label: 'Pendentes Direção', icon: '🟡' },
    { id: 'PENDENTE_ADMIN', label: 'Pendentes Admin', icon: '🔴' },
    { id: 'APROVADO', label: 'Aprovados', icon: '✅' },
    { id: 'REJEITADO', label: 'Rejeitados', icon: '❌' },
  ];

  const handleMenuClick = (item) => {
    if (item.link) {
      navigate(item.link);
      return;
    }
    setMenuAtivo(item.id);
    if (item.id === 'todos') {
      setFiltroEstado('');
    } else {
      setFiltroEstado(item.id);
    }
    setMenuMobile(false);
  };

  const getRoleLabel = (role) => {
    const roles = {
      'ADMIN': 'Administrador',
      'DIRECAO': 'Direção',
      'DITE': 'DITE',
      'ESTUDANTE': 'Estudante'
    };
    return roles[role] || role;
  };

  return (
    <div style={styles.container}>
      {/* Menu Mobile Toggle */}
      <button 
        onClick={() => setMenuMobile(!menuMobile)} 
        style={styles.menuToggle}
      >
        {menuMobile ? '✕' : '☰'}
      </button>

      {/* Overlay Mobile */}
      {menuMobile && (
        <div 
          onClick={() => setMenuMobile(false)} 
          style={styles.overlay} 
        />
      )}

      {/* Menu Lateral */}
      <div style={{
        ...styles.sidebar,
        left: menuMobile ? '0' : '-280px',
      }}>
        <div style={styles.sidebarHeader}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user.nome?.charAt(0) || 'U'}
            </div>
            <div style={styles.userDetails}>
              <div style={styles.userName}>{user.nome || user.username}</div>
              <div style={styles.userRole}>{getRoleLabel(user.role)}</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              style={{
                ...styles.navItem,
                backgroundColor: menuAtivo === item.id ? '#f3f4f6' : 'transparent',
                fontWeight: menuAtivo === item.id ? '600' : '400',
                borderLeft: menuAtivo === item.id ? '3px solid #111827' : '3px solid transparent',
                ...(item.destaque && styles.navItemDestaque),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {item.badge > 0 && (
                <span style={styles.navBadge}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={onLogout} style={styles.logoutButton}>
            <span>Sair</span>
            <span>🚪</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={styles.mainContent}>
        {/* Header Stats */}
        <div style={styles.statsBar}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.total_pedidos || 0}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.pedidos_pendentes || 0}</span>
            <span style={styles.statLabel}>Pendentes</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.pedidos_aprovados || 0}</span>
            <span style={styles.statLabel}>Aprovados</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.pedidos_rejeitados || 0}</span>
            <span style={styles.statLabel}>Rejeitados</span>
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.emptyState}>Carregando...</div>
          ) : pedidos.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <div style={styles.emptyText}>Nenhum pedido encontrado</div>
              {user.role === 'ESTUDANTE' && (
                <button
                  onClick={() => navigate('/criar-pedido')}
                  style={styles.emptyButton}
                >
                  Criar Primeiro Pedido
                </button>
              )}
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              {/* Cabeçalho da Tabela */}
              <div style={styles.tableHeader}>
                <div style={{ ...styles.th, width: '80px' }}>ID</div>
                <div style={{ ...styles.th, flex: 2 }}>Estudante</div>
                <div style={{ ...styles.th, flex: 1 }}>Tipo</div>
                <div style={{ ...styles.th, flex: 1 }}>Data</div>
                <div style={{ ...styles.th, flex: 1 }}>Status</div>
                <div style={{ ...styles.th, width: '150px' }}>Ações</div>
              </div>

              {/* Linhas da Tabela */}
              {pedidos.map((pedido, index) => (
                <div 
                  key={pedido.id} 
                  style={{
                    ...styles.tableRow,
                    backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                  }}
                >
                  <div style={{ ...styles.td, width: '80px' }}>
                    <span style={styles.pedidoId}>#{pedido.id}</span>
                  </div>
                  <div style={{ ...styles.td, flex: 2 }}>
                    <div style={styles.estudanteNome}>{pedido.estudante_nome}</div>
                    <div style={styles.estudanteInfo}>
                      {pedido.estudante_curso} • {pedido.estudante_classe}
                    </div>
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    {pedido.tipo_display}
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    <div style={styles.dataInfo}>{pedido.data_saida}</div>
                    <div style={styles.horaInfo}>{pedido.hora_saida}</div>
                  </div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(pedido.estado),
                    }}>
                      {pedido.estado_display}
                    </span>
                  </div>
                  <div style={{ ...styles.td, width: '150px' }}>
                    <div style={styles.acoes}>
                      <button
                        onClick={() => navigate(`/pedido/${pedido.id}`)}
                        style={styles.actionBtn}
                        title="Ver detalhes"
                      >
                        👁️
                      </button>
                      
                      {pedido.acoes_disponiveis?.includes('aprovar') && (
                        <button
                          onClick={() => handleAcao(pedido.id, 'aprovar')}
                          style={{ ...styles.actionBtn, color: '#10b981' }}
                          title="Aprovar"
                        >
                          ✓
                        </button>
                      )}
                      
                      {pedido.acoes_disponiveis?.includes('rejeitar') && (
                        <button
                          onClick={() => handleAcao(pedido.id, 'rejeitar')}
                          style={{ ...styles.actionBtn, color: '#ef4444' }}
                          title="Rejeitar"
                        >
                          ✕
                        </button>
                      )}
                      
                      {pedido.acoes_disponiveis?.includes('passar') && (
                        <button
                          onClick={() => handleAcao(pedido.id, 'passar')}
                          style={{ ...styles.actionBtn, color: '#f59e0b' }}
                          title="Encaminhar"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  menuToggle: {
    display: 'none',
    position: 'fixed',
    top: '15px',
    left: '15px',
    zIndex: 1000,
    width: '44px',
    height: '44px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    '@media (maxWidth: 768px)': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  overlay: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 99,
    '@media (maxWidth: 768px)': {
      display: 'block',
    },
  },
  sidebar: {
    width: '280px',
    minWidth: '280px',
    backgroundColor: 'white',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    transition: 'left 0.3s ease',
    zIndex: 100,
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#111827',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
    flexShrink: 0,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  nav: {
    flex: 1,
    padding: '12px 0',
    overflowY: 'auto',
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'all 0.15s ease',
    textAlign: 'left',
  },
  navItemDestaque: {
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '600',
  },
  navIcon: {
    fontSize: '18px',
    width: '24px',
    textAlign: 'center',
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
  },
  navBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    minWidth: '20px',
    textAlign: 'center',
  },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'all 0.15s ease',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    minWidth: 0,
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px 24px',
    marginBottom: '20px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  statItem: {
    flex: 1,
    minWidth: '80px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: '1.2',
  },
  statLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#e5e7eb',
  },
  tableContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableWrapper: {
    width: '100%',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    gap: '12px',
  },
  th: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    gap: '12px',
    transition: 'background-color 0.1s ease',
  },
  td: {
    fontSize: '14px',
    color: '#374151',
  },
  pedidoId: {
    fontWeight: '600',
    color: '#111827',
    fontSize: '13px',
  },
  estudanteNome: {
    fontWeight: '500',
    color: '#111827',
    fontSize: '14px',
  },
  estudanteInfo: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  dataInfo: {
    fontSize: '13px',
    color: '#374151',
  },
  horaInfo: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '1px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    whiteSpace: 'nowrap',
  },
  acoes: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6b7280',
    transition: 'all 0.15s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#9ca3af',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    marginBottom: '20px',
  },
  emptyButton: {
    padding: '10px 24px',
    backgroundColor: '#111827',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

// Media queries para mobile
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 768px) {
    .menu-toggle-btn {
      display: flex !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;
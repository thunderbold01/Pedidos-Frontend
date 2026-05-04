import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardAdmin = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [menuMobile, setMenuMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
  }, [filtroEstado]);

  const carregarDados = async () => {
    try {
      const [pedidosRes, statsRes] = await Promise.all([
        api.get(`/pedidos/${filtroEstado ? `?estado=${filtroEstado}` : ''}`),
        api.get('/dashboard/')
      ]);
      setPedidos(pedidosRes.data.pedidos || pedidosRes.data);
      setStats(statsRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas);
    } catch (err) {}
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      const data = comentario ? { comentario } : {};
      await api.post(`/pedidos/${pedidoId}/${acao}/`, data);
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && errorMsg.includes('motivo')) {
        const motivo = prompt('Motivo da rejeição:');
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
    { id: 'PENDENTE_ADMIN', label: 'Pendentes Admin', icon: '🔴', destaque: true },
    { id: 'notificacoes', label: 'Notificações', icon: '🔔', badge: notificacoesNaoLidas, link: '/notificacoes' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊', link: '/relatorios' },
  ];

  const handleMenuClick = (item) => {
    if (item.link) { navigate(item.link); return; }
    setFiltroEstado(item.id === 'todos' ? '' : item.id);
    setMenuMobile(false);
  };

  return (
    <div style={styles.container}>
      <button onClick={() => setMenuMobile(!menuMobile)} style={styles.menuToggle}>☰</button>
      
      <div style={{ ...styles.sidebar, left: menuMobile ? '0' : '-280px' }}>
        <div style={styles.sidebarHeader}>
          <div style={{ ...styles.avatar, backgroundColor: '#9C27B0' }}>{user.nome?.charAt(0) || 'A'}</div>
          <div>
            <div style={styles.userName}>{user.nome || user.username}</div>
            <div style={styles.userRole}>👑 Admin</div>
          </div>
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              style={{
                ...styles.navItem,
                backgroundColor: filtroEstado === item.id || (item.id === 'todos' && !filtroEstado) ? '#f3f4f6' : 'transparent',
                fontWeight: filtroEstado === item.id || (item.id === 'todos' && !filtroEstado) ? '600' : '400',
                borderLeft: filtroEstado === item.id || (item.id === 'todos' && !filtroEstado) ? '3px solid #111827' : '3px solid transparent',
                ...(item.destaque && styles.navItemDestaque),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && <span style={styles.navBadge}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        
        <div style={styles.sidebarFooter}>
          <button onClick={onLogout} style={styles.logoutButton}>🚪 Sair</button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.statsBar}>
          <div style={styles.statItem}><span style={styles.statValue}>{stats.total_pedidos || 0}</span><span style={styles.statLabel}>Total</span></div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}><span style={styles.statValue}>{stats.pedidos_pendentes || 0}</span><span style={styles.statLabel}>Pendentes</span></div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}><span style={styles.statValue}>{stats.pedidos_aprovados || 0}</span><span style={styles.statLabel}>Aprovados</span></div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}><span style={styles.statValue}>{stats.pedidos_rejeitados || 0}</span><span style={styles.statLabel}>Rejeitados</span></div>
        </div>

        <div style={styles.tableContainer}>
          {loading ? <div style={styles.emptyState}>Carregando...</div> : pedidos.length === 0 ? (
            <div style={styles.emptyState}><div style={{ fontSize: '48px' }}>📭</div><div>Nenhum pedido</div></div>
          ) : (
            <div>
              <div style={styles.tableHeader}>
                <div style={{ ...styles.th, width: '80px' }}>ID</div>
                <div style={{ ...styles.th, flex: 2 }}>Estudante</div>
                <div style={{ ...styles.th, flex: 1 }}>Tipo</div>
                <div style={{ ...styles.th, flex: 1 }}>Data</div>
                <div style={{ ...styles.th, flex: 1 }}>Status</div>
                <div style={{ ...styles.th, width: '150px' }}>Ações</div>
              </div>
              {pedidos.map((pedido, i) => (
                <div key={pedido.id} style={{ ...styles.tableRow, backgroundColor: i % 2 === 0 ? '#fafafa' : 'white' }}>
                  <div style={{ ...styles.td, width: '80px' }}><span style={{ fontWeight: '600' }}>#{pedido.id}</span></div>
                  <div style={{ ...styles.td, flex: 2 }}>{pedido.estudante_nome}</div>
                  <div style={{ ...styles.td, flex: 1 }}>{pedido.tipo_display}</div>
                  <div style={{ ...styles.td, flex: 1 }}>{pedido.data_saida}</div>
                  <div style={{ ...styles.td, flex: 1 }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: 'white', backgroundColor: getStatusColor(pedido.estado) }}>
                      {pedido.estado_display}
                    </span>
                  </div>
                  <div style={{ ...styles.td, width: '150px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => navigate(`/pedido/${pedido.id}`)} style={styles.actionBtn}>👁️</button>
                      {pedido.acoes_disponiveis?.includes('aprovar') && (
                        <button onClick={() => handleAcao(pedido.id, 'aprovar')} style={{ ...styles.actionBtn, color: '#10b981' }}>✓</button>
                      )}
                      {pedido.acoes_disponiveis?.includes('rejeitar') && (
                        <button onClick={() => handleAcao(pedido.id, 'rejeitar')} style={{ ...styles.actionBtn, color: '#ef4444' }}>✕</button>
                      )}
                      {pedido.acoes_disponiveis?.includes('passar') && (
                        <button onClick={() => handleAcao(pedido.id, 'passar')} style={{ ...styles.actionBtn, color: '#f59e0b' }}>→</button>
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
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' },
  menuToggle: { display: 'none', position: 'fixed', top: '15px', left: '15px', zIndex: 1000, width: '44px', height: '44px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '20px', cursor: 'pointer' },
  sidebar: { width: '280px', minWidth: '280px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, transition: 'left 0.3s', zIndex: 100 },
  sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '44px', height: '44px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600' },
  userName: { fontSize: '15px', fontWeight: '600', color: '#111827' },
  userRole: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left' },
  navItemDestaque: { backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', fontWeight: '600' },
  navIcon: { fontSize: '18px', width: '24px', textAlign: 'center' },
  navBadge: { backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid #e5e7eb' },
  logoutButton: { width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' },
  mainContent: { flex: 1, padding: '24px', minWidth: 0 },
  statsBar: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 24px', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' },
  statItem: { flex: 1, minWidth: '80px', textAlign: 'center' },
  statValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#111827' },
  statLabel: { display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '4px', textTransform: 'uppercase' },
  statDivider: { width: '1px', height: '40px', backgroundColor: '#e5e7eb' },
  tableContainer: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '14px 20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', gap: '12px' },
  th: { fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', gap: '12px' },
  td: { fontSize: '14px', color: '#374151' },
  actionBtn: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af' },
};

export default DashboardAdmin;
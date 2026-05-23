// src/pages/DashboardDirecao.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardDirecao = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DIRECAO');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [filtroEstado]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [pedidosRes, statsRes] = await Promise.all([
        api.get(`/pedidos/?estado=${filtroEstado}`),
        api.get('/dashboard/')
      ]);
      setPedidos(pedidosRes.data.pedidos || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      await carregarDados();
      alert(`✅ Pedido ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const motivo = prompt('📝 Motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else {
        alert(`❌ Erro: ${msg}`);
      }
    }
  };

  const handlePassar = async (pedidoId) => {
    if (!confirm('📤 Encaminhar este pedido para o Administrador?')) return;
    try {
      await api.post(`/pedidos/${pedidoId}/passar/`);
      await carregarDados();
      alert('✅ Pedido encaminhado para o Administrador!');
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar'));
    }
  };

  const getStatusStyle = (estado) => {
    const styles = {
      'PENDENTE_DITE': { background: '#fef3c7', color: '#d97706' },
      'PENDENTE_DIRECAO': { background: '#fee2e2', color: '#b91c1c' },
      'PENDENTE_ADMIN': { background: '#dbeafe', color: '#2563eb' },
      'APROVADO': { background: '#d1fae5', color: '#059669' },
      'REJEITADO': { background: '#fee2e2', color: '#b91c1c' }
    };
    return styles[estado] || { background: '#f1f5f9', color: '#64748b' };
  };

  const pedidosFiltrados = pedidos.filter(p => 
    p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  const menuItems = [
    { id: 'PENDENTE_DIRECAO', label: 'Pendentes', icon: '🟡', count: stats.meus_pedidos_pendentes },
    { id: 'APROVADO', label: 'Aprovados', icon: '✅' },
    { id: 'REJEITADO', label: 'Rejeitados', icon: '❌' },
  ];

  return (
    <div style={styles.container}>
      <button onClick={() => setMenuOpen(!menuOpen)} style={styles.menuToggle}>
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && <div onClick={() => setMenuOpen(false)} style={styles.overlay} />}

      <div style={{
        ...styles.sidebar,
        transform: menuOpen ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(0)',
      }}>
        <div style={styles.sidebarHeader}>
          <div style={{ ...styles.avatar, backgroundColor: '#8B0000' }}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'D'}
          </div>
          <div>
            <div style={styles.userName}>{user?.nome || user?.username}</div>
            <div style={styles.userRole}>👨‍💼 Direção</div>
          </div>
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setFiltroEstado(item.id);
                if (isMobile) setMenuOpen(false);
              }}
              style={{
                ...styles.navItem,
                backgroundColor: filtroEstado === item.id ? '#fee2e2' : 'transparent',
                fontWeight: filtroEstado === item.id ? '600' : '400',
                borderLeft: filtroEstado === item.id ? '3px solid #8B0000' : '3px solid transparent',
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count > 0 && <span style={styles.navBadge}>{item.count}</span>}
            </button>
          ))}
          
          <div style={styles.navDivider} />
          
          <button onClick={() => navigate('/relatorios')} style={styles.navItem}>
            <span style={styles.navIcon}>📊</span>
            <span>Relatórios</span>
          </button>
          
          <button onClick={onLogout} style={styles.logoutButton}>
            🚪 Sair
          </button>
        </nav>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.statsBar}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.total_pedidos || 0}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>{stats.meus_pedidos_pendentes || 0}</span>
            <span style={styles.statLabel}>Meus Pendentes</span>
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

        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="🔍 Buscar por estudante ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button onClick={carregarDados} style={styles.refreshBtn}>🔄 Atualizar</button>
        </div>

        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.emptyState}>
              <div style={styles.spinner} />
              <p>Carregando pedidos...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', opacity: 0.5 }}>📭</div>
              <div style={{ marginTop: 12 }}>Nenhum pedido encontrado</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Estudante</th>
                    <th style={styles.th}>Curso</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Data Saída</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map(pedido => (
                    <tr key={pedido.id} style={styles.tr}>
                      <td style={styles.td}><strong>#{pedido.id}</strong></td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600 }}>{pedido.estudante_nome}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{pedido.estudante_email}</div>
                      </td>
                      <td style={styles.td}>
                        {pedido.estudante_curso || '-'}<br />
                        <small style={{ color: '#94a3b8' }}>{pedido.estudante_classe || '-'}</small>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.tipoBadge}>{pedido.tipo_display}</span>
                      </td>
                      <td style={styles.td}>
                        {pedido.data_saida}<br />
                        <small style={{ color: '#94a3b8' }}>{pedido.hora_saida}</small>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusStyle(pedido.estado).background,
                          color: getStatusStyle(pedido.estado).color,
                        }}>
                          {pedido.estado_display}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button onClick={() => navigate(`/pedido/${pedido.id}`)} style={styles.actionBtn} title="Ver detalhes">👁️</button>
                          {pedido.acoes_disponiveis?.includes('aprovar') && (
                            <button onClick={() => handleAcao(pedido.id, 'aprovar')} style={{ ...styles.actionBtn, color: '#10b981' }} title="Aprovar">✅</button>
                          )}
                          {pedido.acoes_disponiveis?.includes('rejeitar') && (
                            <button onClick={() => handleAcao(pedido.id, 'rejeitar')} style={{ ...styles.actionBtn, color: '#8B0000' }} title="Rejeitar">❌</button>
                          )}
                          {pedido.acoes_disponiveis?.includes('passar') && (
                            <button onClick={() => handlePassar(pedido.id)} style={{ ...styles.actionBtn, color: '#f59e0b' }} title="Encaminhar">📤</button>
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
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' },
  menuToggle: { display: 'none', position: 'fixed', top: '15px', left: '15px', zIndex: 1000, width: '44px', height: '44px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '20px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999, backdropFilter: 'blur(2px)' },
  sidebar: { width: '280px', minWidth: '280px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, transition: 'transform 0.3s', zIndex: 100 },
  sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '44px', height: '44px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600' },
  userName: { fontSize: '15px', fontWeight: '600', color: '#111827' },
  userRole: { fontSize: '12px', color: '#8B0000', marginTop: '2px', fontWeight: '600' },
  nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left', transition: 'all 0.2s' },
  navIcon: { fontSize: '18px', width: '24px', textAlign: 'center' },
  navBadge: { backgroundColor: '#8B0000', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  navDivider: { height: '1px', backgroundColor: '#e5e7eb', margin: '8px 20px' },
  logoutButton: { width: 'calc(100% - 40px)', margin: '0 20px 20px', padding: '12px', backgroundColor: '#fee2e2', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#8B0000' },
  mainContent: { flex: 1, padding: '24px', minWidth: 0 },
  statsBar: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 24px', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' },
  statItem: { flex: 1, minWidth: '80px', textAlign: 'center' },
  statValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#8B0000' },
  statLabel: { display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statDivider: { width: '1px', height: '40px', backgroundColor: '#e5e7eb' },
  searchBar: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchInput: { flex: 1, padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' },
  refreshBtn: { padding: '10px 20px', backgroundColor: '#fee2e2', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', color: '#8B0000' },
  tableContainer: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#fafbfc', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '14px 16px', fontSize: '13px', color: '#374151' },
  tipoBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#fee2e2', color: '#8B0000', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  actionButtons: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: { width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af' },
  spinner: { width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#8B0000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
};

// CSS Global
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .menu-toggle-btn { display: flex !important; }
    .sidebar { position: fixed !important; }
    .main-content { margin-left: 0 !important; padding: 16px; }
    .stats-bar { flex-direction: column; align-items: stretch; }
    .search-bar { flex-direction: column; }
  }
  .action-btn:hover { background: #fee2e2; transform: translateY(-1px); }
  .nav-item:hover { background: #fee2e2; }
  tr:hover { background: #fee2e2; }
`;
document.head.appendChild(styleSheet);

export default DashboardDirecao;
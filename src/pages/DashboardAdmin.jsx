// src/pages/DashboardAdmin.jsx - COMPLETO E FUNCIONAL
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardAdmin = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuMobile, setMenuMobile] = useState(false);
  const [coletivas, setColetivas] = useState([]);
  const [showColetivaModal, setShowColetivaModal] = useState(false);
  const [formColetiva, setFormColetiva] = useState({
    titulo: '',
    descricao: '',
    data_saida: '',
    data_volta: '',
    prazo_horas: '24'
  });
  const [loadingColetiva, setLoadingColetiva] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    carregarColetivas();
  }, [filtroEstado]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [pedidosRes, statsRes] = await Promise.all([
        api.get(`/pedidos/${filtroEstado ? `?estado=${filtroEstado}` : ''}`),
        api.get('/dashboard/')
      ]);
      setPedidos(pedidosRes.data.pedidos || []);
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
    } catch (err) {}
  };

  const carregarColetivas = async () => {
    try {
      const res = await api.get('/coletivas/listar/');
      setColetivas(res.data.coletivas || []);
    } catch (err) {}
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      const data = comentario ? { comentario } : {};
      await api.post(`/pedidos/${pedidoId}/${acao}/`, data);
      await carregarDados();
      await carregarNotificacoes();
      alert(`✅ Pedido ${acao === 'aprovar' ? 'aprovado' : acao === 'rejeitar' ? 'rejeitado' : 'encaminhado'} com sucesso!`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && errorMsg.includes('motivo')) {
        const motivo = prompt('📝 Informe o motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else {
        alert(`❌ Erro: ${errorMsg}`);
      }
    }
  };

  const criarColetiva = async (e) => {
    e.preventDefault();
    if (!formColetiva.titulo || !formColetiva.data_saida || !formColetiva.data_volta) {
      alert('⚠️ Preencha todos os campos obrigatórios');
      return;
    }
    setLoadingColetiva(true);
    try {
      await api.post('/pedidos/coletiva/criar/', formColetiva);
      alert('✅ Saída coletiva criada com sucesso!');
      setShowColetivaModal(false);
      setFormColetiva({ titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24' });
      carregarColetivas();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao criar saída coletiva'));
    } finally {
      setLoadingColetiva(false);
    }
  };

  const getStatusColor = (estado) => {
    const cores = {
      'PENDENTE_DITE': '#10b981',
      'PENDENTE_DIRECAO': '#f59e0b',
      'PENDENTE_ADMIN': '#ef4444',
      'APROVADO': '#10b981',
      'REJEITADO': '#ef4444',
      'EM_ANDAMENTO': '#3b82f6',
      'FINALIZADO': '#6b7280'
    };
    return cores[estado] || '#6b7280';
  };

  const pedidosFiltrados = pedidos.filter(p => 
    p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  const menuItems = [
    { id: 'todos', label: 'Todos Pedidos', icon: '📋', count: stats.total_pedidos },
    { id: 'PENDENTE_ADMIN', label: 'Pendentes Admin', icon: '🔴', count: stats.pedidos_pendentes, destaque: true },
    { id: 'APROVADO', label: 'Aprovados', icon: '✅', count: stats.pedidos_aprovados },
    { id: 'REJEITADO', label: 'Rejeitados', icon: '❌', count: stats.pedidos_rejeitados },
  ];

  return (
    <div style={styles.container}>
      {/* Menu Mobile Toggle */}
      <button onClick={() => setMenuMobile(!menuMobile)} style={styles.menuToggle}>
        {menuMobile ? '✕' : '☰'}
      </button>

      {/* Overlay Mobile */}
      {menuMobile && <div onClick={() => setMenuMobile(false)} style={styles.overlay} />}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        transform: menuMobile ? 'translateX(0)' : window.innerWidth < 769 ? 'translateX(-100%)' : 'translateX(0)',
      }}>
        <div style={styles.sidebarHeader}>
          <div style={{ ...styles.avatar, backgroundColor: '#9C27B0' }}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'A'}
          </div>
          <div>
            <div style={styles.userName}>{user?.nome || user?.username}</div>
            <div style={styles.userRole}>👑 Administrador</div>
          </div>
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setFiltroEstado(item.id === 'todos' ? '' : item.id);
                setMenuMobile(false);
              }}
              style={{
                ...styles.navItem,
                backgroundColor: (filtroEstado === item.id) || (item.id === 'todos' && !filtroEstado) ? '#f3f4f6' : 'transparent',
                fontWeight: (filtroEstado === item.id) || (item.id === 'todos' && !filtroEstado) ? '600' : '400',
                borderLeft: (filtroEstado === item.id) || (item.id === 'todos' && !filtroEstado) ? '3px solid #9C27B0' : '3px solid transparent',
                ...(item.destaque && styles.navItemDestaque),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {item.count > 0 && <span style={styles.navBadge}>{item.count}</span>}
            </button>
          ))}
          
          <div style={styles.navDivider} />
          
          <button onClick={() => navigate('/notificacoes')} style={styles.navItem}>
            <span style={styles.navIcon}>🔔</span>
            <span>Notificações</span>
            {notificacoesNaoLidas > 0 && <span style={styles.navBadge}>{notificacoesNaoLidas}</span>}
          </button>
          
          <button onClick={() => navigate('/relatorios')} style={styles.navItem}>
            <span style={styles.navIcon}>📊</span>
            <span>Relatórios</span>
          </button>
          
          <button onClick={() => setShowColetivaModal(true)} style={{...styles.navItem, color: '#059669'}}>
            <span style={styles.navIcon}>👥</span>
            <span>Nova Saída Coletiva</span>
          </button>
        </nav>
        
        <div style={styles.sidebarFooter}>
          <button onClick={onLogout} style={styles.logoutButton}>
            🚪 Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Stats Bar */}
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

        {/* Search Bar */}
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

        {/* Table */}
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
                        {pedido.estudante_curso || '-'}<br/>
                        <small style={{ color: '#94a3b8' }}>{pedido.estudante_classe || '-'}</small>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.tipoBadge}>{pedido.tipo_display}</span>
                      </td>
                      <td style={styles.td}>
                        {pedido.data_saida}<br/>
                        <small style={{ color: '#94a3b8' }}>{pedido.hora_saida}</small>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(pedido.estado),
                        }}>
                          {pedido.estado_display}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button onClick={() => navigate(`/pedido/${pedido.id}`)} style={styles.actionBtn} title="Ver detalhes">👁️</button>
                          {pedido.acoes_disponiveis?.includes('aprovar') && (
                            <button onClick={() => handleAcao(pedido.id, 'aprovar')} style={{...styles.actionBtn, color: '#10b981'}} title="Aprovar">✅</button>
                          )}
                          {pedido.acoes_disponiveis?.includes('rejeitar') && (
                            <button onClick={() => handleAcao(pedido.id, 'rejeitar')} style={{...styles.actionBtn, color: '#ef4444'}} title="Rejeitar">❌</button>
                          )}
                          {pedido.acoes_disponiveis?.includes('passar') && (
                            <button onClick={() => handleAcao(pedido.id, 'passar')} style={{...styles.actionBtn, color: '#f59e0b'}} title="Encaminhar">📤</button>
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

      {/* Modal Criar Saída Coletiva */}
      {showColetivaModal && (
        <div style={styles.modalOverlay} onClick={() => setShowColetivaModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>👥 Nova Saída Coletiva</h3>
              <button onClick={() => setShowColetivaModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <form onSubmit={criarColetiva} style={styles.modalBody}>
              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Título *</label>
                <input type="text" value={formColetiva.titulo} onChange={e => setFormColetiva({...formColetiva, titulo: e.target.value})} style={styles.modalInput} placeholder="Ex: Visita ao Museu" required />
              </div>
              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Descrição</label>
                <textarea value={formColetiva.descricao} onChange={e => setFormColetiva({...formColetiva, descricao: e.target.value})} style={styles.modalTextarea} placeholder="Detalhes da saída..." rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Data Saída *</label>
                  <input type="datetime-local" value={formColetiva.data_saida} onChange={e => setFormColetiva({...formColetiva, data_saida: e.target.value})} style={styles.modalInput} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Data Volta *</label>
                  <input type="datetime-local" value={formColetiva.data_volta} onChange={e => setFormColetiva({...formColetiva, data_volta: e.target.value})} style={styles.modalInput} required />
                </div>
              </div>
              <div style={styles.modalField}>
                <label style={styles.modalLabel}>Prazo para resposta (horas)</label>
                <input type="number" value={formColetiva.prazo_horas} onChange={e => setFormColetiva({...formColetiva, prazo_horas: e.target.value})} style={styles.modalInput} min="1" max="72" />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button type="button" onClick={() => setShowColetivaModal(false)} style={styles.modalBtnCancel}>Cancelar</button>
                <button type="submit" disabled={loadingColetiva} style={styles.modalBtnSubmit}>
                  {loadingColetiva ? 'Criando...' : 'Criar Saída Coletiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' },
  menuToggle: { display: 'none', position: 'fixed', top: '15px', left: '15px', zIndex: 1000, width: '44px', height: '44px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '20px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999, backdropFilter: 'blur(2px)' },
  sidebar: { width: '280px', minWidth: '280px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, transition: 'transform 0.3s', zIndex: 100 },
  sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '44px', height: '44px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600' },
  userName: { fontSize: '15px', fontWeight: '600', color: '#111827' },
  userRole: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  nav: { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left', transition: 'all 0.2s' },
  navItemDestaque: { backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', fontWeight: '600' },
  navIcon: { fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 },
  navBadge: { backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', flexShrink: 0 },
  navDivider: { height: '1px', backgroundColor: '#e5e7eb', margin: '8px 20px' },
  sidebarFooter: { padding: '16px 20px', borderTop: '1px solid #e5e7eb' },
  logoutButton: { width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
  mainContent: { flex: 1, padding: '24px', minWidth: 0 },
  statsBar: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 24px', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' },
  statItem: { flex: 1, minWidth: '80px', textAlign: 'center' },
  statValue: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#111827' },
  statLabel: { display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statDivider: { width: '1px', height: '40px', backgroundColor: '#e5e7eb' },
  searchBar: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchInput: { flex: 1, padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' },
  refreshBtn: { padding: '10px 20px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' },
  tableContainer: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' },
  td: { padding: '14px 16px', fontSize: '13px', color: '#374151' },
  tipoBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  statusBadge: { display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: 'white' },
  actionButtons: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af' },
  spinner: { width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#9C27B0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' },
  modalContent: { backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e5e7eb' },
  modalClose: { width: '32px', height: '32px', border: '1px solid #e5e7eb', backgroundColor: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' },
  modalBody: { padding: '20px' },
  modalField: { marginBottom: '16px' },
  modalLabel: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  modalInput: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' },
  modalTextarea: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' },
  modalBtnCancel: { flex: 1, padding: '12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  modalBtnSubmit: { flex: 2, padding: '12px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};

// CSS Global
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .menu-toggle-btn { display: flex !important; }
    .sidebar { position: fixed !important; }
    .main-content { margin-left: 0 !important; padding: 16px; }
  }
  .action-btn:hover { background: #f8fafc; transform: translateY(-1px); }
  .nav-item:hover { background: #f8fafc; }
  .logout-button:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
  tr:hover { background: #fafbfc; }
`;
document.head.appendChild(styleSheet);

export default DashboardAdmin;
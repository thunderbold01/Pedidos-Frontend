// src/pages/DashboardDITE.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardDITE = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DITE');
  const [filtroData, setFiltroData] = useState('');
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [modalEncaminhar, setModalEncaminhar] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
  }, [filtroEstado, filtroData]);

  const carregarDados = async () => {
    try {
      let url = `/pedidos/?estado=${filtroEstado}`;
      if (filtroData) url += `&data_saida=${filtroData}`;
      
      const [pedidosRes, statsRes] = await Promise.all([
        api.get(url),
        api.get('/dashboard/')
      ]);
      setPedidos(pedidosRes.data.pedidos || pedidosRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas);
      setNotificacoes(res.data.notificacoes || []);
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

  const handleEncaminhar = async (pedidoId, destino) => {
    try {
      await api.post(`/pedidos/${pedidoId}/passar-dite/`, { destino });
      setModalEncaminhar(null);
      carregarDados();
      carregarNotificacoes();
      alert(`Pedido #${pedidoId} encaminhado para ${destino === 'DIRECAO' ? 'Direção' : 'Administração'}`);
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar'));
    }
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
  };

  const imprimirListaSaida = () => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const janela = window.open('', '_blank', 'width=800,height=600');
    
    janela.document.write(`
      <html>
        <head>
          <title>Lista de Saídas - ${hoje}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            h1 { color: #1a1a2e; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Lista de Saídas - ${hoje}</h1>
          <p>Total de pedidos: <strong>${pedidos.length}</strong></p>
          <button onclick="window.print()" style="padding:8px 16px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; margin-bottom:20px;">
            Imprimir
          </button>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Estudante</th>
                <th>Curso</th>
                <th>Classe</th>
                <th>Tipo</th>
                <th>Data/Hora</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${pedidos.map(p => `
                <tr>
                  <td>#${p.id}</td>
                  <td>${p.estudante_nome}</td>
                  <td>${p.estudante_curso || '-'}</td>
                  <td>${p.estudante_classe || '-'}</td>
                  <td>${p.tipo_display}</td>
                  <td>${p.data_saida} ${p.hora_saida}</td>
                  <td>${p.estado_display}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Gerado em ${new Date().toLocaleString('pt-BR')} por ${user.nome || user.username}</p>
          </div>
        </body>
      </html>
    `);
    janela.document.close();
  };

  const menuItems = [
    { id: 'PENDENTE_DITE', label: 'Pendentes', icon: '📋', count: stats.meus_pedidos_pendentes },
    { id: 'PENDENTE_DIRECAO', label: 'Em Análise', icon: '⏳' },
    { id: 'APROVADO', label: 'Aprovados', icon: '✓' },
    { id: 'REJEITADO', label: 'Rejeitados', icon: '✗' },
  ];

  const totalPedidos = stats.total_pedidos || 1;
  const taxaAprovacao = ((stats.pedidos_aprovados || 0) / totalPedidos * 100).toFixed(0);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: sidebarCollapsed ? '72px' : '260px',
      }}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            {!sidebarCollapsed ? (
              <span style={styles.logoText}>DITE</span>
            ) : (
              <span style={styles.logoIcon}>D</span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={styles.collapseBtn}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav style={styles.nav}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setFiltroEstado(item.id)}
              style={{
                ...styles.navItem,
                backgroundColor: filtroEstado === item.id ? '#f1f5f9' : 'transparent',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.count > 0 && (
                    <span style={styles.navCount}>{item.count}</span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.count > 0 && (
                <span style={styles.navCountMini}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.navDivider} />

        <nav style={styles.navBottom}>
          <button
            onClick={() => setShowNotificacoes(!showNotificacoes)}
            style={{
              ...styles.navItem,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              position: 'relative',
            }}
            title={sidebarCollapsed ? 'Notificações' : ''}
          >
            <span style={styles.navIcon}>🔔</span>
            {!sidebarCollapsed && <span>Notificações</span>}
            {notificacoesNaoLidas > 0 && (
              <span style={styles.badge}>{notificacoesNaoLidas}</span>
            )}
          </button>
          
          <button
            onClick={() => navigate('/relatorios')}
            style={{
              ...styles.navItem,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
            title={sidebarCollapsed ? 'Relatórios' : ''}
          >
            <span style={styles.navIcon}>📊</span>
            {!sidebarCollapsed && <span>Relatórios</span>}
          </button>

          <button
            onClick={imprimirListaSaida}
            style={{
              ...styles.navItem,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
            title={sidebarCollapsed ? 'Imprimir' : ''}
          >
            <span style={styles.navIcon}>🖨️</span>
            {!sidebarCollapsed && <span>Imprimir</span>}
          </button>

          <button
            onClick={onLogout}
            style={{
              ...styles.navItem,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              marginTop: 'auto',
              color: '#ef4444',
            }}
            title={sidebarCollapsed ? 'Sair' : ''}
          >
            <span style={styles.navIcon}>🚪</span>
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        ...styles.mainContent,
        marginLeft: sidebarCollapsed ? '72px' : '260px',
      }}>
        {/* Header Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div>
              <div style={styles.statValue}>{stats.total_pedidos || 0}</div>
              <div style={styles.statLabel}>Total de Pedidos</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✓</div>
            <div>
              <div style={styles.statValue}>{stats.pedidos_aprovados || 0}</div>
              <div style={styles.statLabel}>Aprovados</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✗</div>
            <div>
              <div style={styles.statValue}>{stats.pedidos_rejeitados || 0}</div>
              <div style={styles.statLabel}>Rejeitados</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div>
              <div style={styles.statValue}>{stats.meus_pedidos_pendentes || 0}</div>
              <div style={styles.statLabel}>Pendentes</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📈</div>
            <div>
              <div style={styles.statValue}>{taxaAprovacao}%</div>
              <div style={styles.statLabel}>Aprovação</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filtersBar}>
          <div style={styles.tabs}>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setFiltroEstado(item.id)}
                style={{
                  ...styles.tab,
                  borderBottom: filtroEstado === item.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: filtroEstado === item.id ? '#1e293b' : '#94a3b8',
                }}
              >
                {item.label}
                {item.count > 0 && filtroEstado === item.id && (
                  <span style={styles.tabCount}>{item.count}</span>
                )}
              </button>
            ))}
          </div>
          
          <div style={styles.filterGroup}>
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              style={styles.dateInput}
            />
            {filtroData && (
              <button onClick={() => setFiltroData('')} style={styles.clearBtn}>
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <p>Carregando...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <h3>Nenhum pedido encontrado</h3>
              <p>Todos os pedidos foram processados</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Estudante</th>
                  <th style={styles.th}>Curso/Classe</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Data/Hora</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => (
                  <tr key={pedido.id} style={styles.tr}>
                    <td style={styles.td}>#{pedido.id}</td>
                    <td style={styles.td}>
                      <div style={styles.studentName}>{pedido.estudante_nome}</div>
                      <div style={styles.studentEmail}>{pedido.estudante_email}</div>
                    </td>
                    <td style={styles.td}>
                      {pedido.estudante_curso || '-'}<br />
                      <span style={styles.classText}>{pedido.estudante_classe || '-'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>{pedido.tipo_display}</span>
                    </td>
                    <td style={styles.td}>
                      {pedido.data_saida}<br />
                      <span style={styles.timeText}>{pedido.hora_saida}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(pedido.estado)
                      }}>
                        {pedido.estado_display}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionGroup}>
                        <button
                          onClick={() => navigate(`/pedido/${pedido.id}`)}
                          style={styles.actionIcon}
                          title="Detalhes"
                        >
                          👁️
                        </button>
                        
                        {pedido.acoes_disponiveis?.includes('aprovar') && (
                          <button
                            onClick={() => handleAcao(pedido.id, 'aprovar')}
                            style={{ ...styles.actionIcon, color: '#10b981' }}
                            title="Aprovar"
                          >
                            ✓
                          </button>
                        )}
                        
                        {pedido.acoes_disponiveis?.includes('rejeitar') && (
                          <button
                            onClick={() => handleAcao(pedido.id, 'rejeitar')}
                            style={{ ...styles.actionIcon, color: '#ef4444' }}
                            title="Rejeitar"
                          >
                            ✗
                          </button>
                        )}
                        
                        {pedido.estado === 'PENDENTE_DITE' && (
                          <button
                            onClick={() => setModalEncaminhar(pedido.id)}
                            style={{ ...styles.actionIcon, color: '#f59e0b' }}
                            title="Encaminhar"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotificacoes && (
        <div style={styles.notifPanel}>
          <div style={styles.notifHeader}>
            <h3>Notificações</h3>
            <button onClick={() => setShowNotificacoes(false)} style={styles.closeNotif}>✕</button>
          </div>
          <div style={styles.notifList}>
            {notificacoes.length === 0 ? (
              <p style={styles.notifEmpty}>Nenhuma notificação</p>
            ) : (
              notificacoes.slice(0, 10).map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    marcarNotificacaoLida(notif.id);
                    if (notif.pedido_id) navigate(`/pedido/${notif.pedido_id}`);
                  }}
                  style={{
                    ...styles.notifItem,
                    backgroundColor: notif.lida ? '#fff' : '#fefce8',
                  }}
                >
                  <div style={styles.notifMsg}>{notif.mensagem}</div>
                  <div style={styles.notifDate}>{notif.data}</div>
                  {!notif.lida && <div style={styles.notifDot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalEncaminhar && (
        <div onClick={() => setModalEncaminhar(null)} style={styles.modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>Encaminhar Pedido #{modalEncaminhar}</h3>
              <button onClick={() => setModalEncaminhar(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p>Selecione o destino:</p>
              <div style={styles.modalOptions}>
                <button
                  onClick={() => handleEncaminhar(modalEncaminhar, 'DIRECAO')}
                  style={styles.modalOption}
                >
                  <span>👨‍💼</span>
                  <div>
                    <strong>Direção</strong>
                    <p>Encaminhar para Direção</p>
                  </div>
                </button>
                <button
                  onClick={() => handleEncaminhar(modalEncaminhar, 'ADMINISTRACAO')}
                  style={styles.modalOption}
                >
                  <span>🏛️</span>
                  <div>
                    <strong>Administração</strong>
                    <p>Encaminhar para Administração</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusStyle = (estado) => {
  const styles = {
    'PENDENTE_DITE': { background: '#fef3c7', color: '#d97706' },
    'PENDENTE_DIRECAO': { background: '#ede9fe', color: '#7c3aed' },
    'PENDENTE_ADMIN': { background: '#dbeafe', color: '#2563eb' },
    'APROVADO': { background: '#d1fae5', color: '#059669' },
    'REJEITADO': { background: '#fee2e2', color: '#dc2626' },
  };
  return styles[estado] || { background: '#f1f5f9', color: '#64748b' };
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    zIndex: 100,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '20px 16px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontWeight: 700,
    fontSize: '20px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoText: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoIcon: {
    fontSize: '24px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  collapseBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  nav: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navBottom: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderTop: '1px solid #e2e8f0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#475569',
    borderRadius: '8px',
    transition: 'all 0.2s',
    width: '100%',
    textAlign: 'left',
    position: 'relative',
  },
  navIcon: {
    fontSize: '18px',
    minWidth: '24px',
  },
  navCount: {
    background: '#e2e8f0',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
  },
  navCountMini: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#3b82f6',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 600,
  },
  badge: {
    background: '#ef4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
  },
  navDivider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '8px 16px',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    fontSize: '32px',
    color: '#64748b',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  filtersBar: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '12px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  tabs: {
    display: 'flex',
    gap: '24px',
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '8px 0',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabCount: {
    marginLeft: '8px',
    background: '#e2e8f0',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
  },
  filterGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  dateInput: {
    padding: '6px 12px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    background: '#fff',
  },
  clearBtn: {
    padding: '6px 12px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#64748b',
  },
  tableWrapper: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'top',
  },
  studentName: {
    fontWeight: 500,
    color: '#0f172a',
  },
  studentEmail: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  classText: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  timeText: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: 500,
    background: '#f1f5f9',
    color: '#475569',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
  },
  actionIcon: {
    width: '32px',
    height: '32px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  loadingState: {
    textAlign: 'center',
    padding: '60px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    margin: '0 auto 16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#94a3b8',
  },
  notifPanel: {
    position: 'fixed',
    top: '80px',
    right: '24px',
    width: '320px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    zIndex: 200,
  },
  notifHeader: {
    padding: '16px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeNotif: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  notifList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  notifItem: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    position: 'relative',
  },
  notifMsg: {
    fontSize: '13px',
    color: '#334155',
  },
  notifDate: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  notifDot: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '8px',
    height: '8px',
    background: '#3b82f6',
    borderRadius: '50%',
  },
  notifEmpty: {
    textAlign: 'center',
    padding: '32px',
    color: '#94a3b8',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  modal: {
    background: '#fff',
    width: '90%',
    maxWidth: '400px',
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  modalBody: {
    padding: '20px',
  },
  modalOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  modalOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
  },
};

// Add keyframe animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  button:hover {
    background: #f8fafc;
  }
  
  .nav-item:hover {
    background: #f1f5f9;
  }
  
  .action-icon:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
`;
document.head.appendChild(styleSheet);

export default DashboardDITE;
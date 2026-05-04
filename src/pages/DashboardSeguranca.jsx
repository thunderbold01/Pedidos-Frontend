// src/pages/DashboardSeguranca.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  const [saidas, setSaidas] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [alertaAtivo, setAlertaAtivo] = useState(false);
  const [horaAtual, setHoraAtual] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [menuMobile, setMenuMobile] = useState(false);
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar dados a cada 30 segundos
  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, []);

  // Verificar alertas de atraso
  useEffect(() => {
    const temAtrasados = saidas.some(s => s.atrasado);
    setAlertaAtivo(temAtrasados);
    
    // Tocar som de alerta se houver atrasados
    if (temAtrasados && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [saidas]);

  const carregarDados = async () => {
    try {
      const res = await api.get('/seguranca/dashboard/');
      setSaidas(res.data.saidas_hoje || []);
      setStats(res.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const marcarSaida = async (pedidoId) => {
    if (!confirm('✅ Confirmar saída do estudante?')) return;
    try {
      await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      carregarDados();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao marcar saída'));
    }
  };

  const marcarRetorno = async (pedidoId, ajustarHora = false) => {
    try {
      let data = {};
      
      if (ajustarHora) {
        const hora = prompt('⏰ Informe a hora correta do retorno (HH:MM):\nExemplo: 14:30');
        if (!hora) return;
        
        // Validar formato da hora
        const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!horaRegex.test(hora)) {
          alert('❌ Formato de hora inválido! Use HH:MM');
          return;
        }
        
        const hoje = new Date().toISOString().split('T')[0];
        data = {
          hora_retorno: `${hoje}T${hora}:00`,
          observacao: '⏰ Hora ajustada pela segurança (correção de registro)'
        };
      }
      
      await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, data);
      await carregarDados();
      
      if (ajustarHora) {
        alert('✅ Hora de retorno ajustada com sucesso!');
      }
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao marcar retorno'));
    }
  };

  const getStatusSaida = (saida) => {
    if (saida.estado === 'APROVADO') return { 
      texto: '⏳ Aguardando Saída', 
      cor: '#FF9800', 
      bg: '#FFF3E0',
      icon: '🕐'
    };
    if (saida.estado === 'EM_ANDAMENTO') {
      if (saida.atrasado) return { 
        texto: '🔴 ATRASADO!', 
        cor: '#f44336', 
        bg: '#FFEBEE',
        icon: '⚠️'
      };
      return { 
        texto: '🚶 Em Andamento', 
        cor: '#2196F3', 
        bg: '#E3F2FD',
        icon: '🚶'
      };
    }
    if (saida.estado === 'FINALIZADO') {
      if (saida.atrasado) return { 
        texto: '⚠️ Finalizado c/ Atraso', 
        cor: '#FF5722', 
        bg: '#FBE9E7',
        icon: '⚠️'
      };
      return { 
        texto: '✅ No Horário', 
        cor: '#4CAF50', 
        bg: '#E8F5E9',
        icon: '✅'
      };
    }
    return { texto: saida.estado, cor: '#999', bg: '#F5F5F5', icon: '❓' };
  };

  return (
    <div style={styles.container}>
      {/* Alerta sonoro para atrasos */}
      <audio ref={audioRef} src="/alert.mp3" preload="auto" />

      {/* Alerta Visual de Atraso */}
      {alertaAtivo && (
        <div style={styles.alertaBar}>
          <div style={styles.alertaContent}>
            <span style={styles.alertaIcon}>🚨</span>
            <div>
              <strong>ATENÇÃO! Estudantes em atraso!</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                Verifique a lista abaixo
              </p>
            </div>
          </div>
          <span style={styles.alertaCount}>
            {stats.atrasados || 0} atrasado(s)
          </span>
        </div>
      )}

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
          <div style={styles.userAvatar}>
            {user.nome?.charAt(0) || 'S'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.userName}>{user.nome || user.username}</div>
            <span style={styles.roleBadge}>🛡️ Segurança</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>
            <span>📋</span>
            <span>Controle Hoje</span>
          </button>
          
          <button onClick={() => navigate('/notificacoes')} style={styles.navItem}>
            <span>🔔</span>
            <span>Notificações</span>
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
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🛡️ Controle de Portão</h1>
            <p style={styles.date}>
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.relogio}>
              🕐 {horaAtual}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📋</div>
            <div style={styles.statValue}>{stats.total_saidas || 0}</div>
            <div style={styles.statLabel}>Saídas Hoje</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#2196F3' }}>
            <div style={styles.statIcon}>🚶</div>
            <div style={{ ...styles.statValue, color: '#2196F3' }}>{stats.em_andamento || 0}</div>
            <div style={styles.statLabel}>Em Andamento</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: '#4CAF50' }}>
            <div style={styles.statIcon}>✅</div>
            <div style={{ ...styles.statValue, color: '#4CAF50' }}>{stats.finalizados || 0}</div>
            <div style={styles.statLabel}>Finalizados</div>
          </div>
          <div style={{
            ...styles.statCard,
            borderColor: '#f44336',
            animation: (stats.atrasados || 0) > 0 ? 'pulse 2s infinite' : 'none',
            boxShadow: (stats.atrasados || 0) > 0 ? '0 4px 20px rgba(244,67,54,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={styles.statIcon}>⚠️</div>
            <div style={{ ...styles.statValue, color: '#f44336' }}>{stats.atrasados || 0}</div>
            <div style={styles.statLabel}>Atrasados</div>
          </div>
        </div>

        {/* Tabela de Controle */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>
              📋 Controle de Entrada/Saída - Hoje
            </h2>
            <button onClick={carregarDados} style={styles.refreshButton}>
              🔄 Atualizar
            </button>
          </div>

          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <p>Carregando...</p>
            </div>
          ) : saidas.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛡️</div>
              <h3>Nenhuma saída programada para hoje</h3>
              <p style={{ color: '#4CAF50', fontWeight: '600' }}>Portão liberado! ✓</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Estudante</th>
                    <th style={styles.th}>Curso/Classe</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Prev. Saída</th>
                    <th style={styles.th}>Prev. Volta</th>
                    <th style={styles.th}>Saída Real</th>
                    <th style={styles.th}>Retorno Real</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {saidas.map(saida => {
                    const status = getStatusSaida(saida);
                    return (
                      <tr key={saida.id} style={{
                        ...styles.tr,
                        background: saida.atrasado ? '#FFF5F5' : 'white',
                        borderLeft: saida.atrasado ? '4px solid #f44336' : '4px solid transparent',
                      }}>
                        <td style={styles.td}>#{saida.id}</td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', color: '#1a1a2e' }}>
                            {saida.estudante_nome}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontSize: '13px' }}>{saida.estudante_curso || '-'}</div>
                          <small style={{ color: '#999' }}>{saida.estudante_classe || '-'}</small>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.tipoBadge}>{saida.tipo}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '500' }}>{saida.data_saida}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '500' }}>{saida.data_volta}</div>
                        </td>
                        <td style={styles.td}>
                          {saida.hora_saida_real ? (
                            <span style={{ color: '#4CAF50', fontWeight: '600' }}>
                              {saida.hora_saida_real}
                            </span>
                          ) : saida.estado === 'APROVADO' ? (
                            <button onClick={() => marcarSaida(saida.id)} style={styles.btnSaida}>
                              🟢 Marcar Saída
                            </button>
                          ) : (
                            <span style={{ color: '#999' }}>---</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {saida.estado === 'EM_ANDAMENTO' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <button onClick={() => marcarRetorno(saida.id)} style={styles.btnRetorno}>
                                🔴 Marcar Retorno
                              </button>
                              <button 
                                onClick={() => marcarRetorno(saida.id, true)} 
                                style={styles.btnAjustar}
                                title="Usar em caso de engano na marcação"
                              >
                                ⏰ Corrigir Hora
                              </button>
                            </div>
                          ) : saida.hora_retorno_real ? (
                            <div>
                              <span style={{ 
                                color: saida.atrasado ? '#f44336' : '#4CAF50', 
                                fontWeight: '600' 
                              }}>
                                {saida.hora_retorno_real}
                              </span>
                              {saida.atrasado && (
                                <div style={{ fontSize: '11px', color: '#f44336', fontWeight: '600' }}>
                                  +{saida.tempo_atraso}min
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>---</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: status.bg,
                            color: status.cor,
                            border: `1px solid ${status.cor}30`,
                          }}>
                            {status.icon} {status.texto}
                            {saida.atrasado && ` (${saida.tempo_atraso}min)`}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            onClick={() => navigate(`/pedido/${saida.id}`)} 
                            style={styles.btnVer}
                            title="Ver detalhes"
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div style={styles.legenda}>
          <h4>📌 Legenda:</h4>
          <div style={styles.legendaItems}>
            <span style={styles.legendaItem}>🟢 Saída = Estudante saindo</span>
            <span style={styles.legendaItem}>🔴 Retorno = Estudante voltando</span>
            <span style={styles.legendaItem}>⏰ Corrigir = Ajustar hora (engano)</span>
            <span style={styles.legendaItem}>⚠️ Atrasado = Passou do horário</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  menuToggle: {
    display: 'none',
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 1001,
    width: '48px',
    height: '48px',
    background: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '22px',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 999,
    backdropFilter: 'blur(4px)',
  },
  alertaBar: {
    background: 'linear-gradient(135deg, #f44336, #FF5722)',
    color: 'white',
    padding: '14px 24px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(244,67,54,0.4)',
    animation: 'pulse 2s infinite',
  },
  alertaContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  alertaIcon: { fontSize: '28px' },
  alertaCount: {
    background: 'rgba(255,255,255,0.2)',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '700',
  },
  sidebar: {
    width: '280px',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: '20px',
    left: '20px',
    bottom: '20px',
    borderRadius: '24px',
    zIndex: 1000,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '24px',
    background: 'linear-gradient(135deg, #FF5722, #E64A19)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    background: 'rgba(255,255,255,0.2)',
  },
  userName: { fontSize: '16px', fontWeight: '700' },
  roleBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    background: 'rgba(255,255,255,0.15)',
    marginTop: '4px',
  },
  nav: {
    flex: 1,
    padding: '20px 16px',
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    borderRadius: '12px',
    marginBottom: '4px',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: '#FFF3E0',
    color: '#FF5722',
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
  },
  logoutButton: {
    width: '100%',
    padding: '12px',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FF5722',
  },
  mainContent: {
    flex: 1,
    padding: '20px 20px 20px 320px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  title: { fontSize: '28px', color: '#1a1a2e', margin: 0, fontWeight: '800' },
  date: { color: '#666', margin: '4px 0 0 0', fontSize: '14px', textTransform: 'capitalize' },
  headerRight: { textAlign: 'right' },
  relogio: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    background: 'white',
    padding: '10px 24px',
    borderRadius: '14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    fontFamily: 'monospace',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '2px solid #f0f0f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statIcon: { fontSize: '32px', marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' },
  tableContainer: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: '8px 16px',
    background: '#FF5722',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#fafbfc',
    padding: '14px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    borderBottom: '2px solid #f0f0f0',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f8f8f8', transition: 'background 0.2s' },
  td: { padding: '14px 12px', fontSize: '13px' },
  tipoBadge: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    background: '#E3F2FD',
    color: '#2196F3',
  },
  btnSaida: {
    padding: '8px 14px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  btnRetorno: {
    padding: '8px 14px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  btnAjustar: {
    padding: '6px 12px',
    background: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
  },
  btnVer: {
    width: '36px',
    height: '36px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: { textAlign: 'center', padding: '60px 20px' },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #FF5722',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#999' },
  legenda: {
    background: 'white',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  legendaItems: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  legendaItem: {
    fontSize: '13px',
    color: '#666',
  },
};

// Adicionar CSS global
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  @media (max-width: 768px) {
    .menu-toggle-btn { display: flex !important; }
    .dashboard-main { padding-left: 20px !important; }
  }
  @media (min-width: 769px) {
    .dashboard-sidebar { transform: translateX(0) !important; }
  }
  tr:hover { background: #fafbfc !important; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 3px; }
  ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
`;
document.head.appendChild(styleSheet);

export default DashboardSeguranca;
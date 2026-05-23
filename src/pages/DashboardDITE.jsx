// src/pages/DashboardDITE.jsx - VERSÃO MODERNA E RESPONSIVA
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardDITE = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [coletivas, setColetivas] = useState([]);
  const [alertasAtraso, setAlertasAtraso] = useState([]);
  const [relatoriosSeguranca, setRelatoriosSeguranca] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DITE');
  const [filtroData, setFiltroData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [modalEncaminhar, setModalEncaminhar] = useState(null);
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [dadosAprovacao, setDadosAprovacao] = useState({
    data_saida: '', hora_saida: '07:00', data_volta: '', hora_volta: '19:00'
  });
  const [showColetiva, setShowColetiva] = useState(false);
  const [formColetiva, setFormColetiva] = useState({
    titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24'
  });
  const [loadingColetiva, setLoadingColetiva] = useState(false);
  const [errorColetiva, setErrorColetiva] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aba, setAba] = useState('pedidos');
  const navigate = useNavigate();

  // Variáveis CSS para temas
  const colors = {
    primary: '#2563EB',
    primaryDark: '#1E40AF',
    primaryLight: '#60A5FA',
    bgBody: '#F8FAFC',
    surface: '#FFFFFF',
    textMain: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#166534',
    successBg: '#DCFCE7',
    warning: '#854D0E',
    warningBg: '#FEF9C3',
    danger: '#991B1B',
    dangerBg: '#FEE2E2'
  };

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    carregarColetivas();
    carregarAlertasAtraso();
    carregarRelatoriosSeguranca();
  }, [filtroEstado, filtroData]);

  // Fechar sidebar ao clicar fora em mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      let url = `/pedidos/`;
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroData) params.append('data_saida', filtroData);
      if (params.toString()) url += `?${params.toString()}`;
      
      const [pedidosRes, statsRes] = await Promise.all([
        api.get(url),
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

  const carregarColetivas = async () => {
    try {
      const res = await api.get('/coletivas/listar/');
      setColetivas(res.data.coletivas || []);
    } catch (err) {}
  };

  const carregarAlertasAtraso = async () => {
    try {
      const res = await api.get('/seguranca/alertas-atraso/');
      setAlertasAtraso(res.data.alertas || []);
    } catch (err) {}
  };

  const carregarRelatoriosSeguranca = async () => {
    try {
      const res = await api.get('/relatorios/');
      const relatoriosSeg = (res.data.relatorios || []).filter(r => r.tipo === 'SEGURANCA');
      setRelatoriosSeguranca(relatoriosSeg);
    } catch (err) {}
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  };

  const abrirModalAprovacao = (pedidoId) => {
    const hoje = new Date().toISOString().split('T')[0];
    setDadosAprovacao({
      data_saida: hoje, hora_saida: '07:00', data_volta: hoje, hora_volta: '19:00'
    });
    setModalAprovacao(pedidoId);
  };

  const confirmarAprovacao = async () => {
    try {
      const response = await api.post(`/pedidos/${modalAprovacao}/aprovar/`, {
        data_saida: dadosAprovacao.data_saida,
        hora_saida: dadosAprovacao.hora_saida,
        data_volta: dadosAprovacao.data_volta,
        hora_volta: dadosAprovacao.hora_volta
      });
      alert(`✅ Pedido aprovado! Saída: ${response.data.data_saida} | Retorno: ${response.data.data_volta}`);
      setModalAprovacao(null);
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      alert('❌ Erro ao aprovar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      if (acao === 'aprovar') {
        abrirModalAprovacao(pedidoId);
        return;
      }
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      await carregarDados();
      await carregarNotificacoes();
      alert(`✅ Pedido ${acao === 'rejeitar' ? 'rejeitado' : 'encaminhado'} com sucesso!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const motivo = prompt('📝 Motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else {
        alert(`❌ ${msg}`);
      }
    }
  };

  const handleEncaminhar = async (pedidoId, destino) => {
    try {
      await api.post(`/pedidos/${pedidoId}/passar-dite/`, { destino });
      setModalEncaminhar(null);
      await carregarDados();
      await carregarNotificacoes();
      alert(`✅ Pedido encaminhado para ${destino === 'DIRECAO' ? 'Direção' : 'Administração'}`);
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar'));
    }
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      await carregarNotificacoes();
    } catch (err) {}
  };

  const criarColetiva = async (e) => {
    e.preventDefault();
    if (!formColetiva.titulo || !formColetiva.data_saida || !formColetiva.data_volta) {
      setErrorColetiva('Preencha todos os campos obrigatórios');
      return;
    }
    setLoadingColetiva(true);
    setErrorColetiva('');
    try {
      await api.post('/coletivas/criar/', formColetiva);
      alert('✅ Saída coletiva criada com sucesso!');
      setShowColetiva(false);
      setFormColetiva({ titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24' });
      carregarColetivas();
    } catch (err) {
      setErrorColetiva(err.response?.data?.error || 'Erro ao criar');
    } finally {
      setLoadingColetiva(false);
    }
  };

  const baixarRelatorio = async (relatorioId) => {
    try {
      const response = await api.get(`/relatorios/download-texto/${relatorioId}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${relatorioId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ Erro ao baixar relatório');
    }
  };

  const getStatusStyle = (estado) => {
    const styles = {
      'PENDENTE_DITE': { background: '#FEF9C3', color: '#854D0E' },
      'PENDENTE_DIRECAO': { background: '#EDE9FE', color: '#7C3AED' },
      'PENDENTE_ADMIN': { background: '#DBEAFE', color: '#2563EB' },
      'APROVADO': { background: '#DCFCE7', color: '#166534' },
      'REJEITADO': { background: '#FEE2E2', color: '#991B1B' },
      'EM_ANDAMENTO': { background: '#E0F2FE', color: '#0284C7' },
      'FINALIZADO': { background: '#F1F5F9', color: '#64748B' }
    };
    return styles[estado] || { background: '#F1F5F9', color: '#64748B' };
  };

  const pedidosFiltrados = pedidos.filter(p =>
    p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  const hoje = new Date().toISOString().split('T')[0];

  // Menu items para sidebar
  const menuItems = [
    { id: 'PENDENTE_DITE', label: 'Pendentes', icon: 'fas fa-clock', count: stats.meus_pedidos_pendentes },
    { id: 'PENDENTE_DIRECAO', label: 'Em Análise', icon: 'fas fa-hourglass-half' },
    { id: 'APROVADO', label: 'Aprovados', icon: 'fas fa-check-circle', count: stats.pedidos_aprovados },
    { id: 'REJEITADO', label: 'Rejeitados', icon: 'fas fa-times-circle', count: stats.pedidos_rejeitados },
    { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: 'fas fa-walking' },
    { id: 'FINALIZADO', label: 'Finalizados', icon: 'fas fa-flag-checkered' }
  ];

  return (
    <div style={styles.container}>
      {/* CSS Global e Fonts */}
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Inter', sans-serif;
          background: #F8FAFC;
          overflow-x: hidden;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        .animate-fade { animation: fadeIn 0.3s ease-out; }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .modal-overlay.open .modal-content {
          transform: scale(1);
        }
        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow: auto;
          transform: scale(0.95);
          transition: transform 0.3s ease;
        }
        @media (max-width: 768px) {
          .modal-content { width: 95%; margin: 16px; }
        }
      `}</style>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        ...styles.sidebar,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}><i className="fas fa-bolt"></i></div>
          <div style={styles.brandText}>DITE</div>
        </div>

        <ul style={styles.navLinks}>
          {menuItems.map(item => (
            <li key={item.id} style={styles.navItem}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setFiltroEstado(item.id); setAba('pedidos'); setSidebarOpen(false); }}
                style={{
                  ...styles.navLink,
                  background: filtroEstado === item.id ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'transparent',
                  color: filtroEstado === item.id ? '#fff' : '#64748B',
                  boxShadow: filtroEstado === item.id ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
                }}
              >
                <i className={item.icon} style={{ width: 20 }}></i>
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: filtroEstado === item.id ? 'rgba(255,255,255,0.2)' : '#FEE2E2',
                    color: filtroEstado === item.id ? '#fff' : '#991B1B',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700
                  }}>{item.count}</span>
                )}
              </a>
            </li>
          ))}
          <li><hr style={styles.divider} /></li>
          <li style={styles.navItem}>
            <a href="#" onClick={(e) => { e.preventDefault(); setAba('coletivas'); setSidebarOpen(false); }} style={styles.navLink}>
              <i className="fas fa-users"></i><span>Saídas Coletivas</span>
              {coletivas.length > 0 && <span style={styles.badge}>{coletivas.length}</span>}
            </a>
          </li>
          <li style={styles.navItem}>
            <a href="#" onClick={(e) => { e.preventDefault(); setAba('alertas'); setSidebarOpen(false); }} style={styles.navLink}>
              <i className="fas fa-shield-alt"></i><span>Alertas Atraso</span>
              {alertasAtraso.length > 0 && <span style={{...styles.badge, background: '#DC2626', color: '#fff' }}>!</span>}
            </a>
          </li>
          <li style={styles.navItem}>
            <a href="#" onClick={(e) => { e.preventDefault(); setAba('relatorios'); setSidebarOpen(false); }} style={styles.navLink}>
              <i className="fas fa-chart-line"></i><span>Relatórios</span>
              {relatoriosSeguranca.length > 0 && <span style={styles.badge}>{relatoriosSeguranca.length}</span>}
            </a>
          </li>
          <li style={styles.navItem}>
            <a href="#" onClick={(e) => { e.preventDefault(); setShowColetiva(true); setSidebarOpen(false); }} style={{...styles.navLink, color: '#059669' }}>
              <i className="fas fa-plus-circle"></i><span>Nova Coletiva</span>
            </a>
          </li>
        </ul>

        <div style={styles.userCard}>
          <div style={styles.userAvatar}>
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome || user?.username || 'User')}&background=2563EB&color=fff`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div style={styles.userInfo}>
            <h4>{user?.nome || user?.username}</h4>
            <p>DITE - Tecnologia</p>
          </div>
          <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8' }}></i>
        </div>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={styles.overlay} />
      )}

      {/* Main Content */}
      <div style={styles.mainWrapper}>
        {/* Header */}
        <header style={styles.topHeader}>
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuToggle}>
            <i className="fas fa-bars"></i>
          </button>
          <div style={styles.headerTitle}>
            <h1>Visão Geral</h1>
            <span>Bem-vindo de volta, aqui está o resumo de hoje.</span>
          </div>
          <div style={styles.headerActions}>
            <button className="icon-btn" style={styles.iconBtn} onClick={carregarDados}>
              <i className="fas fa-sync-alt"></i>
            </button>
            <button className="icon-btn" style={{...styles.iconBtn, position: 'relative'}} onClick={() => setShowNotificacoes(!showNotificacoes)}>
              <i className="fas fa-bell"></i>
              {notificacoesNaoLidas > 0 && <div style={styles.notificationDot}></div>}
            </button>
            <button className="icon-btn" style={styles.iconBtn} onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={styles.contentScroll}>
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: '#EFF6FF', color: '#2563EB' }}>
                <i className="fas fa-clipboard-list"></i>
              </div>
              <div style={styles.statInfo}>
                <h3>{pedidos.length}</h3>
                <p>Pedidos Pendentes</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: '#DCFCE7', color: '#166534' }}>
                <i className="fas fa-check-circle"></i>
              </div>
              <div style={styles.statInfo}>
                <h3>{stats.pedidos_aprovados || 0}</h3>
                <p>Aprovados (Mês)</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, background: '#FEF9C3', color: '#854D0E' }}>
                <i className="fas fa-clock"></i>
              </div>
              <div style={styles.statInfo}>
                <h3>{alertasAtraso.length}</h3>
                <p>Alertas de Atraso</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.tabsContainer}>
            <button onClick={() => setAba('pedidos')} style={{...styles.tab, background: aba === 'pedidos' ? '#fff' : 'transparent', borderBottom: aba === 'pedidos' ? `2px solid ${colors.primary}` : 'none', color: aba === 'pedidos' ? colors.primary : colors.textSecondary }}>
              <i className="fas fa-clipboard-list"></i> Pedidos
            </button>
            <button onClick={() => setAba('coletivas')} style={{...styles.tab, background: aba === 'coletivas' ? '#fff' : 'transparent', borderBottom: aba === 'coletivas' ? `2px solid ${colors.primary}` : 'none', color: aba === 'coletivas' ? colors.primary : colors.textSecondary }}>
              <i className="fas fa-users"></i> Coletivas ({coletivas.length})
            </button>
            <button onClick={() => setAba('alertas')} style={{...styles.tab, background: aba === 'alertas' ? '#fff' : 'transparent', borderBottom: aba === 'alertas' ? `2px solid ${colors.primary}` : 'none', color: aba === 'alertas' ? colors.primary : colors.textSecondary }}>
              <i className="fas fa-shield-alt"></i> Alertas ({alertasAtraso.length})
            </button>
            <button onClick={() => setAba('relatorios')} style={{...styles.tab, background: aba === 'relatorios' ? '#fff' : 'transparent', borderBottom: aba === 'relatorios' ? `2px solid ${colors.primary}` : 'none', color: aba === 'relatorios' ? colors.primary : colors.textSecondary }}>
              <i className="fas fa-chart-line"></i> Relatórios ({relatoriosSeguranca.length})
            </button>
          </div>

          {/* Data Card */}
          <div style={styles.dataCard}>
            <div style={styles.cardHeader}>
              <h3>Pedidos Recentes</h3>
              <div style={styles.searchModern}>
                <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
                <input type="text" placeholder="Buscar estudante, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
              </div>
            </div>

            {aba === 'pedidos' && (
              loading ? (
                <div style={styles.loading}>Carregando...</div>
              ) : pedidosFiltrados.length === 0 ? (
                <div style={styles.emptyState}>Nenhum pedido encontrado</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.modernTable}>
                    <thead>
                      <tr>
                        <th>Estudante</th>
                        <th>Tipo de Saída</th>
                        <th>Data/Hora</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={styles.studentCell}>
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.estudante_nome || 'User')}&background=random`} alt="" style={styles.studentImg} />
                              <div>
                                <span style={styles.studentName}>{p.estudante_nome}</span>
                                <span style={styles.studentCourse}>{p.estudante_curso || '-'} / {p.estudante_classe || '-'}</span>
                              </div>
                            </div>
                          </td>
                          <td>{p.tipo_display}</td>
                          <td>{p.data_saida}</td>
                          <td><span style={{...styles.statusPill, ...getStatusStyle(p.estado)}}>{p.estado_display}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => navigate(`/pedido/${p.id}`)} style={styles.btnOutline}><i className="fas fa-eye"></i></button>
                            {p.acoes_disponiveis?.includes('aprovar') && (
                              <button onClick={() => abrirModalAprovacao(p.id)} style={{...styles.btnPrimary, marginLeft: 8}}><i className="fas fa-check"></i> Analisar</button>
                            )}
                            {p.acoes_disponiveis?.includes('rejeitar') && (
                              <button onClick={() => handleAcao(p.id, 'rejeitar')} style={{...styles.btnDanger, marginLeft: 8}}><i className="fas fa-times"></i></button>
                            )}
                            {p.estado === 'PENDENTE_DITE' && (
                              <button onClick={() => setModalEncaminhar(p.id)} style={{...styles.btnWarning, marginLeft: 8}}><i className="fas fa-share"></i></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {aba === 'coletivas' && (
              coletivas.length === 0 ? (
                <div style={styles.emptyState}>Nenhuma saída coletiva criada</div>
              ) : (
                coletivas.map(c => (
                  <div key={c.id} style={styles.coletivaCard}>
                    <div style={styles.coletivaHeader}>
                      <strong>{c.titulo}</strong>
                      <span style={{...styles.coletivaBadge, background: c.encerrada ? '#F1F5F9' : '#DCFCE7', color: c.encerrada ? '#64748B' : '#166534' }}>
                        {c.encerrada ? 'Encerrada' : 'Ativa'}
                      </span>
                    </div>
                    <div style={styles.coletivaInfo}>
                      <span>📅 {c.data_saida?.split('T')[0]}</span>
                      <span>🔙 {c.data_volta?.split('T')[0]}</span>
                      <span>👤 {c.criador_nome || c.criador}</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{ width: `${((c.total_aceitos || 0) / (c.total_convidados || 1)) * 100}%`, ...styles.progressFill }} />
                    </div>
                    <div style={styles.coletivaStats}>
                      <span><strong>{c.total_convidados || 0}</strong> Convidados</span>
                      <span><strong style={{ color: '#166534' }}>{c.total_aceitos || 0}</strong> Aceitaram</span>
                      <span><strong style={{ color: '#991B1B' }}>{c.total_recusados || 0}</strong> Recusaram</span>
                    </div>
                  </div>
                ))
              )
            )}

            {aba === 'alertas' && (
              alertasAtraso.length === 0 ? (
                <div style={styles.emptyState}>Nenhum alerta de atraso</div>
              ) : (
                alertasAtraso.map(a => (
                  <div key={a.id} onClick={marcarAlertaLido} style={styles.alertaCard}>
                    <div><strong>{a.estudante_nome}</strong> - Atraso de <strong>{a.tempo_atraso} minutos</strong></div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Enviado em: {a.enviado_em}</div>
                    {!a.lido && <span style={styles.alertaBadge}>🔴 Não lido</span>}
                  </div>
                ))
              )
            )}

            {aba === 'relatorios' && (
              relatoriosSeguranca.length === 0 ? (
                <div style={styles.emptyState}>Nenhum relatório recebido</div>
              ) : (
                relatoriosSeguranca.map(r => (
                  <div key={r.id} onClick={() => baixarRelatorio(r.id)} style={styles.relatorioCard}>
                    <div><strong>{r.titulo}</strong></div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Enviado por: {r.criado_por} em {r.created_at}</div>
                    <div style={{ fontSize: 11, color: '#2563EB' }}>📥 Clique para baixar</div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* Modal Aprovação */}
      <div className={`modal-overlay ${modalAprovacao ? 'open' : ''}`} onClick={() => setModalAprovacao(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2>Detalhes da Aprovação</h2>
            <button onClick={() => setModalAprovacao(null)} style={styles.modalClose}>✕</button>
          </div>
          <div style={styles.modalBody}>
            <p style={{ marginBottom: 20, color: '#64748B' }}>Confirme os horários para o estudante</p>
            <div style={styles.formRow}>
              <div style={styles.inputGroup}>
                <label>Data de Saída</label>
                <input type="date" value={dadosAprovacao.data_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, data_saida: e.target.value})} style={styles.inputField} min={hoje} />
              </div>
              <div style={styles.inputGroup}>
                <label>Hora</label>
                <input type="time" value={dadosAprovacao.hora_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_saida: e.target.value})} style={styles.inputField} />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.inputGroup}>
                <label>Previsão de Retorno</label>
                <input type="date" value={dadosAprovacao.data_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, data_volta: e.target.value})} style={styles.inputField} min={dadosAprovacao.data_saida} />
              </div>
              <div style={styles.inputGroup}>
                <label>Hora</label>
                <input type="time" value={dadosAprovacao.hora_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_volta: e.target.value})} style={styles.inputField} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setModalAprovacao(null)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={confirmarAprovacao} style={styles.btnConfirm}>Confirmar Saída</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Encaminhar */}
      <div className={`modal-overlay ${modalEncaminhar ? 'open' : ''}`} onClick={() => setModalEncaminhar(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2>Encaminhar Pedido</h2>
            <button onClick={() => setModalEncaminhar(null)} style={styles.modalClose}>✕</button>
          </div>
          <div style={styles.modalBody}>
            <p style={{ marginBottom: 20 }}>Selecione o destino:</p>
            <button onClick={() => handleEncaminhar(modalEncaminhar, 'DIRECAO')} style={styles.destinoBtn}>
              <span style={{ fontSize: 28 }}>👨‍💼</span>
              <div><strong>Direção</strong><br /><small>Análise final</small></div>
            </button>
            <button onClick={() => handleEncaminhar(modalEncaminhar, 'ADMINISTRACAO')} style={{...styles.destinoBtn, marginTop: 12}}>
              <span style={{ fontSize: 28 }}>🏛️</span>
              <div><strong>Administração</strong><br /><small>Recursos e documentos</small></div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Coletiva */}
      <div className={`modal-overlay ${showColetiva ? 'open' : ''}`} onClick={() => setShowColetiva(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2>👥 Nova Saída Coletiva</h2>
            <button onClick={() => setShowColetiva(false)} style={styles.modalClose}>✕</button>
          </div>
          <div style={styles.modalBody}>
            {errorColetiva && <div style={styles.errorMsg}>{errorColetiva}</div>}
            <form onSubmit={criarColetiva}>
              <input type="text" placeholder="Título *" value={formColetiva.titulo} onChange={e => setFormColetiva({...formColetiva, titulo: e.target.value})} style={styles.inputField} required />
              <textarea placeholder="Descrição" value={formColetiva.descricao} onChange={e => setFormColetiva({...formColetiva, descricao: e.target.value})} rows={3} style={{...styles.inputField, resize: 'vertical', marginTop: 12 }} />
              <div style={styles.formRow}>
                <input type="datetime-local" placeholder="Data Saída" value={formColetiva.data_saida} onChange={e => setFormColetiva({...formColetiva, data_saida: e.target.value})} style={styles.inputField} required />
                <input type="datetime-local" placeholder="Data Volta" value={formColetiva.data_volta} onChange={e => setFormColetiva({...formColetiva, data_volta: e.target.value})} style={styles.inputField} required />
              </div>
              <input type="number" placeholder="Prazo (horas)" value={formColetiva.prazo_horas} onChange={e => setFormColetiva({...formColetiva, prazo_horas: e.target.value})} style={styles.inputField} min="1" max="72" />
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowColetiva(false)} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" disabled={loadingColetiva} style={styles.btnConfirm}>{loadingColetiva ? 'Criando...' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Notificações Panel */}
      {showNotificacoes && (
        <>
          <div onClick={() => setShowNotificacoes(false)} style={styles.notifOverlay} />
          <div style={styles.notifPanel}>
            <div style={styles.notifHeader}>
              <h3>🔔 Notificações</h3>
              <button onClick={() => setShowNotificacoes(false)} style={styles.notifClose}>✕</button>
            </div>
            <div style={styles.notifList}>
              {notificacoes.length === 0 ? (
                <div style={styles.notifEmpty}>Nenhuma notificação</div>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} onClick={() => { marcarNotificacaoLida(n.id); if (n.pedido_id) { navigate(`/pedido/${n.pedido_id}`); setShowNotificacoes(false); } }} style={{...styles.notifItem, background: n.lida ? '#fff' : '#FEFCE8' }}>
                    <div style={styles.notifMessage}>{n.mensagem}</div>
                    <div style={styles.notifDate}>{n.data}</div>
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

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#F8FAFC', position: 'relative' },
  
  // Sidebar
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 280,
    height: '100vh',
    background: '#fff',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #E2E8F0',
    zIndex: 100,
    transition: 'transform 0.3s ease',
    overflowY: 'auto',
    '@media (max-width: 768px)': { transform: 'translateX(-100%)' }
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, paddingLeft: 10 },
  brandIcon: { width: 40, height: 40, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, boxShadow: '0 4px 10px rgba(37,99,235,0.3)' },
  brandText: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#1E293B' },
  navLinks: { listStyle: 'none', flex: 1 },
  navItem: { marginBottom: 8 },
  navLink: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, textDecoration: 'none', fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer' },
  divider: { margin: '12px 0', border: 'none', height: 1, background: '#E2E8F0' },
  badge: { marginLeft: 'auto', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 },
  userCard: { background: '#F8FAFC', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto', border: '1px solid #E2E8F0' },
  userAvatar: { width: 42, height: 42, borderRadius: '50%', overflow: 'hidden' },
  userInfo: { flex: 1 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99, '@media (min-width: 769px)': { display: 'none' } },
  
  // Main content
  mainWrapper: { flex: 1, marginLeft: 280, '@media (max-width: 768px)': { marginLeft: 0 } },
  topHeader: { height: 80, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, '@media (max-width: 768px)': { padding: '0 16px' } },
  menuToggle: { display: 'none', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#1E293B', '@media (max-width: 768px)': { display: 'flex' } },
  headerTitle: { flex: 1, marginLeft: 16, '@media (max-width: 768px)': { marginLeft: 0 } },
  headerActions: { display: 'flex', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, background: '#DC2626', borderRadius: '50%', border: '2px solid white' },
  
  // Content
  contentScroll: { padding: '0 32px 32px', overflowY: 'auto', '@media (max-width: 768px)': { padding: '0 16px 16px' } },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32, '@media (max-width: 768px)': { gap: 16 } },
  statCard: { background: '#fff', padding: 20, borderRadius: 20, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 20, transition: 'transform 0.2s' },
  statIcon: { width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  statInfo: { flex: 1 },
  
  // Tabs
  tabsContainer: { display: 'flex', gap: 4, background: '#F8FAFC', padding: 4, borderRadius: 12, marginBottom: 20, flexWrap: 'wrap' },
  tab: { flex: 1, padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' },
  
  // Data Card
  dataCard: { background: '#fff', borderRadius: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', overflow: 'hidden' },
  cardHeader: { padding: 24, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  searchModern: { position: 'relative', width: 300, '@media (max-width: 768px)': { width: '100%' } },
  searchInput: { width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, outline: 'none', transition: 'all 0.2s' },
  
  // Table
  modernTable: { width: '100%', borderCollapse: 'collapse' },
  studentCell: { display: 'flex', alignItems: 'center', gap: 12 },
  studentImg: { width: 36, height: 36, borderRadius: 10, objectFit: 'cover' },
  studentName: { fontWeight: 600, color: '#1E293B', display: 'block' },
  studentCourse: { fontSize: 12, color: '#64748B' },
  statusPill: { padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block' },
  
  // Buttons
  btnPrimary: { padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  btnOutline: { padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer' },
  btnDanger: { padding: '8px 12px', borderRadius: 8, border: '1px solid #FEE2E2', background: '#fff', color: '#DC2626', cursor: 'pointer' },
  btnWarning: { padding: '8px 12px', borderRadius: 8, border: '1px solid #FEF9C3', background: '#fff', color: '#D97706', cursor: 'pointer' },
  
  // Coletivas
  coletivaCard: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #E2E8F0' },
  coletivaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  coletivaBadge: { padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  coletivaInfo: { display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, flexWrap: 'wrap' },
  progressBar: { height: 8, background: '#E2E8F0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#059669', borderRadius: 4 },
  coletivaStats: { display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' },
  
  // Alertas
  alertaCard: { background: '#FEF2F2', borderLeft: '4px solid #DC2626', padding: 12, marginBottom: 10, borderRadius: 8, cursor: 'pointer' },
  alertaBadge: { fontSize: 11, color: '#DC2626', marginTop: 4, display: 'inline-block' },
  
  // Relatórios
  relatorioCard: { background: '#F5F5F5', padding: 12, marginBottom: 10, borderRadius: 8, cursor: 'pointer' },
  
  // Modal
  modalHeader: { padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalClose: { width: 32, height: 32, border: '1px solid #E2E8F0', background: '#fff', borderRadius: 8, cursor: 'pointer' },
  modalBody: { padding: 20 },
  modalFooter: { display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' },
  formRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  inputGroup: { flex: 1, minWidth: 120 },
  inputField: { width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'all 0.2s' },
  btnCancel: { flex: 1, padding: 12, background: '#F5F5F5', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  btnConfirm: { flex: 2, padding: 12, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  destinoBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid #E2E8F0', borderRadius: 12, background: '#fff', cursor: 'pointer' },
  errorMsg: { background: '#FEF2F2', color: '#991B1B', padding: 12, borderRadius: 10, marginBottom: 16 },
  
  // Notifications
  notifOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 },
  notifPanel: { position: 'fixed', top: 0, right: 0, width: 360, height: '100vh', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'auto', '@media (max-width: 768px)': { width: '100%' } },
  notifHeader: { padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  notifClose: { width: 32, height: 32, background: '#F5F5F5', border: 'none', borderRadius: 8, cursor: 'pointer' },
  notifList: { overflowY: 'auto', height: 'calc(100vh - 70px)' },
  notifEmpty: { textAlign: 'center', padding: 60, color: '#999' },
  notifItem: { padding: 16, borderBottom: '1px solid #F0F0F0', cursor: 'pointer' },
  notifMessage: { fontSize: 13, color: '#333', marginBottom: 4 },
  notifDate: { fontSize: 11, color: '#999' },
  
  // Loading & Empty
  loading: { textAlign: 'center', padding: 60, color: '#999' },
  emptyState: { textAlign: 'center', padding: 60, color: '#999' }
};

export default DashboardDITE;

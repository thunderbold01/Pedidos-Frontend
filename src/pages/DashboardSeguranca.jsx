// src/pages/DashboardSeguranca.jsx - VERSÃO CORRIGIDA
import { useState, useEffect } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // Estados originais
  const [pedidosSaida, setPedidosSaida] = useState([]);
  const [pedidosAndamento, setPedidosAndamento] = useState([]);
  const [pedidosFinalizados, setPedidosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('saida');
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [relatorio, setRelatorio] = useState(null);
  const [mostrarModalData, setMostrarModalData] = useState(false);
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [enviando, setEnviando] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [stats, setStats] = useState({ saidas_hoje: 0, em_andamento: 0, atrasos_hoje: 0 });
  const [filtroNome, setFiltroNome] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Relógio - CORRIGIDO
  useEffect(() => {
    const atualizarHora = () => {
      const now = new Date();
      setHoraAtual(now.toLocaleTimeString('pt-BR'));
    };
    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar dados quando data mudar
  useEffect(() => {
    carregarDashboard();
    carregarDados();
    carregarNotificacoes();
  }, [dataSelecionada]);

  // Funções de backend
  const carregarDashboard = async () => {
    try {
      const res = await api.get('/seguranca/dashboard/');
      setStats(res.data);
    } catch (err) {
      console.error('Erro dashboard:', err);
    }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {
      console.error('Erro notificações:', err);
    }
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
      // Buscar dados da data selecionada
      const response = await api.get(`/seguranca/saidas-data/?data=${dataSelecionada}`);
      const dados = response.data.saidas || [];
      
      setPedidosSaida(dados.filter(p => p.estado === 'APROVADO'));
      setPedidosAndamento(dados.filter(p => p.estado === 'EM_ANDAMENTO'));
      setPedidosFinalizados(dados.filter(p => p.estado === 'FINALIZADO'));
    } catch (err) {
      console.error('Erro carregar dados:', err);
      // Fallback
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
      } catch (err2) {
        console.error('Fallback erro:', err2);
      }
    } finally {
      setLoading(false);
    }
  };

  const marcarSaida = async (pedidoId) => {
    if (!confirm('✅ Confirmar SAÍDA?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      alert(`✅ Saída registrada às ${response.data.hora}`);
      carregarDados();
      carregarDashboard();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Erro ao marcar saída'));
    }
  };

  const marcarSaidaAjustada = async (pedidoId) => {
    const hora = prompt('⏰ Hora da SAÍDA (HH:MM):\nExemplo: 14:30');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
      alert('❌ Formato inválido! Use HH:MM');
      return;
    }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, { hora_saida: hora });
      alert(`✅ Saída registrada: ${response.data.hora}`);
      carregarDados();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Erro'));
    }
  };

  const marcarRetorno = async (pedidoId) => {
    if (!confirm('🔴 Confirmar RETORNO?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`);
      let msg = `✅ Retorno às ${response.data.hora}`;
      if (response.data.atrasado) {
        msg += `\n⚠️ ATRASO: ${response.data.tempo_atraso} minutos!`;
      }
      alert(msg);
      carregarDados();
      carregarDashboard();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Erro'));
    }
  };

  const marcarRetornoAjustado = async (pedidoId) => {
    const hora = prompt('⏰ Hora do RETORNO (HH:MM):\nExemplo: 14:30');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
      alert('❌ Formato inválido!');
      return;
    }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, { hora_retorno: hora });
      alert(`✅ Retorno registrado: ${response.data.hora}`);
      carregarDados();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Erro'));
    }
  };

  const gerarRelatorioCompleto = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seguranca/relatorio-completo/?data=${dataRelatorio}`);
      setRelatorio(response.data);
      setMostrarModalData(false);
      alert('✅ Relatório completo gerado com sucesso!');
    } catch (err) {
      console.error('Erro:', err);
      alert('❌ Erro ao gerar relatório: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const enviarRelatorio = async () => {
    if (!relatorio) return;
    setEnviando(true);
    try {
      await api.post('/seguranca/enviar-relatorio/', { 
        data: relatorio.data,
        conteudo: relatorio.texto_relatorio 
      });
      alert('✅ Relatório enviado para DITE!');
      setRelatorio(null);
    } catch (err) {
      alert('❌ Erro ao enviar: ' + (err.response?.data?.error || err.message));
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Filtrar por nome
  const filtrarPorNome = (lista) => {
    if (!filtroNome) return lista;
    const termo = filtroNome.toLowerCase();
    return lista.filter(p => 
      p.estudante_nome?.toLowerCase().includes(termo) ||
      p.estudante_curso?.toLowerCase().includes(termo)
    );
  };

  const saidaFiltrada = filtrarPorNome(pedidosSaida);
  const andamentoFiltrado = filtrarPorNome(pedidosAndamento);
  const finalizadosFiltrado = filtrarPorNome(pedidosFinalizados);

  return (
    <div style={styles.container}>
      {/* CSS Global */}
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #F8FAFC; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; z-index: 1000; opacity: 0;
          visibility: hidden; transition: all 0.3s ease;
        }
        .modal-overlay.open { opacity: 1; visibility: visible; }
        .modal-overlay.open .modal-content { transform: scale(1); }
        .modal-content {
          background: white; border-radius: 24px; max-width: 500px;
          width: 90%; max-height: 90vh; overflow: auto;
          transform: scale(0.95); transition: transform 0.3s ease;
        }
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; left: -280px !important; transition: left 0.3s ease !important; }
          .sidebar.open { left: 0 !important; background: #fff; z-index: 1000; }
          .main-wrapper { margin-left: 0 !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}><i className="fas fa-shield-alt"></i></div>
          <div style={styles.brandText}>Segurança</div>
        </div>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'S'}
          </div>
          <div>
            <div style={styles.userName}>{user?.nome || user?.username}</div>
            <div style={styles.userRole}>🛡️ Segurança</div>
          </div>
        </div>
        <nav style={styles.nav}>
          <button onClick={() => setAbaAtiva('saida')} style={{...styles.navItem, ...(abaAtiva === 'saida' && styles.navActive)}}>
            <i className="fas fa-sign-out-alt"></i> Saída
          </button>
          <button onClick={() => setAbaAtiva('andamento')} style={{...styles.navItem, ...(abaAtiva === 'andamento' && styles.navActive)}}>
            <i className="fas fa-walking"></i> Em Andamento
          </button>
          <button onClick={() => setAbaAtiva('finalizado')} style={{...styles.navItem, ...(abaAtiva === 'finalizado' && styles.navActive)}}>
            <i className="fas fa-check-circle"></i> Finalizados
          </button>
        </nav>
        <button onClick={onLogout} style={styles.logoutBtn}>
          <i className="fas fa-sign-out-alt"></i> Sair
        </button>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={styles.overlay} />}

      {/* Main Content */}
      <div className="main-wrapper" style={styles.mainWrapper}>
        {/* Header */}
        <header style={styles.header}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuToggle}>
            <i className="fas fa-bars"></i>
          </button>
          <div style={styles.headerTitle}>
            <h1>🛡️ Controle de Portão</h1>
            <p>{user?.nome || user?.username} • {horaAtual}</p>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.dateBox}>
              <i className="fas fa-calendar"></i>
              <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} style={styles.dateInput} />
            </div>
            <button onClick={() => setShowNotificacoes(!showNotificacoes)} style={styles.notifBtn}>
              <i className="fas fa-bell"></i>
              {notificacoesNaoLidas > 0 && <span style={styles.badge}>{notificacoesNaoLidas}</span>}
            </button>
            <button onClick={carregarDados} style={styles.refreshBtn}>
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, borderLeftColor: '#f59e0b'}}>
            <div style={{...styles.statIcon, background: '#FEF9C3', color: '#f59e0b'}}><i className="fas fa-clock"></i></div>
            <div><div style={styles.statValue}>{pedidosSaida.length}</div><div style={styles.statLabel}>Aguardando Saída</div></div>
          </div>
          <div style={{...styles.statCard, borderLeftColor: '#3b82f6'}}>
            <div style={{...styles.statIcon, background: '#EFF6FF', color: '#3b82f6'}}><i className="fas fa-walking"></i></div>
            <div><div style={styles.statValue}>{pedidosAndamento.length}</div><div style={styles.statLabel}>Em Andamento</div></div>
          </div>
          <div style={{...styles.statCard, borderLeftColor: '#10b981'}}>
            <div style={{...styles.statIcon, background: '#DCFCE7', color: '#10b981'}}><i className="fas fa-check-circle"></i></div>
            <div><div style={styles.statValue}>{pedidosFinalizados.length}</div><div style={styles.statLabel}>Finalizados</div></div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={styles.searchBar}>
          <div style={styles.searchWrapper}>
            <i className="fas fa-search" style={styles.searchIcon}></i>
            <input type="text" placeholder="Buscar por estudante..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} style={styles.searchInput} />
          </div>
          <button onClick={() => setMostrarModalData(true)} style={styles.btnReport}>
            <i className="fas fa-file-alt"></i> Relatório Completo
          </button>
        </div>

        {/* Data Destaque */}
        <div style={styles.dataDestaque}>
          <i className="fas fa-calendar-day"></i> {formatarData(dataSelecionada)}
        </div>

        {/* Cards Grid */}
        <div style={styles.cardsContainer}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <p>Carregando...</p>
            </div>
          ) : (
            <>
              {/* Aba SAÍDA */}
              {abaAtiva === 'saida' && (
                saidaFiltrada.length === 0 ? (
                  <div style={styles.emptyState}>
                    <i className="fas fa-inbox" style={{ fontSize: 48, color: '#94A3B8', marginBottom: 16 }}></i>
                    <p>Nenhum estudante aguardando saída</p>
                  </div>
                ) : (
                  <div style={styles.cardsGrid}>
                    {saidaFiltrada.map(p => (
                      <div key={p.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                          <div style={styles.cardIcon}>🎓</div>
                          <div style={styles.cardTitle}>{p.estudante_nome}</div>
                        </div>
                        <div style={styles.cardBody}>
                          <div><i className="fas fa-graduation-cap"></i> {p.estudante_curso || 'Curso não informado'}</div>
                          <div style={styles.cardTimes}>
                            <div><span>🚪 Saída: </span><strong>{p.hora_saida_prevista || '-'}</strong></div>
                            <div><span>🔙 Retorno: </span><strong>{p.hora_volta_prevista || '-'}</strong></div>
                          </div>
                        </div>
                        <div style={styles.cardActions}>
                          <button onClick={() => marcarSaida(p.id)} style={styles.btnSaida}>🟢 REGISTRAR SAÍDA</button>
                          <button onClick={() => marcarSaidaAjustada(p.id)} style={styles.btnAjustar}>⏰ AJUSTAR</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Aba ANDAMENTO */}
              {abaAtiva === 'andamento' && (
                andamentoFiltrado.length === 0 ? (
                  <div style={styles.emptyState}>
                    <i className="fas fa-walking" style={{ fontSize: 48, color: '#94A3B8', marginBottom: 16 }}></i>
                    <p>Nenhum estudante em andamento</p>
                  </div>
                ) : (
                  <div style={styles.cardsGrid}>
                    {andamentoFiltrado.map(p => (
                      <div key={p.id} style={{...styles.card, borderLeft: '4px solid #3b82f6'}}>
                        <div style={styles.cardHeader}>
                          <div style={styles.cardIcon}>🚶</div>
                          <div style={styles.cardTitle}>{p.estudante_nome}</div>
                        </div>
                        <div style={styles.cardBody}>
                          <div><i className="fas fa-graduation-cap"></i> {p.estudante_curso || 'Curso não informado'}</div>
                          <div style={styles.cardTimes}>
                            <div><span>✅ Saiu às: </span><strong>{p.hora_saida_real || '-'}</strong></div>
                            <div><span>⏰ Prev. Retorno: </span><strong>{p.hora_volta_prevista || '-'}</strong></div>
                          </div>
                        </div>
                        <div style={styles.cardActions}>
                          <button onClick={() => marcarRetorno(p.id)} style={styles.btnRetorno}>🔴 REGISTRAR RETORNO</button>
                          <button onClick={() => marcarRetornoAjustado(p.id)} style={styles.btnAjustar}>⏰ AJUSTAR</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Aba FINALIZADO */}
              {abaAtiva === 'finalizado' && (
                finalizadosFiltrado.length === 0 ? (
                  <div style={styles.emptyState}>
                    <i className="fas fa-check-circle" style={{ fontSize: 48, color: '#94A3B8', marginBottom: 16 }}></i>
                    <p>Nenhum estudante finalizado</p>
                  </div>
                ) : (
                  <div style={styles.cardsGrid}>
                    {finalizadosFiltrado.map(p => (
                      <div key={p.id} style={{...styles.card, borderLeft: p.atrasado ? '4px solid #ef4444' : '4px solid #10b981', opacity: 0.9}}>
                        <div style={styles.cardHeader}>
                          <div style={styles.cardIcon}>✅</div>
                          <div style={styles.cardTitle}>{p.estudante_nome}</div>
                          {p.atrasado && <span style={styles.atrasoBadge}>⚠️ Atraso</span>}
                        </div>
                        <div style={styles.cardBody}>
                          <div><i className="fas fa-graduation-cap"></i> {p.estudante_curso || 'Curso não informado'}</div>
                          <div style={styles.cardTimes}>
                            <div><span>✅ Saiu: </span><strong>{p.hora_saida_real || '-'}</strong></div>
                            <div><span>🔴 Retornou: </span><strong>{p.hora_retorno_real || '-'}</strong></div>
                          </div>
                          {p.atrasado && <div style={styles.atrasoInfo}>⚠️ Atraso de {p.tempo_atraso} minutos</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Relatório */}
      <div className={`modal-overlay ${mostrarModalData ? 'open' : ''}`} onClick={() => setMostrarModalData(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3>📄 Gerar Relatório Completo</h3>
            <button onClick={() => setMostrarModalData(false)} style={styles.modalClose}>✕</button>
          </div>
          <div style={styles.modalBody}>
            <label style={styles.modalLabel}>Data do Relatório:</label>
            <input type="date" value={dataRelatorio} onChange={(e) => setDataRelatorio(e.target.value)} style={styles.modalInput} />
            <div style={styles.modalButtons}>
              <button onClick={() => setMostrarModalData(false)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={gerarRelatorioCompleto} style={styles.btnSuccess}>Gerar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Relatório Gerado */}
      {relatorio && (
        <div className="modal-overlay open" onClick={() => setRelatorio(null)}>
          <div style={{...styles.modalContent, maxWidth: 800, maxHeight: '80vh', overflow: 'auto'}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📄 Relatório Completo - {relatorio.data}</h3>
              <button onClick={() => setRelatorio(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.relatorioResumo}>
                <h4>📊 RESUMO DO DIA</h4>
                <p>👥 Total Autorizados: <strong>{relatorio.total_autorizados}</strong></p>
                <p>✅ Saídas Registradas: <strong>{relatorio.saidas_registradas}</strong> ({relatorio.taxa_saida}%)</p>
                <p>🔴 Retornos Registrados: <strong>{relatorio.retornos_registrados}</strong> ({relatorio.taxa_retorno}%)</p>
                <p>⚠️ Atrasos: <strong>{relatorio.atrasos}</strong> ({relatorio.taxa_atraso}%)</p>
              </div>
              <div style={styles.relatorioLista}>
                <h4>👨‍🎓 LISTA COMPLETA</h4>
                <table style={styles.table}>
                  <thead>
                    <tr><th>Estudante</th><th>Saída Real</th><th>Retorno Real</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {relatorio.lista_completa?.map((item, idx) => (
                      <tr key={idx} style={item.atrasado ? { background: '#FEF2F2' } : {}}>
                        <td>{item.estudante}</td>
                        <td>{item.hora_saida_real || '⏳ Não saiu'}</td>
                        <td>{item.hora_retorno_real || (item.hora_saida_real ? '⏳ Aguardando' : '-')}</td>
                        <td>{item.atrasado ? '⚠️ Atrasado' : item.hora_retorno_real ? '✅ Completo' : item.hora_saida_real ? '🚶 Em andamento' : '⏳ Aguardando'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(relatorio.texto_relatorio)}`, '_blank')} style={styles.btnSecondary}>📄 Visualizar Texto</button>
              <button onClick={enviarRelatorio} disabled={enviando} style={styles.btnSuccess}>{enviando ? 'Enviando...' : '📧 Enviar para DITE'}</button>
              <button onClick={() => setRelatorio(null)} style={styles.btnCancel}>Fechar</button>
            </div>
          </div>
        </div>
      )}

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
                  <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{...styles.notifItem, background: n.lida ? '#fff' : '#FEFCE8'}}>
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
    '@media (max-width: 768px)': { position: 'fixed', left: '-280px', zIndex: 100 }
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
  brandIcon: { width: 40, height: 40, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 },
  brandText: { fontSize: 20, fontWeight: 700, color: '#1E293B' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#F8FAFC', borderRadius: 16, marginBottom: 24 },
  avatar: { width: 44, height: 44, borderRadius: 50, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 18 },
  userName: { fontSize: 14, fontWeight: 600, color: '#1E293B' },
  userRole: { fontSize: 12, color: '#64748B' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent', textAlign: 'left', fontSize: 14, fontWeight: 500, color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12 },
  navActive: { background: '#EFF6FF', color: '#2563EB' },
  logoutBtn: { padding: '12px 16px', background: '#FEF2F2', border: 'none', borderRadius: 12, color: '#DC2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99, display: 'none', '@media (max-width: 768px)': { display: 'block' } },
  
  // Main content
  mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  menuToggle: { display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', marginRight: 12, '@media (max-width: 768px)': { display: 'block' } },
  header: { background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  headerTitle: { flex: 1 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  dateBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0' },
  dateInput: { border: 'none', background: 'transparent', fontSize: 14, outline: 'none' },
  notifBtn: { position: 'relative', padding: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer' },
  badge: { position: 'absolute', top: -5, right: -5, background: '#DC2626', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 20 },
  refreshBtn: { padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer' },
  
  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '24px', '@media (max-width: 768px)': { gap: 12 } },
  statCard: { background: '#fff', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #E2E8F0', borderLeftWidth: 4 },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  statValue: { fontSize: 24, fontWeight: 700, color: '#1E293B' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  
  // Search
  searchBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 16px', gap: 16, flexWrap: 'wrap' },
  searchWrapper: { position: 'relative', flex: 1, maxWidth: 320, '@media (max-width: 768px)': { maxWidth: '100%' } },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 14 },
  searchInput: { width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none' },
  btnReport: { padding: '10px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 },
  
  // Data
  dataDestaque: { background: '#EFF6FF', margin: '0 24px 16px', padding: '10px 16px', borderRadius: 10, fontSize: 13, color: '#2563EB', textAlign: 'center' },
  
  // Cards
  cardsContainer: { padding: '0 24px 24px', minHeight: 400 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', transition: 'all 0.2s' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid #F1F5F9' },
  cardIcon: { fontSize: 28 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: 600, color: '#1E293B' },
  atrasoBadge: { padding: '4px 10px', background: '#FEF2F2', color: '#DC2626', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  cardBody: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  cardTimes: { display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 },
  cardActions: { display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #F1F5F9', background: '#F8FAFC' },
  atrasoInfo: { marginTop: 8, padding: 8, background: '#FEF2F2', borderRadius: 8, fontSize: 12, color: '#DC2626', textAlign: 'center' },
  
  // Buttons
  btnSaida: { flex: 1, padding: 10, background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnRetorno: { flex: 1, padding: 10, background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnAjustar: { flex: 1, padding: 10, background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnSuccess: { padding: '10px 20px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnCancel: { padding: '10px 20px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnSecondary: { padding: '10px 20px', background: '#F1F5F9', color: '#1E293B', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  
  // Loading
  loading: { textAlign: 'center', padding: 60, color: '#94A3B8' },
  spinner: { width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  emptyState: { textAlign: 'center', padding: 60, color: '#94A3B8' },
  
  // Modal
  modalHeader: { padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalClose: { width: 32, height: 32, border: '1px solid #E2E8F0', background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  modalBody: { padding: 20 },
  modalFooter: { padding: '16px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' },
  modalLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 },
  modalInput: { width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none' },
  modalButtons: { display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' },
  modalContent: { background: '#fff', borderRadius: 16, width: '90%', maxWidth: 550, maxHeight: '80vh', overflow: 'auto' },
  relatorioResumo: { background: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 20 },
  relatorioLista: { marginBottom: 20, padding: 12, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, maxHeight: 300, overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  
  // Notifications
  notifOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 },
  notifPanel: { position: 'fixed', top: 0, right: 0, width: 360, height: '100vh', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'auto', '@media (max-width: 768px)': { width: '100%' } },
  notifHeader: { padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  notifClose: { width: 32, height: 32, background: '#F5F5F5', border: 'none', borderRadius: 8, cursor: 'pointer' },
  notifList: { overflowY: 'auto', height: 'calc(100vh - 70px)' },
  notifEmpty: { textAlign: 'center', padding: 60, color: '#94A3B8' },
  notifItem: { padding: 16, borderBottom: '1px solid #F1F5F9', cursor: 'pointer' },
  notifMessage: { fontSize: 13, color: '#1E293B', marginBottom: 4 },
  notifDate: { fontSize: 11, color: '#94A3B8' },
};

export default DashboardSeguranca;

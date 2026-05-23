// src/pages/DashboardSeguranca.jsx - VERSÃO VISUAL MODERNO (Lógica Preservada)
import { useState, useEffect, useMemo } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // --- ESTADOS ORIGINAIS (PRESERVADOS) ---
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
  const [horaAtual, setHoraAtual] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [stats, setStats] = useState({ saidas_hoje: 0, em_andamento: 0, atrasos_hoje: 0 });
  
  // --- NOVO ESTADO PARA FILTRO VISUAL ---
  const [filtroNome, setFiltroNome] = useState('');

  // Relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar dados
  useEffect(() => {
    carregarDashboard();
    carregarDados();
    carregarNotificacoes();
  }, [dataSelecionada]);

  // --- FUNÇÕES DE BACKEND (INTACTAS) ---
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
      const response = await api.get(`/seguranca/saidas-hoje/`);
      const saidas = response.data.saidas || [];
      const hoje = new Date().toISOString().split('T')[0];
      let dadosFiltrados = saidas;
      
      if (dataSelecionada !== hoje) {
        const resData = await api.get(`/seguranca/saidas-data/?data=${dataSelecionada}`);
        dadosFiltrados = resData.data.saidas || [];
      }
      
      setPedidosSaida(dadosFiltrados.filter(p => p.estado === 'APROVADO'));
      setPedidosAndamento(dadosFiltrados.filter(p => p.estado === 'EM_ANDAMENTO'));
      setPedidosFinalizados(dadosFiltrados.filter(p => p.estado === 'FINALIZADO'));
    } catch (err) {
      console.error('Erro carregar dados:', err);
      try {
        const res = await api.get('/pedidos/');
        const todos = res.data.pedidos || [];
        const hoje = new Date().toISOString().split('T')[0];
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
    if (!confirm('✅ Confirmar SAÍDA?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      alert(`✅ Saída registrada às ${response.data.hora}`);
      carregarDados(); carregarDashboard();
    } catch (err) { alert('❌ ' + (err.response?.data?.error || 'Erro ao marcar saída')); }
  };

  const marcarSaidaAjustada = async (pedidoId) => {
    const hora = prompt('⏰ Hora da SAÍDA (HH:MM):');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) { alert('❌ Formato inválido! Use HH:MM'); return; }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, { hora_saida: hora });
      alert(`✅ Saída registrada: ${response.data.hora}`);
      carregarDados();
    } catch (err) { alert('❌ ' + (err.response?.data?.error || 'Erro')); }
  };

  const marcarRetorno = async (pedidoId) => {
    if (!confirm('🔴 Confirmar RETORNO?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`);
      let msg = `✅ Retorno às ${response.data.hora}`;
      if (response.data.atrasado) msg += `\n⚠️ ATRASO: ${response.data.tempo_atraso} minutos!`;
      alert(msg); carregarDados(); carregarDashboard();
    } catch (err) { alert('❌ ' + (err.response?.data?.error || 'Erro')); }
  };

  const marcarRetornoAjustado = async (pedidoId) => {
    const hora = prompt('⏰ Hora do RETORNO (HH:MM):');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) { alert('❌ Formato inválido!'); return; }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, { hora_retorno: hora });
      alert(`✅ Retorno registrado: ${response.data.hora}`);
      carregarDados();
    } catch (err) { alert('❌ ' + (err.response?.data?.error || 'Erro')); }
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
    } finally { setLoading(false); }
  };

  const enviarRelatorio = async () => {
    if (!relatorio) return;
    setEnviando(true);
    try {
      await api.post('/seguranca/enviar-relatorio/', { data: relatorio.data, conteudo: relatorio.texto_relatorio });
      alert('✅ Relatório enviado para DITE!');
      setRelatorio(null);
    } catch (err) { alert('❌ Erro ao enviar: ' + (err.response?.data?.error || err.message)); }
    finally { setEnviando(false); }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // --- FILTRO CLIENT-SIDE (SEM BACKEND) ---
  const filtrarLista = (lista) => {
    if (!filtroNome) return lista;
    const termo = filtroNome.toLowerCase();
    return lista.filter(p => 
      p.estudante_nome?.toLowerCase().includes(termo) || 
      p.estudante_curso?.toLowerCase().includes(termo)
    );
  };

  const listaSaida = useMemo(() => filtrarLista(pedidosSaida), [pedidosSaida, filtroNome]);
  const listaAndamento = useMemo(() => filtrarLista(pedidosAndamento), [pedidosAndamento, filtroNome]);
  const listaFinalizados = useMemo(() => filtrarLista(pedidosFinalizados), [pedidosFinalizados, filtroNome]);

  // --- ESTILOS MODERNOS (CSS-in-JS) ---
  const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif', color: '#0F172A' },
    
    // Sidebar Minimalista
    sidebar: { width: 240, background: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: 20, display: 'flex', flexDirection: 'column' },
    brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30, paddingLeft: 8 },
    brandIcon: { width: 36, height: 36, background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16 },
    brandText: { fontSize: 18, fontWeight: 700, color: '#0F172A' },
    
    // Main Content
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    
    // Header
    header: { height: 64, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 20 },
    pageTitle: { fontSize: 18, fontWeight: 600 },
    clock: { background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    
    // Status Bar (Minimalista)
    statusBar: { background: '#FFFFFF', padding: '8px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 24, fontSize: 13, fontWeight: 500 },
    statusItem: { display: 'flex', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: '50%' },
    
    // Toolbar
    toolbar: { padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' },
    tabs: { display: 'flex', background: '#E2E8F0', padding: 3, borderRadius: 8 },
    tabBtn: { padding: '6px 16px', border: 'none', background: 'transparent', borderRadius: 5, fontSize: 13, fontWeight: 600, color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' },
    tabActive: { background: '#FFFFFF', color: '#0F172A', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    
    // Search & Actions
    searchBox: { position: 'relative', width: 280 },
    searchInput: { width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#FFFFFF' },
    searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 12 },
    btnReport: { padding: '8px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A', transition: '0.2s' },
    
    // Table Container
    tableContainer: { flex: 1, margin: '0 24px 24px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    thead: { position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 5 },
    th: { textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' },
    td: { padding: '12px 16px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' },
    trHover: { '&:hover': { background: '#F8FAFC' } },
    
    // Table Cells
    userCell: { display: 'flex', alignItems: 'center', gap: 12, width: 250 },
    avatar: { width: 32, height: 32, background: '#E2E8F0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, color: '#64748B' },
    userInfo: { display: 'flex', flexDirection: 'column' },
    userName: { fontWeight: 600, fontSize: 14 },
    userCourse: { fontSize: 12, color: '#64748B' },
    
    // Badges & Buttons
    badge: { padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, display: 'inline-block' },
    badgeWarn: { background: '#FEF9C3', color: '#854D0E' },
    badgeSuccess: { background: '#DCFCE7', color: '#166534' },
    badgeDanger: { background: '#FEE2E2', color: '#991B1B' },
    badgeInfo: { background: '#EFF6FF', color: '#2563EB' },
    
    actionBtn: { padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: '0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 },
    btnPrimary: { background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', color: 'white' },
    btnDanger: { background: '#EF4444', color: 'white' },
    btnOutline: { background: 'transparent', border: '1px solid #E2E8F0', color: '#64748B' },
    
    // Modals
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalBox: { background: '#FFFFFF', width: '90%', maxWidth: 500, borderRadius: 16, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E2E8F0' },
    modalTitle: { fontSize: 18, fontWeight: 600 },
    modalBody: { display: 'flex', flexDirection: 'column', gap: 16 },
    modalFooter: { marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, justifyContent: 'flex-end' },
    
    formInput: { padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', width: '100%' },
    
    // Notification Panel
    notifPanel: { position: 'fixed', top: 0, right: 0, width: 360, height: '100vh', background: '#FFFFFF', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 200, display: 'flex', flexDirection: 'column' },
    notifHeader: { padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    notifList: { flex: 1, overflowY: 'auto' },
    notifItem: { padding: 16, borderBottom: '1px solid #F1F5F9', cursor: 'pointer' },
    
    // Empty State
    emptyState: { textAlign: 'center', padding: 60, color: '#64748B' },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}><i className="fas fa-shield-alt"></i></div>
          <span style={styles.brandText}>Segurança</span>
        </div>
        <nav style={{ flex: 1 }}>
          {/* Placeholder para menu futuro */}
        </nav>
        <button onClick={onLogout} style={{...styles.actionBtn, ...styles.btnOutline, width: '100%', justifyContent: 'center', marginTop: 'auto'}}>
          <i className="fas fa-sign-out-alt"></i> Sair
        </button>
      </aside>

      {/* Main Content */}
      <div style={styles.main}>
        
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>Controle de Portão</h1>
            <span style={{ color: '#64748B', fontSize: 14 }}>• {horaAtual}</span>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.clock}>{dataSelecionada}</div>
            <button onClick={() => setShowNotificacoes(!showNotificacoes)} style={{...styles.actionBtn, ...styles.btnOutline, position: 'relative'}}>
              <i className="fas fa-bell"></i>
              {notificacoesNaoLidas > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#EF4444', borderRadius: '50%', border: '2px solid white' }} />}
            </button>
          </div>
        </header>

        {/* Status Bar Minimalista */}
        <div style={styles.statusBar}>
          <div style={styles.statusItem}>
            <div style={{...styles.dot, background: '#F59E0B'}}></div>
            <span>Aguardando: <strong>{pedidosSaida.length}</strong></span>
          </div>
          <div style={styles.statusItem}>
            <div style={{...styles.dot, background: '#3B82F6'}}></div>
            <span>Em Andamento: <strong>{pedidosAndamento.length}</strong></span>
          </div>
          <div style={styles.statusItem}>
            <div style={{...styles.dot, background: '#10B981'}}></div>
            <span>Finalizados: <strong>{pedidosFinalizados.length}</strong></span>
          </div>
        </div>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.tabs}>
            <button onClick={() => setAbaAtiva('saida')} style={{...styles.tabBtn, ...(abaAtiva === 'saida' && styles.tabActive)}}>Saída</button>
            <button onClick={() => setAbaAtiva('andamento')} style={{...styles.tabBtn, ...(abaAtiva === 'andamento' && styles.tabActive)}}>Em Andamento</button>
            <button onClick={() => setAbaAtiva('finalizado')} style={{...styles.tabBtn, ...(abaAtiva === 'finalizado' && styles.tabActive)}}>Finalizados</button>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={styles.searchBox}>
              <i className="fas fa-search" style={styles.searchIcon}></i>
              <input 
                type="text" 
                placeholder="Filtrar por nome ou curso..." 
                style={styles.searchInput}
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              />
            </div>
            <button onClick={() => setMostrarModalData(true)} style={{...styles.btnReport, background: '#2563EB', color: 'white', border: 'none'}}>
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
                <th style={styles.th}>Curso/Classe</th>
                <th style={styles.th}>Horários</th>
                <th style={styles.th}>Status</th>
                <th style={{...styles.th, textAlign: 'right'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{...styles.td, textAlign: 'center', padding: 40}}>Carregando dados...</td></tr>
              ) : (
                <>
                  {abaAtiva === 'saida' && listaSaida.length === 0 && (
                    <tr><td colSpan="5" style={styles.emptyState}>Nenhum estudante aguardando saída</td></tr>
                  )}
                  {abaAtiva === 'andamento' && listaAndamento.length === 0 && (
                    <tr><td colSpan="5" style={styles.emptyState}>Nenhum estudante em andamento</td></tr>
                  )}
                  {abaAtiva === 'finalizado' && listaFinalizados.length === 0 && (
                    <tr><td colSpan="5" style={styles.emptyState}>Nenhum registro finalizado</td></tr>
                  )}

                  {/* Render: SAÍDA */}
                  {abaAtiva === 'saida' && listaSaida.map(p => (
                    <tr key={p.id} style={styles.trHover}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={styles.avatar}>{p.estudante_nome?.charAt(0)}</div>
                          <div style={styles.userInfo}>
                            <span style={styles.userName}>{p.estudante_nome}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={{ color: '#64748B' }}>{p.estudante_curso || '-'}</span></td>
                      <td style={styles.td}>
                        <div style={{ fontSize: 12 }}>
                          <div>Saída: <strong>{p.hora_saida_prevista}</strong></div>
                          <div style={{ color: '#64748B' }}>Volta: {p.hora_volta_prevista}</div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={{...styles.badge, ...styles.badgeWarn}}>Pendente</span></td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button onClick={() => marcarSaidaAjustada(p.id)} style={{...styles.actionBtn, ...styles.btnOutline, marginRight: 8}} title="Ajustar"><i className="fas fa-clock"></i></button>
                        <button onClick={() => marcarSaida(p.id)} style={{...styles.actionBtn, ...styles.btnPrimary}}>Registrar Saída</button>
                      </td>
                    </tr>
                  ))}

                  {/* Render: ANDAMENTO */}
                  {abaAtiva === 'andamento' && listaAndamento.map(p => (
                    <tr key={p.id} style={styles.trHover}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={{...styles.avatar, background: '#DBEAFE', color: '#2563EB'}}>{p.estudante_nome?.charAt(0)}</div>
                          <div style={styles.userInfo}>
                            <span style={styles.userName}>{p.estudante_nome}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={{ color: '#64748B' }}>{p.estudante_curso || '-'}</span></td>
                      <td style={styles.td}>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ color: '#166534' }}>Saiu: <strong>{p.hora_saida_real}</strong></div>
                          <div style={{ color: '#64748B' }}>Prev. Volta: {p.hora_volta_prevista}</div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={{...styles.badge, ...styles.badgeInfo}}>Em Andamento</span></td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button onClick={() => marcarRetornoAjustado(p.id)} style={{...styles.actionBtn, ...styles.btnOutline, marginRight: 8}} title="Ajustar"><i className="fas fa-clock"></i></button>
                        <button onClick={() => marcarRetorno(p.id)} style={{...styles.actionBtn, ...styles.btnDanger}}>Registrar Retorno</button>
                      </td>
                    </tr>
                  ))}

                  {/* Render: FINALIZADO */}
                  {abaAtiva === 'finalizado' && listaFinalizados.map(p => (
                    <tr key={p.id} style={{...styles.trHover, opacity: 0.8}}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={{...styles.avatar, background: '#D1FAE5', color: '#059669'}}>{p.estudante_nome?.charAt(0)}</div>
                          <div style={styles.userInfo}>
                            <span style={styles.userName}>{p.estudante_nome}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={{ color: '#64748B' }}>{p.estudante_curso || '-'}</span></td>
                      <td style={styles.td}>
                        <div style={{ fontSize: 12 }}>
                          <div>Saída: {p.hora_saida_real}</div>
                          <div>Volta: {p.hora_retorno_real}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {p.atrasado 
                          ? <span style={{...styles.badge, ...styles.badgeDanger}}>Atraso ({p.tempo_atraso}m)</span>
                          : <span style={{...styles.badge, ...styles.badgeSuccess}}>Concluído</span>}
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button style={{...styles.actionBtn, ...styles.btnOutline}} disabled>Ver Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Relatório Data */}
      {mostrarModalData && (
        <div style={styles.modalOverlay} onClick={() => setMostrarModalData(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>📄 Gerar Relatório</span>
              <button onClick={() => setMostrarModalData(false)} style={{...styles.actionBtn, ...styles.btnOutline, padding: '4px 8px'}}><i className="fas fa-times"></i></button>
            </div>
            <div style={styles.modalBody}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Data do Relatório:</label>
              <input type="date" value={dataRelatorio} onChange={(e) => setDataRelatorio(e.target.value)} style={styles.formInput} />
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setMostrarModalData(false)} style={{...styles.actionBtn, ...styles.btnOutline}}>Cancelar</button>
              <button onClick={gerarRelatorioCompleto} style={{...styles.actionBtn, ...styles.btnPrimary}}>Gerar Relatório</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Relatório Completo */}
      {relatorio && (
        <div style={styles.modalOverlay} onClick={() => setRelatorio(null)}>
          <div style={{...styles.modalBox, maxWidth: 800, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>📄 Relatório - {relatorio.data}</span>
              <button onClick={() => setRelatorio(null)} style={{...styles.actionBtn, ...styles.btnOutline, padding: '4px 8px'}}><i className="fas fa-times"></i></button>
            </div>
            <div style={{...styles.modalBody, flex: 1, overflowY: 'auto', padding: '0 24px 24px'}}>
              {/* Resumo Stats */}
              <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, marginBottom: 20 }}>
                <h4 style={{ marginBottom: 12, fontSize: 14 }}>📊 RESUMO</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
                  <div>👥 Total: <strong>{relatorio.total_autorizados}</strong></div>
                  <div>✅ Saídas: <strong>{relatorio.saidas_registradas}</strong></div>
                  <div>🔴 Retornos: <strong>{relatorio.retornos_registrados}</strong></div>
                  <div>⚠️ Atrasos: <strong>{relatorio.atrasos}</strong></div>
                  <div>⏳ Pendentes: <strong>{relatorio.sem_saida}</strong></div>
                  <div>🚶 Andamento: <strong>{relatorio.em_andamento}</strong></div>
                </div>
              </div>
              
              {/* Lista Tabela */}
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>👨‍🎓 Lista Completa</h4>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{...styles.table, fontSize: 12 }}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>Estudante</th>
                      <th style={styles.th}>Curso</th>
                      <th style={styles.th}>Saída</th>
                      <th style={styles.th}>Retorno</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.lista_completa?.map((item, idx) => (
                      <tr key={idx} style={item.atrasado ? { background: '#FEF2F2' } : {}}>
                        <td style={styles.td}>{item.estudante}</td>
                        <td style={styles.td}>{item.curso}</td>
                        <td style={styles.td}>{item.hora_saida_real || '⏳'}</td>
                        <td style={styles.td}>{item.hora_retorno_real || '-'}</td>
                        <td style={styles.td}>
                          {item.atrasado ? <span style={{...styles.badge, ...styles.badgeDanger}}>Atrasado</span> : 
                           item.hora_retorno_real ? <span style={{...styles.badge, ...styles.badgeSuccess}}>OK</span> : 
                           item.hora_saida_real ? <span style={{...styles.badge, ...styles.badgeInfo}}>Fora</span> : 'Aguardando'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{...styles.modalFooter, padding: 16, background: '#F8FAFC', margin: 0}}>
              <button onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(relatorio.texto_relatorio)}`, '_blank')} style={{...styles.actionBtn, ...styles.btnOutline}}>
                <i className="fas fa-file-alt"></i> Texto
              </button>
              <button onClick={enviarRelatorio} disabled={enviando} style={{...styles.actionBtn, ...styles.btnPrimary}}>
                {enviando ? 'Enviando...' : '📧 Enviar para DITE'}
              </button>
              <button onClick={() => setRelatorio(null)} style={{...styles.actionBtn, ...styles.btnOutline}}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações Panel */}
      {showNotificacoes && (
        <>
          <div onClick={() => setShowNotificacoes(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 199 }} />
          <div style={styles.notifPanel}>
            <div style={styles.notifHeader}>
              <h3 style={{ fontSize: 16 }}>🔔 Notificações</h3>
              <button onClick={() => setShowNotificacoes(false)} style={{...styles.actionBtn, ...styles.btnOutline, padding: '4px 8px'}}><i className="fas fa-times"></i></button>
            </div>
            <div style={styles.notifList}>
              {notificacoes.length === 0 ? (
                <div style={styles.emptyState}>Sem notificações</div>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{...styles.notifItem, background: n.lida ? '#fff' : '#FEFCE8' }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{n.mensagem}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{n.data}</div>
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

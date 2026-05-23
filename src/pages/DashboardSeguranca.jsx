// src/pages/DashboardSeguranca.jsx - Com relatório COMPLETO
import { useState, useEffect } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
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
    const hora = prompt('⏰ Hora da SAÍDA (HH:MM):');
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
    const hora = prompt('⏰ Hora do RETORNO (HH:MM):');
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🛡️ Controle de Portão</h1>
          <p style={styles.subtitle}>{user?.nome || user?.username || 'Segurança'} • {horaAtual}</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.dateBox}>
            <span>📅</span>
            <input 
              type="date" 
              value={dataSelecionada} 
              onChange={(e) => setDataSelecionada(e.target.value)} 
              style={styles.dateInput}
            />
          </div>
          <button onClick={() => setShowNotificacoes(!showNotificacoes)} style={styles.notifBtn}>
            🔔
            {notificacoesNaoLidas > 0 && <span style={styles.badge}>{notificacoesNaoLidas}</span>}
          </button>
          <button onClick={onLogout} style={styles.logoutBtn}>🚪 Sair</button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderBottomColor: '#f59e0b'}}>
          <div style={styles.statIcon}>⏳</div>
          <div style={{...styles.statValue, color: '#f59e0b'}}>{pedidosSaida.length}</div>
          <div style={styles.statLabel}>Aguardando Saída</div>
        </div>
        <div style={{...styles.statCard, borderBottomColor: '#3b82f6'}}>
          <div style={styles.statIcon}>🚶</div>
          <div style={{...styles.statValue, color: '#3b82f6'}}>{pedidosAndamento.length}</div>
          <div style={styles.statLabel}>Em Andamento</div>
        </div>
        <div style={{...styles.statCard, borderBottomColor: '#10b981'}}>
          <div style={styles.statIcon}>✅</div>
          <div style={{...styles.statValue, color: '#10b981'}}>{pedidosFinalizados.length}</div>
          <div style={styles.statLabel}>Finalizados</div>
        </div>
      </div>

      {/* Ações */}
      <div style={styles.actionsBar}>
        <div style={styles.tabs}>
          <button onClick={() => setAbaAtiva('saida')} style={{...styles.tab, ...(abaAtiva === 'saida' && styles.tabActive)}}>
            🟢 SAÍDA ({pedidosSaida.length})
          </button>
          <button onClick={() => setAbaAtiva('andamento')} style={{...styles.tab, ...(abaAtiva === 'andamento' && styles.tabActive)}}>
            🔵 ANDAMENTO ({pedidosAndamento.length})
          </button>
          <button onClick={() => setAbaAtiva('finalizado')} style={{...styles.tab, ...(abaAtiva === 'finalizado' && styles.tabActive)}}>
            ✅ FINALIZADOS ({pedidosFinalizados.length})
          </button>
        </div>
        <div style={styles.actionButtons}>
          <button onClick={() => setMostrarModalData(true)} style={styles.btnPrimary}>📄 Relatório Completo</button>
          <button onClick={carregarDados} style={styles.btnSecondary}>🔄</button>
        </div>
      </div>

      {/* Data */}
      <div style={styles.dataDestaque}>
        📅 {formatarData(dataSelecionada)}
      </div>

      {/* Conteúdo */}
      <div style={styles.cardsContainer}>
        {loading ? (
          <div style={styles.loading}>Carregando...</div>
        ) : (
          <>
            {abaAtiva === 'saida' && (
              pedidosSaida.length === 0 ? (
                <div style={styles.emptyState}>Nenhum estudante aguardando saída</div>
              ) : (
                <div style={styles.cardsGrid}>
                  {pedidosSaida.map(p => (
                    <div key={p.id} style={styles.card}>
                      <div style={styles.cardHeader}>
                        <div style={styles.cardIcon}>🎓</div>
                        <div style={styles.cardTitle}>{p.estudante_nome}</div>
                      </div>
                      <div style={styles.cardBody}>
                        <div>📚 {p.estudante_curso || '-'}</div>
                        <div>🏫 {p.estudante_classe || '-'}</div>
                        <div style={styles.cardTimes}>
                          <span>🚪 {p.hora_saida_prevista || '-'}</span>
                          <span>🔙 {p.hora_volta_prevista || '-'}</span>
                        </div>
                      </div>
                      <div style={styles.cardActions}>
                        <button onClick={() => marcarSaida(p.id)} style={styles.btnSaida}>SAÍDA</button>
                        <button onClick={() => marcarSaidaAjustada(p.id)} style={styles.btnAjustar}>AJUSTAR</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {abaAtiva === 'andamento' && (
              pedidosAndamento.length === 0 ? (
                <div style={styles.emptyState}>Nenhum estudante em andamento</div>
              ) : (
                <div style={styles.cardsGrid}>
                  {pedidosAndamento.map(p => (
                    <div key={p.id} style={styles.card}>
                      <div style={styles.cardHeader}>
                        <div style={styles.cardIcon}>🚶</div>
                        <div style={styles.cardTitle}>{p.estudante_nome}</div>
                      </div>
                      <div style={styles.cardBody}>
                        <div>📚 {p.estudante_curso || '-'}</div>
                        <div>🏫 {p.estudante_classe || '-'}</div>
                        <div style={styles.cardTimes}>
                          <span>✅ Saiu: {p.hora_saida_real || '-'}</span>
                          <span>⏰ Prev: {p.hora_volta_prevista || '-'}</span>
                        </div>
                      </div>
                      <div style={styles.cardActions}>
                        <button onClick={() => marcarRetorno(p.id)} style={styles.btnRetorno}>RETORNO</button>
                        <button onClick={() => marcarRetornoAjustado(p.id)} style={styles.btnAjustar}>AJUSTAR</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {abaAtiva === 'finalizado' && (
              pedidosFinalizados.length === 0 ? (
                <div style={styles.emptyState}>Nenhum estudante finalizado</div>
              ) : (
                <div style={styles.cardsGrid}>
                  {pedidosFinalizados.map(p => (
                    <div key={p.id} style={styles.card}>
                      <div style={styles.cardHeader}>
                        <div style={styles.cardIcon}>✅</div>
                        <div style={styles.cardTitle}>{p.estudante_nome}</div>
                      </div>
                      <div style={styles.cardBody}>
                        <div>📚 {p.estudante_curso || '-'}</div>
                        <div>🏫 {p.estudante_classe || '-'}</div>
                        <div style={styles.cardTimes}>
                          <span>✅ Saiu: {p.hora_saida_real || '-'}</span>
                          <span>🔴 Retornou: {p.hora_retorno_real || '-'}</span>
                        </div>
                        {p.atrasado && <div style={styles.atrasoInfo}>⚠️ Atraso: {p.tempo_atraso} min</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Modal Seleção Data */}
      {mostrarModalData && (
        <div style={styles.modalOverlay} onClick={() => setMostrarModalData(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📄 Relatório Completo</h3>
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
      )}

      {/* Modal Relatório Completo */}
      {relatorio && (
        <div style={styles.modalOverlay} onClick={() => setRelatorio(null)}>
          <div style={{...styles.modalContent, maxWidth: 800}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📄 Relatório Completo - {relatorio.data}</h3>
              <button onClick={() => setRelatorio(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={{...styles.modalBody, maxHeight: '60vh', overflow: 'auto'}}>
              {/* Resumo */}
              <div style={styles.relatorioResumo}>
                <h4>📊 RESUMO DO DIA</h4>
                <p>👥 Total Autorizados: <strong>{relatorio.total_autorizados}</strong></p>
                <p>✅ Saídas Registradas: <strong>{relatorio.saidas_registradas}</strong> ({relatorio.taxa_saida}%)</p>
                <p>🔴 Retornos Registrados: <strong>{relatorio.retornos_registrados}</strong> ({relatorio.taxa_retorno}%)</p>
                <p>⚠️ Atrasos: <strong>{relatorio.atrasos}</strong> ({relatorio.taxa_atraso}%)</p>
                <p>⏳ Aguardando Saída: <strong>{relatorio.sem_saida}</strong></p>
                <p>🚶 Em Andamento: <strong>{relatorio.em_andamento}</strong></p>
                <p>✅ Finalizados: <strong>{relatorio.finalizados}</strong></p>
              </div>

              {/* Lista Completa */}
              <div style={styles.relatorioLista}>
                <h4>👨‍🎓 LISTA COMPLETA DE ESTUDANTES</h4>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Estudante</th>
                      <th>Curso/Classe</th>
                      <th>Previsto</th>
                      <th>Saída Real</th>
                      <th>Retorno Real</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.lista_completa?.map((item, idx) => (
                      <tr key={idx} style={item.atrasado ? styles.atrasadoRow : {}}>
                        <td>{item.estudante}</td>
                        <td>{item.curso}/{item.classe}</td>
                        <td>{item.hora_saida_prevista} → {item.hora_retorno_prevista}</td>
                        <td>{item.hora_saida_real || '⏳ Não saiu'}</td>
                        <td>{item.hora_retorno_real || (item.hora_saida_real ? '⏳ Aguardando' : '-')}</td>
                        <td>
                          {item.atrasado ? '⚠️ Atrasado' : 
                           item.hora_retorno_real ? '✅ Completo' : 
                           item.hora_saida_real ? '🚶 Em andamento' : '⏳ Aguardando'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Atrasados */}
              {relatorio.atrasados_lista?.length > 0 && (
                <div style={styles.relatorioLista}>
                  <h4>⚠️ ESTUDANTES COM ATRASO</h4>
                  {relatorio.atrasados_lista.map((item, idx) => (
                    <p key={idx}>• {item.estudante} - Atraso: {item.tempo_atraso}min</p>
                  ))}
                </div>
              )}

              {/* Não saíram */}
              {relatorio.sem_saida_lista?.length > 0 && (
                <div style={styles.relatorioLista}>
                  <h4>⏳ ESTUDANTES QUE NÃO REGISTRARAM SAÍDA</h4>
                  {relatorio.sem_saida_lista.map((item, idx) => (
                    <p key={idx}>• {item.estudante} - Previsto: {item.hora_saida_prevista}</p>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(relatorio.texto_relatorio)}`, '_blank')} style={styles.btnSecondary}>
                📄 Visualizar Texto
              </button>
              <button onClick={enviarRelatorio} disabled={enviando} style={styles.btnSuccess}>
                {enviando ? 'Enviando...' : '📧 Enviar para DITE'}
              </button>
              <button onClick={() => setRelatorio(null)} style={styles.btnCancel}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações */}
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
                  <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{...styles.notifItem, background: n.lida ? '#fff' : '#fefce8'}}>
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
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: 20,
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    background: '#f0f2f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  dateBox: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
    padding: '8px 16px', borderRadius: 10, border: '1px solid #ddd'
  },
  dateInput: { border: 'none', fontSize: 14, padding: 4, outline: 'none' },
  notifBtn: { position: 'relative', padding: '8px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: 10, cursor: 'pointer' },
  badge: { position: 'absolute', top: -5, right: -5, background: '#dc2626', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 20 },
  logoutBtn: { padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, borderBottom: '3px solid #ddd' },
  statIcon: { fontSize: 32 }, statValue: { fontSize: 28, fontWeight: 'bold' }, statLabel: { fontSize: 12, color: '#666' },
  actionsBar: { background: '#fff', borderRadius: 16, padding: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', border: 'none', background: '#e5e7eb', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', color: '#666' },
  tabActive: { background: '#1a1a1a', color: '#fff' },
  actionButtons: { display: 'flex', gap: 8 },
  btnPrimary: { padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSecondary: { padding: '8px 16px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnSuccess: { padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnCancel: { padding: '8px 16px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer' },
  dataDestaque: { background: '#e0f2fe', padding: '10px 16px', borderRadius: 12, marginBottom: 20, textAlign: 'center', fontSize: 13, color: '#0284c7' },
  cardsContainer: { background: '#fff', borderRadius: 16, padding: 20, minHeight: 400 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid #f0f0f0' },
  cardIcon: { fontSize: 28 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  cardBody: { padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  cardTimes: { display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 14, fontWeight: 'bold', color: '#333' },
  cardActions: { display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #f0f0f0', background: '#fafafa' },
  atrasoInfo: { marginTop: 8, padding: 8, background: '#fee2e2', borderRadius: 8, fontSize: 12, color: '#dc2626', textAlign: 'center' },
  btnSaida: { flex: 1, padding: 10, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' },
  btnRetorno: { flex: 1, padding: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' },
  btnAjustar: { flex: 1, padding: 10, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' },
  loading: { textAlign: 'center', padding: 60, color: '#999' },
  emptyState: { textAlign: 'center', padding: 60, color: '#999' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 16, width: '90%', maxWidth: 450 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' },
  modalClose: { width: 32, height: 32, border: '1px solid #ddd', background: '#fff', borderRadius: 8, cursor: 'pointer' },
  modalBody: { padding: 20 },
  modalFooter: { padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 12, justifyContent: 'flex-end' },
  modalLabel: { display: 'block', fontWeight: 'bold', marginBottom: 8 },
  modalInput: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 },
  modalButtons: { display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' },
  relatorioResumo: { background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20 },
  relatorioLista: { marginBottom: 20, padding: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 300, overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  atrasadoRow: { background: '#fee2e2' },
  notifOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 },
  notifPanel: { position: 'fixed', top: 0, right: 0, width: 350, height: '100vh', background: '#fff', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'auto' },
  notifHeader: { padding: 20, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  notifClose: { width: 32, height: 32, background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer' },
  notifList: { overflowY: 'auto', height: 'calc(100vh - 70px)' },
  notifEmpty: { textAlign: 'center', padding: 60, color: '#999' },
  notifItem: { padding: 16, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' },
  notifMessage: { fontSize: 13, color: '#333', marginBottom: 4 },
  notifDate: { fontSize: 11, color: '#999' },
};

export default DashboardSeguranca;
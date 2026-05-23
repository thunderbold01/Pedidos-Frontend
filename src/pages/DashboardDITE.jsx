// src/pages/DashboardDITE.jsx - VERSÃO CORRIGIDA (SEM ERROS DE SINTAXE)
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
    data_saida: '',
    hora_saida: '07:00',
    data_volta: '',
    hora_volta: '19:00'
  });
  const [showColetiva, setShowColetiva] = useState(false);
  const [formColetiva, setFormColetiva] = useState({
    titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24'
  });
  const [loadingColetiva, setLoadingColetiva] = useState(false);
  const [errorColetiva, setErrorColetiva] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aba, setAba] = useState('pedidos');
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    carregarColetivas();
    carregarAlertasAtraso();
    carregarRelatoriosSeguranca();
  }, [filtroEstado, filtroData]);

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
    } catch (err) {
      console.error('Erro ao carregar coletivas:', err);
    }
  };

  const carregarAlertasAtraso = async () => {
    try {
      const res = await api.get('/seguranca/alertas-atraso/');
      setAlertasAtraso(res.data.alertas || []);
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
    }
  };

  const carregarRelatoriosSeguranca = async () => {
    try {
      const res = await api.get('/relatorios/');
      const relatoriosSeg = (res.data.relatorios || []).filter(r => r.tipo === 'SEGURANCA');
      setRelatoriosSeguranca(relatoriosSeg);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const abrirModalAprovacao = (pedidoId) => {
    const hoje = new Date().toISOString().split('T')[0];
    setDadosAprovacao({
      data_saida: hoje,
      hora_saida: '07:00',
      data_volta: hoje,
      hora_volta: '19:00'
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

  const marcarAlertaLido = async () => {
    try {
      await api.get('/seguranca/alertas-atraso/?marcar_lidos=true');
      carregarAlertasAtraso();
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      await carregarNotificacoes();
    } catch (err) {
      console.error('Erro:', err);
    }
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
      'PENDENTE_DITE': { background: '#fef3c7', color: '#d97706' },
      'PENDENTE_DIRECAO': { background: '#ede9fe', color: '#7c3aed' },
      'PENDENTE_ADMIN': { background: '#dbeafe', color: '#2563eb' },
      'APROVADO': { background: '#d1fae5', color: '#059669' },
      'REJEITADO': { background: '#fee2e2', color: '#dc2626' },
      'EM_ANDAMENTO': { background: '#e0f2fe', color: '#0284c7' },
      'FINALIZADO': { background: '#f1f5f9', color: '#64748b' }
    };
    return styles[estado] || { background: '#f1f5f9', color: '#64748b' };
  };

  const pedidosFiltrados = pedidos.filter(p =>
    p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  const menuItems = [
    { id: 'PENDENTE_DITE', label: 'Pendentes', icon: '📋', count: stats.meus_pedidos_pendentes },
    { id: 'PENDENTE_DIRECAO', label: 'Em Análise', icon: '⏳' },
    { id: 'APROVADO', label: 'Aprovados', icon: '✅', count: stats.pedidos_aprovados },
    { id: 'REJEITADO', label: 'Rejeitados', icon: '❌', count: stats.pedidos_rejeitados },
    { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: '🚶' },
    { id: 'FINALIZADO', label: 'Finalizados', icon: '🏁' }
  ];

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
        background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: 24, borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>⚡ DITE</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.nome || user?.username}</div>
          <div style={{ fontSize: 11, color: '#999' }}>DITE - Tecnologia</div>
        </div>
        <nav style={{ flex: 1, padding: 16 }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setFiltroEstado(item.id); setAba('pedidos'); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', background: filtroEstado === item.id ? '#2a2a2a' : 'transparent',
                border: 'none', borderRadius: 8, color: '#ccc', cursor: 'pointer', textAlign: 'left'
              }}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count > 0 && <span style={{ background: '#dc2626', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{item.count}</span>}
            </button>
          ))}
          <div style={{ height: 1, background: '#333', margin: '12px 0' }} />
          <button onClick={() => setAba('coletivas')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: 8, color: '#ccc', cursor: 'pointer' }}>
            <span>👥</span><span>Saídas Coletivas</span>
            {coletivas.length > 0 && <span style={{ background: '#dc2626', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{coletivas.length}</span>}
          </button>
          <button onClick={() => setAba('alertas')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: 8, color: '#ccc', cursor: 'pointer' }}>
            <span>⚠️</span><span>Alertas Atraso</span>
            {alertasAtraso.length > 0 && <span style={{ background: '#dc2626', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{alertasAtraso.length}</span>}
          </button>
          <button onClick={() => setAba('relatorios')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: 8, color: '#ccc', cursor: 'pointer' }}>
            <span>📊</span><span>Relatórios Segurança</span>
            {relatoriosSeguranca.length > 0 && <span style={{ background: '#dc2626', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>{relatoriosSeguranca.length}</span>}
          </button>
          <button onClick={() => setShowColetiva(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: 8, color: '#059669', cursor: 'pointer' }}>
            <span>➕</span><span>Nova Coletiva</span>
          </button>
        </nav>
        <button onClick={onLogout} style={{ margin: 20, padding: 12, background: '#2a2a2a', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }}>🚪 Sair</button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: 260, padding: 24, background: '#f5f5f5' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h2 style={{ margin: 0 }}>Olá, {user?.nome || user?.username}</h2><p style={{ margin: 0, color: '#666' }}>Gerencie os pedidos de saída</p></div>
          <button onClick={() => setShowNotificacoes(!showNotificacoes)} style={{ position: 'relative', padding: 10, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, cursor: 'pointer' }}>
            🔔
            {notificacoesNaoLidas > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#dc2626', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 20 }}>{notificacoesNaoLidas}</span>}
          </button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', padding: 4, borderRadius: 12, marginBottom: 20 }}>
          <button onClick={() => setAba('pedidos')} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 10, background: aba === 'pedidos' ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: 600 }}>📋 Pedidos</button>
          <button onClick={() => setAba('coletivas')} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 10, background: aba === 'coletivas' ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: 600 }}>👥 Coletivas ({coletivas.length})</button>
          <button onClick={() => setAba('alertas')} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 10, background: aba === 'alertas' ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: 600 }}>⚠️ Alertas ({alertasAtraso.length})</button>
          <button onClick={() => setAba('relatorios')} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 10, background: aba === 'relatorios' ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: 600 }}>📊 Relatórios ({relatoriosSeguranca.length})</button>
        </div>

        {/* Conteúdo das Abas */}
        {aba === 'pedidos' && (
          <>
            <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {menuItems.slice(0, 3).map(item => (
                  <button key={item.id} onClick={() => setFiltroEstado(item.id)} style={{ padding: '8px 16px', border: 'none', borderRadius: 10, background: filtroEstado === item.id ? '#1a1a1a' : '#f5f5f5', color: filtroEstado === item.id ? '#fff' : '#666', cursor: 'pointer' }}>
                    {item.label} {item.count ? `(${item.count})` : ''}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: 8, border: '1px solid #e0e0e0', borderRadius: 8 }} />
                <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} style={{ padding: 8, border: '1px solid #e0e0e0', borderRadius: 8 }} />
                <button onClick={carregarDados} style={{ padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>🔄</button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>Carregando...</div>
              ) : pedidosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Nenhum pedido encontrado</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                        <th style={{ padding: 14, textAlign: 'left' }}>ID</th>
                        <th style={{ padding: 14, textAlign: 'left' }}>Estudante</th>
                        <th style={{ padding: 14, textAlign: 'left' }}>Curso/Classe</th>
                        <th style={{ padding: 14, textAlign: 'left' }}>Tipo</th>
                        <th style={{ padding: 14, textAlign: 'left' }}>Data Saída</th>
                        <th style={{ padding: 14, textAlign: 'left' }}>Status</th>
                        <th style={{ padding: 14, textAlign: 'left' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: 14 }}><strong>#{p.id}</strong></td>
                          <td style={{ padding: 14 }}>{p.estudante_nome}</td>
                          <td style={{ padding: 14 }}>{p.estudante_curso || '-'} / {p.estudante_classe || '-'}</td>
                          <td style={{ padding: 14 }}>{p.tipo_display}</td>
                          <td style={{ padding: 14 }}>{p.data_saida}</td>
                          <td style={{ padding: 14 }}>
                            <span style={getStatusStyle(p.estado)}>{p.estado_display}</span>
                          </td>
                          <td style={{ padding: 14 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => navigate(`/pedido/${p.id}`)} style={{ padding: 6, border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>👁️</button>
                              {p.acoes_disponiveis?.includes('aprovar') && (
                                <button onClick={() => abrirModalAprovacao(p.id)} style={{ padding: 6, border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', color: '#10b981', cursor: 'pointer' }}>✅</button>
                              )}
                              {p.acoes_disponiveis?.includes('rejeitar') && (
                                <button onClick={() => handleAcao(p.id, 'rejeitar')} style={{ padding: 6, border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', color: '#dc2626', cursor: 'pointer' }}>❌</button>
                              )}
                              {p.estado === 'PENDENTE_DITE' && (
                                <button onClick={() => setModalEncaminhar(p.id)} style={{ padding: 6, border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', color: '#f59e0b', cursor: 'pointer' }}>📤</button>
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
          </>
        )}

        {aba === 'coletivas' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <h3>📋 Saídas Coletivas Criadas</h3>
            {coletivas.length === 0 ? (
              <p>Nenhuma saída coletiva criada ainda</p>
            ) : (
              coletivas.map(c => (
                <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong>{c.titulo}</strong>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, background: c.encerrada ? '#f1f5f9' : '#d1fae5', color: c.encerrada ? '#64748b' : '#059669' }}>{c.encerrada ? 'Encerrada' : 'Ativa'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
                    <span>📅 {c.data_saida?.split('T')[0]}</span>
                    <span>🔙 {c.data_volta?.split('T')[0]}</span>
                    <span>👤 {c.criador_nome || c.criador}</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, marginBottom: 12 }}>
                    <div style={{ width: `${(c.total_aceitos || 0) / (c.total_convidados || 1) * 100}%`, height: '100%', background: '#059669', borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span><strong>{c.total_convidados || 0}</strong> Convidados</span>
                    <span><strong style={{ color: '#059669' }}>{c.total_aceitos || 0}</strong> Aceitaram</span>
                    <span><strong style={{ color: '#dc2626' }}>{c.total_recusados || 0}</strong> Recusaram</span>
                    <span><strong>{c.total_pendentes || 0}</strong> Pendentes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {aba === 'alertas' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <h3>⚠️ Alertas de Atraso da Segurança</h3>
            {alertasAtraso.length === 0 ? (
              <p>Nenhum alerta de atraso registrado</p>
            ) : (
              alertasAtraso.map(a => (
                <div key={a.id} style={{ background: '#fef2f2', borderLeft: '4px solid #dc2626', padding: 12, marginBottom: 10, borderRadius: 8, cursor: 'pointer' }} onClick={marcarAlertaLido}>
                  <div><strong>{a.estudante_nome}</strong> - Atraso de <strong>{a.tempo_atraso} minutos</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Enviado em: {a.enviado_em}</div>
                  {!a.lido && <span style={{ fontSize: 11, color: '#dc2626' }}>🔴 Não lido</span>}
                </div>
              ))
            )}
          </div>
        )}

        {aba === 'relatorios' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
            <h3>📊 Relatórios Recebidos da Segurança</h3>
            {relatoriosSeguranca.length === 0 ? (
              <p>Nenhum relatório recebido ainda</p>
            ) : (
              relatoriosSeguranca.map(r => (
                <div key={r.id} style={{ background: '#f5f5f5', padding: 12, marginBottom: 10, borderRadius: 8, cursor: 'pointer' }} onClick={() => baixarRelatorio(r.id)}>
                  <div><strong>{r.titulo}</strong></div>
                  <div style={{ fontSize: 12, color: '#666' }}>Enviado por: {r.criado_por} em {r.created_at}</div>
                  <div style={{ fontSize: 11, color: '#059669' }}>📥 Clique para baixar</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Aprovação */}
      {modalAprovacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalAprovacao(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '90%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>✅ Aprovar Pedido #{modalAprovacao}</h3>
              <button onClick={() => setModalAprovacao(null)} style={{ width: 32, height: 32, border: '1px solid #e0e0e0', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <p>Defina os horários da saída:</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>DATA DE SAÍDA *</label>
                <input type="date" value={dadosAprovacao.data_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, data_saida: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #e0e0e0', borderRadius: 10 }} min={hoje} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>HORA DE SAÍDA *</label>
                <input type="time" value={dadosAprovacao.hora_saida} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_saida: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #e0e0e0', borderRadius: 10 }} step="60" required />
                <small>Horário padrão: 07:00</small>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>DATA DE RETORNO *</label>
                <input type="date" value={dadosAprovacao.data_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, data_volta: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #e0e0e0', borderRadius: 10 }} min={dadosAprovacao.data_saida} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>HORA DE RETORNO *</label>
                <input type="time" value={dadosAprovacao.hora_volta} onChange={e => setDadosAprovacao({...dadosAprovacao, hora_volta: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #e0e0e0', borderRadius: 10 }} step="60" required />
                <small>Horário padrão: 19:00</small>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => setModalAprovacao(null)} style={{ flex: 1, padding: 12, background: '#f5f5f5', border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={confirmarAprovacao} style={{ flex: 2, padding: 12, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>✅ Confirmar Aprovação</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Encaminhar */}
      {modalEncaminhar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalEncaminhar(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '90%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: '1px solid #e0e0e0' }}><h3>Encaminhar Pedido #{modalEncaminhar}</h3></div>
            <div style={{ padding: 20 }}>
              <p>Selecione o destino:</p>
              <button onClick={() => handleEncaminhar(modalEncaminhar, 'DIRECAO')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid #e0e0e0', borderRadius: 12, background: '#fff', cursor: 'pointer', marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>👨‍💼</span><div><strong>Direção</strong></div>
              </button>
              <button onClick={() => handleEncaminhar(modalEncaminhar, 'ADMINISTRACAO')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid #e0e0e0', borderRadius: 12, background: '#fff', cursor: 'pointer' }}>
                <span style={{ fontSize: 28 }}>🏛️</span><div><strong>Administração</strong></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Coletiva */}
      {showColetiva && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowColetiva(false)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '90%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: '1px solid #e0e0e0' }}><h3>👥 Nova Saída Coletiva</h3></div>
            <div style={{ padding: 20 }}>
              {errorColetiva && <div style={{ background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 10, marginBottom: 16 }}>{errorColetiva}</div>}
              <form onSubmit={criarColetiva}>
                <input type="text" placeholder="Título *" value={formColetiva.titulo} onChange={e => setFormColetiva({...formColetiva, titulo: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #e0e0e0', borderRadius: 10, marginBottom: 16 }} required />
                <textarea placeholder="Descrição" value={formColetiva.descricao} onChange={e => setFormColetiva({...formColetiva, descricao: e.target.value})} rows={3} style={{ width: '100%', padding: 12, border: '1px solid #e0e0e0', borderRadius: 10, marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <input type="datetime-local" placeholder="Data Saída" value={formColetiva.data_saida} onChange={e => setFormColetiva({...formColetiva, data_saida: e.target.value})} style={{ flex: 1, padding: 12, border: '1px solid #e0e0e0', borderRadius: 10 }} required />
                  <input type="datetime-local" placeholder="Data Volta" value={formColetiva.data_volta} onChange={e => setFormColetiva({...formColetiva, data_volta: e.target.value})} style={{ flex: 1, padding: 12, border: '1px solid #e0e0e0', borderRadius: 10 }} required />
                </div>
                <input type="number" placeholder="Prazo (horas)" value={formColetiva.prazo_horas} onChange={e => setFormColetiva({...formColetiva, prazo_horas: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #e0e0e0', borderRadius: 10, marginBottom: 16 }} min="1" max="72" />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setShowColetiva(false)} style={{ flex: 1, padding: 12, background: '#f5f5f5', border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" disabled={loadingColetiva} style={{ flex: 2, padding: 12, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>{loadingColetiva ? 'Criando...' : 'Criar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notificações Panel */}
      {showNotificacoes && (
        <>
          <div onClick={() => setShowNotificacoes(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, width: 360, height: '100vh', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'auto' }}>
            <div style={{ padding: 20, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
              <h3>🔔 Notificações</h3>
              <button onClick={() => setShowNotificacoes(false)} style={{ width: 32, height: 32, background: '#f5f5f5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            {notificacoes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Nenhuma notificação</div>
            ) : (
              notificacoes.map(n => (
                <div key={n.id} onClick={() => { marcarNotificacaoLida(n.id); if (n.pedido_id) { navigate(`/pedido/${n.pedido_id}`); setShowNotificacoes(false); } }} style={{ padding: 16, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: n.lida ? '#fff' : '#fefce8' }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>{n.mensagem}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{n.data}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardDITE;
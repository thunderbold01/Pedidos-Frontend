// src/pages/DashboardSeguranca.jsx - VERSÃO COM CARDS PROFISSIONAIS
import { useState, useEffect, useMemo } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // Estados
  const [pedidosSaida, setPedidosSaida] = useState([]);
  const [pedidosAndamento, setPedidosAndamento] = useState([]);
  const [pedidosFinalizados, setPedidosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('saida');
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date().toISOString().split('T')[0]);
  const [relatorio, setRelatorio] = useState(null);
  const [mostrarModalData, setMostrarModalData] = useState(false);
  const [dataRelatorio, setDataRelatorio] = useState(() => new Date().toISOString().split('T')[0]);
  const [enviando, setEnviando] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [stats, setStats] = useState({ saidas_hoje: 0, em_andamento: 0, atrasos_hoje: 0 });
  const [filtroNome, setFiltroNome] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Relógio
  useEffect(() => {
    const atualizarHora = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);
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
      const response = await api.get(`/seguranca/saidas-data/?data=${dataSelecionada}`);
      const dados = response.data.saidas || [];
      setPedidosSaida(dados.filter(p => p.estado === 'APROVADO'));
      setPedidosAndamento(dados.filter(p => p.estado === 'EM_ANDAMENTO'));
      setPedidosFinalizados(dados.filter(p => p.estado === 'FINALIZADO'));
    } catch (err) {
      console.error('Erro carregar dados:', err);
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
      } catch (err2) { console.error('Fallback erro:', err2); }
    } finally { setLoading(false); }
  };

  const marcarSaida = async (pedidoId) => {
    if (!window.confirm('✅ Confirmar SAÍDA?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      alert(`✅ Saída registrada às ${response.data.hora}`);
      carregarDados(); carregarDashboard();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao marcar saída'));
    }
  };

  const marcarSaidaAjustada = async (pedidoId) => {
    const hora = window.prompt('⏰ Hora da SAÍDA (HH:MM):', '07:00');
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
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro'));
    }
  };

  const marcarRetorno = async (pedidoId) => {
    if (!window.confirm('🔴 Confirmar RETORNO?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`);
      let msg = `✅ Retorno às ${response.data.hora}`;
      if (response.data.atrasado) msg += `\n⚠️ ATRASO: ${response.data.tempo_atraso} minutos!`;
      alert(msg);
      carregarDados(); carregarDashboard();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro'));
    }
  };

  const marcarRetornoAjustado = async (pedidoId) => {
    const hora = window.prompt('⏰ Hora do RETORNO (HH:MM):', '19:00');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
      alert('❌ Formato inválido! Use HH:MM');
      return;
    }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, { hora_retorno: hora });
      alert(`✅ Retorno registrado: ${response.data.hora}`);
      carregarDados();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro'));
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
    } finally { setLoading(false); }
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
    } finally { setEnviando(false); }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const filtrarPorNome = (lista) => {
    if (!filtroNome.trim()) return lista;
    const termo = filtroNome.toLowerCase();
    return lista.filter(p => 
      p.estudante_nome?.toLowerCase().includes(termo) ||
      p.estudante_curso?.toLowerCase().includes(termo)
    );
  };

  const saidaFiltrada = useMemo(() => filtrarPorNome(pedidosSaida), [pedidosSaida, filtroNome]);
  const andamentoFiltrado = useMemo(() => filtrarPorNome(pedidosAndamento), [pedidosAndamento, filtroNome]);
  const finalizadosFiltrado = useMemo(() => filtrarPorNome(pedidosFinalizados), [pedidosFinalizados, filtroNome]);

  // Cores hierárquicas
  const colors = {
    primary: '#2563EB',
    primaryDark: '#1E40AF',
    success: '#10B981',
    successDark: '#059669',
    warning: '#F59E0B',
    warningDark: '#D97706',
    danger: '#EF4444',
    dangerDark: '#DC2626',
    info: '#3B82F6',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
    dark: '#1F2937'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      {/* CSS Global */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .card-animate { animation: fadeInUp 0.3s ease-out; }
        @media (max-width: 768px) {
          .sidebar-mobile { position: fixed; left: -280px; transition: left 0.3s ease; z-index: 1000; }
          .sidebar-mobile.open { left: 0; }
          .menu-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }
          .menu-overlay.active { display: block; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar-mobile ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: 280, background: colors.white, height: '100vh', padding: '24px',
        display: 'flex', flexDirection: 'column', borderRight: '1px solid #E2E8F0',
        position: 'sticky', top: 0, transition: 'left 0.3s ease',
        '@media (max-width: 768px)': { position: 'fixed', left: '-280px', zIndex: 1000 }
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.white, fontSize: 18, boxShadow: '0 8px 16px -4px rgba(37,99,235,0.2)'
          }}>
            <i className="fas fa-shield-alt"></i>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>Segurança</div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 12,
          background: colors.lightGray, borderRadius: 14, marginBottom: 24
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.white, fontWeight: 600, fontSize: 18
          }}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'S'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>{user?.nome || user?.username}</div>
            <div style={{ fontSize: 12, color: colors.gray }}>🛡️ Segurança de Portão</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => { setAbaAtiva('saida'); setMobileMenuOpen(false); }} style={{
            padding: '12px 16px', borderRadius: 12, border: 'none', background: abaAtiva === 'saida' ? `linear-gradient(90deg, ${colors.primary}10, transparent)` : 'transparent',
            textAlign: 'left', fontSize: 14, fontWeight: abaAtiva === 'saida' ? 600 : 500,
            color: abaAtiva === 'saida' ? colors.primary : colors.gray,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            borderLeft: abaAtiva === 'saida' ? `3px solid ${colors.primary}` : '3px solid transparent'
          }}>
            <i className="fas fa-sign-out-alt"></i> Saída
          </button>
          <button onClick={() => { setAbaAtiva('andamento'); setMobileMenuOpen(false); }} style={{
            padding: '12px 16px', borderRadius: 12, border: 'none', background: abaAtiva === 'andamento' ? `linear-gradient(90deg, ${colors.primary}10, transparent)` : 'transparent',
            textAlign: 'left', fontSize: 14, fontWeight: abaAtiva === 'andamento' ? 600 : 500,
            color: abaAtiva === 'andamento' ? colors.primary : colors.gray,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            borderLeft: abaAtiva === 'andamento' ? `3px solid ${colors.primary}` : '3px solid transparent'
          }}>
            <i className="fas fa-walking"></i> Em Andamento
          </button>
          <button onClick={() => { setAbaAtiva('finalizado'); setMobileMenuOpen(false); }} style={{
            padding: '12px 16px', borderRadius: 12, border: 'none', background: abaAtiva === 'finalizado' ? `linear-gradient(90deg, ${colors.primary}10, transparent)` : 'transparent',
            textAlign: 'left', fontSize: 14, fontWeight: abaAtiva === 'finalizado' ? 600 : 500,
            color: abaAtiva === 'finalizado' ? colors.primary : colors.gray,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            borderLeft: abaAtiva === 'finalizado' ? `3px solid ${colors.primary}` : '3px solid transparent'
          }}>
            <i className="fas fa-check-circle"></i> Finalizados
          </button>
        </nav>

        <button onClick={onLogout} style={{
          padding: '12px 16px', background: '#FEF2F2', border: 'none', borderRadius: 12,
          color: colors.danger, fontWeight: 500, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 12, marginTop: 'auto'
        }}>
          <i className="fas fa-sign-out-alt"></i> Encerrar sessão
        </button>
      </aside>

      {/* Mobile Menu Overlay */}
      <div className={`menu-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        {/* Header */}
        <header style={{
          background: colors.white, borderBottom: '1px solid #E2E8F0', padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          '@media (max-width: 768px)': { padding: '12px 16px' }
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
              display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
              '@media (max-width: 768px)': { display: 'block' }
            }}>
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.dark, margin: 0 }}>🛡️ Controle de Portão</h1>
              <p style={{ fontSize: 13, color: colors.gray, margin: '4px 0 0' }}>{user?.nome || user?.username} • {horaAtual}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.lightGray, padding: '8px 12px', borderRadius: 12 }}>
              <i className="fas fa-calendar" style={{ color: colors.gray, fontSize: 13 }}></i>
              <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} style={{
                border: 'none', background: 'transparent', fontSize: 13, outline: 'none', fontWeight: 500
              }} />
            </div>
            <button onClick={() => setShowNotificacoes(!showNotificacoes)} style={{
              position: 'relative', padding: 8, background: colors.lightGray, border: 'none', borderRadius: 10, cursor: 'pointer'
            }}>
              <i className="fas fa-bell"></i>
              {notificacoesNaoLidas > 0 && <span style={{
                position: 'absolute', top: -4, right: -4, width: 10, height: 10,
                background: colors.danger, borderRadius: '50%', border: `2px solid ${colors.white}`
              }} />}
            </button>
          </div>
        </header>

        {/* Stats Cards - Cards Profissionais com Sombra */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, padding: '24px',
          '@media (max-width: 768px)': { gap: 12, padding: '16px' }
        }}>
          {/* Card Aguardando */}
          <div style={{
            background: colors.white, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, opacity: 0.08, borderRadius: '50%', background: colors.warning, transform: 'translate(30%, -30%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16, background: `${colors.warning}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fas fa-clock" style={{ fontSize: 22, color: colors.warning }}></i>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: colors.warning }}>{pedidosSaida.length}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>Aguardando Saída</div>
            <div style={{ fontSize: 12, color: colors.gray }}>Estudantes na portaria</div>
            <div style={{ marginTop: 12, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(pedidosSaida.length / (pedidosSaida.length + pedidosAndamento.length + pedidosFinalizados.length + 1)) * 100}%`, height: '100%', background: colors.warning, borderRadius: 2 }} />
            </div>
          </div>

          {/* Card Em Andamento */}
          <div style={{
            background: colors.white, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, opacity: 0.08, borderRadius: '50%', background: colors.info, transform: 'translate(30%, -30%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16, background: `${colors.info}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fas fa-walking" style={{ fontSize: 22, color: colors.info }}></i>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: colors.info }}>{pedidosAndamento.length}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>Em Andamento</div>
            <div style={{ fontSize: 12, color: colors.gray }}>Fora da unidade</div>
            <div style={{ marginTop: 12, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(pedidosAndamento.length / (pedidosSaida.length + pedidosAndamento.length + pedidosFinalizados.length + 1)) * 100}%`, height: '100%', background: colors.info, borderRadius: 2 }} />
            </div>
          </div>

          {/* Card Finalizados */}
          <div style={{
            background: colors.white, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, opacity: 0.08, borderRadius: '50%', background: colors.success, transform: 'translate(30%, -30%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16, background: `${colors.success}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: 22, color: colors.success }}></i>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: colors.success }}>{pedidosFinalizados.length}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark, marginBottom: 4 }}>Finalizados</div>
            <div style={{ fontSize: 12, color: colors.gray }}>Retornaram à unidade</div>
            <div style={{ marginTop: 12, height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(pedidosFinalizados.length / (pedidosSaida.length + pedidosAndamento.length + pedidosFinalizados.length + 1)) * 100}%`, height: '100%', background: colors.success, borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Search e Ações */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 16px',
          gap: 16, flexWrap: 'wrap', '@media (max-width: 768px)': { padding: '0 16px 16px', flexDirection: 'column' }
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320, '@media (max-width: 768px)': { maxWidth: '100%', width: '100%' } }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.gray, fontSize: 14 }}></i>
            <input type="text" placeholder="Buscar estudante..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} style={{
              width: '100%', padding: '12px 16px 12px 42px', border: '1px solid #E2E8F0', borderRadius: 14,
              fontSize: 14, outline: 'none', background: colors.white, transition: 'all 0.2s'
            }} />
          </div>
          <button onClick={() => setMostrarModalData(true)} style={{
            padding: '12px 24px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            color: colors.white, border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: 14,
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
          }}>
            <i className="fas fa-file-alt"></i> Gerar Relatório
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '0 24px', marginBottom: 20, flexWrap: 'wrap', '@media (max-width: 768px)': { padding: '0 16px' } }}>
          <button onClick={() => setAbaAtiva('saida')} style={{
            flex: 1, padding: '12px 20px', border: 'none', borderRadius: 14, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
            background: abaAtiva === 'saida' ? colors.dark : colors.lightGray,
            color: abaAtiva === 'saida' ? colors.white : colors.gray,
            boxShadow: abaAtiva === 'saida' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
          }}>
            🟢 SAÍDA ({pedidosSaida.length})
          </button>
          <button onClick={() => setAbaAtiva('andamento')} style={{
            flex: 1, padding: '12px 20px', border: 'none', borderRadius: 14, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
            background: abaAtiva === 'andamento' ? colors.dark : colors.lightGray,
            color: abaAtiva === 'andamento' ? colors.white : colors.gray,
            boxShadow: abaAtiva === 'andamento' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
          }}>
            🔵 ANDAMENTO ({pedidosAndamento.length})
          </button>
          <button onClick={() => setAbaAtiva('finalizado')} style={{
            flex: 1, padding: '12px 20px', border: 'none', borderRadius: 14, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
            background: abaAtiva === 'finalizado' ? colors.dark : colors.lightGray,
            color: abaAtiva === 'finalizado' ? colors.white : colors.gray,
            boxShadow: abaAtiva === 'finalizado' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
          }}>
            ✅ FINALIZADOS ({pedidosFinalizados.length})
          </button>
        </div>

        {/* Data Display */}
        <div style={{
          background: `${colors.primary}08`, margin: '0 24px 20px', padding: '12px 20px',
          borderRadius: 12, fontSize: 13, color: colors.primary, textAlign: 'center',
          border: `1px solid ${colors.primary}15`, fontWeight: 500,
          '@media (max-width: 768px)': { margin: '0 16px 16px' }
        }}>
          📅 {formatarData(dataSelecionada)}
        </div>

        {/* Cards Container */}
        <div style={{ padding: '0 24px 24px', minHeight: 400, '@media (max-width: 768px)': { padding: '0 16px 16px' } }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${colors.lightGray}`, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p>Carregando...</p>
            </div>
          ) : (
            <>
              {/* Aba SAÍDA */}
              {abaAtiva === 'saida' && (
                saidaFiltrada.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>
                    <i className="fas fa-inbox" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}></i>
                    <p>Nenhum estudante aguardando saída</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, '@media (max-width: 768px)': { gridTemplateColumns: '1fr' } }}>
                    {saidaFiltrada.map(p => (
                      <div key={p.id} className="card-animate" style={{
                        background: colors.white, borderRadius: 20, overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}>
                        <div style={{
                          padding: '16px 20px', background: `linear-gradient(135deg, ${colors.warning}08, transparent)`,
                          borderBottom: `2px solid ${colors.warning}20`, display: 'flex', alignItems: 'center', gap: 12
                        }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 14, background: `${colors.warning}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                          }}>🎓</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{p.estudante_nome}</div>
                            <div style={{ fontSize: 12, color: colors.gray }}>{p.estudante_curso || 'Curso não informado'} • {p.estudante_classe || '-'}</div>
                          </div>
                          <div style={{
                            background: `${colors.warning}15`, color: colors.warning,
                            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600
                          }}>Aguardando</div>
                        </div>
                        <div style={{ padding: 20 }}>
                          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ textAlign: 'center', flex: 1, padding: 8, background: colors.lightGray, borderRadius: 12 }}>
                              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>🚪 Saída</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>{p.hora_saida_prevista || '-'}</div>
                            </div>
                            <div style={{ textAlign: 'center', flex: 1, padding: 8, background: colors.lightGray, borderRadius: 12 }}>
                              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>🔙 Retorno</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>{p.hora_volta_prevista || '-'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => marcarSaida(p.id)} style={{
                              flex: 1, padding: 12, background: `linear-gradient(135deg, ${colors.success}, ${colors.successDark})`,
                              color: colors.white, border: 'none', borderRadius: 12, cursor: 'pointer',
                              fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                              <i className="fas fa-check-circle"></i> REGISTRAR SAÍDA
                            </button>
                            <button onClick={() => marcarSaidaAjustada(p.id)} style={{
                              padding: '12px 16px', background: colors.lightGray, border: 'none',
                              borderRadius: 12, cursor: 'pointer', color: colors.gray, fontWeight: 500, fontSize: 13
                            }}>
                              <i className="fas fa-clock"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Aba ANDAMENTO */}
              {abaAtiva === 'andamento' && (
                andamentoFiltrado.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>
                    <i className="fas fa-walking" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}></i>
                    <p>Nenhum estudante em andamento</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, '@media (max-width: 768px)': { gridTemplateColumns: '1fr' } }}>
                    {andamentoFiltrado.map(p => (
                      <div key={p.id} className="card-animate" style={{
                        background: colors.white, borderRadius: 20, overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
                        borderTop: `3px solid ${colors.info}`
                      }}>
                        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 14, background: `${colors.info}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                          }}>🚶</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{p.estudante_nome}</div>
                            <div style={{ fontSize: 12, color: colors.gray }}>{p.estudante_curso || 'Curso não informado'} • {p.estudante_classe || '-'}</div>
                          </div>
                          <div style={{
                            background: `${colors.info}15`, color: colors.info,
                            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600
                          }}>Em andamento</div>
                        </div>
                        <div style={{ padding: '0 20px 20px' }}>
                          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ textAlign: 'center', flex: 1, padding: 8, background: colors.lightGray, borderRadius: 12 }}>
                              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>✅ Saiu às</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: colors.success }}>{p.hora_saida_real || '-'}</div>
                            </div>
                            <div style={{ textAlign: 'center', flex: 1, padding: 8, background: colors.lightGray, borderRadius: 12 }}>
                              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>⏰ Prev. Retorno</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>{p.hora_volta_prevista || '-'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => marcarRetorno(p.id)} style={{
                              flex: 1, padding: 12, background: `linear-gradient(135deg, ${colors.danger}, ${colors.dangerDark})`,
                              color: colors.white, border: 'none', borderRadius: 12, cursor: 'pointer',
                              fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                              <i className="fas fa-undo-alt"></i> REGISTRAR RETORNO
                            </button>
                            <button onClick={() => marcarRetornoAjustado(p.id)} style={{
                              padding: '12px 16px', background: colors.lightGray, border: 'none',
                              borderRadius: 12, cursor: 'pointer', color: colors.gray, fontWeight: 500, fontSize: 13
                            }}>
                              <i className="fas fa-clock"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Aba FINALIZADO */}
              {abaAtiva === 'finalizado' && (
                finalizadosFiltrado.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>
                    <i className="fas fa-check-circle" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}></i>
                    <p>Nenhum estudante finalizado</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, '@media (max-width: 768px)': { gridTemplateColumns: '1fr' } }}>
                    {finalizadosFiltrado.map(p => (
                      <div key={p.id} className="card-animate" style={{
                        background: colors.white, borderRadius: 20, overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
                        borderTop: `3px solid ${p.atrasado ? colors.danger : colors.success}`,
                        opacity: 0.95
                      }}>
                        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: p.atrasado ? `${colors.danger}15` : `${colors.success}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                          }}>✅</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{p.estudante_nome}</div>
                            <div style={{ fontSize: 12, color: colors.gray }}>{p.estudante_curso || 'Curso não informado'} • {p.estudante_classe || '-'}</div>
                          </div>
                          {p.atrasado && (
                            <div style={{
                              background: `${colors.danger}15`, color: colors.danger,
                              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600
                            }}>⚠️ Atraso</div>
                          )}
                        </div>
                        <div style={{ padding: '0 20px 20px' }}>
                          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ textAlign: 'center', flex: 1, padding: 8, background: colors.lightGray, borderRadius: 12 }}>
                              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>✅ Saiu</div>
                              <div style={{ fontSize: 16, fontWeight: 600, color: colors.dark }}>{p.hora_saida_real || '-'}</div>
                            </div>
                            <div style={{ textAlign: 'center', flex: 1, padding: 8, background: colors.lightGray, borderRadius: 12 }}>
                              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>🔴 Retornou</div>
                              <div style={{ fontSize: 16, fontWeight: 600, color: colors.dark }}>{p.hora_retorno_real || '-'}</div>
                            </div>
                          </div>
                          {p.atrasado && (
                            <div style={{
                              marginTop: 12, padding: 10, background: `${colors.danger}10`,
                              borderRadius: 10, fontSize: 12, color: colors.danger, textAlign: 'center',
                              border: `1px solid ${colors.danger}20`
                            }}>
                              ⚠️ Atraso de {p.tempo_atraso} minutos
                            </div>
                          )}
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

      {/* Modais (mantidos da versão anterior) */}
      {/* Modal Seleção Data */}
      {mostrarModalData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setMostrarModalData(false)}>
          <div style={{ background: colors.white, borderRadius: 24, width: '90%', maxWidth: 500, overflow: 'auto', animation: 'fadeInUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>📄 Gerar Relatório</h3>
              <button onClick={() => setMostrarModalData(false)} style={{ width: 32, height: 32, border: '1px solid #E2E8F0', background: colors.white, borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.gray, marginBottom: 8 }}>Data do Relatório</label>
              <input type="date" value={dataRelatorio} onChange={(e) => setDataRelatorio(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setMostrarModalData(false)} style={{ flex: 1, padding: 12, background: colors.lightGray, border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button onClick={gerarRelatorioCompleto} style={{ flex: 1, padding: 12, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, color: colors.white, border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>Gerar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Relatório Gerado */}
      {relatorio && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setRelatorio(null)}>
          <div style={{ background: colors.white, borderRadius: 24, width: '90%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>📄 Relatório - {relatorio.data}</h3>
              <button onClick={() => setRelatorio(null)} style={{ width: 32, height: 32, border: '1px solid #E2E8F0', background: colors.white, borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: colors.lightGray, padding: 20, borderRadius: 16, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.dark }}>📊 RESUMO DO DIA</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 13 }}>
                  <p>👥 Total Autorizados: <strong>{relatorio.total_autorizados}</strong></p>
                  <p>✅ Saídas Registradas: <strong>{relatorio.saidas_registradas}</strong> ({relatorio.taxa_saida}%)</p>
                  <p>🔴 Retornos Registrados: <strong>{relatorio.retornos_registrados}</strong> ({relatorio.taxa_retorno}%)</p>
                  <p>⚠️ Atrasos: <strong>{relatorio.atrasos}</strong> ({relatorio.taxa_atraso}%)</p>
                </div>
              </div>
              <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.dark }}>👨‍🎓 LISTA COMPLETA</h4>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'auto', maxHeight: 300 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: colors.lightGray, borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: 12, textAlign: 'left' }}>Estudante</th><th style={{ padding: 12, textAlign: 'left' }}>Saída</th><th style={{ padding: 12, textAlign: 'left' }}>Retorno</th><th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.lista_completa?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: item.atrasado ? '#FEF2F2' : 'transparent' }}>
                        <td style={{ padding: 12 }}>{item.estudante}</td>
                        <td style={{ padding: 12 }}>{item.hora_saida_real || '⏳ Não saiu'}</td>
                        <td style={{ padding: 12 }}>{item.hora_retorno_real || (item.hora_saida_real ? '⏳ Aguardando' : '-')}</td>
                        <td style={{ padding: 12 }}>
                          {item.atrasado ? '⚠️ Atrasado' : item.hora_retorno_real ? '✅ Completo' : item.hora_saida_real ? '🚶 Em andamento' : '⏳ Aguardando'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ padding: 20, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(relatorio.texto_relatorio)}`, '_blank')} style={{ padding: '10px 20px', background: colors.lightGray, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>📄 Visualizar Texto</button>
              <button onClick={enviarRelatorio} disabled={enviando} style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, color: colors.white, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>{enviando ? 'Enviando...' : '📧 Enviar para DITE'}</button>
              <button onClick={() => setRelatorio(null)} style={{ padding: '10px 20px', background: colors.lightGray, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações Panel */}
      {showNotificacoes && (
        <>
          <div onClick={() => setShowNotificacoes(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, width: 360, height: '100vh', background: colors.white, boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'auto', '@media (max-width: 768px)': { width: '100%' } }}>
            <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>🔔 Notificações</h3>
              <button onClick={() => setShowNotificacoes(false)} style={{ width: 32, height: 32, background: colors.lightGray, border: 'none', borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100vh - 70px)' }}>
              {notificacoes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>Nenhuma notificação</div>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{ padding: 16, borderBottom: '1px solid #F1F5F9', cursor: 'pointer', background: n.lida ? colors.white : '#FEFCE8' }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{n.mensagem}</div>
                    <div style={{ fontSize: 11, color: colors.gray }}>{n.data}</div>
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

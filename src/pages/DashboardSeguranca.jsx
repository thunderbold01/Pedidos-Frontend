// src/pages/DashboardSeguranca.jsx - ADOBE SPECTRUM INSPIRED VERSION
import { useState, useEffect, useMemo } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // ==================== ESTADOS (100% MANTIDOS) ====================
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

  // ==================== RELÓGIO ====================
  useEffect(() => {
    const atualizarHora = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==================== CARREGAR DADOS (100% MANTIDO) ====================
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

  // ==================== AÇÕES (100% MANTIDAS) ====================
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

  // ==================== HELPERS ====================
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

  // ==================== ADOBE SPECTRUM COLOR PALETTE ====================
  const colors = {
    // Primary - Adobe Blue
    primary: '#1473E6',
    primaryHover: '#0D66D0',
    primaryActive: '#095ABA',
    primaryLight: '#E8F1FD',
    
    // Neutrals - Gray Scale
    gray50: '#FFFFFF',
    gray75: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EAEAEA',
    gray300: '#D7D7D7',
    gray400: '#B3B3B3',
    gray500: '#909090',
    gray600: '#6E6E6E',
    gray700: '#4B4B4B',
    gray800: '#2C2C2C',
    gray900: '#1A1A1A',
    
    // Semantic Colors
    success: '#2D9D78',
    successLight: '#E8F5F1',
    warning: '#E68619',
    warningLight: '#FDF3E8',
    danger: '#D7373F',
    dangerLight: '#FCE8E9',
    info: '#378EF0',
    infoLight: '#E9F3FE',
  };

  // ==================== RENDER ====================
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: colors.gray75,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      
      {/* ==================== GLOBAL CSS ==================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        .card-hover {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        
        .btn-primary {
          transition: all 0.2s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(20, 115, 230, 0.3);
        }
        
        .btn-primary:active {
          transform: translateY(0);
        }
        
        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${colors.gray100};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${colors.gray300};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.gray400};
        }
        
        /* Mobile Styles */
        @media (max-width: 768px) {
          .sidebar-mobile {
            position: fixed;
            left: -280px;
            top: 0;
            height: 100vh;
            z-index: 1000;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .sidebar-mobile.open {
            left: 0;
          }
          
          .menu-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(4px);
          }
          
          .menu-overlay.active {
            display: block;
            animation: fadeIn 0.2s ease;
          }
        }
      `}</style>

      {/* Mobile Menu Overlay */}
      <div 
        className={`menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ==================== SIDEBAR ==================== */}
      <aside 
        className={`sidebar-mobile ${mobileMenuOpen ? 'open' : ''}`}
        style={{
          width: 280,
          background: colors.gray50,
          height: '100vh',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${colors.gray200}`,
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Logo */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          marginBottom: 32 
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.gray50,
            fontSize: 18,
            fontWeight: 600
          }}>
            <i className="fas fa-shield-alt"></i>
          </div>
          <div style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: colors.gray900,
            letterSpacing: '-0.02em'
          }}>
            Segurança
          </div>
        </div>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          background: colors.gray100,
          borderRadius: 8,
          marginBottom: 24,
          border: `1px solid ${colors.gray200}`
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.gray50,
            fontWeight: 600,
            fontSize: 16
          }}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'S'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: colors.gray900,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.nome || user?.username}
            </div>
            <div style={{ 
              fontSize: 12, 
              color: colors.gray600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Portaria
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 4 
        }}>
          <button 
            onClick={() => { 
              setAbaAtiva('saida'); 
              setMobileMenuOpen(false); 
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: 'none',
              background: abaAtiva === 'saida' ? colors.primaryLight : 'transparent',
              textAlign: 'left',
              fontSize: 14,
              fontWeight: abaAtiva === 'saida' ? 600 : 500,
              color: abaAtiva === 'saida' ? colors.primary : colors.gray700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ width: 16 }}></i>
            <span>Saída</span>
            {pedidosSaida.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: colors.warning,
                color: colors.gray50,
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600
              }}>
                {pedidosSaida.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { 
              setAbaAtiva('andamento'); 
              setMobileMenuOpen(false); 
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: 'none',
              background: abaAtiva === 'andamento' ? colors.primaryLight : 'transparent',
              textAlign: 'left',
              fontSize: 14,
              fontWeight: abaAtiva === 'andamento' ? 600 : 500,
              color: abaAtiva === 'andamento' ? colors.primary : colors.gray700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-walking" style={{ width: 16 }}></i>
            <span>Em Andamento</span>
            {pedidosAndamento.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: colors.info,
                color: colors.gray50,
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600
              }}>
                {pedidosAndamento.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { 
              setAbaAtiva('finalizado'); 
              setMobileMenuOpen(false); 
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              border: 'none',
              background: abaAtiva === 'finalizado' ? colors.primaryLight : 'transparent',
              textAlign: 'left',
              fontSize: 14,
              fontWeight: abaAtiva === 'finalizado' ? 600 : 500,
              color: abaAtiva === 'finalizado' ? colors.primary : colors.gray700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-check-circle" style={{ width: 16 }}></i>
            <span>Finalizados</span>
          </button>
        </nav>

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          style={{
            padding: '10px 12px',
            background: colors.dangerLight,
            border: `1px solid ${colors.gray200}`,
            borderRadius: 6,
            color: colors.danger,
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 'auto',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fas fa-sign-out-alt" style={{ width: 16 }}></i>
          Sair
        </button>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        width: '100%'
      }}>
        
        {/* ==================== HEADER ==================== */}
        <header style={{
          background: colors.gray50,
          borderBottom: `1px solid ${colors.gray200}`,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: 20,
                color: colors.gray700,
                cursor: 'pointer',
                padding: 8
              }}
              className="mobile-menu-btn"
            >
              <i className="fas fa-bars"></i>
            </button>
            
            <div>
              <h1 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: colors.gray900,
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Controle de Portão
              </h1>
              <p style={{ 
                fontSize: 13, 
                color: colors.gray600,
                margin: '4px 0 0'
              }}>
                {horaAtual}
              </p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12 
          }}>
            {/* Date Picker */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: colors.gray100,
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${colors.gray200}`
            }}>
              <i 
                className="fas fa-calendar" 
                style={{ 
                  color: colors.gray600, 
                  fontSize: 14 
                }}
              ></i>
              <input 
                type="date" 
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 13,
                  outline: 'none',
                  fontWeight: 500,
                  color: colors.gray900,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Notifications */}
            <button 
              onClick={() => setShowNotificacoes(!showNotificacoes)}
              style={{
                position: 'relative',
                padding: 10,
                background: colors.gray100,
                border: `1px solid ${colors.gray200}`,
                borderRadius: 6,
                cursor: 'pointer',
                color: colors.gray700,
                fontSize: 16,
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-bell"></i>
              {notificacoesNaoLidas > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  background: colors.danger,
                  borderRadius: '50%',
                  border: `2px solid ${colors.gray50}`
                }} />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Menu Button Responsive CSS */}
        <style>{`
          @media (max-width: 768px) {
            .mobile-menu-btn {
              display: block !important;
            }
          }
        `}</style>

        {/* ==================== STATS CARDS ==================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          padding: 24
        }}>
          {/* Card Aguardando */}
          <div 
            className="card-hover"
            style={{
              background: colors.gray50,
              borderRadius: 8,
              padding: 20,
              border: `1px solid ${colors.gray200}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: colors.warningLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.warning,
                fontSize: 18
              }}>
                <i className="fas fa-clock"></i>
              </div>
              <span style={{
                fontSize: 32,
                fontWeight: 700,
                color: colors.warning,
                lineHeight: 1
              }}>
                {pedidosSaida.length}
              </span>
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: colors.gray900,
              marginBottom: 4
            }}>
              Aguardando Saída
            </div>
            <div style={{
              fontSize: 12,
              color: colors.gray600
            }}>
              Estudantes na portaria
            </div>
          </div>

          {/* Card Em Andamento */}
          <div 
            className="card-hover"
            style={{
              background: colors.gray50,
              borderRadius: 8,
              padding: 20,
              border: `1px solid ${colors.gray200}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: colors.infoLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.info,
                fontSize: 18
              }}>
                <i className="fas fa-walking"></i>
              </div>
              <span style={{
                fontSize: 32,
                fontWeight: 700,
                color: colors.info,
                lineHeight: 1
              }}>
                {pedidosAndamento.length}
              </span>
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: colors.gray900,
              marginBottom: 4
            }}>
              Em Andamento
            </div>
            <div style={{
              fontSize: 12,
              color: colors.gray600
            }}>
              Fora da unidade
            </div>
          </div>

          {/* Card Finalizados */}
          <div 
            className="card-hover"
            style={{
              background: colors.gray50,
              borderRadius: 8,
              padding: 20,
              border: `1px solid ${colors.gray200}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: colors.successLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.success,
                fontSize: 18
              }}>
                <i className="fas fa-check-circle"></i>
              </div>
              <span style={{
                fontSize: 32,
                fontWeight: 700,
                color: colors.success,
                lineHeight: 1
              }}>
                {pedidosFinalizados.length}
              </span>
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: colors.gray900,
              marginBottom: 4
            }}>
              Finalizados
            </div>
            <div style={{
              fontSize: 12,
              color: colors.gray600
            }}>
              Retornaram hoje
            </div>
          </div>
        </div>

        {/* ==================== TOOLBAR ==================== */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px 16px',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ 
            position: 'relative', 
            flex: '1 1 300px',
            maxWidth: 400
          }}>
            <i 
              className="fas fa-search"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.gray500,
                fontSize: 14
              }}
            ></i>
            <input 
              type="text"
              placeholder="Buscar estudante..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: `1px solid ${colors.gray200}`,
                borderRadius: 6,
                fontSize: 14,
                outline: 'none',
                background: colors.gray50,
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Report Button */}
          <button 
            onClick={() => setMostrarModalData(true)}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              background: colors.primary,
              color: colors.gray50,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fas fa-file-alt"></i>
            <span>Gerar Relatório</span>
          </button>
        </div>

        {/* ==================== DATE INFO ==================== */}
        <div style={{
          background: colors.primaryLight,
          margin: '0 24px 16px',
          padding: '10px 16px',
          borderRadius: 6,
          fontSize: 13,
          color: colors.primary,
          textAlign: 'center',
          border: `1px solid ${colors.primary}20`,
          fontWeight: 500
        }}>
          📅 {formatarData(dataSelecionada)}
        </div>

        {/* ==================== CONTENT AREA ==================== */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 24px 24px'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: 60,
              color: colors.gray500
            }}>
              <div style={{
                width: 40,
                height: 40,
                border: `3px solid ${colors.gray200}`,
                borderTopColor: colors.primary,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>Carregando dados...</p>
            </div>
          ) : (
            <>
              {/* ==================== ABA SAÍDA ==================== */}
              {abaAtiva === 'saida' && (
                saidaFiltrada.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 80,
                    color: colors.gray500
                  }}>
                    <i 
                      className="fas fa-inbox"
                      style={{
                        fontSize: 48,
                        marginBottom: 16,
                        opacity: 0.3
                      }}
                    ></i>
                    <p style={{ fontSize: 15 }}>
                      Nenhum estudante aguardando saída
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 16
                  }}>
                    {saidaFiltrada.map(p => (
                      <div 
                        key={p.id}
                        className="card-hover"
                        style={{
                          background: colors.gray50,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: `1px solid ${colors.gray200}`,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                          animation: 'fadeIn 0.3s ease'
                        }}
                      >
                        {/* Card Header */}
                        <div style={{
                          padding: '16px 20px',
                          background: colors.warningLight,
                          borderBottom: `1px solid ${colors.gray200}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: colors.gray50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0
                          }}>
                            🎓
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: colors.gray900,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.estudante_nome}
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: colors.gray600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.estudante_curso || 'Curso não informado'}
                            </div>
                          </div>
                          <div style={{
                            background: colors.warning,
                            color: colors.gray50,
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}>
                            Aguardando
                          </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: 20 }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                            marginBottom: 16
                          }}>
                            <div style={{
                              textAlign: 'center',
                              padding: 12,
                              background: colors.gray100,
                              borderRadius: 6,
                              border: `1px solid ${colors.gray200}`
                            }}>
                              <div style={{
                                fontSize: 11,
                                color: colors.gray600,
                                marginBottom: 4,
                                fontWeight: 500
                              }}>
                                🚪 Saída
                              </div>
                              <div style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: colors.gray900
                              }}>
                                {p.hora_saida_prevista || '-'}
                              </div>
                            </div>
                            <div style={{
                              textAlign: 'center',
                              padding: 12,
                              background: colors.gray100,
                              borderRadius: 6,
                              border: `1px solid ${colors.gray200}`
                            }}>
                              <div style={{
                                fontSize: 11,
                                color: colors.gray600,
                                marginBottom: 4,
                                fontWeight: 500
                              }}>
                                🔙 Retorno
                              </div>
                              <div style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: colors.gray900
                              }}>
                                {p.hora_volta_prevista || '-'}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{
                            display: 'flex',
                            gap: 8
                          }}>
                            <button 
                              onClick={() => marcarSaida(p.id)}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: 12,
                                background: colors.success,
                                color: colors.gray50,
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                              }}
                            >
                              <i className="fas fa-check-circle"></i>
                              Registrar Saída
                            </button>
                            <button 
                              onClick={() => marcarSaidaAjustada(p.id)}
                              style={{
                                padding: '12px 14px',
                                background: colors.gray100,
                                border: `1px solid ${colors.gray200}`,
                                borderRadius: 6,
                                cursor: 'pointer',
                                color: colors.gray700,
                                fontWeight: 500,
                                fontSize: 14,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fas fa-clock"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ==================== ABA ANDAMENTO ==================== */}
              {abaAtiva === 'andamento' && (
                andamentoFiltrado.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 80,
                    color: colors.gray500
                  }}>
                    <i 
                      className="fas fa-walking"
                      style={{
                        fontSize: 48,
                        marginBottom: 16,
                        opacity: 0.3
                      }}
                    ></i>
                    <p style={{ fontSize: 15 }}>
                      Nenhum estudante em andamento
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 16
                  }}>
                    {andamentoFiltrado.map(p => (
                      <div 
                        key={p.id}
                        className="card-hover"
                        style={{
                          background: colors.gray50,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: `1px solid ${colors.gray200}`,
                          borderLeft: `4px solid ${colors.info}`,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                          animation: 'fadeIn 0.3s ease'
                        }}
                      >
                        {/* Card Header */}
                        <div style={{
                          padding: '16px 20px',
                          borderBottom: `1px solid ${colors.gray200}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: colors.infoLight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0
                          }}>
                            🚶
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: colors.gray900,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.estudante_nome}
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: colors.gray600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.estudante_curso || 'Curso não informado'}
                            </div>
                          </div>
                          <div style={{
                            background: colors.info,
                            color: colors.gray50,
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}>
                            Em andamento
                          </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: 20 }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                            marginBottom: 16
                          }}>
                            <div style={{
                              textAlign: 'center',
                              padding: 12,
                              background: colors.successLight,
                              borderRadius: 6,
                              border: `1px solid ${colors.success}20`
                            }}>
                              <div style={{
                                fontSize: 11,
                                color: colors.gray600,
                                marginBottom: 4,
                                fontWeight: 500
                              }}>
                                ✅ Saiu às
                              </div>
                              <div style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: colors.success
                              }}>
                                {p.hora_saida_real || '-'}
                              </div>
                            </div>
                            <div style={{
                              textAlign: 'center',
                              padding: 12,
                              background: colors.gray100,
                              borderRadius: 6,
                              border: `1px solid ${colors.gray200}`
                            }}>
                              <div style={{
                                fontSize: 11,
                                color: colors.gray600,
                                marginBottom: 4,
                                fontWeight: 500
                              }}>
                                ⏰ Prev. Retorno
                              </div>
                              <div style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: colors.gray900
                              }}>
                                {p.hora_volta_prevista || '-'}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{
                            display: 'flex',
                            gap: 8
                          }}>
                            <button 
                              onClick={() => marcarRetorno(p.id)}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: 12,
                                background: colors.danger,
                                color: colors.gray50,
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                              }}
                            >
                              <i className="fas fa-undo-alt"></i>
                              Registrar Retorno
                            </button>
                            <button 
                              onClick={() => marcarRetornoAjustado(p.id)}
                              style={{
                                padding: '12px 14px',
                                background: colors.gray100,
                                border: `1px solid ${colors.gray200}`,
                                borderRadius: 6,
                                cursor: 'pointer',
                                color: colors.gray700,
                                fontWeight: 500,
                                fontSize: 14,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fas fa-clock"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ==================== ABA FINALIZADO ==================== */}
              {abaAtiva === 'finalizado' && (
                finalizadosFiltrado.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 80,
                    color: colors.gray500
                  }}>
                    <i 
                      className="fas fa-check-circle"
                      style={{
                        fontSize: 48,
                        marginBottom: 16,
                        opacity: 0.3
                      }}
                    ></i>
                    <p style={{ fontSize: 15 }}>
                      Nenhum retorno finalizado hoje
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 16
                  }}>
                    {finalizadosFiltrado.map(p => (
                      <div 
                        key={p.id}
                        className="card-hover"
                        style={{
                          background: colors.gray50,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: `1px solid ${colors.gray200}`,
                          borderLeft: `4px solid ${p.atrasado ? colors.danger : colors.success}`,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                          opacity: 0.95,
                          animation: 'fadeIn 0.3s ease'
                        }}
                      >
                        {/* Card Header */}
                        <div style={{
                          padding: '16px 20px',
                          borderBottom: `1px solid ${colors.gray200}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: p.atrasado ? colors.dangerLight : colors.successLight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0
                          }}>
                            {p.atrasado ? '⚠️' : '✅'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: colors.gray900,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.estudante_nome}
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: colors.gray600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {p.estudante_curso || 'Curso não informado'}
                            </div>
                          </div>
                          {p.atrasado && (
                            <div style={{
                              background: colors.danger,
                              color: colors.gray50,
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              Atraso
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: 20 }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                            marginBottom: p.atrasado ? 12 : 0
                          }}>
                            <div style={{
                              textAlign: 'center',
                              padding: 12,
                              background: colors.gray100,
                              borderRadius: 6,
                              border: `1px solid ${colors.gray200}`
                            }}>
                              <div style={{
                                fontSize: 11,
                                color: colors.gray600,
                                marginBottom: 4,
                                fontWeight: 500
                              }}>
                                ✅ Saiu
                              </div>
                              <div style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: colors.gray900
                              }}>
                                {p.hora_saida_real || '-'}
                              </div>
                            </div>
                            <div style={{
                              textAlign: 'center',
                              padding: 12,
                              background: colors.gray100,
                              borderRadius: 6,
                              border: `1px solid ${colors.gray200}`
                            }}>
                              <div style={{
                                fontSize: 11,
                                color: colors.gray600,
                                marginBottom: 4,
                                fontWeight: 500
                              }}>
                                🔴 Retornou
                              </div>
                              <div style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: colors.gray900
                              }}>
                                {p.hora_retorno_real || '-'}
                              </div>
                            </div>
                          </div>

                          {p.atrasado && (
                            <div style={{
                              marginTop: 12,
                              padding: 10,
                              background: colors.dangerLight,
                              borderRadius: 6,
                              fontSize: 12,
                              color: colors.danger,
                              textAlign: 'center',
                              border: `1px solid ${colors.danger}20`,
                              fontWeight: 500
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

      {/* ==================== MODAL SELEÇÃO DATA ==================== */}
      {mostrarModalData && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: 16
          }}
          onClick={() => setMostrarModalData(false)}
        >
          <div 
            style={{
              background: colors.gray50,
              borderRadius: 8,
              width: '100%',
              maxWidth: 480,
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: 20,
              borderBottom: `1px solid ${colors.gray200}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: colors.gray900,
                margin: 0
              }}>
                📄 Gerar Relatório
              </h3>
              <button 
                onClick={() => setMostrarModalData(false)}
                style={{
                  width: 32,
                  height: 32,
                  border: `1px solid ${colors.gray200}`,
                  background: colors.gray100,
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: colors.gray700,
                  fontSize: 16,
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: colors.gray700,
                marginBottom: 8
              }}>
                Data do Relatório
              </label>
              <input 
                type="date"
                value={dataRelatorio}
                onChange={(e) => setDataRelatorio(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: 6,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                  background: colors.gray50
                }}
              />

              <div style={{
                display: 'flex',
                gap: 12,
                marginTop: 24
              }}>
                <button 
                  onClick={() => setMostrarModalData(false)}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: colors.gray100,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    color: colors.gray700,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={gerarRelatorioCompleto}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: 12,
                    background: colors.primary,
                    color: colors.gray50,
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Gerar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL RELATÓRIO GERADO ==================== */}
      {relatorio && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            padding: 16
          }}
          onClick={() => setRelatorio(null)}
        >
          <div 
            style={{
              background: colors.gray50,
              borderRadius: 8,
              width: '100%',
              maxWidth: 800,
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'fadeIn 0.2s ease',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: 20,
              borderBottom: `1px solid ${colors.gray200}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: colors.gray50,
              zIndex: 1
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: colors.gray900,
                margin: 0
              }}>
                📄 Relatório - {relatorio.data}
              </h3>
              <button 
                onClick={() => setRelatorio(null)}
                style={{
                  width: 32,
                  height: 32,
                  border: `1px solid ${colors.gray200}`,
                  background: colors.gray100,
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: colors.gray700,
                  fontSize: 16,
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              {/* Summary Cards */}
              <div style={{
                background: colors.gray100,
                padding: 20,
                borderRadius: 8,
                marginBottom: 24,
                border: `1px solid ${colors.gray200}`
              }}>
                <h4 style={{
                  marginBottom: 16,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.gray900
                }}>
                  📊 RESUMO DO DIA
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  fontSize: 13,
                  color: colors.gray700
                }}>
                  <p style={{ margin: 0 }}>
                    👥 Total: <strong>{relatorio.total_autorizados}</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    ✅ Saídas: <strong>{relatorio.saidas_registradas}</strong> ({relatorio.taxa_saida}%)
                  </p>
                  <p style={{ margin: 0 }}>
                    🔴 Retornos: <strong>{relatorio.retornos_registrados}</strong> ({relatorio.taxa_retorno}%)
                  </p>
                  <p style={{ margin: 0 }}>
                    ⚠️ Atrasos: <strong>{relatorio.atrasos}</strong> ({relatorio.taxa_atraso}%)
                  </p>
                </div>
              </div>

              {/* Table */}
              <h4 style={{
                marginBottom: 16,
                fontSize: 14,
                fontWeight: 600,
                color: colors.gray900
              }}>
                👨‍🎓 LISTA COMPLETA
              </h4>
              <div style={{
                border: `1px solid ${colors.gray200}`,
                borderRadius: 8,
                overflow: 'auto',
                maxHeight: 400
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13
                }}>
                  <thead>
                    <tr style={{
                      background: colors.gray100,
                      borderBottom: `1px solid ${colors.gray200}`,
                      position: 'sticky',
                      top: 0
                    }}>
                      <th style={{
                        padding: 12,
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.gray900
                      }}>
                        Estudante
                      </th>
                      <th style={{
                        padding: 12,
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.gray900
                      }}>
                        Saída
                      </th>
                      <th style={{
                        padding: 12,
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.gray900
                      }}>
                        Retorno
                      </th>
                      <th style={{
                        padding: 12,
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.gray900
                      }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.lista_completa?.map((item, idx) => (
                      <tr 
                        key={idx}
                        style={{
                          borderBottom: `1px solid ${colors.gray200}`,
                          background: item.atrasado ? colors.dangerLight : colors.gray50
                        }}
                      >
                        <td style={{ 
                          padding: 12,
                          color: colors.gray900
                        }}>
                          {item.estudante}
                        </td>
                        <td style={{ 
                          padding: 12,
                          color: colors.gray700
                        }}>
                          {item.hora_saida_real || '⏳ Não saiu'}
                        </td>
                        <td style={{ 
                          padding: 12,
                          color: colors.gray700
                        }}>
                          {item.hora_retorno_real || (item.hora_saida_real ? '⏳ Aguardando' : '-')}
                        </td>
                        <td style={{ 
                          padding: 12,
                          fontWeight: 500
                        }}>
                          {item.atrasado ? (
                            <span style={{ color: colors.danger }}>⚠️ Atrasado</span>
                          ) : item.hora_retorno_real ? (
                            <span style={{ color: colors.success }}>✅ Completo</span>
                          ) : item.hora_saida_real ? (
                            <span style={{ color: colors.info }}>🚶 Em andamento</span>
                          ) : (
                            <span style={{ color: colors.gray500 }}>⏳ Aguardando</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: 20,
              borderTop: `1px solid ${colors.gray200}`,
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              position: 'sticky',
              bottom: 0,
              background: colors.gray50
            }}>
              <button 
                onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(relatorio.texto_relatorio)}`, '_blank')}
                style={{
                  padding: '10px 20px',
                  background: colors.gray100,
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: colors.gray700,
                  transition: 'all 0.2s ease'
                }}
              >
                📄 Ver Texto
              </button>
              <button 
                onClick={enviarRelatorio}
                disabled={enviando}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  background: enviando ? colors.gray300 : colors.primary,
                  color: colors.gray50,
                  border: 'none',
                  borderRadius: 6,
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: enviando ? 0.6 : 1
                }}
              >
                {enviando ? 'Enviando...' : '📧 Enviar DITE'}
              </button>
              <button 
                onClick={() => setRelatorio(null)}
                style={{
                  padding: '10px 20px',
                  background: colors.gray100,
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: colors.gray700,
                  transition: 'all 0.2s ease'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NOTIFICAÇÕES PANEL ==================== */}
      {showNotificacoes && (
        <>
          <div 
            onClick={() => setShowNotificacoes(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 199,
              backdropFilter: 'blur(4px)'
            }}
          />
          <div 
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 360,
              height: '100vh',
              background: colors.gray50,
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.3s ease'
            }}
          >
            {/* Panel Header */}
            <div style={{
              padding: 20,
              borderBottom: `1px solid ${colors.gray200}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                color: colors.gray900,
                margin: 0
              }}>
                🔔 Notificações
              </h3>
              <button 
                onClick={() => setShowNotificacoes(false)}
                style={{
                  width: 32,
                  height: 32,
                  background: colors.gray100,
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: colors.gray700,
                  fontSize: 16,
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Notifications List */}
            <div style={{
              flex: 1,
              overflowY: 'auto'
            }}>
              {notificacoes.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 60,
                  color: colors.gray500
                }}>
                  <i 
                    className="fas fa-bell-slash"
                    style={{
                      fontSize: 48,
                      marginBottom: 16,
                      opacity: 0.3
                    }}
                  ></i>
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notificacoes.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => marcarNotificacaoLida(n.id)}
                    style={{
                      padding: 16,
                      borderBottom: `1px solid ${colors.gray200}`,
                      cursor: 'pointer',
                      background: n.lida ? colors.gray50 : colors.infoLight,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{
                      fontSize: 13,
                      marginBottom: 4,
                      color: colors.gray900,
                      lineHeight: 1.5
                    }}>
                      {n.mensagem}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: colors.gray600
                    }}>
                      {n.data}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Responsive Adjustments */}
      <style>{`
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardSeguranca;

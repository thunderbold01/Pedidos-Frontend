// src/pages/DashboardDirecao.jsx - VERSÃO COMPLETA E PROFISSIONAL
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardDirecao = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [coletivas, setColetivas] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DIRECAO');
  const [filtroData, setFiltroData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState({ data_inicio: '', data_fim: '' });
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [relatorioGerado, setRelatorioGerado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const colors = {
    primary: '#8B0000',
    primaryDark: '#5C0000',
    primaryLight: '#FEE2E2',
    success: '#10B981',
    successDark: '#059669',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
    dark: '#1F2937'
  };

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    carregarColetivas();
    carregarRelatorios();
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
    } catch (err) {}
  };

  const carregarRelatorios = async () => {
    try {
      const res = await api.get('/relatorios/');
      setRelatorios(res.data.relatorios || []);
    } catch (err) {}
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      await carregarDados();
      await carregarNotificacoes();
      alert(`✅ Pedido ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const motivo = prompt('📝 Motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else {
        alert(`❌ Erro: ${msg}`);
      }
    }
  };

  const handleEncaminhar = async (pedidoId) => {
    if (!confirm('📤 Encaminhar este pedido para a Administração?')) return;
    try {
      await api.post(`/pedidos/${pedidoId}/passar/`);
      await carregarDados();
      await carregarNotificacoes();
      alert('✅ Pedido encaminhado para a Administração!');
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar'));
    }
  };

  const gerarRelatorio = async () => {
    if (!dadosRelatorio.data_inicio || !dadosRelatorio.data_fim) {
      alert('⚠️ Selecione o período do relatório');
      return;
    }
    setGerandoRelatorio(true);
    try {
      const response = await api.post('/relatorios/criar/', {
        titulo: `Relatório Direção - ${new Date().toLocaleDateString('pt-BR')}`,
        tipo: 'PERSONALIZADO',
        descricao: 'Relatório gerado pela Direção',
        data_inicio: dadosRelatorio.data_inicio,
        data_fim: dadosRelatorio.data_fim
      });
      setRelatorioGerado(response.data);
      alert('✅ Relatório gerado com sucesso!');
      carregarRelatorios();
    } catch (err) {
      alert('❌ Erro ao gerar relatório: ' + (err.response?.data?.error || err.message));
    } finally {
      setGerandoRelatorio(false);
      setModalRelatorio(false);
    }
  };

  const baixarRelatorio = async (relatorioId) => {
    try {
      const response = await api.get(`/relatorios/download/${relatorioId}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${relatorioId}.csv`);
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
      'PENDENTE_DITE': { background: '#FEF9C3', color: '#D97706' },
      'PENDENTE_DIRECAO': { background: '#FEE2E2', color: '#8B0000' },
      'PENDENTE_ADMIN': { background: '#DBEAFE', color: '#2563EB' },
      'APROVADO': { background: '#DCFCE7', color: '#059669' },
      'REJEITADO': { background: '#FEE2E2', color: '#DC2626' },
      'EM_ANDAMENTO': { background: '#E0F2FE', color: '#0284C7' },
      'FINALIZADO': { background: '#F1F5F9', color: '#64748B' }
    };
    return styles[estado] || { background: '#F1F5F9', color: '#64748B' };
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => 
      p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm)
    );
  }, [pedidos, searchTerm]);

  const menuItems = [
    { id: 'PENDENTE_DIRECAO', label: 'Pendentes', icon: 'fas fa-clock', count: stats.meus_pedidos_pendentes },
    { id: 'APROVADO', label: 'Aprovados', icon: 'fas fa-check-circle', count: stats.pedidos_aprovados },
    { id: 'REJEITADO', label: 'Rejeitados', icon: 'fas fa-times-circle', count: stats.pedidos_rejeitados },
    { id: 'EM_ANDAMENTO', label: 'Em Andamento', icon: 'fas fa-walking' },
    { id: 'FINALIZADO', label: 'Finalizados', icon: 'fas fa-flag-checkered' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
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
        position: 'sticky', top: 0, transition: 'left 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontSize: 18,
            boxShadow: '0 8px 16px -4px rgba(139,0,0,0.2)'
          }}>
            <i className="fas fa-building"></i>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>Direção</div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: colors.primaryLight,
          borderRadius: 14, marginBottom: 24, border: `1px solid ${colors.primary}20`
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white,
            fontWeight: 600, fontSize: 18
          }}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'D'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>{user?.nome || user?.username}</div>
            <div style={{ fontSize: 12, color: colors.primary }}>👨‍💼 Direção</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setFiltroEstado(item.id); setAbaAtiva('pedidos'); setMobileMenuOpen(false); }} style={{
              padding: '12px 16px', borderRadius: 12, border: 'none',
              background: filtroEstado === item.id ? colors.primaryLight : 'transparent',
              textAlign: 'left', fontSize: 14, fontWeight: filtroEstado === item.id ? 600 : 500,
              color: filtroEstado === item.id ? colors.primary : colors.gray,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              borderLeft: filtroEstado === item.id ? `3px solid ${colors.primary}` : '3px solid transparent'
            }}>
              <i className={item.icon} style={{ width: 20 }}></i>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count > 0 && <span style={{
                background: colors.primary, color: colors.white, padding: '2px 8px',
                borderRadius: 20, fontSize: 11, fontWeight: 600
              }}>{item.count}</span>}
            </button>
          ))}
          <div style={{ height: 1, background: '#E2E8F0', margin: '12px 0' }} />
          <button onClick={() => { setAbaAtiva('relatorios'); setMobileMenuOpen(false); }} style={{
            padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent',
            textAlign: 'left', fontSize: 14, fontWeight: 500, color: colors.gray,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <i className="fas fa-chart-line"></i> Relatórios
          </button>
          <button onClick={() => { setAbaAtiva('coletivas'); setMobileMenuOpen(false); }} style={{
            padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent',
            textAlign: 'left', fontSize: 14, fontWeight: 500, color: colors.gray,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <i className="fas fa-users"></i> Coletivas
          </button>
        </nav>

        <button onClick={onLogout} style={{
          padding: '12px 16px', background: colors.primaryLight, border: 'none', borderRadius: 12,
          color: colors.primary, fontWeight: 600, cursor: 'pointer', display: 'flex',
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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
              display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
              '@media (max-width: 768px)': { display: 'block' }
            }}>
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.dark, margin: 0 }}>🏛️ Painel da Direção</h1>
              <p style={{ fontSize: 13, color: colors.gray, margin: '4px 0 0' }}>Gestão de pedidos de saída</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.lightGray, padding: '8px 12px', borderRadius: 12 }}>
              <i className="fas fa-calendar" style={{ color: colors.gray, fontSize: 13 }}></i>
              <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} style={{
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

        {/* Stats Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, padding: '24px',
          '@media (max-width: 768px)': { gap: 12, padding: '16px', gridTemplateColumns: 'repeat(2, 1fr)' }
        }}>
          <div style={{
            background: colors.white, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${colors.warning}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${colors.warning}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-clock" style={{ fontSize: 20, color: colors.warning }}></i>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: colors.warning }}>{stats.meus_pedidos_pendentes || 0}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>Pendentes</div>
            <div style={{ fontSize: 12, color: colors.gray }}>Aguardando análise</div>
          </div>
          <div style={{
            background: colors.white, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${colors.success}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${colors.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-check-circle" style={{ fontSize: 20, color: colors.success }}></i>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: colors.success }}>{stats.pedidos_aprovados || 0}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>Aprovados</div>
            <div style={{ fontSize: 12, color: colors.gray }}>Autorizados</div>
          </div>
          <div style={{
            background: colors.white, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${colors.danger}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${colors.danger}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-times-circle" style={{ fontSize: 20, color: colors.danger }}></i>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: colors.danger }}>{stats.pedidos_rejeitados || 0}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>Rejeitados</div>
            <div style={{ fontSize: 12, color: colors.gray }}>Negados</div>
          </div>
          <div style={{
            background: colors.white, borderRadius: 20, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${colors.info}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${colors.info}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-chart-line" style={{ fontSize: 20, color: colors.info }}></i>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: colors.info }}>{stats.total_pedidos || 0}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>Total</div>
            <div style={{ fontSize: 12, color: colors.gray }}>Pedidos gerais</div>
          </div>
        </div>

        {/* Search e Ações */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 16px',
          gap: 16, flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.gray, fontSize: 14 }}></i>
            <input type="text" placeholder="Buscar estudante ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
              width: '100%', padding: '12px 16px 12px 42px', border: '1px solid #E2E8F0', borderRadius: 14,
              fontSize: 14, outline: 'none', background: colors.white
            }} />
          </div>
          <button onClick={() => setModalRelatorio(true)} style={{
            padding: '12px 24px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            color: colors.white, border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: 14,
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: `0 4px 12px ${colors.primary}40`
          }}>
            <i className="fas fa-chart-bar"></i> Gerar Relatório
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '0 24px', marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setAbaAtiva('pedidos')} style={{
            padding: '10px 20px', border: 'none', borderRadius: 12, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: abaAtiva === 'pedidos' ? colors.primary : colors.lightGray,
            color: abaAtiva === 'pedidos' ? colors.white : colors.gray
          }}>
            📋 Pedidos ({pedidosFiltrados.length})
          </button>
          <button onClick={() => setAbaAtiva('coletivas')} style={{
            padding: '10px 20px', border: 'none', borderRadius: 12, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: abaAtiva === 'coletivas' ? colors.primary : colors.lightGray,
            color: abaAtiva === 'coletivas' ? colors.white : colors.gray
          }}>
            👥 Coletivas ({coletivas.length})
          </button>
          <button onClick={() => setAbaAtiva('relatorios')} style={{
            padding: '10px 20px', border: 'none', borderRadius: 12, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: abaAtiva === 'relatorios' ? colors.primary : colors.lightGray,
            color: abaAtiva === 'relatorios' ? colors.white : colors.gray
          }}>
            📊 Relatórios ({relatorios.length})
          </button>
        </div>

        {/* Conteúdo - Aba Pedidos */}
        {abaAtiva === 'pedidos' && (
          <div style={{ padding: '0 24px 24px', minHeight: 400 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ width: 40, height: 40, border: `3px solid ${colors.lightGray}`, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p>Carregando pedidos...</p>
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>
                <i className="fas fa-inbox" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}></i>
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div style={{ background: colors.white, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: colors.lightGray, borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray }}>ID</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray }}>Estudante</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray }}>Curso/Classe</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray }}>Tipo</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray }}>Data Saída</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray }}>Status</th>
                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: colors.gray }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map(pedido => (
                        <tr key={pedido.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: colors.primary }}>#{pedido.id}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{pedido.estudante_nome}</div>
                            <div style={{ fontSize: 11, color: colors.gray }}>{pedido.estudante_email}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {pedido.estudante_curso || '-'}<br />
                            <small style={{ color: colors.gray }}>{pedido.estudante_classe || '-'}</small>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '4px 12px', background: colors.primaryLight,
                              color: colors.primary, borderRadius: 20, fontSize: 11, fontWeight: 600
                            }}>{pedido.tipo_display}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {pedido.data_saida}<br />
                            <small style={{ color: colors.gray }}>{pedido.hora_saida}</small>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: getStatusStyle(pedido.estado).background,
                              color: getStatusStyle(pedido.estado).color
                            }}>{pedido.estado_display}</span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button onClick={() => navigate(`/pedido/${pedido.id}`)} style={{
                                width: 34, height: 34, borderRadius: 8, border: '1px solid #E2E8F0',
                                background: colors.white, cursor: 'pointer', transition: 'all 0.2s'
                              }} title="Ver detalhes"><i className="fas fa-eye"></i></button>
                              {pedido.acoes_disponiveis?.includes('aprovar') && (
                                <button onClick={() => handleAcao(pedido.id, 'aprovar')} style={{
                                  width: 34, height: 34, borderRadius: 8, border: 'none',
                                  background: colors.success, color: colors.white, cursor: 'pointer'
                                }} title="Aprovar"><i className="fas fa-check"></i></button>
                              )}
                              {pedido.acoes_disponiveis?.includes('rejeitar') && (
                                <button onClick={() => handleAcao(pedido.id, 'rejeitar')} style={{
                                  width: 34, height: 34, borderRadius: 8, border: 'none',
                                  background: colors.danger, color: colors.white, cursor: 'pointer'
                                }} title="Rejeitar"><i className="fas fa-times"></i></button>
                              )}
                              {pedido.estado === 'PENDENTE_DIRECAO' && (
                                <button onClick={() => handleEncaminhar(pedido.id)} style={{
                                  width: 34, height: 34, borderRadius: 8, border: 'none',
                                  background: colors.warning, color: colors.white, cursor: 'pointer'
                                }} title="Encaminhar"><i className="fas fa-share"></i></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo - Aba Coletivas */}
        {abaAtiva === 'coletivas' && (
          <div style={{ padding: '0 24px 24px' }}>
            {coletivas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: colors.gray, background: colors.white, borderRadius: 20 }}>
                <i className="fas fa-users" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}></i>
                <p>Nenhuma saída coletiva criada</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {coletivas.map(c => (
                  <div key={c.id} className="card-animate" style={{
                    background: colors.white, borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: `1px solid ${c.encerrada ? '#E2E8F0' : colors.primaryLight}`,
                    borderTop: `3px solid ${c.encerrada ? colors.gray : colors.primary}`
                  }}>
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{c.titulo}</div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: c.encerrada ? colors.lightGray : `${colors.success}15`,
                        color: c.encerrada ? colors.gray : colors.success
                      }}>{c.encerrada ? 'Encerrada' : 'Ativa'}</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: colors.gray, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span><i className="fas fa-calendar"></i> {c.data_saida?.split('T')[0]}</span>
                        <span><i className="fas fa-undo-alt"></i> {c.data_volta?.split('T')[0]}</span>
                        <span><i className="fas fa-user"></i> {c.criador_nome || c.criador}</span>
                      </div>
                      <div style={{ height: 8, background: colors.lightGray, borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
                        <div style={{
                          width: `${((c.total_aceitos || 0) / (c.total_convidados || 1)) * 100}%`,
                          height: '100%', background: colors.success, borderRadius: 4
                        }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                        <span><strong>{c.total_convidados || 0}</strong> Convidados</span>
                        <span><strong style={{ color: colors.success }}>{c.total_aceitos || 0}</strong> Aceitaram</span>
                        <span><strong style={{ color: colors.danger }}>{c.total_recusados || 0}</strong> Recusaram</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo - Aba Relatórios */}
        {abaAtiva === 'relatorios' && (
          <div style={{ padding: '0 24px 24px' }}>
            {relatorios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: colors.gray, background: colors.white, borderRadius: 20 }}>
                <i className="fas fa-chart-line" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}></i>
                <p>Nenhum relatório gerado</p>
                <button onClick={() => setModalRelatorio(true)} style={{
                  marginTop: 16, padding: '10px 24px', background: colors.primary, color: colors.white,
                  border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600
                }}>Gerar primeiro relatório</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {relatorios.map(r => (
                  <div key={r.id} style={{
                    background: colors.white, borderRadius: 20, overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)', cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }} onClick={() => baixarRelatorio(r.id)}>
                    <div style={{ padding: '16px 20px', borderBottom: `3px solid ${colors.primary}` }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.dark }}>{r.titulo}</div>
                      <div style={{ fontSize: 12, color: colors.gray, marginTop: 4 }}>{r.created_at}</div>
                    </div>
                    <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, color: colors.gray }}>Por: {r.criado_por}</div>
                      <button style={{
                        padding: '8px 16px', background: colors.primaryLight, border: 'none',
                        borderRadius: 8, color: colors.primary, cursor: 'pointer', fontSize: 12, fontWeight: 600
                      }}>📥 Baixar CSV</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Gerar Relatório */}
      {modalRelatorio && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setModalRelatorio(false)}>
          <div style={{ background: colors.white, borderRadius: 24, width: '90%', maxWidth: 500, overflow: 'auto', animation: 'fadeInUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>📊 Gerar Relatório</h3>
              <button onClick={() => setModalRelatorio(false)} style={{ width: 32, height: 32, border: '1px solid #E2E8F0', background: colors.white, borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.gray, marginBottom: 8 }}>Data Início</label>
                <input type="date" value={dadosRelatorio.data_inicio} onChange={(e) => setDadosRelatorio({...dadosRelatorio, data_inicio: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.gray, marginBottom: 8 }}>Data Fim</label>
                <input type="date" value={dadosRelatorio.data_fim} onChange={(e) => setDadosRelatorio({...dadosRelatorio, data_fim: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setModalRelatorio(false)} style={{ flex: 1, padding: 12, background: colors.lightGray, border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button onClick={gerarRelatorio} disabled={gerandoRelatorio} style={{ flex: 1, padding: 12, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, color: colors.white, border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}>{gerandoRelatorio ? 'Gerando...' : 'Gerar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificações Panel */}
      {showNotificacoes && (
        <>
          <div onClick={() => setShowNotificacoes(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, width: 360, height: '100vh', background: colors.white, boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'auto' }}>
            <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>🔔 Notificações</h3>
              <button onClick={() => setShowNotificacoes(false)} style={{ width: 32, height: 32, background: colors.lightGray, border: 'none', borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100vh - 70px)' }}>
              {notificacoes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>Nenhuma notificação</div>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{ padding: 16, borderBottom: '1px solid #F1F5F9', cursor: 'pointer', background: n.lida ? colors.white : colors.primaryLight }}>
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

export default DashboardDirecao;

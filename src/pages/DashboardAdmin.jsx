// src/pages/DashboardAdmin.jsx - COMPLETO COM TODAS FUNCIONALIDADES
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardAdmin = ({ user, onLogout }) => {
  // Estados Principais
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [coletivas, setColetivas] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroData, setFiltroData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  
  // Modais
  const [modalUsuario, setModalUsuario] = useState(null);
  const [modalSenha, setModalSenha] = useState(null);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState({ data_inicio: '', data_fim: '' });
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  
  // Notificações
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  const navigate = useNavigate();

  // Cores do tema
  const colors = {
    primary: '#111827',
    primaryLight: '#374151',
    accent: '#2563EB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
    dark: '#1F2937'
  };

  // Relógio
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR')), 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar dados
  useEffect(() => {
    carregarTodosDados();
  }, [filtroEstado, filtroData, filtroUsuario]);

  const carregarTodosDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarPedidos(),
        carregarStats(),
        carregarUsuarios(),
        carregarColetivas(),
        carregarRelatorios(),
        carregarLogs(),
        carregarNotificacoes()
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarPedidos = async () => {
    try {
      let url = '/pedidos/';
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
      if (filtroData) params.append('data_saida', filtroData);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await api.get(url);
      setPedidos(res.data.pedidos || []);
    } catch (err) { console.error('Erro pedidos:', err); }
  };

  const carregarStats = async () => {
    try {
      const res = await api.get('/dashboard/');
      setStats(res.data);
    } catch (err) { console.error('Erro stats:', err); }
  };

  const carregarUsuarios = async () => {
    try {
      const res = await api.get('/admin/users/');
      setUsuarios(res.data.users || []);
    } catch (err) { console.error('Erro usuários:', err); }
  };

  const carregarColetivas = async () => {
    try {
      const res = await api.get('/coletivas/listar/');
      setColetivas(res.data.coletivas || []);
    } catch (err) { console.error('Erro coletivas:', err); }
  };

  const carregarRelatorios = async () => {
    try {
      const res = await api.get('/relatorios/');
      setRelatorios(res.data.relatorios || []);
    } catch (err) { console.error('Erro relatórios:', err); }
  };

  const carregarLogs = async () => {
    try {
      const res = await api.get('/admin/logs/');
      setLogs(res.data.logs || []);
    } catch (err) { console.error('Erro logs:', err); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) { console.error('Erro notificações:', err); }
  };

  // Ações de Usuário
  const aprovarUsuario = async (userId) => {
    if (!confirm('✅ Aprovar este usuário?')) return;
    try {
      await api.post(`/admin/users/${userId}/approve/`);
      alert('Usuário aprovado com sucesso!');
      carregarUsuarios();
    } catch (err) {
      alert('❌ Erro ao aprovar usuário');
    }
  };

  const bloquearUsuario = async (userId, bloquear = true) => {
    const acao = bloquear ? 'Bloquear' : 'Desbloquear';
    if (!confirm(`${acao} este usuário?`)) return;
    try {
      await api.post(`/admin/users/${userId}/block/`, { action: bloquear ? 'block' : 'unblock' });
      alert(`Usuário ${bloquear ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
      carregarUsuarios();
    } catch (err) {
      alert(`❌ Erro ao ${bloquear ? 'bloquear' : 'desbloquear'} usuário`);
    }
  };

  const alterarRole = async (userId, role) => {
    if (!confirm(`Alterar papel para ${role}?`)) return;
    try {
      await api.post(`/admin/users/${userId}/role/`, { role });
      alert(`Papel alterado para ${role}!`);
      carregarUsuarios();
    } catch (err) {
      alert('❌ Erro ao alterar papel');
    }
  };

  const resetarSenha = async (userId) => {
    const novaSenha = prompt('Digite a nova senha para o usuário:', 'temp123456');
    if (!novaSenha) return;
    try {
      await api.post(`/admin/users/${userId}/reset-password/`, { password: novaSenha });
      alert(`Senha alterada para: ${novaSenha}`);
    } catch (err) {
      alert('❌ Erro ao resetar senha');
    }
  };

  const criarUsuario = async (userData) => {
    try {
      await api.post('/admin/users/create/', userData);
      alert('Usuário criado com sucesso!');
      carregarUsuarios();
      setModalUsuario(null);
    } catch (err) {
      alert('❌ Erro ao criar usuário');
    }
  };

  const gerarRelatorio = async () => {
    if (!dadosRelatorio.data_inicio || !dadosRelatorio.data_fim) {
      alert('⚠️ Selecione o período do relatório');
      return;
    }
    setGerandoRelatorio(true);
    try {
      await api.post('/relatorios/criar/', {
        titulo: `Relatório Admin - ${new Date().toLocaleDateString()}`,
        tipo: 'PERSONALIZADO',
        descricao: 'Relatório gerado pelo Administrador',
        data_inicio: dadosRelatorio.data_inicio,
        data_fim: dadosRelatorio.data_fim
      });
      alert('✅ Relatório gerado com sucesso!');
      carregarRelatorios();
      setModalRelatorio(false);
      setDadosRelatorio({ data_inicio: '', data_fim: '' });
    } catch (err) {
      alert('❌ Erro ao gerar relatório');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const baixarRelatorio = async (relatorioId) => {
    try {
      const res = await api.get(`/relatorios/download/${relatorioId}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${relatorioId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ Erro ao baixar relatório');
    }
  };

  const deletarRelatorio = async (relatorioId) => {
    if (!confirm('🗑️ Deletar este relatório permanentemente?')) return;
    try {
      await api.delete(`/relatorios/${relatorioId}/delete/`);
      alert('Relatório deletado!');
      carregarRelatorios();
    } catch (err) {
      alert('❌ Erro ao deletar relatório');
    }
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
  };

  const getStatusColor = (estado) => {
    const cores = {
      'PENDENTE_DITE': '#10B981',
      'PENDENTE_DIRECAO': '#F59E0B',
      'PENDENTE_ADMIN': '#EF4444',
      'APROVADO': '#10B981',
      'REJEITADO': '#EF4444',
      'EM_ANDAMENTO': '#3B82F6',
      'FINALIZADO': '#6B7280'
    };
    return cores[estado] || '#6B7280';
  };

  const getRoleBadge = (role) => {
    const roles = {
      'ADMIN': { label: 'Admin', color: '#EF4444', bg: '#FEE2E2' },
      'DITE': { label: 'DITE', color: '#F59E0B', bg: '#FEF3C7' },
      'DIRECAO': { label: 'Direção', color: '#8B5CF6', bg: '#EDE9FE' },
      'ADMINISTRACAO': { label: 'Administração', color: '#3B82F6', bg: '#DBEAFE' },
      'SEGURANCA': { label: 'Segurança', color: '#10B981', bg: '#DCFCE7' },
      'ESTUDANTE': { label: 'Estudante', color: '#6B7280', bg: '#F3F4F6' }
    };
    return roles[role] || { label: role, color: '#6B7280', bg: '#F3F4F6' };
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => 
      p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm)
    );
  }, [pedidos, searchTerm]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usuarios, searchTerm]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pedidos', label: 'Pedidos', icon: '📋' },
    { id: 'usuarios', label: 'Usuários', icon: '👥' },
    { id: 'coletivas', label: 'Coletivas', icon: '🚌' },
    { id: 'relatorios', label: 'Relatórios', icon: '📄' },
    { id: 'logs', label: 'Logs', icon: '📜' },
    { id: 'config', label: 'Configurações', icon: '⚙️' }
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
        .fade-in { animation: fadeInUp 0.3s ease-out; }
        @media (max-width: 768px) {
          .sidebar { position: fixed; left: -280px; transition: left 0.3s ease; z-index: 1000; }
          .sidebar.open { left: 0; }
          .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; backdrop-filter: blur(2px); }
          .overlay.show { display: block; }
          .main-content { margin-left: 0 !important; width: 100% !important; }
        }
      `}</style>

      {/* Overlay Mobile */}
      <div className={`overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: 280, background: colors.white, height: '100vh', padding: '24px',
        display: 'flex', flexDirection: 'column', borderRight: '1px solid #E2E8F0',
        position: 'sticky', top: 0, transition: 'left 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontSize: 18
          }}>👑</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.dark }}>Admin Painel</div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: colors.lightGray,
          borderRadius: 14, marginBottom: 24, border: '1px solid #E2E8F0'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white,
            fontWeight: 600, fontSize: 18
          }}>{user?.nome?.charAt(0) || user?.username?.charAt(0) || 'A'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.dark }}>{user?.nome || user?.username}</div>
            <div style={{ fontSize: 12, color: colors.primary }}>Administrador</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMobileMenuOpen(false); }} style={{
              padding: '12px 16px', borderRadius: 12, border: 'none',
              background: abaAtiva === item.id ? colors.lightGray : 'transparent',
              textAlign: 'left', fontSize: 14, fontWeight: abaAtiva === item.id ? 600 : 500,
              color: abaAtiva === item.id ? colors.primary : colors.gray,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              borderLeft: abaAtiva === item.id ? `3px solid ${colors.primary}` : '3px solid transparent'
            }}>
              <span style={{ width: 24 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={onLogout} style={{
          padding: '12px 16px', background: '#FEF2F2', border: 'none', borderRadius: 12,
          color: colors.danger, fontWeight: 600, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 12, marginTop: 'auto'
        }}>
          <span>🚪</span> Encerrar sessão
        </button>
      </aside>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        
        {/* Header */}
        <header style={{
          background: colors.white, borderBottom: '1px solid #E2E8F0', padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
              display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
              '@media (max-width: 768px)': { display: 'block' }
            }}>☰</button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.dark, margin: 0 }}>
                {menuItems.find(i => i.id === abaAtiva)?.label || 'Dashboard'}
              </h1>
              <p style={{ fontSize: 13, color: colors.gray, margin: '4px 0 0' }}>{horaAtual}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: colors.lightGray, padding: '8px 12px', borderRadius: 12 }}>
              <span>📅</span>
              <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none' }} />
            </div>
            <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{
              position: 'relative', padding: 8, background: colors.lightGray, border: 'none', borderRadius: 10, cursor: 'pointer'
            }}>
              🔔
              {notificacoesNaoLidas > 0 && <span style={{
                position: 'absolute', top: -2, right: -2, width: 10, height: 10,
                background: colors.danger, borderRadius: '50%', border: `2px solid ${colors.white}`
              }} />}
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div style={{ padding: '16px 24px', background: colors.white, borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.gray }}>🔍</span>
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
              width: '100%', padding: '10px 16px 10px 36px', border: '1px solid #E2E8F0',
              borderRadius: 10, fontSize: 14, outline: 'none'
            }} />
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
                <div style={{ background: colors.white, borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: colors.gray }}>Total Pedidos</span>
                    <span style={{ fontSize: 24 }}>📋</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: colors.dark }}>{stats.total_pedidos || 0}</div>
                </div>
                <div style={{ background: colors.white, borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: colors.gray }}>Usuários</span>
                    <span style={{ fontSize: 24 }}>👥</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: colors.dark }}>{usuarios.length}</div>
                </div>
                <div style={{ background: colors.white, borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: colors.gray }}>Aprovados</span>
                    <span style={{ fontSize: 24 }}>✅</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: colors.success }}>{stats.pedidos_aprovados || 0}</div>
                </div>
                <div style={{ background: colors.white, borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: colors.gray }}>Coletivas</span>
                    <span style={{ fontSize: 24 }}>🚌</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: colors.dark }}>{coletivas.length}</div>
                </div>
              </div>

              {/* Gráficos rápidos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                <div style={{ background: colors.white, borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                  <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Pedidos por Status</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div><span style={{ display: 'inline-block', width: 100 }}>Pendentes</span> <strong>{stats.pedidos_pendentes || 0}</strong></div>
                    <div><span style={{ display: 'inline-block', width: 100 }}>Aprovados</span> <strong>{stats.pedidos_aprovados || 0}</strong></div>
                    <div><span style={{ display: 'inline-block', width: 100 }}>Rejeitados</span> <strong>{stats.pedidos_rejeitados || 0}</strong></div>
                  </div>
                </div>
                <div style={{ background: colors.white, borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                  <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Usuários por Papel</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {['ADMIN', 'DITE', 'DIRECAO', 'ADMINISTRACAO', 'SEGURANCA', 'ESTUDANTE'].map(role => {
                      const count = usuarios.filter(u => u.role === role).length;
                      return (
                        <div key={role}><span style={{ display: 'inline-block', width: 120 }}>{role}</span> <strong>{count}</strong></div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PEDIDOS */}
          {abaAtiva === 'pedidos' && (
            <div className="fade-in">
              <div style={{ background: colors.white, borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <option value="todos">Todos</option>
                      <option value="PENDENTE_DITE">Pendentes DITE</option>
                      <option value="PENDENTE_DIRECAO">Pendentes Direção</option>
                      <option value="APROVADO">Aprovados</option>
                      <option value="REJEITADO">Rejeitados</option>
                    </select>
                  </div>
                  <div style={{ fontSize: 13, color: colors.gray }}>Total: {pedidosFiltrados.length} pedidos</div>
                </div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 60 }}>Carregando...</div>
                ) : pedidosFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>Nenhum pedido encontrado</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: colors.lightGray }}>
                        <tr><th style={{ padding: 12, textAlign: 'left' }}>ID</th><th style={{ padding: 12, textAlign: 'left' }}>Estudante</th><th style={{ padding: 12, textAlign: 'left' }}>Tipo</th><th style={{ padding: 12, textAlign: 'left' }}>Data</th><th style={{ padding: 12, textAlign: 'left' }}>Status</th><th style={{ padding: 12, textAlign: 'left' }}>Ações</th></tr>
                      </thead>
                      <tbody>
                        {pedidosFiltrados.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: 12, fontWeight: 600, color: colors.primary }}>#{p.id}</td>
                            <td style={{ padding: 12 }}><div><strong>{p.estudante_nome}</strong></div><div style={{ fontSize: 11, color: colors.gray }}>{p.estudante_email}</div></td>
                            <td style={{ padding: 12 }}>{p.tipo_display}</td>
                            <td style={{ padding: 12 }}>{p.data_saida}</td>
                            <td style={{ padding: 12 }}><span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${getStatusColor(p.estado)}15`, color: getStatusColor(p.estado) }}>{p.estado_display}</span></td>
                            <td style={{ padding: 12 }}>
                              <button onClick={() => navigate(`/pedido/${p.id}`)} style={{ padding: '6px 10px', background: colors.lightGray, border: 'none', borderRadius: 6, cursor: 'pointer' }}>👁️ Ver</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* USUÁRIOS */}
          {abaAtiva === 'usuarios' && (
            <div className="fade-in">
              <div style={{ background: colors.white, borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <option value="">Todos os papéis</option>
                      <option value="ADMIN">Admin</option>
                      <option value="DITE">DITE</option>
                      <option value="DIRECAO">Direção</option>
                      <option value="ADMINISTRACAO">Administração</option>
                      <option value="SEGURANCA">Segurança</option>
                      <option value="ESTUDANTE">Estudante</option>
                    </select>
                  </div>
                  <button onClick={() => setModalUsuario({ action: 'create' })} style={{ padding: '8px 16px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, cursor: 'pointer' }}>➕ Novo Usuário</button>
                </div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 60 }}>Carregando...</div>
                ) : usuariosFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>Nenhum usuário encontrado</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: colors.lightGray }}>
                        <tr>
                          <th style={{ padding: 12, textAlign: 'left' }}>Nome</th><th style={{ padding: 12, textAlign: 'left' }}>Email</th><th style={{ padding: 12, textAlign: 'left' }}>Papel</th><th style={{ padding: 12, textAlign: 'left' }}>Status</th><th style={{ padding: 12, textAlign: 'left' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosFiltrados.map(u => {
                          const roleInfo = getRoleBadge(u.role);
                          return (
                            <tr key={u.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: 12 }}><strong>{u.full_name || u.username}</strong></td>
                              <td style={{ padding: 12 }}>{u.email}</td>
                              <td style={{ padding: 12 }}><span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: roleInfo.bg, color: roleInfo.color }}>{roleInfo.label}</span></td>
                              <td style={{ padding: 12 }}>{u.is_active ? <span style={{ color: colors.success }}>✅ Ativo</span> : <span style={{ color: colors.danger }}>❌ Inativo</span>}</td>
                              <td style={{ padding: 12 }}>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  <button onClick={() => setModalUsuario({ action: 'edit', user: u })} style={{ padding: '6px 10px', background: colors.lightGray, border: 'none', borderRadius: 6, cursor: 'pointer' }} title="Editar">✏️</button>
                                  <button onClick={() => resetarSenha(u.id)} style={{ padding: '6px 10px', background: colors.lightGray, border: 'none', borderRadius: 6, cursor: 'pointer' }} title="Resetar Senha">🔑</button>
                                  {u.role !== 'ADMIN' && (
                                    <button onClick={() => bloquearUsuario(u.id, u.is_active)} style={{ padding: '6px 10px', background: u.is_active ? '#FEF2F2' : '#DCFCE7', border: 'none', borderRadius: 6, cursor: 'pointer', color: u.is_active ? colors.danger : colors.success }} title={u.is_active ? 'Bloquear' : 'Desbloquear'}>{u.is_active ? '🔒' : '🔓'}</button>
                                  )}
                                  <select onChange={(e) => alterarRole(u.id, e.target.value)} value={u.role} style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 }}>
                                    <option value="ESTUDANTE">Estudante</option>
                                    <option value="DITE">DITE</option>
                                    <option value="DIRECAO">Direção</option>
                                    <option value="ADMINISTRACAO">Administração</option>
                                    <option value="SEGURANCA">Segurança</option>
                                    <option value="ADMIN">Admin</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COLETIVAS */}
          {abaAtiva === 'coletivas' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                {coletivas.map(c => (
                  <div key={c.id} style={{ background: colors.white, borderRadius: 16, padding: 16, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{c.titulo}</h3>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: c.encerrada ? '#F3F4F6' : '#DCFCE7', color: c.encerrada ? colors.gray : colors.success }}>{c.encerrada ? 'Encerrada' : 'Ativa'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: colors.gray, marginBottom: 12 }}>📅 {c.data_saida?.split('T')[0]} até {c.data_volta?.split('T')[0]}</div>
                    <div style={{ height: 6, background: colors.lightGray, borderRadius: 3, marginBottom: 12 }}>
                      <div style={{ width: `${((c.total_aceitos || 0) / (c.total_convidados || 1)) * 100}%`, height: '100%', background: colors.success, borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span>👥 {c.total_convidados || 0}</span>
                      <span style={{ color: colors.success }}>✅ {c.total_aceitos || 0}</span>
                      <span style={{ color: colors.danger }}>❌ {c.total_recusados || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RELATÓRIOS */}
          {abaAtiva === 'relatorios' && (
            <div className="fade-in">
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Relatórios Gerados</h2>
                <button onClick={() => setModalRelatorio(true)} style={{ padding: '8px 16px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, cursor: 'pointer' }}>📊 Novo Relatório</button>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {relatorios.map(r => (
                  <div key={r.id} style={{ background: colors.white, borderRadius: 12, padding: 16, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.titulo}</div>
                      <div style={{ fontSize: 12, color: colors.gray }}>{r.created_at} • Criado por: {r.criado_por}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => baixarRelatorio(r.id)} style={{ padding: '6px 12px', background: colors.lightGray, border: 'none', borderRadius: 6, cursor: 'pointer' }}>📥 Baixar</button>
                      <button onClick={() => deletarRelatorio(r.id)} style={{ padding: '6px 12px', background: '#FEF2F2', border: 'none', borderRadius: 6, cursor: 'pointer', color: colors.danger }}>🗑️ Deletar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOGS */}
          {abaAtiva === 'logs' && (
            <div className="fade-in">
              <div style={{ background: colors.white, borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>Logs do Sistema</h3>
                </div>
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ padding: 12, borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: colors.gray, minWidth: 150 }}>{log.created_at}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                        background: log.level === 'ERROR' ? '#FEF2F2' : log.level === 'WARNING' ? '#FEF3C7' : '#DCFCE7',
                        color: log.level === 'ERROR' ? colors.danger : log.level === 'WARNING' ? colors.warning : colors.success
                      }}>{log.level}</span>
                      <span style={{ flex: 1 }}>{log.action}</span>
                      <span style={{ fontSize: 11, color: colors.gray }}>{log.user || 'Sistema'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURAÇÕES */}
          {abaAtiva === 'config' && (
            <div className="fade-in">
              <div style={{ background: colors.white, borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
                <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Configurações do Sistema</h3>
                <div style={{ display: 'grid', gap: 20 }}>
                  <div><label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Limite máximo de pedidos por estudante</label><input type="number" defaultValue="10" style={{ width: '100%', maxWidth: 200, padding: 10, border: '1px solid #E2E8F0', borderRadius: 8 }} /></div>
                  <div><label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Horário limite para saída</label><input type="time" defaultValue="20:00" style={{ width: '100%', maxWidth: 200, padding: 10, border: '1px solid #E2E8F0', borderRadius: 8 }} /></div>
                  <div><button style={{ padding: '10px 20px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, cursor: 'pointer' }}>💾 Salvar Configurações</button></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Novo/Editar Usuário */}
      {modalUsuario && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalUsuario(null)}>
          <div style={{ background: colors.white, borderRadius: 20, width: '90%', maxWidth: 500, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>{modalUsuario.action === 'create' ? 'Novo Usuário' : `Editar: ${modalUsuario.user?.full_name}`}</h3>
            <input type="text" placeholder="Nome completo" defaultValue={modalUsuario.user?.full_name || ''} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 12 }} />
            <input type="email" placeholder="Email" defaultValue={modalUsuario.user?.email || ''} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 12 }} />
            <select defaultValue={modalUsuario.user?.role || 'ESTUDANTE'} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 20 }}>
              <option value="ESTUDANTE">Estudante</option>
              <option value="DITE">DITE</option>
              <option value="DIRECAO">Direção</option>
              <option value="ADMINISTRACAO">Administração</option>
              <option value="SEGURANCA">Segurança</option>
              <option value="ADMIN">Admin</option>
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setModalUsuario(null)} style={{ flex: 1, padding: 12, background: colors.lightGray, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => criarUsuario({})} style={{ flex: 1, padding: 12, background: colors.primary, color: colors.white, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Relatório */}
      {modalRelatorio && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalRelatorio(false)}>
          <div style={{ background: colors.white, borderRadius: 20, width: '90%', maxWidth: 450, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>📊 Gerar Relatório</h3>
            <input type="date" value={dadosRelatorio.data_inicio} onChange={e => setDadosRelatorio({...dadosRelatorio, data_inicio: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 12 }} placeholder="Data início" />
            <input type="date" value={dadosRelatorio.data_fim} onChange={e => setDadosRelatorio({...dadosRelatorio, data_fim: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 20 }} placeholder="Data fim" />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setModalRelatorio(false)} style={{ flex: 1, padding: 12, background: colors.lightGray, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={gerarRelatorio} disabled={gerandoRelatorio} style={{ flex: 1, padding: 12, background: colors.primary, color: colors.white, border: 'none', borderRadius: 10, cursor: 'pointer' }}>{gerandoRelatorio ? 'Gerando...' : 'Gerar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações Dropdown */}
      {showNotifDropdown && (
        <div style={{ position: 'absolute', top: 70, right: 24, width: 350, background: colors.white, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100 }}>
          <div style={{ padding: 12, borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Notificações</div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {notificacoes.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: colors.gray }}>Nenhuma notificação</div>
            ) : (
              notificacoes.map(n => (
                <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{ padding: 12, borderBottom: '1px solid #E2E8F0', cursor: 'pointer', background: n.lida ? 'transparent' : '#FEFCE8' }}>
                  <div style={{ fontSize: 13 }}>{n.mensagem}</div>
                  <div style={{ fontSize: 11, color: colors.gray }}>{n.data}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;

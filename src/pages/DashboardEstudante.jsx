import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardEstudante = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [coletivas, setColetivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  // Theme State
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('student-dashboard-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const isDark = themeMode === 'dark';

  const navigate = useNavigate();

  // Design Tokens
  const T = {
    blue: '#2563EB',
    blueLight: '#DBEAFE',
    blueDark: '#1E40AF',
    bg: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    shadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
  };

  // Relógio
  useEffect(() => {
    const atualizarHora = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    atualizarHora();
    const timer = setInterval(atualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarColetivas();
    carregarNotificacoes();
  }, []);

  useEffect(() => {
    localStorage.setItem('student-dashboard-theme', themeMode);
  }, [themeMode]);

  const carregarDados = async () => {
    try {
      const res = await api.get('/pedidos/');
      setPedidos(res.data.pedidos || []);
    } catch (err) { console.error('Erro:', err); }
  };

  const carregarColetivas = async () => {
    try {
      const res = await api.get('/coletivas/minhas/');
      setColetivas(res.data.coletivas || []);
    } catch (err) { console.error('Erro coletivas:', err); } 
    finally { setLoading(false); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  };

  const aceitarColetiva = async (conviteId) => {
    if (!confirm('Aceitar esta saída coletiva?')) return;
    try {
      await api.post(`/coletivas/${conviteId}/aceitar/`);
      alert('Pedido aceito com sucesso!');
      carregarColetivas();
      carregarDados();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro ao aceitar')); }
  };

  const getStatusInfo = (estado) => {
    const mapa = {
      'PENDENTE_DITE': { texto: 'Pendente DITE', cor: '#D97706', bg: isDark ? '#78350f20' : '#FEF9C3' },
      'PENDENTE_DIRECAO': { texto: 'Em análise', cor: '#7C3AED', bg: isDark ? '#5b21b620' : '#EDE9FE' },
      'PENDENTE_ADMIN': { texto: 'Aguardando Admin', cor: '#2563EB', bg: isDark ? '#1e40af20' : '#DBEAFE' },
      'APROVADO': { texto: 'Aprovado', cor: '#059669', bg: isDark ? '#065f4620' : '#DCFCE7' },
      'REJEITADO': { texto: 'Rejeitado', cor: '#DC2626', bg: isDark ? '#991b1b20' : '#FEE2E2' },
      'EM_ANDAMENTO': { texto: 'Em saída', cor: '#0284C7', bg: isDark ? '#07598520' : '#E0F2FE' },
      'FINALIZADO': { texto: 'Finalizado', cor: isDark ? '#94A3B8' : '#64748B', bg: isDark ? '#334155' : '#F1F5F9' },
    };
    return mapa[estado] || { texto: estado, cor: T.textMuted, bg: T.border };
  };

  const pedidosFiltrados = filtroStatus === 'todos' 
    ? pedidos 
    : pedidos.filter(p => p.estado === filtroStatus);

  const pendentesCount = pedidos.filter(p => ['PENDENTE_DITE', 'PENDENTE_DIRECAO', 'PENDENTE_ADMIN'].includes(p.estado)).length;
  const aprovadosCount = pedidos.filter(p => p.estado === 'APROVADO').length;
  const concluidosCount = pedidos.filter(p => p.estado === 'FINALIZADO').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', sans-serif", transition: 'background 0.3s ease, color 0.3s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { background: ${T.bg}; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; left: -280px !important; z-index: 1000 !important; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; height: 100vh !important; }
          .sidebar.open { left: 0 !important; box-shadow: 10px 0 30px rgba(0,0,0,0.2); }
          .main-content { margin-left: 0 !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .header-title h1 { font-size: 18px !important; }
        }
      `}</style>

      {/* Overlay Mobile */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)' }} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 260, background: T.surface, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease'
      }}>
        <div style={{ padding: 24, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: T.blue, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#FFF', fontSize: 18 }}>
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Portal</div>
              <div style={{ fontSize: 11, color: T.blue, fontWeight: 600 }}>ESTUDANTE</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: isDark ? '#334155' : '#F1F5F9', borderRadius: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 700 }}>
              {user?.nome?.[0] || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T.text }}>{user?.nome || 'Usuário'}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Aluno Regular</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'Início', icon: 'fa-home', active: true },
            { label: 'Novo Pedido', icon: 'fa-plus-circle', action: () => navigate('/criar-pedido'), highlight: true },
            { label: 'Coletivas', icon: 'fa-users', action: () => navigate('/coletivas'), badge: coletivas.length },
            { label: 'Notificações', icon: 'fa-bell', action: () => navigate('/notificacoes'), badge: notificacoesNaoLidas },
          ].map((item, idx) => (
            <button key={idx} onClick={item.action || (() => {})} style={{
              width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: item.highlight ? `${T.blue}15` : (item.active ? `${T.blue}10` : 'transparent'),
              color: item.highlight ? T.blue : (item.active ? T.blue : T.textMuted),
              fontWeight: item.highlight ? 700 : 600, fontSize: 13, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s'
            }}>
              <i className={`fas ${item.icon}`} style={{ width: 20, textAlign: 'center' }}></i>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background: T.blue, color: '#FFF', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: 12 }}>
           <button onClick={() => setThemeMode(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: 10, background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 8, color: T.textMuted, cursor: 'pointer', fontSize: 12, marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: 10, background: isDark ? '#450a0a' : '#FEF2F2', border: 'none',
            borderRadius: 8, color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <i className="fas fa-sign-out-alt"></i> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          background: T.glass || T.surface, borderBottom: `1px solid ${T.border}`, padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.text
            }} className="mobile-toggle">
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Olá, {user?.nome?.split(' ')[0]}</h1>
              <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{horaAtual}</p>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          
          {/* Welcome Banner */}
          <div className="fade-in" style={{
            background: `linear-gradient(135deg, ${T.blue}, ${T.blueDark})`, borderRadius: 16, padding: 24,
            color: '#FFF', marginBottom: 24, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Portal do Estudante</h2>
              <p style={{ fontSize: 13, opacity: 0.9, maxWidth: 400 }}>Gerencie suas solicitações de saída e acompanhe o status em tempo real.</p>
            </div>
            <i className="fas fa-paper-plane" style={{ position: 'absolute', right: 20, bottom: -10, fontSize: 80, opacity: 0.1, transform: 'rotate(-15deg)' }}></i>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Pendentes', val: pendentesCount, icon: 'fa-clock', color: '#D97706' },
              { label: 'Aprovados', val: aprovadosCount, icon: 'fa-check-circle', color: '#059669' },
              { label: 'Concluídos', val: concluidosCount, icon: 'fa-flag-checkered', color: T.blue },
            ].map((stat, i) => (
              <div key={i} style={{
                background: T.surface, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: 12, boxShadow: T.shadow
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: `${stat.color}15`, color: stat.color,
                  display: 'grid', placeItems: 'center', fontSize: 18
                }}><i className={`fas ${stat.icon}`}></i></div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{stat.val}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Coletivas */}
          {coletivas.length > 0 && (
            <div className="fade-in" style={{
              background: isDark ? '#422006' : '#FFFBEB', border: `1px solid ${isDark ? '#78350f' : '#FDE68A'}`,
              borderRadius: 16, padding: 20, marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <i className="fas fa-bus" style={{ color: '#D97706' }}></i>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#FDE68A' : '#92400E' }}>Saídas Coletivas Disponíveis</h3>
                <span style={{ marginLeft: 'auto', background: '#D97706', color: '#FFF', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{coletivas.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {coletivas.map(c => (
                  <div key={c.id} style={{
                    background: T.surface, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', border: `1px solid ${T.border}`, flexWrap: 'wrap', gap: 12
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>{c.titulo}</div>
                      <div style={{ fontSize: 12, color: T.textMuted }}><i className="fas fa-calendar"></i> {c.data_saida}</div>
                    </div>
                    <button onClick={() => aceitarColetiva(c.id)} style={{
                      padding: '8px 16px', background: '#059669', color: '#FFF', border: 'none',
                      borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12
                    }}>Aceitar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="fade-in" style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {['todos', 'PENDENTE_DITE', 'APROVADO', 'FINALIZADO'].map(status => (
              <button key={status} onClick={() => setFiltroStatus(status)} style={{
                padding: '8px 16px', borderRadius: 20, border: `1px solid ${filtroStatus === status ? T.blue : T.border}`,
                background: filtroStatus === status ? T.blue : T.surface,
                color: filtroStatus === status ? '#FFF' : T.textMuted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}>
                {status === 'todos' ? 'Todos' : status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Pedidos List */}
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Meus Pedidos</h3>
              <span style={{ fontSize: 12, color: T.textMuted, background: T.surface, padding: '4px 10px', borderRadius: 10, border: `1px solid ${T.border}` }}>{pedidosFiltrados.length} registros</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: T.textMuted }}>Carregando...</div>
            ) : pedidosFiltrados.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 40, background: T.surface, borderRadius: 16, border: `1px dashed ${T.border}`
              }}>
                <i className="fas fa-inbox" style={{ fontSize: 40, color: T.textMuted, marginBottom: 12, opacity: 0.5 }}></i>
                <p style={{ color: T.textMuted, marginBottom: 16 }}>Nenhum pedido encontrado nesta categoria.</p>
                <button onClick={() => navigate('/criar-pedido')} style={{
                  padding: '10px 20px', background: T.blue, color: '#FFF', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 600, fontSize: 13
                }}>Criar Novo Pedido</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pedidosFiltrados.map(p => {
                  const st = getStatusInfo(p.estado);
                  return (
                    <div key={p.id} onClick={() => navigate(`/pedido/${p.id}`)} style={{
                      background: T.surface, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`,
                      cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.borderColor = T.blue; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.border; }}
                    >
                      {/* Status Indicator Line */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: st.cor }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingLeft: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{p.tipo_display}</div>
                          <div style={{ fontSize: 12, color: T.textMuted }}>
                            <i className="far fa-calendar"></i> {p.data_saida} • {p.hora_saida}
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                          background: st.bg, color: st.cor, textTransform: 'uppercase', letterSpacing: 0.5
                        }}>{st.texto}</span>
                      </div>
                      
                      <div style={{ paddingLeft: 8, borderTop: `1px solid ${T.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace' }}>#{p.id}</span>
                        <span style={{ fontSize: 12, color: T.blue, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Acessar <i className="fas fa-chevron-right" style={{ fontSize: 10 }}></i>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardEstudante;

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
  const navigate = useNavigate();

  // Theme Engine
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('student-theme-v2');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    localStorage.setItem('student-theme-v2', themeMode);
  }, [themeMode]);

  // Design Tokens (Adobe-style Minimal)
  const D = {
    // Brand
    brand: '#2563EB',
    brandHover: '#1D4ED8',
    brandSoft: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.04)',
    
    // Neutrals
    bg: isDark ? '#0B0B0B' : '#FAFAFA',
    surface: isDark ? '#161616' : '#FFFFFF',
    surfaceAlt: isDark ? '#1F1F1F' : '#F5F5F5',
    border: isDark ? '#2A2A2A' : '#EAEAEA',
    borderFocus: '#2563EB',
    
    // Text
    text: isDark ? '#EAEAEA' : '#0A0A0A',
    textSec: isDark ? '#888888' : '#666666',
    textMuted: isDark ? '#555555' : '#999999',
    
    // States
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    
    // Effects
    shadow: isDark ? '0 1px 3px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
    shadowElevated: isDark ? '0 8px 24px rgba(0,0,0,0.8)' : '0 8px 24px rgba(0,0,0,0.08)',
  };

  // Clock
  useEffect(() => {
    const t = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarColetivas();
    carregarNotificacoes();
  }, []);

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
    if (!confirm('Aceitar esta saida coletiva?')) return;
    try {
      await api.post(`/coletivas/${conviteId}/aceitar/`);
      alert('Pedido aceito com sucesso!');
      carregarColetivas(); carregarDados();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro ao aceitar')); }
  };

  const getStatusInfo = (estado) => {
    const map = {
      'PENDENTE_DITE': { label: 'Pendente', color: D.warning },
      'PENDENTE_DIRECAO': { label: 'Em analise', color: '#8B5CF6' },
      'PENDENTE_ADMIN': { label: 'Aguardando', color: D.info },
      'APROVADO': { label: 'Aprovado', color: D.success },
      'REJEITADO': { label: 'Rejeitado', color: D.danger },
      'EM_ANDAMENTO': { label: 'Em saida', color: '#06B6D4' },
      'FINALIZADO': { label: 'Finalizado', color: D.textMuted },
    };
    return map[estado] || { label: estado, color: D.textMuted };
  };

  const pedidosFiltrados = filtroStatus === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtroStatus);
  const pendentesCount = pedidos.filter(p => ['PENDENTE_DITE', 'PENDENTE_DIRECAO', 'PENDENTE_ADMIN'].includes(p.estado)).length;
  const aprovadosCount = pedidos.filter(p => p.estado === 'APROVADO').length;
  const concluidosCount = pedidos.filter(p => p.estado === 'FINALIZADO').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: D.bg, color: D.text, fontFamily: "'Inter', sans-serif", transition: 'background 0.3s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { background: ${D.bg}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${D.border}; border-radius: 2px; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @media (max-width: 768px) {
          .sb { position: fixed !important; left: -300px !important; z-index: 1000 !important; transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }
          .sb.open { left: 0 !important; }
          .main { margin-left: 0 !important; }
          .stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(2px)' }} />}

      {/* Sidebar */}
      <aside className={`sb ${sidebarOpen ? 'open' : ''}`} style={{ width: 260, background: D.surface, borderRight: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: D.brand, borderRadius: 6, display: 'grid', placeItems: 'center', color: '#FFF', fontSize: 14 }}>
            <i className="fas fa-graduation-cap"></i>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: D.text }}>ESTUDANTE</span>
        </div>

        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: D.surfaceAlt, borderRadius: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 4, background: D.text, color: D.bg, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 12 }}>
              {user?.nome?.[0] || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nome || 'Usuario'}</div>
              <div style={{ fontSize: 10, color: D.textMuted }}>Aluno</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Painel', icon: 'fa-th-large', active: true, action: null },
            { label: 'Novo Pedido', icon: 'fa-plus', action: () => navigate('/criar-pedido'), primary: true },
            { label: 'Coletivas', icon: 'fa-users', action: () => navigate('/coletivas'), count: coletivas.length },
            { label: 'Notificacoes', icon: 'fa-bell', action: () => navigate('/notificacoes'), count: notificacoesNaoLidas },
          ].map((item, i) => (
            <button key={i} onClick={item.action || (() => {})} style={{
              width: '100%', padding: '10px 14px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: item.primary ? D.brand : (item.active ? D.surfaceAlt : 'transparent'),
              color: item.primary ? '#FFF' : (item.active ? D.text : D.textSec),
              fontWeight: item.primary ? 600 : 500, fontSize: 13, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
            }}>
              <i className={`fas ${item.icon}`} style={{ width: 16, textAlign: 'center', fontSize: 12 }}></i>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count > 0 && (
                <span style={{ background: item.primary ? 'rgba(255,255,255,0.2)' : D.danger, color: item.primary ? '#FFF' : '#FFF', fontSize: 9, padding: '2px 6px', borderRadius: 2, fontWeight: 700 }}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 12px 24px' }}>
          <button onClick={() => setThemeMode(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: 10, background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 4,
            color: D.textSec, cursor: 'pointer', fontSize: 11, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} style={{ fontSize: 12 }}></i>
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: 10, background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.04)', border: 'none',
            borderRadius: 4, color: D.danger, cursor: 'pointer', fontSize: 11, fontWeight: 500
          }}>
            Encerrar Sessao
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header style={{
          height: 60, background: D.surface, borderBottom: `1px solid ${D.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px',
          position: 'sticky', top: 0, zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: D.text, fontSize: 16 }} className="mobile-toggle">
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Painel do Estudante</h1>
              <span style={{ fontSize: 11, color: D.textMuted }}>{horaAtual}</span>
            </div>
          </div>
          <button onClick={() => navigate('/notificacoes')} style={{
            position: 'relative', width: 32, height: 32, borderRadius: 4, border: `1px solid ${D.border}`,
            background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: D.textSec
          }}>
            <i className="fas fa-bell" style={{ fontSize: 12 }}></i>
            {notificacoesNaoLidas > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: D.danger, color: '#FFF', borderRadius: '50%', fontSize: 8, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{notificacoesNaoLidas}</span>
            )}
          </button>
        </header>

        {/* Scrollable Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          
          {/* Intro */}
          <div className="anim" style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 300, color: D.text, marginBottom: 8 }}>Ola, {user?.nome?.split(' ')[0]}</h2>
            <p style={{ fontSize: 14, color: D.textSec }}>Acompanhe seus pedidos de saida escolar.</p>
          </div>

          {/* Stats */}
          <div className="stats anim" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
            {[
              { label: 'Pendentes', val: pendentesCount, accent: D.warning },
              { label: 'Aprovados', val: aprovadosCount, accent: D.success },
              { label: 'Concluidos', val: concluidosCount, accent: D.info },
            ].map((s, i) => (
              <div key={i} style={{ background: D.surface, border: `1px solid ${D.border}`, padding: 20, borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 200, color: D.text }}>{s.val}</div>
                <div style={{ height: 1, background: s.accent, marginTop: 16, width: 24 }} />
              </div>
            ))}
          </div>

          {/* Coletivas */}
          {coletivas.length > 0 && (
            <div className="anim" style={{ marginBottom: 40, background: D.surface, border: `1px solid ${D.border}`, padding: 24, borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Saidas Coletivas Disponiveis</h3>
                <span style={{ fontSize: 11, color: D.textMuted, background: D.surfaceAlt, padding: '4px 8px', borderRadius: 2 }}>{coletivas.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {coletivas.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: D.surfaceAlt, borderRadius: 4 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: D.text, marginBottom: 4 }}>{c.titulo}</div>
                      <div style={{ fontSize: 11, color: D.textMuted }}>{c.data_saida}</div>
                    </div>
                    <button onClick={() => aceitarColetiva(c.id)} style={{
                      padding: '6px 14px', background: D.text, color: D.bg, border: 'none', borderRadius: 2,
                      cursor: 'pointer', fontWeight: 500, fontSize: 11
                    }}>Aceitar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pedidos Section */}
          <div className="anim">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Historico de Pedidos</h3>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'PENDENTE_DITE', label: 'Pendentes' },
                { id: 'APROVADO', label: 'Aprovados' },
                { id: 'FINALIZADO', label: 'Finalizados' },
              ].map(f => (
                <button key={f.id} onClick={() => setFiltroStatus(f.id)} style={{
                  padding: '6px 14px', border: `1px solid ${filtroStatus === f.id ? D.text : D.border}`,
                  borderRadius: 2, background: filtroStatus === f.id ? D.text : 'transparent',
                  color: filtroStatus === f.id ? (isDark ? '#000' : '#FFF') : D.textSec,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                }}>{f.label}</button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: D.textMuted }}>Carregando...</div>
            ) : pedidosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 4 }}>
                <p style={{ color: D.textMuted, marginBottom: 16, fontSize: 13 }}>Nenhum pedido encontrado.</p>
                <button onClick={() => navigate('/criar-pedido')} style={{
                  padding: '8px 20px', background: D.brand, color: '#FFF', border: 'none', borderRadius: 2,
                  cursor: 'pointer', fontWeight: 500, fontSize: 12
                }}>Criar Novo Pedido</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pedidosFiltrados.map(p => {
                  const st = getStatusInfo(p.estado);
                  return (
                    <div key={p.id} onClick={() => navigate(`/pedido/${p.id}`)} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 24,
                      padding: '20px 24px', background: D.surface, borderBottom: `1px solid ${D.border}`,
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = D.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = D.surface}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: D.text, marginBottom: 4 }}>{p.tipo_display}</div>
                        <div style={{ fontSize: 12, color: D.textMuted }}>{p.data_saida}</div>
                      </div>
                      
                      <div style={{ fontSize: 11, color: D.textMuted, fontFamily: 'monospace' }}>#{p.id}</div>
                      
                      <div style={{
                        padding: '4px 10px', borderRadius: 2, fontSize: 10, fontWeight: 600,
                        background: `${st.color}${isDark ? '20' : '15'}`, color: st.color,
                        whiteSpace: 'nowrap'
                      }}>{st.label}</div>
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

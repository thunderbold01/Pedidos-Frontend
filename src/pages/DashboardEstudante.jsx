import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardEstudante = ({ user, onLogout }) => {
  // ==================== STATE MANAGEMENT ====================
  const [pedidos, setPedidos] = useState([]);
  const [coletivas, setColetivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [horaAtual, setHoraAtual] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [stats, setStats] = useState({});
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const navigate = useNavigate();

  // ==================== THEME ENGINE ====================
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('student-theme-red');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    localStorage.setItem('student-theme-red', themeMode);
  }, [themeMode]);

  // ==================== DESIGN TOKENS (RED/BLACK/WHITE) ====================
  const D = {
    brand: '#DC2626', // Red-600
    brandHover: '#B91C1C', // Red-700
    brandSoft: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.05)',
    bg: isDark ? '#09090b' : '#ffffff', // Zinc-950 / White
    surface: isDark ? '#18181b' : '#fafafa', // Zinc-900 / Gray-50
    surfaceAlt: isDark ? '#27272a' : '#f4f4f5', // Zinc-800 / Gray-100
    border: isDark ? '#27272a' : '#e4e4e7', // Zinc-800 / Zinc-200
    text: isDark ? '#fafafa' : '#09090b', // Zinc-50 / Zinc-950
    textSec: isDark ? '#a1a1aa' : '#52525b', // Zinc-400 / Zinc-600
    textMuted: isDark ? '#52525b' : '#a1a1aa', // Zinc-600 / Zinc-400
    success: '#16a34a', // Green-600
    warning: '#ca8a04', // Yellow-600
    danger: '#dc2626', // Red-600
    shadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    shadowElevated: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };

  // ==================== CLOCK ====================
  useEffect(() => {
    const t = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  // ==================== DATA LOADING ====================
  useEffect(() => {
    carregarDados();
    carregarColetivas();
    carregarNotificacoes();
    carregarStats();
  }, []);

  const carregarDados = async () => {
    try {
      const res = await api.get('/pedidos/');
      setPedidos(res.data.pedidos || []);
    } catch (err) { console.error('Erro:', err); }
  };

  const carregarStats = async () => {
    try {
      const res = await api.get('/dashboard/');
      setStats(res.data);
    } catch (err) { console.error('Erro stats:', err); }
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

  // ==================== AÇÕES ====================
  const aceitarColetiva = async (conviteId) => {
    if (!confirm('Aceitar esta saida coletiva?')) return;
    try {
      await api.post(`/coletivas/${conviteId}/aceitar/`);
      alert('Pedido aceito com sucesso!');
      carregarColetivas();
      carregarDados();
    } catch (err) { 
      alert('Erro: ' + (err.response?.data?.error || 'Erro ao aceitar')); 
    }
  };

  // ==================== HELPERS ====================
  const getStatusInfo = (estado) => {
    const map = {
      'PENDENTE_DITE': { label: 'Pendente', color: D.warning, bg: isDark ? 'rgba(202, 138, 4, 0.15)' : 'rgba(202, 138, 4, 0.1)' },
      'PENDENTE_DIRECAO': { label: 'Em analise', color: '#7c3aed', bg: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.1)' },
      'PENDENTE_ADMIN': { label: 'Aguardando', color: '#2563eb', bg: isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.1)' },
      'APROVADO': { label: 'Aprovado', color: D.success, bg: isDark ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)' },
      'REJEITADO': { label: 'Rejeitado', color: D.danger, bg: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)' },
      'EM_ANDAMENTO': { label: 'Em saida', color: '#0891b2', bg: isDark ? 'rgba(8, 145, 178, 0.15)' : 'rgba(8, 145, 178, 0.1)' },
      'FINALIZADO': { label: 'Finalizado', color: D.textMuted, bg: isDark ? 'rgba(161, 161, 170, 0.15)' : 'rgba(161, 161, 170, 0.1)' },
    };
    return map[estado] || { label: estado, color: D.textMuted, bg: D.surfaceAlt };
  };

  // ==================== FILTROS ====================
  const pendentesCount = pedidos.filter(p => ['PENDENTE_DITE', 'PENDENTE_DIRECAO', 'PENDENTE_ADMIN'].includes(p.estado)).length;
  const aprovadosCount = pedidos.filter(p => p.estado === 'APROVADO').length;
  const concluidosCount = pedidos.filter(p => p.estado === 'FINALIZADO').length;
  const pedidosFiltrados = filtroStatus === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtroStatus);

  // ==================== RENDER ====================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: D.bg, color: D.text, fontFamily: "'Inter', sans-serif", transition: 'background 0.3s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { background: ${D.bg}; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${D.border}; border-radius: 3px; }
        
        @keyframes fadeUp { 
          from { opacity: 0; transform: translateY(12px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .anim { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @media (max-width: 768px) {
          .sb { position: fixed !important; left: -280px !important; z-index: 1000 !important; transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }
          .sb.open { left: 0 !important; box-shadow: 10px 0 30px rgba(0,0,0,0.3) !important; }
          .main { margin-left: 0 !important; }
          .stats { grid-template-columns: repeat(2, 1fr) !important; }
          .header-padding { padding: 0 16px !important; }
          .content-padding { padding: 20px !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (max-width: 480px) {
          .stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          zIndex: 999, backdropFilter: 'blur(2px)' 
        }} />
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`sb ${sidebarOpen ? 'open' : ''}`} style={{ 
        width: 260, background: D.surface, borderRight: `1px solid ${D.border}`, 
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', 
        top: 0, zIndex: 100, transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${D.border}` }}>
          <div style={{ 
            width: 36, height: 36, background: D.brand, borderRadius: 8, 
            display: 'grid', placeItems: 'center', color: '#FFF', fontSize: 16
          }}>
            <i className="fas fa-university"></i>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, color: D.text }}>ESTUDANTE</div>
            <div style={{ fontSize: 10, color: D.textMuted }}>Portal Academico</div>
          </div>
        </div>

        {/* Perfil */}
        <div style={{ padding: '20px', margin: '16px', background: D.bg, borderRadius: 12, border: `1px solid ${D.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 10, background: D.text, 
              color: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 600, fontSize: 16
            }}>
              {user?.nome?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: D.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nome?.split(' ')[0] || user?.username || 'Usuario'}
              </div>
              <div style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>Aluno Regular</div>
            </div>
          </div>
        </div>

        {/* Menu de Navegacao */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setFiltroStatus('todos')} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: filtroStatus === 'todos' ? D.brandSoft : 'transparent',
            color: filtroStatus === 'todos' ? D.brand : D.textSec,
            fontWeight: filtroStatus === 'todos' ? 600 : 500, fontSize: 13, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s'
          }}>
            <i className="fas fa-home" style={{ width: 18, fontSize: 14 }}></i>
            <span>Inicio</span>
          </button>

          <button onClick={() => navigate('/criar-pedido')} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: D.brand, color: '#FFF', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 8,
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
          }}>
            <i className="fas fa-plus-circle" style={{ width: 18, fontSize: 14 }}></i>
            <span>Novo Pedido</span>
          </button>

          <button onClick={() => navigate('/coletivas')} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: D.textSec, fontWeight: 500, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
            marginTop: 8
          }}>
            <i className="fas fa-users" style={{ width: 18, fontSize: 14 }}></i>
            <span>Saidas Coletivas</span>
            {coletivas.length > 0 && (
              <span style={{ 
                marginLeft: 'auto', background: D.brand, color: '#FFF', 
                fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 
              }}>{coletivas.length}</span>
            )}
          </button>

          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{
            width: '100%', padding: '10px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: D.textSec, fontWeight: 500, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s'
          }}>
            <i className="fas fa-bell" style={{ width: 18, fontSize: 14 }}></i>
            <span>Notificacoes</span>
            {notificacoesNaoLidas > 0 && (
              <span style={{ 
                marginLeft: 'auto', background: D.danger, color: '#FFF', 
                fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 
              }}>{notificacoesNaoLidas}</span>
            )}
          </button>
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: `1px solid ${D.border}`, marginTop: 'auto' }}>
          <button onClick={() => setThemeMode(isDark ? 'light' : 'dark')} style={{
            width: '100%', padding: 10, background: 'transparent', border: `1px solid ${D.border}`, 
            borderRadius: 8, color: D.textSec, cursor: 'pointer', fontSize: 12, marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} style={{ fontSize: 12 }}></i>
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: 10, background: isDark ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.04)', 
            border: 'none', borderRadius: 8, color: D.danger, cursor: 'pointer', fontSize: 12, fontWeight: 500
          }}>
            <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }}></i> Sair
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        
        {/* Top Header */}
        <header style={{
          height: 64, background: D.surface, borderBottom: `1px solid ${D.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          padding: '0 32px', position: 'sticky', top: 0, zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mobile-toggle" style={{ 
              display: 'none', background: 'none', border: 'none', cursor: 'pointer', 
              color: D.text, fontSize: 18 
            }}>
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: D.text, margin: 0 }}>Painel do Estudante</h1>
              <p style={{ fontSize: 11, color: D.textMuted, margin: '2px 0 0' }}>{horaAtual}</p>
            </div>
          </div>
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{
            position: 'relative', width: 36, height: 36, borderRadius: 8, border: `1px solid ${D.border}`,
            background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: D.textSec
          }}>
            <i className="fas fa-bell" style={{ fontSize: 14 }}></i>
            {notificacoesNaoLidas > 0 && (
              <span style={{ 
                position: 'absolute', top: -4, right: -4, width: 16, height: 16, 
                background: D.danger, color: '#FFF', borderRadius: '50%', fontSize: 9, 
                display: 'grid', placeItems: 'center', fontWeight: 700 
              }}>{notificacoesNaoLidas}</span>
            )}
          </button>
        </header>

        {/* Notificacoes Dropdown */}
        {showNotifDropdown && (
          <div style={{ 
            position: 'absolute', top: 64, right: 32, width: 320, background: D.surface, 
            borderRadius: 12, border: `1px solid ${D.border}`, boxShadow: D.shadowElevated, 
            zIndex: 200, maxHeight: 400, overflow: 'auto'
          }}>
            <div style={{ padding: 12, borderBottom: `1px solid ${D.border}`, fontWeight: 600, fontSize: 13 }}>
              Notificacoes
            </div>
            {notificacoes.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: D.textMuted, fontSize: 12 }}>
                Nenhuma notificacao
              </div>
            ) : (
              notificacoes.map(n => (
                <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{ 
                  padding: 12, borderBottom: `1px solid ${D.border}`, cursor: 'pointer',
                  background: n.lida ? 'transparent' : D.brandSoft
                }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>{n.mensagem}</div>
                  <div style={{ fontSize: 10, color: D.textMuted }}>{n.data}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="content-padding">
          
          {/* Welcome Section */}
          <div className="anim" style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: D.text, marginBottom: 8 }}>
              Ola, {user?.nome?.split(' ')[0] || user?.username || 'Estudante'}
            </h2>
            <p style={{ fontSize: 14, color: D.textSec }}>
              Gerencie suas solicitacoes de saida e acompanhe o status em tempo real.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="stats anim" style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 
          }}>
            <div style={{ 
              background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, 
              padding: 20, transition: 'transform 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase' }}>Pendentes</div>
                <div style={{ fontSize: 18, color: D.warning }}><i className="fas fa-clock"></i></div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: D.text }}>{pendentesCount}</div>
              <div style={{ height: 2, background: D.warning, marginTop: 16, width: 40, borderRadius: 2 }} />
            </div>
            
            <div style={{ 
              background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, 
              padding: 20, transition: 'transform 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase' }}>Aprovados</div>
                <div style={{ fontSize: 18, color: D.success }}><i className="fas fa-check-circle"></i></div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: D.text }}>{aprovadosCount}</div>
              <div style={{ height: 2, background: D.success, marginTop: 16, width: 40, borderRadius: 2 }} />
            </div>
            
            <div style={{ 
              background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, 
              padding: 20, transition: 'transform 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase' }}>Concluidos</div>
                <div style={{ fontSize: 18, color: D.textSec }}><i className="fas fa-flag-checkered"></i></div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: D.text }}>{concluidosCount}</div>
              <div style={{ height: 2, background: D.textSec, marginTop: 16, width: 40, borderRadius: 2 }} />
            </div>
          </div>

          {/* Saidas Coletivas em Destaque */}
          {coletivas.length > 0 && (
            <div className="anim" style={{ marginBottom: 32, background: D.surface, borderRadius: 12, padding: 20, border: `1px solid ${D.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: D.text }}>
                  <i className="fas fa-bus" style={{ marginRight: 8, color: D.brand }}></i> Saidas Coletivas Disponiveis
                </h3>
                <span style={{ fontSize: 11, color: D.textMuted, background: D.surfaceAlt, padding: '4px 10px', borderRadius: 20 }}>
                  {coletivas.length} novas
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {coletivas.slice(0, 3).map(c => (
                  <div key={c.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: 14, background: D.bg, borderRadius: 8, border: `1px solid ${D.border}`
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: D.text }}>{c.titulo}</div>
                      <div style={{ fontSize: 11, color: D.textMuted, marginTop: 4 }}>
                        <i className="fas fa-calendar"></i> {c.data_saida}
                      </div>
                    </div>
                    <button onClick={() => aceitarColetiva(c.id)} style={{
                      padding: '8px 18px', background: D.brand, color: '#FFF', border: 'none', 
                      borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                      transition: 'all 0.2s'
                    }}>
                      Aceitar
                    </button>
                  </div>
                ))}
              </div>
              {coletivas.length > 3 && (
                <button onClick={() => navigate('/coletivas')} style={{
                  marginTop: 12, padding: '8px 16px', background: 'transparent', 
                  border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', 
                  fontSize: 12, color: D.textSec, width: '100%'
                }}>
                  Ver todas ({coletivas.length}) →
                </button>
              )}
            </div>
          )}

          {/* Filtros de Pedidos */}
          <div className="anim" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: D.text, marginBottom: 16 }}>
              <i className="fas fa-history" style={{ marginRight: 8 }}></i> Meus Pedidos
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'PENDENTE_DITE', label: 'Pendentes' },
                { id: 'APROVADO', label: 'Aprovados' },
                { id: 'FINALIZADO', label: 'Finalizados' },
              ].map(f => (
                <button key={f.id} onClick={() => setFiltroStatus(f.id)} style={{
                  padding: '6px 16px', border: `1px solid ${filtroStatus === f.id ? D.brand : D.border}`,
                  borderRadius: 20, background: filtroStatus === f.id ? D.brand : 'transparent',
                  color: filtroStatus === f.id ? '#FFF' : D.textSec, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Pedidos */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: D.textMuted }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12, display: 'block' }}></i>
              Carregando pedidos...
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: 60, background: D.surface, 
              border: `1px solid ${D.border}`, borderRadius: 12
            }}>
              <i className="fas fa-inbox" style={{ fontSize: 48, color: D.textMuted, marginBottom: 16, display: 'block' }}></i>
              <p style={{ color: D.textMuted, marginBottom: 16, fontSize: 14 }}>Nenhum pedido encontrado</p>
              <button onClick={() => navigate('/criar-pedido')} style={{
                padding: '10px 24px', background: D.brand, color: '#FFF', border: 'none', 
                borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13
              }}>
                Criar Primeiro Pedido
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pedidosFiltrados.map(p => {
                const st = getStatusInfo(p.estado);
                const isAprovado = p.estado === 'APROVADO';
                return (
                  <div key={p.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                    alignItems: 'center', gap: 16, padding: '16px 20px',
                    background: D.surface, borderBottom: `1px solid ${D.border}`,
                    borderRadius: 8, marginBottom: 8, transition: 'all 0.2s'
                  }}>
                    {/* Informacoes do Pedido */}
                    <div>
                      <div style={{ 
                        fontSize: 14, fontWeight: 600, color: D.text,
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4
                      }}>
                        {p.tipo_display}
                        {isAprovado && (
                          <span style={{
                            background: D.success, color: '#FFF', fontSize: 9,
                            padding: '2px 8px', borderRadius: 20, fontWeight: 600
                          }}>
                            AUTORIZADO
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: D.textMuted }}>
                        <i className="fas fa-calendar-alt"></i> {p.data_saida}
                      </div>
                    </div>
                    
                    {/* ID do Pedido */}
                    <div style={{ fontSize: 11, color: D.textMuted, fontFamily: 'monospace' }}>
                      #{p.id}
                    </div>
                    
                    {/* Status Badge */}
                    <div style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: st.bg, color: st.color, whiteSpace: 'nowrap'
                    }}>
                      {st.label}
                    </div>
                    
                    {/* Acoes */}
                    <div>
                      {isAprovado ? (
                        <span style={{
                          display: 'inline-block', padding: '5px 12px', background: D.success,
                          color: '#FFF', borderRadius: 6, fontSize: 11, fontWeight: 600
                        }}>
                          SAIDA AUTORIZADA
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-block', padding: '5px 12px', background: D.warning,
                          color: '#FFF', borderRadius: 6, fontSize: 11, fontWeight: 600
                        }}>
                          AGUARDANDO ANALISE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardEstudante;

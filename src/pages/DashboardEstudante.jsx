// src/pages/DashboardEstudante.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardEstudante = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [menuAberto, setMenuAberto] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMenuAberto(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    carregarPedidos();
    carregarNotificacoes();
  }, []);

  const carregarPedidos = async () => {
    try {
      const res = await api.get('/pedidos/');
      setPedidos(res.data.pedidos || []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas);
    } catch (err) {}
  };

  const getStatusInfo = (estado) => {
    const info = {
      'PENDENTE_DITE': { texto: 'Pendente', cor: '#f59e0b' },
      'PENDENTE_DIRECAO': { texto: 'Em análise', cor: '#8b5cf6' },
      'PENDENTE_ADMIN': { texto: 'Aguardando', cor: '#3b82f6' },
      'APROVADO': { texto: 'Aprovado', cor: '#10b981' },
      'REJEITADO': { texto: 'Rejeitado', cor: '#ef4444' },
      'EM_ANDAMENTO': { texto: 'Em saída', cor: '#06b6d4' },
      'FINALIZADO': { texto: 'Finalizado', cor: '#6b7280' },
    };
    return info[estado] || { texto: estado, cor: '#6b7280' };
  };

  const getDiaSemana = (data) => {
    if (!data) return '';
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    try {
      const partes = data.split('/');
      const d = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
      return dias[d.getDay()];
    } catch { return ''; }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      <div style={styles.container}>
        {/* OVERLAY MOBILE */}
        {isMobile && menuAberto && (
          <div onClick={() => setMenuAberto(false)} style={styles.overlay} />
        )}

        {/* SIDEBAR */}
        <div style={{
          ...styles.sidebar,
          left: isMobile ? (menuAberto ? '0' : '-260px') : '0',
        }}>
          {/* Perfil */}
          <div style={styles.perfil}>
            <div style={styles.avatar}>
              {user.nome?.charAt(0) || 'E'}
            </div>
            <div style={styles.perfilInfo}>
              <div style={styles.nome}>{user.nome || user.username}</div>
              <div style={styles.email}>{user.email}</div>
              <span style={styles.roleBadge}>Estudante</span>
            </div>
          </div>

          {/* Separador */}
          <div style={styles.separador} />

          {/* Navegação */}
          <nav style={styles.nav}>
            <button onClick={() => { navigate('/criar-pedido'); if(isMobile) setMenuAberto(false); }} style={styles.btnPrimary}>
              <span style={styles.btnIcon}>+</span>
              <span>Novo Pedido</span>
            </button>

            <button onClick={() => { navigate('/notificacoes'); if(isMobile) setMenuAberto(false); }} style={styles.btnSecundario}>
              <span style={styles.btnIcon}>⏍</span>
              <span>Notificações</span>
              {notificacoesNaoLidas > 0 && (
                <span style={styles.notifBadge}>{notificacoesNaoLidas}</span>
              )}
            </button>

            {user.curso && (
              <div style={styles.infoLinha}>
                <span style={styles.infoIcon}>▸</span>
                <span style={styles.infoTexto}>{user.curso}</span>
              </div>
            )}
            {user.classe && (
              <div style={styles.infoLinha}>
                <span style={styles.infoIcon}>▸</span>
                <span style={styles.infoTexto}>{user.classe}</span>
              </div>
            )}
          </nav>

          {/* Sair */}
          <div style={styles.footer}>
            <button onClick={onLogout} style={styles.btnSair}>
              <span>🚪</span>
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div style={{
          ...styles.main,
          marginLeft: isMobile ? '0' : '260px',
        }}>
          {/* Top Bar */}
          <div style={styles.topBar}>
            {isMobile && (
              <button onClick={() => setMenuAberto(!menuAberto)} style={styles.burger}>
                <span /><span /><span />
              </button>
            )}
            <span style={styles.dataHoje}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            {isMobile && (
              <div style={styles.avatarMini}>
                {user.nome?.charAt(0) || 'E'}
              </div>
            )}
          </div>

          {/* Cabeçalho */}
          <div style={styles.header}>
            <h1 style={styles.title}>Meus Pedidos</h1>
            <button onClick={() => navigate('/criar-pedido')} style={styles.btnNovo}>+ Novo</button>
          </div>

          {/* Lista de Pedidos */}
          <div style={styles.lista}>
            {loading ? (
              <div style={styles.estadoVazio}>
                <div style={styles.spinner} />
                <p>Carregando...</p>
              </div>
            ) : pedidos.length === 0 ? (
              <div style={styles.estadoVazio}>
                <span style={{ fontSize: '56px' }}>📭</span>
                <h3>Nenhum pedido ainda</h3>
                <p style={{ color: '#94a3b8', margin: '6px 0 20px' }}>
                  Você ainda não criou nenhum pedido de saída
                </p>
                <button onClick={() => navigate('/criar-pedido')} style={styles.btnVazio}>
                  Criar Primeiro Pedido
                </button>
              </div>
            ) : (
              pedidos.map(p => {
                const st = getStatusInfo(p.estado);
                return (
                  <div key={p.id} style={styles.card} onClick={() => navigate(`/pedido/${p.id}`)}>
                    <div style={styles.cardLeft}>
                      <div style={{ ...styles.dot, background: st.cor }} />
                      <div>
                        <div style={styles.cardTipo}>{p.tipo_display}</div>
                        <div style={styles.cardData}>
                          {p.data_saida} • {getDiaSemana(p.data_saida)}
                        </div>
                      </div>
                    </div>
                    <div style={styles.cardRight}>
                      <span style={{
                        ...styles.statusBadge,
                        color: st.cor,
                        borderColor: st.cor + '50',
                        background: st.cor + '12',
                      }}>
                        {st.texto}
                      </span>
                      <span style={styles.seta}>→</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f1f5f9; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
        .burger span {
          display:block;
          width:20px; height:2px;
          border-radius:2px;
          background:#475569;
          transition:all 0.3s;
        }
      `}</style>
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: "'Inter', sans-serif",
  },
  // OVERLAY
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 90,
  },
  // SIDEBAR
  sidebar: {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    width: '260px',
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    zIndex: 95,
    display: 'flex',
    flexDirection: 'column',
    transition: 'left 0.3s ease',
    boxShadow: '4px 0 30px rgba(0,0,0,0.06)',
  },
  perfil: {
    padding: '28px 20px 22px',
    background: 'linear-gradient(180deg, #dc2626 0%, #ef4444 60%, #06b6d4 100%)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    border: '2px solid rgba(255,255,255,0.4)',
    flexShrink: 0,
  },
  perfilInfo: {
    flex: 1,
    minWidth: 0,
  },
  nome: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  email: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.8)',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    display: 'inline-block',
    marginTop: '6px',
    padding: '2px 10px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    background: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
  },
  separador: {
    height: '1px',
    background: '#e2e8f0',
    margin: '0 20px',
  },
  nav: {
    flex: 1,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    border: 'none',
    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
    transition: 'all 0.2s',
  },
  btnIcon: {
    fontSize: '16px',
    fontWeight: '300',
    width: '20px',
    textAlign: 'center',
  },
  btnSecundario: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px 14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#ef4444',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
  },
  infoLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    marginTop: '12px',
  },
  infoIcon: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  infoTexto: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #e2e8f0',
  },
  btnSair: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px',
    border: '1px solid #fecaca',
    background: '#fef2f2',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#dc2626',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },
  // MAIN
  main: {
    flex: 1,
    padding: '16px 24px 24px',
    transition: 'margin-left 0.3s ease',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    gap: '12px',
  },
  burger: {
    width: '42px',
    height: '42px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    flexShrink: 0,
  },
  dataHoje: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
    textAlign: 'center',
    flex: 1,
  },
  avatarMini: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: '-0.5px',
  },
  btnNovo: {
    padding: '9px 18px',
    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(220,38,38,0.25)',
  },
  // LISTA
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    animation: 'fadeUp 0.3s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
    flexShrink: 0,
  },
  cardTipo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  cardData: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusBadge: {
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: '700',
    border: '1px solid',
  },
  seta: {
    fontSize: '16px',
    color: '#cbd5e1',
    fontWeight: '300',
  },
  // ESTADOS
  estadoVazio: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#94a3b8',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#dc2626',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    margin: '0 auto 16px',
  },
  btnVazio: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 16px rgba(220,38,38,0.25)',
  },
};

export default DashboardEstudante;
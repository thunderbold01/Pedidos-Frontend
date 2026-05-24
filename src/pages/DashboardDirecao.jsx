import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardDITE = ({ user, onLogout }) => {
  // ==================== ESTADOS ====================
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('painel');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroData, setFiltroData] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [modalGerarRel, setModalGerarRel] = useState(false);
  const [relPeriodo, setRelPeriodo] = useState({ inicio: '', fim: '' });
  const [gerando, setGerando] = useState(false);
  const [relatorios, setRelatorios] = useState([]);
  const [horaAtual, setHoraAtual] = useState('');

  const notifRef = useRef(null);
  const navigate = useNavigate();

  // ==================== THEME ====================
  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const C = {
    gold: '#D4A017',
    goldLight: '#F4E4A0',
    goldDark: '#A67C00',
    goldSoft: isDark ? 'rgba(212,160,23,0.12)' : 'rgba(212,160,23,0.08)',
    goldGlow: isDark ? 'rgba(212,160,23,0.2)' : 'rgba(212,160,23,0.15)',
    bg: isDark ? '#0C0A09' : '#FFFBF0',
    surface: isDark ? '#1C1917' : '#FFFFFF',
    surfaceAlt: isDark ? '#292524' : '#FAFAF7',
    border: isDark ? '#44403C' : '#E8E4D9',
    borderStrong: isDark ? '#57534E' : '#D4CFC0',
    text: isDark ? '#FAF9F6' : '#1C1917',
    textMuted: isDark ? '#A8A29E' : '#78716C',
    textSoft: isDark ? '#57534E' : '#A8A29E',
    shadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(28,25,23,0.06)',
    shadowHover: isDark ? '0 8px 40px rgba(0,0,0,0.7)' : '0 8px 40px rgba(28,25,23,0.1)',
    success: isDark ? '#4ADE80' : '#15803D',
    danger: isDark ? '#F87171' : '#DC2626',
    warning: isDark ? '#FBBF24' : '#D97706',
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    const t = setInterval(() => setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })), 1000);
    t; return () => clearInterval(t);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    carregarRelatorios();
  }, [filtroEstado, filtroData]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ==================== API ====================
  const carregarDados = async () => {
    setLoading(true);
    try {
      let url = '/pedidos/';
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
      if (filtroData) params.append('data_saida', filtroData);
      if (params.toString()) url += `?${params.toString()}`;
      const [pedRes, statsRes] = await Promise.all([api.get(url), api.get('/dashboard/')]);
      setPedidos(pedRes.data.pedidos || []);
      setStats(statsRes.data);
    } catch (err) { console.error('Erro:', err); }
    finally { setLoading(false); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  };

  const carregarRelatorios = async () => {
    try { const res = await api.get('/relatorios/'); setRelatorios(res.data.relatorios || []); } catch (err) {}
  };

  const marcarNotificacaoLida = async (id) => {
    try { await api.post(`/notificacoes/${id}/ler/`); carregarNotificacoes(); } catch (err) {}
  };

  const aprovarPedido = async (id) => {
    if (!confirm('Aprovar este pedido?')) return;
    try { await api.post(`/pedidos/${id}/aprovar/`); carregarDados(); carregarNotificacoes(); alert('Pedido aprovado!'); }
    catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const rejeitarPedido = async (id) => {
    const motivo = prompt('Motivo da rejeição:');
    if (!motivo) return;
    try { await api.post(`/pedidos/${id}/rejeitar/`, { comentario: motivo }); carregarDados(); carregarNotificacoes(); alert('Pedido rejeitado!'); }
    catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const gerarRelatorio = async () => {
    if (!relPeriodo.inicio || !relPeriodo.fim) { alert('Selecione o período'); return; }
    setGerando(true);
    try {
      await api.post('/relatorios/criar/', {
        titulo: `Relatório DITE - ${new Date().toLocaleDateString('pt-BR')}`,
        tipo: 'PERSONALIZADO', descricao: 'Relatório gerado pela DITE',
        data_inicio: relPeriodo.inicio, data_fim: relPeriodo.fim
      });
      alert('Relatório gerado!'); carregarRelatorios();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || err.message)); }
    finally { setGerando(false); setModalGerarRel(false); }
  };

  const baixarRelatorio = async (id) => {
    try {
      const res = await api.get(`/relatorios/download/${id}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `relatorio_${id}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { alert('Erro ao baixar'); }
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      carregarDados(); carregarNotificacoes();
      alert(`Pedido ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'}!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const motivo = prompt('Motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else { alert(`Erro: ${msg}`); }
    }
  };

  const handleEncaminhar = async (pedidoId) => {
    if (!confirm('Encaminhar para Administração?')) return;
    try { await api.post(`/pedidos/${pedidoId}/passar/`); carregarDados(); carregarNotificacoes(); alert('Encaminhado!'); }
    catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  // ==================== HELPERS ====================
  const formatarData = (d) => {
    if (!d) return '-';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p =>
      p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm) ||
      p.estudante_curso?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pedidos, searchTerm]);

  const totalAprovados = stats.pedidos_aprovados || 0;
  const totalRejeitados = stats.pedidos_rejeitados || 0;
  const totalPendentes = stats.meus_pedidos_pendentes || 0;
  const totalGeral = stats.total_pedidos || 0;

  // ==================== RENDER ====================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background .3s ease, color .3s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg};-webkit-font-smoothing:antialiased}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInScale{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes slideRight{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        .ds-fade{animation:fadeIn .35s ease both}
        .ds-fade-scale{animation:fadeInScale .3s ease both}
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        .gold-line{position:relative}
        .gold-line::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,${C.gold},transparent);opacity:.4}

        @media(max-width:1024px){
          .ds-sidebar{width:240px!important}
        }
        @media(max-width:768px){
          .ds-sidebar{position:fixed!important;left:-280px!important;top:0!important;bottom:0!important;z-index:1000!important;transition:left .35s cubic-bezier(.4,0,.2,1)!important;width:280px!important;}
          .ds-sidebar.open{left:0!important;}
          .ds-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;backdrop-filter:blur(4px);}
          .ds-overlay.show{display:block;animation:fadeIn .2s ease;}
          .ds-toggle{display:grid!important;}
          .ds-main{margin-left:0!important;}
          .ds-stat-card{min-width:140px!important;}
          .ds-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .ds-table{min-width:640px;}
          .ds-content{padding:16px!important;}
          .ds-header{padding:12px 16px!important;}
        }
        @media(max-width:480px){
          .ds-stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;}
        }
      `}</style>

      {/* OVERLAY */}
      <div className={`ds-overlay ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`ds-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: 260, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
        zIndex: 10, flexShrink: 0, transition: 'all .3s ease', overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
          <div className="gold-line" style={{ paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                display: 'grid', placeItems: 'center', color: '#000', fontWeight: 900, fontSize: 18,
                boxShadow: `0 4px 16px ${C.goldGlow}`
              }}>D</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>DITE</div>
                <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Direção</div>
              </div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ margin: '16px 14px 0', padding: 14, background: C.goldSoft, borderRadius: 14, border: `1px solid ${C.goldGlow}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
            display: 'grid', placeItems: 'center', color: '#000', fontWeight: 800, fontSize: 16, flexShrink: 0
          }}>
            {(user?.nome || user?.username || 'D').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nome || user?.username || 'Usuário'}</div>
            <div style={{ fontSize: 10, color: C.goldDark, fontWeight: 600, marginTop: 1 }}>Administrador</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '20px 10px', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.textSoft, letterSpacing: 1.5, padding: '0 12px 10px', textTransform: 'uppercase' }}>Navegação</div>
          {[
            { id: 'painel', icon: '◈', label: 'Painel Geral' },
            { id: 'pendentes', icon: '◷', label: 'Pendentes' },
            { id: 'aprovados', icon: '◉', label: 'Aprovados' },
            { id: 'rejeitados', icon: '✕', label: 'Rejeitados' },
            { id: 'historico', icon: '▤', label: 'Histórico' },
          ].map(item => {
            const isActive = (item.id === 'painel' && abaAtiva === 'painel') ||
              (item.id === 'pendentes' && abaAtiva === 'painel' && filtroEstado === 'PENDENTE_DIRECAO') ||
              (item.id === 'aprovados' && filtroEstado === 'APROVADO') ||
              (item.id === 'rejeitados' && filtroEstado === 'REJEITADO') ||
              (item.id === 'historico' && (filtroEstado === 'EM_ANDAMENTO' || filtroEstado === 'FINALIZADO'));
            return (
              <button key={item.id} onClick={() => {
                setAbaAtiva('painel');
                if (item.id === 'pendentes') setFiltroEstado('PENDENTE_DIRECAO');
                else if (item.id === 'aprovados') setFiltroEstado('APROVADO');
                else if (item.id === 'rejeitados') setFiltroEstado('REJEITADO');
                else if (item.id === 'historico') setFiltroEstado('EM_ANDAMENTO');
                else if (item.id === 'painel') setFiltroEstado('todos');
                setMobileMenuOpen(false);
              }} style={{
                width: '100%', padding: '11px 14px', border: 'none', background: isActive ? C.goldSoft : 'transparent',
                color: isActive ? C.gold : C.textMuted, fontWeight: isActive ? 700 : 500,
                fontSize: 13, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2, fontFamily: 'inherit',
                transition: 'all .2s ease'
              }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center', opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.gold }} />}
              </button>
            );
          })}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '16px 12px' }} />

          {[
            { id: 'relatorios', icon: '▥', label: 'Relatórios' },
            { id: 'config', icon: '⚙', label: 'Configurações' },
          ].map(item => (
            <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMobileMenuOpen(false); }} style={{
              width: '100%', padding: '11px 14px', border: 'none', background: abaAtiva === item.id ? C.goldSoft : 'transparent',
              color: abaAtiva === item.id ? C.gold : C.textMuted, fontWeight: abaAtiva === item.id ? 700 : 500,
              fontSize: 13, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2, fontFamily: 'inherit',
              transition: 'all .2s ease'
            }}>
              <span style={{ fontSize: 14, width: 20, textAlign: 'center', opacity: abaAtiva === item.id ? 1 : 0.5 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 14px 20px' }}>
          <button onClick={onLogout} style={{
            width: '100%', padding: '12px 14px', background: isDark ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.06)',
            border: `1px solid ${isDark ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.1)'}`,
            borderRadius: 10, color: C.danger, cursor: 'pointer', fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
            transition: 'all .2s ease'
          }}>
            <span style={{ fontSize: 14 }}>↗</span> Encerrar sessão
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <main className="ds-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <header className="ds-header" style={{
          background: isDark ? 'rgba(28,25,23,0.9)' : 'rgba(255,251,240,0.9)',
          borderBottom: `1px solid ${C.border}`, padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setMobileMenuOpen(true)} className="ds-toggle" style={{
              display: 'none', width: 36, height: 36, background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 10, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
              color: C.text, fontSize: 16
            }}>☰</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>
                {abaAtiva === 'painel' ? 'Painel da Direção' : abaAtiva === 'relatorios' ? 'Relatórios' : 'Configurações'}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                {horaAtual} · {formatarData(filtroData)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} style={{
              background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: '8px 12px',
              borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 12, outline: 'none'
            }} />
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifDropdown(s => !s)} style={{
                width: 38, height: 38, borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                cursor: 'pointer', display: 'grid', placeItems: 'center', color: C.text, position: 'relative', fontSize: 15
              }}>
                ◉
                {notificacoesNaoLidas > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, padding: '0 5px',
                    background: C.gold, color: '#000', borderRadius: 9, fontSize: 9, fontWeight: 800,
                    display: 'grid', placeItems: 'center', border: `2px solid ${isDark ? '#0C0A09' : '#FFFBF0'}`
                  }}>{notificacoesNaoLidas}</span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="ds-fade-scale" style={{
                  position: 'absolute', right: 0, top: 46, width: 320, background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, zIndex: 50,
                  maxHeight: 400, overflowY: 'auto'
                }}>
                  <div style={{ padding: 14, borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 12, color: C.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Notificações
                    {notificacoesNaoLidas > 0 && <span style={{ background: C.gold, color: '#000', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800 }}>{notificacoesNaoLidas} novas</span>}
                  </div>
                  {notificacoes.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Nenhuma notificação</div>
                    : notificacoes.map(n => (
                      <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{
                        padding: 12, borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
                        background: n.lida ? 'transparent' : C.goldSoft, transition: 'background .15s'
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{n.mensagem}</div>
                        {n.data && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{n.data}</div>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="ds-content" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>

          {/* STATS CARDS */}
          <div className="ds-stats-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {/* Pendentes */}
            <div className="ds-stat-card" style={{
              background: C.surface, borderRadius: 16, padding: 20, boxShadow: C.shadow,
              border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: C.goldSoft, borderRadius: '0 0 0 80px', opacity: .5 }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Pendentes</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.gold, lineHeight: 1, letterSpacing: -1 }}>{totalPendentes}</div>
              </div>
              <div style={{ position: 'relative', marginTop: 12 }}>
                <div style={{ height: 3, background: C.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalGeral > 0 ? (totalPendentes / totalGeral) * 100 : 0}%`, background: C.gold, borderRadius: 2, transition: 'width .8s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>Aguardando análise</div>
              </div>
            </div>

            {/* Aprovados */}
            <div className="ds-stat-card" style={{
              background: C.surface, borderRadius: 16, padding: 20, boxShadow: C.shadow,
              border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `${C.success}10`, borderRadius: '0 0 0 80px' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Aprovados</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.success, lineHeight: 1, letterSpacing: -1 }}>{totalAprovados}</div>
              </div>
              <div style={{ position: 'relative', marginTop: 12 }}>
                <div style={{ height: 3, background: C.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalGeral > 0 ? (totalAprovados / totalGeral) * 100 : 0}%`, background: C.success, borderRadius: 2, transition: 'width .8s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>Autorizados</div>
              </div>
            </div>

            {/* Rejeitados */}
            <div className="ds-stat-card" style={{
              background: C.surface, borderRadius: 16, padding: 20, boxShadow: C.shadow,
              border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `${C.danger}10`, borderRadius: '0 0 0 80px' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Rejeitados</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.danger, lineHeight: 1, letterSpacing: -1 }}>{totalRejeitados}</div>
              </div>
              <div style={{ position: 'relative', marginTop: 12 }}>
                <div style={{ height: 3, background: C.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalGeral > 0 ? (totalRejeitados / totalGeral) * 100 : 0}%`, background: C.danger, borderRadius: 2, transition: 'width .8s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>Negados</div>
              </div>
            </div>

            {/* Total */}
            <div className="ds-stat-card" style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, borderRadius: 16, padding: 20,
              boxShadow: `0 4px 24px ${C.goldGlow}`, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '0 0 0 100px' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Geral</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#000', lineHeight: 1, letterSpacing: -1 }}>{totalGeral}</div>
              </div>
              <div style={{ position: 'relative', marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>Pedidos no sistema</div>
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16,
            boxShadow: C.shadow, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, fontSize: 13, pointerEvents: 'none' }}>⌕</span>
              <input type="text" placeholder="Buscar estudante, curso ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
                width: '100%', padding: '11px 14px 11px 38px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none', transition: 'border-color .2s'
              }} onFocus={(e) => e.currentTarget.style.borderColor = C.gold} onBlur={(e) => e.currentTarget.style.borderColor = C.border} />
            </div>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{
              padding: '11px 14px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
              borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 600
            }}>
              <option value="todos">Todos os estados</option>
              <option value="PENDENTE_DIRECAO">Pendentes</option>
              <option value="APROVADO">Aprovados</option>
              <option value="REJEITADO">Rejeitados</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="FINALIZADO">Finalizados</option>
            </select>
            <button onClick={() => setModalGerarRel(true)} style={{
              padding: '11px 20px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
              color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
              fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 4px 12px ${C.goldGlow}`, transition: 'all .2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}
            >
              <span style={{ fontSize: 14 }}>▥</span> Gerar Relatório
            </button>
          </div>

          {/* TABS */}
          {abaAtiva === 'relatorios' ? null : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'painel', label: 'Todos' },
                { id: 'pendentes', label: 'Pendentes', count: totalPendentes },
                { id: 'aprovados', label: 'Aprovados', count: totalAprovados },
                { id: 'rejeitados', label: 'Rejeitados', count: totalRejeitados },
              ].map(tab => {
                const isActive = (tab.id === 'painel' && filtroEstado === 'todos') ||
                  (tab.id === 'pendentes' && filtroEstado === 'PENDENTE_DIRECAO') ||
                  (tab.id === 'aprovados' && filtroEstado === 'APROVADO') ||
                  (tab.id === 'rejeitados' && filtroEstado === 'REJEITADO');
                return (
                  <button key={tab.id} onClick={() => {
                    setAbaAtiva('painel');
                    if (tab.id === 'pendentes') setFiltroEstado('PENDENTE_DIRECAO');
                    else if (tab.id === 'aprovados') setFiltroEstado('APROVADO');
                    else if (tab.id === 'rejeitados') setFiltroEstado('REJEITADO');
                    else if (tab.id === 'painel') setFiltroEstado('todos');
                  }} style={{
                    padding: '8px 16px', border: `1px solid ${isActive ? C.gold : C.border}`,
                    borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: isActive ? 700 : 500,
                    background: isActive ? C.goldSoft : 'transparent',
                    color: isActive ? C.gold : C.textMuted,
                    fontFamily: 'inherit', letterSpacing: 0.3, transition: 'all .2s ease'
                  }}>
                    {tab.label} {tab.count > 0 && <span style={{ opacity: 0.7 }}>({tab.count})</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* CONTENT AREA */}
          {abaAtiva === 'relatorios' ? (
            <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: -.3 }}>Relatórios Gerados</div>
              {relatorios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: C.textMuted, border: `1px dashed ${C.borderStrong}`, borderRadius: 16 }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>▥</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nenhum relatório gerado</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Clique em "Gerar Relatório" para criar o primeiro</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {relatorios.map(r => (
                    <div key={r.id} style={{
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20,
                      boxShadow: C.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'all .2s ease', flexWrap: 'wrap', gap: 12
                    }}
                    onClick={() => baixarRelatorio(r.id)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = C.shadowHover; e.currentTarget.style.borderColor = C.goldGlow; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = C.shadow; e.currentTarget.style.borderColor = C.border; }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.titulo}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>Criado em {r.created_at} · Por: {r.criado_por}</div>
                      </div>
                      <div style={{
                        padding: '8px 16px', background: C.goldSoft, border: `1px solid ${C.goldGlow}`,
                        borderRadius: 8, color: C.gold, fontSize: 11, fontWeight: 700
                      }}>BAIXAR CSV</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : abaAtiva === 'config' ? (
            <div className="ds-fade" style={{ textAlign: 'center', padding: 80 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>⚙</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Configurações</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Em desenvolvimento</div>
            </div>
          ) : (
            <div className="ds-fade">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin .8s linear infinite' }} />
                  <div style={{ color: C.textMuted, fontSize: 12 }}>Carregando pedidos...</div>
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: C.textMuted, border: `1px dashed ${C.borderStrong}`, borderRadius: 16 }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: .3 }}>◉</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Nenhum pedido encontrado</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Tente ajustar os filtros ou a busca</div>
                </div>
              ) : (
                <div className="ds-table-wrap" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.shadow }}>
                  <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                        {['ID', 'ESTUDANTE', 'CURSO / CLASSE', 'TIPO', 'DATA SAÍDA', 'STATUS', 'AÇÕES'].map(h => (
                          <th key={h} style={{
                            padding: '14px 16px', textAlign: 'left', fontWeight: 800, color: C.textMuted,
                            fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase',
                            borderBottom: `1px solid ${C.border}`
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((pedido, idx) => {
                        const statusColor = pedido.estado === 'APROVADO' ? C.success :
                          pedido.estado === 'REJEITADO' ? C.danger :
                          pedido.estado === 'EM_ANDAMENTO' ? C.warning : C.gold;
                        return (
                          <tr key={pedido.id} style={{
                            borderBottom: `1px solid ${idx % 2 === 0 ? C.border : 'transparent'}`,
                            transition: 'background .15s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.goldSoft; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                          >
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: C.gold }}>#{pedido.id}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 600, color: C.text }}>{pedido.estudante_nome}</div>
                              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{pedido.estudante_email || '-'}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ color: C.text, fontWeight: 500 }}>{pedido.estudante_curso || '-'}</div>
                              <div style={{ fontSize: 10, color: C.textMuted }}>{pedido.estudante_classe || '-'}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ display: 'inline-block', padding: '4px 10px', background: C.surfaceAlt, borderRadius: 6, fontSize: 10, fontWeight: 600, color: C.text }}>{pedido.tipo_display}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ color: C.text, fontWeight: 500 }}>{pedido.data_saida}</div>
                              <div style={{ fontSize: 10, color: C.textMuted }}>{pedido.hora_saida}</div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                background: `${statusColor}15`, color: statusColor,
                                border: `1px solid ${statusColor}20`
                              }}>{pedido.estado_display}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button onClick={() => setModalDetalhes(pedido)} style={{
                                  width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
                                  background: 'transparent', cursor: 'pointer', color: C.textMuted, fontSize: 11,
                                  display: 'grid', placeItems: 'center', transition: 'all .15s'
                                }} title="Ver detalhes">◈</button>
                                {pedido.acoes_disponiveis?.includes('aprovar') && (
                                  <button onClick={() => aprovarPedido(pedido.id)} style={{
                                    width: 30, height: 30, borderRadius: 8, border: 'none',
                                    background: C.success, color: '#fff', cursor: 'pointer', fontSize: 11,
                                    display: 'grid', placeItems: 'center', fontWeight: 800, transition: 'all .15s'
                                  }} title="Aprovar">✓</button>
                                )}
                                {pedido.acoes_disponiveis?.includes('rejeitar') && (
                                  <button onClick={() => rejeitarPedido(pedido.id)} style={{
                                    width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.danger}30`,
                                    background: `${C.danger}10`, color: C.danger, cursor: 'pointer', fontSize: 11,
                                    display: 'grid', placeItems: 'center', transition: 'all .15s'
                                  }} title="Rejeitar">✕</button>
                                )}
                                {pedido.estado === 'PENDENTE_DIRECAO' && (
                                  <button onClick={() => handleEncaminhar(pedido.id)} style={{
                                    width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.goldGlow}`,
                                    background: C.goldSoft, color: C.gold, cursor: 'pointer', fontSize: 11,
                                    display: 'grid', placeItems: 'center', transition: 'all .15s'
                                  }} title="Encaminhar">→</button>
                                )}
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
          )}
        </div>
      </main>

      {/* ==================== MODAL DETALHES ==================== */}
      {modalDetalhes && (
        <div onClick={() => setModalDetalhes(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} className="ds-fade-scale" style={{
            background: C.surface, borderRadius: 20, width: '100%', maxWidth: 520,
            border: `1px solid ${C.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Pedido #{modalDetalhes.id}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>{modalDetalhes.estudante_nome}</div>
              </div>
              <button onClick={() => setModalDetalhes(null)} style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                background: 'transparent', cursor: 'pointer', color: C.textMuted, fontSize: 14,
                display: 'grid', placeItems: 'center'
              }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { label: 'Curso', value: modalDetalhes.estudante_curso || '-' },
                { label: 'Classe', value: modalDetalhes.estudante_classe || '-' },
                { label: 'Email', value: modalDetalhes.estudante_email || '-' },
                { label: 'Tipo de Saída', value: modalDetalhes.tipo_display },
                { label: 'Data de Saída', value: modalDetalhes.data_saida },
                { label: 'Hora de Saída', value: modalDetalhes.hora_saida },
                { label: 'Hora de Retorno Prevista', value: modalDetalhes.hora_volta_prevista || '-' },
                { label: 'Status', value: modalDetalhes.estado_display },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: i < 7 ? 12 : 0, borderBottom: i < 7 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}

              {modalDetalhes.justificativa && (
                <div style={{
                  background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Justificativa</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{modalDetalhes.justificativa}</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px 24px', borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 10
            }}>
              {modalDetalhes.acoes_disponiveis?.includes('aprovar') && (
                <button onClick={() => { aprovarPedido(modalDetalhes.id); setModalDetalhes(null); }} style={{
                  flex: 1, padding: '12px 16px', background: C.success, color: '#fff', border: 'none',
                  borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit'
                }}>Aprovar</button>
              )}
              {modalDetalhes.acoes_disponiveis?.includes('rejeitar') && (
                <button onClick={() => { rejeitarPedido(modalDetalhes.id); setModalDetalhes(null); }} style={{
                  flex: 1, padding: '12px 16px', background: `${C.danger}10`, color: C.danger, border: `1px solid ${C.danger}30`,
                  borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit'
                }}>Rejeitar</button>
              )}
              {modalDetalhes.estado === 'PENDENTE_DIRECAO' && (
                <button onClick={() => { handleEncaminhar(modalDetalhes.id); setModalDetalhes(null); }} style={{
                  flex: 1, padding: '12px 16px', background: C.goldSoft, color: C.gold, border: `1px solid ${C.goldGlow}`,
                  borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit'
                }}>Encaminhar</button>
              )}
              {!modalDetalhes.acoes_disponiveis?.includes('aprovar') && !modalDetalhes.acoes_disponiveis?.includes('rejeitar') && modalDetalhes.estado !== 'PENDENTE_DIRECAO' && (
                <button onClick={() => setModalDetalhes(null)} style={{
                  flex: 1, padding: '12px 16px', background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`,
                  borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit'
                }}>Fechar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL GERAR RELATÓRIO ==================== */}
      {modalGerarRel && (
        <div onClick={() => setModalGerarRel(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} className="ds-fade-scale" style={{
            background: C.surface, borderRadius: 20, width: '100%', maxWidth: 440,
            border: `1px solid ${C.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            padding: 28
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: -.3 }}>Gerar Relatório</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 24 }}>Selecione o período para gerar o relatório.</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Data Início</label>
              <input type="date" value={relPeriodo.inicio} onChange={(e) => setRelPeriodo({ ...relPeriodo, inicio: e.target.value })} style={{
                width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none'
              }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Data Fim</label>
              <input type="date" value={relPeriodo.fim} onChange={(e) => setRelPeriodo({ ...relPeriodo, fim: e.target.value })} style={{
                width: '100%', padding: 12, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, fontFamily: 'inherit', fontSize: 13, outline: 'none'
              }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalGerarRel(false)} style={{
                flex: 1, padding: '12px 16px', background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 10, color: C.text, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit'
              }}>Cancelar</button>
              <button onClick={gerarRelatorio} disabled={gerando} style={{
                flex: 1, padding: '12px 16px', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
                color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                fontSize: 12, fontFamily: 'inherit', opacity: gerando ? 0.7 : 1
              }}>{gerando ? 'Gerando...' : 'Gerar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDITE;

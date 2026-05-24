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
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const navigate = useNavigate();

  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const isDark = themeMode === 'dark';

  const notifRef = useMemo(() => ({ current: null }), []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setThemeMode(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
    carregarColetivas();
    carregarRelatorios();
  }, [filtroEstado, filtroData]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      let url = `/pedidos/`;
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroData) params.append('data_saida', filtroData);
      if (params.toString()) url += `?${params.toString()}`;
      const [pedidosRes, statsRes] = await Promise.all([api.get(url), api.get('/dashboard/')]);
      setPedidos(pedidosRes.data.pedidos || []);
      setStats(statsRes.data);
    } catch (err) { console.error('Erro:', err); }
    finally { setLoading(false); }
  };

  const carregarColetivas = async () => {
    try { const res = await api.get('/coletivas/listar/'); setColetivas(res.data.coletivas || []); } catch (err) {}
  };

  const carregarRelatorios = async () => {
    try { const res = await api.get('/relatorios/'); setRelatorios(res.data.relatorios || []); } catch (err) {}
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoes(res.data.notificacoes || []);
      setNotificacoesNaoLidas(res.data.nao_lidas || 0);
    } catch (err) {}
  };

  const marcarNotificacaoLida = async (id) => {
    try { await api.post(`/notificacoes/${id}/ler/`); carregarNotificacoes(); } catch (err) {}
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      await carregarDados(); await carregarNotificacoes();
      alert(`Pedido ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const motivo = prompt('Motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else { alert(`Erro: ${msg}`); }
    }
  };

  const handleEncaminhar = async (pedidoId) => {
    if (!confirm('Encaminhar este pedido para a Administração?')) return;
    try {
      await api.post(`/pedidos/${pedidoId}/passar/`);
      await carregarDados(); await carregarNotificacoes();
      alert('Pedido encaminhado para a Administração!');
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar')); }
  };

  const gerarRelatorio = async () => {
    if (!dadosRelatorio.data_inicio || !dadosRelatorio.data_fim) { alert('Selecione o período do relatório'); return; }
    setGerandoRelatorio(true);
    try {
      await api.post('/relatorios/criar/', {
        titulo: `Relatório Direção - ${new Date().toLocaleDateString('pt-BR')}`,
        tipo: 'PERSONALIZADO', descricao: 'Relatório gerado pela Direção',
        data_inicio: dadosRelatorio.data_inicio, data_fim: dadosRelatorio.data_fim
      });
      alert('Relatório gerado com sucesso!');
      carregarRelatorios();
    } catch (err) { alert('Erro ao gerar relatório: ' + (err.response?.data?.error || err.message)); }
    finally { setGerandoRelatorio(false); setModalRelatorio(false); }
  };

  const baixarRelatorio = async (relatorioId) => {
    try {
      const response = await api.get(`/relatorios/download/${relatorioId}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `relatorio_${relatorioId}.csv`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { alert('Erro ao baixar relatório'); }
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p =>
      p.estudante_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm)
    );
  }, [pedidos, searchTerm]);

  const T = {
    bg: isDark ? '#050505' : '#ffffff',
    surface: isDark ? '#0f0f0f' : '#ffffff',
    surfaceAlt: isDark ? '#161616' : '#f4f4f5',
    border: isDark ? '#27272a' : '#e4e4e7',
    text: isDark ? '#fafafa' : '#09090b',
    textMuted: isDark ? '#a1a1aa' : '#71717a',
    textSoft: isDark ? '#52525b' : '#d4d4d8',
    accent: isDark ? '#ffffff' : '#000000',
    success: isDark ? '#d4d4d8' : '#3f3f46',
    warning: isDark ? '#a1a1aa' : '#71717a',
    radius: 16,
    shadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
    shadowHover: isDark ? '0 8px 40px rgba(0,0,0,0.7)' : '0 8px 40px rgba(0,0,0,0.1)',
    glass: isDark ? 'rgba(15,15,15,0.85)' : 'rgba(255,255,255,0.85)',
  };

  // ==================== SPEEDOMETER (COMPACTO) ====================
  const Speedometer = ({ value, max, label, size = 130 }) => {
    const pct = Math.min(value / Math.max(max, 1), 1);
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const cx = size / 2, cy = size / 2;
    const startAngle = -225;
    const endAngle = 45;
    const totalArc = endAngle - startAngle;
    const currentAngle = startAngle + (totalArc * pct);

    const polarToCartesian = (angle, r) => {
      const rad = (angle * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const describeArc = (startA, endA, r) => {
      const s = polarToCartesian(startA, r);
      const e = polarToCartesian(endA, r);
      const largeArc = Math.abs(endA - startA) > 180 ? 1 : 0;
      return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
    };

    const needleEnd = polarToCartesian(currentAngle, radius - 4);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative', width: size, height: size * 0.8, overflow: 'hidden' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'translateY(-10%)' }}>
            <path d={describeArc(startAngle, endAngle, radius)} fill="none" stroke={T.border} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d={describeArc(startAngle, currentAngle, radius)} fill="none" stroke={T.accent} strokeWidth={strokeWidth} strokeLinecap="round"
              style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke={T.accent} strokeWidth="2" strokeLinecap="round"
              style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <circle cx={cx} cy={cy} r="3" fill={T.accent} />
            <circle cx={cx} cy={cy} r="1.5" fill={T.bg} />
            {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
              const angle = startAngle + (totalArc * tick);
              const inner = polarToCartesian(angle, radius - 12);
              const outer = polarToCartesian(angle, radius - 6);
              return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={T.textMuted} strokeWidth="1" opacity="0.4" />;
            })}
          </svg>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== BAR CHART ====================
  const BarChart = ({ data, height = 120 }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height, padding: '16px 0 0', gap: 16 }}>
        {data.map((item, idx) => {
          const h = (item.value / maxVal) * 100;
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', maxWidth: 36, height: `${h}%`, background: item.color || T.accent, borderRadius: 4, transition: 'height 1s ease-out', opacity: 0.85, position: 'relative' }}>
                <span style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>{item.value}</span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, textAlign: 'center' }}>{item.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const Badge = ({ children, tone = 'default' }) => {
    const map = {
      default: { bg: T.surfaceAlt, fg: T.textMuted },
      active: { bg: isDark ? '#27272a' : '#e4e4e7', fg: T.text },
      success: { bg: isDark ? '#162216' : '#dcfce7', fg: T.success },
      warning: { bg: isDark ? '#221f16' : '#fef9c3', fg: T.warning },
      danger: { bg: isDark ? '#221616' : '#fee2e2', fg: T.warning },
    };
    const s = map[tone] || map.default;
    return (
      <span style={{ background: s.bg, color: s.fg, padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{children}</span>
    );
  };

  const TabBtn = ({ id, label, count, activeId }) => {
    const active = activeId === id;
    return (
      <button onClick={() => setFiltroEstado(id)} style={{
        padding: '10px 14px', border: 'none', width: '100%', textAlign: 'left',
        background: active ? T.surfaceAlt : 'transparent',
        color: active ? T.text : T.textMuted,
        fontWeight: active ? 600 : 400, fontSize: 13, borderRadius: 8,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all .2s ease', fontFamily: 'inherit'
      }}>
        <span>{label}</span>
        {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{count}</span>}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background .3s ease, color .3s ease' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.bg};-webkit-font-smoothing:antialiased}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInScale{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        .ds-fade{animation:fadeIn .3s ease both}
        .ds-fade-scale{animation:fadeInScale .3s ease both}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        .ds-grid-cards{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));}
        .ds-stats-row{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}
        @media(max-width:768px){
          .ds-sidebar{position:fixed!important;left:-280px!important;top:0!important;bottom:0!important;z-index:1000!important;transition:left .35s cubic-bezier(.4,0,.2,1)!important;}
          .ds-sidebar.open{left:0!important;box-shadow:0 0 60px rgba(0,0,0,.5)!important;}
          .ds-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999;backdrop-filter:blur(4px);}
          .ds-overlay.show{display:block;animation:fadeIn .2s ease;}
          .ds-mobile-toggle{display:flex!important;}
          .ds-main{margin-left:0!important;}
          .ds-stats-row{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
          .ds-content{padding:16px!important;}
          .ds-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
          .ds-table{min-width:600px;}
        }
        @media(max-width:480px){.ds-stats-row{grid-template-columns:1fr!important;}}
      `}</style>

      {/* Overlay Mobile */}
      <div className={`ds-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`ds-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 260, background: T.surface, borderRight: `1px solid ${T.border}`,
        padding: 0, display: 'flex', flexDirection: 'column', height: '100vh',
        position: 'sticky', top: 0, zIndex: 10, flexShrink: 0, overflowY: 'auto',
        transition: 'all .3s ease'
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: T.accent, borderRadius: 10, display: 'grid', placeItems: 'center', color: isDark ? '#000' : '#fff', fontWeight: 800, fontSize: 14 }}>D</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: -.3 }}>DIREÇÃO</div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>Gestão de Pedidos</div>
          </div>
        </div>

        <div style={{ margin: '16px 14px 0', padding: 12, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.accent, color: isDark ? '#000' : '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {(user?.nome || user?.username || 'D').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nome || user?.username}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>Administrador</div>
          </div>
        </div>

        <div style={{ padding: '20px 10px 8px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.textSoft, letterSpacing: 1.5, padding: '0 10px 8px', textTransform: 'uppercase' }}>Pedidos</div>
          <TabBtn id="PENDENTE_DIRECAO" label="Pendentes" count={stats.meus_pedidos_pendentes || 0} activeId={filtroEstado} />
          <div style={{ height: 4 }} />
          <TabBtn id="APROVADO" label="Aprovados" count={stats.pedidos_aprovados || 0} activeId={filtroEstado} />
          <div style={{ height: 4 }} />
          <TabBtn id="REJEITADO" label="Rejeitados" count={stats.pedidos_rejeitados || 0} activeId={filtroEstado} />
          <div style={{ height: 4 }} />
          <TabBtn id="EM_ANDAMENTO" label="Em Andamento" activeId={filtroEstado} />
          <div style={{ height: 4 }} />
          <TabBtn id="FINALIZADO" label="Finalizados" activeId={filtroEstado} />
        </div>

        <div style={{ padding: '0 10px', flex: 1 }}>
          <div style={{ borderTop: `1px solid ${T.border}`, margin: '8px 10px' }} />
          <button onClick={() => { setAbaAtiva('coletivas'); }} style={{
            width: '100%', padding: '10px 14px', border: 'none', background: abaAtiva === 'coletivas' ? T.surfaceAlt : 'transparent',
            color: abaAtiva === 'coletivas' ? T.text : T.textMuted, fontWeight: abaAtiva === 'coletivas' ? 600 : 400,
            fontSize: 13, borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
          }}>Coletivas</button>
          <div style={{ height: 4 }} />
          <button onClick={() => { setAbaAtiva('relatorios'); }} style={{
            width: '100%', padding: '10px 14px', border: 'none', background: abaAtiva === 'relatorios' ? T.surfaceAlt : 'transparent',
            color: abaAtiva === 'relatorios' ? T.text : T.textMuted, fontWeight: abaAtiva === 'relatorios' ? 600 : 400,
            fontSize: 13, borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
          }}>Relatórios</button>
        </div>

        <div style={{ padding: '12px 14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')} style={{
            width: '100%', padding: 10, background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 8, color: T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit'
          }}>
            {isDark ? 'MODO CLARO' : 'MODO ESCURO'}
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: 10, background: T.surfaceAlt, border: 'none',
            borderRadius: 8, color: T.text, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit'
          }}>SAIR</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ds-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <header style={{
          background: T.glass, borderBottom: `1px solid ${T.border}`, padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ds-mobile-toggle" style={{
              display: 'none', width: 36, height: 36, background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: 8, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: T.text, fontSize: 16
            }}>☰</button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: -.3 }}>
                {abaAtiva === 'pedidos' ? 'PEDIDOS' : abaAtiva === 'coletivas' ? 'COLETIVAS' : 'RELATÓRIOS'}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{filtroEstado.replace(/_/g, ' ').toLowerCase()}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} style={{
              background: T.surfaceAlt, border: `1px solid ${T.border}`, padding: '8px 10px',
              borderRadius: 8, color: T.text, fontFamily: 'inherit', fontSize: 12, outline: 'none'
            }} />
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifPanel(s => !s)} style={{
                width: 36, height: 36, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`,
                cursor: 'pointer', display: 'grid', placeItems: 'center', color: T.text, position: 'relative', fontSize: 14
              }}>
                ◉
                {notificacoesNaoLidas > 0 && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: T.accent, borderRadius: '50%' }} />}
              </button>
              {showNotifPanel && (
                <div className="ds-fade-scale" style={{
                  position: 'absolute', right: 0, top: 42, width: 300, background: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, zIndex: 50,
                  maxHeight: 400, overflowY: 'auto'
                }}>
                  <div style={{ padding: 12, borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Notificações</div>
                  {notificacoes.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>Nenhuma notificação</div>
                    : notificacoes.map(n => (
                      <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{ padding: 12, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{n.mensagem}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="ds-content" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* STATS ROW: 2 Speedometers + Chart + Cards */}
          <div className="ds-stats-row">
            {/* Speedometer 1: Pendentes */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Speedometer value={stats.meus_pedidos_pendentes || 0} max={Math.max(stats.total_pedidos || 10, 1)} label="Pendentes" />
            </div>

            {/* Speedometer 2: Aprovados */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Speedometer value={stats.pedidos_aprovados || 0} max={Math.max(stats.total_pedidos || 10, 1)} label="Aprovados" />
            </div>

            {/* Chart */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, flex: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Distribuição</div>
              <BarChart data={[
                { label: 'Pendentes', value: stats.meus_pedidos_pendentes || 0, color: T.warning },
                { label: 'Aprovados', value: stats.pedidos_aprovados || 0, color: T.success },
                { label: 'Rejeitados', value: stats.pedidos_rejeitados || 0, color: T.warning },
                { label: 'Total', value: stats.total_pedidos || 0, color: T.accent },
              ]} height={100} />
            </div>

            {/* Total Card */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Total Pedidos</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: T.text, lineHeight: 1, letterSpacing: -1 }}>{stats.total_pedidos || 0}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{pedidosFiltrados.length} na lista atual</div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input type="text" placeholder="BUSCAR ESTUDANTE OU ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
              flex: 1, minWidth: 200, padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.text, fontFamily: 'inherit', fontSize: 12, outline: 'none', letterSpacing: 0.5
            }} />
            <button onClick={() => setModalRelatorio(true)} style={{
              padding: '10px 20px', background: T.accent, color: isDark ? '#000' : '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit', letterSpacing: 0.5
            }}>
              GERAR RELATÓRIO
            </button>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['pedidos', 'coletivas', 'relatorios'].map(tab => (
              <button key={tab} onClick={() => setAbaAtiva(tab)} style={{
                padding: '8px 16px', border: `1px solid ${abaAtiva === tab ? T.accent : T.border}`,
                borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: abaAtiva === tab ? T.accent : 'transparent',
                color: abaAtiva === tab ? (isDark ? '#000' : '#fff') : T.textMuted,
                fontFamily: 'inherit', letterSpacing: 0.5, transition: 'all .2s ease'
              }}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ABA PEDIDOS */}
          {abaAtiva === 'pedidos' && (
            <div className="ds-fade">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ width: 32, height: 32, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin .8s linear infinite' }} />
                  <div style={{ color: T.textMuted, fontSize: 12 }}>Carregando...</div>
                </div>
              ) : pedidosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: T.textMuted, border: `1px dashed ${T.border}`, borderRadius: T.radius }}>
                  Nenhum pedido encontrado
                </div>
              ) : (
                <div className="ds-table-wrap" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
                  <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {['ID', 'ESTUDANTE', 'TIPO', 'DATA', 'STATUS', 'AÇÕES'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: T.textMuted, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map(pedido => (
                        <tr key={pedido.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: T.text }}>#{pedido.id}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: T.text }}>{pedido.estudante_nome}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{pedido.estudante_curso || '-'}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', background: T.surfaceAlt, borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{pedido.tipo_display}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ color: T.text }}>{pedido.data_saida}</div>
                            <div style={{ fontSize: 10, color: T.textMuted }}>{pedido.hora_saida}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                              background: pedido.estado === 'APROVADO' ? T.surfaceAlt : T.surfaceAlt,
                              color: pedido.estado === 'APROVADO' ? T.success : pedido.estado === 'REJEITADO' ? T.warning : T.text
                            }}>{pedido.estado_display}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => navigate(`/pedido/${pedido.id}`)} style={{
                                width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`,
                                background: 'transparent', cursor: 'pointer', color: T.text, fontSize: 10,
                                display: 'grid', placeItems: 'center'
                              }}>▸</button>
                              {pedido.acoes_disponiveis?.includes('aprovar') && (
                                <button onClick={() => handleAcao(pedido.id, 'aprovar')} style={{
                                  width: 28, height: 28, borderRadius: 6, border: 'none',
                                  background: T.accent, color: isDark ? '#000' : '#fff', cursor: 'pointer', fontSize: 10,
                                  display: 'grid', placeItems: 'center', fontWeight: 800
                                }}>✓</button>
                              )}
                              {pedido.acoes_disponiveis?.includes('rejeitar') && (
                                <button onClick={() => handleAcao(pedido.id, 'rejeitar')} style={{
                                  width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`,
                                  background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 10,
                                  display: 'grid', placeItems: 'center'
                                }}>✕</button>
                              )}
                              {pedido.estado === 'PENDENTE_DIRECAO' && (
                                <button onClick={() => handleEncaminhar(pedido.id)} style={{
                                  width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`,
                                  background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 10,
                                  display: 'grid', placeItems: 'center'
                                }}>→</button>
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
          )}

          {/* ABA COLETIVAS */}
          {abaAtiva === 'coletivas' && (
            <div className="ds-fade ds-grid-cards">
              {coletivas.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: T.textMuted, border: `1px dashed ${T.border}`, borderRadius: T.radius }}>Nenhuma saída coletiva</div>
                : coletivas.map(c => (
                  <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.titulo}</div>
                      <Badge tone={c.encerrada ? 'default' : 'success'}>{c.encerrada ? 'ENCERRADA' : 'ATIVA'}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: T.textMuted, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span>{c.data_saida?.split('T')[0]}</span>
                      <span>{c.data_volta?.split('T')[0]}</span>
                      <span>{c.criador_nome || c.criador}</span>
                    </div>
                    <div style={{ height: 4, background: T.surfaceAlt, borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${((c.total_aceitos || 0) / (c.total_convidados || 1)) * 100}%`, height: '100%', background: T.success, borderRadius: 2 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.textMuted }}>
                      <span><strong style={{ color: T.text }}>{c.total_convidados || 0}</strong> convidados</span>
                      <span><strong style={{ color: T.text }}>{c.total_aceitos || 0}</strong> aceitos</span>
                      <span><strong style={{ color: T.text }}>{c.total_recusados || 0}</strong> recusados</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ABA RELATÓRIOS */}
          {abaAtiva === 'relatorios' && (
            <div className="ds-fade ds-grid-cards">
              {relatorios.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: T.textMuted, border: `1px dashed ${T.border}`, borderRadius: T.radius }}>
                Nenhum relatório gerado
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setModalRelatorio(true)} style={{ padding: '8px 20px', background: T.accent, color: isDark ? '#000' : '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: 'inherit' }}>GERAR RELATÓRIO</button>
                </div>
              </div>
                : relatorios.map(r => (
                  <div key={r.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, boxShadow: T.shadow, cursor: 'pointer', transition: 'all .2s ease' }} onClick={() => baixarRelatorio(r.id)}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{r.titulo}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12 }}>{r.created_at}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: T.textMuted }}>Por: {r.criado_por}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 0.5 }}>BAIXAR CSV →</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL RELATÓRIO */}
      {modalRelatorio && (
        <div onClick={() => setModalRelatorio(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="ds-fade-scale" style={{ background: T.surface, padding: 24, borderRadius: 16, width: '100%', maxWidth: 420, border: `1px solid ${T.border}`, boxShadow: T.shadowHover }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 20 }}>GERAR RELATÓRIO</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Data Início</label>
              <input type="date" value={dadosRelatorio.data_inicio} onChange={(e) => setDadosRelatorio({ ...dadosRelatorio, data_inicio: e.target.value })} style={{ width: '100%', padding: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Data Fim</label>
              <input type="date" value={dadosRelatorio.data_fim} onChange={(e) => setDadosRelatorio({ ...dadosRelatorio, data_fim: e.target.value })} style={{ width: '100%', padding: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalRelatorio(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={gerarRelatorio} disabled={gerandoRelatorio} style={{ flex: 1, padding: 12, background: T.accent, border: 'none', borderRadius: 8, color: isDark ? '#000' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>{gerandoRelatorio ? 'Gerando...' : 'Gerar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDirecao;

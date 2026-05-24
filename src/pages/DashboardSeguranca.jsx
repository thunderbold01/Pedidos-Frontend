import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // ==================== ESTADOS (100% MANTIDOS) ====================
  const [pedidosSaida, setPedidosSaida] = useState([]);
  const [pedidosAndamento, setPedidosAndamento] = useState([]);
  const [pedidosFinalizados, setPedidosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('overview');
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const isDark = themeMode === 'dark';

  const notifRef = useRef(null);

  // ==================== EFEITOS ====================
  useEffect(() => {
    const atualizar = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    atualizar();
    const t = setInterval(atualizar, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setThemeMode(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotificacoes(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    carregarDashboard();
    carregarDados();
    carregarNotificacoes();
  }, [dataSelecionada]);

  // ==================== API CALLS ====================
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
    try { await api.post(`/notificacoes/${id}/ler/`); carregarNotificacoes(); } catch (err) {}
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
          return dataPedido === dataSelecionada && ['APROVADO', 'EM_ANDAMENTO', 'FINALIZADO'].includes(p.estado);
        });
        setPedidosSaida(filtrados.filter(p => p.estado === 'APROVADO'));
        setPedidosAndamento(filtrados.filter(p => p.estado === 'EM_ANDAMENTO'));
        setPedidosFinalizados(filtrados.filter(p => p.estado === 'FINALIZADO'));
      } catch (err2) { console.error('Fallback erro:', err2); }
    } finally { setLoading(false); }
  };

  const marcarSaida = async (pedidoId) => {
    if (!window.confirm('Confirmar SAÍDA?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      alert(`Saída registrada às ${response.data.hora}`);
      carregarDados(); carregarDashboard();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro ao marcar saída')); }
  };

  const marcarSaidaAjustada = async (pedidoId) => {
    const hora = window.prompt('Hora da SAÍDA (HH:MM):', '07:00');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) { alert('Formato inválido! Use HH:MM'); return; }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, { hora_saida: hora });
      alert(`Saída registrada: ${response.data.hora}`);
      carregarDados();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const marcarRetorno = async (pedidoId) => {
    if (!window.confirm('Confirmar RETORNO?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`);
      let msg = `Retorno às ${response.data.hora}`;
      if (response.data.atrasado) msg += `\nATRASO: ${response.data.tempo_atraso} minutos!`;
      alert(msg); carregarDados(); carregarDashboard();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const marcarRetornoAjustado = async (pedidoId) => {
    const hora = window.prompt('Hora do RETORNO (HH:MM):', '19:00');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) { alert('Formato inválido! Use HH:MM'); return; }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, { hora_retorno: hora });
      alert(`Retorno registrado: ${response.data.hora}`);
      carregarDados();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const gerarRelatorioCompleto = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seguranca/relatorio-completo/?data=${dataRelatorio}`);
      setRelatorio(response.data); setMostrarModalData(false);
      alert('Relatório completo gerado com sucesso!');
    } catch (err) { alert('Erro ao gerar relatório: ' + (err.response?.data?.error || err.message)); }
    finally { setLoading(false); }
  };

  const enviarRelatorio = async () => {
    if (!relatorio) return;
    setEnviando(true);
    try {
      await api.post('/seguranca/enviar-relatorio/', { data: relatorio.data, conteudo: relatorio.texto_relatorio });
      alert('Relatório enviado para DITE!'); setRelatorio(null);
    } catch (err) { alert('Erro ao enviar: ' + (err.response?.data?.error || err.message)); }
    finally { setEnviando(false); }
  };

  // ==================== HELPERS ====================
  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const d = new Date(dataStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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

  const totalDia = pedidosSaida.length + pedidosAndamento.length + pedidosFinalizados.length;
  const taxaConclusao = totalDia > 0 ? Math.round((pedidosFinalizados.length / totalDia) * 100) : 0;

  // ==================== DESIGN TOKENS (NEUTRO B&W) ====================
  const T = {
    bg: isDark ? '#050505' : '#ffffff',
    surface: isDark ? '#0f0f0f' : '#ffffff',
    surfaceAlt: isDark ? '#161616' : '#f4f4f5',
    border: isDark ? '#27272a' : '#e4e4e7',
    text: isDark ? '#fafafa' : '#09090b',
    textMuted: isDark ? '#a1a1aa' : '#71717a',
    textSoft: isDark ? '#52525b' : '#d4d4d8',
    accent: isDark ? '#ffffff' : '#000000',
    success: isDark ? '#e4e4e7' : '#3f3f46', // Neutral Success
    warning: isDark ? '#d4d4d8' : '#52525b', // Neutral Warning
    danger: isDark ? '#a1a1aa' : '#71717a',  // Neutral Danger
    radius: 16,
    shadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
    glass: isDark ? 'rgba(15,15,15,0.8)' : 'rgba(255,255,255,0.8)',
  };

  // ==================== COMPONENTES VISUAIS ====================

  // 1. SPEEDOMETER (Velocímetro de Carro Minimalista)
  const Speedometer = ({ value, max, label }) => {
    const pct = Math.min(value / Math.max(max, 1), 1);
    const size = 160;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const cx = size / 2, cy = size / 2;
    
    // Arco de 270 graus (de -225 a 45)
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: size, height: size * 0.85, overflow: 'hidden' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'translateY(-10%)' }}>
            {/* Background Track */}
            <path d={describeArc(startAngle, endAngle, radius)} fill="none" stroke={T.border} strokeWidth={strokeWidth} strokeLinecap="round" />
            
            {/* Active Arc (Gradient Simulation via Stroke) */}
            <path d={describeArc(startAngle, currentAngle, radius)} fill="none" stroke={T.accent} strokeWidth={strokeWidth} strokeLinecap="round" 
              style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: 'drop-shadow(0 0 4px rgba(128,128,128,0.3))' }} 
            />

            {/* Needle */}
            <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke={isDark ? '#fff' : '#000'} strokeWidth="2" strokeLinecap="round"
              style={{ transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            
            {/* Center Pivot */}
            <circle cx={cx} cy={cy} r="4" fill={isDark ? '#fff' : '#000'} />
            <circle cx={cx} cy={cy} r="2" fill={T.bg} />

            {/* Ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
              const angle = startAngle + (totalArc * tick);
              const inner = polarToCartesian(angle, radius - 15);
              const outer = polarToCartesian(angle, radius - 8);
              return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={T.textMuted} strokeWidth="1" opacity="0.5" />;
            })}
          </svg>
          
          {/* Digital Readout Overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
          </div>
        </div>
      </div>
    );
  };

  // 2. OVERVIEW CHART (Bar Chart Clean)
  const OverviewChart = () => {
    const data = [
      { label: 'Pendentes', value: pedidosSaida.length, color: T.warning },
      { label: 'Em Rota', value: pedidosAndamento.length, color: T.textMuted },
      { label: 'Concluídos', value: pedidosFinalizados.length, color: T.success },
    ];
    const maxVal = Math.max(...data.map(d => d.value), 1);

    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, padding: '20px 10px 0', gap: 20 }}>
        {data.map((item, idx) => {
          const heightPct = (item.value / maxVal) * 100;
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
              <div style={{ 
                width: '100%', maxWidth: 40, 
                height: `${heightPct}%`, 
                background: item.color, 
                borderRadius: 4, 
                transition: 'height 1s ease-out',
                opacity: 0.8,
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 12, fontWeight: 700, color: T.text
                }}>{item.value}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, textAlign: 'center' }}>{item.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const Badge = ({ children, tone = 'default' }) => {
    const styles = {
      default: { bg: T.surfaceAlt, fg: T.textMuted },
      active: { bg: isDark ? '#27272a' : '#e4e4e7', fg: T.text },
    };
    const s = styles[tone] || styles.default;
    return (
      <span style={{
        background: s.bg, color: s.fg, padding: '4px 10px', borderRadius: 6,
        fontSize: 10, fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase'
      }}>{children}</span>
    );
  };

  const TabBtn = ({ id, icon, label, count }) => {
    const active = abaAtiva === id;
    return (
      <button onClick={() => { setAbaAtiva(id); setSidebarOpen(false); }} style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '12px 16px', border: 'none',
        background: active ? T.surfaceAlt : 'transparent',
        color: active ? T.text : T.textMuted,
        fontWeight: active ? 600 : 500, fontSize: 13, borderRadius: 8,
        cursor: 'pointer', textAlign: 'left', transition: 'all .2s ease',
        position: 'relative', fontFamily: 'inherit'
      }}>
        {active && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: T.accent, borderRadius: 2 }} />}
        <span style={{ fontSize: 16, width: 22, textAlign: 'center', filter: 'grayscale(1)' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{count}</span>}
      </button>
    );
  };

  const PedidoCard = ({ p, tipo }) => {
    const isAction = tipo === 'saida' || tipo === 'andamento';
    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
        padding: 20, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: 16,
        transition: 'transform .2s ease, box-shadow .2s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 8px 30px rgba(0,0,0,0.6)' : '0 8px 30px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{p.estudante_nome}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{p.estudante_curso || 'Curso não informado'}</div>
          </div>
          <Badge tone={tipo === 'finalizado' ? 'default' : 'active'}>
            {tipo === 'saida' ? 'AGUARDANDO' : tipo === 'andamento' ? 'EM ROTA' : 'FINALIZADO'}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: T.surfaceAlt, padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>SAÍDA</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{tipo === 'saida' ? p.hora_saida_prevista : p.hora_saida_real || '-'}</div>
          </div>
          <div style={{ background: T.surfaceAlt, padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>RETORNO</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{tipo === 'finalizado' ? p.hora_volta_real : p.hora_volta_prevista || '-'}</div>
          </div>
        </div>

        {isAction && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={tipo === 'saida' ? () => marcarSaida(p.id) : () => marcarRetorno(p.id)} style={{
              flex: 1, padding: 12, background: T.accent, color: isDark ? '#000' : '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
              fontFamily: 'inherit', transition: 'opacity .2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
            >
              {tipo === 'saida' ? 'REGISTRAR SAÍDA' : 'REGISTRAR RETORNO'}
            </button>
            <button onClick={tipo === 'saida' ? () => marcarSaidaAjustada(p.id) : () => marcarRetornoAjustado(p.id)} style={{
              width: 44, background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, cursor: 'pointer', color: T.text, fontSize: 16,
              display: 'grid', placeItems: 'center'
            }}>
              ⏱
            </button>
          </div>
        )}
      </div>
    );
  };

  const EmptyState = ({ title }) => (
    <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: T.radius, color: T.textMuted }}>
      {title}
    </div>
  );

  const listas = {
    saida: { dados: saidaFiltrada, tipo: 'saida', vazio: 'Nenhum estudante aguardando.' },
    andamento: { dados: andamentoFiltrado, tipo: 'andamento', vazio: 'Ninguém em rota no momento.' },
    finalizado: { dados: finalizadosFiltrado, tipo: 'finalizado', vazio: 'Nenhum retorno registrado hoje.' },
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{margin:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ds-fade{animation:fadeIn .3s ease both}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        
        .ds-grid-cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));}
        .ds-stats-row{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}
        
        @media(max-width:768px){
          .ds-sidebar{position:fixed;left:-280px;top:0;bottom:0;z-index:1000;transition:left .3s ease;background:${T.surface};width:280px;}
          .ds-sidebar.open{left:0;box-shadow:0 0 50px rgba(0,0,0,0.5);}
          .ds-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;}
          .ds-overlay.show{display:block;}
          .ds-mobile-toggle{display:flex!important;}
          .ds-main{margin-left:0!important;}
          .ds-grid-cards{grid-template-columns:1fr;}
          .ds-content{padding:16px!important;}
        }
      `}</style>

      <div className={`ds-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`ds-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 260, background: T.surface, borderRight: `1px solid ${T.border}`,
        padding: 24, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: T.accent, borderRadius: 6 }} />
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>SEGURANÇA</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <TabBtn id="overview" icon="◫" label="Visão Geral" />
          <TabBtn id="saida" icon="○" label="Aguardando" count={pedidosSaida.length} />
          <TabBtn id="andamento" icon="→" label="Em Andamento" count={pedidosAndamento.length} />
          <TabBtn id="finalizado" icon="✓" label="Finalizados" count={pedidosFinalizados.length} />
        </nav>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')} style={{
            width: '100%', padding: 10, background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 8, color: T.text, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
          }}>
            {isDark ? 'MODO CLARO' : 'MODO ESCURO'}
          </button>
          <button onClick={onLogout} style={{
            width: '100%', padding: 10, background: T.surfaceAlt, border: 'none',
            borderRadius: 8, color: T.text, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
          }}>
            SAIR
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ds-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <header style={{
          background: T.glass, borderBottom: `1px solid ${T.border}`, padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 5,
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ds-mobile-toggle" style={{
              display: 'none', width: 32, height: 32, background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: 6, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: T.text
            }}>☰</button>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
                {abaAtiva === 'overview' ? 'VISÃO GERAL' : abaAtiva.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{formatarData(dataSelecionada)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} style={{
              background: T.surfaceAlt, border: `1px solid ${T.border}`, padding: '8px 12px',
              borderRadius: 8, color: T.text, fontFamily: 'inherit', fontSize: 13, outline: 'none'
            }} />
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotificacoes(s => !s)} style={{
                width: 36, height: 36, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`,
                cursor: 'pointer', display: 'grid', placeItems: 'center', color: T.text, position: 'relative'
              }}>
                🔔
                {notificacoesNaoLidas > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: T.accent, borderRadius: '50%', fontSize: 9, display: 'grid', placeItems: 'center', color: isDark ? '#000' : '#fff', fontWeight: 800 }}>{notificacoesNaoLidas}</span>}
              </button>
              {showNotificacoes && (
                <div className="ds-fade" style={{ position: 'absolute', right: 0, top: 44, width: 300, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, zIndex: 50, maxHeight: 400, overflowY: 'auto' }}>
                  <div style={{ padding: 12, borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 12 }}>NOTIFICAÇÕES</div>
                  {notificacoes.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>Nenhuma notificação</div>
                    : notificacoes.map(n => (
                      <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{ padding: 12, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{n.titulo || n.mensagem}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="ds-content" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* STATS AREA */}
          {abaAtiva === 'overview' && (
            <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* TOP ROW: 2 SPEEDOMETERS + CHART */}
              <div className="ds-stats-row">
                {/* Speedometer 1: Saídas */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: T.shadow }}>
                  <Speedometer value={pedidosSaida.length} max={Math.max(totalDia, 10)} label="Saídas Pendentes" />
                </div>

                {/* Speedometer 2: Retornos/Andamento */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: T.shadow }}>
                  <Speedometer value={pedidosAndamento.length} max={Math.max(totalDia, 10)} label="Em Andamento" />
                </div>

                {/* Overview Chart */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, display: 'flex', flexDirection: 'column', boxShadow: T.shadow, flex: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase' }}>Resumo do Dia</div>
                  <OverviewChart />
                </div>
              </div>

              {/* SECONDARY STATS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Total de Pedidos</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{totalDia}</div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Taxa de Conclusão</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{taxaConclusao}%</div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase' }}>Finalizados</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{pedidosFinalizados.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* TOOLBAR */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input type="text" placeholder="BUSCAR ESTUDANTE..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} style={{
              flex: 1, minWidth: 200, padding: '12px 16px', background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.text, fontFamily: 'inherit', fontSize: 13, outline: 'none'
            }} />
            <button onClick={() => setMostrarModalData(true)} style={{
              padding: '12px 24px', background: T.accent, color: isDark ? '#000' : '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit'
            }}>
              GERAR RELATÓRIO
            </button>
          </div>

          {/* LIST CONTENT */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Carregando...</div>
          ) : (
            <>
              {abaAtiva === 'overview' ? (
                <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: 'uppercase' }}>Próximas Saídas</h3>
                    <div className="ds-grid-cards">
                      {saidaFiltrada.slice(0, 3).map(p => <PedidoCard key={p.id} p={p} tipo="saida" />)}
                      {saidaFiltrada.length === 0 && <EmptyState title="Sem saídas pendentes" />}
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: 'uppercase' }}>Em Andamento</h3>
                    <div className="ds-grid-cards">
                      {andamentoFiltrado.slice(0, 3).map(p => <PedidoCard key={p.id} p={p} tipo="andamento" />)}
                      {andamentoFiltrado.length === 0 && <EmptyState title="Ninguém em rota" />}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ds-grid-cards ds-fade">
                  {listas[abaAtiva].dados.length === 0 ? <EmptyState title={listas[abaAtiva].vazio} />
                    : listas[abaAtiva].dados.map(p => <PedidoCard key={p.id} p={p} tipo={listas[abaAtiva].tipo} />)}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODALS */}
      {mostrarModalData && (
        <div onClick={() => setMostrarModalData(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Gerar Relatório</h3>
            <input type="date" value={dataRelatorio} onChange={e => setDataRelatorio(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 16, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setMostrarModalData(false)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={gerarRelatorioCompleto} style={{ padding: '10px 20px', background: T.accent, border: 'none', borderRadius: 8, color: isDark ? '#000' : '#fff', fontWeight: 700, cursor: 'pointer' }}>Gerar</button>
            </div>
          </div>
        </div>
      )}

      {relatorio && (
        <div onClick={() => setRelatorio(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'grid', placeItems: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, padding: 24, borderRadius: 16, width: '100%', maxWidth: 600, border: `1px solid ${T.border}`, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Relatório - {relatorio.data}</h3>
              <button onClick={() => setRelatorio(null)} style={{ background: 'none', border: 'none', color: T.text, fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12, color: T.textMuted, background: T.surfaceAlt, padding: 16, borderRadius: 8 }}>{relatorio.texto_relatorio}</pre>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setRelatorio(null)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, cursor: 'pointer' }}>Fechar</button>
              <button onClick={enviarRelatorio} disabled={enviando} style={{ padding: '10px 20px', background: T.accent, border: 'none', borderRadius: 8, color: isDark ? '#000' : '#fff', fontWeight: 700, cursor: 'pointer' }}>{enviando ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSeguranca;

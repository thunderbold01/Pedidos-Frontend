import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
    if (!window.confirm('✅ Confirmar SAÍDA?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      alert(`✅ Saída registrada às ${response.data.hora}`);
      carregarDados(); carregarDashboard();
    } catch (err) { alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao marcar saída')); }
  };

  const marcarSaidaAjustada = async (pedidoId) => {
    const hora = window.prompt('⏰ Hora da SAÍDA (HH:MM):', '07:00');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) { alert('❌ Formato inválido! Use HH:MM'); return; }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`, { hora_saida: hora });
      alert(`✅ Saída registrada: ${response.data.hora}`);
      carregarDados();
    } catch (err) { alert('❌ Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const marcarRetorno = async (pedidoId) => {
    if (!window.confirm('🔴 Confirmar RETORNO?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`);
      let msg = `✅ Retorno às ${response.data.hora}`;
      if (response.data.atrasado) msg += `\n⚠️ ATRASO: ${response.data.tempo_atraso} minutos!`;
      alert(msg); carregarDados(); carregarDashboard();
    } catch (err) { alert('❌ Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const marcarRetornoAjustado = async (pedidoId) => {
    const hora = window.prompt('⏰ Hora do RETORNO (HH:MM):', '19:00');
    if (!hora) return;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) { alert('❌ Formato inválido! Use HH:MM'); return; }
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-retorno/`, { hora_retorno: hora });
      alert(`✅ Retorno registrado: ${response.data.hora}`);
      carregarDados();
    } catch (err) { alert('❌ Erro: ' + (err.response?.data?.error || 'Erro')); }
  };

  const gerarRelatorioCompleto = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/seguranca/relatorio-completo/?data=${dataRelatorio}`);
      setRelatorio(response.data); setMostrarModalData(false);
      alert('✅ Relatório completo gerado com sucesso!');
    } catch (err) { alert('❌ Erro ao gerar relatório: ' + (err.response?.data?.error || err.message)); }
    finally { setLoading(false); }
  };

  const enviarRelatorio = async () => {
    if (!relatorio) return;
    setEnviando(true);
    try {
      await api.post('/seguranca/enviar-relatorio/', { data: relatorio.data, conteudo: relatorio.texto_relatorio });
      alert('✅ Relatório enviado para DITE!'); setRelatorio(null);
    } catch (err) { alert('❌ Erro ao enviar: ' + (err.response?.data?.error || err.message)); }
    finally { setEnviando(false); }
  };

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

  const T = {
    bg: isDark ? '#080808' : '#ffffff',
    bgSecondary: isDark ? '#0e0e0e' : '#f5f5f5',
    bgTertiary: isDark ? '#141414' : '#fafafa',
    surface: isDark ? '#111111' : '#ffffff',
    surfaceAlt: isDark ? '#1a1a1a' : '#f0f0f0',
    surfaceHover: isDark ? '#222222' : '#e8e8e8',
    border: isDark ? '#252525' : '#e5e5e5',
    borderStrong: isDark ? '#353535' : '#d4d4d4',
    text: isDark ? '#f0f0f0' : '#0a0a0a',
    textMuted: isDark ? '#808080' : '#666666',
    textSoft: isDark ? '#505050' : '#999999',
    accent: isDark ? '#ffffff' : '#0a0a0a',
    accentSoft: isDark ? '#ffffff10' : '#0a0a0a06',
    success: isDark ? '#4ade80' : '#16a34a',
    warning: isDark ? '#fbbf24' : '#d97706',
    danger: isDark ? '#f87171' : '#dc2626',
    info: isDark ? '#60a5fa' : '#2563eb',
    radius: 18,
    radiusSm: 12,
    shadow: isDark
      ? '0 1px 4px rgba(0,0,0,.6), 0 8px 32px rgba(0,0,0,.35)'
      : '0 1px 4px rgba(0,0,0,.06), 0 8px 32px rgba(0,0,0,.06)',
    shadowHover: isDark
      ? '0 4px 16px rgba(0,0,0,.7), 0 20px 48px rgba(0,0,0,.45)'
      : '0 4px 16px rgba(0,0,0,.1), 0 20px 48px rgba(0,0,0,.08)',
    shadowInner: isDark ? 'inset 0 2px 6px rgba(0,0,0,.6)' : 'inset 0 2px 6px rgba(0,0,0,.06)',
    glass: isDark ? 'rgba(17,17,17,.85)' : 'rgba(255,255,255,.85)',
    glassBorder: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
  };

  // ==================== GAUGE COMPONENT ====================
  const MonitorGauge = ({ value, max, label, subtitle, icon, color, accentIcon }) => {
    const pct = Math.min(value / Math.max(max, 1), 1);
    const size = 140;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2 - 4;
    const cx = size / 2, cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct * circumference);

    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
        padding: '24px 16px 18px', boxShadow: T.shadow, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
        transition: 'all .3s ease'
      }}>
        {/* Subtle top glow */}
        <div style={{
          position: 'absolute', top: -1, left: '20%', right: '20%', height: 1,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: .5
        }} />

        {/* Circular Progress */}
        <div style={{ position: 'relative', width: size, height: size }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`
          }} />

          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke={T.border} strokeWidth={strokeWidth} />
            {/* Progress */}
            <circle
              cx={cx} cy={cy} r={radius} fill="none"
              stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color}40)` }}
            />
            {/* Inner subtle ring */}
            <circle cx={cx} cy={cy} r={radius - 8} fill="none" stroke={T.border} strokeWidth="1" opacity=".3" />
          </svg>

          {/* Center content */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ fontSize: 18, marginBottom: 2, filter: 'grayscale(.3)' }}>{icon}</div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: T.text, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', letterSpacing: -.5
            }}>{value}</div>
            <div style={{ fontSize: 9, color: T.textSoft, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
              de {max}
            </div>
          </div>

          {/* Small dot indicator */}
          {value > 0 && (
            <div style={{
              position: 'absolute',
              width: 4, height: 4, borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}`,
              top: '50%', right: strokeWidth + 2,
              transform: 'translateY(-50%)'
            }} />
          )}
        </div>

        {/* Label */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: .3 }}>{label}</div>
          {subtitle && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{subtitle}</div>}
        </div>

        {/* Mini bar at bottom */}
        <div style={{
          width: '100%', height: 3, background: T.surfaceAlt, borderRadius: 2, overflow: 'hidden',
          marginTop: 2
        }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 2,
            transition: 'width .8s cubic-bezier(.4,0,.2,1)'
          }} />
        </div>
      </div>
    );
  };

  // ==================== DONUT CHART ====================
  const DonutChart = ({ data, size = 120 }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return (
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', opacity: .3 }}>
        <span style={{ fontSize: 24 }}>📊</span>
      </div>
    );
    const radius = 38;
    const cx = size / 2, cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = circumference * pct;
          const gap = circumference - dash;
          const rot = (accumulated / total) * 360 - 90;
          accumulated += d.value;
          return (
            <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
              stroke={d.color} strokeWidth={10}
              strokeDasharray={`${dash - 2} ${gap + 2}`}
              transform={`rotate(${rot} ${cx} ${cy})`}
              strokeLinecap="round"
              style={{ transition: 'all .8s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 4px ${d.color}30)` }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={T.text} fontSize="18" fontWeight="900" fontFamily="inherit">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={T.textMuted} fontSize="8" fontWeight="600" fontFamily="inherit" textTransform="uppercase" letterSpacing="1">Total</text>
      </svg>
    );
  };

  const Badge = ({ children, tone = 'primary' }) => {
    const map = {
      primary: [T.accentSoft, T.text],
      success: [isDark ? '#4ade8018' : '#16a34a15', T.success],
      warning: [isDark ? '#fbbf2418' : '#d9770615', T.warning],
      danger: [isDark ? '#f8717118' : '#dc262615', T.danger],
      info: [isDark ? '#60a5fa18' : '#2563eb15', T.info],
      muted: [T.surfaceAlt, T.textMuted],
    };
    const [bg, fg] = map[tone] || map.primary;
    return (
      <span style={{
        background: bg, color: fg, padding: '3px 10px', borderRadius: 999,
        fontSize: 10, fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase',
        border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'}`
      }}>{children}</span>
    );
  };

  const TabBtn = ({ id, icon, label, count, tone }) => {
    const active = abaAtiva === id;
    return (
      <button
        onClick={() => { setAbaAtiva(id); setSidebarOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '12px 16px', border: 'none',
          background: active ? T.accentSoft : 'transparent',
          color: active ? T.text : T.textMuted,
          fontWeight: active ? 700 : 500, fontSize: 13, borderRadius: 10,
          cursor: 'pointer', textAlign: 'left', transition: 'all .2s ease',
          position: 'relative', fontFamily: 'inherit'
        }}
      >
        {active && <span style={{
          position: 'absolute', left: 0, top: 12, bottom: 12, width: 3,
          background: T.accent, borderRadius: 0,
          boxShadow: `0 0 8px ${T.accent}40`
        }} />}
        <span style={{ fontSize: 16, width: 22, textAlign: 'center', filter: active ? 'none' : 'grayscale(1)' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {count > 0 && <Badge tone={tone || 'primary'}>{count}</Badge>}
      </button>
    );
  };

  const PedidoCard = ({ p, tipo }) => {
    const cfg = {
      saida: { tone: 'warning', emoji: '🎓', tag: 'Aguardando', primaryAct: { color: T.success, label: 'Registrar Saída', icon: '✅', fn: () => marcarSaida(p.id) }, adjustFn: () => marcarSaidaAjustada(p.id) },
      andamento: { tone: 'info', emoji: '🚶', tag: 'Em rota', primaryAct: { color: T.danger, label: 'Registrar Retorno', icon: '🔴', fn: () => marcarRetorno(p.id) }, adjustFn: () => marcarRetornoAjustado(p.id) },
      finalizado: { tone: 'success', emoji: '✅', tag: 'Concluído' },
    }[tipo];

    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
        padding: 20, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'all .25s cubic-bezier(.4,0,.2,1)', position: 'relative', overflow: 'hidden'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.shadowHover; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = isDark ? '#3a3a3a' : '#ccc'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = T.border; }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${cfg.tone === 'warning' ? T.warning : cfg.tone === 'info' ? T.info : T.success}, transparent)`,
          opacity: .5
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
            display: 'grid', placeItems: 'center', fontSize: 24, flexShrink: 0,
            boxShadow: T.shadowInner
          }}>{cfg.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.estudante_nome}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {p.estudante_curso || 'Curso não informado'}
            </div>
          </div>
          <Badge tone={cfg.tone}>{cfg.tag}</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoBox label={tipo === 'saida' ? '🚪 Saída prev.' : '✅ Saiu às'} value={tipo === 'saida' ? (p.hora_saida_prevista || '-') : (p.hora_saida_real || '-')} T={T} />
          <InfoBox label={tipo === 'finalizado' ? '🔙 Voltou às' : '⏰ Retorno prev.'} value={tipo === 'finalizado' ? (p.hora_volta_real || '-') : (p.hora_volta_prevista || '-')} T={T} />
        </div>

        {tipo === 'finalizado' && p.atrasado && (
          <div style={{
            background: isDark ? '#f8717112' : '#dc262610', color: T.danger, padding: '8px 12px',
            borderRadius: 10, fontSize: 12, fontWeight: 600, border: `1px solid ${isDark ? 'rgba(248,113,113,.15)' : 'rgba(220,38,38,.12)'}`
          }}>
            ⚠️ Atraso de {p.tempo_atraso} min
          </div>
        )}

        {cfg.primaryAct && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={cfg.primaryAct.fn}
              style={{
                flex: 1, padding: '12px 14px', background: cfg.primaryAct.color, color: isDark ? '#000' : '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
                boxShadow: `0 4px 12px ${cfg.primaryAct.color}33`,
                transition: 'all .2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}
            >
              <span>{cfg.primaryAct.icon}</span> {cfg.primaryAct.label}
            </button>
            <button
              onClick={cfg.adjustFn}
              title="Ajustar horário"
              style={{
                padding: '12px 14px', background: T.surfaceAlt, border: `1px solid ${T.border}`,
                borderRadius: 10, cursor: 'pointer', color: T.text, fontSize: 16,
                fontFamily: 'inherit', transition: 'all .2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.surfaceAlt; }}
            >⏱️</button>
          </div>
        )}
      </div>
    );
  };

  const InfoBox = ({ label, value, T }) => (
    <div style={{
      background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px',
      boxShadow: T.shadowInner
    }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );

  const EmptyState = ({ icon, title, hint }) => (
    <div style={{
      gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px',
      background: T.surface, border: `2px dashed ${T.borderStrong}`, borderRadius: T.radius,
      position: 'relative'
    }}>
      <div style={{ fontSize: 56, marginBottom: 12, opacity: .4, filter: 'grayscale(1)' }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const listas = {
    saida: { dados: saidaFiltrada, tipo: 'saida', vazio: { icon: '🎓', title: 'Nenhum estudante aguardando saída', hint: 'Quando houver, eles aparecem aqui.' } },
    andamento: { dados: andamentoFiltrado, tipo: 'andamento', vazio: { icon: '🚶', title: 'Ninguém em andamento', hint: 'Saídas ativas aparecerão nesta aba.' } },
    finalizado: { dados: finalizadosFiltrado, tipo: 'finalizado', vazio: { icon: '✅', title: 'Nenhum retorno finalizado ainda', hint: 'Conforme registros forem feitos, surgem aqui.' } },
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text,
      fontFamily: "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
      display: 'flex', transition: 'background .3s ease, color .3s ease'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        body{margin:0; -webkit-font-smoothing:antialiased; background:${T.bg}; color:${T.text}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInScale{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .ds-fade{animation:fadeIn .3s cubic-bezier(.4,0,.2,1) both}
        .ds-fade-scale{animation:fadeInScale .3s cubic-bezier(.4,0,.2,1) both}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:${isDark ? '#333' : '#ccc'};border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        input:focus,button:focus{outline:none}
        input:focus,button:focus{box-shadow:0 0 0 2px ${isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)'}}

        .ds-gauges{display:grid;gap:16px;grid-template-columns:repeat(4,1fr);}
        .ds-cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));}
        .ds-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}

        @media(max-width:1200px){.ds-gauges{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:768px){
          .ds-sidebar{position:fixed!important;left:-300px!important;top:0!important;bottom:0!important;transition:left .35s cubic-bezier(.4,0,.2,1);z-index:1000;width:280px!important;}
          .ds-sidebar.open{left:0!important;box-shadow:0 0 80px rgba(0,0,0,.5);}
          .ds-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999;backdrop-filter:blur(4px);animation:fadeIn .2s ease;}
          .ds-overlay.show{display:block;}
          .ds-mobile-toggle{display:flex!important;}
          .ds-main{margin-left:0!important;}
          .ds-gauges{grid-template-columns:repeat(2,1fr);gap:10px;}
          .ds-cards{grid-template-columns:1fr;}
          .ds-content{padding:16px!important;}
          .ds-report-btn-text{display:none}
          .ds-header-title{font-size:16px!important;}
          .ds-header-sub{font-size:11px!important;}
        }
        @media(max-width:420px){
          .ds-gauges{grid-template-columns:1fr 1fr;gap:8px;}
          .ds-toolbar{gap:8px;}
          .ds-search{min-width:100%!important;}
        }
      `}</style>

      <div className={`ds-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`ds-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 270, background: T.surface, borderRight: `1px solid ${T.border}`,
        padding: 0, display: 'flex', flexDirection: 'column', height: '100vh',
        position: 'sticky', top: 0, zIndex: 1001, flexShrink: 0, overflowY: 'auto',
        transition: 'background .3s ease, border .3s ease'
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: T.accent,
            display: 'grid', placeItems: 'center', color: isDark ? '#000' : '#fff',
            fontWeight: 900, fontSize: 20, boxShadow: `0 4px 12px ${isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)'}`
          }}>S</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -.3 }}>Segurança</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Controle de Portão</div>
          </div>
        </div>

        <div style={{ margin: '16px 14px 0', padding: 14, background: T.surfaceAlt, borderRadius: 14, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: T.accent, color: isDark ? '#000' : '#fff',
            display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0
          }}>
            {(user?.nome || user?.username || 'S').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.nome || user?.username || 'Usuário'}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, animation: 'pulse 2s infinite' }} /> Online
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '20px 10px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.textSoft, letterSpacing: 1.5, padding: '0 10px 10px', textTransform: 'uppercase' }}>Menu</div>
          <TabBtn id="overview" icon="📊" label="Visão Geral" />
          <TabBtn id="saida" icon="🚪" label="Aguardando" count={pedidosSaida.length} tone="warning" />
          <TabBtn id="andamento" icon="🚶" label="Em Andamento" count={pedidosAndamento.length} tone="info" />
          <TabBtn id="finalizado" icon="✅" label="Finalizados" count={pedidosFinalizados.length} tone="success" />
        </nav>

        <div style={{ padding: '0 14px 10px' }}>
          <button onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')} style={{
            width: '100%', padding: '10px 14px', background: T.surfaceAlt, color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer',
            fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit',
            transition: 'all .2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = T.surfaceAlt; }}
          >
            <span style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</span>
            <span style={{ flex: 1 }}>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            <div style={{
              width: 36, height: 20, borderRadius: 10, background: isDark ? T.accent : T.border,
              position: 'relative', transition: 'background .2s ease'
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: isDark ? '#000' : '#fff',
                position: 'absolute', top: 2, left: isDark ? 18 : 2, transition: 'left .2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,.3)'
              }} />
            </div>
          </button>
        </div>

        <div style={{ padding: '10px 14px 20px' }}>
          <button onClick={onLogout} style={{
            width: '100%', padding: '12px 14px', background: isDark ? '#dc262615' : '#dc262610',
            color: T.danger, border: `1px solid ${isDark ? 'rgba(220,38,38,.15)' : 'rgba(220,38,38,.1)'}`,
            borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', transition: 'all .2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <main className="ds-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          background: T.glass, borderBottom: `1px solid ${T.glassBorder}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)', transition: 'all .3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ds-mobile-toggle" style={{
              display: 'none', width: 40, height: 40, borderRadius: 12, background: T.surfaceAlt,
              border: `1px solid ${T.border}`, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0, color: T.text, fontFamily: 'inherit'
            }}>☰</button>
            <div style={{ minWidth: 0 }}>
              <div className="ds-header-title" style={{ fontSize: 20, fontWeight: 800, color: T.text, lineHeight: 1.1, letterSpacing: -.3 }}>
                {abaAtiva === 'overview' ? 'Visão Geral' :
                 abaAtiva === 'saida' ? 'Aguardando Saída' :
                 abaAtiva === 'andamento' ? 'Em Andamento' : 'Finalizados'}
              </div>
              <div className="ds-header-sub" style={{ fontSize: 12, color: T.textMuted, marginTop: 3, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🕒</span> {horaAtual} <span style={{ opacity: .4 }}>·</span> {formatarData(dataSelecionada)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12,
              transition: 'all .2s ease', cursor: 'pointer'
            }}>
              <span style={{ fontSize: 14, filter: 'grayscale(.5)' }}>📅</span>
              <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} style={{
                border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: T.text,
                fontFamily: 'inherit', outline: 'none', width: 140, cursor: 'pointer'
              }} />
            </div>

            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotificacoes(s => !s)} style={{
                width: 42, height: 42, borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`,
                cursor: 'pointer', fontSize: 17, position: 'relative', display: 'grid', placeItems: 'center',
                transition: 'all .2s ease', color: T.text
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.surfaceAlt; }}
              >
                🔔
                {notificacoesNaoLidas > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2, minWidth: 20, height: 20, padding: '0 6px',
                    background: T.danger, color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800,
                    display: 'grid', placeItems: 'center', border: `2px solid ${T.surface}`,
                    animation: 'pulse 2s infinite'
                  }}>{notificacoesNaoLidas}</span>
                )}
              </button>
              {showNotificacoes && (
                <div className="ds-fade-scale" style={{
                  position: 'absolute', right: 0, top: 50, width: 340, maxHeight: 420, overflowY: 'auto',
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
                  boxShadow: T.shadowHover, zIndex: 50, overflow: 'hidden'
                }}>
                  <div style={{
                    padding: 16, borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surfaceAlt
                  }}>
                    <span>Notificações</span>
                    {notificacoesNaoLidas > 0 && <Badge tone="danger">{notificacoesNaoLidas} novas</Badge>}
                  </div>
                  {notificacoes.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                      <div style={{ fontSize: 36, marginBottom: 8, opacity: .3 }}>🔔</div>
                      Sem notificações
                    </div>
                  ) : notificacoes.map(n => (
                    <div key={n.id} onClick={() => marcarNotificacaoLida(n.id)} style={{
                      padding: 14, borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
                      background: n.lida ? 'transparent' : T.accentSoft, transition: 'background .15s ease'
                    }}
                    onMouseEnter={(e) => { if (!n.lida) e.currentTarget.style.background = T.surfaceHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = n.lida ? 'transparent' : T.accentSoft; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{n.titulo || n.mensagem}</div>
                      {n.titulo && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{n.mensagem}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="ds-content" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* GAUGES */}
          <div className="ds-gauges">
            <MonitorGauge value={pedidosSaida.length} max={Math.max(totalDia, 10)} label="Aguardando Saída" subtitle="Na portaria" icon="🚪" color={T.warning} />
            <MonitorGauge value={pedidosAndamento.length} max={Math.max(totalDia, 10)} label="Em Andamento" subtitle="Fora da unidade" icon="🚶" color={T.info} />
            <MonitorGauge value={pedidosFinalizados.length} max={Math.max(totalDia, 10)} label="Retornaram" subtitle="Concluídos" icon="✅" color={T.success} />
            <MonitorGauge value={taxaConclusao} max={100} label="Taxa Conclusão" subtitle={`${totalDia} pedidos`} icon="📈" color={T.accent} />
          </div>

          {/* SECONDARY STATS with Donut */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
            padding: 24, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', gap: 20,
            transition: 'all .3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Donut */}
              <DonutChart data={[
                { value: pedidosSaida.length, color: T.warning },
                { value: pedidosAndamento.length, color: T.info },
                { value: pedidosFinalizados.length, color: T.success },
                { value: stats.atrasos_hoje || 0, color: T.danger },
              ]} size={110} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                  📊 Distribuição do Dia
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <LegendItem color={T.warning} label="Pendentes" value={pedidosSaida.length} T={T} />
                  <LegendItem color={T.info} label="Em andamento" value={pedidosAndamento.length} T={T} />
                  <LegendItem color={T.success} label="Finalizados" value={pedidosFinalizados.length} T={T} />
                  <LegendItem color={T.danger} label="Atrasos" value={stats.atrasos_hoje || 0} T={T} />
                </div>
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 14,
            boxShadow: T.shadow, transition: 'all .3s ease'
          }}>
            <div className="ds-toolbar">
              <div className="ds-search" style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 14, pointerEvents: 'none' }}>🔍</span>
                <input
                  type="text" placeholder="Buscar por nome ou curso..." value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', background: T.surfaceAlt,
                    border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, color: T.text,
                    fontFamily: 'inherit', outline: 'none', transition: 'all .2s ease'
                  }}
                  onFocus={(e) => { e.currentTarget.borderColor = isDark ? '#555' : '#aaa'; }}
                  onBlur={(e) => { e.currentTarget.borderColor = T.border; }}
                />
              </div>
              <button onClick={() => setMostrarModalData(true)} style={{
                padding: '12px 20px', background: T.accent, color: isDark ? '#000' : '#fff', border: 'none',
                borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                boxShadow: `0 4px 12px ${isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'}`,
                transition: 'all .2s ease', whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}
              >
                📄 <span className="ds-report-btn-text">Gerar Relatório</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 80, textAlign: 'center', background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
              <div style={{ width: 44, height: 44, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin .8s linear infinite' }} />
              <div style={{ color: T.textMuted, fontSize: 14, fontWeight: 500 }}>Carregando dados...</div>
            </div>
          ) : (
            <>
              {abaAtiva === 'overview' && (
                <div className="ds-fade" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <SectionTitle T={T} title="🚪 Próximas Saídas" count={saidaFiltrada.length} onSeeAll={() => setAbaAtiva('saida')} />
                  <div className="ds-cards">
                    {saidaFiltrada.length === 0 ? <EmptyState icon="🎓" title="Nenhuma saída pendente" hint="Quando houver, eles aparecem aqui." /> : saidaFiltrada.slice(0, 3).map(p => <PedidoCard key={p.id} p={p} tipo="saida" />)}
                  </div>
                  <SectionTitle T={T} title="🚶 Em Andamento" count={andamentoFiltrado.length} onSeeAll={() => setAbaAtiva('andamento')} />
                  <div className="ds-cards">
                    {andamentoFiltrado.length === 0 ? <EmptyState icon="🚶" title="Ninguém em rota agora" hint="Saídas ativas aparecerão nesta aba." /> : andamentoFiltrado.slice(0, 3).map(p => <PedidoCard key={p.id} p={p} tipo="andamento" />)}
                  </div>
                  <SectionTitle T={T} title="✅ Finalizados Recentes" count={finalizadosFiltrado.length} onSeeAll={() => setAbaAtiva('finalizado')} />
                  <div className="ds-cards">
                    {finalizadosFiltrado.length === 0 ? <EmptyState icon="✅" title="Nenhum retorno finalizado" hint="Conforme registros forem feitos, surgem aqui." /> : finalizadosFiltrado.slice(0, 3).map(p => <PedidoCard key={p.id} p={p} tipo="finalizado" />)}
                  </div>
                </div>
              )}
              {['saida', 'andamento', 'finalizado'].includes(abaAtiva) && (
                <div className="ds-cards ds-fade">
                  {listas[abaAtiva].dados.length === 0 ? <EmptyState {...listas[abaAtiva].vazio} /> : listas[abaAtiva].dados.map(p => <PedidoCard key={p.id} p={p} tipo={listas[abaAtiva].tipo} />)}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ==================== MODALS ==================== */}
      {mostrarModalData && (
        <Modal onClose={() => setMostrarModalData(false)} T={T} isDark={isDark}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>📄 Gerar Relatório</h3>
          <p style={{ color: T.textMuted, fontSize: 13, margin: '8px 0 20px' }}>Selecione a data para gerar o relatório completo do dia.</p>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.text, display: 'block', marginBottom: 8 }}>Data</label>
          <input type="date" value={dataRelatorio} onChange={(e) => setDataRelatorio(e.target.value)} style={{
            display: 'block', width: '100%', padding: 14, border: `1px solid ${T.border}`, borderRadius: 12,
            fontSize: 14, fontFamily: 'inherit', outline: 'none', background: T.surfaceAlt, color: T.text, transition: 'all .2s ease'
          }}
          onFocus={(e) => { e.currentTarget.borderColor = isDark ? '#555' : '#aaa'; }}
          onBlur={(e) => { e.currentTarget.borderColor = T.border; }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button onClick={() => setMostrarModalData(false)} style={btnSecondary(T)}>Cancelar</button>
            <button onClick={gerarRelatorioCompleto} style={btnPrimary(T, isDark)}>Gerar</button>
          </div>
        </Modal>
      )}

      {relatorio && (
        <Modal onClose={() => setRelatorio(null)} T={T} wide isDark={isDark}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>📋 Relatório - {relatorio.data}</h3>
            <button onClick={() => setRelatorio(null)} style={{
              background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: T.textMuted,
              width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 10, transition: 'background .15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceAlt; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >×</button>
          </div>
          <pre style={{
            background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20,
            fontSize: 12, color: T.text, maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.7
          }}>
            {relatorio.texto_relatorio}
          </pre>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={() => setRelatorio(null)} style={btnSecondary(T)}>Fechar</button>
            <button onClick={enviarRelatorio} disabled={enviando} style={{ ...btnPrimary(T, isDark), opacity: enviando ? .6 : 1 }}>
              {enviando ? 'Enviando...' : '📤 Enviar para DITE'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== AUX ====================
const SectionTitle = ({ T, title, count, onSeeAll }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -.3 }}>
      {title} <span style={{ color: T.textMuted, fontWeight: 600, fontSize: 14 }}>· {count}</span>
    </div>
    {count > 3 && (
      <button onClick={onSeeAll} style={{
        background: 'none', border: 'none', color: T.text, fontWeight: 700, fontSize: 13,
        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 12px', borderRadius: 8, transition: 'background .15s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceAlt; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
      >Ver todos →</button>
    )}
  </div>
);

const LegendItem = ({ color, label, value, T }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  </div>
);

const Modal = ({ children, onClose, T, wide, isDark }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 2000,
    padding: 20, animation: 'fadeIn .25s cubic-bezier(.4,0,.2,1) both'
  }}>
    <div onClick={(e) => e.stopPropagation()} className="ds-fade-scale" style={{
      background: T.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: wide ? 760 : 440,
      boxShadow: '0 24px 80px rgba(0,0,0,.4)', border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'}`,
      maxHeight: '90vh', overflowY: 'auto'
    }}>{children}</div>
  </div>
);

const btnPrimary = (T, isDark) => ({
  padding: '12px 22px', background: T.accent, color: isDark ? '#000' : '#fff', border: 'none',
  borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
  boxShadow: `0 4px 12px ${isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'}`, transition: 'all .2s ease'
});
const btnSecondary = (T) => ({
  padding: '12px 22px', background: T.surfaceAlt, color: T.text, border: `1px solid ${T.border}`,
  borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all .2s ease'
});

export default DashboardSeguranca;

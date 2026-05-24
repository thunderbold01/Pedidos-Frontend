// src/pages/DashboardSeguranca.jsx
// REDESIGN MODERNO — 100% compatível desktop & mobile
// ✅ Toda a lógica, estados e chamadas de API preservados
// ✅ Mesmos endpoints do Django (via ../api)
// ✅ Mesmas props (user, onLogout) e mesmo comportamento
//
// Stack visual: design tokens inline + CSS variables + grid responsivo
// Não precisa instalar nada novo.

import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
  // ==================== ESTADOS (100% MANTIDOS) ====================
  const [pedidosSaida, setPedidosSaida] = useState([]);
  const [pedidosAndamento, setPedidosAndamento] = useState([]);
  const [pedidosFinalizados, setPedidosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('overview'); // novo default: overview
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

  const notifRef = useRef(null);

  // ==================== RELÓGIO ====================
  useEffect(() => {
    const atualizar = () => setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    atualizar();
    const t = setInterval(atualizar, 1000);
    return () => clearInterval(t);
  }, []);

  // Fecha popover de notificações clicando fora
  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotificacoes(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ==================== CARREGAR DADOS (100% MANTIDO) ====================
  useEffect(() => {
    carregarDashboard();
    carregarDados();
    carregarNotificacoes();
    // eslint-disable-next-line
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
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
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
          return dataPedido === dataSelecionada &&
            ['APROVADO', 'EM_ANDAMENTO', 'FINALIZADO'].includes(p.estado);
        });
        setPedidosSaida(filtrados.filter(p => p.estado === 'APROVADO'));
        setPedidosAndamento(filtrados.filter(p => p.estado === 'EM_ANDAMENTO'));
        setPedidosFinalizados(filtrados.filter(p => p.estado === 'FINALIZADO'));
      } catch (err2) { console.error('Fallback erro:', err2); }
    } finally { setLoading(false); }
  };

  // ==================== AÇÕES (100% MANTIDAS) ====================
  const marcarSaida = async (pedidoId) => {
    if (!window.confirm('✅ Confirmar SAÍDA?')) return;
    try {
      const response = await api.post(`/pedidos/${pedidoId}/marcar-saida/`);
      alert(`✅ Saída registrada às ${response.data.hora}`);
      carregarDados(); carregarDashboard();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao marcar saída'));
    }
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
      alert(msg);
      carregarDados(); carregarDashboard();
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
      setRelatorio(response.data);
      setMostrarModalData(false);
      alert('✅ Relatório completo gerado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao gerar relatório: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const enviarRelatorio = async () => {
    if (!relatorio) return;
    setEnviando(true);
    try {
      await api.post('/seguranca/enviar-relatorio/', { data: relatorio.data, conteudo: relatorio.texto_relatorio });
      alert('✅ Relatório enviado para DITE!');
      setRelatorio(null);
    } catch (err) {
      alert('❌ Erro ao enviar: ' + (err.response?.data?.error || err.message));
    } finally { setEnviando(false); }
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

  // ==================== DESIGN TOKENS ====================
  const T = {
    bg: '#F6F7FB',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFBFD',
    border: '#E6E8EF',
    borderStrong: '#D5D8E2',
    text: '#0F172A',
    textMuted: '#64748B',
    textSoft: '#94A3B8',
    primary: '#4F46E5',
    primarySoft: '#EEF0FF',
    success: '#059669',
    successSoft: '#E6F7F1',
    warning: '#D97706',
    warningSoft: '#FEF3E2',
    danger: '#DC2626',
    dangerSoft: '#FEE9EA',
    info: '#0284C7',
    infoSoft: '#E0F2FE',
    radius: 14,
    radiusSm: 10,
    shadow: '0 1px 2px rgba(15,23,42,.04), 0 4px 12px rgba(15,23,42,.04)',
    shadowHover: '0 8px 24px rgba(15,23,42,.08)',
  };

  // ==================== SUB COMPONENTES ====================
  const Badge = ({ children, tone = 'primary' }) => {
    const map = {
      primary: [T.primarySoft, T.primary],
      success: [T.successSoft, T.success],
      warning: [T.warningSoft, T.warning],
      danger:  [T.dangerSoft, T.danger],
      info:    [T.infoSoft, T.info],
      muted:   ['#EEF1F6', T.textMuted],
    };
    const [bg, fg] = map[tone] || map.primary;
    return (
      <span style={{
        background: bg, color: fg, padding: '4px 10px', borderRadius: 999,
        fontSize: 11, fontWeight: 700, letterSpacing: .3, textTransform: 'uppercase'
      }}>{children}</span>
    );
  };

  const StatCard = ({ icon, label, value, tone, hint }) => {
    const map = { primary: T.primary, success: T.success, warning: T.warning, danger: T.danger, info: T.info };
    const c = map[tone] || T.primary;
    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
        padding: 18, boxShadow: T.shadow, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, ${c}10, transparent 60%)`, pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14, position:'relative' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: `${c}1A`,
            color: c, display:'grid', placeItems:'center', fontSize: 18
          }}>{icon}</div>
          <span style={{ fontSize: 32, fontWeight: 800, color: T.text, lineHeight: 1 }}>{value}</span>
        </div>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 600, position:'relative' }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, position:'relative' }}>{hint}</div>}
      </div>
    );
  };

  const TabBtn = ({ id, icon, label, count, tone }) => {
    const active = abaAtiva === id;
    return (
      <button
        onClick={() => { setAbaAtiva(id); setSidebarOpen(false); }}
        style={{
          display:'flex', alignItems:'center', gap: 12, width:'100%',
          padding: '11px 14px', border: 'none',
          background: active ? T.primarySoft : 'transparent',
          color: active ? T.primary : T.textMuted,
          fontWeight: active ? 700 : 500, fontSize: 14, borderRadius: 10,
          cursor: 'pointer', textAlign:'left', transition: 'all .15s ease',
          position:'relative'
        }}
      >
        {active && <span style={{ position:'absolute', left:-12, top:8, bottom:8, width:3, background:T.primary, borderRadius:3 }} />}
        <span style={{ fontSize: 16, width: 20, textAlign:'center' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {count > 0 && <Badge tone={tone || 'primary'}>{count}</Badge>}
      </button>
    );
  };

  const PedidoCard = ({ p, tipo }) => {
    const cfg = {
      saida: { tone:'warning', emoji:'🎓', tag:'Aguardando', primaryAct: { color: T.success, label: 'Registrar Saída', icon: '✅', fn: () => marcarSaida(p.id) }, adjustFn: () => marcarSaidaAjustada(p.id) },
      andamento: { tone:'info', emoji:'🚶', tag:'Em rota', primaryAct: { color: T.danger, label: 'Registrar Retorno', icon: '🔴', fn: () => marcarRetorno(p.id) }, adjustFn: () => marcarRetornoAjustado(p.id) },
      finalizado: { tone:'success', emoji:'✅', tag:'Concluído' },
    }[tipo];

    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
        padding: 18, boxShadow: T.shadow, display:'flex', flexDirection:'column', gap: 14,
        transition: 'all .2s ease'
      }}
      onMouseEnter={(e)=>{ e.currentTarget.style.boxShadow = T.shadowHover; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={(e)=>{ e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform='translateY(0)'; }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${T.primarySoft}`, display:'grid', placeItems:'center', fontSize: 22, flexShrink:0
          }}>{cfg.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {p.estudante_nome}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {p.estudante_curso || 'Curso não informado'}
            </div>
          </div>
          <Badge tone={cfg.tone}>{cfg.tag}</Badge>
        </div>

        {/* Info grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          <InfoBox label={tipo === 'saida' ? '🚪 Saída prev.' : '✅ Saiu às'} value={tipo === 'saida' ? (p.hora_saida_prevista || '-') : (p.hora_saida_real || '-')} />
          <InfoBox label={tipo === 'finalizado' ? '🔙 Voltou às' : '⏰ Retorno prev.'} value={tipo === 'finalizado' ? (p.hora_volta_real || '-') : (p.hora_volta_prevista || '-')} />
        </div>

        {tipo === 'finalizado' && p.atrasado && (
          <div style={{ background: T.dangerSoft, color: T.danger, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
            ⚠️ Atraso de {p.tempo_atraso} min
          </div>
        )}

        {/* Ações */}
        {cfg.primaryAct && (
          <div style={{ display:'flex', gap: 8 }}>
            <button
              onClick={cfg.primaryAct.fn}
              style={{
                flex: 1, padding: '12px 14px', background: cfg.primaryAct.color, color:'#fff',
                border:'none', borderRadius: 10, cursor:'pointer', fontWeight: 700, fontSize: 13,
                display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
                boxShadow: `0 4px 10px ${cfg.primaryAct.color}33`
              }}
            >
              <span>{cfg.primaryAct.icon}</span> {cfg.primaryAct.label}
            </button>
            <button
              onClick={cfg.adjustFn}
              title="Ajustar horário"
              style={{
                padding: '12px 14px', background: T.surfaceAlt, border: `1px solid ${T.border}`,
                borderRadius: 10, cursor:'pointer', color: T.text, fontSize: 16
              }}
            >⏱️</button>
          </div>
        )}
      </div>
    );
  };

  const InfoBox = ({ label, value }) => (
    <div style={{ background: T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontVariantNumeric:'tabular-nums' }}>{value}</div>
    </div>
  );

  const EmptyState = ({ icon, title, hint }) => (
    <div style={{ gridColumn:'1/-1', textAlign:'center', padding: '60px 20px', background: T.surface, border:`1px dashed ${T.borderStrong}`, borderRadius: T.radius }}>
      <div style={{ fontSize: 56, marginBottom: 12, opacity: .6 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const listas = {
    saida: { dados: saidaFiltrada, tipo: 'saida', vazio: { icon: '🎓', title: 'Nenhum estudante aguardando saída', hint: 'Quando houver, eles aparecem aqui.' } },
    andamento: { dados: andamentoFiltrado, tipo: 'andamento', vazio: { icon: '🚶', title: 'Ninguém em andamento', hint: 'Saídas ativas aparecerão nesta aba.' } },
    finalizado: { dados: finalizadosFiltrado, tipo: 'finalizado', vazio: { icon: '✅', title: 'Nenhum retorno finalizado ainda', hint: 'Conforme registros forem feitos, surgem aqui.' } },
  };

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", display: 'flex' }}>
      {/* CSS GLOBAL */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        body{margin:0; -webkit-font-smoothing:antialiased}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.4}}
        .ds-fade{animation:fadeIn .25s ease both}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
        input:focus, button:focus{outline: 2px solid ${T.primary}33; outline-offset: 1px}

        /* GRID RESPONSIVO */
        .ds-cards{display:grid; gap:16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));}
        .ds-stats{display:grid; gap:16px; grid-template-columns: repeat(4, 1fr);}
        .ds-toolbar{display:flex; gap:12px; align-items:center; flex-wrap:wrap;}

        @media (max-width: 1100px){ .ds-stats{grid-template-columns: repeat(2, 1fr);} }
        @media (max-width: 768px){
          .ds-sidebar{position:fixed; left:-280px; top:0; bottom:0; transition:left .3s ease; z-index:1000;}
          .ds-sidebar.open{left:0; box-shadow:0 0 60px rgba(0,0,0,.25);}
          .ds-overlay{display:none; position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:999; backdrop-filter: blur(2px);}
          .ds-overlay.show{display:block; animation:fadeIn .2s ease;}
          .ds-mobile-toggle{display:flex !important;}
          .ds-main{margin-left:0 !important;}
          .ds-header-title{font-size:18px !important;}
          .ds-stats{grid-template-columns: repeat(2, 1fr); gap:10px;}
          .ds-cards{grid-template-columns:1fr;}
          .ds-content{padding:16px !important;}
          .ds-report-btn-text{display:none}
        }
        @media (max-width: 420px){
          .ds-stats{grid-template-columns: 1fr;}
        }
      `}</style>

      {/* OVERLAY MOBILE */}
      <div className={`ds-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ==================== SIDEBAR ==================== */}
      <aside className={`ds-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 260, background: T.surface, borderRight: `1px solid ${T.border}`,
        padding: 20, display:'flex', flexDirection:'column', gap: 18, height:'100vh', position:'sticky', top:0
      }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap: 12, padding: '4px 4px 16px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, #7C3AED)`, display:'grid', placeItems:'center', color:'#fff', fontWeight:800, fontSize:18, boxShadow:`0 6px 14px ${T.primary}55` }}>S</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Segurança</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Controle de Portão</div>
          </div>
        </div>

        {/* User chip */}
        <div style={{ display:'flex', alignItems:'center', gap: 10, padding: 12, background: T.surfaceAlt, borderRadius: 12, border:`1px solid ${T.border}` }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.primary, color:'#fff', display:'grid', placeItems:'center', fontWeight:800, fontSize:14 }}>
            {(user?.nome || user?.username || 'S').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.nome || user?.username || 'Usuário'}</div>
            <div style={{ fontSize: 11, color: T.textMuted, display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background: T.success, animation:'pulseDot 2s infinite' }} /> Online
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display:'flex', flexDirection:'column', gap: 4, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.textSoft, letterSpacing:1.2, padding:'4px 14px 6px' }}>MENU</div>
          <TabBtn id="overview"   icon="📊" label="Visão Geral"  />
          <TabBtn id="saida"      icon="🚪" label="Aguardando"   count={pedidosSaida.length}        tone="warning" />
          <TabBtn id="andamento"  icon="🚶" label="Em Andamento" count={pedidosAndamento.length}    tone="info" />
          <TabBtn id="finalizado" icon="✅" label="Finalizados"  count={pedidosFinalizados.length}  tone="success" />
        </nav>

        {/* Logout */}
        <button onClick={onLogout} style={{
          padding: '12px 14px', background: T.dangerSoft, color: T.danger, border:'none',
          borderRadius: 10, cursor:'pointer', fontWeight: 700, fontSize: 13, display:'flex', alignItems:'center', gap: 10
        }}>
          🚪 <span>Sair</span>
        </button>
      </aside>

      {/* ==================== MAIN ==================== */}
      <main className="ds-main" style={{ flex: 1, minWidth: 0, display:'flex', flexDirection:'column' }}>
        {/* HEADER */}
        <header style={{
          background: T.surface, borderBottom: `1px solid ${T.border}`,
          padding: '14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12,
          position:'sticky', top:0, zIndex: 10, backdropFilter:'blur(8px)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 12, minWidth:0 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ds-mobile-toggle" style={{
              display:'none', width: 38, height: 38, borderRadius: 10, background: T.surfaceAlt,
              border:`1px solid ${T.border}`, cursor:'pointer', alignItems:'center', justifyContent:'center', fontSize: 16
            }}>☰</button>
            <div style={{ minWidth: 0 }}>
              <div className="ds-header-title" style={{ fontSize: 20, fontWeight: 800, color: T.text, lineHeight:1.1 }}>
                {abaAtiva === 'overview' ? 'Visão Geral' :
                 abaAtiva === 'saida' ? 'Aguardando Saída' :
                 abaAtiva === 'andamento' ? 'Em Andamento' : 'Finalizados'}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontVariantNumeric:'tabular-nums' }}>
                🕒 {horaAtual} · {formatarData(dataSelecionada)}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            {/* Date picker */}
            <div style={{ display:'flex', alignItems:'center', gap: 6, padding: '8px 12px', background: T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius: 10 }}>
              <span>📅</span>
              <input type="date" value={dataSelecionada} onChange={(e)=>setDataSelecionada(e.target.value)} style={{
                border:'none', background:'transparent', fontSize: 13, fontWeight:600, color: T.text, fontFamily:'inherit', outline:'none', width: 130
              }} />
            </div>

            {/* Notificações */}
            <div ref={notifRef} style={{ position:'relative' }}>
              <button onClick={()=>setShowNotificacoes(s=>!s)} style={{
                width: 40, height: 40, borderRadius: 10, background: T.surfaceAlt, border:`1px solid ${T.border}`,
                cursor:'pointer', fontSize: 16, position:'relative'
              }}>
                🔔
                {notificacoesNaoLidas > 0 && (
                  <span style={{
                    position:'absolute', top: 4, right: 4, minWidth: 18, height: 18, padding:'0 5px',
                    background: T.danger, color:'#fff', borderRadius: 9, fontSize: 10, fontWeight: 800,
                    display:'grid', placeItems:'center', border:`2px solid ${T.surface}`
                  }}>{notificacoesNaoLidas}</span>
                )}
              </button>
              {showNotificacoes && (
                <div className="ds-fade" style={{
                  position:'absolute', right: 0, top: 48, width: 340, maxHeight: 420, overflowY:'auto',
                  background: T.surface, border:`1px solid ${T.border}`, borderRadius: 12,
                  boxShadow:'0 12px 32px rgba(15,23,42,.12)', zIndex: 50
                }}>
                  <div style={{ padding: 14, borderBottom:`1px solid ${T.border}`, fontWeight: 700, fontSize: 13 }}>
                    Notificações {notificacoesNaoLidas > 0 && <Badge tone="danger">{notificacoesNaoLidas} novas</Badge>}
                  </div>
                  {notificacoes.length === 0 ? (
                    <div style={{ padding: 24, textAlign:'center', color: T.textMuted, fontSize: 13 }}>Sem notificações</div>
                  ) : notificacoes.map(n => (
                    <div key={n.id} onClick={()=>marcarNotificacaoLida(n.id)} style={{
                      padding: 12, borderBottom:`1px solid ${T.border}`, cursor:'pointer',
                      background: n.lida ? 'transparent' : T.primarySoft
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{n.titulo || n.mensagem}</div>
                      {n.titulo && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{n.mensagem}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="ds-content" style={{ padding: 24, display:'flex', flexDirection:'column', gap: 20 }}>
          {/* STATS */}
          <div className="ds-stats">
            <StatCard icon="🚪" label="Aguardando Saída" value={pedidosSaida.length} tone="warning" hint="Estudantes na portaria" />
            <StatCard icon="🚶" label="Em Andamento"     value={pedidosAndamento.length} tone="info" hint="Fora da unidade" />
            <StatCard icon="✅" label="Finalizados"      value={pedidosFinalizados.length} tone="success" hint="Retornaram hoje" />
            <StatCard icon="📈" label="Taxa de Conclusão" value={`${taxaConclusao}%`} tone="primary" hint={`${totalDia} pedidos no dia`} />
          </div>

          {/* TOOLBAR */}
          <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius, padding: 14, boxShadow: T.shadow }}>
            <div className="ds-toolbar">
              <div style={{ position:'relative', flex: 1, minWidth: 220 }}>
                <span style={{ position:'absolute', left: 14, top:'50%', transform:'translateY(-50%)', color: T.textMuted }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nome ou curso..."
                  value={filtroNome}
                  onChange={(e)=>setFiltroNome(e.target.value)}
                  style={{
                    width:'100%', padding:'12px 14px 12px 40px',
                    background: T.surfaceAlt, border:`1px solid ${T.border}`,
                    borderRadius: 10, fontSize: 14, color: T.text, fontFamily:'inherit', outline:'none'
                  }}
                />
              </div>
              <button onClick={()=>setMostrarModalData(true)} style={{
                padding: '12px 18px', background: T.primary, color:'#fff', border:'none',
                borderRadius: 10, cursor:'pointer', fontWeight: 700, fontSize: 13,
                display:'flex', alignItems:'center', gap: 8, boxShadow:`0 6px 14px ${T.primary}40`
              }}>
                📄 <span className="ds-report-btn-text">Gerar Relatório</span>
              </button>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div style={{ padding: 60, textAlign:'center', background: T.surface, borderRadius: T.radius, border:`1px solid ${T.border}` }}>
              <div style={{ width: 40, height: 40, border:`3px solid ${T.border}`, borderTopColor: T.primary, borderRadius:'50%', margin:'0 auto 14px', animation:'spin .8s linear infinite' }} />
              <div style={{ color: T.textMuted, fontSize: 14 }}>Carregando dados...</div>
            </div>
          ) : (
            <>
              {/* ===== OVERVIEW ===== */}
              {abaAtiva === 'overview' && (
                <div className="ds-fade" style={{ display:'flex', flexDirection:'column', gap: 20 }}>
                  {/* Seção: próximas saídas */}
                  <SectionTitle T={T} title="🚪 Próximas Saídas" count={saidaFiltrada.length} onSeeAll={()=>setAbaAtiva('saida')} />
                  <div className="ds-cards">
                    {saidaFiltrada.length === 0
                      ? <EmptyState icon="🎓" title="Nenhuma saída pendente" />
                      : saidaFiltrada.slice(0, 3).map(p => <PedidoCard key={p.id} p={p} tipo="saida" />)}
                  </div>

                  <SectionTitle T={T} title="🚶 Em Andamento" count={andamentoFiltrado.length} onSeeAll={()=>setAbaAtiva('andamento')} />
                  <div className="ds-cards">
                    {andamentoFiltrado.length === 0
                      ? <EmptyState icon="🚶" title="Ninguém em rota agora" />
                      : andamentoFiltrado.slice(0, 3).map(p => <PedidoCard key={p.id} p={p} tipo="andamento" />)}
                  </div>
                </div>
              )}

              {/* ===== ABAS DE LISTA ===== */}
              {['saida','andamento','finalizado'].includes(abaAtiva) && (
                <div className="ds-cards ds-fade">
                  {listas[abaAtiva].dados.length === 0
                    ? <EmptyState {...listas[abaAtiva].vazio} />
                    : listas[abaAtiva].dados.map(p => <PedidoCard key={p.id} p={p} tipo={listas[abaAtiva].tipo} />)}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ==================== MODAL RELATÓRIO ==================== */}
      {mostrarModalData && (
        <Modal onClose={()=>setMostrarModalData(false)} T={T}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>📄 Gerar Relatório</h3>
          <p style={{ color: T.textMuted, fontSize: 13, margin:'8px 0 16px' }}>Selecione a data para gerar o relatório completo do dia.</p>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Data</label>
          <input type="date" value={dataRelatorio} onChange={(e)=>setDataRelatorio(e.target.value)} style={{
            display:'block', width:'100%', marginTop: 6, padding: 12,
            border:`1px solid ${T.border}`, borderRadius: 10, fontSize: 14, fontFamily:'inherit', outline:'none', background: T.surfaceAlt
          }} />
          <div style={{ display:'flex', gap: 10, marginTop: 20, justifyContent:'flex-end' }}>
            <button onClick={()=>setMostrarModalData(false)} style={btnSecondary(T)}>Cancelar</button>
            <button onClick={gerarRelatorioCompleto} style={btnPrimary(T)}>Gerar</button>
          </div>
        </Modal>
      )}

      {/* ==================== MODAL VISUALIZAR RELATÓRIO ==================== */}
      {relatorio && (
        <Modal onClose={()=>setRelatorio(null)} T={T} wide>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>📋 Relatório - {relatorio.data}</h3>
            <button onClick={()=>setRelatorio(null)} style={{ background:'none', border:'none', fontSize: 22, cursor:'pointer', color: T.textMuted }}>×</button>
          </div>
          <pre style={{
            background: T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius: 10, padding: 16,
            fontSize: 12, color: T.text, maxHeight: 400, overflow:'auto', whiteSpace:'pre-wrap', fontFamily:"'JetBrains Mono', monospace"
          }}>
            {relatorio.texto_relatorio}
          </pre>
          <div style={{ display:'flex', gap: 10, marginTop: 16, justifyContent:'flex-end' }}>
            <button onClick={()=>setRelatorio(null)} style={btnSecondary(T)}>Fechar</button>
            <button onClick={enviarRelatorio} disabled={enviando} style={{ ...btnPrimary(T), opacity: enviando ? .6 : 1 }}>
              {enviando ? 'Enviando...' : '📤 Enviar para DITE'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== AUX COMPONENTS (FORA) ====================
const SectionTitle = ({ T, title, count, onSeeAll }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>
      {title} <span style={{ color: T.textMuted, fontWeight: 600 }}>· {count}</span>
    </div>
    {count > 3 && (
      <button onClick={onSeeAll} style={{
        background:'none', border:'none', color: T.primary, fontWeight: 700, fontSize: 13, cursor:'pointer'
      }}>Ver todos →</button>
    )}
  </div>
);

const Modal = ({ children, onClose, T, wide }) => (
  <div onClick={onClose} style={{
    position:'fixed', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(4px)',
    display:'grid', placeItems:'center', zIndex: 2000, padding: 16, animation:'fadeIn .2s ease'
  }}>
    <div onClick={(e)=>e.stopPropagation()} style={{
      background:'#fff', borderRadius: 16, padding: 24, width:'100%', maxWidth: wide ? 720 : 420,
      boxShadow:'0 24px 60px rgba(0,0,0,.25)'
    }}>{children}</div>
  </div>
);

const btnPrimary = (T) => ({
  padding:'10px 18px', background: T.primary, color:'#fff', border:'none',
  borderRadius: 10, cursor:'pointer', fontWeight: 700, fontSize: 13
});
const btnSecondary = (T) => ({
  padding:'10px 18px', background: T.surfaceAlt, color: T.text, border:`1px solid ${T.border}`,
  borderRadius: 10, cursor:'pointer', fontWeight: 600, fontSize: 13
});

export default DashboardSeguranca;

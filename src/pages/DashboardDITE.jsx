// src/pages/DashboardDITE.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Ícones SVG
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
);
const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);
const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const PrinterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 12H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
);
const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

const DashboardDITE = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DITE');
  const [filtroData, setFiltroData] = useState('');
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState([]);
  const [modalEncaminhar, setModalEncaminhar] = useState(null);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [showColetiva, setShowColetiva] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form Coletiva
  const [formColetiva, setFormColetiva] = useState({
    titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24'
  });
  const [loadingColetiva, setLoadingColetiva] = useState(false);
  const [errorColetiva, setErrorColetiva] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { carregarDados(); carregarNotificacoes(); }, [filtroEstado, filtroData]);

  const carregarDados = async () => {
    try {
      let url = `/pedidos/?estado=${filtroEstado}`;
      if (filtroData) url += `&data_saida=${filtroData}`;
      const [pedidosRes, statsRes] = await Promise.all([api.get(url), api.get('/dashboard/')]);
      setPedidos(pedidosRes.data.pedidos || []);
      setStats(statsRes.data);
    } catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas);
      setNotificacoes(res.data.notificacoes || []);
    } catch (err) {}
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      await api.post(`/pedidos/${pedidoId}/${acao}/`, comentario ? { comentario } : {});
      carregarDados(); carregarNotificacoes();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && msg.includes('motivo')) {
        const m = prompt('Motivo da rejeição:'); if (m) handleAcao(pedidoId, acao, m);
      } else alert('Erro: ' + msg);
    }
  };

  const handleEncaminhar = async (pedidoId, destino) => {
    try {
      await api.post(`/pedidos/${pedidoId}/passar-dite/`, { destino });
      setModalEncaminhar(null); carregarDados(); carregarNotificacoes();
    } catch (err) { alert('Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar')); }
  };

  const marcarNotificacaoLida = async (id) => {
    try { await api.post(`/notificacoes/${id}/ler/`); carregarNotificacoes(); } catch (err) {}
  };

  const criarColetiva = async (e) => {
    e.preventDefault();
    if (!formColetiva.titulo || !formColetiva.data_saida || !formColetiva.data_volta) {
      setErrorColetiva('Preencha todos os campos obrigatórios'); return;
    }
    setLoadingColetiva(true); setErrorColetiva('');
    try {
      await api.post('/pedidos/coletiva/criar/', formColetiva);
      alert('✅ Saída coletiva criada com sucesso!');
      setShowColetiva(false);
      setFormColetiva({ titulo: '', descricao: '', data_saida: '', data_volta: '', prazo_horas: '24' });
    } catch (err) { setErrorColetiva(err.response?.data?.error || 'Erro ao criar'); }
    finally { setLoadingColetiva(false); }
  };

  const menuItems = [
    { id: 'PENDENTE_DITE', label: 'Pendentes', icon: <ClipboardIcon />, count: stats.meus_pedidos_pendentes },
    { id: 'PENDENTE_DIRECAO', label: 'Em Análise', icon: <ClockIcon /> },
    { id: 'APROVADO', label: 'Aprovados', icon: <CheckIcon /> },
    { id: 'REJEITADO', label: 'Rejeitados', icon: <XIcon /> },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#f8fafc}
        @keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .dash{display:flex;min-height:100vh}
        .sidebar{position:fixed;top:0;left:0;height:100vh;background:#fff;border-right:1px solid #e2e8f0;z-index:100;display:flex;flex-direction:column;transition:all .3s;box-shadow:4px 0 30px rgba(0,0,0,.03)}
        .sidebar-header{padding:24px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:12px}
        .logo-circle{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 4px 15px rgba(239,68,68,.3);flex-shrink:0}
        .logo-text{font-size:18px;font-weight:800;background:linear-gradient(135deg,#1a1a2e,#0f3460);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .collapse-btn{width:30px;height:30px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;flex-shrink:0}
        .nav-section{flex:1;padding:14px 10px;display:flex;flex-direction:column;gap:3px;overflow-y:auto}
        .nav-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:500;color:#475569;border-radius:10px;width:100%;text-align:left;font-family:'Inter',sans-serif;position:relative}
        .nav-item:hover{background:#f8fafc;color:#0f3460}
        .nav-item.active{background:rgba(220,38,38,.06);color:#dc2626;font-weight:600}
        .nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:linear-gradient(180deg,#dc2626,#06b6d4);border-radius:0 3px 3px 0}
        .nav-icon{width:22px;display:flex;align-items:center;justify-content:center;color:#94a3b8;flex-shrink:0}
        .nav-item:hover .nav-icon,.nav-item.active .nav-icon{color:#dc2626}
        .nav-badge{background:#ef4444;color:#fff;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
        .nav-badge-mini{position:absolute;top:4px;right:4px;width:7px;height:7px;background:#ef4444;border-radius:50%;box-shadow:0 0 0 3px #fff}
        .nav-divider{height:1px;background:#e2e8f0;margin:8px 14px}
        .main-content{flex:1;padding:24px;transition:margin-left .3s;min-height:100vh}
        .top-bar{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;margin-bottom:24px}
        .mobile-menu-btn{width:42px;height:42px;border:none;background:#fff;border-radius:12px;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
        .user-avatar{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#dc2626,#06b6d4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}
        .icon-btn{width:38px;height:38px;border:1px solid #e2e8f0;background:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;position:relative}
        .icon-btn-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;color:#fff;border-radius:50%;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px}
        .stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 3px rgba(0,0,0,.03);animation:slideUp .4s ease-out}
        .stat-icon-wrap{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .stat-value{font-size:28px;font-weight:800;color:#0f172a;line-height:1}
        .stat-label{font-size:11px;color:#94a3b8;margin-top:4px;font-weight:500}
        .filters-bar{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
        .tabs-group{display:flex;gap:3px;background:#f8fafc;padding:3px;border-radius:10px}
        .tab-btn{padding:8px 14px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:600;color:#64748b;border-radius:8px;font-family:'Inter',sans-serif;white-space:nowrap;display:flex;align-items:center;gap:6px}
        .tab-btn.active{background:#fff;color:#dc2626;box-shadow:0 2px 6px rgba(0,0,0,.06)}
        .tab-count{background:#e2e8f0;color:#64748b;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700}
        .tab-btn.active .tab-count{background:#dc2626;color:#fff}
        .date-input{padding:8px 14px;border:2px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;outline:none}
        .clear-btn{padding:8px 14px;background:#fee2e2;color:#dc2626;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;font-family:'Inter',sans-serif}
        .table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
        .data-table{width:100%;border-collapse:collapse}
        .data-table th{text-align:left;padding:12px 14px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0;background:#f8fafc;white-space:nowrap}
        .data-table td{padding:14px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;vertical-align:middle}
        .data-table tbody tr:hover{background:#f8fafc}
        .student-name{font-weight:600;color:#0f172a}
        .student-email{font-size:11px;color:#94a3b8;margin-top:2px}
        .type-badge{display:inline-block;padding:3px 8px;background:#f1f5f9;color:#475569;border-radius:5px;font-size:11px;font-weight:600}
        .status-badge{display:inline-block;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        .action-btns{display:flex;gap:5px}
        .action-btn{width:34px;height:34px;border:1px solid #e2e8f0;background:#fff;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .2s}
        .action-btn:hover{background:#f8fafc;border-color:#06b6d4;color:#06b6d4}
        .empty-state{text-align:center;padding:80px 20px;color:#94a3b8}
        .loading-state{text-align:center;padding:80px 20px}
        .spinner{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#dc2626;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 14px}
        .notif-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:200;backdrop-filter:blur(2px)}
        .notif-panel{position:fixed;top:0;right:0;width:360px;max-width:90vw;height:100vh;background:#fff;box-shadow:-10px 0 40px rgba(0,0,0,.1);z-index:201;animation:slideUp .3s}
        .notif-header{padding:20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
        .notif-list{overflow-y:auto;height:calc(100vh - 70px)}
        .notif-item{padding:14px 18px;border-bottom:1px solid #f1f5f9;cursor:pointer;position:relative}
        .notif-item:hover{background:#f8fafc}
        .notif-dot{position:absolute;top:16px;right:16px;width:7px;height:7px;background:#06b6d4;border-radius:50%}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:300;backdrop-filter:blur(3px)}
        .modal-content{background:#fff;border-radius:18px;width:90%;max-width:460px;box-shadow:0 25px 50px rgba(0,0,0,.2);animation:slideUp .3s;max-height:90vh;overflow-y:auto}
        .modal-header{padding:20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
        .modal-close{width:30px;height:30px;border:none;background:#f1f5f9;border-radius:8px;cursor:pointer;color:#64748b}
        .modal-body{padding:20px}
        .modal-options{display:flex;flex-direction:column;gap:10px;margin-top:14px}
        .modal-option-btn{display:flex;align-items:center;gap:14px;padding:16px;border:2px solid #e2e8f0;background:#fff;border-radius:12px;cursor:pointer;text-align:left;font-family:'Inter',sans-serif}
        .modal-option-btn:hover{border-color:#06b6d4;background:#f0f9ff;transform:translateX(3px)}
        .field{margin-bottom:14px}
        .label{display:block;font-size:10px;font-weight:700;color:#64748b;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}
        .input,.textarea{width:100%;padding:10px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;color:#1e293b;background:#f8fafc;outline:none;font-family:'Inter',sans-serif}
        .input:focus,.textarea:focus{border-color:#06b6d4;box-shadow:0 0 0 3px rgba(6,182,212,.1)}
        .textarea{min-height:70px;resize:vertical}
        .btn{width:100%;padding:12px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif}
        .btn-primary{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;box-shadow:0 4px 15px rgba(220,38,38,.25)}
        .btn-secondary{background:#fff;border:2px solid #e2e8f0;color:#64748b}
        .btn:disabled{opacity:.5}
        @media(max-width:768px){
          .sidebar{transform:translateX(-100%)}.sidebar.mobile-open{transform:translateX(0)}
          .main-content{margin-left:0!important;padding:14px}
          .mobile-menu-btn{display:flex}.stats-grid{grid-template-columns:1fr 1fr;gap:8px}
          .stat-card{padding:14px}.stat-value{font-size:22px}
          .filters-bar{flex-direction:column;align-items:stretch}.tabs-group{overflow-x:auto}
        }
      `}</style>

      <div className="dash">
        {isMobile && mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:99}} />}
        
        <div className={`sidebar ${isMobile && mobileMenuOpen ? 'mobile-open' : ''}`} style={{width:sidebarCollapsed&&!isMobile?'72px':'250px'}}>
          <div className="sidebar-header">
            <div className="logo-circle">D</div>
            {(!sidebarCollapsed||isMobile) && <span className="logo-text">DITE</span>}
            {!isMobile && <button onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} className="collapse-btn">{sidebarCollapsed?<ChevronRightIcon/>:<ChevronLeftIcon/>}</button>}
          </div>
          <div className="nav-section">
            {menuItems.map(item=>(
              <button key={item.id} onClick={()=>{setFiltroEstado(item.id);if(isMobile)setMobileMenuOpen(false)}} className={`nav-item ${filtroEstado===item.id?'active':''}`} title={sidebarCollapsed&&!isMobile?item.label:''}>
                <span className="nav-icon">{item.icon}</span>
                {(!sidebarCollapsed||isMobile) && <><span>{item.label}</span>{item.count>0&&<span className="nav-badge">{item.count}</span>}</>}
                {sidebarCollapsed&&!isMobile&&item.count>0&&<span className="nav-badge-mini"/>}
              </button>
            ))}
          </div>
          <div className="nav-divider"/>
          <div className="nav-section" style={{flex:'0 0 auto'}}>
            <button onClick={()=>setShowColetiva(true)} className="nav-item" style={{color:'#059669'}}>
              <span className="nav-icon" style={{color:'#059669'}}><UsersIcon/></span>
              {(!sidebarCollapsed||isMobile) && <span>Nova Coletiva</span>}
            </button>
            <button onClick={()=>setShowNotificacoes(!showNotificacoes)} className="nav-item">
              <span className="nav-icon"><BellIcon/></span>
              {(!sidebarCollapsed||isMobile) && <><span>Notificações</span>{notificacoesNaoLidas>0&&<span className="nav-badge">{notificacoesNaoLidas}</span>}</>}
            </button>
            <button onClick={()=>navigate('/relatorios')} className="nav-item">
              <span className="nav-icon"><BarChartIcon/></span>
              {(!sidebarCollapsed||isMobile) && <span>Relatórios</span>}
            </button>
            <button onClick={onLogout} className="nav-item" style={{color:'#dc2626'}}>
              <span className="nav-icon" style={{color:'#dc2626'}}><LogOutIcon/></span>
              {(!sidebarCollapsed||isMobile) && <span>Sair</span>}
            </button>
          </div>
        </div>

        <div className="main-content" style={{marginLeft:isMobile?'0':(sidebarCollapsed?'72px':'250px')}}>
          <div className="top-bar">
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              {isMobile && <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn"><MenuIcon/></button>}
              <div><div style={{fontSize:'18px',fontWeight:700,color:'#0f172a'}}>Olá, {user.nome||user.username}</div><div style={{fontSize:'12px',color:'#94a3b8'}}>Painel DITE</div></div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <button onClick={()=>setShowColetiva(true)} className="icon-btn" title="Nova Coletiva" style={{color:'#059669'}}><PlusIcon/></button>
              <button onClick={()=>setShowNotificacoes(!showNotificacoes)} className="icon-btn"><BellIcon/>{notificacoesNaoLidas>0&&<span className="icon-btn-badge">{notificacoesNaoLidas}</span>}</button>
              <div className="user-avatar">{(user.nome||'D').charAt(0)}</div>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard icon={<BarChartIcon/>} value={stats.total_pedidos||0} label="Total" color="#06b6d4" />
            <StatCard icon={<CheckIcon/>} value={stats.pedidos_aprovados||0} label="Aprovados" color="#10b981" />
            <StatCard icon={<XIcon/>} value={stats.pedidos_rejeitados||0} label="Rejeitados" color="#ef4444" />
            <StatCard icon={<ClockIcon/>} value={stats.meus_pedidos_pendentes||0} label="Pendentes" color="#f59e0b" />
          </div>

          <div className="filters-bar">
            <div className="tabs-group">
              {menuItems.map(item=>(
                <button key={item.id} onClick={()=>setFiltroEstado(item.id)} className={`tab-btn ${filtroEstado===item.id?'active':''}`}>
                  {item.label}{item.count>0&&<span className="tab-count">{item.count}</span>}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <input type="date" value={filtroData} onChange={e=>setFiltroData(e.target.value)} className="date-input" />
              {filtroData&&<button onClick={()=>setFiltroData('')} className="clear-btn">Limpar</button>}
            </div>
          </div>

          <div className="table-wrap">
            {loading?<div className="loading-state"><div className="spinner"/><p>Carregando...</p></div>:
            pedidos.length===0?<div className="empty-state"><h3>Nenhum pedido</h3></div>:
            <div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>ID</th><th>Estudante</th><th>Curso/Classe</th><th>Tipo</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead><tbody>
              {pedidos.map(p=>(
                <tr key={p.id}>
                  <td><strong>#{p.id}</strong></td>
                  <td><div className="student-name">{p.estudante_nome}</div><div className="student-email">{p.estudante_email}</div></td>
                  <td>{p.estudante_curso||'-'}<div style={{fontSize:11,color:'#94a3b8'}}>{p.estudante_classe||'-'}</div></td>
                  <td><span className="type-badge">{p.tipo_display}</span></td>
                  <td>{p.data_saida}<div style={{fontSize:11,color:'#94a3b8'}}>{p.hora_saida}</div></td>
                  <td><span className="status-badge" style={getStatusStyle(p.estado)}>{p.estado_display}</span></td>
                  <td><div className="action-btns">
                    <button onClick={()=>navigate(`/pedido/${p.id}`)} className="action-btn" title="Ver"><EyeIcon/></button>
                    {p.acoes_disponiveis?.includes('aprovar')&&<button onClick={()=>handleAcao(p.id,'aprovar')} className="action-btn" style={{color:'#10b981'}}><CheckIcon/></button>}
                    {p.acoes_disponiveis?.includes('rejeitar')&&<button onClick={()=>handleAcao(p.id,'rejeitar')} className="action-btn" style={{color:'#ef4444'}}><XIcon/></button>}
                    {p.estado==='PENDENTE_DITE'&&<button onClick={()=>setModalEncaminhar(p.id)} className="action-btn" style={{color:'#f59e0b'}}><ArrowRightIcon/></button>}
                  </div></td>
                </tr>
              ))}
            </tbody></table></div>}
          </div>
        </div>
      </div>

      {/* Modal Coletiva */}
      {showColetiva && (
        <div className="modal-overlay" onClick={()=>setShowColetiva(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 Nova Saída Coletiva</h3>
              <button onClick={()=>setShowColetiva(false)} className="modal-close"><XIcon/></button>
            </div>
            <div className="modal-body">
              {errorColetiva&&<div style={{background:'#fef2f2',color:'#991b1b',padding:10,borderRadius:8,marginBottom:14,fontSize:13}}>{errorColetiva}</div>}
              <form onSubmit={criarColetiva}>
                <div className="field"><label className="label">Título</label><input value={formColetiva.titulo} onChange={e=>setFormColetiva({...formColetiva,titulo:e.target.value})} className="input" placeholder="Ex: Visita ao Museu" required /></div>
                <div className="field"><label className="label">Descrição</label><textarea value={formColetiva.descricao} onChange={e=>setFormColetiva({...formColetiva,descricao:e.target.value})} className="textarea" placeholder="Detalhes da saída..." /></div>
                <div style={{display:'flex',gap:10}}>
                  <div className="field" style={{flex:1}}><label className="label">Data Saída</label><input type="datetime-local" value={formColetiva.data_saida} onChange={e=>setFormColetiva({...formColetiva,data_saida:e.target.value})} className="input" required /></div>
                  <div className="field" style={{flex:1}}><label className="label">Data Volta</label><input type="datetime-local" value={formColetiva.data_volta} onChange={e=>setFormColetiva({...formColetiva,data_volta:e.target.value})} className="input" required /></div>
                </div>
                <div className="field"><label className="label">Prazo para resposta (horas)</label><input type="number" value={formColetiva.prazo_horas} onChange={e=>setFormColetiva({...formColetiva,prazo_horas:e.target.value})} className="input" min="1" max="72" /></div>
                <div style={{display:'flex',gap:10,marginTop:16}}>
                  <button type="button" onClick={()=>setShowColetiva(false)} className="btn btn-secondary" style={{flex:1}}>Cancelar</button>
                  <button type="submit" disabled={loadingColetiva} className="btn btn-primary" style={{flex:2}}>{loadingColetiva?'Criando...':'Criar Saída Coletiva'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Encaminhar */}
      {modalEncaminhar && (
        <div className="modal-overlay" onClick={()=>setModalEncaminhar(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>Encaminhar #{modalEncaminhar}</h3><button onClick={()=>setModalEncaminhar(null)} className="modal-close"><XIcon/></button></div>
            <div className="modal-body">
              <p style={{color:'#64748b',marginBottom:12}}>Selecione o destino:</p>
              <div className="modal-options">
                <button onClick={()=>handleEncaminhar(modalEncaminhar,'DIRECAO')} className="modal-option-btn"><span style={{fontSize:28}}>👨‍💼</span><div><strong>Direção</strong><p>Encaminhar para Direção</p></div></button>
                <button onClick={()=>handleEncaminhar(modalEncaminhar,'ADMINISTRACAO')} className="modal-option-btn"><span style={{fontSize:28}}>🏛️</span><div><strong>Administração</strong><p>Encaminhar para Administração</p></div></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificações */}
      {showNotificacoes && (
        <><div className="notif-overlay" onClick={()=>setShowNotificacoes(false)}/>
        <div className="notif-panel">
          <div className="notif-header"><h3>Notificações</h3><button onClick={()=>setShowNotificacoes(false)} className="modal-close"><XIcon/></button></div>
          <div className="notif-list">
            {notificacoes.length===0?<div style={{textAlign:'center',padding:60,color:'#94a3b8'}}><BellIcon/><p>Nenhuma</p></div>:
            notificacoes.slice(0,10).map(n=>(
              <div key={n.id} onClick={()=>{marcarNotificacaoLida(n.id);if(n.pedido_id){navigate(`/pedido/${n.pedido_id}`);setShowNotificacoes(false)}}} className="notif-item" style={{background:n.lida?'#fff':'#fefce8'}}>
                <div style={{fontSize:13,color:'#334155',marginBottom:4}}>{n.mensagem}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{n.data}</div>
                {!n.lida&&<div className="notif-dot"/>}
              </div>
            ))}
          </div>
        </div></>
      )}
    </>
  );
};

const StatCard = ({icon,value,label,color}) => (
  <div className="stat-card">
    <div className="stat-icon-wrap" style={{background:`${color}15`}}>{icon}</div>
    <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
  </div>
);

const getStatusStyle = (estado) => {
  const s={PENDENTE_DITE:{background:'#fef3c7',color:'#d97706'},PENDENTE_DIRECAO:{background:'#ede9fe',color:'#7c3aed'},PENDENTE_ADMIN:{background:'#dbeafe',color:'#2563eb'},APROVADO:{background:'#d1fae5',color:'#059669'},REJEITADO:{background:'#fee2e2',color:'#dc2626'},EM_ANDAMENTO:{background:'#e0f2fe',color:'#0284c7'},FINALIZADO:{background:'#f1f5f9',color:'#64748b'}};
  return s[estado]||{background:'#f1f5f9',color:'#64748b'};
};

export default DashboardDITE;

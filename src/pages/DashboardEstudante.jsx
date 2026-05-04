// src/pages/DashboardEstudante.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Ícones SVG em traços
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const BookOpenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

const DashboardEstudante = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [menuAberto, setMenuAberto] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
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
      'PENDENTE_DITE': { texto: 'Pendente', cor: '#f59e0b', bg: '#fef3c7', border: '#fbbf24' },
      'PENDENTE_DIRECAO': { texto: 'Em análise', cor: '#7c3aed', bg: '#ede9fe', border: '#a78bfa' },
      'PENDENTE_ADMIN': { texto: 'Aguardando', cor: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
      'APROVADO': { texto: 'Aprovado', cor: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
      'REJEITADO': { texto: 'Rejeitado', cor: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
      'EM_ANDAMENTO': { texto: 'Em saída', cor: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' },
      'FINALIZADO': { texto: 'Finalizado', cor: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
    };
    return info[estado] || { texto: estado, cor: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
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
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .dash-container {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', sans-serif;
        }
        
        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 260px;
          background: white;
          border-right: 1px solid #e2e8f0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 30px rgba(0, 0, 0, 0.04);
        }
        
        .sidebar-header {
          padding: 28px 20px 20px;
          background: linear-gradient(180deg, #dc2626 0%, #ef4444 60%, #06b6d4 100%);
          position: relative;
          overflow: hidden;
        }
        
        .sidebar-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(6,182,212,0.2) 0%, transparent 50%);
        }
        
        .sidebar-header::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
          animation: shimmer 4s infinite;
        }
        
        .user-info {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        
        .user-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }
        
        .user-details {
          flex: 1;
          min-width: 0;
        }
        
        .user-name {
          font-size: 15px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .user-email {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .user-role {
          display: inline-block;
          margin-top: 6px;
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: white;
        }
        
        .sidebar-nav {
          flex: 1;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .btn-new-pedido {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        
        .btn-new-pedido::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        
        .btn-new-pedido:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }
        
        .btn-new-pedido:hover::before {
          left: 100%;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          border-radius: 10px;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
          position: relative;
        }
        
        .nav-item:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        
        .nav-icon {
          width: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        
        .nav-item:hover .nav-icon {
          color: #dc2626;
        }
        
        .nav-badge {
          position: absolute;
          right: 12px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: white;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          margin-top: 12px;
          color: #94a3b8;
          font-size: 12px;
        }
        
        .info-item svg {
          flex-shrink: 0;
          color: #cbd5e1;
        }
        
        .sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid #f1f5f9;
        }
        
        .btn-logout {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        
        .btn-logout:hover {
          background: #fee2e2;
        }
        
        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 28px 32px;
          transition: margin-left 0.3s;
        }
        
        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          padding: 16px 24px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        
        .top-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .menu-btn {
          width: 42px;
          height: 42px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          color: #475569;
        }
        
        .date-display {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          text-transform: capitalize;
        }
        
        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .icon-btn {
          width: 40px;
          height: 40px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.3s;
          position: relative;
        }
        
        .icon-btn:hover {
          background: #f8fafc;
          border-color: #06b6d4;
          color: #06b6d4;
        }
        
        .icon-btn-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        
        .mobile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #dc2626, #06b6d4);
          color: white;
          display: none;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .page-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.25);
          transition: all 0.3s;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.35);
        }
        
        /* Cards de Pedidos */
        .pedidos-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .pedido-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s;
          animation: slideUp 0.4s ease-out;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        
        .pedido-card:hover {
          border-color: #06b6d4;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        
        .pedido-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 4px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .pedido-info h4 {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        
        .pedido-info span {
          font-size: 13px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .pedido-card-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .arrow-icon {
          color: #cbd5e1;
          transition: transform 0.3s;
        }
        
        .pedido-card:hover .arrow-icon {
          transform: translateX(4px);
          color: #06b6d4;
        }
        
        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }
        
        .empty-state svg {
          color: #cbd5e1;
          margin-bottom: 20px;
          opacity: 0.5;
        }
        
        .empty-state h3 {
          font-size: 20px;
          color: #475569;
          margin-bottom: 8px;
        }
        
        .empty-state p {
          color: #94a3b8;
          margin-bottom: 24px;
          font-size: 14px;
        }
        
        .btn-empty {
          padding: 12px 28px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.25);
          transition: all 0.3s;
        }
        
        .btn-empty:hover {
          transform: translateY(-2px);
        }
        
        /* Loading */
        .loading-state {
          text-align: center;
          padding: 80px 20px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 0 auto 16px;
        }
        
        /* Overlay */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99;
          display: none;
          backdrop-filter: blur(2px);
        }
        
        /* Mobile */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .sidebar-overlay.show {
            display: block;
          }
          
          .main-content {
            margin-left: 0;
            padding: 16px;
          }
          
          .menu-btn {
            display: flex;
          }
          
          .mobile-avatar {
            display: flex;
          }
          
          .page-title {
            font-size: 22px;
          }
          
          .pedido-card {
            padding: 16px;
          }
          
          .pedido-card-right .status-badge {
            display: none;
          }
        }
      `}</style>

      <div className="dash-container">
        {/* Overlay Mobile */}
        <div 
          className={`sidebar-overlay ${isMobile && menuAberto ? 'show' : ''}`}
          onClick={() => setMenuAberto(false)}
        />

        {/* Sidebar */}
        <div className={`sidebar ${isMobile && menuAberto ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="user-info">
              <div className="user-avatar">
                {(user.nome || 'E').charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user.nome || user.username}</div>
                <div className="user-email">{user.email}</div>
                <span className="user-role">Estudante</span>
              </div>
            </div>
          </div>

          <div className="sidebar-nav">
            <button 
              onClick={() => { navigate('/criar-pedido'); if(isMobile) setMenuAberto(false); }} 
              className="btn-new-pedido"
            >
              <PlusIcon />
              <span>Novo Pedido</span>
            </button>

            <button 
              onClick={() => { navigate('/notificacoes'); if(isMobile) setMenuAberto(false); }} 
              className="nav-item"
            >
              <span className="nav-icon"><BellIcon /></span>
              <span>Notificações</span>
              {notificacoesNaoLidas > 0 && (
                <span className="nav-badge">{notificacoesNaoLidas}</span>
              )}
            </button>

            {user.curso && (
              <div className="info-item">
                <BookOpenIcon />
                <span>{user.curso}</span>
              </div>
            )}
            {user.classe && (
              <div className="info-item">
                <UsersIcon />
                <span>{user.classe}</span>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <button onClick={onLogout} className="btn-logout">
              <LogOutIcon />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Top Bar */}
          <div className="top-bar">
            <div className="top-bar-left">
              <button onClick={() => setMenuAberto(!menuAberto)} className="menu-btn">
                <MenuIcon />
              </button>
              <span className="date-display">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="top-bar-right">
              <button onClick={() => navigate('/notificacoes')} className="icon-btn">
                <BellIcon />
                {notificacoesNaoLidas > 0 && (
                  <span className="icon-btn-badge">{notificacoesNaoLidas}</span>
                )}
              </button>
              <div className="mobile-avatar">
                {(user.nome || 'E').charAt(0)}
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="header-section">
            <h1 className="page-title">Meus Pedidos</h1>
            <button onClick={() => navigate('/criar-pedido')} className="btn-primary">
              <PlusIcon />
              Novo Pedido
            </button>
          </div>

          {/* Lista de Pedidos */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p style={{ color: '#94a3b8' }}>Carregando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="empty-state">
              <ClipboardIcon />
              <h3>Nenhum pedido ainda</h3>
              <p>Você ainda não criou nenhum pedido de saída</p>
              <button onClick={() => navigate('/criar-pedido')} className="btn-empty">
                <PlusIcon />
                Criar Primeiro Pedido
              </button>
            </div>
          ) : (
            <div className="pedidos-list">
              {pedidos.map(p => {
                const st = getStatusInfo(p.estado);
                return (
                  <div 
                    key={p.id} 
                    className="pedido-card" 
                    onClick={() => navigate(`/pedido/${p.id}`)}
                    style={{ animationDelay: `${pedidos.indexOf(p) * 50}ms` }}
                  >
                    <div className="pedido-card-left">
                      <div className="status-dot" style={{ background: st.cor }} />
                      <div className="pedido-info">
                        <h4>{p.tipo_display}</h4>
                        <span>
                          <CalendarIcon />
                          {p.data_saida} • {getDiaSemana(p.data_saida)}
                        </span>
                      </div>
                    </div>
                    <div className="pedido-card-right">
                      <span className="status-badge" style={{ 
                        background: st.bg, 
                        color: st.cor, 
                        border: `1px solid ${st.border}` 
                      }}>
                        {st.texto}
                      </span>
                      <span className="arrow-icon">
                        <ChevronRightIcon />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardEstudante;

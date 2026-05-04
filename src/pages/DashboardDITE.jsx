// src/pages/DashboardDITE.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Ícones SVG em traços
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PrinterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 12H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DashboardDITE = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('PENDENTE_DITE');
  const [filtroData, setFiltroData] = useState('');
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [modalEncaminhar, setModalEncaminhar] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificacoes, setShowNotificacoes] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarNotificacoes();
  }, [filtroEstado, filtroData]);

  const carregarDados = async () => {
    try {
      let url = `/pedidos/?estado=${filtroEstado}`;
      if (filtroData) url += `&data_saida=${filtroData}`;
      
      const [pedidosRes, statsRes] = await Promise.all([
        api.get(url),
        api.get('/dashboard/')
      ]);
      setPedidos(pedidosRes.data.pedidos || pedidosRes.data);
      setStats(statsRes.data);
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
      setNotificacoes(res.data.notificacoes || []);
    } catch (err) {}
  };

  const handleAcao = async (pedidoId, acao, comentario = '') => {
    try {
      const data = comentario ? { comentario } : {};
      await api.post(`/pedidos/${pedidoId}/${acao}/`, data);
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro';
      if (acao === 'rejeitar' && errorMsg.includes('motivo')) {
        const motivo = prompt('Motivo da rejeição:');
        if (motivo) handleAcao(pedidoId, acao, motivo);
      } else {
        alert('Erro: ' + errorMsg);
      }
    }
  };

  const handleEncaminhar = async (pedidoId, destino) => {
    try {
      await api.post(`/pedidos/${pedidoId}/passar-dite/`, { destino });
      setModalEncaminhar(null);
      carregarDados();
      carregarNotificacoes();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Erro ao encaminhar'));
    }
  };

  const marcarNotificacaoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {}
  };

  const imprimirListaSaida = () => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const janela = window.open('', '_blank', 'width=800,height=600');
    
    janela.document.write(`
      <html>
        <head>
          <title>Lista de Saídas - ${hoje}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a2e; }
            h1 { color: #0f3460; border-bottom: 3px solid #06b6d4; padding-bottom: 12px; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; padding: 14px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
            @media print { body { padding: 20px; } button { display: none; } }
          </style>
        </head>
        <body>
          <h1>📋 Lista de Saídas - ${hoje}</h1>
          <p>Total de pedidos: <strong>${pedidos.length}</strong></p>
          <button onclick="window.print()" style="padding:10px 20px; background:linear-gradient(135deg,#dc2626,#ef4444); color:white; border:none; border-radius:8px; cursor:pointer; margin-bottom:20px; font-weight:600;">
            🖨️ Imprimir
          </button>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Estudante</th>
                <th>Curso</th>
                <th>Classe</th>
                <th>Tipo</th>
                <th>Data/Hora</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${pedidos.map(p => `
                <tr>
                  <td><strong>#${p.id}</strong></td>
                  <td>${p.estudante_nome}</td>
                  <td>${p.estudante_curso || '-'}</td>
                  <td>${p.estudante_classe || '-'}</td>
                  <td>${p.tipo_display}</td>
                  <td>${p.data_saida} ${p.hora_saida}</td>
                  <td>${p.estado_display}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Gerado em ${new Date().toLocaleString('pt-BR')} por ${user.nome || user.username}</p>
          </div>
        </body>
      </html>
    `);
    janela.document.close();
  };

  const menuItems = [
    { id: 'PENDENTE_DITE', label: 'Pendentes', icon: <ClipboardIcon />, count: stats.meus_pedidos_pendentes },
    { id: 'PENDENTE_DIRECAO', label: 'Em Análise', icon: <ClockIcon /> },
    { id: 'APROVADO', label: 'Aprovados', icon: <CheckIcon /> },
    { id: 'REJEITADO', label: 'Rejeitados', icon: <XIcon /> },
  ];

  const totalPedidos = stats.total_pedidos || 1;
  const taxaAprovacao = ((stats.pedidos_aprovados || 0) / totalPedidos * 100).toFixed(0);

  return (
    <>
      {/* Estilos Globais */}
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
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
        
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          background: white;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
          overflow: hidden;
          box-shadow: 4px 0 30px rgba(0, 0, 0, 0.04);
        }
        
        .sidebar-header {
          padding: 32px 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-circle {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }
        
        .logo-text {
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(135deg, #1a1a2e, #0f3460);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        
        .collapse-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        
        .collapse-btn:hover {
          background: #f8fafc;
          border-color: #06b6d4;
          color: #06b6d4;
        }
        
        .nav-section {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          border-radius: 10px;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
          position: relative;
          font-family: 'Inter', sans-serif;
          white-space: nowrap;
        }
        
        .nav-item:hover {
          background: #f8fafc;
          color: #0f3460;
        }
        
        .nav-item.active {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(6, 182, 212, 0.08));
          color: #dc2626;
          font-weight: 600;
        }
        
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: linear-gradient(180deg, #dc2626, #06b6d4);
          border-radius: 0 3px 3px 0;
        }
        
        .nav-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          flex-shrink: 0;
        }
        
        .nav-item:hover .nav-icon,
        .nav-item.active .nav-icon {
          color: #dc2626;
        }
        
        .nav-badge {
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: white;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        .nav-badge-mini {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 0 3px white;
        }
        
        .nav-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 8px 14px;
        }
        
        .main-content {
          flex: 1;
          padding: 32px;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 100vh;
        }
        
        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
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
        
        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #dc2626, #06b6d4);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
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
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.5s ease-out;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          border-color: #06b6d4;
        }
        
        .stat-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 6px;
          font-weight: 500;
        }
        
        .filters-bar {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        
        .tabs-group {
          display: flex;
          gap: 4px;
          background: #f8fafc;
          padding: 4px;
          border-radius: 12px;
        }
        
        .tab-btn {
          padding: 10px 18px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          border-radius: 10px;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .tab-btn.active {
          background: white;
          color: #dc2626;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .tab-count {
          background: #e2e8f0;
          color: #64748b;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }
        
        .tab-btn.active .tab-count {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
        }
        
        .date-input {
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s;
        }
        
        .date-input:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .clear-btn {
          padding: 10px 18px;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s;
        }
        
        .clear-btn:hover {
          background: #fecaca;
        }
        
        .table-wrapper {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th {
          text-align: left;
          padding: 16px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #e2e8f0;
          background: #f8fafc;
          white-space: nowrap;
        }
        
        .data-table td {
          padding: 16px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        
        .data-table tr {
          transition: background 0.2s;
        }
        
        .data-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .student-name {
          font-weight: 600;
          color: #0f172a;
        }
        
        .student-email {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }
        
        .type-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .action-btns {
          display: flex;
          gap: 6px;
        }
        
        .action-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: #f8fafc;
          border-color: #06b6d4;
          color: #06b6d4;
        }
        
        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }
        
        .empty-state svg {
          color: #cbd5e1;
          margin-bottom: 16px;
        }
        
        .empty-state h3 {
          color: #475569;
          margin-bottom: 8px;
        }
        
        .empty-state p {
          color: #94a3b8;
          font-size: 14px;
        }
        
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
        
        /* Notifications Panel */
        .notif-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 200;
          backdrop-filter: blur(2px);
        }
        
        .notif-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 380px;
          max-width: 90vw;
          height: 100vh;
          background: white;
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.1);
          z-index: 201;
          animation: slideIn 0.3s ease-out;
        }
        
        .notif-header {
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .notif-list {
          overflow-y: auto;
          height: calc(100vh - 80px);
        }
        
        .notif-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }
        
        .notif-item:hover {
          background: #f8fafc;
        }
        
        .notif-dot {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 8px;
          height: 8px;
          background: #06b6d4;
          border-radius: 50%;
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 300;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        
        .modal-content {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 480px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease-out;
        }
        
        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h3 {
          color: #0f172a;
          font-size: 18px;
        }
        
        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .modal-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }
        
        .modal-option-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s;
        }
        
        .modal-option-btn:hover {
          border-color: #06b6d4;
          background: #f0f9ff;
          transform: translateX(4px);
        }
        
        .modal-option-btn strong {
          display: block;
          color: #0f172a;
          margin-bottom: 4px;
        }
        
        .modal-option-btn p {
          color: #94a3b8;
          font-size: 13px;
          margin: 0;
        }
        
        /* Mobile */
        .mobile-menu-btn {
          width: 44px;
          height: 44px;
          border: none;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          color: #475569;
          display: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          
          .main-content {
            margin-left: 0 !important;
            padding: 16px;
          }
          
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          
          .stat-card {
            padding: 16px;
          }
          
          .stat-value {
            font-size: 24px;
          }
          
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .tabs-group {
            overflow-x: auto;
          }
          
          .data-table {
            font-size: 13px;
          }
          
          .data-table th,
          .data-table td {
            padding: 12px 10px;
          }
        }
      `}</style>

      <div className="dash-container">
        {/* Overlay Mobile */}
        {isMobile && mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)} 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`sidebar ${isMobile && mobileMenuOpen ? 'mobile-open' : ''}`}
          style={{ width: sidebarCollapsed && !isMobile ? '76px' : '260px' }}
        >
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-circle">D</div>
              {(!sidebarCollapsed || isMobile) && <span className="logo-text">DITE</span>}
            </div>
            {!isMobile && (
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="collapse-btn">
                {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </button>
            )}
          </div>

          <div className="nav-section">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setFiltroEstado(item.id);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className={`nav-item ${filtroEstado === item.id ? 'active' : ''}`}
                title={sidebarCollapsed && !isMobile ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {(!sidebarCollapsed || isMobile) && (
                  <>
                    <span>{item.label}</span>
                    {item.count > 0 && <span className="nav-badge">{item.count}</span>}
                  </>
                )}
                {sidebarCollapsed && !isMobile && item.count > 0 && (
                  <span className="nav-badge-mini" />
                )}
              </button>
            ))}
          </div>

          <div className="nav-divider" />

          <div className="nav-section" style={{ flex: '0 0 auto' }}>
            <button 
              onClick={() => setShowNotificacoes(!showNotificacoes)} 
              className="nav-item"
            >
              <span className="nav-icon"><BellIcon /></span>
              {(!sidebarCollapsed || isMobile) && (
                <>
                  <span>Notificações</span>
                  {notificacoesNaoLidas > 0 && <span className="nav-badge">{notificacoesNaoLidas}</span>}
                </>
              )}
            </button>

            <button onClick={() => navigate('/relatorios')} className="nav-item">
              <span className="nav-icon"><BarChartIcon /></span>
              {(!sidebarCollapsed || isMobile) && <span>Relatórios</span>}
            </button>

            <button onClick={imprimirListaSaida} className="nav-item">
              <span className="nav-icon"><PrinterIcon /></span>
              {(!sidebarCollapsed || isMobile) && <span>Imprimir</span>}
            </button>

            <button onClick={onLogout} className="nav-item" style={{ color: '#dc2626' }}>
              <span className="nav-icon" style={{ color: '#dc2626' }}><LogOutIcon /></span>
              {(!sidebarCollapsed || isMobile) && <span>Sair</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content" style={{ marginLeft: isMobile ? '0' : (sidebarCollapsed ? '76px' : '260px') }}>
          {/* Top Bar */}
          <div className="top-bar">
            <div className="top-bar-left">
              {isMobile && (
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn">
                  <MenuIcon />
                </button>
              )}
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                  Olá, {user.nome || user.username}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  Painel de Controle • DITE
                </div>
              </div>
            </div>
            <div className="top-bar-right">
              <button onClick={() => setShowNotificacoes(!showNotificacoes)} className="icon-btn">
                <BellIcon />
                {notificacoesNaoLidas > 0 && <span className="icon-btn-badge">{notificacoesNaoLidas}</span>}
              </button>
              <div className="user-avatar">
                {(user.nome || 'D').charAt(0)}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05))' }}>
                <BarChartIcon />
              </div>
              <div>
                <div className="stat-value">{stats.total_pedidos || 0}</div>
                <div className="stat-label">Total de Pedidos</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
                <CheckIcon />
              </div>
              <div>
                <div className="stat-value">{stats.pedidos_aprovados || 0}</div>
                <div className="stat-label">Aprovados</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}>
                <XIcon />
              </div>
              <div>
                <div className="stat-value">{stats.pedidos_rejeitados || 0}</div>
                <div className="stat-label">Rejeitados</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))' }}>
                <ClockIcon />
              </div>
              <div>
                <div className="stat-value">{stats.meus_pedidos_pendentes || 0}</div>
                <div className="stat-label">Pendentes</div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="tabs-group">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setFiltroEstado(item.id)}
                  className={`tab-btn ${filtroEstado === item.id ? 'active' : ''}`}
                >
                  {item.label}
                  {item.count > 0 && <span className="tab-count">{item.count}</span>}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="date-input"
              />
              {filtroData && (
                <button onClick={() => setFiltroData('')} className="clear-btn">
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p style={{ color: '#94a3b8' }}>Carregando pedidos...</p>
              </div>
            ) : pedidos.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <h3>Nenhum pedido encontrado</h3>
                <p>Todos os pedidos foram processados</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Estudante</th>
                      <th>Curso/Classe</th>
                      <th>Tipo</th>
                      <th>Data/Hora</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map(pedido => (
                      <tr key={pedido.id}>
                        <td><strong>#{pedido.id}</strong></td>
                        <td>
                          <div className="student-name">{pedido.estudante_nome}</div>
                          <div className="student-email">{pedido.estudante_email}</div>
                        </td>
                        <td>
                          {pedido.estudante_curso || '-'}
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pedido.estudante_classe || '-'}</div>
                        </td>
                        <td>
                          <span className="type-badge">{pedido.tipo_display}</span>
                        </td>
                        <td>
                          {pedido.data_saida}
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pedido.hora_saida}</div>
                        </td>
                        <td>
                          <span className="status-badge" style={getStatusStyle(pedido.estado)}>
                            {pedido.estado_display}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button
                              onClick={() => navigate(`/pedido/${pedido.id}`)}
                              className="action-btn"
                              title="Detalhes"
                            >
                              <EyeIcon />
                            </button>
                            
                            {pedido.acoes_disponiveis?.includes('aprovar') && (
                              <button
                                onClick={() => handleAcao(pedido.id, 'aprovar')}
                                className="action-btn"
                                style={{ color: '#10b981' }}
                                title="Aprovar"
                              >
                                <CheckIcon />
                              </button>
                            )}
                            
                            {pedido.acoes_disponiveis?.includes('rejeitar') && (
                              <button
                                onClick={() => handleAcao(pedido.id, 'rejeitar')}
                                className="action-btn"
                                style={{ color: '#ef4444' }}
                                title="Rejeitar"
                              >
                                <XIcon />
                              </button>
                            )}
                            
                            {pedido.estado === 'PENDENTE_DITE' && (
                              <button
                                onClick={() => setModalEncaminhar(pedido.id)}
                                className="action-btn"
                                style={{ color: '#f59e0b' }}
                                title="Encaminhar"
                              >
                                <ArrowRightIcon />
                              </button>
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
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotificacoes && (
        <>
          <div className="notif-overlay" onClick={() => setShowNotificacoes(false)} />
          <div className="notif-panel">
            <div className="notif-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Notificações</h2>
              <button onClick={() => setShowNotificacoes(false)} className="modal-close">
                <XIcon />
              </button>
            </div>
            <div className="notif-list">
              {notificacoes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <BellIcon />
                  <p style={{ marginTop: '12px' }}>Nenhuma notificação</p>
                </div>
              ) : (
                notificacoes.slice(0, 10).map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      marcarNotificacaoLida(notif.id);
                      if (notif.pedido_id) {
                        navigate(`/pedido/${notif.pedido_id}`);
                        setShowNotificacoes(false);
                      }
                    }}
                    className="notif-item"
                    style={{ backgroundColor: notif.lida ? 'white' : '#fefce8' }}
                  >
                    <div style={{ fontSize: '14px', color: '#334155', marginBottom: '4px' }}>
                      {notif.mensagem}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{notif.data}</div>
                    {!notif.lida && <div className="notif-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Encaminhar Modal */}
      {modalEncaminhar && (
        <div className="modal-overlay" onClick={() => setModalEncaminhar(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Encaminhar Pedido #{modalEncaminhar}</h3>
              <button onClick={() => setModalEncaminhar(null)} className="modal-close">
                <XIcon />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#64748b', marginBottom: '4px' }}>Selecione o destino:</p>
              <div className="modal-options">
                <button
                  onClick={() => handleEncaminhar(modalEncaminhar, 'DIRECAO')}
                  className="modal-option-btn"
                >
                  <span style={{ fontSize: '28px' }}>👨‍💼</span>
                  <div>
                    <strong>Direção</strong>
                    <p>Encaminhar para aprovação da Direção</p>
                  </div>
                </button>
                <button
                  onClick={() => handleEncaminhar(modalEncaminhar, 'ADMINISTRACAO')}
                  className="modal-option-btn"
                >
                  <span style={{ fontSize: '28px' }}>🏛️</span>
                  <div>
                    <strong>Administração</strong>
                    <p>Encaminhar para Administração</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const getStatusStyle = (estado) => {
  const styles = {
    'PENDENTE_DITE': { background: '#fef3c7', color: '#d97706', border: '1px solid #fbbf24' },
    'PENDENTE_DIRECAO': { background: '#ede9fe', color: '#7c3aed', border: '1px solid #a78bfa' },
    'PENDENTE_ADMIN': { background: '#dbeafe', color: '#2563eb', border: '1px solid #93c5fd' },
    'APROVADO': { background: '#d1fae5', color: '#059669', border: '1px solid #6ee7b7' },
    'REJEITADO': { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
    'EM_ANDAMENTO': { background: '#e0f2fe', color: '#0284c7', border: '1px solid '#7dd3fc' },
    'FINALIZADO': { background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' },
  };
  return styles[estado] || { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' };
};

export default DashboardDITE;

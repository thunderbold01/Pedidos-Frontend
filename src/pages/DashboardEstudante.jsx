// src/pages/DashboardEstudante.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

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
    } catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas);
    } catch (err) {}
  };

  const getStatusInfo = (estado) => {
    const info = {
      'PENDENTE_DITE': { texto: 'Pendente', cor: '#f59e0b', bg: '#fef3c7' },
      'PENDENTE_DIRECAO': { texto: 'Em análise', cor: '#7c3aed', bg: '#ede9fe' },
      'PENDENTE_ADMIN': { texto: 'Aguardando', cor: '#2563eb', bg: '#dbeafe' },
      'APROVADO': { texto: 'Aprovado', cor: '#059669', bg: '#d1fae5' },
      'REJEITADO': { texto: 'Rejeitado', cor: '#dc2626', bg: '#fee2e2' },
      'EM_ANDAMENTO': { texto: 'Em saída', cor: '#0284c7', bg: '#e0f2fe' },
      'FINALIZADO': { texto: 'Finalizado', cor: '#64748b', bg: '#f1f5f9' },
    };
    return info[estado] || { texto: estado, cor: '#64748b', bg: '#f1f5f9' };
  };

  const getDiaSemana = (data) => {
    if (!data) return '';
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    try { const partes = data.split('/'); const d = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`); return dias[d.getDay()]; }
    catch { return ''; }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; }
        .dash { display: flex; min-height: 100vh; background: #f8fafc; }
        .sidebar { position: fixed; top: 0; left: 0; width: 260px; height: 100vh; background: #fff; border-right: 1px solid #e2e8f0; z-index: 100; display: flex; flex-direction: column; transition: transform 0.3s; box-shadow: 4px 0 30px rgba(0,0,0,0.03); }
        .sidebar.open { transform: translateX(0); }
        .sidebar-header { padding: 24px 20px; background: linear-gradient(180deg, #dc2626, #06b6d4); color: #fff; }
        .sidebar-header .avatar { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; }
        .sidebar-header .name { font-size: 15px; font-weight: 700; margin-top: 8px; }
        .sidebar-header .email { font-size: 10px; opacity: 0.8; }
        .sidebar-header .role { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; display: inline-block; }
        .sidebar-nav { flex: 1; padding: 20px 16px; display: flex; flex-direction: column; gap: 6px; }
        .btn-new { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; box-shadow: 0 4px 16px rgba(220,38,38,0.3); }
        .nav-btn { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border: none; background: transparent; cursor: pointer; font-size: 13px; font-weight: 500; color: #475569; border-radius: 10px; font-family: 'Inter', sans-serif; }
        .nav-btn:hover { background: #f8fafc; color: #0f172a; }
        .badge { position: absolute; right: 12px; background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
        .sidebar-footer { padding: 16px 20px; border-top: 1px solid #f1f5f9; }
        .btn-logout { width: 100%; padding: 11px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .main { flex: 1; margin-left: 260px; padding: 24px; transition: margin-left 0.3s; }
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
        .menu-btn { width: 42px; height: 42px; border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; cursor: pointer; display: none; align-items: center; justify-content: center; font-size: 18px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: 800; color: #0f172a; }
        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; }
        .pedidos-list { display: flex; flex-direction: column; gap: 8px; }
        .pedido-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
        .pedido-card:hover { border-color: #06b6d4; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(0,0,0,0.05); }
        .card-left { display: flex; align-items: center; gap: 12px; }
        .dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
        .card-info h4 { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
        .card-info span { font-size: 12px; color: #94a3b8; }
        .card-right { display: flex; align-items: center; gap: 10px; }
        .status { padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .arrow { color: #cbd5e1; font-size: 18px; }
        .pedido-card:hover .arrow { color: #06b6d4; transform: translateX(3px); transition: all 0.2s; }
        .empty { text-align: center; padding: 80px 20px; color: #94a3b8; }
        .empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.3; }
        .empty h3 { font-size: 18px; color: #475569; margin-bottom: 6px; }
        .empty p { font-size: 13px; margin-bottom: 20px; }
        .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #dc2626; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; display: none; }
        .overlay.show { display: block; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .main { margin-left: 0; padding: 14px; }
          .menu-btn { display: flex; }
        }
      `}</style>

      <div className="dash">
        <div className={`overlay ${isMobile && menuAberto ? 'show' : ''}`} onClick={() => setMenuAberto(false)} />
        <div className={`sidebar ${menuAberto ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="avatar">{(user.nome || 'E').charAt(0)}</div>
            <div className="name">{user.nome || user.username}</div>
            <div className="email">{user.email}</div>
            <span className="role">Estudante</span>
          </div>
          <div className="sidebar-nav">
            <button onClick={() => { navigate('/criar-pedido'); setMenuAberto(false); }} className="btn-new">+ Novo Pedido</button>
            <button onClick={() => { navigate('/notificacoes'); setMenuAberto(false); }} className="nav-btn" style={{ position: 'relative' }}>
              🔔 Notificações
              {notificacoesNaoLidas > 0 && <span className="badge">{notificacoesNaoLidas}</span>}
            </button>
            {user.curso && <div style={{ padding: '8px 14px', fontSize: 12, color: '#94a3b8' }}>📚 {user.curso}</div>}
            {user.classe && <div style={{ padding: '0 14px', fontSize: 12, color: '#94a3b8' }}>👥 {user.classe}</div>}
          </div>
          <div className="sidebar-footer">
            <button onClick={onLogout} className="btn-logout">🚪 Sair</button>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <button onClick={() => setMenuAberto(!menuAberto)} className="menu-btn">☰</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div style={{ width: 42 }} />
          </div>
          <div className="header">
            <h1 className="title">Meus Pedidos</h1>
            <button onClick={() => navigate('/criar-pedido')} className="btn-primary">+ Novo</button>
          </div>

          {loading ? (
            <div className="empty"><div className="spinner" /><p>Carregando...</p></div>
          ) : pedidos.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <h3>Nenhum pedido</h3>
              <p>Crie seu primeiro pedido de saída</p>
              <button onClick={() => navigate('/criar-pedido')} className="btn-primary">Criar Pedido</button>
            </div>
          ) : (
            <div className="pedidos-list">
              {pedidos.map(p => {
                const st = getStatusInfo(p.estado);
                return (
                  <div key={p.id} className="pedido-card">
                    <div className="card-left">
                      <div className="dot" style={{ background: st.cor }} />
                      <div className="card-info">
                        <h4>{p.tipo_display}</h4>
                        <span>📅 {p.data_saida} • {getDiaSemana(p.data_saida)}</span>
                      </div>
                    </div>
                    <div className="card-right">
                      <span className="status" style={{ background: st.bg, color: st.cor }}>{st.texto}</span>
                      <span className="arrow">→</span>
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

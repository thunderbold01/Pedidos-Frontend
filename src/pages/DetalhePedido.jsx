// src/pages/DetalhePedido.jsx - VERSÃO COMPLETA E CORRIGIDA
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const DetalhePedido = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [menuRetraido, setMenuRetraido] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    try {
      const response = await api.get(`/pedidos/${id}/`);
      setPedido(response.data);
    } catch (err) {
      console.error('Erro ao carregar pedido:', err);
      alert('Erro ao carregar detalhes do pedido');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAcao = async (acao) => {
    try {
      let endpoint = '';
      let data = {};
      
      switch(acao) {
        case 'aprovar':
          endpoint = `/pedidos/${id}/aprovar/`;
          data = {};
          break;
        case 'rejeitar':
          endpoint = `/pedidos/${id}/rejeitar/`;
          data = { comentario };
          break;
        case 'passar':
          endpoint = `/pedidos/${id}/passar/`;
          data = {};
          break;
        case 'passar-dite':
          const destino = prompt('Encaminhar para:\n1 - DIRECAO\n2 - ADMINISTRACAO');
          if (!destino) return;
          const dest = destino === '1' ? 'DIRECAO' : 'ADMINISTRACAO';
          endpoint = `/pedidos/${id}/passar-dite/`;
          data = { destino: dest };
          break;
        default:
          return;
      }
      
      if (acao === 'rejeitar' && !comentario) {
        alert('Informe o motivo da rejeição');
        return;
      }
      
      await api.post(endpoint, data);
      alert('✅ Ação realizada com sucesso!');
      carregarPedido();
      setComentario('');
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro desconhecido'));
    }
  };

  const handleEditarDatas = async () => {
    const novaDataSaida = prompt('Nova data de saída (YYYY-MM-DD HH:MM):', pedido.data_saida);
    if (!novaDataSaida) return;
    const novaDataVolta = prompt('Nova data de retorno (YYYY-MM-DD HH:MM):', pedido.data_volta);
    if (!novaDataVolta) return;
    const motivo = prompt('Motivo da alteração:');
    if (!motivo) return;
    
    try {
      await api.post(`/pedidos/${id}/editar-datas/`, {
        data_saida: novaDataSaida,
        data_volta: novaDataVolta,
        motivo: motivo
      });
      alert('✅ Datas atualizadas com sucesso!');
      carregarPedido();
    } catch (err) {
      alert('❌ Erro ao editar datas: ' + (err.response?.data?.error || 'Erro desconhecido'));
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <h2>Carregando...</h2>
      </div>
    );
  }

  if (!pedido) {
    return null;
  }

  const getStatusColor = (estado) => {
    const cores = {
      'PENDENTE_DITE': '#10B981',
      'PENDENTE_DIRECAO': '#F59E0B',
      'PENDENTE_ADMIN': '#EF4444',
      'APROVADO': '#10B981',
      'REJEITADO': '#EF4444',
      'EM_ANDAMENTO': '#3B82F6',
      'FINALIZADO': '#6B7280'
    };
    return cores[estado] || '#6B7280';
  };

  const getStatusText = (estado) => {
    const textos = {
      'PENDENTE_DITE': 'Pendente - DITE',
      'PENDENTE_DIRECAO': 'Pendente - Direção',
      'PENDENTE_ADMIN': 'Pendente - Admin',
      'APROVADO': 'Aprovado',
      'REJEITADO': 'Rejeitado',
      'EM_ANDAMENTO': 'Em Andamento',
      'FINALIZADO': 'Finalizado'
    };
    return textos[estado] || estado;
  };

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '📋', label: 'Meus Pedidos', path: '/dashboard' },
    { icon: '➕', label: 'Novo Pedido', path: '/criar-pedido' },
    { icon: '🚌', label: 'Coletivas', path: '/coletivas' },
    { icon: '🔔', label: 'Notificações', path: '/notificacoes' },
  ];

  const menuLargura = menuRetraido ? 70 : 260;

  // Verificar se o usuário pode editar datas
  const podeEditarDatas = user?.role === 'ADMIN' || user?.role === 'DITE' || user?.role === 'DIRECAO' || user?.role === 'ADMINISTRACAO';
  
  // Verificar ações disponíveis baseadas no estado e role
  const podeAprovar = pedido.acoes_disponiveis?.includes('aprovar');
  const podeRejeitar = pedido.acoes_disponiveis?.includes('rejeitar');
  const podePassar = pedido.acoes_disponiveis?.includes('passar');
  const podePassarDITE = pedido.estado === 'PENDENTE_DITE' && user?.role === 'DITE';

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .menu-desktop { display: none; }
          .content-area { margin-left: 0 !important; width: 100% !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-toggle { display: none; }
          .mobile-overlay { display: none; }
        }
      `}</style>

      {/* Menu Desktop Retrátil */}
      <div className="menu-desktop" style={{
        ...styles.menu,
        width: menuLargura,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <button onClick={() => setMenuRetraido(!menuRetraido)} style={styles.menuToggle}>
          {menuRetraido ? '→' : '←'}
        </button>
        <div style={styles.menuHeader}>
          <div style={styles.menuLogo}>
            <span style={{ fontSize: menuRetraido ? 20 : 24 }}>📋</span>
            {!menuRetraido && <span style={styles.menuLogoText}>Sistema</span>}
          </div>
        </div>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          {!menuRetraido && (
            <div style={styles.userDetails}>
              <div style={styles.userName}>{user?.nome || user?.username}</div>
              <div style={styles.userRole}>{user?.role || 'Usuário'}</div>
            </div>
          )}
        </div>
        <nav style={styles.menuNav}>
          {menuItems.map((item, idx) => (
            <button key={idx} onClick={() => navigate(item.path)} style={styles.menuItem} title={menuRetraido ? item.label : ''}>
              <span style={styles.menuIcon}>{item.icon}</span>
              {!menuRetraido && <span style={styles.menuLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={styles.logoutBtn}>
          <span style={styles.menuIcon}>🚪</span>
          {!menuRetraido && <span>Sair</span>}
        </button>
      </div>

      {/* Botão Mobile */}
      <button className="mobile-toggle" onClick={() => setMobileMenuOpen(true)} style={styles.mobileMenuBtn}>
        ☰
      </button>

      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} style={styles.mobileOverlay} />
      )}

      {/* Menu Mobile */}
      <div className="menu-mobile" style={{
        ...styles.mobileMenu,
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'
      }}>
        <div style={styles.mobileMenuHeader}>
          <div style={styles.mobileMenuLogo}><span>📋</span><span>Sistema</span></div>
          <button onClick={() => setMobileMenuOpen(false)} style={styles.mobileMenuClose}>✕</button>
        </div>
        <div style={styles.mobileUserInfo}>
          <div style={styles.mobileAvatar}>{user?.nome?.charAt(0) || user?.username?.charAt(0) || 'U'}</div>
          <div>
            <div style={styles.mobileUserName}>{user?.nome || user?.username}</div>
            <div style={styles.mobileUserRole}>{user?.role || 'Usuário'}</div>
          </div>
        </div>
        <nav style={styles.mobileNav}>
          {menuItems.map((item, idx) => (
            <button key={idx} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }} style={styles.mobileMenuItem}>
              <span style={styles.mobileMenuIcon}>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
          <button onClick={() => { localStorage.clear(); navigate('/login'); setMobileMenuOpen(false); }} style={styles.mobileLogoutBtn}>
            <span>🚪</span><span>Sair</span>
          </button>
        </nav>
      </div>

      {/* Conteúdo Principal */}
      <div className="content-area" style={{
        ...styles.contentArea,
        marginLeft: !isMobile ? menuLargura : 0,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate('/dashboard')} style={styles.backButton}>← Voltar</button>
          {podeEditarDatas && pedido.estado !== 'APROVADO' && pedido.estado !== 'REJEITADO' && (
            <button onClick={handleEditarDatas} style={styles.editButton}>✏️ Editar Datas</button>
          )}
        </div>

        <div style={styles.card}>
          {/* Cabeçalho */}
          <div style={styles.cardHeader}>
            <div>
              <h1 style={styles.title}>Pedido #{pedido.id}</h1>
              <p style={styles.subtitle}>Criado em {pedido.created_at}</p>
            </div>
            <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor(pedido.estado) }}>
              {getStatusText(pedido.estado)}
            </span>
          </div>

          {/* Grid Informações */}
          <div style={styles.infoGrid}>
            <div>
              <h3 style={styles.sectionTitle}>📋 Informações do Pedido</h3>
              <InfoItem label="Tipo" value={pedido.tipo_display} />
              <InfoItem label="Data de Saída" value={pedido.data_saida} />
              <InfoItem label="Data de Retorno" value={pedido.data_volta || 'Não informado'} />
              <InfoItem label="Data Confirmada" value={pedido.data_saida_confirmada || 'Não definida'} />
              <InfoItem label="Motivo" value={pedido.motivo} />
              {pedido.tema_saida && <InfoItem label="Tema" value={pedido.tema_saida} />}
            </div>
            <div>
              <h3 style={styles.sectionTitle}>👤 Informações do Estudante</h3>
              <InfoItem label="Nome" value={pedido.estudante?.nome} />
              <InfoItem label="Email" value={pedido.estudante?.email} />
              <InfoItem label="Curso" value={pedido.estudante?.curso || 'Não informado'} />
              <InfoItem label="Classe" value={pedido.estudante?.classe || 'Não informado'} />
            </div>
          </div>

          {/* Horários Reais */}
          {(pedido.hora_saida_real || pedido.hora_retorno_real) && (
            <div style={styles.realTimesSection}>
              <h3 style={styles.sectionTitle}>⏰ Registros de Portão</h3>
              <div style={styles.realTimesGrid}>
                <InfoItem label="Saída Real" value={pedido.hora_saida_real || 'Não registrada'} />
                <InfoItem label="Retorno Real" value={pedido.hora_retorno_real || 'Não registrado'} />
                {pedido.atrasado && <InfoItem label="Atraso" value={`${pedido.tempo_atraso} minutos`} highlight />}
              </div>
            </div>
          )}

          {/* Decisões */}
          <div style={styles.decisoesSection}>
            <h3 style={styles.sectionTitle}>📝 Decisões</h3>
            <div style={styles.decisoesGrid}>
              <DecisaoCard titulo="DITE" decisao={pedido.decisao_dite} data={pedido.data_decisao_dite} cor="#10B981" />
              <DecisaoCard titulo="Direção" decisao={pedido.decisao_direcao} data={pedido.data_decisao_direcao} cor="#F59E0B" />
              <DecisaoCard titulo="Administração" decisao={pedido.decisao_administracao} data={pedido.data_decisao_administracao} cor="#8B5CF6" />
              <DecisaoCard titulo="Admin" decisao={pedido.decisao_admin} data={pedido.data_decisao_admin} cor="#EF4444" />
            </div>
          </div>

          {/* Ações Disponíveis */}
          {(podeAprovar || podeRejeitar || podePassar || podePassarDITE) && (
            <div style={styles.acoesSection}>
              <h3 style={styles.sectionTitle}>🎯 Ações Disponíveis</h3>
              {podeRejeitar && (
                <div style={styles.comentarioArea}>
                  <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Motivo da rejeição (obrigatório)" style={styles.textarea} rows={3} />
                </div>
              )}
              <div style={styles.acoesGrid}>
                {podeAprovar && <button onClick={() => handleAcao('aprovar')} style={styles.btnAprovar}>✅ Aprovar</button>}
                {podeRejeitar && <button onClick={() => handleAcao('rejeitar')} style={styles.btnRejeitar}>❌ Rejeitar</button>}
                {podePassar && <button onClick={() => handleAcao('passar')} style={styles.btnEncaminhar}>➡️ Encaminhar para Admin</button>}
                {podePassarDITE && <button onClick={() => handleAcao('passar-dite')} style={styles.btnEncaminhar}>📤 Encaminhar para Direção/Admin</button>}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div>
            <h3 style={styles.sectionTitle}>📜 Histórico</h3>
            {pedido.historico?.length === 0 ? (
              <p style={styles.emptyText}>Nenhum registro no histórico</p>
            ) : (
              <div style={styles.historicoContainer}>
                {pedido.historico?.map((item, index) => (
                  <div key={index} style={styles.historicoItem}>
                    <div style={styles.historicoDot} />
                    <div style={styles.historicoContent}>
                      <div style={styles.historicoHeader}>
                        <strong>{item.acao_display}</strong>
                        <small>{item.data}</small>
                      </div>
                      <p style={styles.historicoUsuario}>Por: {item.usuario_nome} ({item.role_usuario})</p>
                      {item.comentario && <p style={styles.historicoComentario}>"{item.comentario}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documento anexo */}
          {pedido.documento && (
            <div style={styles.documentoSection}>
              <h3 style={styles.sectionTitle}>📎 Documento Anexo</h3>
              <a href={pedido.documento} target="_blank" rel="noopener noreferrer" style={styles.documentoLink}>📄 Ver documento anexado</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, highlight }) => (
  <div style={{ ...styles.infoItem, ...(highlight && styles.infoItemHighlight) }}>
    <span style={styles.infoLabel}>{label}:</span>
    <span style={styles.infoValue}>{value || 'Não informado'}</span>
  </div>
);

const DecisaoCard = ({ titulo, decisao, data, cor }) => (
  <div style={{ ...styles.decisaoCard, borderLeftColor: cor }}>
    <h4 style={{ ...styles.decisaoTitle, color: cor }}>{titulo}</h4>
    {decisao ? (
      <>
        <p style={{ ...styles.decisaoStatus, color: decisao === 'APROVADO' ? '#10B981' : '#EF4444' }}>
          {decisao === 'APROVADO' ? '✅ Aprovado' : '❌ Rejeitado'}
        </p>
        <small style={styles.decisaoData}>{data}</small>
      </>
    ) : (
      <p style={styles.decisaoPendente}>⏳ Pendente</p>
    )}
  </div>
);

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#f5f5f5' },
  
  // Loading
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  spinner: { width: 40, height: 40, border: '3px solid #f3f3f3', borderTopColor: '#2196F3', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 },
  
  // Menu Desktop
  menu: { position: 'fixed', left: 0, top: 0, height: '100vh', background: '#fff', boxShadow: '2px 0 8px rgba(0,0,0,0.05)', zIndex: 100, display: 'flex', flexDirection: 'column' },
  menuToggle: { position: 'absolute', right: -12, top: 20, width: 24, height: 24, background: '#2196F3', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 },
  menuHeader: { padding: '24px 16px', borderBottom: '1px solid #eee' },
  menuLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  menuLogoText: { fontSize: 18, fontWeight: 700, color: '#1a1a1a' },
  userInfo: { padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #eee' },
  userAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#2196F3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, flexShrink: 0 },
  userDetails: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, color: '#666' },
  menuNav: { flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 4 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#666', transition: 'all 0.2s', width: '100%' },
  menuIcon: { fontSize: 20, width: 24, textAlign: 'center', flexShrink: 0 },
  menuLabel: { flex: 1, textAlign: 'left' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', margin: '16px', border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#dc2626' },
  
  // Mobile
  mobileMenuBtn: { position: 'fixed', top: 15, left: 15, zIndex: 90, width: 44, height: 44, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  mobileOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(2px)' },
  mobileMenu: { position: 'fixed', top: 0, left: 0, width: 280, height: '100vh', background: '#fff', zIndex: 201, transition: 'transform 0.3s ease', boxShadow: '2px 0 20px rgba(0,0,0,0.1)' },
  mobileMenuHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #eee' },
  mobileMenuLogo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700 },
  mobileMenuClose: { width: 32, height: 32, border: '1px solid #eee', background: '#fff', borderRadius: 8, cursor: 'pointer' },
  mobileUserInfo: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px', borderBottom: '1px solid #eee' },
  mobileAvatar: { width: 44, height: 44, borderRadius: '50%', background: '#2196F3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18 },
  mobileUserName: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  mobileUserRole: { fontSize: 12, color: '#666' },
  mobileNav: { flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 },
  mobileMenuItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#666', width: '100%', textAlign: 'left', borderRadius: 8 },
  mobileMenuIcon: { fontSize: 18, width: 24 },
  mobileLogoutBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginTop: 16, border: 'none', background: '#fef2f2', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#dc2626', width: '100%' },
  
  // Content
  contentArea: { flex: 1, padding: 20, transition: 'margin-left 0.3s ease', maxWidth: 'calc(100% - 70px)', '@media (max-width: 768px)': { maxWidth: '100%' } },
  backButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  editButton: { padding: '10px 20px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  card: { backgroundColor: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 30, '@media (max-width: 768px)': { padding: 20 } },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '2px solid #eee', flexWrap: 'wrap', gap: 16 },
  title: { margin: 0, color: '#1a1a1a', '@media (max-width: 768px)': { fontSize: 20 } },
  subtitle: { margin: '5px 0 0 0', color: '#999', fontSize: 12 },
  statusBadge: { padding: '10px 20px', color: 'white', borderRadius: 25, fontSize: 14, fontWeight: 600 },
  
  // Grids
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 30, '@media (max-width: 768px)': { gridTemplateColumns: '1fr', gap: 20 } },
  sectionTitle: { color: '#2196F3', marginBottom: 20, fontSize: 16 },
  infoItem: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: 8 },
  infoItemHighlight: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: '12px 16px', marginTop: 8 },
  infoLabel: { color: '#999' },
  infoValue: { color: '#333', fontWeight: 500 },
  
  // Decisões
  decisoesSection: { marginBottom: 30 },
  decisoesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, '@media (max-width: 1024px)': { gridTemplateColumns: 'repeat(2, 1fr)' }, '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } },
  decisaoCard: { padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8, borderLeft: '4px solid' },
  decisaoTitle: { margin: '0 0 10px 0', fontSize: 14 },
  decisaoStatus: { margin: '5px 0', fontWeight: 600, fontSize: 13 },
  decisaoData: { color: '#999', fontSize: 11 },
  decisaoPendente: { color: '#999', fontSize: 13 },
  
  // Ações
  acoesSection: { marginBottom: 30, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8 },
  comentarioArea: { marginBottom: 15 },
  textarea: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' },
  acoesGrid: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  btnAprovar: { padding: '12px 24px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnRejeitar: { padding: '12px 24px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnEncaminhar: { padding: '12px 24px', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  
  // Histórico
  historicoContainer: { borderLeft: '3px solid #2196F3', paddingLeft: 20, position: 'relative' },
  historicoItem: { marginBottom: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8, position: 'relative' },
  historicoDot: { position: 'absolute', left: -29, top: 20, width: 12, height: 12, backgroundColor: '#2196F3', borderRadius: '50%', border: '3px solid white' },
  historicoContent: { flex: 1 },
  historicoHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  historicoUsuario: { margin: '5px 0', color: '#666', fontSize: 13 },
  historicoComentario: { margin: '10px 0 0 0', padding: 10, backgroundColor: 'white', borderRadius: 5, color: '#666', fontStyle: 'italic', fontSize: 13 },
  emptyText: { color: '#999', padding: 20, textAlign: 'center' },
  
  // Documento
  documentoSection: { marginTop: 30, paddingTop: 20, borderTop: '1px solid #eee' },
  documentoLink: { display: 'inline-block', padding: '10px 16px', backgroundColor: '#EFF6FF', color: '#2196F3', borderRadius: 8, textDecoration: 'none', fontSize: 14 },
  
  // Horários Reais
  realTimesSection: { marginBottom: 30, padding: 20, backgroundColor: '#F0F9FF', borderRadius: 8, border: '1px solid #BAE6FD' },
  realTimesGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
};

export default DetalhePedido;

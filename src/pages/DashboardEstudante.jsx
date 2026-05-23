// src/pages/DashboardEstudante.jsx - VERSÃO SIMPLIFICADA E FUNCIONAL
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DashboardEstudante = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [coletivas, setColetivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
    carregarColetivas();
    carregarNotificacoes();
  }, []);

  const carregarDados = async () => {
    try {
      const res = await api.get('/pedidos/');
      setPedidos(res.data.pedidos || []);
    } catch (err) { console.error('Erro:', err); }
  };

  const carregarColetivas = async () => {
    try {
      const res = await api.get('/coletivas/minhas/');
      setColetivas(res.data.coletivas || []);
    } catch (err) { console.error('Erro coletivas:', err); }
    finally { setLoading(false); }
  };

  const carregarNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes/');
      setNotificacoesNaoLidas(res.data.nao_lidas);
    } catch (err) {}
  };

  const aceitarColetiva = async (conviteId) => {
    if (!confirm('✅ Aceitar esta saída coletiva?')) return;
    try {
      await api.post(`/coletivas/${conviteId}/aceitar/`);
      alert('✅ Pedido aceito com sucesso!');
      carregarColetivas();
      carregarDados();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao aceitar'));
    }
  };

  const getStatusInfo = (estado) => {
    const mapa = {
      'PENDENTE_DITE': { texto: 'Pendente', cor: '#f59e0b', bg: '#fef3c7' },
      'PENDENTE_DIRECAO': { texto: 'Em análise', cor: '#7c3aed', bg: '#ede9fe' },
      'PENDENTE_ADMIN': { texto: 'Aguardando', cor: '#2563eb', bg: '#dbeafe' },
      'APROVADO': { texto: 'Aprovado', cor: '#059669', bg: '#d1fae5' },
      'REJEITADO': { texto: 'Rejeitado', cor: '#dc2626', bg: '#fee2e2' },
      'EM_ANDAMENTO': { texto: 'Em saída', cor: '#0284c7', bg: '#e0f2fe' },
      'FINALIZADO': { texto: 'Finalizado', cor: '#64748b', bg: '#f1f5f9' },
    };
    return mapa[estado] || { texto: estado, cor: '#64748b', bg: '#f1f5f9' };
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>🎓 Olá, {user?.nome || user?.username}</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>Estudante</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/notificacoes')} style={{ padding: 8, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', position: 'relative' }}>
            🔔
            {notificacoesNaoLidas > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#dc2626', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{notificacoesNaoLidas}</span>}
          </button>
          <button onClick={onLogout} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Sair</button>
        </div>
      </div>

      {/* Botões de ação */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/criar-pedido')} style={{ padding: '12px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>📝 Novo Pedido</button>
        <button onClick={() => navigate('/coletivas')} style={{ padding: '12px 24px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>🚌 Saídas Coletivas {coletivas.length > 0 ? `(${coletivas.length})` : ''}</button>
      </div>

      {/* Saídas Coletivas Pendentes - DESTAQUE */}
      {coletivas.length > 0 && (
        <div style={{ marginBottom: 24, background: '#fef3c7', borderRadius: 12, padding: 16, borderLeft: '4px solid #d97706' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#92400e' }}>🚌 SAÍDAS COLETIVAS DISPONÍVEIS!</h3>
          {coletivas.map(c => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{c.titulo}</div>
                <div style={{ fontSize: 12, color: '#666' }}>📅 {c.data_saida}</div>
              </div>
              <button onClick={() => aceitarColetiva(c.id)} style={{ padding: '8px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>✅ ACEITAR</button>
            </div>
          ))}
        </div>
      )}

      {/* Meus Pedidos */}
      <h2 style={{ marginBottom: 16 }}>📋 Meus Pedidos</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Carregando...</div>
      ) : pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: '#f5f5f5', borderRadius: 12 }}>
          <p>Você ainda não tem pedidos.</p>
          <button onClick={() => navigate('/criar-pedido')} style={{ marginTop: 12, padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Criar primeiro pedido</button>
        </div>
      ) : (
        pedidos.map(p => {
          const st = getStatusInfo(p.estado);
          return (
            <div key={p.id} onClick={() => navigate(`/pedido/${p.id}`)} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{p.tipo_display}</div>
                <div style={{ fontSize: 12, color: '#666' }}>📅 {p.data_saida}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', background: st.bg, color: st.cor }}>{st.texto}</span>
            </div>
          );
        })
      )}
    </div>
  );
};

export default DashboardEstudante;
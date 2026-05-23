// src/pages/Notificacoes.jsx - CORRIGIDO
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Notificacoes = ({ user }) => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const carregarNotificacoes = async () => {
    try {
      const response = await api.get('/notificacoes/');
      setNotificacoes(response.data.notificacoes || []);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id) => {
    try {
      await api.post(`/notificacoes/${id}/ler/`);
      carregarNotificacoes();
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await api.post('/notificacoes/ler-todas/');
      carregarNotificacoes();
    } catch (err) {
      console.error('Erro ao marcar todas notificações:', err);
    }
  };

  const handleNotificacaoClick = (notif) => {
    marcarComoLida(notif.id);
    if (notif.pedido_id && notif.pedido_id !== 'undefined') {
      navigate(`/pedido/${notif.pedido_id}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Voltar</button>
        <h1 style={styles.title}>🔔 Notificações</h1>
        {notificacoes.some(n => !n.lida) && (
          <button onClick={marcarTodasComoLidas} style={styles.markAllBtn}>
            ✅ Marcar todas
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.loading}>Carregando...</div>
      ) : notificacoes.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>🔕</span>
          <p>Nenhuma notificação</p>
        </div>
      ) : (
        <div style={styles.notifList}>
          {notificacoes.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificacaoClick(notif)}
              style={{
                ...styles.notifItem,
                backgroundColor: notif.lida ? '#fff' : '#f0fdf4',
                borderLeft: notif.lida ? '3px solid #e5e7eb' : '3px solid #059669',
              }}
            >
              <div style={styles.notifContent}>
                <div style={styles.notifMessage}>{notif.mensagem}</div>
                <div style={styles.notifDate}>{notif.data}</div>
              </div>
              {!notif.lida && <div style={styles.notifDot} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '20px', minHeight: '100vh', background: '#f5f5f5' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  backBtn: { padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: 0, flex: 1 },
  markAllBtn: { padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: '#999' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#999' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  notifList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  notifItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  notifContent: { flex: 1 },
  notifMessage: { fontSize: '14px', color: '#333', marginBottom: '4px' },
  notifDate: { fontSize: '11px', color: '#999' },
  notifDot: { width: '8px', height: '8px', background: '#059669', borderRadius: '50%', marginLeft: '12px' },
};

export default Notificacoes;
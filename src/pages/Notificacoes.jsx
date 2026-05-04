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
      setNotificacoes(response.data.notificacoes);
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

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a' }}>🔔 Notificações</h1>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '10px',
              padding: '8px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Voltar
          </button>
        </div>
        <button
          onClick={marcarTodasComoLidas}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ✅ Marcar todas como lidas
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
      ) : notificacoes.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma notificação</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notificacoes.map(notif => (
            <div
              key={notif.id}
              onClick={() => {
                marcarComoLida(notif.id);
                navigate(`/pedido/${notif.pedido_id}`);
              }}
              style={{
                padding: '20px',
                backgroundColor: notif.lida ? 'white' : '#f0f7ff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                borderLeft: `4px solid ${notif.lida ? '#ddd' : '#2196F3'}`,
                transition: 'all 0.3s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ 
                  padding: '4px 12px',
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {notif.tipo_display}
                </span>
                <small style={{ color: '#999' }}>{notif.data}</small>
              </div>
              <p style={{ margin: 0, color: '#333' }}>{notif.mensagem}</p>
              {!notif.lida && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  color: '#2196F3',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ● Nova
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notificacoes;
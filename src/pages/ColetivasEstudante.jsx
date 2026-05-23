// src/pages/ColetivasEstudante.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ColetivasEstudante = () => {
  const [coletivas, setColetivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarColetivas();
  }, []);

  const carregarColetivas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coletivas/minhas/');
      setColetivas(res.data.coletivas || []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const aceitarColetiva = async (conviteId) => {
    if (!confirm('✅ Confirmar participação nesta saída coletiva?')) return;
    try {
      await api.post(`/coletivas/${conviteId}/aceitar/`);
      alert('✅ Pedido aceito com sucesso! Você está autorizado a sair.');
      carregarColetivas();
    } catch (err) {
      alert('❌ Erro: ' + (err.response?.data?.error || 'Erro ao aceitar'));
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: 20, padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>← Voltar</button>
      <h1 style={{ marginBottom: 8 }}>🚌 Saídas Coletivas</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Saídas sugeridas pela escola. Aceite para participar.</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Carregando...</div>
      ) : coletivas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#f5f5f5', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>Nenhuma saída coletiva disponível no momento.</p>
        </div>
      ) : (
        coletivas.map(c => (
          <div key={c.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#d97706' }}>{c.titulo}</h3>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              📅 {c.data_saida}<br />
              ⏰ Prazo: {c.prazo}<br />
              👤 Criado por: {c.criador}
            </div>
            <button onClick={() => aceitarColetiva(c.id)} style={{ width: '100%', padding: 12, background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>✅ ACEITAR SAÍDA</button>
          </div>
        ))
      )}
    </div>
  );
};

export default ColetivasEstudante;
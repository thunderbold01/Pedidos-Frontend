// src/pages/CriarPedido.jsx - SIMPLIFICADO
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CriarPedido = () => {
  const [form, setForm] = useState({
    tipo: 'outros',
    motivo: '',
    tema_saida: '',
    data_saida: '',
    data_volta: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.motivo.trim()) {
      setError('Digite o motivo da saída');
      setLoading(false);
      return;
    }
    if (form.tipo === 'outros' && !form.tema_saida.trim()) {
      setError('Informe o tema da saída');
      setLoading(false);
      return;
    }
    if (!form.data_saida) {
      setError('Selecione a data de saída');
      setLoading(false);
      return;
    }

    try {
      const dados = {
        tipo: form.tipo,
        motivo: form.motivo,
        tema_saida: form.tipo === 'outros' ? form.tema_saida : '',
        data_saida: form.data_saida,
        hora_saida: '07:00',
        data_volta: form.data_volta || form.data_saida,
        hora_volta: '12:00',
      };

      await api.post('/pedidos/criar/', dados);
      alert('✅ Pedido criado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: 20, padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>← Voltar</button>
      <h1>📝 Novo Pedido de Saída</h1>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 }}>⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 13 }}>Tipo de Saída</label>
          <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}>
            <option value="medicos">🏥 Médicos</option>
            <option value="infelecidade">😢 Infelicidade</option>
            <option value="escola">🏫 Sugerido pela Escola</option>
            <option value="outros">📋 Outros</option>
          </select>
        </div>

        {form.tipo === 'outros' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 13 }}>Tema da Saída *</label>
            <input type="text" value={form.tema_saida} onChange={e => setForm({...form, tema_saida: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} placeholder="Ex: Consulta médica" />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 13 }}>Motivo</label>
          <textarea value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} rows={3} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} placeholder="Descreva o motivo..." />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 13 }}>Data Saída *</label>
          <input type="date" value={form.data_saida} onChange={e => setForm({...form, data_saida: e.target.value})} min={hoje} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 13 }}>Data Retorno (opcional)</label>
          <input type="date" value={form.data_volta} onChange={e => setForm({...form, data_volta: e.target.value})} min={form.data_saida || hoje} style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="button" onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: 12, background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: 12, background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Enviando...' : 'Criar Pedido'}</button>
        </div>
      </form>
    </div>
  );
};

export default CriarPedido;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CriarPedido = ({ user }) => {
  const [form, setForm] = useState({
    tipo: 'outros',
    motivo: '',
    data_saida: '',
    hora_saida: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/pedidos/criar/', form);
      alert('Pedido criado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Novo Pedido</h2>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>Tipo de Pedido</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({...form, tipo: e.target.value})}
              style={inputStyle}
            >
              <option value="outros">Outros</option>
              <option value="medicos">Médicos</option>
              <option value="documentos">Documentos</option>
              <option value="escola">Sugerido pela Escola</option>
              <option value="coletiva">Saída Coletiva</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Motivo</label>
            <textarea
              value={form.motivo}
              onChange={(e) => setForm({...form, motivo: e.target.value})}
              required
              style={{...inputStyle, minHeight: '100px'}}
              placeholder="Descreva o motivo da saída..."
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Data de Saída</label>
            <input
              type="date"
              value={form.data_saida}
              onChange={(e) => setForm({...form, data_saida: e.target.value})}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Hora de Saída</label>
            <input
              type="time"
              value={form.hora_saida}
              onChange={(e) => setForm({...form, hora_saida: e.target.value})}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Criando...' : 'Criar Pedido'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '16px',
  marginTop: '5px'
};

export default CriarPedido;
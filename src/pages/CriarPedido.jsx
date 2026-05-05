// src/pages/CriarPedido.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const MOTIVOS = [
  { value: 'medico', label: '🏥 Médico' },
  { value: 'infelecidade', label: '😢 Infelicidade' },
  { value: 'escolar', label: '📚 Escolar' },
  { value: 'outros', label: '📋 Outros' },
];

const CriarPedido = ({ user }) => {
  const [form, setForm] = useState({
    tipo: 'outros',
    motivo: '',
    motivo_outro: '',
    data_saida: '',
    data_volta: '',
  });
  const [anexo, setAnexo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.motivo === 'outros' && !form.motivo_outro.trim()) {
      setError('Descreva o motivo da saída');
      setLoading(false);
      return;
    }

    try {
      const dados = {
        tipo: form.tipo,
        motivo: form.motivo === 'outros' ? form.motivo_outro : form.motivo,
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

  const getDiaSemana = (data) => {
    if (!data) return '';
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const d = new Date(data + 'T00:00:00');
    return dias[d.getDay()];
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f8fafc; }
        .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 520px; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
        .title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 24px; }
        .error { background: #fef2f2; color: #991b1b; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; border: 1px solid #fecaca; }
        .field { margin-bottom: 16px; }
        .label { display: block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .select, .input, .textarea { width: 100%; padding: 11px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #1e293b; background: #f8fafc; outline: none; font-family: 'Inter', sans-serif; transition: all 0.2s; }
        .select:focus, .input:focus, .textarea:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.08); }
        .textarea { min-height: 80px; resize: vertical; }
        .dia-semana { font-size: 12px; color: #64748b; margin-top: 4px; }
        .file-area { border: 2px dashed #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .file-area:hover { border-color: #dc2626; background: #fef2f2; }
        .file-name { font-size: 12px; color: #64748b; margin-top: 6px; }
        .btn-group { display: flex; gap: 10px; margin-top: 24px; }
        .btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; }
        .btn-cancel { background: #fff; border: 2px solid #e2e8f0; color: #64748b; }
        .btn-submit { background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; box-shadow: 0 4px 16px rgba(220,38,38,0.25); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 480px) { .card { padding: 20px; } .btn-group { flex-direction: column; } }
      `}</style>
      <div className="page">
        <div className="card">
          <h1 className="title">📝 Novo Pedido</h1>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Tipo de Pedido</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="select">
                <option value="outros">📋 Outros</option>
                <option value="medicos">🏥 Médicos</option>
                <option value="documentos">📄 Documentos</option>
                <option value="escola">🏫 Escola</option>
                <option value="coletiva">👥 Coletiva</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Motivo</label>
              <select value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} className="select">
                <option value="">Selecione...</option>
                {MOTIVOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            {form.motivo === 'outros' && (
              <div className="field">
                <label className="label">Descreva o motivo</label>
                <textarea value={form.motivo_outro} onChange={e => setForm({...form, motivo_outro: e.target.value})} className="textarea" placeholder="Descreva o motivo da saída..." />
              </div>
            )}
            <div className="field">
              <label className="label">Anexar Documento (opcional)</label>
              <div className="file-area" onClick={() => document.getElementById('anexo').click()}>
                <span style={{ fontSize: '28px' }}>📎</span>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Clique para anexar</p>
                <input id="anexo" type="file" style={{ display: 'none' }} onChange={e => setAnexo(e.target.files[0])} accept=".pdf,.jpg,.png,.doc,.docx" />
                {anexo && <p className="file-name">📄 {anexo.name}</p>}
              </div>
            </div>
            <div className="field">
              <label className="label">Data de Saída</label>
              <input type="date" value={form.data_saida} onChange={e => setForm({...form, data_saida: e.target.value})} required min={hoje} className="input" />
              {form.data_saida && <p className="dia-semana">{getDiaSemana(form.data_saida)} • Saída às 07:00</p>}
            </div>
            <div className="field">
              <label className="label">Data de Retorno</label>
              <input type="date" value={form.data_volta} onChange={e => setForm({...form, data_volta: e.target.value})} min={form.data_saida || hoje} className="input" />
              {form.data_volta && <p className="dia-semana">{getDiaSemana(form.data_volta)} • Retorno às 12:00</p>}
            </div>
            <div className="btn-group">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-cancel">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-submit">{loading ? 'Criando...' : 'Criar Pedido'}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CriarPedido;

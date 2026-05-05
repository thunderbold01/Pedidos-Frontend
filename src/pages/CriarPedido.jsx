// src/pages/CriarPedido.jsx - ATUALIZADO
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TIPOS = [
  { value: 'medicos', label: '🏥 Médicos' },
  { value: 'infelecidade', label: '😢 Infelicidade' },
  { value: 'escola', label: '🏫 Sugerido pela Escola' },
  { value: 'outros', label: '📋 Outros' },
];

const CriarPedido = ({ user }) => {
  const [form, setForm] = useState({
    tipo: 'outros',
    motivo: '',
    tema_saida: '',
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

    if (!form.motivo.trim()) {
      setError('Escreva o motivo da saída');
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

  const getDiaSemana = (data) => {
    if (!data) return '';
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const d = new Date(data + 'T00:00:00');
    return dias[d.getDay()];
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#f8fafc; -webkit-tap-highlight-color:transparent; }
        .page { min-height:100vh; min-height:100dvh; padding:16px; display:flex; align-items:flex-start; justify-content:center; }
        .card { background:#fff; border-radius:16px; padding:24px 20px; width:100%; max-width:500px; border:1px solid #e2e8f0; box-shadow:0 2px 12px rgba(0,0,0,0.03); }
        .header { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
        .back-btn { width:40px; height:40px; border:1px solid #e2e8f0; background:#fff; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; color:#64748b; flex-shrink:0; }
        .title { font-size:20px; font-weight:800; color:#0f172a; }
        .error { background:#fef2f2; color:#991b1b; padding:10px 14px; border-radius:8px; font-size:13px; margin-bottom:16px; border:1px solid #fecaca; }
        .field { margin-bottom:16px; }
        .label { display:block; font-size:11px; font-weight:600; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px; }
        .select, .input, .textarea { width:100%; padding:12px 14px; border:2px solid #e2e8f0; border-radius:10px; font-size:16px; color:#1e293b; background:#f8fafc; outline:none; font-family:'Inter',sans-serif; transition:all 0.2s; -webkit-appearance:none; appearance:none; }
        .select { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
        .select:focus, .input:focus, .textarea:focus { border-color:#dc2626; box-shadow:0 0 0 3px rgba(220,38,38,0.08); background:#fff; }
        .textarea { min-height:90px; resize:vertical; font-size:16px; }
        .dia-semana { font-size:12px; color:#64748b; margin-top:4px; }
        .file-area { border:2px dashed #e2e8f0; border-radius:10px; padding:20px; text-align:center; cursor:pointer; transition:all 0.2s; }
        .file-area:active { background:#fef2f2; border-color:#dc2626; }
        .file-icon { font-size:32px; }
        .file-text { font-size:13px; color:#64748b; margin-top:4px; }
        .file-name { font-size:12px; color:#059669; margin-top:6px; font-weight:500; }
        .row { display:flex; gap:10px; }
        .row .field { flex:1; }
        .btn-group { display:flex; gap:10px; margin-top:24px; }
        .btn { flex:1; padding:14px 12px; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; text-align:center; }
        .btn:active { transform:scale(0.97); }
        .btn-cancel { background:#fff; border:2px solid #e2e8f0; color:#64748b; }
        .btn-submit { background:linear-gradient(135deg,#dc2626,#ef4444); color:#fff; box-shadow:0 4px 12px rgba(220,38,38,0.2); }
        .btn-submit:disabled { opacity:0.5; }
        @media (max-width:400px) { .page { padding:8px; } .card { padding:18px 14px; } .row { flex-direction:column; gap:0; } }
      `}</style>

      <div className="page">
        <div className="card">
          <div className="header">
            <button onClick={() => navigate('/dashboard')} className="back-btn">←</button>
            <h1 className="title">Novo Pedido</h1>
          </div>

          {error && <div className="error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Tipo */}
            <div className="field">
              <label className="label">Tipo de Saída</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="select">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Tema (se Outros) */}
            {form.tipo === 'outros' && (
              <div className="field">
                <label className="label">Tema da Saída *</label>
                <input type="text" value={form.tema_saida} onChange={e => setForm({...form, tema_saida: e.target.value})} className="input" placeholder="Ex: Consulta médica, banco..." required />
              </div>
            )}

            {/* Motivo */}
            <div className="field">
              <label className="label">Motivo</label>
              <textarea value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} className="textarea" placeholder="Descreva o motivo da saída..." rows={2} required />
            </div>

            {/* Anexo */}
            <div className="field">
              <label className="label">Anexo (opcional)</label>
              <div className="file-area" onClick={() => document.getElementById('anexo').click()}>
                <div className="file-icon">📎</div>
                <p className="file-text">Toque para anexar documento</p>
                <input id="anexo" type="file" style={{ display: 'none' }} onChange={e => setAnexo(e.target.files[0])} accept=".pdf,.jpg,.png,.doc,.docx" />
                {anexo && <p className="file-name">📄 {anexo.name}</p>}
              </div>
            </div>

            {/* Datas */}
            <div className="row">
              <div className="field">
                <label className="label">Data Saída</label>
                <input type="date" value={form.data_saida} onChange={e => setForm({...form, data_saida: e.target.value})} required min={hoje} className="input" />
                {form.data_saida && <p className="dia-semana">{getDiaSemana(form.data_saida)} • 07:00</p>}
              </div>
              <div className="field">
                <label className="label">Data Retorno</label>
                <input type="date" value={form.data_volta} onChange={e => setForm({...form, data_volta: e.target.value})} min={form.data_saida || hoje} className="input" />
                {form.data_volta && <p className="dia-semana">{getDiaSemana(form.data_volta)} • 12:00</p>}
              </div>
            </div>

            <div className="btn-group">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-cancel">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-submit">{loading ? 'Enviando...' : 'Criar Pedido'}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CriarPedido;

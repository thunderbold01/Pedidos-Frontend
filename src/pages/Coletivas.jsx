// src/pages/Coletivas.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Coletivas = ({ user }) => {
  const [coletivas, setColetivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarColetivas();
  }, []);

  const carregarColetivas = async () => {
    try {
      const res = await api.get('/coletivas/');
      setColetivas(res.data.coletivas || []);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (conviteId, resposta) => {
    const texto = resposta === 'ACEITE' ? 'aceitar' : 'recusar';
    if (!confirm(`Confirma ${texto} esta saída coletiva?`)) return;
    
    try {
      await api.post(`/coletivas/${conviteId}/responder/`, { resposta });
      carregarColetivas();
      alert(`Saída ${texto}a com sucesso!`);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao responder');
    }
  };

  const getEstadoColetiva = (estado) => {
    const info = {
      'PENDENTE': { texto: 'Pendente', cor: '#f59e0b', bg: '#fef3c7' },
      'ACEITE': { texto: 'Aceite', cor: '#059669', bg: '#d1fae5' },
      'RECUSADO': { texto: 'Recusado', cor: '#dc2626', bg: '#fee2e2' },
      'EXPIRADO': { texto: 'Expirado', cor: '#6b7280', bg: '#f3f4f6' },
    };
    return info[estado] || { texto: estado, cor: '#6b7280', bg: '#f3f4f6' };
  };

  const pendentes = coletivas.filter(c => c.estado === 'PENDENTE');
  const respondidas = coletivas.filter(c => c.estado !== 'PENDENTE');

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#f8fafc}
        .page{min-height:100vh;padding:20px;max-width:700px;margin:0 auto}
        .header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
        .back-btn{width:40px;height:40px;border:1px solid #e2e8f0;background:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:#64748b}
        .title{font-size:22px;font-weight:800;color:#0f172a}
        .subtitle{font-size:13px;color:#64748b;margin-bottom:24px}
        .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,.03)}
        .card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
        .card-title{font-size:16px;font-weight:700;color:#0f172a}
        .card-date{font-size:12px;color:#94a3b8}
        .card-desc{font-size:13px;color:#475569;margin-bottom:10px}
        .card-info{display:flex;gap:16px;font-size:12px;color:#64748b;margin-bottom:12px;flex-wrap:wrap}
        .card-info span{display:flex;align-items:center;gap:4px}
        .status-badge{display:inline-block;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase}
        .btn-group{display:flex;gap:8px}
        .btn{flex:1;padding:10px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif}
        .btn-aceitar{background:#059669;color:#fff}
        .btn-recusar{background:#fff;color:#dc2626;border:2px solid #fecaca}
        .btn:disabled{opacity:.5}
        .empty{text-align:center;padding:60px 20px;color:#94a3b8}
        .spinner{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#059669;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 14px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .section-title{font-size:14px;font-weight:700;color:#0f172a;margin:20px 0 10px;text-transform:uppercase;letter-spacing:.5px}
      `}</style>

      <div className="page">
        <div className="header">
          <button onClick={() => navigate('/dashboard')} className="back-btn">←</button>
          <h1 className="title">Saídas Coletivas</h1>
        </div>
        <p className="subtitle">Saídas sugeridas pela escola para você aceitar ou recusar</p>

        {loading ? (
          <div className="empty"><div className="spinner"/><p>Carregando...</p></div>
        ) : coletivas.length === 0 ? (
          <div className="empty">
            <span style={{fontSize:48}}>📋</span>
            <h3>Nenhuma saída coletiva</h3>
            <p>Não há convites para saídas coletivas no momento</p>
          </div>
        ) : (
          <>
            {pendentes.length > 0 && (
              <>
                <div className="section-title">⏳ Pendentes ({pendentes.length})</div>
                {pendentes.map(c => (
                  <div key={c.id} className="card" style={{borderLeft:'4px solid #f59e0b'}}>
                    <div className="card-header">
                      <div className="card-title">{c.titulo}</div>
                      <span className="status-badge" style={{background:'#fef3c7',color:'#d97706'}}>Pendente</span>
                    </div>
                    {c.descricao && <div className="card-desc">{c.descricao}</div>}
                    <div className="card-info">
                      <span>📅 Saída: {c.data_saida}</span>
                      <span>🔙 Volta: {c.data_volta}</span>
                      <span>⏰ Prazo: {c.prazo}</span>
                      <span>👤 Por: {c.criador}</span>
                    </div>
                    <div className="btn-group">
                      <button onClick={() => handleResponder(c.id, 'ACEITE')} className="btn btn-aceitar">✅ Aceitar</button>
                      <button onClick={() => handleResponder(c.id, 'RECUSADO')} className="btn btn-recusar">❌ Recusar</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {respondidas.length > 0 && (
              <>
                <div className="section-title">📋 Respondidas ({respondidas.length})</div>
                {respondidas.map(c => {
                  const st = getEstadoColetiva(c.estado);
                  return (
                    <div key={c.id} className="card" style={{opacity:0.7,borderLeft:`4px solid ${st.cor}`}}>
                      <div className="card-header">
                        <div className="card-title">{c.titulo}</div>
                        <span className="status-badge" style={{background:st.bg,color:st.cor}}>{st.texto}</span>
                      </div>
                      <div className="card-info">
                        <span>📅 Saída: {c.data_saida}</span>
                        <span>🔙 Volta: {c.data_volta}</span>
                        <span>👤 Por: {c.criador}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Coletivas;

// src/pages/Coletivas.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Coletivas = ({ user }) => {
  const [coletivas, setColetivas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    carregarColetivas();
  }, []);

  const carregarColetivas = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/coletivas/minhas/');
      setColetivas(res.data.coletivas || []);
    } catch (err) {
      console.error('Erro ao carregar coletivas:', err);
      setError(err.response?.data?.error || 'Erro ao carregar saídas coletivas');
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (conviteId, resposta) => {
    const texto = resposta === 'ACEITE' ? 'aceitar' : 'recusar';
    if (!confirm(`Confirma ${texto} esta saída coletiva?`)) return;
    
    setLoading(true);
    try {
      await api.post(`/coletivas/${conviteId}/responder/`, { resposta });
      await carregarColetivas();
      alert(`✅ Saída ${texto}a com sucesso!`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro ao responder';
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColetiva = (estado) => {
    const info = {
      'PENDENTE': { texto: 'Pendente', cor: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
      'ACEITE': { texto: 'Aceite', cor: '#059669', bg: '#d1fae5', icon: '✅' },
      'RECUSADO': { texto: 'Recusado', cor: '#dc2626', bg: '#fee2e2', icon: '❌' },
      'EXPIRADO': { texto: 'Expirado', cor: '#6b7280', bg: '#f3f4f6', icon: '⏰' },
    };
    return info[estado] || { texto: estado, cor: '#6b7280', bg: '#f3f4f6', icon: '📋' };
  };

  const podeResponder = (coletiva) => {
    return coletiva.estado === 'PENDENTE' && coletiva.pode_responder !== false;
  };

  const pendentes = coletivas.filter(c => c.estado === 'PENDENTE' && c.pode_responder !== false);
  const respondidas = coletivas.filter(c => c.estado !== 'PENDENTE');

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Inter',sans-serif;background:#f8fafc}
        .page{min-height:100vh;padding:20px;max-width:700px;margin:0 auto}
        .header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
        .back-btn{width:40px;height:40px;border:1px solid #e2e8f0;background:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:#64748b;transition:all 0.2s}
        .back-btn:hover{background:#f8fafc;border-color:#cbd5e1}
        .title{font-size:22px;font-weight:800;color:#0f172a}
        .subtitle{font-size:13px;color:#64748b;margin-bottom:24px}
        .error-alert{background:#fef2f2;color:#991b1b;padding:12px;border-radius:10px;margin-bottom:16px;font-size:13px;border:1px solid #fecaca}
        .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.03);transition:all 0.2s}
        .card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
        .card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px}
        .card-title{font-size:16px;font-weight:700;color:#0f172a}
        .card-date{font-size:12px;color:#94a3b8}
        .card-desc{font-size:13px;color:#475569;margin-bottom:10px;line-height:1.5}
        .card-info{display:flex;gap:16px;font-size:12px;color:#64748b;margin-bottom:12px;flex-wrap:wrap}
        .card-info span{display:flex;align-items:center;gap:4px}
        .criador-info{font-size:11px;color:#94a3b8;margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9}
        .status-badge{display:inline-block;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
        .btn-group{display:flex;gap:8px;margin-top:12px}
        .btn{flex:1;padding:10px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s}
        .btn-aceitar{background:#059669;color:#fff}
        .btn-aceitar:hover{background:#047857;transform:translateY(-1px)}
        .btn-recusar{background:#fff;color:#dc2626;border:2px solid #fecaca}
        .btn-recusar:hover{background:#fef2f2;border-color:#fca5a5}
        .btn:active{transform:scale(0.97)}
        .btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .empty{text-align:center;padding:60px 20px;color:#94a3b8}
        .spinner{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#059669;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 14px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .section-title{font-size:14px;font-weight:700;color:#0f172a;margin:20px 0 12px;text-transform:uppercase;letter-spacing:.5px;display:flex;align-items:center;gap:8px}
        .count-badge{background:#e2e8f0;color:#475569;padding:2px 8px;border-radius:20px;font-size:11px}
        .prazo-expirado{background:#fef2f2;border-left-color:#dc2626}
        .refresh-btn{background:#fff;border:1px solid #e2e8f0;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;margin-left:auto}
        @media (max-width:480px){.page{padding:12px}.card{padding:14px}.card-info{gap:10px}.btn-group{flex-direction:column}.btn{width:100%}}
      `}</style>

      <div className="page">
        <div className="header">
          <button onClick={() => navigate('/dashboard')} className="back-btn">←</button>
          <h1 className="title">Saídas Coletivas</h1>
          <button onClick={carregarColetivas} className="refresh-btn" style={{marginLeft:'auto'}}>🔄</button>
        </div>
        <p className="subtitle">Saídas sugeridas pela escola para você aceitar ou recusar</p>

        {error && <div className="error-alert">⚠️ {error}</div>}

        {loading ? (
          <div className="empty"><div className="spinner"/><p>Carregando...</p></div>
        ) : coletivas.length === 0 ? (
          <div className="empty">
            <span style={{fontSize:48,opacity:0.5}}>📋</span>
            <h3 style={{marginTop:12,fontSize:16}}>Nenhuma saída coletiva</h3>
            <p style={{fontSize:13,marginTop:4}}>Não há convites para saídas coletivas no momento</p>
          </div>
        ) : (
          <>
            {pendentes.length > 0 && (
              <>
                <div className="section-title">
                  ⏳ Pendentes <span className="count-badge">{pendentes.length}</span>
                </div>
                {pendentes.map(c => (
                  <div key={c.id} className="card" style={{borderLeft:'4px solid #f59e0b'}}>
                    <div className="card-header">
                      <div className="card-title">{c.titulo}</div>
                      <span className="status-badge" style={{background:'#fef3c7',color:'#d97706'}}>Pendente</span>
                    </div>
                    {c.descricao && <div className="card-desc">{c.descricao}</div>}
                    <div className="card-info">
                      <span>📅 {c.data_saida}</span>
                      <span>🔙 {c.data_volta}</span>
                      <span>⏰ Prazo: {c.prazo}</span>
                    </div>
                    <div className="criador-info">
                      👤 Criado por: {c.criador} ({c.criador_role})
                    </div>
                    <div className="btn-group">
                      <button 
                        onClick={() => handleResponder(c.id, 'ACEITE')} 
                        className="btn btn-aceitar"
                        disabled={loading}
                      >
                        ✅ Aceitar
                      </button>
                      <button 
                        onClick={() => handleResponder(c.id, 'RECUSADO')} 
                        className="btn btn-recusar"
                        disabled={loading}
                      >
                        ❌ Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {respondidas.length > 0 && (
              <>
                <div className="section-title">
                  📋 Respondidas <span className="count-badge">{respondidas.length}</span>
                </div>
                {respondidas.map(c => {
                  const st = getEstadoColetiva(c.estado);
                  return (
                    <div key={c.id} className="card" style={{borderLeft:`4px solid ${st.cor}`, opacity:0.85}}>
                      <div className="card-header">
                        <div className="card-title">{c.titulo}</div>
                        <span className="status-badge" style={{background:st.bg,color:st.cor}}>
                          {st.icon} {st.texto}
                        </span>
                      </div>
                      {c.descricao && <div className="card-desc">{c.descricao}</div>}
                      <div className="card-info">
                        <span>📅 {c.data_saida}</span>
                        <span>🔙 {c.data_volta}</span>
                      </div>
                      <div className="criador-info">
                        👤 Criado por: {c.criador}
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
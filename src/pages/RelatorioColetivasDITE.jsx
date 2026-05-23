// src/pages/RelatorioColetivasDITE.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const RelatorioColetivasDITE = () => {
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const gerarRelatorio = async () => {
    setLoading(true);
    try {
      const res = await api.get('/relatorios/dite/coletivas/');
      setRelatorio(res.data);
      alert('✅ Relatório gerado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao gerar relatório: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadRelatorio = async () => {
    if (!relatorio) return;
    try {
      const response = await api.get('/relatorios/download-texto/1/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio_coletivas.txt');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ Erro ao baixar relatório');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: 20, padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>← Voltar</button>
      <h1>📊 Relatório de Saídas Coletivas</h1>
      <div style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
        <button onClick={gerarRelatorio} disabled={loading} style={{ padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{loading ? 'Gerando...' : 'Gerar Relatório'}</button>
        {relatorio && <button onClick={downloadRelatorio} style={{ padding: '12px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Baixar TXT</button>}
      </div>
      {relatorio && <pre style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{relatorio.conteudo}</pre>}
    </div>
  );
};

export default RelatorioColetivasDITE;

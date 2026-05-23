// src/pages/RelatorioColetivasDITE.jsx
import { useState } from 'react';
import api from '../api';

const RelatorioColetivasDITE = () => {
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(false);

  const gerarRelatorio = async () => {
    setLoading(true);
    try {
      const res = await api.get('/relatorios/dite/coletivas/');
      setRelatorio(res.data);
      alert('✅ Relatório gerado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const downloadRelatorio = async () => {
    if (!relatorio) return;
    try {
      const res = await api.get(`/relatorios/download/${relatorio.relatorio_id}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_coletivas.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('❌ Erro ao baixar');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>📊 Relatório de Saídas Coletivas</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Gerencie e visualize relatórios das saídas coletivas</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={gerarRelatorio} disabled={loading} style={{ padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Gerando...' : '📄 Gerar Relatório'}
        </button>
        {relatorio && (
          <button onClick={downloadRelatorio} style={{ padding: '12px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            💾 Baixar Relatório (TXT)
          </button>
        )}
      </div>

      {relatorio && (
        <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: '70vh', overflow: 'auto', border: '1px solid #e0e0e0' }}>
          {relatorio.conteudo}
        </div>
      )}
    </div>
  );
};

export default RelatorioColetivasDITE;
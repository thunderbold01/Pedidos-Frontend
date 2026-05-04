// src/pages/RelatorioSeguranca.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const RelatorioSeguranca = ({ user }) => {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarRelatorio();
  }, [data]);

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/seguranca/relatorio/?data=${data}`);
      setRelatorio(res.data);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      alert('Erro ao carregar relatório de segurança');
    } finally {
      setLoading(false);
    }
  };

  const imprimirRelatorio = () => {
    const janela = window.open('', '_blank', 'width=1000,height=700');
    
    janela.document.write(`
      <html>
        <head>
          <title>Relatório de Segurança - ${data}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            h1 { color: #1a1a2e; border-bottom: 3px solid #FF5722; padding-bottom: 10px; }
            .header-info { display: flex; justify-content: space-between; margin: 20px 0; }
            .header-info div { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #1a1a2e; color: white; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
            .saida { color: #4CAF50; font-weight: bold; }
            .retorno { color: #2196F3; font-weight: bold; }
            .atrasado { background: #FFF5F5; }
            .atrasado td { color: #f44336; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>🛡️ Relatório de Entradas e Saídas</h1>
          <div class="header-info">
            <div><strong>Data:</strong> ${new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Total de Saídas:</strong> ${relatorio?.total || 0}</div>
            <div><strong>Atrasados:</strong> ${relatorio?.atrasados || 0}</div>
          </div>
          <button onclick="window.print()" style="padding:10px 20px; background:#FF5722; color:white; border:none; border-radius:8px; cursor:pointer; margin-bottom:20px; font-size:14px; font-weight:600;">
            🖨️ Imprimir Relatório
          </button>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Estudante</th>
                <th>Curso</th>
                <th>Classe</th>
                <th>Tipo</th>
                <th>Saída Prevista</th>
                <th>Volta Prevista</th>
                <th>Saída Real</th>
                <th>Retorno Real</th>
                <th>Status</th>
                <th>Atraso</th>
              </tr>
            </thead>
            <tbody>
              ${(relatorio?.saidas || []).map(s => `
                <tr class="${s.atrasado ? 'atrasado' : ''}">
                  <td>#${s.id}</td>
                  <td>${s.estudante}</td>
                  <td>${s.curso || '-'}</td>
                  <td>${s.classe || '-'}</td>
                  <td>${s.tipo}</td>
                  <td>${s.data_saida_prevista}</td>
                  <td>${s.data_volta_prevista}</td>
                  <td class="saida">${s.hora_saida_real}</td>
                  <td class="retorno">${s.hora_retorno_real}</td>
                  <td>${s.estado}</td>
                  <td>${s.atrasado ? s.tempo_atraso + 'min' : '---'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')} por ${user.nome || user.username}</p>
            <p>Sistema de Gestão de Pedidos - Módulo Segurança</p>
          </div>
        </body>
      </html>
    `);
    janela.document.close();
  };

  const getStatusDisplay = (estado, atrasado, tempo) => {
    if (atrasado) return { texto: `⚠️ Atrasado (${tempo}min)`, cor: '#f44336', bg: '#FFEBEE' };
    if (estado === 'FINALIZADO') return { texto: '✅ Finalizado', cor: '#4CAF50', bg: '#E8F5E9' };
    if (estado === 'EM_ANDAMENTO') return { texto: '🚶 Em Andamento', cor: '#2196F3', bg: '#E3F2FD' };
    if (estado === 'APROVADO') return { texto: '⏳ Aguardando', cor: '#FF9800', bg: '#FFF3E0' };
    return { texto: estado, cor: '#999', bg: '#F5F5F5' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            ← Voltar ao Dashboard
          </button>
          <h1 style={styles.title}>🛡️ Relatório de Entradas e Saídas</h1>
          <p style={styles.subtitle}>
            Controle completo de movimentação do portão
          </p>
        </div>
        <div style={styles.headerActions}>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={styles.dateInput}
          />
          <button onClick={imprimirRelatorio} style={styles.printBtn}>
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Carregando relatório...</p>
        </div>
      ) : !relatorio ? (
        <div style={styles.empty}>
          <p>Erro ao carregar dados</p>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div style={styles.cardsRow}>
            <div style={styles.card}>
              <div style={styles.cardIcon}>📋</div>
              <div style={styles.cardValue}>{relatorio.total || 0}</div>
              <div style={styles.cardLabel}>Total de Saídas</div>
            </div>
            <div style={{ ...styles.card, borderColor: '#4CAF50' }}>
              <div style={styles.cardIcon}>✅</div>
              <div style={{ ...styles.cardValue, color: '#4CAF50' }}>
                {(relatorio.total || 0) - (relatorio.atrasados || 0)}
              </div>
              <div style={styles.cardLabel}>No Horário</div>
            </div>
            <div style={{ 
              ...styles.card, 
              borderColor: '#f44336',
              boxShadow: (relatorio.atrasados || 0) > 0 ? '0 4px 20px rgba(244,67,54,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={styles.cardIcon}>⚠️</div>
              <div style={{ ...styles.cardValue, color: '#f44336' }}>{relatorio.atrasados || 0}</div>
              <div style={styles.cardLabel}>Atrasados</div>
            </div>
          </div>

          {/* Tabela */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>
                📋 Registros do Dia: {new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
            </div>

            {relatorio.saidas?.length === 0 ? (
              <div style={styles.emptyTable}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p>Nenhuma saída registrada nesta data</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Estudante</th>
                      <th style={styles.th}>Curso/Classe</th>
                      <th style={styles.th}>Tipo</th>
                      <th style={styles.th}>Prev. Saída</th>
                      <th style={styles.th}>Prev. Volta</th>
                      <th style={styles.th}>Saída Real</th>
                      <th style={styles.th}>Retorno Real</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.saidas.map(saida => {
                      const status = getStatusDisplay(saida.estado, saida.atrasado, saida.tempo_atraso);
                      return (
                        <tr key={saida.id} style={{
                          ...styles.tr,
                          background: saida.atrasado ? '#FFF5F5' : 'white',
                        }}>
                          <td style={{ ...styles.td, fontWeight: '700', color: '#FF5722' }}>
                            #{saida.id}
                          </td>
                          <td style={styles.td}>
                            <div style={{ fontWeight: '600' }}>{saida.estudante}</div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ fontSize: '13px' }}>{saida.curso || '-'}</div>
                            <small style={{ color: '#999' }}>{saida.classe || '-'}</small>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: '#E3F2FD',
                              color: '#2196F3',
                            }}>
                              {saida.tipo}
                            </span>
                          </td>
                          <td style={styles.td}>{saida.data_saida_prevista}</td>
                          <td style={styles.td}>{saida.data_volta_prevista}</td>
                          <td style={styles.td}>
                            <span style={{ color: '#4CAF50', fontWeight: '600' }}>
                              {saida.hora_saida_real}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ 
                              color: saida.atrasado ? '#f44336' : '#2196F3', 
                              fontWeight: '600' 
                            }}>
                              {saida.hora_retorno_real}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: status.bg,
                              color: status.cor,
                              border: `1px solid ${status.cor}30`,
                            }}>
                              {status.texto}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumo Final */}
          <div style={styles.resumoFinal}>
            <h3>📊 Resumo do Dia</h3>
            <div style={styles.resumoGrid}>
              <div style={styles.resumoItem}>
                <span>Total de Saídas:</span>
                <strong>{relatorio.total || 0}</strong>
              </div>
              <div style={styles.resumoItem}>
                <span>No Horário:</span>
                <strong style={{ color: '#4CAF50' }}>
                  {(relatorio.total || 0) - (relatorio.atrasados || 0)}
                </strong>
              </div>
              <div style={styles.resumoItem}>
                <span>Atrasados:</span>
                <strong style={{ color: '#f44336' }}>{relatorio.atrasados || 0}</strong>
              </div>
              <div style={styles.resumoItem}>
                <span>Taxa de Pontualidade:</span>
                <strong style={{ color: '#4CAF50' }}>
                  {relatorio.total > 0 
                    ? (((relatorio.total - (relatorio.atrasados || 0)) / relatorio.total) * 100).toFixed(1)
                    : 0}%
                </strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f5f7fa',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  backBtn: {
    padding: '8px 16px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '28px',
    color: '#1a1a2e',
    margin: 0,
    fontWeight: '800',
  },
  subtitle: {
    color: '#666',
    margin: '4px 0 0 0',
    fontSize: '14px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  dateInput: {
    padding: '10px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
  },
  printBtn: {
    padding: '10px 20px',
    background: '#FF5722',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '2px solid #f0f0f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  cardIcon: { fontSize: '36px', marginBottom: '8px' },
  cardValue: { fontSize: '32px', fontWeight: '800', color: '#1a1a2e' },
  cardLabel: { fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: '600', marginTop: '4px' },
  tableContainer: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#fafbfc',
    padding: '14px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    borderBottom: '2px solid #f0f0f0',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f8f8f8' },
  td: { padding: '14px 12px', fontSize: '13px' },
  emptyTable: { textAlign: 'center', padding: '60px 20px', color: '#999' },
  resumoFinal: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  resumoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginTop: '12px',
  },
  resumoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#fafbfc',
    borderRadius: '10px',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #FF5722',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  empty: { textAlign: 'center', padding: '80px 20px', color: '#999' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  tr:hover { background: #fafbfc !important; }
`;
document.head.appendChild(styleSheet);

export default RelatorioSeguranca;
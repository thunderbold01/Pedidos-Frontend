import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = ({ user, onLogout }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      const response = await api.get('/pedidos/');
      setPedidos(response.data);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcao = async (pedidoId, acao) => {
    try {
      await api.post(`/pedidos/${pedidoId}/${acao}/`);
      alert('Ação realizada com sucesso!');
      carregarPedidos(); // Recarregar lista
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Erro desconhecido'));
    }
  };

  const getStatusColor = (estado) => {
    if (estado.includes('APROVADO')) return '#4caf50';
    if (estado.includes('REJEITADO')) return '#f44336';
    if (estado.includes('DITE')) return '#4caf50';
    if (estado.includes('DIRECAO')) return '#ff9800';
    if (estado.includes('ADMIN')) return '#f44336';
    return '#999';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Bem-vindo, {user.nome || user.username} ({user.role})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {user.role === 'ESTUDANTE' && (
            <button
              onClick={() => navigate('/criar-pedido')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Novo Pedido
            </button>
          )}
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Pedidos</h2>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Carregando...</p>
        ) : pedidos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Nenhum pedido encontrado</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Estudante</th>
                  <th style={thStyle}>Curso</th>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Responsável</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => (
                  <tr key={pedido.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>#{pedido.id}</td>
                    <td style={tdStyle}>{pedido.estudante_nome}</td>
                    <td style={tdStyle}>{pedido.estudante_curso}</td>
                    <td style={tdStyle}>{pedido.data_saida}</td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: getStatusColor(pedido.estado),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td style={tdStyle}>{pedido.responsavel_atual}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {/* Aprovar */}
                        {['ADMIN', 'DIRECAO', 'DITE'].includes(user.role) && 
                         pedido.estado !== 'APROVADO' && pedido.estado !== 'REJEITADO' && (
                          <button
                            onClick={() => handleAcao(pedido.id, 'aprovar')}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✓ Aprovar
                          </button>
                        )}
                        
                        {/* Rejeitar */}
                        {['ADMIN', 'DIRECAO', 'DITE'].includes(user.role) && 
                         pedido.estado !== 'APROVADO' && pedido.estado !== 'REJEITADO' && (
                          <button
                            onClick={() => handleAcao(pedido.id, 'rejeitar')}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✗ Rejeitar
                          </button>
                        )}
                        
                        {/* Passar */}
                        {pedido.responsavel_atual !== 'ADMIN' && 
                         pedido.estado !== 'APROVADO' && pedido.estado !== 'REJEITADO' && 
                         (user.role === pedido.responsavel_atual || user.role === 'ADMIN') && (
                          <button
                            onClick={() => handleAcao(pedido.id, 'passar')}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#ff9800',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            → Passar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: '12px',
  textAlign: 'left',
  color: '#666',
  fontWeight: '600',
  fontSize: '14px'
};

const tdStyle = {
  padding: '12px',
  color: '#333',
  fontSize: '14px'
};

export default Dashboard;
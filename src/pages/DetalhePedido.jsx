import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const DetalhePedido = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    try {
      const response = await api.get(`/pedidos/${id}/`);
      setPedido(response.data);
    } catch (err) {
      console.error('Erro ao carregar pedido:', err);
      alert('Erro ao carregar detalhes do pedido');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAcao = async (acao) => {
    try {
      const data = acao === 'rejeitar' ? { comentario } : {};
      if (acao === 'rejeitar' && !comentario) {
        alert('Informe o motivo da rejeição');
        return;
      }
      
      await api.post(`/pedidos/${id}/${acao}/`, data);
      alert('Ação realizada com sucesso!');
      carregarPedido();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || 'Erro desconhecido'));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Carregando...</h2>
      </div>
    );
  }

  if (!pedido) {
    return null;
  }

  const getStatusColor = (estado) => {
    const cores = {
      'PENDENTE_DITE': '#4CAF50',
      'PENDENTE_DIRECAO': '#FF9800',
      'PENDENTE_ADMIN': '#F44336',
      'APROVADO': '#4CAF50',
      'REJEITADO': '#F44336'
    };
    return cores[estado] || '#999';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← Voltar
      </button>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '30px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #eee'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#1a1a1a' }}>Pedido #{pedido.id}</h1>
            <p style={{ margin: '5px 0 0 0', color: '#999' }}>
              Criado em {pedido.created_at}
            </p>
          </div>
          <span style={{
            padding: '10px 20px',
            backgroundColor: getStatusColor(pedido.estado),
            color: 'white',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {pedido.icone_estado} {pedido.estado_display}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ color: '#2196F3', marginBottom: '20px' }}>📋 Informações do Pedido</h3>
            <InfoItem label="Tipo" value={pedido.tipo_display} />
            <InfoItem label="Data de Saída" value={pedido.data_saida} />
            <InfoItem label="Hora de Saída" value={pedido.hora_saida} />
            <InfoItem label="Motivo" value={pedido.motivo} />
          </div>

          <div>
            <h3 style={{ color: '#2196F3', marginBottom: '20px' }}>👤 Informações do Estudante</h3>
            <InfoItem label="Nome" value={pedido.estudante.nome} />
            <InfoItem label="Email" value={pedido.estudante.email} />
            <InfoItem label="Curso" value={pedido.estudante.curso} />
            <InfoItem label="Classe" value={pedido.estudante.classe} />
          </div>
        </div>

        {/* Decisões */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2196F3', marginBottom: '20px' }}>📝 Decisões</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            <DecisaoCard 
              titulo="DITE" 
              decisao={pedido.decisao_dite} 
              data={pedido.data_decisao_dite}
              cor="#4CAF50"
            />
            <DecisaoCard 
              titulo="Direção" 
              decisao={pedido.decisao_direcao} 
              data={pedido.data_decisao_direcao}
              cor="#FF9800"
            />
            <DecisaoCard 
              titulo="Admin" 
              decisao={pedido.decisao_admin} 
              data={pedido.data_decisao_admin}
              cor="#9C27B0"
            />
          </div>
        </div>

        {/* Ações Disponíveis */}
        {pedido.acoes_disponiveis?.length > 0 && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>🎯 Ações Disponíveis</h3>
            
            {pedido.acoes_disponiveis.includes('rejeitar') && (
              <div style={{ marginBottom: '15px' }}>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Motivo da rejeição (obrigatório)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    minHeight: '80px',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {pedido.acoes_disponiveis.includes('aprovar') && (
                <button
                  onClick={() => handleAcao('aprovar')}
                  style={{
                    padding: '12px 30px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  ✅ Aprovar
                </button>
              )}
              
              {pedido.acoes_disponiveis.includes('rejeitar') && (
                <button
                  onClick={() => handleAcao('rejeitar')}
                  style={{
                    padding: '12px 30px',
                    backgroundColor: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  ❌ Rejeitar
                </button>
              )}
              
              {pedido.acoes_disponiveis.includes('passar') && (
                <button
                  onClick={() => handleAcao('passar')}
                  style={{
                    padding: '12px 30px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  ➡️ Encaminhar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Histórico */}
        <div>
          <h3 style={{ color: '#2196F3', marginBottom: '20px' }}>📜 Histórico</h3>
          {pedido.historico?.length === 0 ? (
            <p style={{ color: '#999' }}>Nenhum registro no histórico</p>
          ) : (
            <div style={{ borderLeft: '3px solid #2196F3', paddingLeft: '20px' }}>
              {pedido.historico?.map((item, index) => (
                <div key={index} style={{
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '-29px',
                    top: '20px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#2196F3',
                    borderRadius: '50%',
                    border: '3px solid white'
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#333' }}>{item.acao_display}</strong>
                    <small style={{ color: '#999' }}>{item.data}</small>
                  </div>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    Por: {item.usuario_nome} ({item.role_usuario})
                  </p>
                  {item.comentario && (
                    <p style={{ 
                      margin: '10px 0 0 0',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '5px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      "{item.comentario}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #eee'
  }}>
    <span style={{ color: '#999' }}>{label}:</span>
    <span style={{ color: '#333', fontWeight: '500' }}>{value || 'Não informado'}</span>
  </div>
);

const DecisaoCard = ({ titulo, decisao, data, cor }) => (
  <div style={{
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: `4px solid ${cor}`
  }}>
    <h4 style={{ margin: '0 0 10px 0', color: cor }}>{titulo}</h4>
    {decisao ? (
      <>
        <p style={{ 
          margin: '5px 0',
          color: decisao === 'APROVADO' ? '#4CAF50' : '#F44336',
          fontWeight: '600'
        }}>
          {decisao === 'APROVADO' ? '✅ Aprovado' : '❌ Rejeitado'}
        </p>
        <small style={{ color: '#999' }}>{data}</small>
      </>
    ) : (
      <p style={{ color: '#999' }}>⏳ Pendente</p>
    )}
  </div>
);

export default DetalhePedido;
// src/pages/Relatorios.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Relatorios = ({ user }) => {
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  useEffect(() => {
    carregarRelatorio();
  }, [periodo, mes, ano]);

  const carregarRelatorio = async () => {
    try {
      const response = await api.get(`/relatorios/?periodo=${periodo}&mes=${mes}&ano=${ano}`);
      setRelatorio(response.data);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4CAF50',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#666', fontSize: '16px' }}>Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '8px',
            }}
          >
            ← Voltar
          </button>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#1a1a1a' }}>📊 Relatórios</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={selectStyle}
          >
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Este Ano</option>
          </select>
          
          {periodo === 'mes' && (
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              style={selectStyle}
            >
              {meses.map((nome, index) => (
                <option key={index} value={index + 1}>{nome}</option>
              ))}
            </select>
          )}
          
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            style={selectStyle}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <ResumoCard titulo="Total de Pedidos" valor={relatorio?.total_pedidos || 0} 
                     icon="📋" cor="#2196F3" />
        <ResumoCard titulo="Aprovados" valor={relatorio?.aprovados || 0} 
                     icon="✅" cor="#4CAF50" />
        <ResumoCard titulo="Rejeitados" valor={relatorio?.rejeitados || 0} 
                     icon="❌" cor="#F44336" />
        <ResumoCard titulo="Pendentes" valor={relatorio?.pendentes || 0} 
                     icon="⏳" cor="#FF9800" />
        <ResumoCard titulo="Taxa de Aprovação" valor={`${relatorio?.taxa_aprovacao || 0}%`} 
                     icon="📈" cor="#9C27B0" />
      </div>

      {/* Gráficos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Por Estado */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
            📊 Por Estado
          </h3>
          {relatorio?.pedidos_por_estado && Object.entries(relatorio.pedidos_por_estado).map(([estado, count]) => (
            <BarraItem
              key={estado}
              label={estado.replace('PENDENTE_', '').replace('_', ' ')}
              valor={count}
              total={relatorio.total_pedidos}
              cor={
                estado.includes('APROVADO') ? '#4CAF50' :
                estado.includes('REJEITADO') ? '#F44336' :
                estado.includes('DITE') ? '#2196F3' :
                estado.includes('DIRECAO') ? '#FF9800' : '#9C27B0'
              }
            />
          ))}
        </div>

        {/* Por Tipo */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
            📋 Por Tipo de Pedido
          </h3>
          {relatorio?.pedidos_por_tipo && Object.entries(relatorio.pedidos_por_tipo).map(([tipo, count]) => (
            <BarraItem
              key={tipo}
              label={tipo}
              valor={count}
              total={relatorio.total_pedidos}
              cor="#2196F3"
            />
          ))}
        </div>

        {/* Por Curso */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
            🎓 Por Curso
          </h3>
          {relatorio?.pedidos_por_curso && Object.entries(relatorio.pedidos_por_curso).map(([curso, count]) => (
            <BarraItem
              key={curso}
              label={curso}
              valor={count}
              total={relatorio.total_pedidos}
              cor="#FF9800"
            />
          ))}
        </div>
      </div>

      {/* Botões de Exportação */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#e3f2fd',
            color: '#1976D2',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          🖨️ Imprimir Relatório
        </button>
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          📥 Exportar CSV
        </button>
      </div>
    </div>
  );
};

// Componentes Auxiliares
const ResumoCard = ({ titulo, valor, icon, cor }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    borderLeft: `4px solid ${cor}`,
  }}>
    <div style={{ fontSize: '36px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>{valor}</div>
      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {titulo}
      </div>
    </div>
  </div>
);

const BarraItem = ({ label, valor, total, cor }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '13px',
      color: '#666',
    }}>
      <span>{label}</span>
      <strong style={{ color: '#333' }}>{valor}</strong>
    </div>
    <div style={{
      height: '8px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${(valor / total * 100)}%`,
        backgroundColor: cor,
        borderRadius: '4px',
        transition: 'width 1s ease',
      }} />
    </div>
  </div>
);

const selectStyle = {
  padding: '8px 16px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  fontSize: '14px',
  backgroundColor: 'white',
  cursor: 'pointer',
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

export default Relatorios;
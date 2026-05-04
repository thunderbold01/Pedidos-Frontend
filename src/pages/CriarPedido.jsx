// src/pages/CriarPedido.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CriarPedido = ({ user }) => {
  const [form, setForm] = useState({
    tipo: 'outros',
    motivo: '',
    data_saida: '',
    data_volta: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar datas
    if (form.data_volta && form.data_volta < form.data_saida) {
      setError('A data de retorno não pode ser anterior à data de saída');
      setLoading(false);
      return;
    }

    try {
      // Horas fixas: saída 07:00, volta 12:00
      const dados = {
        tipo: form.tipo,
        motivo: form.motivo,
        data_saida: form.data_saida,
        hora_saida: '07:00',
        data_volta: form.data_volta || form.data_saida,
        hora_volta: '12:00',
      };

      await api.post('/pedidos/criar/', dados);
      alert('Pedido criado com sucesso!');
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
    const dataObj = new Date(data + 'T00:00:00');
    return dias[dataObj.getDay()];
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      
      <div style={styles.container}>
        {/* Menu Lateral */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.avatar}>
              {user.nome?.charAt(0) || 'E'}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user.nome || user.username}</div>
              <div style={styles.userRole}>Estudante</div>
            </div>
          </div>

          <nav style={styles.nav}>
            <button onClick={() => navigate('/dashboard')} style={styles.navItem}>
              <span style={styles.navIcon}>←</span>
              <span>Voltar</span>
            </button>
          </nav>

          <div style={styles.sidebarFooter}>
            <p style={styles.infoText}>
              Horário padrão:<br />
              Saída <strong>07:00</strong><br />
              Retorno <strong>12:00</strong>
            </p>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div style={styles.mainContent}>
          <div style={styles.header}>
            <h1 style={styles.title}>Novo Pedido</h1>
            <p style={styles.subtitle}>Solicite sua saída</p>
          </div>

          <div style={styles.formCard}>
            {error && (
              <div style={styles.errorBox}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Tipo de Pedido */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Tipo de Pedido</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({...form, tipo: e.target.value})}
                  style={styles.select}
                >
                  <option value="outros">📋 Outros</option>
                  <option value="medicos">🏥 Médicos</option>
                  <option value="documentos">📄 Documentos</option>
                  <option value="escola">🏫 Sugerido pela Escola</option>
                  <option value="coletiva">👥 Saída Coletiva</option>
                </select>
              </div>

              {/* Motivo */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Motivo</label>
                <textarea
                  value={form.motivo}
                  onChange={(e) => setForm({...form, motivo: e.target.value})}
                  required
                  style={styles.textarea}
                  placeholder="Descreva o motivo da sua saída..."
                  rows={3}
                />
              </div>

              {/* Data de Saída */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Data de Saída</label>
                <input
                  type="date"
                  value={form.data_saida}
                  onChange={(e) => setForm({...form, data_saida: e.target.value})}
                  required
                  min={hoje}
                  style={styles.input}
                />
                {form.data_saida && (
                  <p style={styles.diaSemana}>
                    {getDiaSemana(form.data_saida)} • Saída às <strong>07:00</strong>
                  </p>
                )}
              </div>

              {/* Data de Retorno */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Data de Retorno</label>
                <input
                  type="date"
                  value={form.data_volta}
                  onChange={(e) => setForm({...form, data_volta: e.target.value})}
                  min={form.data_saida || hoje}
                  style={styles.input}
                />
                {form.data_volta && (
                  <p style={styles.diaSemana}>
                    {getDiaSemana(form.data_volta)} • Retorno às <strong>12:00</strong>
                  </p>
                )}
              </div>

              {/* Resumo */}
              {(form.data_saida || form.data_volta) && (
                <div style={styles.resumo}>
                  <h4 style={styles.resumoTitulo}>Resumo</h4>
                  <div style={styles.resumoGrid}>
                    {form.data_saida && (
                      <div style={styles.resumoItem}>
                        <span style={styles.resumoLabel}>Saída</span>
                        <span style={styles.resumoValor}>
                          {new Date(form.data_saida + 'T00:00:00').toLocaleDateString('pt-BR', { 
                            weekday: 'short', day: 'numeric', month: 'short' 
                          })} às 07:00
                        </span>
                      </div>
                    )}
                    {(form.data_volta || form.data_saida) && (
                      <div style={styles.resumoItem}>
                        <span style={styles.resumoLabel}>Retorno</span>
                        <span style={styles.resumoValor}>
                          {new Date((form.data_volta || form.data_saida) + 'T00:00:00').toLocaleDateString('pt-BR', { 
                            weekday: 'short', day: 'numeric', month: 'short' 
                          })} às 12:00
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botões */}
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Criando...' : 'Criar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #ffffff;
          color: #171717;
        }
        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
          .main-content {
            padding: 20px !important;
          }
        }
      `}</style>
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  sidebar: {
    width: '240px',
    minWidth: '240px',
    backgroundColor: '#fafafa',
    borderRight: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#171717',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#171717',
  },
  userRole: {
    fontSize: '12px',
    color: '#737373',
    marginTop: '2px',
    fontWeight: '400',
  },
  nav: {
    flex: 1,
    padding: '12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '400',
    color: '#404040',
    borderRadius: '8px',
    width: '100%',
    textAlign: 'left',
  },
  navIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center',
    fontWeight: '200',
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid #e5e5e5',
  },
  infoText: {
    fontSize: '11px',
    color: '#a3a3a3',
    lineHeight: '1.6',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    padding: '40px',
    maxWidth: '640px',
  },
  header: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#171717',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#737373',
    margin: '4px 0 0 0',
    fontWeight: '400',
  },
  formCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '28px',
    backgroundColor: '#ffffff',
  },
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#991b1b',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#404040',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d4d4d4',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    color: '#171717',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%23737373%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M8 11L3 6h10z%27/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d4d4d4',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    color: '#171717',
    backgroundColor: '#ffffff',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d4d4d4',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    color: '#171717',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  diaSemana: {
    fontSize: '12px',
    color: '#737373',
    marginTop: '6px',
    fontWeight: '400',
  },
  resumo: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
  },
  resumoTitulo: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#737373',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  resumoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  resumoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  resumoLabel: {
    color: '#737373',
    fontWeight: '400',
  },
  resumoValor: {
    color: '#171717',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '28px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #d4d4d4',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#737373',
    fontFamily: "'Inter', sans-serif",
  },
  submitButton: {
    flex: 2,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#171717',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
  },
};

export default CriarPedido;
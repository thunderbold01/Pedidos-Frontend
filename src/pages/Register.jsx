import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    curso: '',
    classe: '',
    ano_ingresso: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register/', form);
      setSuccess('Registo realizado com sucesso! Redirecionando para o login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.details) {
        // Erros de validação
        const messages = [];
        Object.entries(errorData.details).forEach(([key, value]) => {
          messages.push(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
        });
        setError(messages.join('\n'));
      } else {
        setError(errorData?.error || 'Erro ao realizar registo');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📝 Registo de Estudante</h1>
        <p style={styles.subtitle}>Crie sua conta para começar</p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.success}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label>Nome *</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Seu nome"
              />
            </div>
            
            <div style={styles.field}>
              <label>Sobrenome *</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Seu sobrenome"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label>Nome de Usuário *</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Escolha um nome de usuário"
            />
          </div>

          <div style={styles.field}>
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="seu@email.com"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label>Senha *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            
            <div style={styles.field}>
              <label>Confirmar Senha *</label>
              <input
                type="password"
                name="password2"
                value={form.password2}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Repita a senha"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label>Curso</label>
              <input
                type="text"
                name="curso"
                value={form.curso}
                onChange={handleChange}
                style={styles.input}
                placeholder="Seu curso"
              />
            </div>
            
            <div style={styles.field}>
              <label>Classe</label>
              <input
                type="text"
                name="classe"
                value={form.classe}
                onChange={handleChange}
                style={styles.input}
                placeholder="Sua classe"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label>Ano de Ingresso</label>
            <input
              type="number"
              name="ano_ingresso"
              value={form.ano_ingresso}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ex: 2024"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              backgroundColor: loading ? '#ccc' : '#28a745'
            }}
          >
            {loading ? 'Registando...' : '📝 Registar'}
          </button>
        </form>

        <div style={styles.linkContainer}>
          <p>Já tem conta? <Link to="/login" style={styles.link}>Faça login</Link></p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '600px'
  },
  title: {
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: '10px',
    fontSize: '28px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px'
  },
  error: {
    backgroundColor: '#fff0f0',
    color: '#cc0000',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    whiteSpace: 'pre-line'
  },
  success: {
    backgroundColor: '#f0fff0',
    color: '#006600',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  field: {
    marginBottom: '15px',
    flex: 1
  },
  row: {
    display: 'flex',
    gap: '15px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.3s',
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'background-color 0.3s'
  },
  linkContainer: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666'
  },
  link: {
    color: '#0066cc',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

export default Register;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TwoFactor = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codigoMostrado, setCodigoMostrado] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem('login_email');
    const savedCode = sessionStorage.getItem('2fa_code');
    
    if (!email) {
      navigate('/login');
      return;
    }
    
    if (savedCode) {
      setCodigoMostrado(savedCode);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = sessionStorage.getItem('login_email');
    if (!email) {
      navigate('/login');
      return;
    }

    try {
      const response = await api.post('/auth/verify-2fa/', { email, code });
      
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      sessionStorage.removeItem('login_email');
      sessionStorage.removeItem('2fa_code');
      
      onLogin(user);
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>🔐</div>
        <h1 style={styles.title}>Verificação 2FA</h1>
        <p style={styles.subtitle}>Digite o código de 6 dígitos</p>

        {codigoMostrado && (
          <div style={styles.codeBox}>
            <p style={styles.codeLabel}>Seu código é:</p>
            <p style={styles.codeValue}>{codigoMostrado}</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
            style={styles.codeInput}
          />
          <button type="submit" disabled={loading || code.length !== 6} style={styles.button}>
            {loading ? 'Verificando...' : '✅ Verificar'}
          </button>
        </form>

        <button onClick={() => { sessionStorage.clear(); navigate('/login'); }} style={styles.backBtn}>
          ← Voltar
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e5e5e5',
    textAlign: 'center',
  },
  icon: { fontSize: '48px', marginBottom: '12px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#171717', margin: '0 0 4px 0' },
  subtitle: { fontSize: '13px', color: '#737373', margin: '0 0 24px 0' },
  codeBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px',
  },
  codeLabel: { fontSize: '12px', color: '#166534', margin: '0 0 4px 0' },
  codeValue: { fontSize: '28px', fontWeight: '800', color: '#166534', letterSpacing: '6px', margin: 0 },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#991b1b',
    fontSize: '13px',
    marginBottom: '20px',
  },
  codeInput: {
    width: '100%',
    padding: '16px',
    border: '2px solid #e5e5e5',
    borderRadius: '10px',
    fontSize: '28px',
    textAlign: 'center',
    letterSpacing: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    marginBottom: '16px',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#171717',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  backBtn: {
    marginTop: '16px',
    background: 'none',
    border: 'none',
    color: '#737373',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
};

export default TwoFactor;

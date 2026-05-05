import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TwoFactor = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const e = sessionStorage.getItem('login_email');
    const c = sessionStorage.getItem('2fa_code');
    if (!e) { navigate('/login'); return; }
    setEmail(e);
    setCodigo(c);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-2fa/', { email, code });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      sessionStorage.clear();
      onLogin(res.data.user);
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={styles.logo}>🔐</div>
          <h1 style={styles.title}>Verificação 2FA</h1>
          <p style={styles.subtitle}>Código enviado para <strong>{email}</strong></p>
        </div>
        {codigo && (
          <div style={styles.codeBox}>
            <p style={{ fontSize: '11px', color: '#166534', margin: '0 0 4px' }}>Seu código:</p>
            <p style={{ fontSize: '26px', fontWeight: '800', color: '#166534', letterSpacing: '6px', margin: 0 }}>{codigo}</p>
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} required autoFocus style={styles.input} />
          <button type="submit" disabled={loading || code.length !== 6} style={styles.btn}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
        <button onClick={() => { sessionStorage.clear(); navigate('/login'); }} style={styles.back}>← Voltar</button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px', fontFamily: 'Arial' },
  card: { background: '#fff', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '380px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e5e5', textAlign: 'center' },
  logo: { fontSize: '44px', marginBottom: '8px' },
  title: { fontSize: '20px', fontWeight: '700', color: '#171717', margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#404040', margin: 0 },
  codeBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '16px' },
  error: { background: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  input: { width: '100%', padding: '14px', border: '2px solid #e5e5e5', borderRadius: '10px', fontSize: '26px', textAlign: 'center', letterSpacing: '10px', boxSizing: 'border-box', fontFamily: 'monospace', marginBottom: '14px' },
  btn: { width: '100%', padding: '13px', background: '#171717', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' },
  back: { marginTop: '14px', background: 'none', border: 'none', color: '#737373', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', fontFamily: 'inherit' },
};

export default TwoFactor;

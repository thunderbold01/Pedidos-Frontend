// src/pages/TwoFactor.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TwoFactor = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem('login_email');
    if (!email) {
      navigate('/login');
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
      
      onLogin(user);
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Erro 2FA:', err);
      setError(err.response?.data?.error || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    sessionStorage.removeItem('login_email');
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f2f5',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h1 style={{ color: '#333', marginBottom: '8px', fontSize: '24px' }}>
          Verificação 2FA
        </h1>
        <p style={{ color: '#666', marginBottom: '28px', fontSize: '14px' }}>
          Digite o código de 6 dígitos enviado para seu email
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fff0f0',
            color: '#cc0000',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid #ffcccc',
          }}>
            {error}
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
            style={{
              width: '100%',
              padding: '15px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '24px',
              textAlign: 'center',
              letterSpacing: '10px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '20px',
            }}
          />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading || code.length !== 6 ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
            }}
          >
            {loading ? 'Verificando...' : '✅ Verificar Código'}
          </button>
        </form>

        <button
          onClick={handleVoltar}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'underline',
          }}
        >
          ← Voltar ao login
        </button>
      </div>
    </div>
  );
};

export default TwoFactor;

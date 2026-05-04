import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TwoFactor = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutos
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem('login_email');
    if (!email) {
      navigate('/login');
      return;
    }

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = sessionStorage.getItem('login_email');
      if (!email) {
        navigate('/login');
        return;
      }

      const response = await api.post('/auth/verify-2fa/', { 
        email, 
        code 
      });

      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      sessionStorage.removeItem('login_email');
      
      onLogin(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const email = sessionStorage.getItem('login_email');
      await api.post('/auth/login/', { 
        email,
        password: '' // Não precisa da senha, só para reenviar
      });
      setTimer(600);
      alert('Novo código enviado! Verifique o terminal do Django');
    } catch (err) {
      // Tentar novamente com refresh
      try {
        const email = sessionStorage.getItem('login_email');
        await api.post('/auth/verify-2fa/', { email, code: '000000' });
      } catch {
        alert('Código ainda válido ou erro ao reenviar');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '420px'
      }}>
        <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px' }}>
          🔐
        </div>
        <h1 style={{ textAlign: 'center', color: '#1a1a1a', marginBottom: '10px', fontSize: '24px' }}>
          Verificação 2FA
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Digite o código enviado para seu email
        </p>

        <div style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
          color: timer < 60 ? '#dc3545' : '#28a745'
        }}>
          ⏱️ {formatTime(timer)}
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
              Código de 6 dígitos
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || timer === 0}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading || timer === 0 ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || timer === 0 ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Verificando...' : '✅ Verificar Código'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleResend}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            📧 Reenviar código
          </button>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <p>💡 Em desenvolvimento, o código aparece no terminal do Django</p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactor;
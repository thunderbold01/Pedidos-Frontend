// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login/', { email, password });
      
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      onLogin(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <style>{`
        :root {
          --bg: #f8fafc;
          --card-bg: #ffffff;
          --brand-bg: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
          --text: #1e293b;
          --text-light: #64748b;
          --border: #e2e8f0;
          --input-bg: #f8fafc;
          --error-bg: #fef2f2;
          --error-text: #991b1b;
          --btn-gradient: linear-gradient(135deg, #dc2626, #ef4444);
          --btn-shadow: 0 8px 25px rgba(239,68,68,0.3);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0f172a;
            --card-bg: #1e293b;
            --brand-bg: linear-gradient(160deg, #0a0a1a 0%, #0d1528 40%, #081830 100%);
            --text: #e2e8f0;
            --text-light: #94a3b8;
            --border: #334155;
            --input-bg: #1e293b;
            --error-bg: rgba(153,27,27,0.2);
            --error-text: #fecaca;
          }
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-card {
          display: flex;
          width: 100%;
          max-width: 880px;
          min-height: 500px;
          background: var(--card-bg);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          border: 1px solid var(--border);
        }

        .brand-side {
          flex: 1;
          background: var(--brand-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
        }

        .brand-content {
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .brand-logo {
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          background: rgba(255,255,255,0.08);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
        }

        .brand-logo img {
          width: 55px;
          height: 55px;
          object-fit: contain;
        }

        .brand-logo-emoji {
          font-size: 48px;
        }

        .brand-title {
          color: #ffffff;
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .brand-divider {
          width: 50px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #ef4444, transparent);
          margin: 0 auto 16px;
          border-radius: 2px;
        }

        .brand-desc {
          color: rgba(255,255,255,0.65);
          font-size: 13px;
          line-height: 1.6;
          max-width: 240px;
          margin: 0 auto;
        }

        .form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .form-content {
          width: 100%;
          max-width: 320px;
        }

        .form-greeting {
          font-size: 26px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
        }

        .form-subtitle {
          font-size: 13px;
          color: var(--text-light);
          margin-bottom: 28px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: var(--error-bg);
          color: var(--error-text);
          border: 1px solid #fecaca;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          animation: shake 0.4s ease;
        }

        .field {
          margin-bottom: 16px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-light);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px 13px 44px;
          background: var(--input-bg);
          border: 2px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          color: var(--text);
          outline: none;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
        }

        .eye-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 6px;
          color: var(--text-light);
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: var(--btn-gradient);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: var(--btn-shadow);
          font-family: inherit;
          transition: all 0.3s;
        }

        .submit-btn:active {
          transform: scale(0.97);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .register-link {
          text-align: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          font-size: 13px;
          color: var(--text-light);
        }

        .register-link a {
          color: #ef4444;
          text-decoration: none;
          font-weight: 700;
          margin-left: 4px;
        }

        @media (max-width: 768px) {
          .login-card {
            flex-direction: column;
            max-width: 400px;
            min-height: auto;
          }

          .brand-side {
            padding: 30px 24px;
            min-height: 170px;
          }

          .brand-logo {
            width: 70px;
            height: 70px;
            margin-bottom: 14px;
          }

          .brand-logo img {
            width: 40px;
            height: 40px;
          }

          .brand-logo-emoji {
            font-size: 36px;
          }

          .brand-title {
            font-size: 20px;
            margin-bottom: 8px;
          }

          .brand-desc {
            font-size: 12px;
          }

          .form-side {
            padding: 28px 24px;
          }

          .form-greeting {
            font-size: 22px;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>

      <div className="login-card">
        {/* Marca */}
        <div className="brand-side">
          <div className="brand-content">
            <div className="brand-logo">
              <img 
                src="/logo.png" 
                alt="Logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="brand-logo-emoji">🎓</span>';
                }}
              />
            </div>
            <h1 className="brand-title">Sistema de Pedidos</h1>
            <div className="brand-divider" />
            <p className="brand-desc">
              Gerencie suas saídas escolares de forma rápida e eficiente
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="form-side">
          <div className="form-content">
            <h2 className="form-greeting">Bem-vindo</h2>
            <p className="form-subtitle">Entre com seus dados</p>

            {error && (
              <div className="error-alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label">Email</label>
                <div className="input-wrap">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                    placeholder="seu@email.com"
                    autoFocus
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Senha</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="eye-btn"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="register-link">
              Não tem conta? <Link to="/register">Criar conta</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

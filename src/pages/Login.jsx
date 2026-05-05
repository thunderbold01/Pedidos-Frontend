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
      
      if (response.data.require_2fa) {
        sessionStorage.setItem('login_email', email);
        sessionStorage.setItem('2fa_code', response.data.code);
        navigate('/2fa');
        return;
      }
      
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
          --error-border: #fecaca;
          --btn-gradient: linear-gradient(135deg, #dc2626, #ef4444);
          --btn-shadow: 0 8px 25px rgba(239,68,68,0.3);
          --logo-shadow: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
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
            --error-border: #7f1d1d;
            --btn-gradient: linear-gradient(135deg, #dc2626, #f97316);
            --btn-shadow: 0 8px 25px rgba(239,68,68,0.4);
            --logo-shadow: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
          }
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: background 0.3s ease;
        }

        .login-card {
          display: flex;
          width: 100%;
          max-width: 900px;
          min-height: 520px;
          background: var(--card-bg);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.08);
          border: 1px solid var(--border);
          transition: all 0.3s ease;
        }

        .brand-side {
          flex: 1;
          background: var(--brand-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }

        .brand-side::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 40%, rgba(239,68,68,0.08) 0%, transparent 50%),
                      radial-gradient(circle at 70% 60%, rgba(6,182,212,0.05) 0%, transparent 50%);
        }

        .brand-content {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .brand-logo {
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          background: rgba(255,255,255,0.1);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .brand-logo img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          filter: var(--logo-shadow);
        }

        .brand-logo-emoji {
          font-size: 50px;
        }

        .brand-title {
          color: #ffffff;
          font-size: 26px;
          font-weight: 800;
          margin: 0 0 12px;
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
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          line-height: 1.5;
          max-width: 250px;
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
          max-width: 340px;
        }

        .form-greeting {
          font-size: 26px;
          font-weight: 800;
          color: var(--text);
          margin: 0 0 4px;
        }

        .form-subtitle {
          font-size: 13px;
          color: var(--text-light);
          margin: 0 0 28px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: var(--error-bg);
          border: 1px solid var(--error-border);
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          color: var(--error-text);
        }

        .field {
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          font-size: 12px;
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
          z-index: 1;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          background: var(--input-bg);
          border: 2px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          color: var(--text);
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .form-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.1);
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
          transition: all 0.3s ease;
          box-shadow: var(--btn-shadow);
          font-family: inherit;
        }

        .submit-btn:active {
          transform: scale(0.98);
        }

        .register-link {
          text-align: center;
          margin-top: 20px;
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
            padding: 32px 24px;
            min-height: 180px;
          }

          .brand-logo {
            width: 70px;
            height: 70px;
            margin-bottom: 12px;
          }

          .brand-logo img {
            width: 44px;
            height: 44px;
          }

          .brand-logo-emoji {
            font-size: 36px;
          }

          .brand-title {
            font-size: 20px;
            margin-bottom: 6px;
          }

          .brand-divider {
            margin: 0 auto 10px;
          }

          .brand-desc {
            font-size: 11px;
            max-width: 200px;
          }

          .form-side {
            padding: 28px 24px;
          }

          .form-greeting {
            font-size: 22px;
          }
        }

        @media (max-width: 380px) {
          .login-page {
            padding: 8px;
          }

          .brand-side {
            min-height: 140px;
            padding: 24px 16px;
          }

          .form-side {
            padding: 20px 16px;
          }
        }
      `}</style>

      <div className="login-card">
        {/* Lado da Marca */}
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

        {/* Lado do Formulário */}
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
              Não tem conta?
              <Link to="/register">Criar conta</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

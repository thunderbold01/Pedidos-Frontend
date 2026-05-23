// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  // Carregar email salvo se existir
  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validação básica
    if (!email.trim()) {
      setError('Por favor, insira seu email');
      return;
    }
    if (!password) {
      setError('Por favor, insira sua senha');
      return;
    }
    
    setLoading(true);

    try {
      const response = await api.post('/auth/login/', { 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Salvar email se "lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem('saved_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('saved_email');
      }
      
      // Verificar se precisa de 2FA
      if (response.data.require_2fa) {
        sessionStorage.setItem('login_email', email.trim().toLowerCase());
        navigate('/2fa');
        return;
      }
      
      onLogin(user);
      navigate('/dashboard');
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Email ou senha inválidos';
      setError(errorMsg);
      
      // Limpar senha em caso de erro
      setPassword('');
      
      // Feedback de erro com animação
      const errorElement = document.querySelector('.error-alert');
      if (errorElement) {
        errorElement.style.animation = 'none';
        setTimeout(() => {
          errorElement.style.animation = 'shake 0.4s ease';
        }, 10);
      }
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
          --focus-ring: rgba(220,38,38,0.2);
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
            --focus-ring: rgba(220,38,38,0.3);
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
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Fundo decorativo */
        .login-page::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%);
          border-radius: 50%;
          top: -150px;
          right: -150px;
          pointer-events: none;
        }

        .login-page::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -200px;
          left: -200px;
          pointer-events: none;
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
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .login-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
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
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='rgba(255,255,255,0.03)' d='M100 0 L100 200 M0 100 L200 100'/%3E%3C/svg%3E");
          background-size: 30px 30px;
          opacity: 0.3;
          pointer-events: none;
        }

        .brand-content {
          text-align: center;
          position: relative;
          z-index: 1;
          animation: fadeInUp 0.6s ease-out;
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
          transition: transform 0.3s ease;
        }

        .brand-logo:hover {
          transform: scale(1.05);
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
          background: var(--card-bg);
          animation: fadeInUp 0.6s ease-out 0.1s both;
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

        .error-alert span:first-child {
          font-size: 16px;
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
          transition: color 0.2s;
        }

        .field-label.focused {
          color: #dc2626;
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
          transition: transform 0.2s;
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
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px var(--focus-ring);
          background: var(--card-bg);
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
          transition: color 0.2s;
          border-radius: 8px;
        }

        .eye-btn:hover {
          color: #dc2626;
          background: rgba(0,0,0,0.05);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 8px 0 24px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-light);
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #dc2626;
        }

        .forgot-link {
          font-size: 12px;
          color: #dc2626;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .forgot-link:hover {
          opacity: 0.8;
          text-decoration: underline;
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
          box-shadow: var(--btn-shadow);
          font-family: inherit;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(239,68,68,0.4);
        }

        .submit-btn:active {
          transform: scale(0.97);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
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
          transition: opacity 0.2s;
        }

        .register-link a:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        /* Animações */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsividade */
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

          .form-input {
            padding: 12px 12px 12px 40px;
            font-size: 14px;
          }

          .input-icon {
            left: 12px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            margin: 0 10px;
          }
          
          .brand-side {
            padding: 24px 20px;
          }
          
          .form-side {
            padding: 24px 20px;
          }
        }

        /* Touch optimizations for mobile */
        @media (hover: none) and (pointer: coarse) {
          .submit-btn, .eye-btn, .forgot-link, .register-link a {
            cursor: default;
          }
          
          .form-input {
            font-size: 16px;
          }
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

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className={`field-label ${emailFocused || email ? 'focused' : ''}`}>
                  Email
                </label>
                <div className="input-wrap">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    className="form-input"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="field">
                <label className={`field-label ${passwordFocused || password ? 'focused' : ''}`}>
                  Senha
                </label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    className="form-input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="eye-btn"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Lembrar-me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Esqueceu a senha?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
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
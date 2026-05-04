// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

// Ícones SVG em traços
const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const GraduateIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login/', { email, password });
      
      if (response.data.require_2fa) {
        sessionStorage.setItem('login_email', email);
        navigate('/2fa');
        setLoading(false);
        return;
      }
      
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      onLogin(user);
      navigate('/dashboard');
      
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Email ou senha inválidos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          75% { transform: translateY(5px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          50% { box-shadow: 0 0 0 15px rgba(6, 182, 212, 0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(6, 182, 212, 0.3); }
          50% { border-color: rgba(239, 68, 68, 0.5); }
        }
        
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #fef2f2 50%, #faf5ff 75%, #f0f9ff 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        .login-container::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%);
          animation: float 20s ease-in-out infinite;
        }
        
        .login-card {
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 10px 15px -3px rgba(0, 0, 0, 0.05),
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 0 50px -12px rgba(6, 182, 212, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-bottom: 4px solid;
          border-image: linear-gradient(90deg, #ef4444, #06b6d4, #ef4444) 1;
          animation: slideUp 0.6s ease-out, borderGlow 3s ease-in-out infinite;
          width: 100%;
          max-width: 440px;
          overflow: hidden;
        }
        
        .login-card-inner {
          padding: 32px 28px;
        }
        
        .logo-area {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .logo-circle {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #1a1a2e, #0f3460);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 
            0 10px 30px -10px rgba(15, 52, 96, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.1);
          animation: float 6s ease-in-out infinite;
        }
        
        .welcome-title {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #1a1a2e, #0f3460);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .welcome-subtitle {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
        
        .error-alert {
          background: linear-gradient(135deg, #fef2f2, #fff5f5);
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: shake 0.5s ease-in-out;
        }
        
        .error-alert svg {
          flex-shrink: 0;
          color: #ef4444;
        }
        
        .error-message {
          color: #991b1b;
          font-size: 13px;
          line-height: 1.4;
          flex: 1;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: color 0.3s;
          pointer-events: none;
        }
        
        .form-input {
          width: 100%;
          padding: 14px 44px 14px 44px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          color: #1a1a2e;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }
        
        .form-input:focus {
          border-color: #06b6d4;
          background: white;
          box-shadow: 
            0 0 0 4px rgba(6, 182, 212, 0.1),
            0 4px 12px rgba(6, 182, 212, 0.15);
          transform: translateY(-1px);
        }
        
        .form-input:hover {
          border-color: #cbd5e1;
        }
        
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          transition: color 0.3s;
        }
        
        .password-toggle:hover {
          color: #06b6d4;
        }
        
        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .remember-checkbox {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }
        
        .remember-checkbox:checked {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          border-color: #06b6d4;
        }
        
        .remember-checkbox:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
        
        .remember-label {
          font-size: 13px;
          color: #64748b;
          user-select: none;
        }
        
        .forgot-link {
          font-size: 13px;
          color: #06b6d4;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s;
        }
        
        .forgot-link:hover {
          color: #ef4444;
        }
        
        .login-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #f97316 50%, #ef4444 75%, #dc2626 100%);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.5px;
        }
        
        .login-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 10px 25px -5px rgba(239, 68, 68, 0.4),
            0 8px 10px -6px rgba(239, 68, 68, 0.2);
        }
        
        .login-button:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .divider-section {
          position: relative;
          text-align: center;
          margin-bottom: 24px;
        }
        
        .divider-section::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, #cbd5e1, #e2e8f0, transparent);
        }
        
        .divider-text {
          background: rgba(255, 255, 255, 0.95);
          padding: 0 16px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          position: relative;
        }
        
        .demo-button {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          color: #64748b;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        
        .demo-button:hover {
          background: linear-gradient(135deg, #e0f2fe, #fef2f2);
          border-color: #06b6d4;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.15);
        }
        
        .register-row {
          text-align: center;
          font-size: 14px;
          color: #64748b;
        }
        
        .register-link {
          color: #ef4444;
          text-decoration: none;
          font-weight: 700;
          margin-left: 4px;
          transition: color 0.3s;
        }
        
        .register-link:hover {
          color: #06b6d4;
        }
        
        @media (max-width: 768px) {
          .login-card {
            max-width: 100%;
            border-radius: 20px;
          }
          
          .login-card-inner {
            padding: 28px 20px;
          }
          
          .welcome-title {
            font-size: 24px;
          }
          
          .form-input {
            font-size: 16px;
            padding: 15px 44px;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .login-container {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          }
          
          .login-card {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(255, 255, 255, 0.1);
          }
          
          .welcome-title {
            background: linear-gradient(135deg, #e2e8f0, #f1f5f9);
            -webkit-background-clip: text;
            background-clip: text;
          }
          
          .welcome-subtitle,
          .form-label,
          .remember-label,
          .register-row {
            color: #94a3b8;
          }
          
          .form-input {
            background: #1e293b;
            border-color: #334155;
            color: #e2e8f0;
          }
          
          .form-input:focus {
            background: #0f172a;
            border-color: #06b6d4;
          }
          
          .demo-button {
            background: #1e293b;
            border-color: #334155;
            color: #94a3b8;
          }
          
          .demo-button:hover {
            background: #334155;
          }
          
          .divider-section::before {
            background: linear-gradient(90deg, transparent, #334155, #475569, #334155, transparent);
          }
          
          .divider-text {
            background: rgba(30, 41, 59, 0.95);
            color: #64748b;
          }
        }
      `}</style>

      <div className="login-container">
        <div className="login-card">
          <div className="login-card-inner">
            {/* Logo */}
            <div className="logo-area">
              <div className="logo-circle">
                <GraduateIcon />
              </div>
              <h1 className="welcome-title">Bem-vindo de volta</h1>
              <p className="welcome-subtitle">Faça login para continuar</p>
            </div>

            {/* Erro */}
            {error && (
              <div className="error-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="error-message">{error}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <span className="input-icon"><EmailIcon /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoFocus
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon"><LockIcon /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="form-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="options-row">
                <label className="remember-me">
                  <input type="checkbox" className="remember-checkbox" />
                  <span className="remember-label">Lembrar-me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? (
                  <span className="loading-content">
                    <span className="spinner"></span>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="divider-section">
              <span className="divider-text">ou continue com</span>
            </div>

            <button 
              className="demo-button"
              onClick={() => {
                setEmail('demo@escola.com');
                setPassword('demo123');
              }}
            >
              <GraduateIcon />
              Modo Demonstração
            </button>

            <div className="register-row">
              Não tem uma conta?
              <Link to="/register" className="register-link">
                Criar conta gratuita
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Adiciona keyframes globais
const globalStyles = document.createElement("style");
globalStyles.textContent = `
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
document.head.appendChild(globalStyles);

export default Login;

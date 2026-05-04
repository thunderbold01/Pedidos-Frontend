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

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      setSuccess('Login realizado com sucesso!');
      setTimeout(() => {
        onLogin(user);
        navigate('/dashboard');
      }, 500);
      
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
          25% { transform: translateY(-8px) rotate(1deg); }
          75% { transform: translateY(4px) rotate(-1deg); }
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
          from { opacity: 0; transform: translateY(30px); }
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
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .login-wrapper {
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
        
        .login-wrapper::before {
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
          z-index: 0;
        }

        /* Padrão de grid decorativo */
        .login-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
        }
        
        .login-card {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
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
          transition: transform 0.3s ease;
        }

        .login-card:hover {
          transform: translateY(-2px);
        }
        
        .login-card-inner {
          padding: 36px 32px;
        }
        
        .logo-section {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .logo-container {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 10px 30px -10px rgba(15, 52, 96, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            0 0 0 4px rgba(255, 255, 255, 0.8),
            0 0 0 8px rgba(6, 182, 212, 0.1);
          animation: float 6s ease-in-out infinite, pulse 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .logo-container::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: rotate(45deg);
          animation: shimmer 3s infinite;
        }
        
        .logo-image {
          width: 48px;
          height: 48px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          z-index: 1;
        }
        
        .welcome-title {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #1a1a2e, #0f3460);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        
        .welcome-subtitle {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }
        
        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px;
          animation: shake 0.5s ease-in-out, fadeIn 0.3s ease-out;
          position: relative;
        }
        
        .alert-error {
          background: linear-gradient(135deg, #fef2f2, #fff5f5);
          border: 1px solid #fecaca;
          color: #991b1b;
        }
        
        .alert-success {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        
        .alert-icon {
          flex-shrink: 0;
        }
        
        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
          font-size: 16px;
          padding: 0 4px;
          transition: opacity 0.2s;
        }

        .alert-close:hover {
          opacity: 1;
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
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: all 0.3s ease;
          pointer-events: none;
          z-index: 1;
        }
        
        .form-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          color: #1a1a2e;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          font-family: inherit;
        }

        .input-with-password {
          padding-right: 48px;
        }
        
        .form-input:focus {
          border-color: #06b6d4;
          background: white;
          box-shadow: 
            0 0 0 4px rgba(6, 182, 212, 0.1),
            0 4px 12px rgba(6, 182, 212, 0.15);
          transform: translateY(-1px);
        }

        .form-input:focus + .input-icon,
        .input-wrapper:focus-within .input-icon {
          color: #06b6d4;
        }
        
        .form-input:hover {
          border-color: #cbd5e1;
        }
        
        .form-input::placeholder {
          color: #cbd5e1;
        }
        
        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          transition: all 0.3s ease;
          z-index: 1;
          border-radius: 8px;
        }
        
        .password-toggle:hover {
          color: #06b6d4;
          background: rgba(6, 182, 212, 0.1);
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
          user-select: none;
        }
        
        .remember-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          flex-shrink: 0;
        }
        
        .remember-checkbox:checked {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          border-color: #06b6d4;
        }
        
        .remember-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 5px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .remember-label {
          font-size: 13px;
          color: #64748b;
        }
        
        .forgot-link {
          font-size: 13px;
          color: #06b6d4;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
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
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
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
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
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
          backdrop-filter: blur(20px);
          padding: 0 16px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          position: relative;
          z-index: 1;
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
          gap: 10px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        
        .demo-button:hover {
          background: linear-gradient(135deg, #e0f2fe, #fef2f2);
          border-color: #06b6d4;
          color: #0f3460;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.15);
        }

        .demo-button:active {
          transform: translateY(0);
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
          transition: all 0.3s ease;
          position: relative;
        }

        .register-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #ef4444, #06b6d4);
          transition: width 0.3s ease;
        }
        
        .register-link:hover {
          color: #06b6d4;
        }

        .register-link:hover::after {
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .login-wrapper {
            padding: 16px;
            align-items: flex-start;
            padding-top: 40px;
          }
          
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
            padding: 16px 16px 16px 48px;
          }
          
          .logo-container {
            width: 70px;
            height: 70px;
          }
          
          .logo-image {
            width: 42px;
            height: 42px;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .login-wrapper {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%);
          }
          
          .login-card {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 
              0 4px 6px -1px rgba(0, 0, 0, 0.3),
              0 10px 15px -3px rgba(0, 0, 0, 0.2),
              0 20px 25px -5px rgba(0, 0, 0, 0.3),
              0 0 50px -12px rgba(6, 182, 212, 0.15);
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
          
          .form-input::placeholder {
            color: #64748b;
          }
          
          .demo-button {
            background: #1e293b;
            border-color: #334155;
            color: #94a3b8;
          }
          
          .demo-button:hover {
            background: #334155;
            border-color: #06b6d4;
            color: #e2e8f0;
          }
          
          .divider-section::before {
            background: linear-gradient(90deg, transparent, #334155, #475569, #334155, transparent);
          }
          
          .divider-text {
            background: rgba(30, 41, 59, 0.95);
            color: #64748b;
          }

          .alert-error {
            background: rgba(153, 27, 27, 0.2);
            
          }

          .alert-success {
            background: rgba(22, 101, 52, 0.2);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-card-inner">
            {/* Logo Section */}
            <div className="logo-section">
              <div className="logo-container">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="logo-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="z-index:1">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
                      </svg>`;
                  }}
                />
              </div>
              <h1 className="welcome-title">Bem-vindo de volta</h1>
              <p className="welcome-subtitle">Faça login para continuar</p>
            </div>

            {/* Alertas */}
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon"><AlertCircleIcon /></span>
                <span>{error}</span>
                <button onClick={() => setError('')} className="alert-close">✕</button>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <span className="alert-icon"><CheckCircleIcon /></span>
                <span>{success}</span>
                <button onClick={() => setSuccess('')} className="alert-close">✕</button>
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
                    className="form-input input-with-password"
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
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

export default Login;

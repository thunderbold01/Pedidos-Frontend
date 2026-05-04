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
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
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
      console.error('Erro no login:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Email ou senha inválidos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background com padrão sutil */}
      <div style={styles.backgroundPattern}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="60" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.4" />
              <line x1="15" y1="0" x2="15" y2="60" stroke="#e5e7eb" strokeWidth="0.3" opacity="0.2" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.4" />
              <line x1="45" y1="0" x2="45" y2="60" stroke="#e5e7eb" strokeWidth="0.3" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalPattern)" />
        </svg>
      </div>
      
      {/* Card Principal */}
      <div style={isMobile ? styles.cardMobile : styles.cardDesktop}>
        {/* Lado Esquerdo - Branding (Desktop) */}
        {!isMobile && (
          <div style={styles.brandSide}>
            <div style={styles.brandOverlay} />
            <div style={styles.brandContent}>
              {/* Logo */}
              <div style={styles.logoWrapper}>
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  style={styles.logoImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ ...styles.logoFallback, display: 'none' }}>
                  <span style={styles.logoEmoji}>🎓</span>
                </div>
              </div>
              
              <h1 style={styles.brandTitle}>Sistema de Pedidos</h1>
              <div style={styles.brandDivider} />
              <p style={styles.brandDescription}>
                Gerencie suas saídas escolares de forma rápida, eficiente e segura
              </p>
              
              <div style={styles.brandFeatures}>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>Gestão completa de pedidos</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>Relatórios em tempo real</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>Segurança e privacidade</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lado Direito - Formulário */}
        <div style={isMobile ? styles.formSideMobile : styles.formSideDesktop}>
          <div style={isMobile ? styles.formContentMobile : styles.formContentDesktop}>
            {/* Logo Mobile */}
            {isMobile && (
              <div style={styles.mobileLogoContainer}>
                <div style={styles.mobileLogoWrapper}>
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    style={styles.mobileLogoImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{ ...styles.mobileLogoFallback, display: 'none' }}>
                    <span>🎓</span>
                  </div>
                </div>
                <h2 style={styles.mobileBrandTitle}>Sistema de Pedidos</h2>
              </div>
            )}
            
            <div style={styles.headerText}>
              <h2 style={isMobile ? styles.greetingMobile : styles.greetingDesktop}>
                Bem-vindo de volta
              </h2>
              <p style={isMobile ? styles.instructionMobile : styles.instructionDesktop}>
                Faça login para acessar sua conta
              </p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
                <button 
                  onClick={() => setError('')} 
                  style={styles.errorClose}
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Email</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoFocus
                    style={styles.fieldInput}
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Senha</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    style={styles.passwordInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={styles.optionsContainer}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" style={styles.checkbox} />
                  <span style={styles.checkboxText}>Lembrar-me</span>
                </label>
                <Link to="/forgot-password" style={styles.forgotLink}>
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.loginButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span style={styles.loadingContent}>
                    <span style={styles.spinner}></span>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div style={styles.registerContainer}>
              <span style={styles.registerText}>Não tem uma conta?</span>
              <Link to="/register" style={styles.registerLink}>
                Criar conta gratuita
              </Link>
            </div>

            <div style={styles.divider}>
              <span style={styles.dividerText}>ou continue com</span>
            </div>

            <button 
              style={styles.demoButton} 
              onClick={() => {
                setEmail('demo@escola.com');
                setPassword('demo123');
              }}
            >
              <span style={styles.demoIcon}>🎮</span>
              Modo Demonstração
            </button>
          </div>
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
    backgroundColor: '#ffffff',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 0.6,
  },
  
  // Desktop Card
  cardDesktop: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    width: '90%',
    maxWidth: '1000px',
    minHeight: '600px',
    backgroundColor: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: `
      0 4px 6px rgba(0, 0, 0, 0.04),
      0 10px 20px rgba(0, 0, 0, 0.06),
      0 20px 40px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(0, 0, 0, 0.04)
    `,
    borderBottom: '4px solid #dc2626',
  },
  
  // Mobile Card
  cardMobile: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: 'white',
    overflow: 'auto',
  },
  
  // Brand Side
  brandSide: {
    flex: '1',
    background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 30%, rgba(220, 38, 38, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.05) 0%, transparent 40%)
    `,
  },
  brandContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: '25px',
  },
  logoImage: {
    width: '100px',
    height: '100px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
  },
  logoFallback: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(220, 38, 38, 0.3)',
  },
  logoEmoji: {
    fontSize: '50px',
  },
  brandTitle: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 15px 0',
    letterSpacing: '-0.5px',
  },
  brandDivider: {
    width: '60px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #06b6d4, #ef4444, transparent)',
    margin: '0 auto 20px',
    borderRadius: '2px',
  },
  brandDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 30px 0',
  },
  brandFeatures: {
    textAlign: 'left',
    marginTop: '20px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  featureIcon: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(239, 68, 68, 0.3))',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  
  // Form Side Desktop
  formSideDesktop: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: 'white',
  },
  formContentDesktop: {
    width: '100%',
    maxWidth: '380px',
  },
  
  // Form Side Mobile
  formSideMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 20px',
    backgroundColor: 'white',
    minHeight: '100vh',
  },
  formContentMobile: {
    width: '100%',
    maxWidth: '100%',
  },
  
  // Mobile Logo
  mobileLogoContainer: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  mobileLogoWrapper: {
    width: '70px',
    height: '70px',
    margin: '0 auto 15px',
  },
  mobileLogoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  mobileLogoFallback: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '35px',
    border: '2px solid rgba(220, 38, 38, 0.3)',
  },
  mobileBrandTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
  },
  
  // Header Text
  headerText: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  greetingDesktop: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  instructionDesktop: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  greetingMobile: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 8px 0',
  },
  instructionMobile: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },
  
  // Error Box
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  errorIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  errorText: {
    color: '#991b1b',
    fontSize: '13px',
    lineHeight: '1.4',
    flex: 1,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#991b1b',
    padding: '0 5px',
  },
  
  // Form Fields
  fieldGroup: {
    marginBottom: '20px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    zIndex: 1,
  },
  fieldInput: {
    width: '100%',
    padding: '13px 14px 13px 40px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1a1a2e',
    outline: 'none',
    backgroundColor: '#fafbfc',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  },
  passwordInput: {
    width: '100%',
    padding: '13px 85px 13px 40px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1a1a2e',
    outline: 'none',
    backgroundColor: '#fafbfc',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '5px',
    color: '#94a3b8',
  },
  
  // Options
  optionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
    accentColor: '#dc2626',
  },
  checkboxText: {
    fontSize: '13px',
    color: '#64748b',
  },
  forgotLink: {
    fontSize: '13px',
    color: '#06b6d4',
    textDecoration: 'none',
    fontWeight: '500',
  },
  
  // Login Button
  loginButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
  },
  loadingContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid white',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    display: 'inline-block',
  },
  
  // Register
  registerContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  registerText: {
    fontSize: '13px',
    color: '#64748b',
    marginRight: '8px',
  },
  registerLink: {
    fontSize: '13px',
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '600',
  },
  
  // Divider
  divider: {
    position: 'relative',
    textAlign: 'center',
    marginBottom: '20px',
  },
  dividerText: {
    background: 'white',
    padding: '0 10px',
    fontSize: '12px',
    color: '#94a3b8',
    position: 'relative',
    zIndex: 1,
  },
  
  // Demo Button
  demoButton: {
    width: '100%',
    padding: '12px',
    background: '#f8fafc',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '500',
  },
  demoIcon: {
    fontSize: '16px',
  },
};

// Adiciona estilos globais
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #06b6d4 !important;
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    background-color: white !important;
  }
  
  button:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    input, button {
      font-size: 16px !important;
    }
  }
  
  /* Modo escuro */
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #0f172a;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Login;

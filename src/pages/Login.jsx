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
      
      // Se requer 2FA
      if (response.data.require_2fa) {
        sessionStorage.setItem('login_email', email);
        navigate('/2fa');
        setLoading(false);
        return;
      }
      
      // Login direto
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
      {/* Fundo com textura e gradiente */}
      <div style={styles.backgroundGradient}>
        <div style={styles.backgroundTexture}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonalTexture" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="60" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
                <line x1="15" y1="0" x2="15" y2="60" stroke="#ffffff" strokeWidth="0.3" opacity="0.05" />
                <line x1="30" y1="0" x2="30" y2="60" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
                <line x1="45" y1="0" x2="45" y2="60" stroke="#ffffff" strokeWidth="0.3" opacity="0.05" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonalTexture)" />
          </svg>
        </div>
      </div>
      
      {/* Card principal */}
      <div style={isMobile ? styles.cardMobile : styles.cardDesktop}>
        {/* Lado esquerdo - Branding (apenas desktop) */}
        {!isMobile && (
          <div style={styles.brandSide}>
            <div style={styles.brandOverlay} />
            <div style={styles.brandContent}>
              <div style={styles.logoWrapper}>
                <div style={styles.logoCircle}>
                  <span style={styles.logoIcon}>🎓</span>
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
                  <span>Gestão completa</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>Relatórios em tempo real</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✓</span>
                  <span>Segurança de dados</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lado direito - Formulário */}
        <div style={isMobile ? styles.formSideMobile : styles.formSideDesktop}>
          <div style={isMobile ? styles.formContentMobile : styles.formContentDesktop}>
            {/* Logo para mobile */}
            {isMobile && (
              <div style={styles.mobileLogoContainer}>
                <div style={styles.mobileLogoCircle}>
                  <span style={styles.mobileLogoIcon}>🎓</span>
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
                <label style={styles.fieldLabel}>
                  <span style={styles.labelIcon}>📧</span>
                  Email
                </label>
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

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>
                  <span style={styles.labelIcon}>🔒</span>
                  Senha
                </label>
                <div style={styles.passwordContainer}>
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
                  <span style={styles.loadingSpinner}>
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
              <span style={styles.dividerText}>Ou</span>
            </div>

            <button style={styles.demoButton} onClick={() => {
              setEmail('demo@escola.com');
              setPassword('demo123');
            }}>
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
    position: 'relative',
    overflow: 'auto',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    zIndex: 0,
  },
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  
  // Desktop styles
  cardDesktop: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    width: '90%',
    maxWidth: '1000px',
    minHeight: '600px',
    backgroundColor: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  // Mobile styles
  cardMobile: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: 'white',
    overflow: 'auto',
  },
  
  // Brand side (desktop)
  brandSide: {
    flex: '1.2',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  brandOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 70%)',
  },
  brandContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    color: 'white',
  },
  logoWrapper: {
    marginBottom: '30px',
  },
  logoCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
  },
  logoIcon: {
    fontSize: '50px',
  },
  brandTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  brandDivider: {
    width: '50px',
    height: '3px',
    background: 'rgba(255, 255, 255, 0.5)',
    margin: '20px auto',
    borderRadius: '2px',
  },
  brandDescription: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '30px',
    opacity: 0.9,
  },
  brandFeatures: {
    textAlign: 'left',
    marginTop: '30px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    fontSize: '13px',
  },
  featureIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  
  // Form desktop
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
  
  // Form mobile
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
  
  // Mobile logo
  mobileLogoContainer: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  mobileLogoCircle: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px',
  },
  mobileLogoIcon: {
    fontSize: '35px',
  },
  mobileBrandTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  
  // Header text
  headerText: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  greetingDesktop: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 8px 0',
  },
  instructionDesktop: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  greetingMobile: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 8px 0',
  },
  instructionMobile: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  
  // Error box
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    marginBottom: '20px',
    position: 'relative',
  },
  errorIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  errorText: {
    color: '#c33',
    fontSize: '13px',
    flex: 1,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#c33',
    padding: '0 5px',
  },
  
  // Form fields
  fieldGroup: {
    marginBottom: '20px',
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '8px',
  },
  labelIcon: {
    fontSize: '14px',
  },
  fieldInput: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #e1e5e9',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#333',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  fieldInputFocus: {
    borderColor: '#667eea',
  },
  
  // Password field
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    padding: '12px 45px 12px 14px',
    border: '2px solid #e1e5e9',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#333',
    outline: 'none',
    transition: 'all 0.3s',
    boxSizing: 'border-box',
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
  },
  checkboxText: {
    fontSize: '13px',
    color: '#666',
  },
  forgotLink: {
    fontSize: '13px',
    color: '#667eea',
    textDecoration: 'none',
  },
  
  // Login button
  loginButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s',
    marginBottom: '20px',
  },
  loadingSpinner: {
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
  },
  
  // Register
  registerContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  registerText: {
    fontSize: '13px',
    color: '#666',
    marginRight: '8px',
  },
  registerLink: {
    fontSize: '13px',
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
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
    color: '#999',
    position: 'relative',
    zIndex: 1,
  },
  
  // Demo button
  demoButton: {
    width: '100%',
    padding: '12px',
    background: '#f5f5f5',
    color: '#666',
    border: '1px solid #e1e5e9',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  demoIcon: {
    fontSize: '16px',
  },
};

// Adiciona animação do spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  button:hover {
    transform: translateY(-1px);
  }
  
  .demo-button:hover {
    background: #ececec;
  }
  
  @media (max-width: 768px) {
    input, button {
      font-size: 16px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Login;

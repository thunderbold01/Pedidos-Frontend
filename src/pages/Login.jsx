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
        navigate('/2fa');
      } else {
        const { access, refresh, user } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        onLogin(user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Fundo com textura diagonal cinza */}
      <div style={styles.backgroundTexture}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalTexture" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="60" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.4" />
              <line x1="15" y1="0" x2="15" y2="60" stroke="#e5e7eb" strokeWidth="0.3" opacity="0.2" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.4" />
              <line x1="45" y1="0" x2="45" y2="60" stroke="#e5e7eb" strokeWidth="0.3" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalTexture)" />
        </svg>
      </div>
      
      <div style={styles.card}>
        {/* Lado Esquerdo - Marca */}
        <div style={styles.brandSide}>
          <div style={styles.brandOverlay} />
          <div style={styles.brandContent}>
            {/* Logo - Substitua pelo caminho da sua imagem */}
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={styles.logoImage}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback caso a imagem não carregue */}
            <div style={{ ...styles.logoFallback, display: 'none' }}>
              <span style={styles.logoEmoji}>🎓</span>
            </div>
            <h1 style={styles.brandTitle}>Sistema de Pedidos</h1>
            <div style={styles.brandDivider} />
            <p style={styles.brandDescription}>
              Gerencie suas saídas escolares de forma rápida e eficiente
            </p>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div style={styles.formSide}>
          <div style={styles.formContent}>
            <h2 style={styles.greeting}>Bem-vindo</h2>
            <p style={styles.instruction}>Entre com seus dados</p>

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Email</label>
                <div style={styles.inputContainer}>
                  <span style={styles.inputIcon}>📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.fieldInput}
                    placeholder="seu@email.com"
                    autoFocus
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Senha</label>
                <div style={styles.inputContainer}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.fieldInput}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.loginButton,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div style={styles.registerLink}>
              <span style={styles.registerText}>Não tem conta?</span>
              <Link to="/register" style={styles.registerAction}>
                Criar conta
              </Link>
            </div>
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
  backgroundTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 0.6,
  },
  card: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    width: '100%',
    maxWidth: '950px',
    minHeight: '550px',
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
      radial-gradient(circle at 20% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(239, 68, 68, 0.05) 0%, transparent 40%)
    `,
  },
  brandContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '50px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoImage: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
    marginBottom: '25px',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
  },
  logoFallback: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '25px',
    border: '2px solid rgba(239, 68, 68, 0.3)',
  },
  logoEmoji: {
    fontSize: '60px',
  },
  brandTitle: {
    color: 'white',
    fontSize: '30px',
    fontWeight: '700',
    margin: '0',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
  },
  brandDivider: {
    width: '60px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
    margin: '20px auto',
    borderRadius: '2px',
  },
  brandDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '15px',
    lineHeight: '1.5',
    margin: '0',
    maxWidth: '280px',
  },
  formSide: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 45px',
    backgroundColor: 'white',
  },
  formContent: {
    width: '100%',
    maxWidth: '380px',
  },
  greeting: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 5px 0',
  },
  instruction: {
    fontSize: '15px',
    color: '#94a3b8',
    margin: '0 0 30px 0',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    marginBottom: '25px',
  },
  errorIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  errorText: {
    color: '#991b1b',
    fontSize: '14px',
    lineHeight: '1.4',
  },
  fieldGroup: {
    marginBottom: '22px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '18px',
    zIndex: 1,
    pointerEvents: 'none',
  },
  fieldInput: {
    width: '100%',
    padding: '15px 45px 15px 45px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#1a1a2e',
    outline: 'none',
    backgroundColor: '#fafbfc',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '8px',
    color: '#94a3b8',
  },
  loginButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
    letterSpacing: '0.5px',
  },
  registerLink: {
    textAlign: 'center',
    marginTop: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  registerText: {
    color: '#64748b',
    fontSize: '14px',
  },
  registerAction: {
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'color 0.3s',
  },
};

export default Login;
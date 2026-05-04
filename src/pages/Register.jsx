import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    curso: '',
    classe: '',
    ano_ingresso: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (!form.username || !form.email || !form.password || !form.password2) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    if (form.password !== form.password2) {
      setError('As senhas não coincidem');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    setError('');
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (form.password !== form.password2) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      setLoading(false);
      return;
    }

    if (!form.first_name || !form.last_name) {
      setError('Nome e sobrenome são obrigatórios');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register/', form);
      setSuccess('Conta criada com sucesso!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
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
            <pattern id="diagonalTexture2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="60" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.4" />
              <line x1="15" y1="0" x2="15" y2="60" stroke="#e5e7eb" strokeWidth="0.3" opacity="0.2" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.4" />
              <line x1="45" y1="0" x2="45" y2="60" stroke="#e5e7eb" strokeWidth="0.3" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalTexture2)" />
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
              <span style={styles.logoEmoji}>📝</span>
            </div>
            <h1 style={styles.brandTitle}>Criar Conta</h1>
            <div style={styles.brandDivider} />
            <p style={styles.brandDescription}>
              Junte-se a nós e gerencie seus pedidos
            </p>
            <div style={styles.steps}>
              <div style={{
                ...styles.step,
                backgroundColor: step === 1 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'
              }}>
                <span style={styles.stepNumber}>1</span>
                <span style={styles.stepLabel}>Conta</span>
              </div>
              <div style={styles.stepLine} />
              <div style={{
                ...styles.step,
                backgroundColor: step === 2 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'
              }}>
                <span style={styles.stepNumber}>2</span>
                <span style={styles.stepLabel}>Perfil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div style={styles.formSide}>
          <div style={styles.formContent}>
            <h2 style={styles.greeting}>
              {step === 1 ? 'Criar Conta' : 'Dados do Perfil'}
            </h2>
            <p style={styles.instruction}>
              {step === 1 ? 'Passo 1: Informações da conta' : 'Passo 2: Informações pessoais'}
            </p>

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            {success && (
              <div style={styles.successBox}>
                <span style={styles.successIcon}>✅</span>
                <span style={styles.successText}>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Nome de Usuário *</label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      style={styles.fieldInput}
                      placeholder="Escolha um nome de usuário"
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={styles.fieldInput}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Senha *</label>
                    <div style={styles.passwordBox}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        style={styles.passwordInput}
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Confirmar Senha *</label>
                    <div style={styles.passwordBox}>
                      <input
                        type={showPassword2 ? 'text' : 'password'}
                        name="password2"
                        value={form.password2}
                        onChange={handleChange}
                        required
                        style={styles.passwordInput}
                        placeholder="Repita a senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword2(!showPassword2)}
                        style={styles.eyeBtn}
                      >
                        {showPassword2 ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button type="button" onClick={nextStep} style={styles.nextButton}>
                    Próximo →
                  </button>
                </>
              ) : (
                <>
                  <div style={styles.rowFields}>
                    <div style={styles.halfField}>
                      <label style={styles.fieldLabel}>Nome *</label>
                      <input
                        type="text"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                        style={styles.fieldInput}
                        placeholder="Seu nome"
                      />
                    </div>
                    <div style={styles.halfField}>
                      <label style={styles.fieldLabel}>Sobrenome *</label>
                      <input
                        type="text"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                        style={styles.fieldInput}
                        placeholder="Seu sobrenome"
                      />
                    </div>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Curso</label>
                    <input
                      type="text"
                      name="curso"
                      value={form.curso}
                      onChange={handleChange}
                      style={styles.fieldInput}
                      placeholder="Nome do seu curso"
                    />
                  </div>

                  <div style={styles.rowFields}>
                    <div style={styles.halfField}>
                      <label style={styles.fieldLabel}>Classe</label>
                      <input
                        type="text"
                        name="classe"
                        value={form.classe}
                        onChange={handleChange}
                        style={styles.fieldInput}
                        placeholder="Sua classe"
                      />
                    </div>
                    <div style={styles.halfField}>
                      <label style={styles.fieldLabel}>Ano de Ingresso</label>
                      <input
                        type="number"
                        name="ano_ingresso"
                        value={form.ano_ingresso}
                        onChange={handleChange}
                        style={styles.fieldInput}
                        placeholder="Ex: 2024"
                        min="2000"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div style={styles.buttonGroup}>
                    <button type="button" onClick={prevStep} style={styles.backButton}>
                      ← Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        ...styles.submitButton,
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? 'Criando...' : 'Criar Conta'}
                    </button>
                  </div>
                </>
              )}

              <div style={styles.loginLink}>
                <span style={styles.loginText}>Já tem conta?</span>
                <Link to="/login" style={styles.loginAction}>
                  Fazer login
                </Link>
              </div>
            </form>
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
    minHeight: '620px',
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
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoImage: {
    width: '100px',
    height: '100px',
    objectFit: 'contain',
    marginBottom: '25px',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
  },
  logoFallback: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '25px',
    border: '2px solid rgba(239, 68, 68, 0.3)',
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
    background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
    margin: '0 auto 20px',
    borderRadius: '2px',
  },
  brandDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 25px 0',
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
  },
  stepLabel: {
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  stepLine: {
    width: '25px',
    height: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    margin: '0 5px',
  },
  formSide: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 45px',
    backgroundColor: 'white',
    overflowY: 'auto',
  },
  formContent: {
    width: '100%',
    maxWidth: '400px',
  },
  greeting: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 5px 0',
  },
  instruction: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 25px 0',
  },
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
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  successIcon: {
    fontSize: '16px',
  },
  successText: {
    color: '#166534',
    fontSize: '13px',
  },
  fieldGroup: {
    marginBottom: '16px',
  },
  halfField: {
    marginBottom: '16px',
    flex: 1,
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  fieldInput: {
    width: '100%',
    padding: '13px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1a1a2e',
    outline: 'none',
    backgroundColor: '#fafbfc',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  },
  rowFields: {
    display: 'flex',
    gap: '12px',
  },
  passwordBox: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    padding: '13px 45px 13px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1a1a2e',
    outline: 'none',
    backgroundColor: '#fafbfc',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '6px',
    color: '#94a3b8',
  },
  nextButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '5px',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '5px',
  },
  backButton: {
    flex: '1',
    padding: '14px',
    backgroundColor: 'white',
    color: '#374151',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    flex: '2',
    padding: '14px',
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
  },
  loginLink: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  loginText: {
    color: '#64748b',
    fontSize: '14px',
  },
  loginAction: {
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '14px',
  },
};

export default Register;
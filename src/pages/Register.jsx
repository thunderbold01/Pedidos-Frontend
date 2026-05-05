// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const [step, setStep] = useState(1);
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
  
  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [code, setCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
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
      const response = await api.post('/auth/register/', form);
      
      // Se requer 2FA
      if (response.data.require_2fa) {
        setLoginEmail(response.data.email);
        setSuccess('Conta criada! Código de verificação enviado para seu email.');
        sessionStorage.setItem('login_email', response.data.email);
        sessionStorage.setItem('2fa_code', response.data.code);
        setShow2FA(true);
        setLoading(false);
        return;
      }
      
      // Registro direto (sem 2FA)
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/verify-2fa/', { email: loginEmail, code });
      
      sessionStorage.removeItem('login_email');
      sessionStorage.removeItem('2fa_code');
      
      setSuccess('Conta verificada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
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
          --success-bg: #f0fdf4;
          --success-text: #166534;
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
            --success-bg: rgba(22,101,52,0.2);
            --success-text: #bbf7d0;
            --btn-gradient: linear-gradient(135deg, #dc2626, #f97316);
            --btn-shadow: 0 8px 25px rgba(239,68,68,0.4);
          }
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 16px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .register-card {
          display: flex;
          width: 100%;
          max-width: 900px;
          min-height: 580px;
          background: var(--card-bg);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
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

        .brand-content { text-align: center; position: relative; z-index: 1; }

        .brand-logo {
          width: 90px; height: 90px;
          margin: 0 auto 20px;
          background: rgba(255,255,255,0.1);
          border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .brand-logo span { font-size: 44px; }

        .brand-title { color: #fff; font-size: 24px; font-weight: 800; margin-bottom: 16px; }

        .brand-steps {
          display: flex; align-items: center; justify-content: center; gap: 4px;
          margin-top: 20px;
        }

        .brand-step {
          padding: 8px 16px; border-radius: 20px;
          font-size: 12px; font-weight: 600; color: #fff;
          transition: all 0.3s;
        }

        .brand-step.active { background: rgba(239,68,68,0.4); }

        .brand-step-line {
          width: 20px; height: 2px; background: rgba(255,255,255,0.3);
        }

        .form-side {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 40px; overflow-y: auto;
        }

        .form-content { width: 100%; max-width: 350px; }

        .form-title { font-size: 24px; font-weight: 800; color: var(--text); margin-bottom: 4px; }

        .form-subtitle { font-size: 13px; color: var(--text-light); margin-bottom: 20px; }

        .alert {
          padding: 12px 14px; border-radius: 10px;
          margin-bottom: 16px; font-size: 13px;
          display: flex; align-items: center; gap: 8px;
          animation: fadeIn 0.3s;
        }

        .alert-error { background: var(--error-bg); color: var(--error-text); border: 1px solid #fecaca; }

        .alert-success { background: var(--success-bg); color: var(--success-text); border: 1px solid #bbf7d0; }

        .field { margin-bottom: 12px; }

        .field-row { display: flex; gap: 10px; }

        .field-half { flex: 1; }

        .field-label {
          display: block; font-size: 11px; font-weight: 600;
          color: var(--text-light); margin-bottom: 5px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        .input-wrap { position: relative; }

        .form-input {
          width: 100%; padding: 11px 14px;
          background: var(--input-bg); border: 2px solid var(--border);
          border-radius: 10px; font-size: 13px; color: var(--text);
          outline: none; font-family: inherit;
          transition: all 0.2s;
        }

        .form-input:focus { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }

        .code-input {
          width: 100%; padding: 14px;
          border: 2px solid var(--border); border-radius: 10px;
          font-size: 22px; text-align: center; letter-spacing: 8px;
          outline: none; font-family: monospace; margin-bottom: 12px;
        }

        .code-input:focus { border-color: #dc2626; }

        .eye-btn {
          position: absolute; right: 8px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; font-size: 15px;
          color: var(--text-light); padding: 4px;
        }

        .btn {
          width: 100%; padding: 12px;
          border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: all 0.3s;
        }

        .btn-primary {
          background: var(--btn-gradient); color: #fff;
          box-shadow: var(--btn-shadow);
        }

        .btn-secondary {
          background: transparent; color: var(--text-light);
          border: 2px solid var(--border);
        }

        .btn-group { display: flex; gap: 10px; margin-top: 4px; }

        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .link-row {
          text-align: center; margin-top: 16px;
          padding-top: 14px; border-top: 1px solid var(--border);
          font-size: 13px; color: var(--text-light);
        }

        .link-row a { color: #ef4444; text-decoration: none; font-weight: 700; }

        @media (max-width: 768px) {
          .register-card { flex-direction: column; max-width: 420px; }
          .brand-side { padding: 24px; min-height: 150px; }
          .brand-logo { width: 60px; height: 60px; }
          .brand-logo span { font-size: 32px; }
          .brand-title { font-size: 18px; }
          .form-side { padding: 24px 20px; }
          .field-row { flex-direction: column; gap: 0; }
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="register-card">
        {/* Lado da Marca */}
        <div className="brand-side">
          <div className="brand-content">
            <div className="brand-logo">
              <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span>📝</span>'; }} />
            </div>
            <h1 className="brand-title">Criar Conta</h1>
            
            {!show2FA && (
              <div className="brand-steps">
                <span className={`brand-step ${step === 1 ? 'active' : ''}`}>1. Conta</span>
                <span className="brand-step-line" />
                <span className={`brand-step ${step === 2 ? 'active' : ''}`}>2. Perfil</span>
              </div>
            )}
            
            {show2FA && (
              <div className="brand-steps">
                <span className="brand-step active">🔐 Verificação</span>
              </div>
            )}
          </div>
        </div>

        {/* Lado do Formulário */}
        <div className="form-side">
          <div className="form-content">
            {!show2FA ? (
              <>
                <h2 className="form-title">{step === 1 ? 'Criar Conta' : 'Dados do Perfil'}</h2>
                <p className="form-subtitle">{step === 1 ? 'Passo 1: Informações da conta' : 'Passo 2: Informações pessoais'}</p>

                {error && <div className="alert alert-error">⚠️ {error}</div>}
                {success && <div className="alert alert-success">✅ {success}</div>}

                <form onSubmit={handleSubmit}>
                  {step === 1 ? (
                    <>
                      <div className="field">
                        <label className="field-label">Usuário *</label>
                        <input type="text" name="username" value={form.username} onChange={handleChange} required className="form-input" placeholder="Nome de usuário" />
                      </div>
                      <div className="field">
                        <label className="field-label">Email *</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required className="form-input" placeholder="seu@email.com" />
                      </div>
                      <div className="field">
                        <label className="field-label">Senha *</label>
                        <div className="input-wrap">
                          <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required className="form-input" placeholder="Mínimo 8 caracteres" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">{showPassword ? '🙈' : '👁️'}</button>
                        </div>
                      </div>
                      <div className="field">
                        <label className="field-label">Confirmar Senha *</label>
                        <div className="input-wrap">
                          <input type={showPassword2 ? 'text' : 'password'} name="password2" value={form.password2} onChange={handleChange} required className="form-input" placeholder="Repita a senha" />
                          <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="eye-btn">{showPassword2 ? '🙈' : '👁️'}</button>
                        </div>
                      </div>
                      <button type="button" onClick={nextStep} className="btn btn-primary">Próximo →</button>
                    </>
                  ) : (
                    <>
                      <div className="field-row">
                        <div className="field-half">
                          <label className="field-label">Nome *</label>
                          <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required className="form-input" placeholder="Seu nome" />
                        </div>
                        <div className="field-half">
                          <label className="field-label">Sobrenome *</label>
                          <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required className="form-input" placeholder="Seu sobrenome" />
                        </div>
                      </div>
                      <div className="field">
                        <label className="field-label">Curso</label>
                        <input type="text" name="curso" value={form.curso} onChange={handleChange} className="form-input" placeholder="Nome do curso" />
                      </div>
                      <div className="field-row">
                        <div className="field-half">
                          <label className="field-label">Classe</label>
                          <input type="text" name="classe" value={form.classe} onChange={handleChange} className="form-input" placeholder="Sua classe" />
                        </div>
                        <div className="field-half">
                          <label className="field-label">Ano Ingresso</label>
                          <input type="number" name="ano_ingresso" value={form.ano_ingresso} onChange={handleChange} className="form-input" placeholder="2024" />
                        </div>
                      </div>
                      <div className="btn-group">
                        <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ flex: 1 }}>← Voltar</button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>{loading ? 'Criando...' : 'Criar Conta'}</button>
                      </div>
                    </>
                  )}
                </form>

                <div className="link-row">Já tem conta? <Link to="/login">Fazer login</Link></div>
              </>
            ) : (
              <>
                <h2 className="form-title">Verificação 2FA</h2>
                <p className="form-subtitle">Digite o código enviado para seu email</p>

                {error && <div className="alert alert-error">⚠️ {error}</div>}
                {success && <div className="alert alert-success">📧 {success}</div>}

                <form onSubmit={handleVerify2FA}>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} required autoFocus className="code-input" />
                  <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary">{loading ? 'Verificando...' : '✅ Verificar Código'}</button>
                  <button type="button" onClick={() => { setShow2FA(false); setError(''); }} className="btn btn-secondary" style={{ marginTop: '8px' }}>← Voltar</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

// Ícones SVG em traços
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const SchoolIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
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
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
          50% { box-shadow: 0 0 0 15px rgba(6, 182, 212, 0); }
        }
        
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
          50% { border-color: rgba(6, 182, 212, 0.5); }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .register-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #fef2f2 0%, #f0f9ff 25%, #faf5ff 50%, #f0f9ff 75%, #fef2f2 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        .register-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%);
          animation: float 15s ease-in-out infinite;
          z-index: 0;
        }

        .register-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 0;
        }
        
        .register-card {
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
            0 0 50px -12px rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-bottom: 4px solid;
          border-image: linear-gradient(90deg, #06b6d4, #ef4444, #06b6d4) 1;
          animation: slideUp 0.6s ease-out, borderGlow 3s ease-in-out infinite;
          width: 100%;
          max-width: 460px;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .register-card:hover {
          transform: translateY(-2px);
        }
        
        .register-card-inner {
          padding: 36px 32px;
        }
        
        .register-header {
          text-align: center;
          margin-bottom: 28px;
        }
        
        .register-logo {
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
            0 0 0 8px rgba(239, 68, 68, 0.1);
          animation: float 6s ease-in-out infinite, pulse 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .register-logo::before {
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
        
        .register-logo-img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          z-index: 1;
        }
        
        .register-title {
          font-size: 26px;
          font-weight: 800;
          background: linear-gradient(135deg, #1a1a2e, #0f3460);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        
        .register-subtitle {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }
        
        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 32px;
        }
        
        .step-dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: #f1f5f9;
          color: #94a3b8;
          border: 2px solid #e2e8f0;
          position: relative;
        }
        
        .step-dot.active {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          border-color: #dc2626;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          animation: pulse 2s infinite;
          transform: scale(1.1);
        }
        
        .step-dot.completed {
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          color: white;
          border-color: #06b6d4;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
        }

        .step-dot.completed::after {
          content: '✓';
          font-size: 16px;
        }

        .step-dot.completed span {
          display: none;
        }
        
        .step-connector {
          width: 40px;
          height: 2px;
          background: #e2e8f0;
          transition: all 0.4s ease;
          margin: 0 4px;
        }
        
        .step-connector.active {
          background: linear-gradient(90deg, #dc2626, #06b6d4);
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
        }
        
        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 13px;
          animation: slideIn 0.3s ease-out, fadeIn 0.3s ease-out;
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
          margin-bottom: 18px;
        }
        
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        
        .form-input-wrapper {
          position: relative;
        }
        
        .form-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: color 0.3s ease;
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

        .form-input-no-icon {
          padding-left: 16px;
        }

        .input-with-toggle {
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

        .form-input-wrapper:focus-within .form-input-icon {
          color: #06b6d4;
        }
        
        .form-input:hover {
          border-color: #cbd5e1;
        }
        
        .form-input::placeholder {
          color: #cbd5e1;
        }
        
        .password-toggle-btn {
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
        
        .password-toggle-btn:hover {
          color: #06b6d4;
          background: rgba(6, 182, 212, 0.1);
        }
        
        .form-row {
          display: flex;
          gap: 12px;
        }
        
        .form-row .form-group {
          flex: 1;
        }
        
        .btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #f97316 50%, #ef4444 75%, #dc2626 100%);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
          color: white;
        }
        
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .btn-primary:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 10px 25px -5px rgba(239, 68, 68, 0.4),
            0 8px 10px -6px rgba(239, 68, 68, 0.2);
        }
        
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          color: #374151;
          border: 2px solid #e2e8f0;
        }
        
        .btn-secondary:hover {
          background: white;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-secondary:active {
          transform: translateY(0);
        }
        
        .btn-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        
        .btn-group .btn-secondary {
          flex: 1;
        }
        
        .btn-group .btn-primary {
          flex: 2;
        }
        
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .login-link-row {
          text-align: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          font-size: 14px;
          color: #64748b;
        }
        
        .login-link {
          color: #06b6d4;
          text-decoration: none;
          font-weight: 700;
          margin-left: 4px;
          transition: all 0.3s ease;
          position: relative;
        }

        .login-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #06b6d4, #ef4444);
          transition: width 0.3s ease;
        }
        
        .login-link:hover {
          color: #ef4444;
        }

        .login-link:hover::after {
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .register-wrapper {
            padding: 16px;
            align-items: flex-start;
            padding-top: 40px;
          }
          
          .register-card {
            max-width: 100%;
            border-radius: 20px;
          }
          
          .register-card-inner {
            padding: 28px 20px;
          }
          
          .register-title {
            font-size: 22px;
          }
          
          .form-input {
            font-size: 16px;
            padding: 16px 16px 16px 48px;
          }

          .form-input-no-icon {
            padding-left: 16px;
          }
          
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          
          .register-logo {
            width: 70px;
            height: 70px;
          }
          
          .register-logo-img {
            width: 42px;
            height: 42px;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .register-wrapper {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%);
          }
          
          .register-card {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 
              0 4px 6px -1px rgba(0, 0, 0, 0.3),
              0 10px 15px -3px rgba(0, 0, 0, 0.2),
              0 20px 25px -5px rgba(0, 0, 0, 0.3),
              0 0 50px -12px rgba(239, 68, 68, 0.15);
          }
          
          .register-title {
            background: linear-gradient(135deg, #e2e8f0, #f1f5f9);
            -webkit-background-clip: text;
            background-clip: text;
          }
          
          .register-subtitle,
          .form-label,
          .login-link-row {
            color: #94a3b8;
          }
          
          .form-input {
            background: #1e293b;
            border-color: #334155;
            color: #e2e8f0;
          }
          
          .form-input:focus {
            background: #0f172a;
          }
          
          .form-input::placeholder {
            color: #64748b;
          }
          
          .step-dot {
            background: #1e293b;
            border-color: #334155;
            color: #94a3b8;
          }
          
          .step-connector {
            background: #334155;
          }
          
          .btn-secondary {
            background: #1e293b;
            border-color: #334155;
            color: #e2e8f0;
          }
          
          .btn-secondary:hover {
            background: #334155;
          }
          
          .login-link-row {
            border-top-color: #334155;
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

      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-card-inner">
            {/* Header com Logo */}
            <div className="register-header">
              <div className="register-logo">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="register-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="z-index:1">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/>
                        <line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>`;
                  }}
                />
              </div>
              <h1 className="register-title">Criar Conta</h1>
              <p className="register-subtitle">
                {step === 1 ? 'Passo 1: Dados da conta' : 'Passo 2: Informações pessoais'}
              </p>
            </div>

            {/* Steps Indicator */}
            <div className="steps-indicator">
              <div className={`step-dot ${step === 1 ? 'active' : step === 2 ? 'completed' : ''}`}>
                <span>1</span>
              </div>
              <div className={`step-connector ${step === 2 ? 'active' : ''}`} />
              <div className={`step-dot ${step === 2 ? 'active' : ''}`}>
                <span>2</span>
              </div>
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
              {step === 1 ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Nome de Usuário *</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><UserIcon /></span>
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="Escolha um nome de usuário"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><EmailIcon /></span>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Senha *</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><LockIcon /></span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="form-input input-with-toggle"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle-btn"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirmar Senha *</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><LockIcon /></span>
                      <input
                        type={showPassword2 ? 'text' : 'password'}
                        name="password2"
                        value={form.password2}
                        onChange={handleChange}
                        required
                        className="form-input input-with-toggle"
                        placeholder="Repita a senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword2(!showPassword2)}
                        className="password-toggle-btn"
                        aria-label={showPassword2 ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword2 ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Próximo
                    <ArrowRightIcon />
                  </button>
                </>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nome *</label>
                      <input
                        type="text"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                        className="form-input form-input-no-icon"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sobrenome *</label>
                      <input
                        type="text"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                        className="form-input form-input-no-icon"
                        placeholder="Sobrenome"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Curso</label>
                    <div className="form-input-wrapper">
                      <span className="form-input-icon"><BookIcon /></span>
                      <input
                        type="text"
                        name="curso"
                        value={form.curso}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Nome do seu curso"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Classe</label>
                      <div className="form-input-wrapper">
                        <span className="form-input-icon"><SchoolIcon /></span>
                        <input
                          type="text"
                          name="classe"
                          value={form.classe}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="Sua classe"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ano Ingresso</label>
                      <div className="form-input-wrapper">
                        <span className="form-input-icon"><CalendarIcon /></span>
                        <input
                          type="number"
                          name="ano_ingresso"
                          value={form.ano_ingresso}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="Ex: 2024"
                          min="2000"
                          max="2030"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="btn-group">
                    <button type="button" onClick={prevStep} className="btn btn-secondary">
                      <ArrowLeftIcon />
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? 'Criando conta...' : 'Criar Conta'}
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="login-link-row">
              Já tem uma conta?
              <Link to="/login" className="login-link">
                Fazer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;

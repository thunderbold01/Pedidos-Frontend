// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, clearAuthData, getCurrentUser } from './api';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import TwoFactor from './pages/TwoFactor';
import CriarPedido from './pages/CriarPedido';
import DetalhePedido from './pages/DetalhePedido';
import Relatorios from './pages/Relatorios';
import Notificacoes from './pages/Notificacoes';
import Coletivas from './pages/Coletivas';

// Dashboards por role
import DashboardEstudante from './pages/DashboardEstudante';
import DashboardDITE from './pages/DashboardDITE';
import DashboardDirecao from './pages/DashboardDirecao';
import DashboardAdministracao from './pages/DashboardAdministracao';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardSeguranca from './pages/DashboardSeguranca';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  const verificarAutenticacao = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const result = await getCurrentUser();
      if (result.success) {
        setUser(result.user);
        setError(null);
      } else {
        clearAuthData();
        setUser(null);
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      clearAuthData();
      setUser(null);
      setError('Sessão expirada. Faça login novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setError(null);
  };

  const handleLogout = () => {
    clearAuthData();
    setUser(null);
    setError(null);
  };

  // ==================== TELA DE CARREGAMENTO ====================
  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSpinner} />
          <h2 style={styles.loadingTitle}>Sistema de Pedidos</h2>
          <p style={styles.loadingText}>Carregando...</p>
        </div>
      </div>
    );
  }

  // ==================== FUNÇÕES DE VERIFICAÇÃO ====================
  const getDashboard = () => {
    if (!user) return <Navigate to="/login" />;
    
    switch (user.role) {
      case 'ESTUDANTE':
        return <DashboardEstudante user={user} onLogout={handleLogout} />;
      case 'DITE':
        return <DashboardDITE user={user} onLogout={handleLogout} />;
      case 'DIRECAO':
        return <DashboardDirecao user={user} onLogout={handleLogout} />;
      case 'ADMINISTRACAO':
        return <DashboardAdministracao user={user} onLogout={handleLogout} />;
      case 'ADMIN':
        return <DashboardAdmin user={user} onLogout={handleLogout} />;
      case 'SEGURANCA':
        return <DashboardSeguranca user={user} onLogout={handleLogout} />;
      default:
        handleLogout();
        return <Navigate to="/login" />;
    }
  };

  const podeCriarPedido = () => user?.role === 'ESTUDANTE';
  const podeAcessarRelatorios = () => ['ADMIN', 'DITE', 'DIRECAO', 'ADMINISTRACAO'].includes(user?.role);

  // ==================== ESTILOS ====================
  const styles = {
    loadingScreen: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    loadingCard: {
      textAlign: 'center',
      padding: '40px 60px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '24px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    loadingSpinner: {
      width: '50px',
      height: '50px',
      border: '3px solid rgba(255,255,255,0.1)',
      borderTopColor: '#dc2626',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '0 auto 20px',
    },
    loadingTitle: {
      color: '#ffffff',
      fontSize: '22px',
      fontWeight: '700',
      margin: '0 0 8px 0',
      letterSpacing: '-0.5px',
    },
    loadingText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '14px',
      margin: 0,
      fontWeight: '400',
    },
  };

  // ==================== ANIMAÇÕES GLOBAIS ====================
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    input:focus, select:focus, textarea:focus, button:focus {
      outline: none;
    }
  `;
  document.head.appendChild(styleSheet);

  // ==================== ROTAS ====================
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/dashboard" /> : <Register />
        } />
        <Route path="/2fa" element={<TwoFactor onLogin={handleLogin} />} />

        {/* Dashboard por role */}
        <Route path="/dashboard" element={getDashboard()} />

        {/* Rotas Protegidas */}
        <Route path="/criar-pedido" element={
          podeCriarPedido() ? <CriarPedido user={user} /> : <Navigate to="/dashboard" />
        } />
        <Route path="/pedido/:id" element={
          user ? <DetalhePedido user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/relatorios" element={
          podeAcessarRelatorios() ? <Relatorios user={user} /> : <Navigate to="/dashboard" />
        } />
        <Route path="/notificacoes" element={
          user ? <Notificacoes user={user} /> : <Navigate to="/login" />
        } />
        <Route path="/coletivas" element={
          user ? <Coletivas user={user} /> : <Navigate to="/login" />
        } />

        {/* Rota Padrão */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// src/App.jsx - COMPLETO
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api, { isAuthenticated, clearTokens } from './api';

// ==================== PÁGINAS DE AUTENTICAÇÃO ====================
import Login from './pages/Login';
import Register from './pages/Register';
import TwoFactor from './pages/TwoFactor';

// ==================== DASHBOARDS POR ROLE ====================
import DashboardEstudante from './pages/DashboardEstudante';
import DashboardDITE from './pages/DashboardDITE';
import DashboardDirecao from './pages/DashboardDirecao';
import DashboardAdministracao from './pages/DashboardAdministracao';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardSeguranca from './pages/DashboardSeguranca';

// ==================== PÁGINAS COMUNS ====================
import CriarPedido from './pages/CriarPedido';
import DetalhePedido from './pages/DetalhePedido';
import Relatorios from './pages/Relatorios';
import RelatorioSeguranca from './pages/RelatorioSeguranca';
import Notificacoes from './pages/Notificacoes';
import ColetivasEstudante from './pages/ColetivasEstudante';
import RelatorioColetivasDITE from './pages/RelatorioColetivasDITE';

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
      const response = await api.get('/user/me/');
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      
      if (err.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const refreshResponse = await api.post('/token/refresh/', {
              refresh: refreshToken
            });
            
            const { access } = refreshResponse.data;
            localStorage.setItem('access_token', access);
            
            const userResponse = await api.get('/user/me/');
            setUser(userResponse.data);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (refreshErr) {
          console.error('Erro ao renovar token:', refreshErr);
        }
      }
      
      clearTokens();
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
    clearTokens();
    setUser(null);
    setError(null);
  };

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

  const podeAcessarRelatorios = () => {
    if (!user) return false;
    return ['ADMIN', 'DITE', 'DIRECAO', 'ADMINISTRACAO'].includes(user.role);
  };

  const podeAcessarRelatorioSeguranca = () => {
    if (!user) return false;
    return ['ADMIN', 'DITE', 'DIRECAO', 'ADMINISTRACAO'].includes(user.role);
  };

  const podeAcessarRelatorioColetivas = () => {
    if (!user) return false;
    return user.role === 'DITE' || user.role === 'ADMIN';
  };

  const podeCriarPedido = () => {
    return user?.role === 'ESTUDANTE';
  };

  const podeGerenciarColetivas = () => {
    if (!user) return false;
    return ['ADMIN', 'DITE', 'DIRECAO', 'ADMINISTRACAO'].includes(user.role);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== ROTAS PÚBLICAS ==================== */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } 
        />
        
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/dashboard" /> : <Register />
          } 
        />
        
        <Route 
          path="/2fa" 
          element={<TwoFactor onLogin={handleLogin} />} 
        />

        {/* ==================== ROTAS PROTEGIDAS ==================== */}
        
        {/* Dashboard principal */}
        <Route path="/dashboard" element={getDashboard()} />
        
        {/* Pedidos */}
        <Route 
          path="/criar-pedido" 
          element={
            podeCriarPedido() ? (
              <CriarPedido user={user} />
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />
        
        <Route 
          path="/pedido/:id" 
          element={
            user ? (
              <DetalhePedido user={user} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Saídas Coletivas */}
        <Route 
          path="/coletivas" 
          element={
            user?.role === 'ESTUDANTE' ? (
              <ColetivasEstudante />
            ) : podeGerenciarColetivas() ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />

        {/* Relatórios */}
        <Route 
          path="/relatorios" 
          element={
            podeAcessarRelatorios() ? (
              <Relatorios user={user} />
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />

        <Route 
          path="/relatorio-seguranca" 
          element={
            podeAcessarRelatorioSeguranca() ? (
              <RelatorioSeguranca user={user} />
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />

        <Route 
          path="/relatorio-coletivas" 
          element={
            podeAcessarRelatorioColetivas() ? (
              <RelatorioColetivasDITE />
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />

        {/* Notificações */}
        <Route 
          path="/notificacoes" 
          element={
            user ? (
              <Notificacoes user={user} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* ==================== ROTA PADRÃO ==================== */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

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

// CSS Global
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
    background: #f5f7fa;
  }
  
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  input:focus, select:focus, textarea:focus, button:focus {
    outline: none;
  }
  
  a {
    text-decoration: none;
    color: inherit;
  }
  
  button {
    cursor: pointer;
    font-family: inherit;
  }
`;
document.head.appendChild(globalStyle);

export default App;
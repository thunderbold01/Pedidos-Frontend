// src/App.jsx - VERSÃO SIMPLIFICADA E CORRIGIDA
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getUser, clearAuth, isAuth } from './api';

// Importações diretas (sem caminho index)
import Login from './pages/Login';
import Register from './pages/Register';
import TwoFactor from './pages/TwoFactor';
import DashboardEstudante from './pages/DashboardEstudante';
import DashboardDITE from './pages/DashboardDITE';
import DashboardDirecao from './pages/DashboardDirecao';
import DashboardAdministracao from './pages/DashboardAdministracao';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardSeguranca from './pages/DashboardSeguranca';
import CriarPedido from './pages/CriarPedido';
import DetalhePedido from './pages/DetalhePedido';
import Notificacoes from './pages/Notificacoes';
import Coletivas from './pages/Coletivas';
import Relatorios from './pages/Relatorios';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!isAuth()) {
        setLoading(false);
        return;
      }
      const result = await getUser();
      if (result.success) setUser(result.user);
      else clearAuth();
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ width: 50, height: 50, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
          <h2>Sistema de Pedidos</h2>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { clearAuth(); setUser(null); };

  const getDashboard = () => {
    if (!user) return <Navigate to="/login" />;
    switch (user.role) {
      case 'ESTUDANTE': return <DashboardEstudante user={user} onLogout={handleLogout} />;
      case 'DITE': return <DashboardDITE user={user} onLogout={handleLogout} />;
      case 'DIRECAO': return <DashboardDirecao user={user} onLogout={handleLogout} />;
      case 'ADMINISTRACAO': return <DashboardAdministracao user={user} onLogout={handleLogout} />;
      case 'ADMIN': return <DashboardAdmin user={user} onLogout={handleLogout} />;
      case 'SEGURANCA': return <DashboardSeguranca user={user} onLogout={handleLogout} />;
      default: handleLogout(); return <Navigate to="/login" />;
    }
  };

  // Adicionar animação global
  const style = document.createElement('style');
  style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/2fa" element={<TwoFactor onLogin={handleLogin} />} />
        <Route path="/dashboard" element={getDashboard()} />
        <Route path="/criar-pedido" element={user?.role === 'ESTUDANTE' ? <CriarPedido user={user} /> : <Navigate to="/dashboard" />} />
        <Route path="/pedido/:id" element={user ? <DetalhePedido user={user} /> : <Navigate to="/login" />} />
        <Route path="/notificacoes" element={user ? <Notificacoes user={user} /> : <Navigate to="/login" />} />
        <Route path="/coletivas" element={user ? <Coletivas user={user} /> : <Navigate to="/login" />} />
        <Route path="/relatorios" element={user && ['ADMIN','DITE','DIRECAO','ADMINISTRACAO'].includes(user.role) ? <Relatorios user={user} /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import TwoFactor from './pages/TwoFactor';
import Dashboard from './pages/Dashboard';
import CriarPedido from './pages/CriarPedido';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await api.get('/user/me/');
        setUser(response.data);
      } catch (error) {
        localStorage.clear();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : 
          <Login onLogin={handleLogin} />
        } />
        
        <Route path="/register" element={
          user ? <Navigate to="/dashboard" /> : 
          <Register />
        } />
        
        <Route path="/2fa" element={<TwoFactor onLogin={handleLogin} />} />
        
        {/* Rota Protegida */}
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} onLogout={handleLogout} /> : 
          <Navigate to="/login" />
        } />
        
        <Route path="/criar-pedido" element={
          user?.role === 'ESTUDANTE' ? <CriarPedido user={user} /> : 
          <Navigate to="/dashboard" />
        } />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
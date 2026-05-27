import React, { useState, useEffect, useRef } from 'react';
import { authService, userService, chatService, cryptoService } from './services/api';
import AdminPanel from './AdminPanel';
import FileUpload from './FileUpload';
import MediaViewer from './MediaViewer';

// ===== PALETA & CONFIGURAÇÃO VISUAL (Clean, White, Green/Cyan Gradients) =====
const THEME = {
  bg: '#ffffff',
  bgSecondary: '#f8fafc', // Slate-50
  surface: '#ffffff',
  border: '#e2e8f0', // Slate-200
  text: '#0f172a', // Slate-900
  textSecondary: '#64748b', // Slate-500
  textMuted: '#94a3b8',
  
  // Gradient Brand: Natural Light Green -> Cyan
  primaryGradient: 'linear-gradient(135deg, #86efac 0%, #22d3ee 100%)',
  accent: '#06b6d4', // Cyan
  
  success: '#10b981',
  danger: '#ef4444',
  
  msgOwnBg: '#ecfdf5', // Emerald-50
  msgOtherBg: '#f1f5f9', // Slate-100
};

// ===== ÍCONES SVG (Minimalist) =====
const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  ChevronLeft: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Lock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Bot: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Paperclip: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  BellOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  CheckDouble: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
};

// ===== COMPONENTES UI REUTILIZÁVEIS =====

const Avatar = ({ name, online, size = 40, isAI }) => {
  const initials = isAI ? <Icons.Bot /> : (name || '?').substring(0, 2).toUpperCase();
  
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: isAI ? THEME.primaryGradient : '#f1f5f9',
      color: isAI ? '#fff' : '#475569',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '600', fontSize: size * 0.35, position: 'relative', flexShrink: 0,
      transition: 'transform 0.2s ease'
    }}>
      {initials}
      {!isAI && online !== undefined && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.25, height: size * 0.25, borderRadius: '50%',
          border: `2px solid ${THEME.surface}`,
          background: online ? THEME.success : '#cbd5e1'
        }}/>
      )}
    </div>
  );
};

const AudioPlayer = ({ audioSrc }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, padding: '4px 0' }}>
      <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(false)} onTimeUpdate={(e) => setProgress((e.target.currentTime / e.target.duration) * 100)} />
      <button onClick={toggle} style={{ 
        width: 32, height: 32, borderRadius: '50%', 
        background: THEME.accent, border: 'none', color: '#fff', 
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        {playing ? <Icons.Pause /> : <Icons.Play />}
      </button>
      <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: THEME.accent, transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
};

// ===== APP PRINCIPAL =====
function App() {
  // --- STATE MANAGEMENT ---
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Navigation & View State
  const [sidebarOpen, setSidebarOpen] = useState(false); // Controla menu mobile
  const [activeTab, setActiveTab] = useState('chats'); // chats | requests
  const [selFriend, setSelFriend] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  
  // Auth Forms
  const [authPage, setAuthPage] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [regData, setRegData] = useState({ username: '', password: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  
  // Data Lists
  const [friends, setFriends] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Inputs
  const [newMsg, setNewMsg] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showSearchInput, setShowSearchInput] = useState(false); // Toggle search bar
  
  // AI State
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  
  // System State
  const [temChaves, setTemChaves] = useState(false);
  const [gerandoChaves, setGerandoChaves] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [fadeIn, setFadeIn] = useState(false);

  // Refs
  const msgEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // --- EFFECTS ---
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false); // Reset sidebar state on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (msgEndRef.current) msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, aiMessages, showAiChat]);

  useEffect(() => {
    setFadeIn(true);
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAuth(true);
        setIsAdmin(userData.username === 'admin');
      } catch (e) { localStorage.clear(); }
    }
  }, []);

  // Polling Messages
  useEffect(() => {
    if (!selFriend?.conversa_id || showAiChat) return;
    let active = true;
    const poll = async () => { 
      if (!active) return; 
      try { 
        const r = await chatService.getMessages(selFriend.conversa_id); 
        if (active) setMsgs(r.data.mensagens || []); 
      } catch (e) {} 
    };
    poll(); 
    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [selFriend?.conversa_id, showAiChat]);

  // Polling Friends/Requests
  useEffect(() => {
    if (!auth || isAdmin) return;
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]);
        if (active) { setFriends(fr.data.amigos || []); setRequests(rq.data.recebidas || []); }
      } catch (e) {}
    };
    poll(); 
    const interval = setInterval(poll, 5000);
    return () => { active = false; clearInterval(interval); };
  }, [auth, isAdmin]);

  // Key Generation
  useEffect(() => {
    if (auth && user && !isAdmin) gerarChavesSeNecessario();
  }, [auth, user, isAdmin]);

  // --- LOGIC HANDLERS ---

  const gerarChavesSeNecessario = async () => {
    if (!auth || isAdmin) return;
    try {
      const verificar = await cryptoService.verificarChaves();
      if (!verificar.data.tem_chaves) {
        setGerandoChaves(true);
        await cryptoService.gerarChavesRSA();
        setTemChaves(true);
      } else {
        setTemChaves(true);
      }
    } catch (err) { console.error(err); } finally { setGerandoChaves(false); }
  };

  const doLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authService.login(loginData);
      const userData = r.data.usuario;
      setUser(userData);
      setAuth(true);
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAdmin(userData.username === 'admin');
    } catch (err) { alert('Falha no login.'); } finally { setLoading(false); }
  };

  const doRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authService.register({
        username: regData.username,
        password: regData.password,
        numero_celular: regData.telefone,
      });
      const userData = r.data.usuario;
      setUser(userData);
      setAuth(true);
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAdmin(userData.username === 'admin');
    } catch (err) { alert('Falha no registro.'); } finally { setLoading(false); }
  };

  const doLogout = () => {
    localStorage.clear();
    setAuth(false); setUser(null); setIsAdmin(false);
    setFriends([]); setSelFriend(null); setMsgs([]); setAiMessages([]);
  };

  const handleSelectFriend = (f) => {
    if (f && f.id === 'ai') openAiChat();
    else {
      setSelFriend(f);
      setShowAiChat(false);
      if (isMobile) setSidebarOpen(false); // Close sidebar/drawer on mobile selection
    }
  };

  const openAiChat = () => {
    if (!showAiChat) setAiMessages([{ role: 'assistant', content: 'Olá! Sou o Thunderbold_AI. Como posso ajudar?', id: Date.now() }]);
    setShowAiChat(true);
    setSelFriend(null);
    if (isMobile) setSidebarOpen(false);
  };

  const sendMsg = async () => {
    const m = newMsg.trim();
    if (!m || !selFriend?.conversa_id) return;
    
    const tempId = Date.now();
    const localMsg = { id: tempId, remetente: user.username, conteudo: m, enviada_em: new Date().toISOString(), enviada_por_mim: true, temp: true };
    
    setMsgs(prev => [...prev, localMsg]);
    setNewMsg('');
    
    try {
      const response = await chatService.sendMessage(selFriend.conversa_id, m);
      setMsgs(prev => prev.map(msg => msg.id === tempId ? { ...msg, id: response.data.id, temp: false } : msg));
      const r = await chatService.getMessages(selFriend.conversa_id);
      setMsgs(r.data.mensagens || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar.');
      setMsgs(prev => prev.filter(msg => msg.id !== tempId));
      setNewMsg(m);
    }
  };

  const sendToAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = { role: 'user', content: aiInput.trim(), id: Date.now() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000/api' : 'https://secure-messaging-api.onrender.com/api';
      const response = await fetch(`${apiUrl}/ai/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ mensagem: userMsg.content })
      });
      const data = await response.json();
      if (data.reply) setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply, id: Date.now() + 1 }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão.', id: Date.now() + 1 }]);
    } finally { setAiLoading(false); }
  };

  const acceptReq = async (id) => {
    try {
      await userService.respondToRequest(id, 'ACEITAR');
      const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]);
      setFriends(fr.data.amigos || []); setRequests(rq.data.recebidas || []);
    } catch (e) {}
  };

  const rejectReq = async (id) => {
    try {
      await userService.respondToRequest(id, 'RECUSAR');
      const r = await userService.getFriendRequests();
      setRequests(r.data.recebidas || []);
    } catch (e) {}
  };

  const doSearch = async () => {
    if (!searchPhone.trim()) return;
    try {
      const r = await userService.searchByPhone(searchPhone);
      setSearchResult(r.data);
    } catch (e) { setSearchResult({ encontrado: false }); }
  };

  const sendFriendRequest = async () => {
    try {
      await userService.sendFriendRequest(searchResult.usuario.telefone);
      alert('Solicitação enviada!');
      setSearchResult(null);
      setSearchPhone('');
      setShowSearchInput(false);
    } catch (e) { alert(e.response?.data?.erro || 'Erro'); }
  };

  const ft = (iso) => iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  // --- RENDER HELPERS ---

  if (auth && isAdmin) return <AdminPanel user={user} onLogout={doLogout} />;

  // AUTH SCREEN
  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: THEME.bgSecondary, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', opacity: fadeIn ? 1 : 0, transition: 'opacity 0.5s ease', padding: 20 }}>
        <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={{ width: '100%', maxWidth: 380, padding: 30, background: THEME.surface, borderRadius: 24, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', animation: 'slideUp 0.6s ease forwards' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 15px', background: THEME.primaryGradient, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Icons.Lock />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: THEME.text, margin: 0, letterSpacing: '-0.5px' }}>Cripto_Menseger</h1>
            <p style={{ color: THEME.textSecondary, marginTop: 8, fontSize: 14 }}>Comunicação segura e minimalista.</p>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 25 }}>
            {['login', 'register'].map(page => (
              <button key={page} onClick={() => setAuthPage(page)} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', background: authPage === page ? THEME.surface : 'transparent', color: authPage === page ? THEME.text : THEME.textSecondary, boxShadow: authPage === page ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                {page === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          <form onSubmit={authPage === 'login' ? doLogin : doRegister}>
            <div style={{ marginBottom: 16 }}>
              <input type="text" placeholder="Usuário" value={authPage === 'login' ? loginData.username : regData.username} onChange={e => authPage === 'login' ? setLoginData({...loginData, username: e.target.value}) : setRegData({...regData, username: e.target.value})} required style={{ width: '100%', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', color: THEME.text }} />
            </div>
            {authPage === 'register' && (
              <div style={{ marginBottom: 16 }}>
                <input type="tel" placeholder="Telefone" value={regData.telefone} onChange={e => setRegData({...regData, telefone: e.target.value})} required style={{ width: '100%', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: THEME.text }} />
              </div>
            )}
            <div style={{ marginBottom: 25 }}>
              <input type="password" placeholder="Senha" value={authPage === 'login' ? loginData.password : regData.password} onChange={e => authPage === 'login' ? setLoginData({...loginData, password: e.target.value}) : setRegData({...regData, password: e.target.value})} required style={{ width: '100%', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: THEME.text }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: THEME.primaryGradient, color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.8 : 1, transition: 'opacity 0.2s' }}>
              {loading ? 'Processando...' : (authPage === 'login' ? 'Acessar' : 'Registrar')}
            </button>
          </form>
          
          <div style={{ marginTop: 30, textAlign: 'center', fontSize: 12, color: THEME.textMuted }}>
            Framework by Hare & Madodo
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div style={{ height: '100dvh', display: 'flex', background: THEME.surface, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden', opacity: fadeIn ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        input:focus { border-color: #22d3ee !important; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>

      {/* SIDEBAR (Lista de Contatos) */}
      <div style={{ 
        width: isMobile ? '85%' : 340, 
        maxWidth: isMobile ? '300px' : '340px',
        background: THEME.surface, 
        borderRight: `1px solid ${THEME.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'absolute' : 'relative',
        zIndex: 30,
        height: '100%',
        // Lógica de exibição Mobile vs Desktop
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: isMobile ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        boxShadow: isMobile && sidebarOpen ? '5px 0 25px rgba(0,0,0,0.1)' : 'none'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${THEME.border}`, background: THEME.surface }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <Avatar name={user?.username} size={36} />
               <div>
                 <div style={{ fontWeight: 700, fontSize: 16, color: THEME.text }}>{user?.username}</div>
                 <div style={{ fontSize: 11, color: THEME.success }}>● Online</div>
               </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
               <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: THEME.textSecondary, padding: 8 }}>
                 {notificationsEnabled ? <Icons.Bell /> : <Icons.BellOff />}
               </button>
               <button onClick={doLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: THEME.danger, padding: 8 }}>
                 <Icons.LogOut />
               </button>
            </div>
          </div>
          
          {/* Compact Search Bar */}
          {showSearchInput ? (
             <div style={{ display: 'flex', gap: 8, marginBottom: 10, animation: 'popIn 0.2s ease' }}>
               <input 
                 autoFocus
                 type="tel" 
                 placeholder="Buscar telefone..." 
                 value={searchPhone} 
                 onChange={e => setSearchPhone(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && doSearch()}
                 style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: `1px solid ${THEME.border}`, fontSize: 14, outline: 'none', background: '#f8fafc' }}
               />
               <button onClick={() => { setShowSearchInput(false); setSearchResult(null); }} style={{ padding: '0 12px', background: 'transparent', border: 'none', color: THEME.textSecondary }}><Icons.X /></button>
             </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: 20 }}>
                 <button onClick={() => setActiveTab('chats')} style={{ padding: '8px 0', borderBottom: activeTab === 'chats' ? `2px solid ${THEME.accent}` : '2px solid transparent', background: 'none', border: 'none', fontWeight: 600, color: activeTab === 'chats' ? THEME.accent : THEME.textSecondary, cursor: 'pointer', fontSize: 14 }}>
                   Mensagens
                 </button>
                 <button onClick={() => setActiveTab('requests')} style={{ padding: '8px 0', borderBottom: activeTab === 'requests' ? `2px solid ${THEME.accent}` : '2px solid transparent', background: 'none', border: 'none', fontWeight: 600, color: activeTab === 'requests' ? THEME.accent : THEME.textSecondary, cursor: 'pointer', position: 'relative', fontSize: 14 }}>
                   Pedidos
                   {requests.length > 0 && <span style={{ position: 'absolute', top: 0, right: '-10px', background: THEME.danger, color: '#fff', fontSize: 10, padding: '2px 5px', borderRadius: 10 }}>{requests.length}</span>}
                 </button>
               </div>
               {activeTab === 'chats' && (
                 <button onClick={() => setShowSearchInput(true)} style={{ background: 'none', border: 'none', color: THEME.textSecondary, cursor: 'pointer' }}>
                   <Icons.Search />
                 </button>
               )}
            </div>
          )}

          {/* Search Result Area (Inline) */}
          {searchResult && (
            <div style={{ marginTop: 10, background: '#f0fdf4', padding: 10, borderRadius: 12, border: `1px solid ${THEME.border}`, animation: 'popIn 0.2s ease' }}>
               <div style={{ fontWeight: 600, fontSize: 14 }}>{searchResult.usuario?.username || 'Desconhecido'}</div>
               <div style={{ fontSize: 12, color: THEME.textSecondary, marginBottom: 8 }}>{searchResult.usuario?.telefone}</div>
               {searchResult.is_amigo ? (
                 <div style={{ fontSize: 12, color: THEME.success }}>Já é amigo</div>
               ) : searchResult.solicitacao_enviada ? (
                 <div style={{ fontSize: 12, color: '#f59e0b' }}>Solicitação enviada</div>
               ) : (
                 <button onClick={sendFriendRequest} style={{ width: '100%', padding: 6, background: THEME.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Adicionar</button>
               )}
            </div>
          )}
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: THEME.bgSecondary }}>
          {activeTab === 'chats' ? (
            <>
              {/* AI Chat Item */}
              <div onClick={() => openAiChat()} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: showAiChat ? '#fff' : 'transparent', borderLeft: showAiChat ? `3px solid ${THEME.accent}` : '3px solid transparent' }}>
                <Avatar name="AI" isAI={true} size={44} online={true} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: THEME.text, fontSize: 15 }}>Thunderbold AI</div>
                  <div style={{ fontSize: 12, color: THEME.success }}>● Assistente Virtual</div>
                </div>
              </div>

              {/* Friend List */}
              {friends.map(f => (
                <div key={f.id} onClick={() => handleSelectFriend(f)} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: selFriend?.id === f.id ? '#fff' : 'transparent', borderLeft: selFriend?.id === f.id ? `3px solid ${THEME.accent}` : '3px solid transparent', borderBottom: `1px solid ${THEME.border}` }}>
                  <Avatar name={f.username} online={f.online} size={44} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, color: THEME.text, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.username}</div>
                    <div style={{ fontSize: 12, color: THEME.textSecondary, marginTop: 2 }}>{f.canal_seguro ? '🔒 Seguro' : f.telefone}</div>
                  </div>
                </div>
              ))}
              {friends.length === 0 && !showSearchInput && (
                <div style={{ padding: 40, textAlign: 'center', color: THEME.textMuted, fontSize: 13 }}>
                  Nenhum contato ainda.<br/>Use a busca para adicionar.
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 16 }}>
              {requests.length === 0 ? <p style={{ textAlign: 'center', color: THEME.textMuted, fontSize: 14 }}>Sem solicitações.</p> :
                requests.map(r => (
                  <div key={r.id} style={{ background: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, border: `1px solid ${THEME.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Avatar name={r.remetente} size={36} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.remetente}</div>
                        <div style={{ fontSize: 12, color: THEME.textSecondary }}>{r.telefone}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => acceptReq(r.id)} style={{ flex: 1, padding: 8, background: THEME.success, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Aceitar</button>
                      <button onClick={() => rejectReq(r.id)} style={{ flex: 1, padding: 8, background: '#fff', color: THEME.danger, border: `1px solid ${THEME.danger}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Recusar</button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 25, backdropFilter: 'blur(2px)' }} />
      )}

      {/* CHAT AREA */}
      <div style={{ 
        flex: 1, 
        display: (isMobile && !selFriend && !showAiChat) ? 'none' : 'flex', // Hide on mobile if nothing selected
        flexDirection: 'column', 
        background: THEME.bgSecondary, 
        position: 'relative',
        width: '100%'
      }}>
        {(selFriend || showAiChat) ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '12px 16px', background: THEME.surface, borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
              {isMobile && (
                <button onClick={() => { setSelFriend(null); setShowAiChat(false); setSidebarOpen(true); }} style={{ background: 'none', border: 'none', padding: 8, marginRight: 4, color: THEME.text, display: 'flex' }}>
                  <Icons.ChevronLeft />
                </button>
              )}
              <Avatar name={showAiChat ? 'AI' : selFriend.username} isAI={showAiChat} online={selFriend?.online} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: THEME.text }}>{showAiChat ? 'Thunderbold AI' : selFriend.username}</div>
                <div style={{ fontSize: 11, color: THEME.textSecondary }}>
                  {showAiChat ? 'Inteligência Artificial' : (selFriend.online ? <span style={{color: THEME.success}}>● Online</span> : 'Offline')}
                </div>
              </div>
              {showAiChat && (
                <button onClick={() => setAiMessages([])} style={{ background: 'none', border: 'none', color: THEME.textMuted, cursor: 'pointer', padding: 8 }}><Icons.Trash /></button>
              )}
            </div>

            {/* Messages Area */}
            <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(showAiChat ? aiMessages : msgs).map(msg => {
                const isOwn = msg.remetente === user.username;
                const isMedia = ['IMAGEM', 'AUDIO', 'VIDEO', 'ARQUIVO'].includes(msg.tipo);
                
                return (
                  <div key={msg.id} style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', animation: 'popIn 0.2s ease' }}>
                    <div style={{ 
                      padding: isMedia ? 4 : '10px 14px', 
                      background: isOwn ? THEME.msgOwnBg : THEME.msgOtherBg, 
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: `1px solid ${isOwn ? '#d1fae5' : '#e2e8f0'}`,
                      overflow: 'hidden',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {isMedia ? (
                         msg.tipo === 'AUDIO' ? <AudioPlayer audioSrc={msg.conteudo} /> :
                         msg.tipo === 'VIDEO' ? (
                           <video src={msg.conteudo} controls style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', display: 'block' }} preload="metadata" />
                         ) :
                         msg.tipo === 'IMAGEM' ? <img src={msg.conteudo} alt="img" style={{maxWidth:'100%', borderRadius:12, cursor:'pointer', display:'block'}} onClick={()=>setSelectedMedia(msg)} /> :
                         <div style={{padding:10, cursor:'pointer', display: 'flex', alignItems: 'center', gap: 8}} onClick={()=>setSelectedMedia(msg)}>
                           <Icons.Paperclip /> Arquivo
                         </div>
                      ) : (
                        <div style={{ fontSize: 15, lineHeight: 1.4, color: THEME.text, whiteSpace: 'pre-wrap' }}>{msg.conteudo}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: THEME.textMuted, marginTop: 2, alignSelf: isOwn ? 'flex-end' : 'flex-start', paddingRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {ft(msg.enviada_em)}
                      {isOwn && <Icons.CheckDouble />}
                    </div>
                  </div>
                );
              })}
              {aiLoading && <div style={{ alignSelf: 'flex-start', padding: '10px 15px', background: THEME.msgOtherBg, borderRadius: 18, fontSize: 12, color: THEME.textSecondary, border: `1px solid ${THEME.border}` }}>Digitando...</div>}
              <div ref={msgEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px 16px', background: THEME.surface, borderTop: `1px solid ${THEME.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '4px 4px 4px 12px', borderRadius: 24, border: `1px solid ${THEME.border}` }}>
                <FileUpload conversaId={selFriend?.conversa_id} onFileSent={() => {}} trigger={<button style={{background:'none',border:'none',cursor:'pointer',color:THEME.textSecondary, display:'flex', alignItems:'center', padding: 8}}><Icons.Paperclip/></button>} />
                <input 
                  value={showAiChat ? aiInput : newMsg} 
                  onChange={e => showAiChat ? setAiInput(e.target.value) : setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), (showAiChat ? sendToAI : sendMsg)())}
                  placeholder={showAiChat ? "Pergunte algo..." : "Mensagem..."}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: THEME.text, padding: '8px 0' }} 
                />
                <button 
                  onClick={showAiChat ? sendToAI : sendMsg} 
                  disabled={showAiChat ? !aiInput.trim() : !newMsg.trim()}
                  style={{ 
                    width: 36, height: 36, borderRadius: '50%', 
                    background: THEME.primaryGradient, 
                    border: 'none', color: '#fff', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: (showAiChat ? !aiInput.trim() : !newMsg.trim()) ? 'default' : 'pointer',
                    opacity: (showAiChat ? !aiInput.trim() : !newMsg.trim()) ? 0.5 : 1,
                    transition: 'transform 0.1s'
                  }}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State (Desktop Only usually, or initial mobile state) */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: THEME.textSecondary, padding: 20, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: THEME.textMuted }}>
              <Icons.User />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: THEME.text, marginBottom: 8 }}>Cripto_Menseger Web</h3>
            <p style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.5 }}>Selecione um contato para iniciar uma conversa segura.</p>
            
            {/* Botão para abrir sidebar no mobile se estiver fechado e sem chat */}
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ marginTop: 24, padding: '12px 24px', background: THEME.primaryGradient, color: '#fff', border: 'none', borderRadius: 24, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(34, 211, 238, 0.2)' }}>
                Abrir Conversas
              </button>
            )}
          </div>
        )}
      </div>

      {/* MEDIA VIEWER */}
      {selectedMedia && <MediaViewer mensagem={selectedMedia} onClose={() => setSelectedMedia(null)} />}
      
      {/* FOOTER CREDIT */}
      <div style={{ position: 'absolute', bottom: 5, right: 10, fontSize: 10, color: THEME.textMuted, pointerEvents: 'none', zIndex: 5 }}>
        Framework by Hare & Madodo
      </div>
    </div>
  );
}

export default App;

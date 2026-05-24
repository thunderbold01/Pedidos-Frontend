import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CriarPedido = () => {
  const [form, setForm] = useState({
    tipo: 'outros',
    motivo: '',
    tema_saida: '',
    data_saida: '',
    data_volta: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Theme State (Persisted)
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('student-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [themeMode, setThemeMode] = useState(getInitialTheme);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    localStorage.setItem('student-theme', themeMode);
  }, [themeMode]);

  // Design Tokens
  const T = {
    blue: '#2563EB', // Primary Blue
    blueLight: '#DBEAFE',
    blueDark: '#1E40AF',
    bg: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    danger: '#EF4444',
    success: '#10B981',
    shadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.05)',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.motivo.trim()) {
      setError('Digite o motivo da saída');
      setLoading(false);
      return;
    }
    if (form.tipo === 'outros' && !form.tema_saida.trim()) {
      setError('Informe o tema da saída');
      setLoading(false);
      return;
    }
    if (!form.data_saida) {
      setError('Selecione a data de saída');
      setLoading(false);
      return;
    }

    try {
      const dados = {
        tipo: form.tipo,
        motivo: form.motivo,
        tema_saida: form.tipo === 'outros' ? form.tema_saida : '',
        data_saida: form.data_saida,
        hora_saida: '07:00',
        data_volta: form.data_volta || form.data_saida,
        hora_volta: '12:00',
      };

      await api.post('/pedidos/criar/', dados);
      alert('✅ Pedido criado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div style={{ 
      minHeight: '100vh', background: T.bg, color: T.text, 
      fontFamily: "'Inter', system-ui, sans-serif", transition: 'all 0.3s ease',
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${T.blue}; box-shadow: 0 0 0 3px ${T.blueLight}; }
      `}</style>

      <div style={{ 
        width: '100%', maxWidth: 550, background: T.surface, 
        borderRadius: 16, boxShadow: T.shadow, overflow: 'hidden',
        border: `1px solid ${T.border}`
      }}>
        {/* Header */}
        <div style={{ 
          background: T.blue, padding: '24px 30px', position: 'relative',
          backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
        }}>
          <button onClick={() => navigate('/dashboard')} style={{
            position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.2)',
            border: 'none', color: '#FFF', padding: '8px 12px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
          }}>
            ← Voltar
          </button>
          
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <h1 style={{ margin: 0, color: '#FFF', fontSize: 22, fontWeight: 700 }}>Novo Pedido</h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Preencha os dados para solicitar sua saída</p>
          </div>

          {/* Theme Toggle in Header */}
          <button onClick={() => setThemeMode(isDark ? 'light' : 'dark')} style={{
            position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.2)',
            border: 'none', color: '#FFF', width: 36, height: 36, borderRadius: '50%',
            cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16
          }}>
            {isDark ? '☀' : '☾'}
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: 30 }}>
          {error && (
            <div style={{ 
              background: `${T.danger}15`, color: T.danger, padding: 12, 
              borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 500,
              border: `1px solid ${T.danger}30`, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Tipo de Saída */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: T.text }}>Tipo de Saída</label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={form.tipo} 
                  onChange={e => setForm({...form, tipo: e.target.value})} 
                  style={{ 
                    width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, 
                    borderRadius: 8, background: T.bg, color: T.text, fontSize: 14, appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="medicos">🏥 Médicos</option>
                  <option value="infelecidade">😢 Infelicidade</option>
                  <option value="escola">🏫 Sugerido pela Escola</option>
                  <option value="outros">📋 Outros</option>
                </select>
                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.textMuted }}>▼</div>
              </div>
            </div>

            {/* Tema (Condicional) */}
            {form.tipo === 'outros' && (
              <div style={{ marginBottom: 20, animation: 'fadeIn 0.3s ease' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: T.text }}>Tema da Saída <span style={{color: T.danger}}>*</span></label>
                <input 
                  type="text" 
                  value={form.tema_saida} 
                  onChange={e => setForm({...form, tema_saida: e.target.value})} 
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, fontSize: 14 }} 
                  placeholder="Ex: Consulta médica, Assunto pessoal..." 
                />
              </div>
            )}

            {/* Motivo */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: T.text }}>Motivo Detalhado <span style={{color: T.danger}}>*</span></label>
              <textarea 
                value={form.motivo} 
                onChange={e => setForm({...form, motivo: e.target.value})} 
                rows={4} 
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, fontSize: 14, resize: 'vertical' }} 
                placeholder="Descreva detalhadamente o motivo da sua solicitação..." 
              />
            </div>

            {/* Datas Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: T.text }}>Data Saída <span style={{color: T.danger}}>*</span></label>
                <input 
                  type="date" 
                  value={form.data_saida} 
                  onChange={e => setForm({...form, data_saida: e.target.value})} 
                  min={hoje} 
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, fontSize: 14 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: T.text }}>Data Retorno</label>
                <input 
                  type="date" 
                  value={form.data_volta} 
                  onChange={e => setForm({...form, data_volta: e.target.value})} 
                  min={form.data_saida || hoje} 
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, fontSize: 14 }} 
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')} 
                style={{ 
                  flex: 1, padding: 14, background: 'transparent', border: `1px solid ${T.border}`, 
                  borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: T.textMuted, fontSize: 14,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.textMuted; e.currentTarget.style.color = T.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  flex: 2, padding: 14, background: T.blue, color: '#FFF', border: 'none', 
                  borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  opacity: loading ? 0.7 : 1,
                  transition: 'transform 0.1s'
                }}
                onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? 'Enviando...' : 'Criar Pedido'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer Decor */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${T.blue}, ${T.blueDark})` }} />
      </div>
    </div>
  );
};

export default CriarPedido;

// src/pages/DashboardSeguranca.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getSaidasPorData,
    marcarSaida,
    marcarRetorno,
    getNotificacoes,
    marcarNotificacaoLida,
    enviarRelatorioSaidas,
    getRelatorioCompletoSeguranca
} from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
    // ==================== ESTADOS ====================
    const [saidas, setSaidas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataSelecionada, setDataSelecionada] = useState(() => new Date().toISOString().split('T')[0]);
    const [modalRegistro, setModalRegistro] = useState(null);
    const [horaManual, setHoraManual] = useState('');
    const [notificacoes, setNotificacoes] = useState([]);
    const [notifNaoLidas, setNotifNaoLidas] = useState(0);
    const [showNotif, setShowNotif] = useState(false);
    const [horaAtual, setHoraAtual] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [gerando, setGerando] = useState(false);

    const navigate = useNavigate();

    // ==================== RELÓGIO ====================
    useEffect(() => {
        const timer = setInterval(() => {
            setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ==================== CARREGAR DADOS ====================
    const carregarDados = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Buscar saídas da data selecionada
            const res = await getSaidasPorData(dataSelecionada);
            if (res.success) {
                setSaidas(res.saidas || []);
            } else {
                setError(res.error);
                setSaidas([]);
            }

            // Buscar notificações
            const notifRes = await getNotificacoes();
            if (notifRes.success) {
                setNotificacoes(notifRes.notificacoes || []);
                setNotifNaoLidas(notifRes.nao_lidas || 0);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dataSelecionada]);

    useEffect(() => {
        carregarDados();
        const interval = setInterval(carregarDados, 30000);
        return () => clearInterval(interval);
    }, [carregarDados]);

    // ==================== AÇÕES ====================
    const handleRegistrarSaida = async (pedidoId) => {
        if (!confirm('✅ Confirmar SAÍDA do estudante?')) return;
        const res = await marcarSaida(pedidoId, horaManual || null);
        if (res.success) {
            alert(`✅ Saída registrada às ${res.hora || horaManual || 'agora'}`);
            setModalRegistro(null);
            setHoraManual('');
            carregarDados();
        } else {
            alert(`❌ Erro: ${res.error}`);
        }
    };

    const handleRegistrarRetorno = async (pedidoId) => {
        if (!confirm('✅ Confirmar RETORNO do estudante?')) return;
        const res = await marcarRetorno(pedidoId, horaManual || null);
        if (res.success) {
            let msg = `✅ Retorno registrado às ${res.hora || horaManual || 'agora'}`;
            if (res.atrasado) msg += ` ⚠️ ATRASO de ${res.tempo_atraso} minutos!`;
            alert(msg);
            setModalRegistro(null);
            setHoraManual('');
            carregarDados();
        } else {
            alert(`❌ Erro: ${res.error}`);
        }
    };

    const handleEnviarRelatorio = async () => {
        if (!confirm('📧 Enviar relatório do dia para a DITE?')) return;
        setEnviando(true);
        const res = await enviarRelatorioSaidas(dataSelecionada);
        alert(res.success ? '✅ Relatório enviado com sucesso!' : `❌ ${res.error}`);
        setEnviando(false);
    };

    const handleGerarRelatorio = async () => {
        setGerando(true);
        const res = await getRelatorioCompletoSeguranca(dataSelecionada);
        if (res.success) {
            const texto = res.relatorio.texto_relatorio || JSON.stringify(res.relatorio, null, 2);
            const blob = new Blob([texto], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_seguranca_${dataSelecionada}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            alert('✅ Relatório baixado!');
        } else {
            alert(`❌ Erro: ${res.error}`);
        }
        setGerando(false);
    };

    const marcarLida = async (id) => {
        await marcarNotificacaoLida(id);
        carregarDados();
    };

    // ==================== RENDER ====================
    const getStatusBadge = (estado) => {
        const config = {
            'APROVADO': { label: '⏳ Aguardando Saída', color: '#F59E0B', bg: '#FEF3C7' },
            'EM_ANDAMENTO': { label: '🚶 Em Andamento', color: '#3B82F6', bg: '#DBEAFE' },
            'FINALIZADO': { label: '✅ Finalizado', color: '#10B981', bg: '#D1FAE5' }
        };
        const c = config[estado] || { label: estado, color: '#6B7280', bg: '#F3F4F6' };
        return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>{c.label}</span>;
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .sidebar { position: fixed; left: -280px; z-index: 1000; transition: left 0.3s; }
                    .sidebar.open { left: 0; }
                    .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }
                    .overlay.show { display: block; }
                    .main-content { margin-left: 0 !important; width: 100% !important; }
                    .table-responsive { overflow-x: auto; }
                    table { min-width: 550px; }
                }
            `}</style>

            {/* Sidebar */}
            <div className="sidebar" style={{ width: 260, background: '#FFF', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: 24, borderBottom: '1px solid #E2E8F0' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>🔒 SEGURANÇA</h2>
                    <p style={{ fontSize: 11, color: '#64748B' }}>PORTARIA</p>
                </div>
                <div style={{ padding: 16, margin: 8, background: '#F1F5F9', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#2563EB', display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: 600 }}>
                            {user?.nome?.charAt(0) || user?.username?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.nome || user?.username || 'Segurança'}</div>
                            <div style={{ fontSize: 11, color: '#2563EB' }}>Portaria</div>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ padding: 16, borderTop: '1px solid #E2E8F0' }}>
                    <button onClick={onLogout} style={{ width: '100%', padding: 10, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>🚪 Sair</button>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <header style={{ background: '#FFF', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Controle de Portaria</h1>
                        <p style={{ fontSize: 11, color: '#64748B' }}>{horaAtual}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', padding: '6px 12px', borderRadius: 8 }}>
                            <span>📅</span>
                            <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none' }} />
                        </div>
                        <button onClick={() => setShowNotif(!showNotif)} style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFF', cursor: 'pointer' }}>
                            🔔
                            {notifNaoLidas > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#EF4444', color: '#FFF', borderRadius: '50%', fontSize: 9, display: 'grid', placeItems: 'center' }}>{notifNaoLidas}</span>}
                        </button>
                    </div>
                </header>

                {/* Notificações Dropdown */}
                {showNotif && (
                    <div style={{ position: 'absolute', top: 70, right: 24, width: 320, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 400, overflow: 'auto' }}>
                        <div style={{ padding: 12, borderBottom: '1px solid #E2E8F0', fontWeight: 600 }}>Notificações</div>
                        {notificacoes.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#64748B' }}>Nenhuma notificação</div> :
                            notificacoes.map(n => (
                                <div key={n.id} onClick={() => marcarLida(n.id)} style={{ padding: 12, borderBottom: '1px solid #E2E8F0', cursor: 'pointer', background: n.lida ? 'transparent' : '#EFF6FF' }}>
                                    <div style={{ fontSize: 12 }}>{n.mensagem}</div>
                                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>{n.data}</div>
                                </div>
                            ))
                        }
                    </div>
                )}

                {/* Conteúdo */}
                <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                    {/* Botões de ação */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <button onClick={handleEnviarRelatorio} disabled={enviando} style={{ padding: '10px 16px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>📧 Enviar Relatório para DITE</button>
                        <button onClick={handleGerarRelatorio} disabled={gerando} style={{ padding: '10px 16px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>📄 Baixar Relatório Completo</button>
                    </div>

                    {/* Tabela de saídas */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                            <p>Carregando...</p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#DC2626' }}>⚠️ {error}</div>
                    ) : saidas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60, background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                            <span style={{ fontSize: 48, opacity: 0.5 }}>📭</span>
                            <p style={{ marginTop: 12, color: '#64748B' }}>Nenhum estudante autorizado nesta data</p>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>ESTUDANTE</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>CURSO</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>SAÍDA PREVISTA</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>RETORNO PREVISTO</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>STATUS</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600 }}>AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saidas.map(s => {
                                        const podeSaida = s.estado === 'APROVADO';
                                        const podeRetorno = s.estado === 'EM_ANDAMENTO';
                                        return (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ fontWeight: 600 }}>{s.estudante_nome}</div>
                                                    <div style={{ fontSize: 11, color: '#64748B' }}>ID: #{s.id}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div>{s.estudante_curso || '-'}</div>
                                                    <div style={{ fontSize: 11, color: '#64748B' }}>{s.estudante_classe || '-'}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>{s.hora_saida_prevista || s.data_saida_prevista || '-'}</td>
                                                <td style={{ padding: '14px 16px' }}>{s.hora_volta_prevista || s.data_volta_prevista || '-'}</td>
                                                <td style={{ padding: '14px 16px' }}>{getStatusBadge(s.estado)}</td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                    {podeSaida && (
                                                        <button onClick={() => setModalRegistro({ tipo: 'saida', id: s.id, nome: s.estudante_nome })} style={{ padding: '6px 12px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✅ Registrar Saída</button>
                                                    )}
                                                    {podeRetorno && (
                                                        <button onClick={() => setModalRegistro({ tipo: 'retorno', id: s.id, nome: s.estudante_nome })} style={{ padding: '6px 12px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>🔙 Registrar Retorno</button>
                                                    )}
                                                    {!podeSaida && !podeRetorno && <span style={{ fontSize: 11, color: '#64748B' }}>✓ Concluído</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de registro */}
            {modalRegistro && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setModalRegistro(null); setHoraManual(''); }}>
                    <div style={{ background: '#FFF', borderRadius: 16, width: '90%', maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 8 }}>{modalRegistro.tipo === 'saida' ? '✅ Registrar Saída' : '🔙 Registrar Retorno'}</h3>
                        <p style={{ marginBottom: 16, fontSize: 13, color: '#64748B' }}>Estudante: <strong>{modalRegistro.nome}</strong></p>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Horário (opcional):</label>
                            <input type="time" value={horaManual} onChange={e => setHoraManual(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #E2E8F0', borderRadius: 8 }} />
                            <small style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>Deixe em branco para usar o horário atual</small>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => { setModalRegistro(null); setHoraManual(''); }} style={{ flex: 1, padding: 12, background: '#F1F5F9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={() => {
                                if (modalRegistro.tipo === 'saida') handleRegistrarSaida(modalRegistro.id);
                                else handleRegistrarRetorno(modalRegistro.id);
                            }} style={{ flex: 1, padding: 12, background: modalRegistro.tipo === 'saida' ? '#10B981' : '#3B82F6', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSeguranca;

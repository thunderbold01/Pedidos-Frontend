import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getSaidasPorData, marcarSaida, marcarRetorno, getNotificacoes, marcarNotificacaoLida } from '../api';

const DashboardSeguranca = ({ user, onLogout }) => {
    const [saidas, setSaidas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataSelecionada, setDataSelecionada] = useState(() => new Date().toISOString().split('T')[0]);
    const [modal, setModal] = useState(null);
    const [horaManual, setHoraManual] = useState('');
    const [notificacoes, setNotificacoes] = useState([]);
    const [notifNaoLidas, setNotifNaoLidas] = useState(0);
    const [showNotif, setShowNotif] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [horaAtual, setHoraAtual] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => setHoraAtual(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const carregar = useCallback(async () => {
        setLoading(true);
        const res = await getSaidasPorData(dataSelecionada);
        if (res.success) setSaidas(res.saidas);
        const notif = await getNotificacoes();
        if (notif.success) {
            setNotificacoes(notif.notificacoes);
            setNotifNaoLidas(notif.nao_lidas);
        }
        setLoading(false);
    }, [dataSelecionada]);

    useEffect(() => {
        carregar();
        const interval = setInterval(carregar, 30000);
        return () => clearInterval(interval);
    }, [carregar]);

    const handleRegistro = async (tipo, id) => {
        if (!confirm(`${tipo === 'saida' ? 'Registrar SAÍDA' : 'Registrar RETORNO'}?`)) return;
        const fn = tipo === 'saida' ? marcarSaida : marcarRetorno;
        const res = await fn(id, horaManual || null);
        if (res.success) {
            alert(`${tipo === 'saida' ? 'Saída' : 'Retorno'} registrado às ${res.hora || horaManual || 'agora'}`);
            if (tipo === 'retorno' && res.atrasado) alert(`⚠️ Atraso de ${res.tempo_atraso} minutos!`);
            setModal(null);
            setHoraManual('');
            carregar();
        } else {
            alert(`Erro: ${res.error}`);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <div style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', padding: 20 }}>
                <h2>🔒 Segurança</h2>
                <hr />
                <button onClick={onLogout} style={{ marginTop: 20 }}>Sair</button>
            </div>
            <div style={{ flex: 1, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Controle de Portaria</h1>
                    <div>{horaAtual}</div>
                </div>
                <div style={{ margin: '20px 0' }}>
                    <label>Data: </label>
                    <input type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} />
                </div>
                {loading && <p>Carregando...</p>}
                {!loading && saidas.length === 0 && <p>Nenhum estudante autorizado nesta data.</p>}
                {!loading && saidas.length > 0 && (
                    <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr><th>Nome</th><th>Curso</th><th>Saída Prevista</th><th>Retorno Previsto</th><th>Status</th><th>Ações</th></tr>
                        </thead>
                        <tbody>
                            {saidas.map(s => (
                                <tr key={s.id}>
                                    <td>{s.estudante_nome}</td>
                                    <td>{s.estudante_curso}</td>
                                    <td>{s.hora_saida_prevista}</td>
                                    <td>{s.hora_volta_prevista}</td>
                                    <td>{s.estado}</td>
                                    <td>
                                        {s.estado === 'APROVADO' && <button onClick={() => setModal({ tipo: 'saida', id: s.id, nome: s.estudante_nome })}>✅ Saída</button>}
                                        {s.estado === 'EM_ANDAMENTO' && <button onClick={() => setModal({ tipo: 'retorno', id: s.id, nome: s.estudante_nome })}>🔙 Retorno</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
                        <h3>{modal.tipo === 'saida' ? 'Registrar Saída' : 'Registrar Retorno'}</h3>
                        <p>Estudante: {modal.nome}</p>
                        <input type="time" value={horaManual} onChange={e => setHoraManual(e.target.value)} placeholder="Opcional" />
                        <br /><br />
                        <button onClick={() => handleRegistro(modal.tipo, modal.id)}>Confirmar</button>
                        <button onClick={() => { setModal(null); setHoraManual(''); }}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSeguranca;

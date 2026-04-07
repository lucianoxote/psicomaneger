'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, aRes, tRes] = await Promise.all([
          fetch('/api/pacientes'),
          fetch('/api/agenda'),
          fetch('/api/tarefas')
        ]);
        const [pData, aData, tData] = await Promise.all([
          pRes.json(),
          aRes.json(),
          tRes.json()
        ]);
        setPacientes(pData);
        setAgendamentos(aData);
        setTarefas(tData);
      } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const sessoesHoje = (agendamentos || []).filter(a => a.data?.includes(todayStr));
  const pendenciasCount = (tarefas || []).filter(t => t.status === 'pendente').length;
  const pacientesRecentes = pacientes?.length ? [...pacientes].reverse().slice(0, 8) : [];
  const proximasSessoes = sessoesHoje.slice(0, 3);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados...</div>;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Olá, Lívia Brito!</h1>
        <p style={{ opacity: 0.65, marginTop: '0.25rem', fontSize: '1rem', fontWeight: '400' }}>Confira seu panorama clínico.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link href="/pacientes" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
            <h3 style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Total de Pacientes</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{pacientes.length}</div>
            <div style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.25rem' }}>Base de dados atualizada</div>
          </div>
        </Link>
        <Link href="/agenda" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
            <h3 style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Sessões Hoje</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{sessoesHoje.length}</div>
            <div style={{ color: 'hsl(var(--primary))', fontSize: '0.75rem', marginTop: '0.25rem' }}>Confira sua agenda</div>
          </div>
        </Link>
        <Link href="/tarefas" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
            <h3 style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Pendências</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{pendenciasCount}</div>
            <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>Tarefas terapêuticas em aberto</div>
          </div>
        </Link>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Pacientes Recentes</h2>
            <Link href="/pacientes" className="btn btn-primary">Gerenciar Pacientes</Link>
          </div>
          <div className="card" style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={{ padding: '1rem' }}>Paciente</th>
                  <th style={{ padding: '1rem' }}>Telefone</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pacientesRecentes.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Nenhum paciente encontrado.</td>
                  </tr>
                ) : (
                  pacientesRecentes.map((p, idx) => (
                    <tr 
                      key={p._id} 
                      onClick={() => router.push(`/pacientes/${p._id}`)}
                      style={{ 
                        borderBottom: idx === pacientesRecentes.length - 1 ? 'none' : '1px solid hsl(var(--border))',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'hsl(var(--secondary)/0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1rem' }}>{p.nome}</td>
                      <td style={{ padding: '1rem' }}>{p.telefone}</td>
                      <td style={{ padding: '1rem' }}><span style={{ color: p.status === 'ativo' ? '#10b981' : 'inherit', opacity: p.status === 'ativo' ? 1 : 0.5 }}>● {p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Próximas Sessões</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {proximasSessoes.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Nenhuma sessão para hoje.</div>
            ) : (
              proximasSessoes.map((a, idx) => (
                <Link key={a._id} href={`/pacientes/${a.pacienteId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div 
                    className="card" 
                    style={{ 
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600' }}>{a.data.split('T')[1]?.slice(0, 5) || a.data} - {a.paciente}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{a.tipo}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

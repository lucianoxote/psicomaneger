'use client';
import { useState, useEffect } from 'react';
import PatientModal from '@/components/PatientModal';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSearch, setTargetSearch] = useState('');
  const { data: session } = useSession();

  const PLAN_LIMITS: Record<string, number> = {
    'Gratuito': Infinity,
    'Trial': 15,
    'Plus': 30,
    'Pro': Infinity
  };

  const userPlan = (session?.user as any)?.plan || 'Trial';
  const limit = PLAN_LIMITS[userPlan] || 15;
  const isLimitReached = session?.user?.email !== 'lucianoxote@hotmail.com' && 
                        userPlan !== 'Gratuito' && 
                        userPlan !== 'Pro' && 
                        (pacientes?.length || 0) >= limit;

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pacientes');
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPacientes = (pacientes || []).filter((p: any) => 
    p.nome?.toLowerCase().includes(targetSearch.toLowerCase()) || 
    p.cpf?.includes(targetSearch)
  );

  const handleSavePatient = async (patientData: any) => {
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchPacientes();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar paciente');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <div className="pacientes-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Gestão de Pacientes</h1>
          <p style={{ opacity: 0.6, fontSize: '1rem' }}>Sua base de pacientes com prontuários e documentos integrados.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '8px', 
            backgroundColor: isLimitReached ? 'hsla(var(--destructive), 0.1)' : 'hsl(var(--secondary))',
            color: isLimitReached ? 'hsl(var(--destructive))' : 'inherit',
            border: `1px solid ${isLimitReached ? 'hsla(var(--destructive), 0.2)' : 'hsl(var(--border))'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ opacity: 0.6 }}>{isLimitReached ? '⚠️ Limite:' : '📊 Pacientes:'}</span>
            <span>{(pacientes || []).length} / {limit === Infinity ? '∞' : limit}</span>
          </div>
          <button 
            className={`btn ${isLimitReached ? 'btn-ghost' : 'btn-primary'}`} 
            style={{ 
              padding: '0.75rem 1.5rem', 
              boxShadow: isLimitReached ? 'none' : '0 4px 14px 0 hsla(var(--primary), 0.39)',
              opacity: isLimitReached ? 0.5 : 1,
              cursor: isLimitReached ? 'not-allowed' : 'pointer'
            }}
            onClick={() => !isLimitReached && setIsModalOpen(true)}
            title={isLimitReached ? "Limite do plano atingido" : "Adicionar novo paciente"}
          >
            {isLimitReached ? 'Limite Atingido' : '+ Novo Paciente'}
          </button>
        </div>
      </header>

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--secondary))', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..." 
              className="form-input"
              style={{ paddingLeft: '2.5rem', backgroundColor: 'hsl(var(--background))' }}
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
            />
          </div>
          <button className="btn" style={{ border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}>Filtros</button>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontWeight: '500', opacity: 0.5 }}>Carregando base de pacientes...</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--secondary))' }}>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Paciente</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Contato</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPacientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center' }}>
                      <div style={{ opacity: 0.4, marginBottom: '1rem', fontSize: '2rem' }}>👥</div>
                      <div style={{ opacity: 0.5 }}>{targetSearch ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}</div>
                    </td>
                  </tr>
                ) : (
                  filteredPacientes.map((p: any) => (
                    <tr key={p._id || Math.random()} style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>{p.nome || 'Nome não informado'}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{p.cpf || 'Documento não informado'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                        <div>{p.telefone || 'Telefone não informado'}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{p.email || 'E-mail não informado'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className={`badge ${p.status === 'ativo' ? 'badge-success' : 'badge-outline'}`}>
                          {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <Link href={`/pacientes/${p._id}`} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', border: 'none' }}>
                          📂 Abrir Prontuário
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePatient} 
      />

      <style jsx>{`
        .table-row-hover:hover {
          background-color: hsla(var(--primary), 0.02);
        }
      `}</style>
    </div>
  );
}

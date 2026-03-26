'use client';
import { useState, useEffect } from 'react';

export default function AgendaPage() {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgendamentoId, setEditingAgendamentoId] = useState<string | null>(null);
  const [newAgendamento, setNewAgendamento] = useState({ paciente: '', data: new Date().toISOString().split('T')[0], hora: '08:00', tipo: 'Psi', pacienteId: '' });
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  useEffect(() => {
     fetchData();
  }, []);

  const fetchData = async () => {
    const [agRes, pacRes] = await Promise.all([
      fetch('/api/agenda'),
      fetch('/api/pacientes')
    ]);
    const [agData, pacData] = await Promise.all([
      agRes.json(),
      pacRes.json()
    ]);
    setAgendamentos(agData);
    setPacientes(pacData);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAgendamentoId(null);
    setNewAgendamento({ paciente: '', data: new Date().toISOString().split('T')[0], hora: '08:00', tipo: 'Psi', pacienteId: '' });
  };

  const handleCreateAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingAgendamentoId;
      const url = '/api/agenda';
      const method = isEditing ? 'PATCH' : 'POST';
      const bodyData = isEditing ? {
        id: editingAgendamentoId,
        ...newAgendamento,
        data: `${newAgendamento.data}T${newAgendamento.hora}:00`
      } : {
        ...newAgendamento,
        data: `${newAgendamento.data}T${newAgendamento.hora}:00`
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        closeModal();
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditAgendamento = (a: any) => {
    const d = new Date(a.data);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');

    setNewAgendamento({
      paciente: a.paciente,
      pacienteId: a.pacienteId,
      data: `${yyyy}-${mm}-${dd}`,
      hora: `${hh}:${min}`,
      tipo: a.tipo
    });
    setEditingAgendamentoId(a._id);
    setIsModalOpen(true);
  };

  const handleDeleteAgendamento = async () => {
    if (!editingAgendamentoId) return;
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
       const res = await fetch(`/api/agenda?id=${editingAgendamentoId}`, { method: 'DELETE' });
       if (res.ok) {
          closeModal();
          fetchData();
       }
    } catch (e) {
       console.error(e);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/agenda', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setAgendamentos(agendamentos.map((a: any) => a._id === id ? { ...a, status: newStatus } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="agenda-container">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Agenda de Atendimentos</h1>
          <p style={{ opacity: 0.6 }}>Gerencie seus horários e confirme presenças.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ border: '1px solid hsl(var(--border))' }}>Hoje</button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Agendar Sessão</button>
        </div>
      </header>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
             <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingAgendamentoId ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
               <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
             </header>
             <form onSubmit={handleCreateAgendamento} style={{ padding: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Paciente</label>
                  <select className="form-input" required value={newAgendamento.pacienteId} onChange={e => {
                    const p = pacientes.find(p => p._id === e.target.value);
                    setNewAgendamento({...newAgendamento, pacienteId: e.target.value, paciente: p ? p.nome : ''});
                  }}>
                    <option value="">Selecione um paciente...</option>
                    {pacientes.map(p => (
                      <option key={p._id} value={p._id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Data</label>
                    <input type="date" className="form-input" required value={newAgendamento.data} onChange={e => setNewAgendamento({...newAgendamento, data: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário</label>
                    <input type="time" className="form-input" required value={newAgendamento.hora} onChange={e => setNewAgendamento({...newAgendamento, hora: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Atendimento</label>
                  <select className="form-input" value={newAgendamento.tipo} onChange={e => setNewAgendamento({...newAgendamento, tipo: e.target.value})}>
                    <option value="Psi">Psicoterapia</option>
                    <option value="Neuro">Neuropsicologia</option>
                  </select>
                </div>
                <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  {editingAgendamentoId && (
                     <button type="button" className="btn" onClick={handleDeleteAgendamento} style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--destructive))', marginRight: 'auto' }}>Excluir</button>
                  )}
                  <button type="button" className="btn" onClick={closeModal} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingAgendamentoId ? 'Salvar' : 'Agendar'}</button>
                </footer>
             </form>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ padding: '1rem', borderRight: '1px solid hsl(var(--border))' }}></div>
          {days.map(day => (
            <div key={day} style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>{day}</div>
          ))}
        </div>

        <div style={{ height: '600px', overflowY: 'auto' }}>
          {times.map(time => (
            <div key={time} style={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', borderRight: '1px solid hsl(var(--border))', opacity: 0.4, fontWeight: '500' }}>{time}</div>
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{ borderRight: i < 6 ? '1px solid hsl(var(--border))' : 'none', minHeight: '5rem', padding: '0.4rem', position: 'relative' }}>
                  {agendamentos.filter((a: any) => {
                    const aDate = new Date(a.data);
                    const now = new Date();
                    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (aDate < sevenDaysAgo) return false; // auto-hide after 7 days
                    const h = aDate.getHours().toString().padStart(2, '0');
                    const m = aDate.getMinutes().toString().padStart(2, '0');
                    const timeStr = `${h}:${m}`;
                    return aDate.getDay() === i && timeStr === time;
                  }).map((a: any) => {
                    const isPast = new Date(a.data) < new Date();
                    return (
                      <div key={a._id} className="card" onClick={() => handleEditAgendamento(a)} style={{
                        padding: '0.6rem',
                        backgroundColor: isPast
                          ? 'hsl(var(--secondary))'
                          : (a.tipo === 'Neuro' ? 'hsl(var(--success))' : 'hsl(var(--primary))'),
                        color: isPast ? 'hsl(var(--foreground))' : (a.tipo === 'Neuro' ? '#fff' : 'hsl(var(--primary-foreground))'),
                        fontSize: '0.75rem',
                        border: isPast ? '1px solid hsl(var(--border))' : 'none',
                        borderRadius: '0.5rem',
                        boxShadow: isPast ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        opacity: isPast ? 0.7 : 1,
                      }}>
                        <div style={{ fontWeight: '700', textDecoration: isPast ? 'line-through' : 'none', opacity: isPast ? 0.8 : 1 }}>{a.paciente}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', opacity: 0.9 }}>
                          <span>{a.tipo}</span>
                          {isPast
                            ? <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#10b981' }}>✓ Realizado</span>
                            : <span style={{ fontSize: '0.65rem' }}>{a.status === 'confirmado' ? '✓' : '?'}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';

export default function TarefasPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ patient: '', patientId: '', task: '', date: new Date().toISOString().split('T')[0] });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTaskId(null);
    setNewTask({ patient: '', patientId: '', task: '', date: new Date().toISOString().split('T')[0] });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/tarefas'),
        fetch('/api/pacientes')
      ]);
      const [tData, pData] = await Promise.all([
        tRes.json(),
        pRes.json()
      ]);
      setTasks(tData);
      setPacientes(pData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingTaskId;
      const url = '/api/tarefas';
      const method = isEditing ? 'PATCH' : 'POST';
      const bodyData = isEditing ? { ...newTask, id: editingTaskId } : newTask;

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

  const handleEditTask = (task: any) => {
    setNewTask({
        patient: task.patient || '',
        patientId: task.patientId || '',
        task: task.task || '',
        date: task.date ? task.date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setEditingTaskId(task._id);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return;
    try {
      const res = await fetch(`/api/tarefas?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="tarefas-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .task-row {
          transition: all 0.2s ease;
        }
        .task-row:hover {
          background-color: hsl(var(--primary)/0.04) !important;
          transform: scale(1.002);
        }
        .dark .task-row:hover {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
        .modal-overlay {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex; align-items: center; justify-content: center;
          z-index: 50;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          width: 100%; maxWidth: 500px;
          overflow: hidden;
        }
      `}</style>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'hsl(var(--foreground))' }}>{editingTaskId ? 'Editar Tarefa' : 'Atribuir Nova Tarefa'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>&times;</button>
            </header>
            <form style={{ padding: '2rem' }} onSubmit={handleSaveTask}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>PACIENTE</label>
                <select 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                  required value={newTask.patientId} onChange={e => {
                    const p = pacientes.find(p => p._id === e.target.value);
                    setNewTask({...newTask, patientId: e.target.value, patient: p ? p.nome : ''});
                  }}
                >
                  <option value="">Selecione um paciente...</option>
                  {pacientes.map(p => (
                    <option key={p._id} value={p._id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>TAREFA / EXERCÍCIO</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                  placeholder="Ex: Diário de Pensamentos..." 
                  value={newTask.task} 
                  onChange={e => setNewTask({...newTask, task: e.target.value})} 
                  required 
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>DATA LIMITE</label>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                  value={newTask.date} 
                  onChange={e => setNewTask({...newTask, date: e.target.value})} 
                  required 
                />
              </div>
              <footer style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" onClick={closeModal} style={{ flex: 1, border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingTaskId ? 'Salvar' : 'Atribuir'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <header className="animate-in" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Tarefas Terapêuticas</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>Acompanhe os exercícios propostos para os pacientes realizarem entre as sessões.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', boxShadow: '0 4px 12px hsl(var(--primary)/0.25)' }} onClick={() => setIsModalOpen(true)}>+ Nova Tarefa</button>
      </header>

      <div className="card animate-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))', borderRadius: '20px', animationDelay: '0.1s' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid hsl(var(--border))', backgroundColor: 'hsl(var(--secondary)/0.3)' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PACIENTE</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TAREFA</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DATA LIMITE</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>STATUS</th>
              <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td colSpan={5} style={{ padding: '1.5rem' }}>
                    <div style={{ height: '20px', background: 'hsl(var(--secondary))', borderRadius: '4px', animation: 'pulse 1.5s infinite', width: '100%' }} />
                  </td>
                </tr>
              ))
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                  Nenhuma tarefa atribuída ainda.
                </td>
              </tr>
            ) : (
              tasks.map((t, idx) => (
                <tr key={t._id} className="task-row" style={{ borderBottom: idx === tasks.length - 1 ? 'none' : '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: 'hsl(var(--foreground))' }}>{t.patient}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'hsl(var(--foreground))' }}>{t.task}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>{t.date ? new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <button 
                      className={`badge ${t.status === 'concluído' ? 'badge-success' : 'badge-warning'}`}
                      style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700' }}
                      onClick={async () => {
                        const newStatus = t.status === 'pendente' ? 'concluído' : 'pendente';
                        await fetch('/api/tarefas', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: t._id, status: newStatus })
                        });
                        fetchData();
                      }}
                    >
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </button>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn" style={{ padding: '0.4rem', border: '1px solid hsl(var(--border))', borderRadius: '8px', background: 'hsl(var(--card))' }} onClick={() => handleEditTask(t)}>✏️</button>
                      <button className="btn" style={{ padding: '0.4rem', border: '1px solid hsl(var(--border))', borderRadius: '8px', background: 'hsl(var(--card))', color: 'hsl(var(--destructive))' }} onClick={() => handleDeleteTask(t._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="animate-in" style={{ marginTop: '3rem', animationDelay: '0.3s' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'hsl(var(--foreground))' }}>Reabilitação Neuropsicológica</h2>
        <div className="card" style={{ padding: '3rem', textAlign: 'center', border: '1px dashed hsl(var(--border))', background: 'hsl(var(--secondary)/0.2)' }}>
           <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>🧩</div>
           <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>Módulo de acompanhamento de reabilitação cognitiva em breve.</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

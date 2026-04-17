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
    <div className="tarefas-container">
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingTaskId ? 'Editar Tarefa' : 'Atribuir Nova Tarefa'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </header>
            <form style={{ padding: '1.5rem' }} onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Paciente</label>
                <select className="form-input" required value={newTask.patientId} onChange={e => {
                  const p = pacientes.find(p => p._id === e.target.value);
                  setNewTask({...newTask, patientId: e.target.value, patient: p ? p.nome : ''});
                }}>
                  <option value="">Selecione um paciente...</option>
                  {pacientes.map(p => (
                    <option key={p._id} value={p._id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tarefa / Exercício Terapêutico</label>
                <input type="text" className="form-input" placeholder="Ex: Diário de Pensamentos..." value={newTask.task} onChange={e => setNewTask({...newTask, task: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Data Limite</label>
                <input type="date" className="form-input" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})} required />
              </div>
              <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={closeModal} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingTaskId ? 'Salvar Alterações' : 'Atribuir Tarefa'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Tarefas Terapêuticas</h1>
          <p style={{ opacity: 0.6 }}>Acompanhe os exercícios propostos para os pacientes realizarem entre as sessões.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }} onClick={() => setIsModalOpen(true)}>+ Atribuir Nova Tarefa</button>
      </header>

      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--secondary))' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', opacity: 0.5 }}>PACIENTE</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', opacity: 0.5 }}>TAREFA / EXERCÍCIO</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', opacity: 0.5 }}>DATA LIMITE</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', opacity: 0.5 }}>STATUS</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', opacity: 0.5 }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Carregando tarefas...</td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Nenhuma tarefa atribuída.</td>
              </tr>
            ) : (
              tasks.map((t, idx) => (
                <tr key={t._id} style={{ borderBottom: idx === tasks.length - 1 ? 'none' : '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{t.patient}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{t.task}</td>
                  <td style={{ padding: '1rem 1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>{t.date ? new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <button 
                      className={`badge ${t.status === 'concluído' ? 'badge-success' : 'badge-warning'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
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
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))' }} onClick={() => handleEditTask(t)}>✏️</button>
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))', color: 'hsl(var(--destructive))' }} onClick={() => handleDeleteTask(t._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Reabilitação Neuropsicológica</h2>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
           <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧩</div>
           <p style={{ opacity: 0.6 }}>Módulo de acompanhamento de reabilitação cognitiva em breve.</p>
        </div>
      </div>
    </div>
  );
}

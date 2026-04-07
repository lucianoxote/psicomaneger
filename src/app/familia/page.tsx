'use client';
import { useState, useEffect } from 'react';

export default function FamiliaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLog, setNewLog] = useState({ 
    pacienteId: '', 
    pacienteNome: '', 
    responsavel: '', 
    telefone: '',
    conteudo: '', 
    data: new Date().toISOString().split('T')[0] 
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [lRes, pRes] = await Promise.all([
        fetch('/api/familia'),
        fetch('/api/pacientes')
      ]);
      const [lData, pData] = await Promise.all([
        lRes.json(),
        pRes.json()
      ]);
      setLogs(lData);
      setPacientes(pData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setNewLog({ pacienteId: '', pacienteNome: '', responsavel: '', telefone: '', conteudo: '', data: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: any) => {
    setEditingId(log._id);
    setNewLog({ 
      pacienteId: log.pacienteId, 
      pacienteNome: log.pacienteNome, 
      responsavel: log.responsavel, 
      telefone: log.telefone || '',
      conteudo: log.conteudo, 
      data: log.data 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = pacientes.find(p => p._id === newLog.pacienteId);
    const payload = { ...newLog, pacienteNome: patient?.nome || '' };

    try {
      const url = editingId ? `/api/familia` : '/api/familia';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro de comunicação?')) return;
    try {
      const res = await fetch(`/api/familia?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando comunicações...</div>;

  return (
    <div className="familia-container">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Comunicação com Familiares</h1>
          <p style={{ opacity: 0.6 }}>Registre e acompanhe o contato com os responsáveis e familiares dos pacientes.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenNew}>+ Novo Registro</button>
      </header>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingId ? 'Editar Registro' : 'Novo Registro de Comunicação'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </header>
            <form style={{ padding: '1.5rem' }} onSubmit={handleSave}>
               <div className="form-group">
                  <label className="form-label">Paciente</label>
                  <select className="form-input" value={newLog.pacienteId} onChange={e => setNewLog({...newLog, pacienteId: e.target.value})} required>
                    <option value="">Selecione o paciente...</option>
                    {pacientes.map(p => (
                      <option key={p._id} value={p._id}>{p.nome}</option>
                    ))}
                  </select>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Responsável / Familiar</label>
                    <input type="text" className="form-input" placeholder="Ex: Mãe (Maria Silva)" value={newLog.responsavel} onChange={e => setNewLog({...newLog, responsavel: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone do Responsável</label>
                    <input type="tel" className="form-input" placeholder="(71) 98833-9502" value={newLog.telefone} onChange={e => setNewLog({...newLog, telefone: e.target.value})} />
                  </div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Data do Contato</label>
                    <input type="date" className="form-input" value={newLog.data} onChange={e => setNewLog({...newLog, data: e.target.value})} required />
                  </div>
               </div>
               <div className="form-group">
                  <label className="form-label">Resumo da Conversa</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '120px', resize: 'vertical' }} 
                    placeholder="Descreva aqui os pontos principais do contato..."
                    value={newLog.conteudo}
                    onChange={e => setNewLog({...newLog, conteudo: e.target.value})}
                    required
                  ></textarea>
               </div>
               <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Salvar Alterações' : 'Salvar Registro'}</button>
               </footer>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {logs.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            Nenhum registro de comunicação encontrado. Clique em "+ Novo Registro" para iniciar.
          </div>
        ) : (
          logs.map((l: any) => (
            <div key={l._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '1.125rem', color: 'hsl(var(--primary))' }}>{l.pacienteNome}</span>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.2rem' }}>Responsável: {l.responsavel}</div>
                  {l.telefone && <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.1rem' }}>📞 {l.telefone}</div>}
                </div>
                <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{l.data?.includes('T') ? new Date(l.data).toLocaleDateString('pt-BR') : l.data?.split('-').reverse().join('/')}</span>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'hsl(var(--secondary))', borderRadius: 'var(--radius)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {l.conteudo}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                 <button className="btn" onClick={() => handleOpenEdit(l)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', border: '1px solid hsl(var(--border))' }}>Editar</button>
                 <button className="btn" onClick={() => handleDelete(l._id)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', border: '1px solid hsl(var(--border))', color: '#ef4444' }}>Excluir</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

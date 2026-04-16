'use client';
import { useState, useEffect, useMemo } from 'react';

export default function AgendaPage() {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);

  // Função para parsear data ignorando fuso horário (preservando o que foi digitado)
  const getSafeDate = (dataString: string | Date) => {
    if (!dataString) return new Date();
    if (dataString instanceof Date) return dataString;
    
    // Se for uma string de data (ex: 2026-04-02T10:30:00)
    const iso = dataString.toString();
    
    // Se a string já vier com Z ou offset, o browser vai converter.
    // Para manter literal o que foi salvo, vamos decompor se não tiver 'Z'
    if (!iso.includes('Z') && iso.includes('T')) {
      const [datePart, timePart] = iso.split('T');
      const [y, m, d] = datePart.split('-').map(Number);
      const [hh, mm] = timePart.split(':').map(Number);
      return new Date(y, m - 1, d, hh, mm);
    }
    
    return new Date(iso);
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgendamentoId, setEditingAgendamentoId] = useState<string | null>(null);
  const [newAgendamento, setNewAgendamento] = useState({ paciente: '', data: new Date().toISOString().split('T')[0], hora: '08:00', tipo: 'Psi', pacienteId: '', status: 'agendado' });

  const parsedAgendamentos = useMemo(() => agendamentos.map(a => ({
    ...a,
    dateObj: getSafeDate(a.data)
  })), [agendamentos]);
  
  // Funções de data para gerenciar a semana atual
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day; // ajusta para domingo (0)
    return new Date(date.setDate(diff));
  };
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  
  const moveDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const getDayDate = (dayIndex: number) => {
    if (viewMode === 'day') return new Date(currentDate);
    const d = new Date(getStartOfWeek(currentDate));
    d.setDate(d.getDate() + dayIndex);
    return d;
  };

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
    setAgendamentos(Array.isArray(agData) ? agData : []);
    setPacientes(Array.isArray(pacData) ? pacData : []);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAgendamentoId(null);
    setNewAgendamento({ paciente: '', data: new Date().toISOString().split('T')[0], hora: '08:00', tipo: 'Psi', pacienteId: '', status: 'agendado' });
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
    const d = getSafeDate(a.data);
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
      tipo: a.tipo,
      status: a.status || 'agendado'
    } as any);
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
          <h1 style={{ fontSize: '2rem', fontWeight: '700', textTransform: 'capitalize' }}>
            Agenda {viewMode === 'month' && `- ${currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`}
            {viewMode === 'week' && `- Semana de ${getStartOfWeek(currentDate).toLocaleDateString('pt-BR')}`}
            {viewMode === 'day' && `- ${currentDate.toLocaleDateString('pt-BR')}`}
          </h1>
          <p style={{ opacity: 0.6 }}>Gerencie seus horários e confirme presenças.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <button className="btn" style={{ borderRadius: 0, padding: '0.5rem 1rem', backgroundColor: viewMode === 'month' ? 'hsl(var(--primary))' : 'transparent', color: viewMode === 'month' ? 'hsl(var(--primary-foreground))' : 'inherit', borderRight: '1px solid hsl(var(--border))' }} onClick={() => setViewMode('month')}>Mês</button>
            <button className="btn" style={{ borderRadius: 0, padding: '0.5rem 1rem', backgroundColor: viewMode === 'week' ? 'hsl(var(--primary))' : 'transparent', color: viewMode === 'week' ? 'hsl(var(--primary-foreground))' : 'inherit' }} onClick={() => setViewMode('week')}>Semana</button>
          </div>
          <div style={{ display: 'flex', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
             <button className="btn" style={{ borderRadius: 0, padding: '0.5rem 0.75rem' }} onClick={() => moveDate(-1)}>←</button>
             <button className="btn" style={{ borderRadius: 0, borderLeft: '1px solid hsl(var(--border))', borderRight: '1px solid hsl(var(--border))' }} onClick={() => { setCurrentDate(new Date()); setViewMode('day'); }}>Hoje</button>
             <button className="btn" style={{ borderRadius: 0, padding: '0.5rem 0.75rem' }} onClick={() => moveDate(1)}>→</button>
          </div>
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
                <div className="form-grid">
                   <div className="form-group">
                     <label className="form-label">Tipo de Atendimento</label>
                     <select className="form-input" value={newAgendamento.tipo} onChange={e => setNewAgendamento({...newAgendamento, tipo: e.target.value})}>
                       <option value="Psi">Psicoterapia</option>
                       <option value="Neuro">Neuropsicologia</option>
                     </select>
                   </div>
                   {editingAgendamentoId && (
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-input" value={(newAgendamento as any).status || 'agendado'} onChange={e => setNewAgendamento({...newAgendamento, status: e.target.value})}>
                          <option value="agendado">Agendado</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="realizado">Realizado</option>
                          <option value="cancelado">Cancelado</option>
                          <option value="falta">Faltou</option>
                        </select>
                      </div>
                   )}
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
        {viewMode === 'month' ? (
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))' }}>
                {days.map(day => (
                  <div key={day} style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', opacity: 0.7 }}>
                    {day}
                  </div>
                ))}
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(100px, auto)' }}>
               {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const daysInPrevMonth = new Date(year, month, 0).getDate();
                  
                  const monthDays = [];
                  for (let i = firstDay - 1; i >= 0; i--) {
                    monthDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
                  }
                  for (let i = 1; i <= daysInMonth; i++) {
                    monthDays.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
                  }
                  const remaining = 42 - monthDays.length;
                  for (let i = 1; i <= remaining; i++) {
                    monthDays.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
                  }
                  
                  return monthDays.map((d, index) => {
                     const isToday = d.date.toDateString() === new Date().toDateString();
                     const dayAgends = parsedAgendamentos.filter(a => {
                        const aDate = a.dateObj;
                        return aDate.getDate() === d.date.getDate() && aDate.getMonth() === d.date.getMonth() && aDate.getFullYear() === d.date.getFullYear();
                     });
                    return (
                        <div 
                          key={index} 
                          onClick={() => {
                            setCurrentDate(d.date);
                            setViewMode('day');
                          }}
                          style={{ 
                            borderRight: (index + 1) % 7 !== 0 ? '1px solid hsl(var(--border))' : 'none', 
                            borderBottom: index < 35 || remaining > 0 ? '1px solid hsl(var(--border))' : 'none', 
                            padding: '0.5rem', 
                            minHeight: '120px', 
                            backgroundColor: d.isCurrentMonth ? 'transparent' : 'hsl(var(--secondary)/0.5)', 
                            minWidth: 0, 
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => {
                            if (d.isCurrentMonth) e.currentTarget.style.backgroundColor = 'hsl(var(--secondary)/0.3)';
                          }}
                          onMouseLeave={e => {
                            if (d.isCurrentMonth) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                           <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
                             <span style={{ display: 'inline-flex', width: '28px', height: '28px', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: isToday ? 'hsl(var(--primary))' : 'transparent', color: isToday ? 'hsl(var(--primary-foreground))' : (d.isCurrentMonth ? 'inherit' : 'gray'), fontSize: '0.875rem', fontWeight: isToday ? 'bold' : 'normal' }}>
                               {d.day}
                             </span>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {dayAgends.map(a => {
                                const aDate = getSafeDate(a.data);
                                const timeStr = `${aDate.getHours().toString().padStart(2, '0')}:${aDate.getMinutes().toString().padStart(2, '0')}`;
                                const isRealizado = a.status === 'realizado' || a.status === 'cancelado' || a.status === 'falta';
                                return (
                                  <div 
                                    key={a._id} 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditAgendamento(a);
                                    }} 
                                    style={{ 
                                      fontSize: '0.7rem', 
                                      padding: '0.3rem 0.5rem', 
                                      backgroundColor: isRealizado ? 'hsl(var(--secondary))' : (a.tipo === 'Neuro' ? 'hsl(var(--success))' : 'hsl(var(--primary))'), 
                                      color: isRealizado ? 'hsl(var(--foreground))' : (a.tipo === 'Neuro' ? '#fff' : 'hsl(var(--primary-foreground))'), 
                                      borderRadius: '0.25rem', 
                                      cursor: 'pointer', 
                                      whiteSpace: 'nowrap', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis',
                                      opacity: isRealizado ? 0.7 : 1,
                                      border: isRealizado ? '1px solid hsl(var(--border))' : 'none'
                                    }}
                                  >
                                     <span style={{ textDecoration: isRealizado ? 'line-through' : 'none', fontWeight: isRealizado ? 'normal' : '500' }}>{timeStr} - {a.paciente}</span>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                     )
                  });
               })()}
             </div>
           </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'week' ? '100px repeat(7, 1fr)' : '100px 1fr', backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ padding: '1rem', borderRight: '1px solid hsl(var(--border))' }}></div>
          {(viewMode === 'week' ? days : [days[currentDate.getDay()]]).map((day, ix) => {
            const dateObj = viewMode === 'week' ? getDayDate(ix) : currentDate;
            const isToday = dateObj.toDateString() === new Date().toDateString();
            return (
              <div key={day} style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                <div style={{ opacity: isToday ? 1 : 0.7, color: isToday ? 'hsl(var(--primary))' : 'inherit' }}>{day}</div>
                <div style={{ fontSize: '1.25rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                   <div style={{ width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', backgroundColor: isToday ? 'hsl(var(--primary))' : 'transparent', color: isToday ? 'hsl(var(--primary-foreground))' : 'inherit' }}>
                     {dateObj.getDate().toString().padStart(2, '0')}
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: '600px', overflowY: 'auto' }}>
          {times.map(time => (
            <div key={time} style={{ display: 'grid', gridTemplateColumns: viewMode === 'week' ? '100px repeat(7, 1fr)' : '100px 1fr', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', borderRight: '1px solid hsl(var(--border))', opacity: 0.4, fontWeight: '500' }}>{time}</div>
              {[...Array(viewMode === 'week' ? 7 : 1)].map((_, i) => (
                <div key={i} style={{ borderRight: (viewMode === 'week' && i < 6) ? '1px solid hsl(var(--border))' : 'none', minHeight: '5rem', padding: '0.4rem', position: 'relative' }}>
                  {parsedAgendamentos.filter((a: any) => {
                    const aDate = a.dateObj;
                    const colDate = getDayDate(i);
                    // Checa se é exatamente o mesmo dia, mês e ano da coluna e a mesma hora
                    if (aDate.getDate() !== colDate.getDate() || 
                        aDate.getMonth() !== colDate.getMonth() || 
                        aDate.getFullYear() !== colDate.getFullYear()) {
                       return false;
                    }

                    const h = aDate.getHours().toString().padStart(2, '0');
                    const slotHour = time.split(':')[0];
                    return h === slotHour;
                  }).map((a: any) => {
                    const aDate = a.dateObj;
                    const timeStr = `${aDate.getHours().toString().padStart(2, '0')}:${aDate.getMinutes().toString().padStart(2, '0')}`;
                    const isRealizado = a.status === 'realizado' || a.status === 'cancelado' || a.status === 'falta';
                    return (
                      <div key={a._id} className="card" onClick={() => handleEditAgendamento(a)} style={{
                        padding: '0.6rem',
                        backgroundColor: isRealizado
                          ? 'hsl(var(--secondary))'
                          : (a.tipo === 'Neuro' ? 'hsl(var(--success))' : 'hsl(var(--primary))'),
                        color: isRealizado ? 'hsl(var(--foreground))' : (a.tipo === 'Neuro' ? '#fff' : 'hsl(var(--primary-foreground))'),
                        fontSize: '0.75rem',
                        border: isRealizado ? '1px solid hsl(var(--border))' : 'none',
                        borderRadius: '0.5rem',
                        boxShadow: isRealizado ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        opacity: isRealizado ? 0.7 : 1,
                      }}>
                        <div style={{ fontWeight: '700', textDecoration: isRealizado ? 'line-through' : 'none', opacity: isRealizado ? 0.8 : 1 }}>
                          <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{timeStr}</span> - {a.paciente}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', opacity: 0.9 }}>
                          <span>{a.tipo}</span>
                          {isRealizado
                            ? <span style={{ fontSize: '0.65rem', fontWeight: '700', color: a.status === 'realizado' ? '#10b981' : 'inherit' }}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
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
        </>
        )}
      </div>
    </div>
  );
}

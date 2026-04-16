'use client';
import React, { useState } from 'react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: any) => void;
  initialData?: any;
}

export default function PatientModal({ isOpen, onClose, onSave, initialData }: PatientModalProps) {
  const [formData, setFormData] = useState(() => ({
    nome: initialData?.nome || '',
    cpf: initialData?.cpf || '',
    dataNascimento: initialData?.dataNascimento || '',
    telefone: initialData?.telefone || '',
    email: initialData?.email || '',
    endereco: initialData?.endereco || '',
    responsavel: initialData?.responsavel || '',
    motivoConsulta: initialData?.motivoConsulta || '',
    status: initialData?.status || 'ativo'
  }));

  // Update formData when initialData changes (for editing existing patients)
  React.useEffect(() => {
    if (initialData && typeof initialData === 'object') {
      setFormData({
        nome: initialData.nome || '',
        cpf: initialData.cpf || '',
        dataNascimento: initialData.dataNascimento || '',
        telefone: initialData.telefone || '',
        email: initialData.email || '',
        endereco: initialData.endereco || '',
        responsavel: initialData.responsavel || '',
        motivoConsulta: initialData.motivoConsulta || '',
        status: initialData.status || 'ativo'
      });
    }
  }, [initialData]);

  // Reset form when modal opens for new patient
  React.useEffect(() => {
    if (isOpen && !initialData) {
      setFormData({
        nome: '',
        cpf: '',
        dataNascimento: '',
        telefone: '',
        email: '',
        endereco: '',
        responsavel: '',
        motivoConsulta: '',
        status: 'ativo'
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.nome?.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    
    // Ensure all fields are strings and clean
    const cleanData = {
      nome: String(formData.nome || '').trim(),
      cpf: String(formData.cpf || '').trim(),
      dataNascimento: String(formData.dataNascimento || '').trim(),
      telefone: String(formData.telefone || '').trim(),
      email: String(formData.email || '').trim(),
      endereco: String(formData.endereco || '').trim(),
      responsavel: String(formData.responsavel || '').trim(),
      motivoConsulta: String(formData.motivoConsulta || '').trim(),
      status: formData.status || 'ativo'
    };
    
    try {
      onSave(cleanData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      alert('Erro ao salvar paciente. Tente novamente.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            {initialData ? 'Editar Paciente' : 'Novo Cadastro de Paciente'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">CPF / CNPJ</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.cpf}
                onChange={e => setFormData({...formData, cpf: e.target.value})}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Data de Nascimento</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.dataNascimento}
                onChange={e => setFormData({...formData, dataNascimento: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone / WhatsApp</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input 
              type="email" 
              className="form-input" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço Residencial</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.endereco}
              onChange={e => setFormData({...formData, endereco: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Responsável (se menor)</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.responsavel}
              onChange={e => setFormData({...formData, responsavel: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo da Consulta / Queixa Principal</label>
            <textarea 
              className="form-input" 
              rows={3}
              value={formData.motivoConsulta}
              onChange={e => setFormData({...formData, motivoConsulta: e.target.value})}
            ></textarea>
          </div>

          <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Cadastro</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumo');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    data: new Date().toISOString().split('T')[0],
    hora: '08:00',
    tipo: 'Psicoterapia Individual',
    resumo: '',
    modalidade: '',
    contexto: '',
    examePsiquico: '',
    condutas: '',
    encaminhamentos: '',
    observacoes: ''
  });
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ data: new Date().toISOString().split('T')[0], valor: '', descricao: 'Sessão' });
  const [isEditingAnamnese, setIsEditingAnamnese] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingFinanceId, setEditingFinanceId] = useState<string | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editPatientData, setEditPatientData] = useState<any>({});
  const router = useRouter();
  const [anamneseContent, setAnamneseContent] = useState<any>({
    data: new Date().toISOString().split('T')[0],
    queixaMotivo: '',
    inicioEvolucao: '',
    impactoFuncional: '',
    antecedentes: '',
    comorbilidades: '',
    medicacao: '',
    escolaridade: '',
    ocupacao: '',
    historiaEscolar: '',
    sono: '',
    substancias: '',
    redeApoio: '',
    observacoes: ''
  });
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [docContent, setDocContent] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionFilters, setSessionFilters] = useState({ tipo: 'Todos', dataInicio: '', dataFim: '' });

  const filteredSessions = sessions.filter(s => {
    const matchesTipo = sessionFilters.tipo === 'Todos' || s.tipo === sessionFilters.tipo;
    const sessionDate = new Date(s.data);
    const matchesInicio = !sessionFilters.dataInicio || sessionDate >= new Date(sessionFilters.dataInicio);
    const matchesFim = !sessionFilters.dataFim || sessionDate <= new Date(sessionFilters.dataFim);
    return matchesTipo && matchesInicio && matchesFim;
  });

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, tRes, aRes] = await Promise.all([
        fetch(`/api/pacientes?id=${params.id}`),
        fetch(`/api/sessoes?pacienteId=${params.id}`),
        fetch(`/api/financeiro?pacienteId=${params.id}`),
        fetch(`/api/pacientes/anexos?pacienteId=${params.id}`)
      ]);
      const [pData, sData, tData, aData] = await Promise.all([
        pRes.json(),
        sRes.json(),
        tRes.json(),
        aRes.json()
      ]);
      const found = Array.isArray(pData) ? pData.find((p: any) => p._id === params.id) : pData;
      setPatient(found);
      setSessions(sData);
      setTransactions(tData);
      setAttachments(aData);
      if (found) {
        if (typeof found.anamnese === 'string') {
          setAnamneseContent((prev: any) => ({ ...prev, observacoes: found.anamnese }));
        } else if (found.anamnese) {
          setAnamneseContent((prev: any) => ({ ...prev, ...found.anamnese }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [params.id]);

  useEffect(() => {
    if (selectedDoc && patient) {
      let content = "";
      const today = new Date().toLocaleDateString('pt-BR');
      if (selectedDoc === 'Atestado') {
        content = `ATESTADO PSICOLÓGICO\n\nEu, Lívia Brito, Psicóloga (CRP 06/123456), declaro para os devidos fins que o(a) paciente ${patient.nome}, portador(a) do documento ${patient.cpf || '---'}, encontra-se em acompanhamento psicológico nesta clínica.\n\nO referido suporte terapêutico tem frequência semanal e visa o bem-estar e equilíbrio emocional do(a) paciente.\n\nLauro de Freitas-BA, ${today}.`;
      } else if (selectedDoc === 'Laudo Psicológico') {
        content = `LAUDO PSICOLÓGICO\n\nIdentificação:\nPaciente: ${patient.nome}\nDocumento: ${patient.cpf || '---'}\nNascimento: ${patient.dataNascimento || '---'}\n\nDescrição da Demanda:\n${patient.motivoConsulta || '---'}\n\nAnálise Técnica:\n[Escreva aqui a análise técnica detalhada do caso, baseada em testes, entrevistas e observação clínica...]\n\nConclusão:\n[Escreva aqui a conclusão diagnóstica, prognóstico ou recomendações terapêuticas...]\n\nLauro de Freitas-BA, ${today}.`;
      } else if (selectedDoc === 'Relatório') {
        content = `RELATÓRIO DE EVOLUÇÃO TERAPÊUTICA\n\nPaciente: ${patient.nome}\nProfissional: Lívia Brito\n\nResumo das Atividades:\nDurante as sessões realizadas, foram abordados temas relativos a [Descreva os temas].\n\nEvolução Clínica:\nO(A) paciente apresenta [Melhora/Estabilidade] em relação aos sintomas e queixas apresentados inicialmente no processo de anamnese.\n\nLauro de Freitas-BA, ${today}.`;
      } else if (selectedDoc === 'Contrato') {
        content = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS PSICOLÓGICOS\n\nContratante: ${patient.nome}\nCPF: ${patient.cpf || '---'}\nContratada: Lívia Brito (CRP 06/123456)\n\nCláusula 1 - Do Objeto:\nO presente contrato visa a prestação de serviços de psicoterapia individual.\n\nCláusula 2 - Dos Valores:\nO valor por sessão acordado é de R$ [Valor] por atendimento.\n\nCláusula 3 - Faltas e Reagendamentos:\nDesistências devem ser comunicadas com 24h de antecedência.\n\nLauro de Freitas-BA, ${today}.`;
      } else if (selectedDoc === 'Termo de Autorização') {
        content = `TERMO DE CONSENTIMENTO E AUTORIZAÇÃO\n\nEu, [Nome do Responsável], portador(a) do CPF [Doc Responsável], autorizo o(a) menor ${patient.nome} a realizar acompanhamento psicológico com a profissional Lívia Brito.\n\nEstou ciente da importância da assiduidade e do sigilo das sessões conforme o Código de Ética do Psicólogo.\n\nLauro de Freitas-BA, ${today}.`;
      } else if (selectedDoc === 'Recibo') {
        content = `RECIBO DE PRESTAÇÃO DE SERVIÇOS PSICOLÓGICOS\n\nRecebi de ${patient.nome}, inscrito(a) no CPF sob o nº ${patient.cpf || '---'}, a importância de R$ [Valor] ([Valor por extenso]) referente a [quantidade] sessão(ões) de psicoterapia individual realizadas no(s) dia(s) [Datas das Sessões].\n\nPor ser verdade, firmo o presente recibo.\n\nLauro de Freitas-BA, ${today}.\n\n_________________________________________________\nLívia Brito - Psicóloga Clínica\nCRP 06/123456\nCPF: 123.456.789-00`;
      } else if (selectedDoc === 'Novo Documento') {
        content = `[INSERIR TÍTULO DO DOCUMENTO]\n\nPaciente: ${patient.nome}\nDocumento: ${patient.cpf || '---'}\n\n[INSERIR CONTEÚDO]\n\nLauro de Freitas-BA, ${today}.`;
      }
      setDocContent(content);
    }
  }, [selectedDoc, patient]);

  const handleSaveAnamnese = async () => {
    try {
      const res = await fetch('/api/pacientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, anamnese: anamneseContent })
      });
      if (res.ok) {
        setIsEditingAnamnese(false);
        fetchPatientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const closeSessionModal = () => {
    setIsSessionModalOpen(false);
    setEditingSessionId(null);
    setNewSession({
      data: new Date().toISOString().split('T')[0],
      hora: '08:00',
      tipo: 'Psicoterapia Individual',
      resumo: '',
      modalidade: '',
      contexto: '',
      examePsiquico: '',
      condutas: '',
      encaminhamentos: '',
      observacoes: ''
    });
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingSessionId;
      const url = '/api/sessoes';
      const method = isEditing ? 'PATCH' : 'POST';
      const bodyData = isEditing ? { ...newSession, id: editingSessionId } : { ...newSession, pacienteId: params.id, pacienteNome: patient.nome };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        closeSessionModal();
        fetchPatientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSession = (s: any) => {
    setNewSession({
      data: s.data ? new Date(s.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: s.hora || '08:00',
      tipo: s.tipo || 'Psicoterapia Individual',
      resumo: s.resumo || '',
      modalidade: s.modalidade || '',
      contexto: s.contexto || '',
      examePsiquico: s.examePsiquico || '',
      condutas: s.condutas || '',
      encaminhamentos: s.encaminhamentos || '',
      observacoes: s.observacoes || ''
    });
    setEditingSessionId(s._id);
    setIsSessionModalOpen(true);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta sessão?')) return;
    try {
      const res = await fetch(`/api/sessoes?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPatientData();
    } catch (e) {
      console.error(e);
    }
  };

  const closeFinanceModal = () => {
    setIsFinanceModalOpen(false);
    setEditingFinanceId(null);
    setNewEntry({ data: new Date().toISOString().split('T')[0], valor: '', descricao: 'Sessão' });
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingFinanceId;
      const url = '/api/financeiro';
      const method = isEditing ? 'PATCH' : 'POST';
      const bodyData = isEditing ? { ...newEntry, id: editingFinanceId } : { ...newEntry, tipo: 'receita', pacienteId: params.id, pacienteNome: patient.nome };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        closeFinanceModal();
        fetchPatientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditFinance = (t: any) => {
    setNewEntry({
      data: t.data ? new Date(t.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      valor: t.valor || '',
      descricao: t.descricao || ''
    });
    setEditingFinanceId(t._id);
    setIsFinanceModalOpen(true);
  };

  const handleDeleteFinance = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lançamento financeiro?')) return;
    try {
      const res = await fetch(`/api/financeiro?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPatientData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditPatientModal = () => {
    setEditPatientData({ ...patient });
    setIsPatientModalOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pacientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: patient._id, ...editPatientData })
      });
      if (res.ok) {
        setIsPatientModalOpen(false);
        fetchPatientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePatient = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente excluir este paciente? Esta ação excluirá TODAS as sessões, lançamentos e dados associados irreversivelmente.')) return;
    try {
      const res = await fetch(`/api/pacientes?id=${patient._id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/pacientes');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pacienteId', params.id);
    formData.append('pacienteNome', patient.nome);

    try {
      const res = await fetch('/api/pacientes/anexos', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        fetchPatientData();
      } else {
        alert('Falha ao subir arquivo');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm('Deseja excluir este anexo?')) return;
    try {
      const res = await fetch(`/api/pacientes/anexos?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPatientData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando prontuário...</div>;
  if (!patient) return <div style={{ padding: '2rem', textAlign: 'center' }}>Paciente não encontrado.</div>;

  return (
    <div className="patient-dashboard">
      {isSessionModalOpen && (
        <div className="modal-overlay" onClick={closeSessionModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingSessionId ? 'Editar Sessão' : 'Registrar Sessão'} - {patient.nome}</h2>
              <button onClick={closeSessionModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </header>
            <form style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }} onSubmit={handleSaveSession}>
              <div className="form-grid">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Data da Sessão</label>
                    <input type="date" className="form-input" value={newSession.data} onChange={e => setNewSession({ ...newSession, data: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário (para a Agenda)</label>
                    <input type="time" className="form-input" value={newSession.hora} onChange={e => setNewSession({ ...newSession, hora: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={newSession.tipo} onChange={e => setNewSession({ ...newSession, tipo: e.target.value })}>
                    <option>Psicoterapia Individual</option>
                    <option>Avaliação Neuropsicológica</option>
                    <option>Reabilitação Cognitiva</option>
                    <option>Supervisão</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Modalidade</label>
                  <select className="form-input" value={newSession.modalidade} onChange={e => setNewSession({ ...newSession, modalidade: e.target.value })}>
                    <option value="">Selecione...</option>
                    <option value="Online">Online</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contexto</label>
                  <input type="text" className="form-input" value={newSession.contexto} onChange={e => setNewSession({ ...newSession, contexto: e.target.value })} placeholder="Contexto..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exame Psíquico</label>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={newSession.examePsiquico} onChange={e => setNewSession({ ...newSession, examePsiquico: e.target.value })}></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Resumo / Evolução do Paciente</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  placeholder="Descreva a evolução, temas abordados e observações clínicas..."
                  value={newSession.resumo}
                  onChange={e => setNewSession({ ...newSession, resumo: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Condutas</label>
                  <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={newSession.condutas} onChange={e => setNewSession({ ...newSession, condutas: e.target.value })}></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Encaminhamentos</label>
                  <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={newSession.encaminhamentos} onChange={e => setNewSession({ ...newSession, encaminhamentos: e.target.value })}></textarea>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={newSession.observacoes} onChange={e => setNewSession({ ...newSession, observacoes: e.target.value })}></textarea>
              </div>

              <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={closeSessionModal} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingSessionId ? 'Salvar Alterações' : 'Salvar Evolução'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {isFinanceModalOpen && (
        <div className="modal-overlay" onClick={closeFinanceModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingFinanceId ? 'Editar Lançamento' : 'Lançar Valor'} - {patient.nome}</h2>
              <button onClick={closeFinanceModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </header>
            <form style={{ padding: '1.5rem' }} onSubmit={handleSaveFinance}>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input type="text" className="form-input" value={newEntry.descricao} onChange={e => setNewEntry({ ...newEntry, descricao: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Valor (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={newEntry.valor} onChange={e => setNewEntry({ ...newEntry, valor: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" className="form-input" value={newEntry.data} onChange={e => setNewEntry({ ...newEntry, data: e.target.value })} required />
                </div>
              </div>
              <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={closeFinanceModal} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingFinanceId ? 'Salvar Alterações' : 'Salvar Lançamento'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {isDocModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDocModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Gerar {selectedDoc}</h2>
              <button onClick={() => setIsDocModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </header>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'hsl(var(--secondary))', borderRadius: '4px', fontSize: '0.8rem', opacity: 0.8 }}>
                Edite o texto abaixo antes de imprimir. Os campos entre colchetes [ ] devem ser preenchidos.
              </div>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '450px',
                  padding: '3rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontFamily: 'serif',
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)',
                  resize: 'vertical'
                }}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
              ></textarea>
              <footer style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn" onClick={() => setIsDocModalOpen(false)} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                <button className="btn btn-primary" onClick={() => window.print()}>Visualizar / Imprimir PDF</button>
              </footer>
            </div>
          </div>
        </div>
      )}

      {isPatientModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPatientModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Editar Dados - {patient.nome}</h2>
              <button onClick={() => setIsPatientModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </header>
            <form style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }} onSubmit={handleSavePatient}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input type="text" className="form-input" value={editPatientData.nome || ''} onChange={e => setEditPatientData({ ...editPatientData, nome: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={editPatientData.status || 'Ativo'} onChange={e => setEditPatientData({ ...editPatientData, status: e.target.value })}>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">CPF</label>
                  <input type="text" className="form-input" value={editPatientData.cpf || ''} onChange={e => setEditPatientData({ ...editPatientData, cpf: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Data Nasc.</label>
                  <input type="date" className="form-input" value={editPatientData.dataNascimento ? new Date(editPatientData.dataNascimento).toISOString().split('T')[0] : ''} onChange={e => setEditPatientData({ ...editPatientData, dataNascimento: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Idade</label>
                  <input type="number" className="form-input" value={editPatientData.idade || ''} onChange={e => setEditPatientData({ ...editPatientData, idade: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sexo</label>
                  <select className="form-input" value={editPatientData.sexo || ''} onChange={e => setEditPatientData({ ...editPatientData, sexo: e.target.value })}>
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input type="text" className="form-input" value={editPatientData.telefone || ''} onChange={e => setEditPatientData({ ...editPatientData, telefone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={editPatientData.email || ''} onChange={e => setEditPatientData({ ...editPatientData, email: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço</label>
                <input type="text" className="form-input" value={editPatientData.endereco || ''} onChange={e => setEditPatientData({ ...editPatientData, endereco: e.target.value })} />
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'hsl(var(--secondary))', borderRadius: '4px', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.8 }}>Contato de Emergência</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nome (Emergência)</label>
                    <input type="text" className="form-input" value={editPatientData.contatoEmergenciaNome || ''} onChange={e => setEditPatientData({ ...editPatientData, contatoEmergenciaNome: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Telefone (Emergência)</label>
                    <input type="text" className="form-input" value={editPatientData.contatoEmergenciaTelefone || ''} onChange={e => setEditPatientData({ ...editPatientData, contatoEmergenciaTelefone: e.target.value })} />
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem' }}>Dados Clínicos & Administrativos</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Consentimento?</label>
                  <select className="form-input" value={editPatientData.consentimento || 'Não'} onChange={e => setEditPatientData({ ...editPatientData, consentimento: e.target.value })}>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Data Consentimento</label>
                  <input type="date" className="form-input" value={editPatientData.dataConsentimento ? new Date(editPatientData.dataConsentimento).toISOString().split('T')[0] : ''} onChange={e => setEditPatientData({ ...editPatientData, dataConsentimento: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Autoriza Partilha de Info.?</label>
                  <select className="form-input" value={editPatientData.autorizacaoPartilha || 'Não'} onChange={e => setEditPatientData({ ...editPatientData, autorizacaoPartilha: e.target.value })}>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas Administrativas</label>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }} value={editPatientData.notas || ''} onChange={e => setEditPatientData({ ...editPatientData, notas: e.target.value })}></textarea>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem' }}>Plano Terapêutico</h3>

              <div className="form-group">
                <label className="form-label">Objetivo Terapêutico Geral (Macro)</label>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} value={editPatientData.objetivoTerapeutico || editPatientData.motivoConsulta || ''} onChange={e => setEditPatientData({ ...editPatientData, objetivoTerapeutico: e.target.value })}></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Indicadores Funcionais ou Queixa-alvo</label>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'vertical' }} value={editPatientData.indicadoresFuncionais || ''} onChange={e => setEditPatientData({ ...editPatientData, indicadoresFuncionais: e.target.value })}></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Data Prevista para Reavaliação</label>
                <input type="date" className="form-input" style={{ width: 'fit-content' }} value={editPatientData.dataReavaliacao ? new Date(editPatientData.dataReavaliacao).toISOString().split('T')[0] : ''} onChange={e => setEditPatientData({ ...editPatientData, dataReavaliacao: e.target.value })} />
              </div>

              <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setIsPatientModalOpen(false)} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <header style={{ marginBottom: '2rem' }}>
        <Link href="/pacientes" style={{ color: 'hsl(var(--primary))', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          ← Voltar para lista
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{patient.nome}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', opacity: 0.6 }}>
              <span>Doc: {patient.cpf || 'Não informado'}</span>
              <span>•</span>
              <span>Nascimento: {patient.dataNascimento ? patient.dataNascimento.split('-').reverse().join('/') : 'Não informado'}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn" style={{ flex: 1, border: '1px solid hsl(var(--border))' }} onClick={openEditPatientModal}>Editar Dados</button>
              <button className="btn" style={{ flex: 1, border: '1px solid hsl(var(--border))', color: 'hsl(var(--destructive))' }} onClick={handleDeletePatient}>Excluir Paciente</button>
              <button className="btn" style={{ flex: 1, border: '1px solid hsl(var(--border))' }} onClick={() => { setSelectedDoc('Recibo'); setIsDocModalOpen(true); }}>Gerar Recibo</button>
              <button className="btn" style={{ flex: 1, border: '1px solid hsl(var(--border))' }} onClick={() => { setSelectedDoc('Novo Documento'); setIsDocModalOpen(true); }}>Novo Documento</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setIsSessionModalOpen(true)}>Nova Sessão</button>
          </div>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid hsl(var(--border))', marginBottom: '2rem' }}>
        {['resumo', 'anamnese', 'sessoes', 'documentos', 'financeiro', 'anexos'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? 'hsl(var(--primary))' : 'inherit',
              borderBottom: activeTab === tab ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'sessoes' ? 'sessões' : tab}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'resumo' && (
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>Perfil & Contato</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Idade</span><strong style={{ fontWeight: '500' }}>{patient.idade || 'N/A'}</strong></div>
                  <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Sexo</span><strong style={{ fontWeight: '500' }}>{patient.sexo || 'N/A'}</strong></div>
                </div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Email</span><strong style={{ fontWeight: '500' }}>{patient.email || 'Não informado'}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Telefone</span><strong style={{ fontWeight: '500' }}>{patient.telefone || 'Não informado'}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Endereço</span><strong style={{ fontWeight: '500' }}>{patient.endereco || 'Não informado'}</strong></div>

                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'hsl(var(--destructive)/0.05)', borderLeft: '3px solid hsl(var(--destructive))', borderRadius: '4px' }}>
                  <span style={{ opacity: 0.8, display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--destructive))', marginBottom: '0.2rem' }}>EMERGÊNCIA</span>
                  <strong style={{ fontWeight: '600', fontSize: '0.9rem' }}>{patient.contatoEmergenciaNome || 'Não informado'}</strong>
                  <span style={{ display: 'block', fontSize: '0.85rem', marginTop: '0.1rem' }}>{patient.contatoEmergenciaTelefone || '--'}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>Dados Clínicos & Administrativos</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Consentimento Assinado?</span><strong style={{ fontWeight: '500' }}>{patient.consentimento === 'Sim' ? `Sim (${patient.dataConsentimento ? new Date(patient.dataConsentimento).toLocaleDateString('pt-BR') : '-'})` : 'Não'}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Autoriza Partilha de Informações?</span><strong style={{ fontWeight: '500' }}>{patient.autorizacaoPartilha === 'Sim' ? 'Sim' : 'Não'}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Status</span><span className="badge badge-success">{patient.status}</span></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Paciente desde</span><strong style={{ fontWeight: '500' }}>{new Date(patient.createdAt).toLocaleDateString('pt-BR')}</strong></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Notas Administrativas</span><span style={{ fontWeight: '500', whiteSpace: 'pre-wrap', display: 'block' }}>{patient.notas || 'Nenhuma nota.'}</span></div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>Plano Terapêutico</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Objetivo Terapêutico Geral (Macro)</span><span style={{ fontWeight: '500', whiteSpace: 'pre-wrap', display: 'block' }}>{patient.objetivoTerapeutico || '-'}</span></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Indicadores Funcionais / Queixa-alvo</span><span style={{ fontWeight: '500', whiteSpace: 'pre-wrap', display: 'block' }}>{patient.indicadoresFuncionais || '-'}</span></div>
                <div><span style={{ opacity: 0.6, display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Data Prevista para Reavaliação</span><strong style={{ fontWeight: '500' }}>{patient.dataReavaliacao ? new Date(patient.dataReavaliacao).toLocaleDateString('pt-BR') : 'Não agendada'}</strong></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anamnese' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Anamnese Clínica</h3>
              {!isEditingAnamnese ? (
                <button className="btn btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => setIsEditingAnamnese(true)}>Editar Anamnese</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" style={{ fontSize: '0.75rem', border: '1px solid hsl(var(--border))' }} onClick={() => setIsEditingAnamnese(false)}>Cancelar</button>
                  <button className="btn btn-primary" style={{ fontSize: '0.75rem' }} onClick={handleSaveAnamnese}>Salvar</button>
                </div>
              )}
            </div>
            {isEditingAnamnese ? (
              <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Data da Anamnese</label>
                    <input type="date" className="form-input" value={anamneseContent.data || ''} onChange={e => setAnamneseContent({ ...anamneseContent, data: e.target.value })} />
                  </div>
                </div>
                {[
                  { key: 'queixaMotivo', label: 'Queixa / Motivo da Consulta', rows: 3 },
                  { key: 'inicioEvolucao', label: 'Início e Evolução do Sintoma/Problema', rows: 3 },
                  { key: 'impactoFuncional', label: 'Impacto Funcional (Rotina, Relacionamentos, Trabalho/Estudos)', rows: 3 },
                  { key: 'antecedentes', label: 'Antecedentes Médicos e Neurológicos', rows: 2 },
                  { key: 'comorbilidades', label: 'Comorbilidades Psiquiátricas', rows: 2 },
                  { key: 'medicacao', label: 'Medicação em Uso', rows: 2 },
                  { key: 'escolaridade', label: 'Escolaridade', rows: 1 },
                  { key: 'ocupacao', label: 'Ocupação', rows: 1 },
                  { key: 'historiaEscolar', label: 'História Escolar / Profissional', rows: 3 },
                  { key: 'sono', label: 'Padrão de Sono e Alimentação', rows: 2 },
                  { key: 'substancias', label: 'Uso de Substâncias (Álcool, Tabaco, Outras)', rows: 2 },
                  { key: 'redeApoio', label: 'Rede de Apoio (Família, Amigos)', rows: 2 },
                  { key: 'observacoes', label: 'Observações Gerais', rows: 4 },
                ].map(field => (
                  <div className="form-group" key={field.key} style={{ marginBottom: 0 }}>
                    <label className="form-label">{field.label}</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: `${field.rows * 40}px`, resize: 'vertical' }}
                      value={anamneseContent[field.key] || ''}
                      onChange={e => setAnamneseContent({ ...anamneseContent, [field.key]: e.target.value })}
                      placeholder="Preencha os dados..."
                    ></textarea>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }}>
                <div style={{ padding: '1.5rem', backgroundColor: 'hsl(var(--secondary))', borderRadius: 'var(--radius)' }}>
                  {Object.entries({
                    'Data da Anamnese': anamneseContent.data ? anamneseContent.data.split('-').reverse().join('/') : '',
                    'Queixa / Motivo da Consulta': anamneseContent.queixaMotivo,
                    'Início e Evolução do Sintoma/Problema': anamneseContent.inicioEvolucao,
                    'Impacto Funcional': anamneseContent.impactoFuncional,
                    'Antecedentes Médicos e Neurológicos': anamneseContent.antecedentes,
                    'Comorbilidades Psiquiátricas': anamneseContent.comorbilidades,
                    'Medicação em Uso': anamneseContent.medicacao,
                    'Escolaridade': anamneseContent.escolaridade,
                    'Ocupação': anamneseContent.ocupacao,
                    'História Escolar / Profissional': anamneseContent.historiaEscolar,
                    'Padrão de Sono e Alimentação': anamneseContent.sono,
                    'Uso de Substâncias (Álcool, Tabaco, Outras)': anamneseContent.substancias,
                    'Rede de Apoio (Família, Amigos)': anamneseContent.redeApoio,
                    'Observações Gerais': anamneseContent.observacoes
                  }).map(([label, value]) => (
                    value && value.toString().trim() !== '' ? (
                      <div key={label} style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', opacity: 0.7 }}>{label}</h4>
                        <div style={{ fontSize: '0.925rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{value}</div>
                      </div>
                    ) : null
                  ))}
                  {!Object.values(anamneseContent).some((val: any) => val && val.toString().trim() !== '' && val.toString().length > 5) && (
                    <div style={{ opacity: 0.5, fontStyle: 'italic', padding: '1rem 0' }}>Nenhum registro de anamnese encontrado. Clique em editar para iniciar o registro.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessoes' && (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Histórico de Sessões</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="btn"
                  style={{
                    fontSize: '0.75rem',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: isFilterVisible ? 'hsl(var(--secondary))' : 'transparent'
                  }}
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                >
                  {isFilterVisible ? 'Ocultar Filtros' : 'Filtros'}
                </button>
                <button className="btn btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => setIsSessionModalOpen(true)}>+ Registrar Sessão</button>
              </div>
            </div>

            {isFilterVisible && (
              <div style={{ padding: '1rem 1.5rem', backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.7 }}>Tipo de Sessão</label>
                  <select
                    className="form-input"
                    style={{ padding: '0.4rem', fontSize: '0.875rem', minWidth: '180px' }}
                    value={sessionFilters.tipo}
                    onChange={e => setSessionFilters({ ...sessionFilters, tipo: e.target.value })}
                  >
                    <option>Todos</option>
                    <option>Psicoterapia Individual</option>
                    <option>Avaliação Neuropsicológica</option>
                    <option>Reabilitação Cognitiva</option>
                    <option>Supervisão</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.7 }}>De</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '0.4rem', fontSize: '0.875rem' }}
                    value={sessionFilters.dataInicio}
                    onChange={e => setSessionFilters({ ...sessionFilters, dataInicio: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.7 }}>Até</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '0.4rem', fontSize: '0.875rem' }}
                    value={sessionFilters.dataFim}
                    onChange={e => setSessionFilters({ ...sessionFilters, dataFim: e.target.value })}
                  />
                </div>
                <button
                  className="btn"
                  style={{ fontSize: '0.75rem', border: '1px solid hsl(var(--border))', height: 'fit-content' }}
                  onClick={() => setSessionFilters({ tipo: 'Todos', dataInicio: '', dataFim: '' })}
                >
                  Limpar
                </button>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', opacity: 0.5 }}>DATA E TIPO</th>
                  <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', opacity: 0.5 }}>REGISTRO CLÍNICO DA SESSÃO</th>
                  <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', opacity: 0.5, textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions && filteredSessions.length > 0 ? (
                  filteredSessions.map((s: any) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid hsl(var(--border))', alignItems: 'flex-start' }}>
                      <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                          {s.data && !isNaN(new Date(s.data).getTime()) 
                            ? new Date(s.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                            : (s.data || 'Data não informada')}
                        </div>
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{s.tipo}</span>
                        {s.modalidade && <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.4rem' }}>{s.modalidade}</div>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', opacity: 0.8, verticalAlign: 'top' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {s.contexto && <div><strong>Contexto:</strong> {s.contexto}</div>}
                          {s.examePsiquico && <div><strong>Exame Psíquico:</strong> {s.examePsiquico}</div>}
                          {s.resumo && <div style={{ whiteSpace: 'pre-wrap' }}><strong>Evolução:</strong> {s.resumo}</div>}
                          {s.condutas && <div><strong>Condutas:</strong> {s.condutas}</div>}
                          {s.encaminhamentos && <div><strong>Encaminhamentos:</strong> {s.encaminhamentos}</div>}
                          {s.observacoes && <div><strong>Observações:</strong> {s.observacoes}</div>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))' }} onClick={() => handleEditSession(s)}>✏️</button>
                          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))', color: 'hsl(var(--destructive))' }} onClick={() => handleDeleteSession(s._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>

                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Nenhuma sessão registrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {['Atestado', 'Laudo Psicológico', 'Relatório', 'Contrato', 'Termo de Autorização'].map(doc => (
              <div key={doc} className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => { setSelectedDoc(doc); setIsDocModalOpen(true); }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
                <div style={{ fontWeight: '600', color: 'hsl(var(--primary))' }}>Gerar {doc}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.5rem' }}>Modelo editável</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Finanças do Paciente</h3>
              <button className="btn btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => setIsFinanceModalOpen(true)}>+ Lançar Valor</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card" style={{ backgroundColor: 'hsl(var(--secondary))', border: 'none' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Total Recebido</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>R$ {transactions.reduce((sum, t) => sum + parseFloat(t.valor || '0'), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="card" style={{ backgroundColor: 'hsl(var(--secondary))', border: 'none' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Último Lançamento</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{transactions.length > 0 ? `R$ ${parseFloat(transactions[0].valor || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}</div>
              </div>
              <div className="card" style={{ backgroundColor: 'hsl(var(--secondary))', border: 'none' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Qtd Transações</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{transactions.length}</div>
              </div>
            </div>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', backgroundColor: 'hsl(var(--secondary))', borderBottom: '1px solid hsl(var(--border))' }}>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', opacity: 0.5 }}>DATA</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', opacity: 0.5 }}>DESCRIÇÃO</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', opacity: 0.5 }}>VALOR</th>
                    <th style={{ padding: '0.75rem 1.5rem', fontSize: '0.75rem', opacity: 0.5, textAlign: 'right' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Nenhum lançamento encontrado.</td>
                    </tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t._id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{t.descricao}</td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>R$ {parseFloat(t.valor || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))' }} onClick={() => handleEditFinance(t)}>✏️</button>
                            <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))', color: 'hsl(var(--destructive))' }} onClick={() => handleDeleteFinance(t._id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>

                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'anexos' && (
          <div className="card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Anexos e Documentos Externos</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="file"
                  id="attachment-upload"
                  style={{ display: 'none' }}
                  onChange={handleUploadAttachment}
                  disabled={isUploading}
                />
                <label
                  htmlFor="attachment-upload"
                  className="btn btn-primary"
                  style={{ 
                    fontSize: '0.8125rem', 
                    cursor: isUploading ? 'not-allowed' : 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px'
                  }}
                >
                  {isUploading ? (
                    'Subindo arquivo...'
                  ) : (
                    <><span>📎</span> Adicionar Anexo</>
                  )}
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
              {attachments.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', opacity: 0.5, border: '2px dashed hsl(var(--border))', borderRadius: '12px' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📂</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>O prontuário de anexos está vazio</h4>
                  <p style={{ fontSize: '0.9rem' }}>Clique em "Adicionar Anexo" para centralizar exames, fotos ou documentos externos deste paciente.</p>
                </div>
              ) : (
                attachments.map(anexo => (
                  <div key={anexo._id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ height: '140px', backgroundColor: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderBottom: '1px solid hsl(var(--border))' }}>
                      {anexo.type?.startsWith('image/') ? (
                        <img src={anexo.path} alt={anexo.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                          {anexo.originalName.toLowerCase().endsWith('.pdf') ? '📕' : '📄'}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem', color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={anexo.originalName}>
                        {anexo.originalName}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '1.25rem' }}>
                        {new Date(anexo.createdAt).toLocaleDateString('pt-BR')} • {(anexo.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <a 
                          href={anexo.path} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn" 
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500' }}
                        >
                          Visualizar
                        </a>
                        <button 
                          onClick={() => handleDeleteAttachment(anexo._id)} 
                          className="btn" 
                          style={{ padding: '0.5rem', fontSize: '0.75rem', border: '1px solid hsl(var(--border))', color: 'hsl(var(--destructive))', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                          title="Excluir anexo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

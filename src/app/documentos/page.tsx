'use client';
import { useState, useEffect } from 'react';

export default function DocumentosPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [docContent, setDocContent] = useState('');
  const [step, setStep] = useState(1); // 1: Selecionar Paciente, 2: Editar Template

  useEffect(() => {
    fetch('/api/pacientes')
      .then(res => res.json())
      .then(data => setPacientes(data))
      .catch(err => console.error(err));
  }, []);

  const templates = [
    { title: 'Contrato Psicoterapêutico', type: 'Contrato', icon: '📄', description: 'Modelo padrão para psicoterapia individual.' },
    { title: 'Contrato Neuropsicológico', type: 'Contrato', icon: '🧠', description: 'Focado em avaliação e reabilitação.' },
    { title: 'Termo de Autorização', type: 'Legal', icon: '⚖️', description: 'Autorização para atendimento de menores.' },
    { title: 'Laudo Psicológico', type: 'Laudo', icon: '📋', description: 'Documento conclusivo de avaliação.' },
    { title: 'Atestado Psicológico', type: 'Atestado', icon: '✅', description: 'Comprovação de comparecimento ou estado.' },
    { title: 'Relatório de Evolução', type: 'Relatório', icon: '📈', description: 'Resumo do processo terapêutico.' },
    { title: 'Anamnese Adulto', type: 'Anamnese', icon: '👤', description: 'Roteiro completo de entrevista inicial.' },
    { title: 'Recibo de Pagamento', type: 'Financeiro', icon: '💰', description: 'Comprovante simples para o paciente.' },
  ];

  const handleGenerateClick = (template: any) => {
    setSelectedTemplate(template);
    setStep(1);
    setIsModalOpen(true);
  };

  const loadTemplate = () => {
    const patient = pacientes.find(p => p._id === selectedPatientId);
    if (!patient || !selectedTemplate) return;

    const today = new Date().toLocaleDateString('pt-BR');
    let content = "";

    if (selectedTemplate.type === 'Atestado') {
      content = `ATESTADO PSICOLÓGICO\n\nEu, Lívia Brito, Psicóloga (CRP 06/123456), declaro para os devidos fins que o(a) paciente ${patient.nome}, portador(a) do documento ${patient.cpf || '---'}, encontra-se em acompanhamento psicológico nesta clínica.\n\nO referido suporte terapêutico tem frequência semanal e visa o bem-estar e equilíbrio emocional do(a) paciente.\n\nLauro de Freitas-BA, ${today}.`;
    } else if (selectedTemplate.type === 'Laudo') {
      content = `LAUDO PSICOLÓGICO\n\nIdentificação:\nPaciente: ${patient.nome}\nDocumento: ${patient.cpf || '---'}\nNascimento: ${patient.dataNascimento || '---'}\n\nDescrição da Demanda:\n${patient.motivoConsulta || '---'}\n\nAnálise Técnica:\n[Escreva aqui a análise técnica detalhada do caso...]\n\nConclusão:\n[Escreva aqui a conclusão diagnóstica...]\n\nLauro de Freitas-BA, ${today}.`;
    } else if (selectedTemplate.type === 'Relatório') {
      content = `RELATÓRIO DE EVOLUÇÃO\n\nPaciente: ${patient.nome}\n\nResumo das Atividades:\nDurante o acompanhamento, abordamos [Temas].\n\nEvolução Clínica:\nO(A) paciente apresenta [Melhora/Estabilidade] em relação aos sintomas iniciais.\n\nLauro de Freitas-BA, ${today}.`;
    } else if (selectedTemplate.type === 'Contrato') {
      content = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS PSICOLÓGICOS\n\nContratante: ${patient.nome}\nContratada: Lívia Brito (CRP 06/123456)\n\nCláusula 1 - Objeto:\nPsicoterapia Individual.\n\nCláusula 2 - Valores:\nValor acordado de R$ [Valor] por sessão.\n\nLauro de Freitas-BA, ${today}.`;
    } else if (selectedTemplate.type === 'Financeiro') {
      content = `RECIBO DE PAGAMENTO\n\nRecebi de ${patient.nome}, portador(a) do CPF ${patient.cpf || '---'}, a importância de R$ [Valor], referente a atendimentos psicológicos realizados em [Data].\n\nLauro de Freitas-BA, ${today}.`;
    } else {
      content = `${selectedTemplate.title.toUpperCase()}\n\nNome: ${patient.nome}\nCPF: ${patient.cpf || '---'}\n\n[Texto do documento solicitado...]\n\nLauro de Freitas-BA, ${today}.`;
    }

    setDocContent(content);
    setStep(2);
  };

  const filteredTemplates = activeFilter === 'Todos'
    ? templates
    : templates.filter(t => t.type === activeFilter);

  return (
    <div className="documentos-container">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Centro de Documentos</h1>
        <p style={{ opacity: 0.6, fontSize: '1rem', marginTop: '0.5rem' }}>Gere laudos, contratos e atestados em segundos com dados integrados.</p>
      </header>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: step === 1 ? '500px' : '800px', width: '90%' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{step === 1 ? `Gerar ${selectedTemplate?.title}` : `Editar ${selectedTemplate?.title}`}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.5 }}>&times;</button>
            </header>
            <div style={{ padding: '1.5rem' }}>
              {step === 1 ? (
                <>
                  <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>Selecione o paciente para carregar os dados no modelo:</p>
                  <div className="form-group">
                    <label className="form-label">Paciente</label>
                    <select className="form-input" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} required>
                      <option value="">Escolha um paciente...</option>
                      {pacientes.map(p => (
                        <option key={p._id} value={p._id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn" onClick={() => setIsModalOpen(false)} style={{ border: '1px solid hsl(var(--border))' }}>Cancelar</button>
                    <button className="btn btn-primary" onClick={loadTemplate} disabled={!selectedPatientId}>Continuar para Edição</button>
                  </footer>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'hsl(var(--secondary))', borderRadius: '4px', fontSize: '0.8rem', opacity: 0.8 }}>
                    Revise o conteúdo abaixo e preencha as informações entre colchetes [ ].
                  </div>
                  <textarea
                    style={{ width: '100%', minHeight: '400px', padding: '2rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'serif', fontSize: '1.1rem', lineHeight: '1.6', resize: 'vertical' }}
                    value={docContent}
                    onChange={e => setDocContent(e.target.value)}
                  ></textarea>
                  <footer style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn" onClick={() => setStep(1)} style={{ border: '1px solid hsl(var(--border))' }}>Voltar</button>
                    <button className="btn btn-primary" onClick={() => window.print()}>Imprimir PDF</button>
                  </footer>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.75rem', scrollbarWidth: 'none' }}>
        {['Todos', 'Contrato', 'Laudo', 'Atestado', 'Relatório', 'Anamnese', 'Legal', 'Financeiro'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="btn"
            style={{
              backgroundColor: activeFilter === filter ? 'hsl(var(--primary))' : 'hsl(var(--secondary)/0.5)',
              color: activeFilter === filter ? 'hsl(var(--primary-foreground))' : 'inherit',
              fontSize: '0.8125rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '99px',
              border: activeFilter === filter ? 'none' : '1px solid hsl(var(--border))',
              whiteSpace: 'nowrap',
              fontWeight: activeFilter === filter ? '600' : '500',
              transition: 'all 0.2s ease'
            }}

          >
            {filter}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {filteredTemplates.map(template => (
          <div key={template.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ fontSize: '1.75rem', backgroundColor: 'hsl(var(--secondary)/0.5)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                {template.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', letterSpacing: '-0.01em' }}>{template.title}</h3>
                <span className="badge badge-outline" style={{ marginTop: '0.35rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{template.type}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, lineHeight: '1.5', minHeight: '3em' }}>{template.description}</p>
            <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => handleGenerateClick(template)} style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }}>
                Gerar Documento
              </button>
            </div>
          </div>
        ))}
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Dicas de Documentação</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ backgroundColor: 'hsl(var(--secondary))', border: 'none' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Sigilo Profissional</h4>
            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Lembre-se que toda documentação psicológica deve seguir as diretrizes do Código de Ética e a Resolução CFP nº 06/2019.</p>
          </div>
          <div className="card" style={{ backgroundColor: 'hsl(var(--secondary))', border: 'none' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Guarda de Dados</h4>
            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Os prontuários e documentos devem ser guardados pelo período mínimo de 5 anos após o último atendimento.</p>
          </div>
        </div>
      </section>
    </div>
  );
}


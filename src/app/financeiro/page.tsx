'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '@/components/SettingsProvider';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function FinanceiroPage() {
  const { settings, t } = useSettings();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [isNFModalOpen, setIsNFModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'receita',
    data: new Date().toISOString().split('T')[0],
    pacienteId: ''
  });

  // Period state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getUTCMonth());
  const [selectedYear, setSelectedYear] = useState(now.getUTCFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, pacRes] = await Promise.all([
        fetch('/api/financeiro'),
        fetch('/api/pacientes')
      ]);
      const [transData, pacData] = await Promise.all([
        transRes.json(),
        pacRes.json()
      ]);
      setTransacoes(Array.isArray(transData) ? transData : []);
      setPacientes(Array.isArray(pacData) ? pacData : []);
    } catch (e) {
      console.error("Erro ao buscar dados financeiros:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PATCH' : 'POST';
    const body = editingId ? { ...formData, id: editingId } : formData;

    try {
      const res = await fetch('/api/financeiro', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsLancamentoModalOpen(false);
        fetchData();
        resetForm();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    try {
      const res = await fetch(`/api/financeiro?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      descricao: '',
      valor: '',
      tipo: 'receita',
      data: new Date().toISOString().split('T')[0],
      pacienteId: ''
    });
  };

  const openEdit = (t: any) => {
    setEditingId(t._id);
    setFormData({
      descricao: t.descricao,
      valor: t.valor.toString(),
      tipo: t.tipo,
      data: new Date(t.data).toISOString().split('T')[0],
      pacienteId: t.pacienteId || ''
    });
    setIsLancamentoModalOpen(true);
  };

  // Derived Data
  const periodTransacoes = transacoes.filter(t => {
    const d = new Date(t.data);
    return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
  });

  const totals = periodTransacoes.reduce((acc, t) => {
    const val = parseFloat(t.valor) || 0;
    if (t.tipo === 'receita') acc.entradas += val;
    else acc.saidas += val;
    return acc;
  }, { entradas: 0, saidas: 0 });

  // Annual Chart Data
  const chartData = MONTHS.map((_, mi) => {
    const monthTrans = transacoes.filter(t => {
      const d = new Date(t.data);
      return d.getUTCMonth() === mi && d.getUTCFullYear() === selectedYear;
    });
    const receitas = monthTrans.filter(t => t.tipo === 'receita').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
    const despesas = monthTrans.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0);
    return { receitas, despesas };
  });

  const maxVal = Math.max(...chartData.map(d => Math.max(d.receitas, d.despesas)), 1000);
  const chartH = 200;
  const barW = 16;
  const gap = 4;
  const groupW = barW * 2 + gap;
  const colW = groupW + 16;
  const chartW = colW * 12 + 20;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados financeiros...</div>;

  return (
    <div className="dashboard">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em' }}>{t('Financeiro')}</h1>
          <p style={{ opacity: 0.6, fontSize: '1.1rem', marginTop: '0.25rem' }}>Gestão de caixa, análise anual e emissão de recibos.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }} className="no-print">
          <button className="btn" style={{ border: '1px solid hsl(var(--border))' }} onClick={() => window.print()}>🖨️ PDF</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsLancamentoModalOpen(true); }}>+ Novo Lançamento</button>
        </div>
      </header>

      {/* Period Selector & Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }} className="no-print">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', opacity: 0.7 }}>Filtrar Período</div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select className="form-input" style={{ flex: 1 }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {FULL_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: '100px' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn" style={{ fontSize: '0.75rem', border: '1px solid hsl(var(--border))' }} 
            onClick={() => { setSelectedMonth(now.getUTCMonth()); setSelectedYear(now.getUTCFullYear()); }}>
            Mês Atual
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="card" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.6, textTransform: 'uppercase' }}>Receitas</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', marginTop: '0.25rem' }}>
              R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid hsl(var(--destructive))', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.6, textTransform: 'uppercase' }}>Despesas</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'hsl(var(--destructive))', marginTop: '0.25rem' }}>
              R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid hsl(var(--primary))', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.6, textTransform: 'uppercase' }}>Saldo</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: (totals.entradas - totals.saidas) >= 0 ? 'hsl(var(--foreground))' : 'hsl(var(--destructive))', marginTop: '0.25rem' }}>
              R$ {(totals.entradas - totals.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Predicted Result Chart */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Resultado Previsto no Ano ({selectedYear})</h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></span> Receitas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', background: 'hsl(var(--destructive))', borderRadius: '2px' }}></span> Despesas
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <svg width={chartW} height={chartH + 40} style={{ display: 'block' }}>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(r => {
              const y = 10 + (1 - r) * chartH;
              return (
                <g key={r}>
                  <line x1={0} y1={y} x2={chartW} y2={y} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4,4" />
                  <text x={0} y={y - 4} fontSize={9} fill="currentColor" opacity={0.3}>
                    {r === 0 ? '' : `R$ ${Math.round((maxVal * r)/1000)}k`}
                  </text>
                </g>
              );
            })}
            {/* Bars */}
            {chartData.map((d, i) => {
              const x = 10 + i * colW;
              const hRec = (d.receitas / maxVal) * chartH;
              const hDes = (d.despesas / maxVal) * chartH;
              const isCurrent = i === now.getUTCMonth() && selectedYear === now.getUTCFullYear();
              return (
                <g key={i}>
                  <rect x={x} y={10 + chartH - hRec} width={barW} height={hRec} fill="#10b981" rx={2} opacity={isCurrent ? 1 : 0.8} />
                  <rect x={x + barW + gap} y={10 + chartH - hDes} width={barW} height={hDes} fill="hsl(var(--destructive))" rx={2} opacity={isCurrent ? 1 : 0.8} />
                  <text x={x + groupW / 2} y={chartH + 28} textAnchor="middle" fontSize={10} fontWeight={isCurrent ? '700' : '400'} opacity={isCurrent ? 1 : 0.5} fill="currentColor">
                    {MONTHS[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem' }}>Lançamentos de {FULL_MONTHS[selectedMonth]}</h2>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--secondary)/0.5)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>Data</th>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600' }}>Descrição</th>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', textAlign: 'right' }}>Valor</th>
                  <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '600', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {periodTransacoes.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Nenhum lançamento neste período.</td></tr>
                ) : (
                  periodTransacoes.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {t.descricao}
                        {t.tipo === 'receita' ? <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '10px' }}>● Entrada</span> : <span style={{ marginLeft: '0.5rem', color: 'hsl(var(--destructive))', fontSize: '10px' }}>● Saída</span>}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '700', textAlign: 'right', color: t.tipo === 'receita' ? '#10b981' : 'hsl(var(--destructive))' }}>
                        {t.tipo === 'receita' ? '+' : '-'} R$ {parseFloat(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn" style={{ padding: '0.25rem', fontSize: '0.75rem' }} onClick={() => openEdit(t)}>✏️</button>
                          <button className="btn" style={{ padding: '0.25rem', fontSize: '0.75rem', color: 'hsl(var(--destructive))' }} onClick={() => handleDelete(t._id)}>🗑️</button>
                          {t.tipo === 'receita' && <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', border: '1px solid hsl(var(--border))' }} onClick={() => setSelectedTransaction(t)}>Recibo</button>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Dados NF-e</h2>
            <button className="btn" style={{ border: '1px solid hsl(var(--border))', fontSize: '0.75rem' }} onClick={() => setIsNFModalOpen(true)}>Ver Mais</button>
          </div>
          <div className="card">
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: '1.5rem' }}>Consolidado para faturamento em <b>Lauro de Freitas-BA</b>.</p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'hsl(var(--secondary)/0.5)', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', opacity: 0.5, textTransform: 'uppercase' }}>Faturamento {FULL_MONTHS[selectedMonth]}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>ISS (Estimado)</span>
                  <div style={{ fontWeight: '700' }}>R$ {(totals.entradas * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ padding: '0.75rem', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>Atendimentos</span>
                  <div style={{ fontWeight: '700' }}>{periodTransacoes.filter(t => t.tipo === 'receita').length}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL LANÇAMENTO */}
      {isLancamentoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLancamentoModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
              <button onClick={() => setIsLancamentoModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </header>
            <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input type="text" className="form-input" required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} placeholder="Ex: Sessão Particular" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Valor (R$)</label>
                  <input type="number" step="0.01" className="form-input" required value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" className="form-input" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-input" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                  <option value="receita">Receita (Entrada)</option>
                  <option value="despesa">Despesa (Saída)</option>
                </select>
              </div>
              {formData.tipo === 'receita' && (
                <div className="form-group">
                  <label className="form-label">Vincular Paciente (Opcional)</label>
                  <select className="form-input" value={formData.pacienteId} onChange={e => setFormData({...formData, pacienteId: e.target.value})}>
                    <option value="">Nenhum</option>
                    {pacientes.map(p => <option key={p._id} value={p._id}>{p.nome}</option>)}
                  </select>
                </div>
              )}
              <footer style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn" style={{ flex: 1, border: '1px solid hsl(var(--border))' }} onClick={() => setIsLancamentoModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Salvar Alterações' : 'Salvar Lançamento'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECIBO */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '3rem', backgroundColor: '#fff', color: '#000' }}>
            <div id="receipt-print" style={{ textAlign: 'center', fontFamily: 'serif', color: '#000' }}>
              <h1 style={{ fontSize: '1.75rem', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2.5rem', color: '#000' }}>Recibo de Pagamento</h1>
              <div style={{ textAlign: 'left', lineHeight: '1.8', fontSize: '1.2rem' }}>
                Recebi de <strong>{selectedTransaction.descricao}</strong>,<br/>
                a importância líquida de <strong>R$ {parseFloat(selectedTransaction.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>,<br/>
                referente a honorários profissionais de psicologia realizados em {new Date(selectedTransaction.data).toLocaleDateString('pt-BR')}.
              </div>
              <div style={{ marginTop: '5rem', borderTop: '1px solid #000', paddingTop: '1rem', display: 'inline-block', minWidth: '300px' }}>
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{settings.nomeClinica || 'Lívia Brito'}</div>
                {settings.crp && !settings.nomeClinica?.includes('CRP') && <div>CRP: {settings.crp}</div>}
                <div style={{ opacity: 0.8 }}>Lauro de Freitas-BA</div>
              </div>
            </div>
            <button className="btn btn-primary no-print" style={{ width: '100%', marginTop: '3rem', backgroundColor: '#000', color: '#fff' }} onClick={() => window.print()}>Imprimir Recibo</button>
          </div>
        </div>
      )}



      {/* MODAL NF-E */}
      {isNFModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNFModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Resumo para Emissão de NF-e</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div className="card" style={{ background: 'hsl(var(--secondary)/0.5)', border: 'none' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>PROFISSIONAL</span>
                <div style={{ fontWeight: '600' }}>{settings.nomeClinica || 'Lívia Brito'}</div>
              </div>
              <div className="card" style={{ background: 'hsl(var(--secondary)/0.5)', border: 'none' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>LOCAL DE PRESTAÇÃO</span>
                <div style={{ fontWeight: '600' }}>Lauro de Freitas-BA</div>
              </div>
              <div className="card" style={{ background: 'hsl(var(--secondary)/0.5)', border: 'none' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>PERÍODO</span>
                <div style={{ fontWeight: '600' }}>{FULL_MONTHS[selectedMonth]} / {selectedYear}</div>
              </div>
              <div className="card" style={{ background: 'hsl(var(--primary)/0.1)', border: '1px solid hsl(var(--primary)/0.2)' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'hsl(var(--primary))' }}>BASE DE CÁLCULO ISS</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setIsNFModalOpen(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
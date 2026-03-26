"use client";

import React, { useState, useEffect } from 'react';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNFModalOpen, setIsNFModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(2026);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/financeiro');
      const data = await response.json();
      setTransacoes(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const periodTransacoes = transacoes.filter(t => {
    const d = new Date(t.data);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totals = periodTransacoes.reduce((acc, t) => {
    const val = parseFloat(t.valor) || 0;
    if (t.tipo === 'receita') acc.entradas += val;
    else acc.saidas += val;
    return acc;
  }, { entradas: 0, saidas: 0 });

  // Função para o botão "Novo Lançamento"
  const handleNovoLancamento = () => {
    setIsModalOpen(true);
    // Aqui você pode adicionar a lógica para abrir seu formulário de cadastro
    console.log("Abrindo formulário de novo lançamento...");
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>Carregando Dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '24px', width: '100%', backgroundColor: '#0f172a', color: 'white' }}>

      <style>{`
        /* KPI CARDS COM MOVIMENTO */
        .kpi-card {
          background-color: #1e293b;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .kpi-card:hover {
          transform: translateY(-8px);
          background-color: #232f45;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
        }
        .kpi-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
        .card-receita::before { background-color: #22c55e; }
        .card-despesa::before { background-color: #ef4444; }
        .card-saldo::before { background-color: #3b82f6; }

        /* BOTÕES */
        .btn-action {
          background-color: #2563eb; color: white; border: none;
          padding: 10px 20px; border-radius: 8px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          transition: all 0.2s;
        }
        .btn-action:hover { background-color: #1d4ed8; transform: translateY(-2px); }
        .btn-action:active { transform: scale(0.95); }

        .btn-outline {
          background-color: transparent; color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 10px 20px; border-radius: 8px; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline:hover { background-color: rgba(255,255,255,0.05); }

        /* ESTILO NF-E PROFISSIONAL (CORREÇÃO MODO ESCURO) */
        .nf-container {
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          width: 100%;
          max-width: 550px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .nf-header { background: #1a2232; padding: 20px; border-bottom: 1px solid #334155; }
        .nf-body { padding: 25px; }
        .nf-field {
          display: flex; justify-content: space-between;
          padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nf-label { color: #94a3b8; font-size: 13px; text-transform: uppercase; font-weight: 500; }
        .nf-value { color: #ffffff !important; font-weight: 600; font-family: 'Courier New', monospace; font-size: 15px; }

        /* RECIBO PARA IMPRESSÃO */
        .modal-recibo-paper {
          background-color: #ffffff !important;
          color: #1e293b !important;
          padding: 50px; border-radius: 8px; width: 100%; max-width: 700px; font-family: serif;
        }
        
        @media print { 
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Gestão Financeira</h1>
          <p style={{ opacity: 0.6 }}>Controle de faturamento e obrigações fiscais.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsNFModalOpen(true)} className="btn-outline">📊 Relatório para NF-e</button>
          <button onClick={handleNovoLancamento} className="btn-action">+ Novo Lançamento</button>
        </div>
      </header>

      {/* FILTROS */}
      <div style={{ marginBottom: '2rem' }}>
        <select
          style={{ background: '#1e293b', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #334155', cursor: 'pointer' }}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="kpi-card card-receita">
          <p style={{ fontSize: '11px', color: '#22c55e', fontWeight: 'bold', letterSpacing: '1px' }}>RECEITA BRUTA</p>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0' }}>R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="kpi-card card-despesa">
          <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', letterSpacing: '1px' }}>DESPESAS</p>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0' }}>R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="kpi-card card-saldo">
          <p style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', letterSpacing: '1px' }}>LUCRO LÍQUIDO</p>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0' }}>R$ {(totals.entradas - totals.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>

      {/* TABELA DE LANÇAMENTOS */}
      <div style={{ background: '#1e293b', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.2)', fontSize: '12px', color: '#94a3b8' }}>
              <th style={{ textAlign: 'left', padding: '15px 20px' }}>PACIENTE / DESCRIÇÃO</th>
              <th style={{ textAlign: 'right', padding: '15px 20px' }}>VALOR</th>
              <th style={{ textAlign: 'center', padding: '15px 20px' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {periodTransacoes.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px 20px' }}>{t.descricao}</td>
                <td style={{ padding: '15px 20px', textAlign: 'right', color: t.tipo === 'receita' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                  {t.tipo === 'receita' ? '+ ' : '- '} R$ {parseFloat(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                  {t.tipo === 'receita' && (
                    <button onClick={() => setSelectedReceipt(t)} className="btn-action" style={{ fontSize: '11px', padding: '6px 14px', margin: '0 auto' }}>📂 Abrir Recibo</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NF-E PROFISSIONAL (ATUALIZADO PARA IMPRESSÃO) */}
      {isNFModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="nf-container">
            <div className="nf-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Consolidado para Emissão de NF-e</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Competência: {MONTHS[selectedMonth]} / {selectedYear}</p>
            </div>

            <div className="nf-body">
              <div className="nf-field"><span className="nf-label">Base de Cálculo (ISS):</span> <span className="nf-value" style={{ color: '#22c55e' }}>R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="nf-field"><span className="nf-label">Código do Serviço:</span> <span className="nf-value">04.03 (Psicologia)</span></div>
              <div className="nf-field"><span className="nf-label">Alíquota Sugerida:</span> <span className="nf-value">2,00 %</span></div>
              <div className="nf-field"><span className="nf-label">Local de Incidência:</span> <span className="nf-value">Lauro de Freitas-BA</span></div>
              <div className="nf-field"><span className="nf-label">Quantidade de Recibos:</span> <span className="nf-value">{periodTransacoes.filter(t => t.tipo === 'receita').length} Unid.</span></div>

              <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                <button onClick={() => window.print()} className="btn-action" style={{ flex: 1, justifyContent: 'center' }}>
                  🖨️ Imprimir Dados
                </button>
                <button onClick={() => setIsNFModalOpen(false)} style={{ flex: 1, background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECIBO (LÍVIA BRITO) */}
      {selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div className="modal-recibo-paper">
            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '10px', textTransform: 'uppercase' }}>Recibo de Pagamento</h2>
            <p style={{ fontSize: '1.2rem', margin: '40px 0', lineHeight: '1.8' }}>
              Recebi de <b>{selectedReceipt.descricao}</b> a importância de <b>R$ {parseFloat(selectedReceipt.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> referente a honorários de serviços profissionais de psicologia.
            </p>
            <p style={{ textAlign: 'right', fontWeight: '600' }}>Lauro de Freitas-BA, {new Date(selectedReceipt.data).toLocaleDateString('pt-BR')}.</p>
            <div style={{ marginTop: '60px', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #1e293b', width: '280px', margin: '0 auto' }}></div>
              <p style={{ margin: '5px 0' }}><b>Lívia Brito</b></p>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>Psicóloga - CRP 03/11748</p>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '40px' }}>
              <button onClick={() => window.print()} className="btn-action" style={{ flex: 1, justifyContent: 'center' }}>Imprimir</button>
              <button onClick={() => setSelectedReceipt(null)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
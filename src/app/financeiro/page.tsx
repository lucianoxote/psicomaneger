"use client";

import React, { useState, useEffect } from 'react';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<any[]>([
    { id: 1, data: '2026-03-25', descricao: 'Sessão Individual', valor: 200, tipo: 'receita' },
    { id: 2, data: '2026-03-24', descricao: 'Sessão Convênio', valor: 350, tipo: 'receita' },
    { id: 3, data: '2026-03-23', descricao: 'Seção Luciano', valor: 200, tipo: 'receita' },
    { id: 4, data: '2026-03-23', descricao: 'Sessão Particular', valor: 200, tipo: 'receita' },
  ]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(2026);

  const [isNFModalOpen, setIsNFModalOpen] = useState(false);
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoTipo, setNovoTipo] = useState('receita');

  const periodTransacoes = transacoes.filter(t => {
    const d = new Date(t.data);
    return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
  });

  const totals = periodTransacoes.reduce((acc, t) => {
    const val = parseFloat(t.valor) || 0;
    t.tipo === 'receita' ? acc.entradas += val : acc.saidas += val;
    return acc;
  }, { entradas: 0, saidas: 0 });

  const handleAbrirNovo = () => {
    setEditingId(null);
    setNovaDescricao('');
    setNovoValor('');
    setNovoTipo('receita');
    setIsLancamentoModalOpen(true);
  };

  const handleAbrirEdicao = (t: any) => {
    setEditingId(t.id);
    setNovaDescricao(t.descricao);
    setNovoValor(t.valor.toString());
    setNovoTipo(t.tipo);
    setIsLancamentoModalOpen(true);
  };

  const handleExcluir = (id: number) => {
    if (confirm("Deseja realmente excluir este lançamento?")) {
      setTransacoes(transacoes.filter(t => t.id !== id));
    }
  };

  const handleSalvarLancamento = () => {
    if (!novaDescricao || !novoValor) return;
    if (editingId) {
      setTransacoes(transacoes.map(t => t.id === editingId ? { ...t, descricao: novaDescricao, valor: parseFloat(novoValor), tipo: novoTipo } : t));
    } else {
      const novoItem = { id: Date.now(), data: new Date().toISOString().split('T')[0], descricao: novaDescricao, valor: parseFloat(novoValor), tipo: novoTipo };
      setTransacoes([novoItem, ...transacoes]);
    }
    setIsLancamentoModalOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px', color: '#fff', background: '#0a0f18' }}>

      <style>{`
        .kpi-card { background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #334155; transition: all 0.3s ease; cursor: default; }
        .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); border-color: #2563eb; }
        .kpi-card h2, .kpi-card span { color: #1e293b !important; }
        
        .btn-blue { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-outline { background: transparent; color: #94a3b8; border: 1px solid #334155; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .btn-outline:hover { background: #1e293b; color: #fff; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        
        /* CORREÇÃO DOS CAMPOS DO MODAL */
        .modal-input { width: 100%; padding: 12px; margin-top: 5px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; color: #1e293b; background: #fff; font-size: 14px; }
        .modal-select { width: 100%; padding: 12px; margin-top: 5px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px; color: #1e293b; background: #fff; font-size: 14px; cursor: pointer; }
        
        /* SELECT DO CABEÇALHO (MANTÉM DARK) */
        .header-select { background: #1e293b; color: #fff; border: 1px solid #334155; padding: 8px; border-radius: 8px; cursor: pointer; }
        
        .action-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 5px; }
        
        @media print { 
          .no-print { display: none !important; } 
          body { background: white !important; color: black !important; }
          .modal-overlay { background: white !important; position: absolute !important; inset: 0 !important; }
          .report-box { border: none !important; box-shadow: none !important; color: black !important; background: white !important; width: 100% !important; }
          .report-box * { color: black !important; }
        }
      `}</style>

      {/* CABEÇALHO */}
      <div className="no-print" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>Gestão Financeira</h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', marginTop: '8px' }}>
          Acompanhe o fluxo de caixa, emita recibos e organize dados para faturamento.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '25px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="header-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="header-select" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.print()} className="btn-outline">🖨️ Imprimir PDF</button>
            <button onClick={() => setIsNFModalOpen(true)} className="btn-outline">📊 Dados NF-e</button>
            <button onClick={handleAbrirNovo} className="btn-blue">+ Novo Lançamento</button>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="kpi-card" style={{ borderLeft: '5px solid #10b981' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981' }}>RECEITAS</span>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '28px' }}>R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="kpi-card" style={{ borderLeft: '5px solid #ef4444' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444' }}>DESPESAS</span>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '28px' }}>R$ {totals.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="kpi-card" style={{ borderLeft: '5px solid #3b82f6' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#3b82f6' }}>SALDO</span>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '28px' }}>R$ {(totals.entradas - totals.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>

      {/* TABELA */}
      <div className="kpi-card no-print" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1e293b' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', fontSize: '12px' }}>
              <th style={{ padding: '15px' }}>DESCRIÇÃO</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>VALOR</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {periodTransacoes.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px', fontWeight: '500' }}>{t.descricao}</td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: t.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                  {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '15px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button onClick={() => handleAbrirEdicao(t)} className="action-btn">✏️</button>
                  <button onClick={() => handleExcluir(t.id)} className="action-btn">🗑️</button>
                  <button onClick={() => setSelectedTransaction(t)} className="btn-blue" style={{ fontSize: '10px', padding: '4px 8px' }}>Recibo</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVO/EDITAR (VISIBILIDADE CORRIGIDA) */}
      {isLancamentoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLancamentoModalOpen(false)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#1e293b', marginBottom: '20px', fontWeight: 'bold' }}>{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>

            <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>DESCRIÇÃO</label>
            <input className="modal-input" type="text" value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} placeholder="Ex: Sessão Particular" />

            <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>VALOR R$</label>
            <input className="modal-input" type="number" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder="0.00" />

            <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>TIPO DE LANÇAMENTO</label>
            <select className="modal-select" value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)}>
              <option value="receita">Receita (Entrada)</option>
              <option value="despesa">Despesa (Saída)</option>
            </select>

            <button className="btn-blue" style={{ width: '100%', padding: '14px' }} onClick={handleSalvarLancamento}>
              {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DADOS NF-e (RESTAURADO COMPLETO) */}
      {isNFModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNFModalOpen(false)}>
          <div className="report-box" style={{ background: '#1e293b', padding: '40px', borderRadius: '16px', width: '500px', border: '1px solid #334155' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#fff' }}>Relatório de Faturamento</h2>
            <p style={{ color: '#94a3b8', marginBottom: '25px' }}>{MONTHS[selectedMonth]} / {selectedYear}</p>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '25px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>BASE DE CÁLCULO ISS (TOTAL RECEITAS)</span>
              <h2 style={{ color: '#10b981', margin: 0, fontSize: '32px' }}>R$ {totals.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>

            <div style={{ color: '#fff', fontSize: '14px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8' }}>Prestadora:</span> <b>Lívia Brito</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                <span style={{ color: '#94a3b8' }}>Município:</span> <b>Lauro de Freitas-BA</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: '#94a3b8' }}>Qtd. Atendimentos:</span> <b>{periodTransacoes.filter(t => t.tipo === 'receita').length}</b>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Imprimir</button>
              <button className="btn-blue" style={{ flex: 1 }} onClick={() => setIsNFModalOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECIBO (MANTIDO) */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="report-box" style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '600px', color: '#1e293b' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '10px' }}>RECIBO</h2>
            <p style={{ fontSize: '18px', margin: '30px 0' }}>Recebi de <b>{selectedTransaction.descricao}</b> o valor de <b>R$ {selectedTransaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b> referente a serviços profissionais.</p>
            <button className="btn-blue" style={{ width: '100%' }} onClick={() => setSelectedTransaction(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
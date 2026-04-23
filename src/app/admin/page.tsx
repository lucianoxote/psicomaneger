"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Detect dark mode for chart colors
  const [isDark, setIsDark] = useState(false);
  
  // Subscription management
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [subForm, setSubForm] = useState({ plan: '', subscriptionStatus: '' });
  const [savingSub, setSavingSub] = useState(false);

  // Security Logs
  const [activeTab, setActiveTab] = useState<'metrics' | 'security'>('metrics');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated' && session?.user?.email !== 'lucianoxote@hotmail.com') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetchMetrics();
      fetchLogs();
      fetchBackups();
    }
  }, [status, session, router]);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await fetch('/api/admin/backups', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleRestore = async (url: string, date: string) => {
    const confirm1 = confirm(`[ATENÇÃO] Você está prestes a restaurar o banco de dados para o estado de ${date}. ISSO APAGARÁ TODOS OS DADOS ATUAIS. Deseja continuar?`);
    if (!confirm1) return;

    const confirm2 = confirm(`[CONFIRMAÇÃO FINAL] Tem certeza absoluta? Esta ação não pode ser desfeita.`);
    if (!confirm2) return;

    setIsRestoring(true);
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupUrl: url })
      });

      if (res.ok) {
        alert('✅ Restauração concluída com sucesso! O sistema foi atualizado.');
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`❌ Erro na restauração: ${data.error}`);
      }
    } catch (e) {
      alert('❌ Erro de conexão ao tentar restaurar.');
    } finally {
      setIsRestoring(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/admin/audit-logs', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/metrics', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setTenants(data.tenants);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`TEM CERTEZA? Isso excluirá permanentemente a conta de "${name}" E TODOS os seus dados (pacientes, agendas, etc). Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    if (!confirm(`CONFIRMAÇÃO FINAL: Deseja mesmo deletar todos os dados de "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/register?id=${id}`, { 
        method: 'DELETE',
        cache: 'no-store'
      });
      if (res.ok) {
        fetchMetrics();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir usuário.');
      }
    } catch (e) {
      alert('Erro de rede ao tentar excluir.');
    }
  };

  const handleEditSubscription = (user: any) => {
    setSelectedUser(user);
    setSubForm({
      plan: user.plan || 'Trial',
      subscriptionStatus: user.subscriptionStatus || 'Ativo'
    });
    setIsSubModalOpen(true);
  };

  const handleSaveSubscription = async () => {
    setSavingSub(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          plan: subForm.plan,
          subscriptionStatus: subForm.subscriptionStatus
        })
      });
      if (res.ok) {
        setIsSubModalOpen(false);
        alert('Assinatura atualizada com sucesso!');
        fetchMetrics();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar');
      }
    } catch (e) {
      alert('Erro de conexão');
    } finally {
      setSavingSub(false);
    }
  };

  const val = (v?: number) => loading ? '--' : (v ?? 0);
  const isLoading = loading || status === 'loading';

  const calculateRevenue = () => {
    if (!metrics?.plans) return 0;
    const plusCount = metrics.plans.find((p: any) => p.name === 'Plus')?.value || 0;
    const proCount = metrics.plans.find((p: any) => p.name === 'Pro')?.value || 0;
    return (plusCount * 50) + (proCount * 100);
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.clinica || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = [
    { name: 'Clínicas', count: metrics?.totalUsers ?? 0 },
    { name: 'Pacientes', count: metrics?.totalPacientes ?? 0 },
    { name: 'Sessões', count: metrics?.totalAgendamentos ?? 0 },
  ];
  const planData = metrics?.plans || [];
  const engagementData = [
    { name: 'Recentes', value: metrics?.atendimentosMensais ?? 0 },
    { name: 'Histórico', value: (metrics?.totalAgendamentos ?? 0) - (metrics?.atendimentosMensais ?? 0) }
  ];

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B'];
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = isDark
    ? { backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' };
  const pieGray = isDark ? '#334155' : '#CBD5E1';

  return <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .admin-page-init {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .interactive-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
        }
        .interactive-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
          border-color: rgba(var(--primary), 0.3) !important;
        }
        .dark .interactive-card:hover {
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5);
          background: hsl(var(--card)/0.8) !important;
        }
        .refresh-btn {
          transition: all 0.2s ease;
        }
        .refresh-btn:hover {
          transform: rotate(30deg) scale(1.1);
          background: hsl(var(--secondary)) !important;
        }
        .refresh-btn:active {
          transform: rotate(180deg) scale(0.9);
        }
        .table-row {
          transition: background 0.2s ease;
        }
        .table-row:hover {
          background: hsl(var(--primary)/0.03) !important;
        }
        .dark .table-row:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
           background: hsl(var(--card)); border: 1px solid hsl(var(--border));
           border-radius: 20px; padding: 2rem; width: 100%; max-width: 400px;
           box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>

      {/* Header */}
      <div className="admin-page-init" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>
            Painel de Comando SaaS
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
            Visão global em tempo real da plataforma Sinapsi Gestor
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--secondary)/0.5)', padding: '0.4rem', borderRadius: '12px' }}>
          <button 
            onClick={() => setActiveTab('metrics')}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'metrics' ? 'hsl(var(--card))' : 'transparent',
              color: activeTab === 'metrics' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              fontWeight: 600, fontSize: '0.85rem', boxShadow: activeTab === 'metrics' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            📊 Métricas SaaS
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'security' ? 'hsl(var(--card))' : 'transparent',
              color: activeTab === 'security' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              fontWeight: 600, fontSize: '0.85rem', boxShadow: activeTab === 'security' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            🛡️ Segurança
          </button>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'metrics') fetchMetrics();
            else { fetchLogs(); fetchBackups(); }
          }}
          disabled={isLoading}
          className="refresh-btn"
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '10px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            cursor: 'pointer',
            fontSize: '1.2rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          🔄
        </button>
      </div>

      {activeTab === 'metrics' ? (
        <>
      {/* ── Metric Cards ── */}
      <div className="admin-page-init" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', animationDelay: '0.1s' }}>
        {[
          { label: 'Clínicas Ativas', value: val(metrics?.totalUsers), icon: '🏥', color: '#3B82F6', pct: '75%', sub: '↑ 12% vs mês anterior' },
          { label: 'Pacientes',       value: val(metrics?.totalPacientes), icon: '👥', color: '#10B981', pct: '68%', sub: '↑ 8% vs mês anterior' },
          { label: 'Sessões Totais',  value: val(metrics?.totalAgendamentos), icon: '📋', color: '#F59E0B', pct: '82%', sub: '↑ 15% vs mês anterior' },
          { label: 'Este Mês',        value: val(metrics?.atendimentosMensais), icon: '⚡', color: '#8B5CF6', pct: '90%', sub: 'Em crescimento contínuo' },
        ].map((card) => (
          <div key={card.label} className="interactive-card" style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '18px',
            padding: '1.5rem',
            borderTop: `4px solid ${card.color}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '2.6rem', fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {card.value}
                </p>
              </div>
              <div style={{ fontSize: '1.75rem', opacity: 0.8, background: `${card.color}15`, padding: '0.5rem', borderRadius: '12px' }}>{card.icon}</div>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.78rem', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
            <div style={{ marginTop: '0.8rem', height: '6px', borderRadius: '99px', background: 'hsl(var(--secondary))', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '99px', background: card.color, width: card.pct, transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            </div>
          </div>
        ))}
        
        {/* Card de Faturamento Especial */}
        <div className="interactive-card" style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #3B82F6 100%)',
          borderRadius: '18px',
          padding: '1.5rem',
          boxShadow: '0 8px 16px -4px hsla(var(--primary), 0.3)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.9, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Faturamento Est.
              </p>
              <p style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                R$ {calculateRevenue()}
              </p>
            </div>
            <div style={{ fontSize: '1.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '12px' }}>💹</div>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>Receita mensal projetada (Plus/Pro)</p>
          <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.2)', height: '1px' }} />
          <p style={{ marginTop: '0.5rem', fontSize: '0.65rem', opacity: 0.8 }}>Base: Plus R$50 | Pro R$100</p>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="admin-page-init" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', animationDelay: '0.2s' }}>
        {/* Bar Chart */}
        <div className="interactive-card" style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          padding: '1.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Crescimento da Plataforma</h3>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Estatísticas gerais de uso</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {chartColors.map((c, i) => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />)}
            </div>
          </div>
          {isLoading ? (
            <div style={{ height: '260px', background: 'hsl(var(--secondary))', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridColor} opacity={0.4} />
                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600, marginBottom: '6px' }}
                  itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a', padding: '2px 0' }}
                  formatter={(v) => [`${v} registros`, '']}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="interactive-card" style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          padding: '1.75rem',
          display: 'flex', flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Engajamento</h3>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.25rem' }}>Consultas ativas</p>
          {isLoading ? (
            <div style={{ flex: 1, background: 'hsl(var(--secondary))', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={engagementData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
                    {engagementData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10B981' : pieGray} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}
                    itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                    formatter={(v) => [`${v} sessões`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontWeight: 700 }}>Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>{val(metrics?.totalAgendamentos)}</p>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '1.5rem' }}>
            <div style={{
              background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}`,
              borderRadius: '12px', padding: '0.85rem', textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#6ee7b7' : '#059669', marginBottom: '0.25rem' }}>Recentes</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: isDark ? '#6ee7b7' : '#059669' }}>{val(metrics?.atendimentosMensais)}</p>
            </div>
            <div style={{
              background: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(71,85,105,0.05)',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px', padding: '0.85rem', textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Histórico</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>
                {val((metrics?.totalAgendamentos ?? 0) - (metrics?.atendimentosMensais ?? 0))}
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent Activity Log */}
        <div className="interactive-card" style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          padding: '1.75rem',
          display: 'flex', flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '1.25rem' }}>Atividades Recentes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {metrics?.activities?.map((act: any, idx: number) => (
              <div key={idx} style={{ 
                display: 'flex', 
                gap: '0.85rem', 
                paddingBottom: '1rem', 
                borderBottom: idx === metrics.activities.length - 1 ? 'none' : '1px solid hsl(var(--border)/0.5)',
                animation: `fadeIn 0.5s ease forwards ${idx * 0.1}s`,
                opacity: 0
              }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  backgroundColor: act.type === 'signup' ? '#2563EB' : '#7C3AED',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  boxShadow: `0 4px 12px ${act.type === 'signup' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(124, 58, 237, 0.3)'}`
                }}>
                  {act.type === 'signup' ? '👤' : '👥'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{act.label}</p>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{act.details}</p>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                  {new Date(act.time).toLocaleDateString()}
                </div>
              </div>
            )) || <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>Nenhuma atividade recente.</p>}
          </div>
        </div>
      </div>

      {/* ── Tenants Table ── */}
      <div className="admin-page-init" style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '20px',
        padding: '1.75rem',
        animationDelay: '0.3s'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Clientes Ativos</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Profissionais e Clínicas na plataforma</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              <input 
                type="text" 
                placeholder="Buscar cliente ou clínica..." 
                className="form-input"
                style={{ 
                  paddingLeft: '2.2rem', 
                  fontSize: '0.85rem', 
                  width: '260px',
                  height: '38px',
                  background: 'hsl(var(--secondary)/0.5)'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span style={{
              background: 'hsl(var(--primary)/0.1)',
              color: 'hsl(var(--primary))',
              fontSize: '0.8rem', fontWeight: 700,
              padding: '0.4rem 0.9rem', borderRadius: '99px',
              border: '1px solid hsl(var(--primary)/0.2)'
            }}>
              {isLoading ? 'Carregando...' : `${tenants.length} registros totais`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'hsl(var(--muted-foreground))' }}>
            <div className="admin-spinner" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--primary)/0.2)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 500 }}>Sincronizando dados...</p>
          </div>
        ) : tenants.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
              <thead>
                <tr>
                  {['CLÍNICA', 'RESPONSÁVEL', 'PLANO / STATUS', 'PACIENTES', 'CONTATO', 'AÇÕES'].map(h => (
                    <th key={h} style={{ padding: '0 1rem 0.75rem', textAlign: (h === 'PLANO / STATUS' || h === 'AÇÕES' || h === 'CONTATO') ? 'center' : 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td style={{ padding: '0.85rem 1rem', borderRadius: '12px 0 0 12px', border: '1px solid hsl(var(--border))', borderRight: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, hsl(var(--primary)/0.2) 0%, hsl(var(--primary)/0.05) 100%)',
                          color: 'hsl(var(--primary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '1rem', flexShrink: 0,
                          boxShadow: 'inset 0 0 0 1px hsl(var(--primary)/0.1)'
                        }}>
                          {t.clinica?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: '0.95rem' }}>{t.clinica}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRight: 'none', color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                      <div>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 400 }}>{t.email}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRight: 'none', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', fontWeight: 700,
                            color: t.plan === 'Pro' ? '#F59E0B' : t.plan === 'Plus' ? '#3B82F6' : t.plan === 'Trial' ? '#8B5CF6' : 'inherit'
                          }}>
                            {t.plan.toUpperCase()}
                          </span>
                          {t.plan === 'Trial' && t.trialEndsAt && (
                            <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: 700 }}>
                              ({Math.ceil((new Date(t.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))}d)
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '99px',
                          background: t.status === 'Ativo' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: t.status === 'Ativo' ? '#10B981' : '#EF4444',
                          border: `1px solid ${t.status === 'Ativo' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRight: 'none', textAlign: 'center' }}>
                      <span style={{
                        background: 'hsl(var(--primary)/0.1)',
                        color: 'hsl(var(--primary))',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '99px',
                        fontWeight: 800, fontSize: '0.85rem',
                        border: '1px solid hsl(var(--primary)/0.15)'
                      }}>{t.pacientes}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRight: 'none', textAlign: 'center' }}>
                      {t.telefone ? (
                        <a 
                          href={`https://wa.me/55${t.telefone.replace(/\D/g, '')}`} 
                          target="_blank"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#25D366', color: 'white', textDecoration: 'none',
                            fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)',
                            transition: 'all 0.2s ease'
                          }}
                          className="action-btn-hover"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.886.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.89 4.44-9.892 9.886-.001 2.125.593 3.456 1.574 5.111l-.973 3.548 3.693-.969zm11.366-7.401c-.157-.263-.58-.419-1.229-.744-.648-.324-3.822-1.887-4.413-2.103-.592-.215-1.023-.324-1.45.324-.426.649-1.646 2.054-2.02 2.486-.372.433-.744.487-1.393.162-.648-.324-2.738-1.008-5.213-3.213-1.926-1.716-3.225-3.839-3.601-4.488-.377-.649-.039-.999.285-1.323.291-.291.648-.756.973-1.134.324-.378.432-.648.648-1.08.216-.432.108-.81-.054-1.135-.162-.324-1.45-3.513-1.986-4.811-.531-1.269-.991-1.095-1.359-1.114-.351-.017-.756-.021-1.161-.021-.406 0-1.067.152-1.621.756-.554.604-2.108 2.054-2.108 5.001 0 2.946 2.108 5.784 2.405 6.189.297.405 4.149 6.336 10.05 8.887 1.403.607 2.498.969 3.35 1.24.408.13.778.112 1.071.068.328-.049 1.01-.413 1.153-.811.144-.399.144-.741.101-.811-.043-.07-.157-.113-.314-.263z"/>
                          </svg>
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', opacity: 0.3 }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', borderRadius: '0 12px 12px 0', border: '1px solid hsl(var(--border))', borderLeft: 'none', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditSubscription(t)}
                          style={{
                             background: 'none', border: 'none', cursor: 'pointer',
                             fontSize: '1.2rem', padding: '0.4rem', borderRadius: '8px',
                             transition: 'all 0.2s ease', color: 'hsl(var(--primary))'
                          }}
                          title="Alterar Plano/Status"
                          className="action-btn-hover"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteUser(t.id, t.name)}
                          style={{
                             background: 'none', border: 'none', cursor: 'pointer',
                             fontSize: '1.2rem', padding: '0.4rem', borderRadius: '8px',
                             transition: 'all 0.2s ease', color: 'hsl(var(--destructive))',
                             opacity: (t.email === 'lucianoxote@hotmail.com' || t.email === 'psi.liviabrito@gmail.com') ? 0.2 : 1,
                          }}
                          disabled={t.email === 'lucianoxote@hotmail.com' || t.email === 'psi.liviabrito@gmail.com'}
                          title="Excluir Definitivamente"
                          className="delete-btn-hover"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'hsl(var(--muted-foreground))' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Nenhuma clínica operando no momento.</p>
          </div>
        )}
      </div>
      </>
      ) : (
        <>
        {/* ── Security Logs Tab ── */}
        <div className="admin-page-init" style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          padding: '1.75rem',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>Registros de Segurança (Auditoria)</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Ações críticas realizadas por todos os usuários em tempo real</p>
          </div>

          {loadingLogs ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
               <div className="admin-spinner" style={{ width: '40px', height: '40px', border: '4px solid hsl(var(--primary)/0.2)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
               <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>Sincronizando registros de auditoria...</p>
            </div>
          ) : logs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    {['DATA/HORA', 'USUÁRIO', 'AÇÃO', 'DETALHES'].map(h => (
                      <th key={h} style={{ padding: '0 1rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="table-row">
                      <td style={{ padding: '1rem', border: '1px solid hsl(var(--border))', borderRight: 'none', borderRadius: '12px 0 0 12px', fontSize: '0.85rem', color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td style={{ padding: '1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRight: 'none', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{log.userEmail}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>ID: {log.userId}</div>
                      </td>
                      <td style={{ padding: '1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRight: 'none', textAlign: 'left' }}>
                        <span style={{ 
                          fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '6px',
                          background: log.action === 'DELETE' ? 'rgba(239,68,68,0.1)' : log.action === 'UPDATE' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                          color: log.action === 'DELETE' ? '#EF4444' : log.action === 'UPDATE' ? '#3B82F6' : '#10B981',
                          border: `1px solid ${log.action === 'DELETE' ? 'rgba(239,68,68,0.2)' : log.action === 'UPDATE' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRadius: '0 12px 12px 0', fontSize: '0.9rem', color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
               <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
               <p>Nenhum registro de segurança encontrado ainda.</p>
             </div>
          )}
        </div>

        {/* ── Backups Vault Section ── */}
        <div className="admin-page-init" style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          padding: '1.75rem',
          marginTop: '1.5rem',
          borderTop: '4px solid #EF4444'
        }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>Cofre de Backups (Maquina do Tempo)</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Pontos de restauracao semanais salvos no Vercel Blob</p>
            </div>
            <div style={{ fontSize: '2rem' }}>⏳</div>
          </div>

          {loadingBackups ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
               <div className="admin-spinner" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--primary)/0.2)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            </div>
          ) : backups.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                <thead>
                  <tr>
                    {['DATA DO BACKUP', 'TAMANHO', 'AÇÃO DE EMERGÊNCIA'].map(h => (
                      <th key={h} style={{ padding: '0 1rem 0.75rem', textAlign: h === 'AÇÃO DE EMERGÊNCIA' ? 'center' : 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => {
                    const dateStr = new Date(b.uploadedAt).toLocaleString('pt-BR');
                    return (
                      <tr key={b.url} className="table-row">
                        <td style={{ padding: '1rem', border: '1px solid hsl(var(--border))', borderRight: 'none', borderRadius: '12px 0 0 12px', fontSize: '0.9rem', color: 'hsl(var(--foreground))', fontWeight: 600 }}>
                          [B] {dateStr}
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRight: 'none', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                          {(b.size / 1024).toFixed(1)} KB
                        </td>
                        <td style={{ padding: '1rem', border: '1px solid hsl(var(--border))', borderLeft: 'none', borderRadius: '0 12px 12px 0', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRestore(b.url, dateStr)}
                            disabled={isRestoring}
                            style={{
                              background: '#EF4444',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: isRestoring ? 'not-allowed' : 'pointer',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                              opacity: isRestoring ? 0.5 : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => !isRestoring && (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => !isRestoring && (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            {isRestoring ? 'RESTAURANDO...' : '[!] RESTAURAR ESTE PONTO'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
              <p>Nenhum ponto de restauração encontrado no cofre.</p>
            </div>
          )}
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
              AVISO: A restauracao e um processo irreversivel que substitui todos os dados atuais pelos dados do backup selecionado. Use com extrema cautela.
            </p>
          </div>
        </div>
        </>
      )}

      <style>{`
        .delete-btn-hover:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          transform: scale(1.1);
        }
        .action-btn-hover:hover {
          background: hsla(var(--primary), 0.1) !important;
          transform: scale(1.1);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Modal Gestão de Assinatura ── */}
      {isSubModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSubModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Gestão de Assinatura</h2>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Alterando conta de: <b>{selectedUser?.name}</b>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Plano</label>
                <select 
                  className="form-input" 
                  value={subForm.plan}
                  onChange={e => setSubForm({...subForm, plan: e.target.value})}
                >
                  <option value="Gratuito">Gratuito</option>
                  <option value="Trial">Trial (15 dias)</option>
                  <option value="Plus">Plus (Intermediário)</option>
                  <option value="Pro">Pro (Completo)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status da Assinatura</label>
                <select 
                  className="form-input" 
                  value={subForm.subscriptionStatus}
                  onChange={e => setSubForm({...subForm, subscriptionStatus: e.target.value})}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Vencido">Vencido</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  className="btn" 
                  style={{ flex: 1, border: '1px solid hsl(var(--border))' }}
                  onClick={() => setIsSubModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={handleSaveSubscription}
                  disabled={savingSub}
                >
                  {savingSub ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ;
}

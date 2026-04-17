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
  // Detect dark mode for chart colors
  const [isDark, setIsDark] = useState(false);

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
    if (status === 'authenticated') fetchMetrics();
  }, [status, session, router]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/metrics');
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
      const res = await fetch(`/api/auth/register?id=${id}`, { method: 'DELETE' });
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

  const val = (v?: number) => loading ? '--' : (v ?? 0);
  const isLoading = loading || status === 'loading';

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
  // Dynamic chart colors based on theme
  const gridColor     = isDark ? '#334155' : '#e2e8f0';
  const tickColor     = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle  = isDark
    ? { backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' };
  const pieGray       = isDark ? '#334155' : '#CBD5E1';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
      `}</style>

      {/* ── Header ── */}
      <div className="admin-page-init" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>
            Painel de Comando SaaS
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
            Visão global em tempo real da plataforma SynaPSIS
          </p>
        </div>
        <button
          onClick={fetchMetrics}
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

        {/* Plan Distribution Chart */}
        <div className="interactive-card" style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          padding: '1.75rem',
          display: 'flex', flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Distribuição de Planos</h3>
          <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.25rem' }}>Perfil comercial</p>
          {isLoading ? (
            <div style={{ flex: 1, background: 'hsl(var(--secondary))', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
                    {planData.map((p: any, i: number) => {
                      const colors: any = { 'Trial': '#8B5CF6', 'Plus': '#3B82F6', 'Pro': '#F59E0B', 'Gratuito': '#64748b' };
                      return <Cell key={i} fill={colors[p.name] || '#64748b'} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}
                    itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                    formatter={(v) => [`${v} usuários`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>{planData.length}</p>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontWeight: 700 }}>Tiers</p>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
            {planData.map((p: any) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.name === 'Trial' ? '#8B5CF6' : p.name === 'Plus' ? '#3B82F6' : p.name === 'Pro' ? '#F59E0B' : '#64748b' }} />
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{p.name}: <b>{p.value}</b></span>
              </div>
            ))}
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
          <span style={{
            background: 'hsl(var(--primary)/0.1)',
            color: 'hsl(var(--primary))',
            fontSize: '0.8rem', fontWeight: 700,
            padding: '0.4rem 0.9rem', borderRadius: '99px',
            border: '1px solid hsl(var(--primary)/0.2)'
          }}>
            {isLoading ? 'Carregando...' : `${tenants.length} registros ativos`}
          </span>
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
                  {['CLÍNICA', 'RESPONSÁVEL', 'PLANO / STATUS', 'PACIENTES', 'AÇÕES'].map(h => (
                    <th key={h} style={{ padding: h === 'AÇÕES' ? '0 1rem 0.75rem' : '0 1rem 0.75rem', textAlign: (h === 'PLANO / STATUS' || h === 'AÇÕES') ? 'center' : 'left', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
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
                        <span style={{ 
                          fontSize: '0.75rem', fontWeight: 700, px: '0.5rem', borderRadius: '4px',
                          color: t.plan === 'Pro' ? '#F59E0B' : t.plan === 'Plus' ? '#3B82F6' : t.plan === 'Trial' ? '#8B5CF6' : 'inherit'
                        }}>
                          {t.plan.toUpperCase()}
                        </span>
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
                    <td style={{ padding: '0.85rem 1rem', borderRadius: '0 12px 12px 0', border: '1px solid hsl(var(--border))', borderLeft: 'none', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteUser(t.id, t.name)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '1.2rem', padding: '0.4rem', borderRadius: '8px',
                          transition: 'all 0.2s ease', color: 'hsl(var(--destructive))',
                          opacity: t.email === 'lucianoxote@hotmail.com' ? 0.2 : 1,
                        }}
                        disabled={t.email === 'lucianoxote@hotmail.com'}
                        title="Excluir Definitivamente"
                        className="delete-btn-hover"
                      >
                        🗑️
                      </button>
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

      <style>{`
        .delete-btn-hover:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          transform: scale(1.1);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

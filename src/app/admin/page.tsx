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

  const val = (v?: number) => loading ? '--' : (v ?? 0);
  const isLoading = loading || status === 'loading';

  const chartData = [
    { name: 'Clínicas', count: metrics?.totalUsers ?? 0 },
    { name: 'Pacientes', count: metrics?.totalPacientes ?? 0 },
    { name: 'Sessões', count: metrics?.totalAgendamentos ?? 0 },
  ];
  const pieData = [
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
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>
            Painel de Comando SaaS
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
            Visão global em tempo real da plataforma SynaPSIS
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={isLoading}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            cursor: 'pointer',
            fontSize: '1.1rem'
          }}
        >
          🔄
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Clínicas Ativas', value: val(metrics?.totalUsers), icon: '🏥', color: '#3B82F6', pct: '75%', sub: '↑ 12% vs mês anterior' },
          { label: 'Pacientes',       value: val(metrics?.totalPacientes), icon: '👥', color: '#10B981', pct: '68%', sub: '↑ 8% vs mês anterior' },
          { label: 'Sessões Totais',  value: val(metrics?.totalAgendamentos), icon: '📋', color: '#F59E0B', pct: '82%', sub: '↑ 15% vs mês anterior' },
          { label: 'Este Mês',        value: val(metrics?.atendimentosMensais), icon: '⚡', color: '#8B5CF6', pct: '90%', sub: 'Em crescimento contínuo' },
        ].map((card) => (
          <div key={card.label} style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1 }}>
                  {card.value}
                </p>
              </div>
              <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{card.sub}</p>
            <div style={{ marginTop: '0.75rem', height: '5px', borderRadius: '99px', background: 'hsl(var(--border))' }}>
              <div style={{ height: '100%', borderRadius: '99px', background: card.color, width: card.pct, transition: 'width 1s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Bar Chart */}
        <div style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '16px',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>Crescimento da Plataforma</h3>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.25rem' }}>Estatísticas gerais</p>
          {isLoading ? (
            <div style={{ height: '260px', background: 'hsl(var(--border))', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.6} />
                <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v} registros`, '']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex', flexDirection: 'column',
        }}>
          <h3 style={{ fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>Engajamento</h3>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.75rem' }}>Recentes vs histórico</p>
          {isLoading ? (
            <div style={{ flex: 1, background: 'hsl(var(--border))', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10B981' : pieGray} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} sessões`, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            {[
              { label: 'Recentes', value: val(metrics?.atendimentosMensais), bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
              { label: 'Histórico', value: val((metrics?.totalAgendamentos ?? 0) - (metrics?.atendimentosMensais ?? 0)), bg: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' },
            ].map(card => (
              <div key={card.label} style={{ background: card.bg, borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{card.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tenants Table ── */}
      <div style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '16px',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Clientes Ativos</h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Profissionais da plataforma</p>
          </div>
          <span style={{
            background: 'hsl(var(--primary)/0.1)',
            color: 'hsl(var(--primary))',
            fontSize: '0.75rem', fontWeight: 600,
            padding: '0.3rem 0.75rem', borderRadius: '99px'
          }}>
            {isLoading ? '...' : `${tenants.length} registros`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Buscando...</div>
        ) : tenants.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['CLÍNICA', 'RESPONSÁVEL', 'E-MAIL', 'PACIENTES'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < tenants.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'hsl(var(--primary)/0.15)',
                        color: 'hsl(var(--primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                      }}>
                        {t.clinica?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{t.clinica}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--foreground))' }}>{t.name}</td>
                    <td style={{ padding: '1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>{t.email}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        background: 'hsl(var(--primary)/0.1)',
                        color: 'hsl(var(--primary))',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '99px',
                        fontWeight: 700, fontSize: '0.8rem'
                      }}>{t.pacientes}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>
            Nenhum profissional encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

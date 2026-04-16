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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.email !== 'lucianoxote@hotmail.com') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchMetrics();
    }
  }, [status, session, router]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setTenants(data.tenants);
        setLastUpdatedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      } else {
        console.error('Failed to fetch metrics');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (value: number | undefined) => {
    if (loading) return '--';
    return value ?? 0;
  };

  const isLoading = loading || status === 'loading';
  const showLoadingTag = isLoading;

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

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <section className="dashboard-header">
          <div className="dashboard-title-bar">
            <div className="dashboard-badge-icon">📊</div>
            <div>
              <h1>Painel de Comando</h1>
              <p>Visão global em tempo real da plataforma SynaPSIS</p>
            </div>
          </div>
          <button
            type="button"
            className="dashboard-pill dashboard-refresh-button"
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Carregando...' : lastUpdatedAt ? `🔄 Atualizado às ${lastUpdatedAt}` : '🔄 Atualizar agora'}
          </button>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card dashboard-card-blue">
            <div className="card-top">
              <div>
                <p className="card-label">Clínicas Ativas</p>
                <h2 className={isLoading ? 'skeleton-text skeleton-number' : ''}>{displayValue(metrics?.totalUsers)}</h2>
              </div>
              <div className="card-icon">🏥</div>
            </div>
            <p className={`card-small ${isLoading ? 'skeleton-text skeleton-small' : ''}`}>{isLoading ? ' ' : '↑ 12% vs mês anterior'}</p>
            <div className="card-progress"><span className="progress-fill blue" style={{ width: isLoading ? '20%' : '75%' }} /></div>
          </article>

          <article className="dashboard-card dashboard-card-green">
            <div className="card-top">
              <div>
                <p className="card-label">Pacientes</p>
                <h2 className={isLoading ? 'skeleton-text skeleton-number' : ''}>{displayValue(metrics?.totalPacientes)}</h2>
              </div>
              <div className="card-icon">👥</div>
            </div>
            <p className={`card-small ${isLoading ? 'skeleton-text skeleton-small' : ''}`}>{isLoading ? ' ' : '↑ 8% vs mês anterior'}</p>
            <div className="card-progress"><span className="progress-fill green" style={{ width: isLoading ? '20%' : '68%' }} /></div>
          </article>

          <article className="dashboard-card dashboard-card-amber">
            <div className="card-top">
              <div>
                <p className="card-label">Sessões Totais</p>
                <h2 className={isLoading ? 'skeleton-text skeleton-number' : ''}>{displayValue(metrics?.totalAgendamentos)}</h2>
              </div>
              <div className="card-icon">📋</div>
            </div>
            <p className={`card-small ${isLoading ? 'skeleton-text skeleton-small' : ''}`}>{isLoading ? ' ' : '↑ 15% vs mês anterior'}</p>
            <div className="card-progress"><span className="progress-fill amber" style={{ width: isLoading ? '20%' : '82%' }} /></div>
          </article>

          <article className="dashboard-card dashboard-card-purple">
            <div className="card-top">
              <div>
                <p className="card-label">Este Mês</p>
                <h2 className={isLoading ? 'skeleton-text skeleton-number' : ''}>{displayValue(metrics?.atendimentosMensais)}</h2>
              </div>
              <div className="card-icon">⚡</div>
            </div>
            <p className={`card-small ${isLoading ? 'skeleton-text skeleton-small' : ''}`}>{isLoading ? ' ' : 'Em crescimento contínuo'}</p>
            <div className="card-progress"><span className="progress-fill purple" style={{ width: isLoading ? '20%' : '90%' }} /></div>
          </article>
        </section>

        <section className="dashboard-chart-grid">
          <article className="dashboard-card dashboard-chart-card">
            <div className="chart-card-heading">
              <div>
                <h3>Crescimento da Plataforma</h3>
                <p>Estatísticas gerais</p>
              </div>
              <div className="chart-labels">
                <span className="chart-dot blue" />
                <span className="chart-dot green" />
                <span className="chart-dot amber" />
              </div>
            </div>
            <div className="chart-wrapper">
              {isLoading ? (
                <div className="chart-skeleton" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 10 }}>
                  <defs>
                    <linearGradient id="heroGradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value) => `${value} registros`}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="url(#heroGradient1)">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            </div>
          </article>

          <article className="dashboard-card dashboard-chart-card">
            <div>
              <h3>Engajamento de Sessões</h3>
              <p>Consultas recentes vs histórico</p>
            </div>
            <div className="chart-small-wrapper">
              {isLoading ? (
                <div className="chart-skeleton small" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#CBD5E1'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(value) => `${value} sessões`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="engagement-grid">
              <div className="engagement-card engagement-card-positive">
                <span>Recentes</span>
                <strong>{displayValue(metrics?.atendimentosMensais)}</strong>
              </div>
              <div className="engagement-card">
                <span>Histórico</span>
                <strong>{displayValue((metrics?.totalAgendamentos ?? 0) - (metrics?.atendimentosMensais ?? 0))}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="dashboard-card dashboard-table-card">
          <div className="table-header">
            <div>
              <h3>Clientes Ativos</h3>
              <p>Profissionais da plataforma</p>
            </div>
            <span className="dashboard-pill">{showLoadingTag ? 'Carregando...' : `${tenants.length} registros`}</span>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <p>Buscando profissionais...</p>
            </div>
          ) : tenants.length > 0 ? (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Clínica</th>
                    <th>Responsável</th>
                    <th>E-mail</th>
                    <th>Pacientes</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.slice(0, 15).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="clinic-cell">
                          <div className="clinic-avatar">{t.clinica?.charAt(0) || 'C'}</div>
                          <span>{t.clinica}</span>
                        </div>
                      </td>
                      <td>{t.name}</td>
                      <td>{t.email}</td>
                      <td className="text-center">
                        <span className="badge">{t.pacientes}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>Nenhum profissional encontrado</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

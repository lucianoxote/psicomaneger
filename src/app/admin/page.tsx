"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Proteger a Rota no Frontend: Apenas o lucianoxote pode ver essa página
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.email !== 'lucianoxote@hotmail.com') {
      router.push('/');
    } else if (status === 'authenticated') {
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
      } else {
        console.error("Failed to fetch metrics");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!metrics) return null;

  // Dados para os Gráficos
  const chartData = [
    { name: 'Clínicas (Users)', count: metrics.totalUsers },
    { name: 'Pacientes Globais', count: metrics.totalPacientes },
    { name: 'Sessões Registradas', count: metrics.totalAgendamentos },
  ];

  const pieData = [
    { name: 'Atendimentos Mês', value: metrics.atendimentosMensais },
    { name: 'Atendimentos Antigos', value: metrics.totalAgendamentos - metrics.atendimentosMensais }
  ];
  const COLORS = ['#0ea5e9', '#3b82f6', '#10b981']; // SynaPSIS Colors

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sala de Comando SaaS
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Visão global da plataforma SynaPSIS Precision Clinical Solutions.
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase letter-spacing-wider">Total de Clínicas</span>
          <span className="text-5xl font-black text-primary mt-2">{metrics.totalUsers}</span>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase letter-spacing-wider">Pacientes Gerenciados</span>
          <span className="text-5xl font-black text-blue-500 mt-2">{metrics.totalPacientes}</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase letter-spacing-wider">Sessões Totais</span>
          <span className="text-5xl font-black text-indigo-500 mt-2">{metrics.totalAgendamentos}</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full"></div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase letter-spacing-wider">Volume (Mensal)</span>
          <span className="text-5xl font-black text-green-500 mt-2">{metrics.atendimentosMensais}</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Crescimento de Uso da Plataforma</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {
                    chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Engajamento de Sessões</h3>
          <p className="text-xs text-slate-500 mb-6">Atividade de consultas geradas no último mês vs Antigos.</p>
          <div className="flex-1 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#334155'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div><span className="text-xs text-slate-400">Recentes</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-600"></div><span className="text-xs text-slate-400">Histórico</span></div>
          </div>
        </div>
      </div>

      {/* Tabela de Inquilinos (Tenants) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Clientes Ativos (Profissionais)</h3>
          <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-md">15 Mais Recentes</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Clínica / Responsável</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">E-mail</th>
                <th className="py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase text-center">Volume de Pacientes</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{t.clinica}</span>
                      <span className="text-xs text-slate-500">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300">{t.email}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold px-3 py-1 text-xs rounded-full">
                      {t.pacientes} 
                    </span>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 italic">Nenhum profissional encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

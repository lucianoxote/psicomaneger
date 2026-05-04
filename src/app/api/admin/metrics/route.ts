import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Executar todas as contagens em PARALELO (antes eram sequenciais!)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const [totalUsers, totalPacientes, totalSessoes, totalAgendamentos, atendimentosMensais, plansDistribution] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("pacientes").countDocuments(),
      db.collection("sessoes").countDocuments(),
      db.collection("agendamentos").countDocuments(),
      db.collection("agendamentos").countDocuments({ 
        status: 'realizado',
        data: { $gte: trintaDiasAtras.toISOString() } 
      }),
      db.collection("users").aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } }
      ]).toArray(),
    ]);

    // Buscar Atividades Recentes para o Log
    const [recentUsers, recentPatients] = await Promise.all([
      db.collection("users").find({}, { projection: { name: 1, createdAt: 1 } }).sort({ _id: -1 }).limit(5).toArray(),
      db.collection("pacientes").find({}, { projection: { nome: 1, createdAt: 1, tenantId: 1 } }).sort({ _id: -1 }).limit(5).toArray()
    ]);

    const activities = [
      ...recentUsers.map(u => ({ type: 'signup', label: 'Novo Psicólogo', details: u.name, time: u.createdAt })),
      ...recentPatients.map(p => ({ type: 'patient', label: 'Novo Paciente', details: p.nome, time: p.createdAt }))
    ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

    // Corrigir o N+1: usar aggregation pipeline em UMA única query
    const tenants = await db.collection("users").aggregate([
      { $sort: { _id: -1 } },
      { $limit: 40 }, // Aumentar limite para busca funcionar melhor
      {
        $lookup: {
          from: "configuracoes",
          let: { uid: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
            { $project: { nomeClinica: 1, telefone: 1 } }
          ],
          as: "config"
        }
      },
      {
        $lookup: {
          from: "pacientes",
          let: { tid: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$tenantId", "$$tid"] } } },
            { $count: "total" }
          ],
          as: "pacientesCount"
        }
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: { $ifNull: ["$name", "Sem Nome"] },
          email: 1,
          plan: { $ifNull: ["$plan", "Gratuito"] },
          status: { $ifNull: ["$subscriptionStatus", "Ativo"] },
          createdAt: 1,
          trialEndsAt: 1,
          clinica: { 
            $ifNull: [{ $arrayElemAt: ["$config.nomeClinica", 0] }, "Não configurada"] 
          },
          telefone: { 
            $ifNull: [{ $arrayElemAt: ["$config.telefone", 0] }, ""] 
          },
          pacientes: { 
            $ifNull: [{ $arrayElemAt: ["$pacientesCount.total", 0] }, 0] 
          }
        }
      }
    ]).toArray();
    
    const response = NextResponse.json({
      metrics: { 
        totalUsers, 
        totalPacientes, 
        totalSessoes,
        totalAgendamentos, 
        atendimentosMensais,
        plans: plansDistribution.map(p => ({ name: p._id || 'Gratuito', value: p.count })),
        activities
      },
      tenants
    });
    
    // Sem cache para garantir dados em tempo real no dashboard admin
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error) {
    console.error("Erro na API Admin Metrics:", error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

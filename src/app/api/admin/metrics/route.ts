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

    const [totalUsers, totalPacientes, totalAgendamentos, atendimentosMensais, plansDistribution] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("pacientes").countDocuments(),
      db.collection("agendamentos").countDocuments(),
      db.collection("agendamentos").countDocuments({ 
        status: 'realizado',
        data: { $gte: trintaDiasAtras.toISOString() } 
      }),
      db.collection("users").aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } }
      ]).toArray(),
    ]);

    // Corrigir o N+1: usar aggregation pipeline em UMA única query
    const tenants = await db.collection("users").aggregate([
      { $sort: { _id: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "configuracoes",
          let: { uid: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
            { $project: { nomeClinica: 1 } }
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
          clinica: { 
            $ifNull: [{ $arrayElemAt: ["$config.nomeClinica", 0] }, "Não configurada"] 
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
        totalAgendamentos, 
        atendimentosMensais,
        plans: plansDistribution.map(p => ({ name: p._id || 'Gratuito', value: p.count }))
      },
      tenants
    });
    
    // Cache privado por 30s pois são dados sensíveis de admin
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return response;

  } catch (error) {
    console.error("Erro na API Admin Metrics:", error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

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

    const [totalUsers, totalPacientes, totalAgendamentos, atendimentosMensais] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("pacientes").countDocuments(),
      db.collection("agendamentos").countDocuments(),
      db.collection("agendamentos").countDocuments({ 
        status: 'realizado',
        data: { $gte: trintaDiasAtras.toISOString() } 
      }),
    ]);

    // Corrigir o N+1: usar aggregation pipeline em UMA única query
    // em vez de fazer 2 queries por usuário (o problema anterior!)
    const tenants = await db.collection("users").aggregate([
      { $sort: { _id: -1 } },
      { $limit: 15 },
      {
        $lookup: {
          from: "configuracoes",
          // configuracoes.userId é String, mas users._id é ObjectId
          // Precisamos converter com $toString para o join funcionar
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
      metrics: { totalUsers, totalPacientes, totalAgendamentos, atendimentosMensais },
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

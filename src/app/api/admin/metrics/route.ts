import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    // Proteção de API Nível Master
    if (!session?.user?.email || session.user.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado. Nível de permissão insuficiente.' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Contagens Globais
    const totalUsers = await db.collection("users").countDocuments();
    const totalPacientes = await db.collection("pacientes").countDocuments();
    const totalAgendamentos = await db.collection("agendamentos").countDocuments();

    // 2. Crescimento Recente (Últimos 30 dias)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
    // Contar agendamentos realizados recentemente
    const atendimentosMensais = await db.collection("agendamentos").countDocuments({ 
      status: 'realizado',
      data: { $gte: trintaDiasAtras.toISOString() } 
    });

    // 3. Lista de Profissionais Ativos (Tenants)
    // Busca os usuários e faz join com as suas configurações para mostrar o nome da clínica
    const tenatsRaw = await db.collection("users").find({}).sort({ _id: -1 }).limit(15).toArray();
    
    const tenantPromises = tenatsRaw.map(async (user) => {
      const configuracoes = await db.collection("configuracoes").findOne({ userId: user._id.toString() });
      const pacientesDoTenant = await db.collection("pacientes").countDocuments({ userId: user._id.toString() });
      
      return {
        id: user._id.toString(),
        name: user.name || 'Sem Nome',
        email: user.email,
        clinica: configuracoes?.nomeClinica || 'Não configurada',
        pacientes: pacientesDoTenant
      };
    });

    const tenants = await Promise.all(tenantPromises);

    // 4. Dados para o Gráfico de Crescimento de Cadastros (Exemplo simplificado)
    // Para simplificar agora, passaremos os totais. Se tivéssemos datas de criação, agruparíamos aqui.
    
    return NextResponse.json({
      metrics: {
        totalUsers,
        totalPacientes,
        totalAgendamentos,
        atendimentosMensais
      },
      tenants
    });

  } catch (error) {
    console.error("Erro na API Admin Metrics:", error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    // TRAVA DE SEGURANÇA: Apenas o Administrador Luciano pode ver logs de auditoria
    if (session?.user?.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Buscar os últimos 100 registros de auditoria
    const logs = await db.collection('audit_logs')
      .find()
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    const serializableLogs = logs.map((log: any) => ({
      ...log,
      _id: log._id.toString(),
      timestamp: log.timestamp?.toISOString?.(),
    }));

    return NextResponse.json(serializableLogs);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao carregar logs' }, { status: 500 });
  }
}

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

    const response = NextResponse.json(serializableLogs);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao carregar logs' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const { ObjectId } = require('mongodb');
    
    await db.collection('audit_logs').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir log' }, { status: 500 });
  }
}

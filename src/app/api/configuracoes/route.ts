import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const GLOBAL_CONFIG_ID = 'clinica_config_global';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Find global clinical settings
    const settings = await db.collection("configuracoes").findOne({ configId: GLOBAL_CONFIG_ID });
    
    return NextResponse.json(settings || {
      nomeClinica: 'PsicoManager',
      crp: '',
      tema: 'Tema Claro (Premium)',
      idioma: 'Português (Brasil)'
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const body = await request.json();
    const { _id, ...updateData } = body;

    // Update global clinical settings using a fixed ID
    const result = await db.collection("configuracoes").updateOne(
      { configId: GLOBAL_CONFIG_ID },
      { $set: { ...updateData, configId: GLOBAL_CONFIG_ID, updatedAt: new Date() } },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

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
    
    // Fetch global clinic settings (shared by all users)
    const globalSettings = await db.collection("configuracoes").findOne({ configId: GLOBAL_CONFIG_ID });
    
    // Fetch per-user preferences (tema, idioma)
    const userSettings = await db.collection("configuracoes_usuario").findOne({ userId: session.user.id });

    // Merge: global clinic info + individual preferences
    const merged = {
      nomeClinica: globalSettings?.nomeClinica || 'SynaPSIS',
      crp: globalSettings?.crp || '',
      tema: userSettings?.tema || 'Tema Claro (Premium)',
      idioma: userSettings?.idioma || 'Português (Brasil)',
    };

    return NextResponse.json(merged);
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

    // Save global clinic settings (nomeClinica, crp) — shared by all
    await db.collection("configuracoes").updateOne(
      { configId: GLOBAL_CONFIG_ID },
      { $set: { nomeClinica: body.nomeClinica, crp: body.crp, configId: GLOBAL_CONFIG_ID, updatedAt: new Date() } },
      { upsert: true }
    );

    // Save per-user preferences (tema, idioma) — individual
    await db.collection("configuracoes_usuario").updateOne(
      { userId: session.user.id },
      { $set: { tema: body.tema, idioma: body.idioma, userId: session.user.id, updatedAt: new Date() } },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

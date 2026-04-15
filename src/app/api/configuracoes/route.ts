import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Fetch per-user clinic settings and preferences
    const settings = await db.collection("configuracoes").findOne({ userId: session.user.id });

    // Merged response: database values or defaults
    const response = {
      nomeClinica: settings?.nomeClinica || 'SynaPSIS',
      crp: settings?.crp || '',
      tema: settings?.tema || 'Tema Claro (Premium)',
      idioma: settings?.idioma || 'Português (Brasil)',
    };

    return NextResponse.json(response);
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

    // Save settings per user
    await db.collection("configuracoes").updateOne(
      { userId: session.user.id },
      { 
        $set: { 
          nomeClinica: body.nomeClinica, 
          crp: body.crp, 
          tema: body.tema,
          idioma: body.idioma,
          userId: session.user.id, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

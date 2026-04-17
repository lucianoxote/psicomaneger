import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId || (session?.user as any)?.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Fetch per-tenant clinic settings and preferences
    const settings = await db.collection("configuracoes").findOne({ tenantId });

    // Merged response: database values or defaults
    const response = {
      nomeClinica: settings?.nomeClinica || 'SynaPSIS',
      crp: settings?.crp || '',
      tema: settings?.tema || 'Tema Claro (Premium)',
      idioma: settings?.idioma || 'Português (Brasil)',
      logoUrl: settings?.logoUrl || '',
    };

    return NextResponse.json(response);
  } catch (e: any) {
    console.error("Erro ao buscar configurações:", e);
    return NextResponse.json({ error: 'Erro ao buscar: ' + e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId || (session?.user as any)?.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const body = await request.json();

    // Save settings per tenant
    await db.collection("configuracoes").updateOne(
      { tenantId },
      { 
        $set: {
          nomeClinica: body.nomeClinica, 
          crp: body.crp, 
          tema: body.tema,
          idioma: body.idioma,
          logoUrl: body.logoUrl,
          tenantId: tenantId, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao salvar configurações:", e);
    return NextResponse.json({ error: 'Erro técnico: ' + e.message }, { status: 500 });
  }
}

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
      nomeClinica: settings?.nomeClinica || 'SinapsiGestão',
      crp: settings?.crp || '',
      tema: settings?.tema || 'Tema Claro (Premium)',
      idioma: settings?.idioma || 'Português (Brasil)',
      logoUrl: settings?.logoUrl || '',
      tipoAtividade: settings?.tipoAtividade || 'CPF',
      issRate: settings?.issRate ?? 5,
      uf: settings?.uf || 'BA',
      cidade: settings?.cidade || 'Lauro de Freitas',
      cidadeAtuacao: settings?.cidadeAtuacao || 'Lauro de Freitas-BA',
      regimeTributario: settings?.regimeTributario || 'Anexo III'
    };

    return NextResponse.json(response);
  } catch (e: any) {
    console.error("Erro ao buscar configurações:", e);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
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
          tipoAtividade: body.tipoAtividade,
          issRate: body.issRate,
          uf: body.uf,
          cidade: body.cidade,
          cidadeAtuacao: body.cidadeAtuacao,
          regimeTributario: body.regimeTributario,
          tenantId: tenantId, 
          userId: tenantId, // Adicionado para satisfazer o índice único no banco de dados
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao salvar configurações:", e);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("psicomanager");
    // We only ever have one settings document
    const settings = await db.collection("configuracoes").findOne({});
    return NextResponse.json(settings || {
      nomeClinica: 'Lívia Brito Psicologia',
      crp: '06/123456',
      tema: 'Tema Claro (Premium)',
      idioma: 'Português (Brasil)'
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("psicomanager");
    const body = await request.json();
    const { _id, ...updateData } = body;

    // Update the only settings document or create it if it doesn't exist
    const result = await db.collection("configuracoes").updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

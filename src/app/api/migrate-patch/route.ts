import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    
    // Safety check: Only lucianoxote@hotmail.com can run this migration
    if (session?.user?.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado. Apenas o administrador Luciano pode rodar a migração.' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();

    const livia = await db.collection('users').findOne({ email: 'psi.liviabrito@gmail.com' });
    if (!livia) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const liviaId = livia._id.toString();

    // Migrate missing Collections
    const collections = ['agendamentos', 'comunicacao_familia'];
    const results: any = {};

    for (const col of collections) {
      const res = await db.collection(col).updateMany(
        { userId: { $exists: false } }, 
        { $set: { userId: liviaId } }
      );
      results[col] = res.modifiedCount;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Patch de migração concluído!',
      results 
    });

  } catch (e: any) {
    return NextResponse.json({ error: 'Erro na migração: ' + e.message }, { status: 500 });
  }
}

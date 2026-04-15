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

    // 1. Find Livia's User ID
    const livia = await db.collection('users').findOne({ email: 'psi.liviabrito@gmail.com' });
    if (!livia) {
      return NextResponse.json({ error: 'Usuário da Dra. Lívia não encontrado. Certifique-se que ela já fez o primeiro acesso.' }, { status: 404 });
    }
    const liviaId = livia._id.toString();

    // 2. Set Luciano as Admin
    await db.collection('users').updateOne(
      { email: 'lucianoxote@hotmail.com' },
      { $set: { role: 'admin' } }
    );

    // 3. Migrate All Collections
    const collections = ['pacientes', 'agenda', 'sessoes', 'financeiro', 'tarefas', 'familia', 'configuracoes'];
    const results: any = {};

    for (const col of collections) {
      const res = await db.collection(col).updateMany(
        { userId: { $exists: false } }, // Only update if not already tagged
        { $set: { userId: liviaId } }
      );
      results[col] = res.modifiedCount;
    }

    // 4. Special case for settings: convert GLOBAL config to Livia's config
    const globalSettings = await db.collection('configuracoes').findOne({ configId: 'clinica_config_global' });
    if (globalSettings) {
      await db.collection('configuracoes').updateOne(
        { configId: 'clinica_config_global' },
        { $set: { userId: liviaId }, $unset: { configId: "" } }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migração concluída com sucesso!',
      liviaId,
      results 
    });

  } catch (e: any) {
    return NextResponse.json({ error: 'Erro na migração: ' + e.message }, { status: 500 });
  }
}

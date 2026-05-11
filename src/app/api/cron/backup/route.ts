import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { put, list, del } from '@vercel/blob';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * ROTA DE CRON: Executada automaticamente pela Vercel toda semana.
 * Faz o backup completo do banco de dados para o Vercel Blob.
 */
export async function GET(request: Request) {
  const session = await auth();
  const isAdmin = session?.user?.email === 'lucianoxote@hotmail.com';
  
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  console.log(`[Backup] Iniciando tentativa. VercelCron: ${isVercelCron}, Admin: ${isAdmin}`);

  if (!isVercelCron && !isAdmin && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[Backup] Tentativa não autorizada bloqueada.');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    // 1. Listar coleções que queremos fazer backup
    const collections = ['pacientes', 'agendamentos', 'financeiro', 'configuracoes', 'users', 'audit_logs', 'sessoes', 'comunicacao_familia'];
    const backupData: any = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {}
    };

    // 2. Extrair dados de cada coleção
    for (const collName of collections) {
      const data = await db.collection(collName).find({}).toArray();
      backupData.data[collName] = data;
    }

    // 3. Transformar em JSON e fazer upload para o Vercel Blob
    const filename = `backups/sinapsi_backup_${new Date().toISOString().split('T')[0]}.json`;
    const jsonString = JSON.stringify(backupData);
    
    const { url } = await put(filename, jsonString, {
      access: 'public', // O link é aleatório e difícil de adivinhar, mas guardamos em pasta privada logicamente
      addRandomSuffix: true
    });

    // 4. POLÍTICA DE RETENÇÃO: Manter apenas os últimos 4 backups
    const { blobs } = await list({ prefix: 'backups/sinapsi_backup_' });
    
    // Se tiver mais de 4, deletar os mais antigos
    if (blobs.length > 4) {
      // Ordenar por data (pelo nome do arquivo)
      const sortedBlobs = blobs.sort((a, b) => 
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );
      
      const toDelete = sortedBlobs.slice(0, sortedBlobs.length - 4);
      for (const blob of toDelete) {
        await del(blob.url);
      }
    }

    console.log(`[Backup] Sucesso! Arquivo gerado: ${filename}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Backup concluído com sucesso',
      url: url,
      count: blobs.length 
    });
  } catch (error: any) {
    console.error('Falha no Backup:', error);
    return NextResponse.json({ error: 'Erro ao processar backup', details: error.message }, { status: 500 });
  }
}

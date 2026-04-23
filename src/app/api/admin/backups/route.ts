import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    // Apenas Luciano pode listar backups
    if (session?.user?.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Listar todos os blobs que começam com o prefixo de backup
    const { blobs } = await list({ prefix: 'backups/sinapsi_backup_' });
    
    // Ordenar do mais recente para o mais antigo
    const sortedBackups = blobs.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json(sortedBackups);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao listar backups' }, { status: 500 });
  }
}

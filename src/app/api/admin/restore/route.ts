import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    // TRAVA DE SEGURANÇA MÁXIMA
    if (session?.user?.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { backupUrl } = await request.json();
    if (!backupUrl) {
      return NextResponse.json({ error: 'URL do backup é obrigatória' }, { status: 400 });
    }

    // 1. Baixar o arquivo de backup
    const response = await fetch(backupUrl);
    if (!response.ok) throw new Error('Falha ao baixar o arquivo de backup');
    const backupData = await response.json();

    const client = await clientPromise;
    const db = client.db();

    // 2. Processar a restauração de cada coleção
    const collections = Object.keys(backupData.data);
    
    for (const collName of collections) {
      const data = backupData.data[collName];
      
      // Limpar a coleção atual
      await db.collection(collName).deleteMany({});
      
      // Inserir os dados do backup (se houver dados)
      if (data && data.length > 0) {
        // Converter strings de data de volta para objetos Date se necessário, 
        // mas o MongoDB Driver costuma lidar bem com o formato se os IDs forem tratados
        const processedData = data.map((item: any) => {
          const newItem = { ...item };
          // O MongoDB não aceita _id como string se ele for originalmente um ObjectId no insertMany
          // Mas como estamos vindo de um JSON, o insertMany vai criar novos ObjectIds se não passarmos,
          // ou podemos tentar converter se for um formato específico. 
          // Para garantir a compatibilidade, removemos o _id para ele gerar novos ou tratamos como string.
          if (newItem._id) delete newItem._id; 
          return newItem;
        });
        
        await db.collection(collName).insertMany(processedData);
      }
    }

    // 3. Registrar essa ação crítica na auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: 'SYSTEM',
      action: 'EXPORT', // Usando EXPORT como fallback para RESTORE
      entity: 'SISTEMA',
      details: `RESTAURAÇÃO COMPLETA realizada a partir do backup: ${backupUrl}`
    });

    return NextResponse.json({ success: true, message: 'Restauração concluída com sucesso!' });
  } catch (error: any) {
    console.error('Falha na Restauração:', error);
    return NextResponse.json({ error: 'Erro ao restaurar dados', details: error.message }, { status: 500 });
  }
}

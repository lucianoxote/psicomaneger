import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const tarefas = await db.collection('tarefas')
      .find({ tenantId: session.user.tenantId })
      .sort({ data: -1 })
      .toArray();

    const serializableTarefas = tarefas.map((tarefa: any) => ({
      ...tarefa,
      _id: tarefa._id.toString(),
      createdAt: tarefa.createdAt?.toISOString?.(),
      data: tarefa.data ? (tarefa.data.includes('T') ? tarefa.data.split('T')[0] : tarefa.data) : tarefa.data,
    }));

    const response = NextResponse.json(serializableTarefas);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao conectar ao banco' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('tarefas').insertOne({
      ...body,
      tenantId: session.user.tenantId,
      status: 'pendente',
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar tarefa' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateFields } = data;
    const client = await clientPromise;
    const db = client.db();
    
    await db.collection('tarefas').updateOne(
      { _id: new ObjectId(id), tenantId: session.user.tenantId },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    await db.collection('tarefas').deleteOne({ 
      _id: new ObjectId(id),
      tenantId: session.user.tenantId 
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir tarefa' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('pacienteId');
    const query: any = { tenantId: session.user.tenantId };
    if (pacienteId) query.pacienteId = pacienteId;

    const client = await clientPromise;
    const db = client.db();
    const financeiro = await db.collection('financeiro')
      .find(query)
      .sort({ data: -1 })
      .toArray();

    const serializableFinanceiro = financeiro.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
      createdAt: item.createdAt?.toISOString?.(),
      data: item.data?.toISOString?.(),
    }));

    return NextResponse.json(serializableFinanceiro);
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
    
    const result = await db.collection('financeiro').insertOne({
      ...body,
      tenantId: session.user.tenantId,
      data: new Date(body.data || new Date()),
      createdAt: new Date()
    });

    // Log de Auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: session.user.tenantId!,
      action: 'CREATE',
      entity: 'financeiro',
      entityId: result.insertedId.toString(),
      details: `Registrou transação: ${body.descricao} - Valor: R$ ${body.valor}`
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar transação' }, { status: 500 });
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
    
    const existing = await db.collection('financeiro').findOne({ _id: new ObjectId(id), tenantId: session.user.tenantId });

    await db.collection('financeiro').updateOne(
      { _id: new ObjectId(id), tenantId: session.user.tenantId },
      { $set: updateFields }
    );

    // Log de Auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: (existing as any)?.tenantId || '',
      action: 'UPDATE',
      entity: 'financeiro',
      entityId: id,
      details: `Atualizou transação: ${(existing as any)?.descricao}`,
      newData: updateFields
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection('financeiro').findOne({ _id: new ObjectId(id), tenantId: session.user.tenantId });

    const result = await db.collection('financeiro').deleteOne({ 
      _id: new ObjectId(id),
      tenantId: session.user.tenantId 
    });

    if (result.deletedCount > 0) {
      // Log de Auditoria
      logAction({
        userId: session.user.id!,
        userEmail: session.user.email!,
        tenantId: (existing as any)?.tenantId || '',
        action: 'DELETE',
        entity: 'financeiro',
        entityId: id,
        details: `Excluiu transação: ${(existing as any)?.descricao} - Valor: R$ ${(existing as any)?.valor}`
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir transação' }, { status: 500 });
  }
}

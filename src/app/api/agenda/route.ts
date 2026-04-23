import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const agendamentos = await db.collection('agendamentos')
      .find({ tenantId: session.user.tenantId })
      .project({ paciente: 1, pacienteId: 1, tipo: 1, status: 1, data: 1, createdAt: 1, updatedAt: 1 })
      .sort({ data: 1 })
      .toArray();

    const serializableAgendamentos = agendamentos.map((agendamento: any) => ({
      ...agendamento,
      _id: agendamento._id.toString(),
      createdAt: agendamento.createdAt ? (agendamento.createdAt instanceof Date ? agendamento.createdAt.toISOString() : agendamento.createdAt.toString()) : undefined,
      data: agendamento.data ? (agendamento.data instanceof Date ? agendamento.data.toISOString() : agendamento.data.toString()) : undefined,
    }));

    return NextResponse.json(serializableAgendamentos);
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
    
    const result = await db.collection('agendamentos').insertOne({
      ...body,
      tenantId: session.user.tenantId,
      data: body.data ? new Date(body.data) : new Date(),
      status: body.status || 'pendente',
      createdAt: new Date()
    });

    // Log de Auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: session.user.tenantId,
      action: 'CREATE',
      entity: 'agendamento',
      entityId: result.insertedId.toString(),
      details: `Agendou sessão para o paciente: ${body.paciente} em ${new Date(body.data).toLocaleDateString()}`
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao agendar' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateFields } = data;
    const client = await clientPromise;
    const db = client.db();
    
    if (updateFields.data) {
      updateFields.data = new Date(updateFields.data);
    }

    const existing = await db.collection('agendamentos').findOne({ _id: new ObjectId(id), tenantId: session.user.tenantId });

    await db.collection('agendamentos').updateOne(
      { _id: new ObjectId(id), tenantId: session.user.tenantId },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    // Log de Auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: session.user.tenantId,
      action: 'UPDATE',
      entity: 'agendamento',
      entityId: id,
      details: `Atualizou agendamento do paciente: ${(existing as any)?.paciente}`,
      newData: updateFields
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection('agendamentos').findOne({ _id: new ObjectId(id), tenantId: session.user.tenantId });

    const result = await db.collection('agendamentos').deleteOne({ 
      _id: new ObjectId(id),
      tenantId: session.user.tenantId 
    });

    if (result.deletedCount > 0) {
      // Log de Auditoria
      logAction({
        userId: session.user.id!,
        userEmail: session.user.email!,
        tenantId: session.user.tenantId,
        action: 'DELETE',
        entity: 'agendamento',
        entityId: id,
        details: `Excluiu agendamento do paciente: ${(existing as any)?.paciente} de ${(existing as any)?.data ? new Date((existing as any).data).toLocaleDateString() : 'data ignorada'}`
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir agendamento' }, { status: 500 });
  }
}

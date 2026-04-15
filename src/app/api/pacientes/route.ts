import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const pacientes = await db.collection('pacientes')
      .find({ userId: session.user.id })
      .toArray();
    return NextResponse.json(pacientes);
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao conectar ao banco' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('pacientes').insertOne({
      ...body,
      userId: session.user.id,
      createdAt: new Date(),
      status: 'ativo'
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar paciente' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { id, _id, anamnese, ...updateFields } = data;
    const client = await clientPromise;
    const db = client.db();
    
    // Ensure ownership before update
    const existing = await db.collection('pacientes').findOne({ 
      _id: new ObjectId(id),
      userId: session.user.id 
    });

    if (!existing) {
      return NextResponse.json({ error: 'Paciente não encontrado ou acesso negado' }, { status: 404 });
    }

    const updateDoc: any = { ...updateFields, updatedAt: new Date() };
    if (anamnese) updateDoc.anamnese = anamnese;

    await db.collection('pacientes').updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: updateDoc }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 500 });
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
    
    // Ensure ownership before delete
    const result = await db.collection('pacientes').deleteOne({ 
      _id: new ObjectId(id),
      userId: session.user.id 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Acesso negado ou paciente inexistente' }, { status: 403 });
    }

    await db.collection('sessoes').deleteMany({ pacienteId: id, userId: session.user.id });
    await db.collection('financeiro').deleteMany({ pacienteId: id, userId: session.user.id });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir paciente' }, { status: 500 });
  }
}

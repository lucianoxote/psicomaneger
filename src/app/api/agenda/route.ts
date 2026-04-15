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
    const agendamentos = await db.collection('agendamentos')
      .find({ userId: session.user.id })
      .toArray();
    return NextResponse.json(agendamentos);
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
    
    const result = await db.collection('agendamentos').insertOne({
      ...body,
      userId: session.user.id,
      status: body.status || 'pendente',
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao agendar' }, { status: 500 });
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
    
    await db.collection('agendamentos').updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: { ...updateFields, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
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
    await db.collection('agendamentos').deleteOne({ 
      _id: new ObjectId(id),
      userId: session.user.id 
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir agendamento' }, { status: 500 });
  }
}

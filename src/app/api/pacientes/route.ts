import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const pacientes = await db.collection('pacientes').find({}).toArray();
    return NextResponse.json(pacientes);
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao conectar ao banco' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('pacientes').insertOne({
      ...body,
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
    const data = await request.json();
    const { id, _id, anamnese, ...updateFields } = data;
    const client = await clientPromise;
    const db = client.db();
    
    const updateDoc: any = { ...updateFields, updatedAt: new Date() };
    if (anamnese) updateDoc.anamnese = anamnese;

    await db.collection('pacientes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    
    await db.collection('pacientes').deleteOne({ _id: new ObjectId(id) });
    await db.collection('sessoes').deleteMany({ pacienteId: id });
    await db.collection('financeiro').deleteMany({ pacienteId: id });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir paciente' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("psicomanager");
    const logs = await db.collection("comunicacao_familia").find({}).sort({ data: -1 }).toArray();
    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("psicomanager");
    const body = await request.json();
    
    const result = await db.collection("comunicacao_familia").insertOne({
      ...body,
      createdAt: new Date()
    });
    
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar log' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("psicomanager");
    const { id, ...updateData } = await request.json();
    
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await db.collection("comunicacao_familia").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar log' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("psicomanager");
    await db.collection("comunicacao_familia").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir log' }, { status: 500 });
  }
}

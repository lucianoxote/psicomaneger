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
    const logs = await db.collection("comunicacao_familia")
      .find({ tenantId: session.user.tenantId })
      .sort({ data: -1 })
      .toArray();

    const serializableLogs = logs.map((log: any) => ({
      ...log,
      _id: log._id.toString(),
      createdAt: log.createdAt?.toISOString?.(),
      data: log.data?.toISOString?.(),
    }));

    return NextResponse.json(serializableLogs);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const body = await request.json();
    
    const result = await db.collection("comunicacao_familia").insertOne({
      ...body,
      tenantId: session.user.tenantId,
      createdAt: new Date()
    });
    
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar log' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const { id, ...updateData } = await request.json();
    
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await db.collection("comunicacao_familia").updateOne(
      { _id: new ObjectId(id), tenantId: session.user.tenantId },
      { $set: updateData }
    );
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar log' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    await db.collection("comunicacao_familia").deleteOne({ 
      _id: new ObjectId(id),
      tenantId: session.user.tenantId 
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir log' }, { status: 500 });
  }
}

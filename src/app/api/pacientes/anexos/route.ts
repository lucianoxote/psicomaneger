import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { put, del } from '@vercel/blob';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('pacienteId');
    if (!pacienteId) return NextResponse.json({ error: 'Paciente ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const anexos = await db.collection('anexos').find({ pacienteId, tenantId: session.user.tenantId }).sort({ createdAt: -1 }).toArray();
    
    const serializableAnexos = anexos.map((anexo: any) => ({
      ...anexo,
      _id: anexo._id.toString(),
      createdAt: anexo.createdAt?.toISOString?.(),
    }));

    return NextResponse.json(serializableAnexos);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao listar anexos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pacienteId = formData.get('pacienteId') as string;
    const pacienteNome = formData.get('pacienteNome') as string;

    if (!file || !pacienteId) {
      return NextResponse.json({ error: 'Arquivo e ID do paciente são obrigatórios' }, { status: 400 });
    }

    const originalName = file.name;
    const blob = await put(`anexos/${Date.now()}-${originalName}`, file, {
      access: 'public',
      addRandomSuffix: true
    });

    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('anexos').insertOne({
      pacienteId,
      pacienteNome,
      tenantId: session.user.tenantId,
      originalName,
      url: blob.url,
      path: blob.url, // Keep path for compatibility
      size: file.size,
      type: file.type,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId, url: blob.url });
  } catch (e) {
    console.error('Erro no upload Vercel Blob:', e);
    return NextResponse.json({ error: 'Erro ao fazer upload na nuvem' }, { status: 500 });
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
    
    const anexo = await db.collection('anexos').findOne({ _id: new ObjectId(id), tenantId: session.user.tenantId });
    if (!anexo) return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 });

    // Delete from Vercel Blob if URL exists
    if (anexo.url || anexo.path?.startsWith('http')) {
      try {
        await del(anexo.url || anexo.path);
      } catch (err) {
        console.warn('Erro ao deletar blob ou arquivo não encontrado:', err);
      }
    }

    // Delete from DB
    await db.collection('anexos').deleteOne({ _id: new ObjectId(id), tenantId: session.user.tenantId });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir anexo' }, { status: 500 });
  }
}

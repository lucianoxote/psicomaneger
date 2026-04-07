import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { put, del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('pacienteId');
    if (!pacienteId) return NextResponse.json({ error: 'Paciente ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const anexos = await db.collection('anexos').find({ pacienteId }).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(anexos);
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao listar anexos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    
    const anexo = await db.collection('anexos').findOne({ _id: new ObjectId(id) });
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
    await db.collection('anexos').deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir anexo' }, { status: 500 });
  }
}

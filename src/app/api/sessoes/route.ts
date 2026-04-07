import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('pacienteId');
    if (!pacienteId) {
      return NextResponse.json({ error: 'pacienteId é obrigatório' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const sessoes = await db.collection('sessoes').find({ pacienteId }).sort({ data: -1 }).toArray();
    return NextResponse.json(sessoes);
  } catch (e) {
    return NextResponse.json({ error: 'Falha ao conectar ao banco' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('sessoes').insertOne({
      ...body,
      createdAt: new Date()
    });

    // Sincronizar com a agenda: criar o evento retroativo para aparecer na grade
    try {
      if (body.data) {
        // Se a hora não for especificada no body, assume-se um horário padrão
        const horaSessao = body.hora || '08:00';
        const dataComHora = `${body.data}T${horaSessao}:00`;
        
        await db.collection('agendamentos').insertOne({
           paciente: body.pacienteNome,
           pacienteId: body.pacienteId,
           data: dataComHora,
           tipo: body.tipo?.includes('Neuro') ? 'Neuro' : 'Psi',
           status: 'realizado', // automático pois vem do prontuário
           createdAt: new Date()
        });
      }
    } catch(err) {
       console.log('Aviso: Erro ao sincronizar sessoes com agendamentos retroativos', err);
    }

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar sessão' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateFields } = data;
    const client = await clientPromise;
    const db = client.db();
    
    await db.collection('sessoes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    await db.collection('sessoes').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir sessão' }, { status: 500 });
  }
}

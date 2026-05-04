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
    const id = searchParams.get('id');

    const client = await clientPromise;
    const db = client.db();

    if (id) {
      // Se tiver ID, carrega o paciente completo (incluindo anamnese)
      const paciente = await db.collection('pacientes').findOne({ 
        _id: new ObjectId(id),
        tenantId: session.user.tenantId 
      });

      if (!paciente) {
        return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
      }

      const serializablePaciente = {
        ...paciente,
        _id: paciente._id.toString(),
        createdAt: paciente.createdAt?.toISOString?.(),
        updatedAt: paciente.updatedAt?.toISOString?.(),
      };

      return NextResponse.json(serializablePaciente);
    }

    // Se não tiver ID, carrega a lista simplificada
    const pacientes = await db.collection('pacientes')
      .find({ tenantId: session.user.tenantId })
      .sort({ nome: 1 })
      .project({ anamnese: 0, observacoes: 0 }) 
      .toArray();

    const serializablePacientes = pacientes.map((paciente: any) => ({
      ...paciente,
      _id: paciente._id.toString(),
      createdAt: paciente.createdAt?.toISOString?.(),
      updatedAt: paciente.updatedAt?.toISOString?.(),
    }));

    const response = NextResponse.json(serializablePacientes);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
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

    // Verificação de Limites do Plano
    const PLAN_LIMITS: Record<string, number> = {
      'Gratuito': Infinity,
      'Trial': 15,
      'Plus': 30,
      'Pro': Infinity
    };

    const userPlan = session.user.plan || 'Trial';
    const limit = PLAN_LIMITS[userPlan] || 15;

    // Admin Luciano sempre tem bypass
    if (session.user.email !== 'lucianoxote@hotmail.com' && userPlan !== 'Gratuito' && userPlan !== 'Pro') {
      const currentCount = await db.collection('pacientes').countDocuments({ tenantId: session.user.tenantId });
      if (currentCount >= limit) {
        return NextResponse.json({ 
          error: `Limite de pacientes atingido para o plano ${userPlan}. (Limite: ${limit})` 
        }, { status: 403 });
      }
    }
    
    const result = await db.collection('pacientes').insertOne({
      ...body,
      tenantId: session.user.tenantId,
      createdAt: new Date(),
      status: 'ativo'
    });

    // Log de Auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: session.user.tenantId,
      action: 'CREATE',
      entity: 'paciente',
      entityId: result.insertedId.toString(),
      details: `Cadastrou o paciente: ${body.nome}`
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao salvar paciente' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { id, _id, anamnese, ...updateFields } = data;
    const client = await clientPromise;
    const db = client.db();
    
    // Ensure ownership before update
    const existing = await db.collection('pacientes').findOne({ 
      _id: new ObjectId(id),
      tenantId: session.user.tenantId 
    });

    if (!existing) {
      return NextResponse.json({ error: 'Paciente não encontrado ou acesso negado' }, { status: 404 });
    }

    const updateDoc: any = { ...updateFields, updatedAt: new Date() };
    if (anamnese) updateDoc.anamnese = anamnese;

    await db.collection('pacientes').updateOne(
      { _id: new ObjectId(id), tenantId: session.user.tenantId },
      { $set: updateDoc }
    );

    // Log de Auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: session.user.tenantId,
      action: 'UPDATE',
      entity: 'paciente',
      entityId: id,
      details: `Atualizou dados do paciente: ${existing.nome}`,
      newData: updateFields
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 500 });
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
    
    const existing = await db.collection('pacientes').findOne({ _id: new ObjectId(id), tenantId: session.user.tenantId });
    
    // Ensure ownership before delete
    const result = await db.collection('pacientes').deleteOne({ 
      _id: new ObjectId(id), 
      tenantId: session.user.tenantId 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Acesso negado ou paciente inexistente' }, { status: 403 });
    }

    // Log de Auditoria
    logAction({
      userId: session.user.id!,
      userEmail: session.user.email!,
      tenantId: session.user.tenantId,
      action: 'DELETE',
      entity: 'paciente',
      entityId: id,
      details: `Excluiu o paciente: ${existing?.nome || id}`
    });

    await db.collection('sessoes').deleteMany({ pacienteId: id, tenantId: session.user.tenantId });
    await db.collection('financeiro').deleteMany({ pacienteId: id, tenantId: session.user.tenantId });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao excluir paciente' }, { status: 500 });
  }
}

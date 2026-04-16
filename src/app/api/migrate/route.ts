import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/auth';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    console.log('Starting migration...');

    // Migrate users: add tenantId if missing
    const userResult = await db.collection('users').updateMany(
      { tenantId: { $exists: false } },
      [{ $set: { tenantId: { $toString: '$_id' } } }]
    );
    console.log(`Users migrated: ${userResult.modifiedCount}`);

    // Migrate pacientes
    const pacientesResult = await db.collection('pacientes').updateMany(
      { tenantId: { $exists: false }, userId: { $exists: true } },
      [{ $set: { tenantId: '$userId' } }]
    );
    console.log(`Pacientes migrated: ${pacientesResult.modifiedCount}`);

    // Migrate agendamentos
    const agendamentosResult = await db.collection('agendamentos').updateMany(
      { tenantId: { $exists: false }, userId: { $exists: true } },
      [{ $set: { tenantId: '$userId' } }]
    );
    console.log(`Agendamentos migrated: ${agendamentosResult.modifiedCount}`);

    // Migrate sessoes
    const sessoesResult = await db.collection('sessoes').updateMany(
      { tenantId: { $exists: false }, userId: { $exists: true } },
      [{ $set: { tenantId: '$userId' } }]
    );
    console.log(`Sessoes migrated: ${sessoesResult.modifiedCount}`);

    // Migrate financeiro
    const financeiroResult = await db.collection('financeiro').updateMany(
      { tenantId: { $exists: false }, userId: { $exists: true } },
      [{ $set: { tenantId: '$userId' } }]
    );
    console.log(`Financeiro migrated: ${financeiroResult.modifiedCount}`);

    // Migrate tarefas
    const tarefasResult = await db.collection('tarefas').updateMany(
      { tenantId: { $exists: false }, userId: { $exists: true } },
      [{ $set: { tenantId: '$userId' } }]
    );
    console.log(`Tarefas migrated: ${tarefasResult.modifiedCount}`);

    // Migrate familia
    const familiaResult = await db.collection('familia').updateMany(
      { tenantId: { $exists: false }, userId: { $exists: true } },
      [{ $set: { tenantId: '$userId' } }]
    );
    console.log(`Familia migrated: ${familiaResult.modifiedCount}`);

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
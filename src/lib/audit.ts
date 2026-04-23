import clientPromise from './mongodb';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT';

interface AuditLog {
  timestamp: Date;
  userId: string;
  userEmail: string;
  tenantId: string;
  action: AuditAction;
  entity: string; // ex: 'paciente', 'financeiro', 'agendamento'
  entityId?: string;
  details: string; // Descrição legível da ação
  oldData?: any;
  newData?: any;
  ip?: string;
}

/**
 * Grava uma ação de auditoria no banco de dados.
 * Esta função é assíncrona mas não deve ser 'awaited' se não quiser travar a resposta da API.
 */
export async function logAction(params: Omit<AuditLog, 'timestamp'>) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const log: AuditLog = {
      ...params,
      timestamp: new Date(),
    };

    await db.collection('audit_logs').insertOne(log);
    console.log(`[AUDIT] Action ${log.action} on ${log.entity} recorded for user ${log.userEmail}`);
  } catch (error) {
    // Falha silenciosa para não quebrar a experiência do usuário se o log falhar
    console.error('[AUDIT_ERROR] Failed to record audit log:', error);
  }
}

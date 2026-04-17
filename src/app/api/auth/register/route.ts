import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if any user exists
    const userCount = await db.collection("users").countDocuments();
    
    // If users exist, the requester MUST be authenticated
    if (userCount > 0) {
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Não autorizado: Apenas administradores podem criar novos usuários.' }, { status: 403 });
      }
    }

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = new ObjectId(); // Gerar ID antecipadamente
    const now = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(now.getDate() + 15);

    await db.collection("users").insertOne({
      _id: userId,
      email,
      password: hashedPassword,
      name,
      role: 'user',
      tenantId: userId.toString(), // Definir no momento da criação
      plan: 'Trial',
      subscriptionStatus: 'Ativo',
      trialEndsAt,
      createdAt: now,
    });

    return NextResponse.json({ success: true, id: userId });
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao registrar: ' + e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const users = await db.collection("users").find({}, { projection: { password: 0 } }).toArray();
    
    return NextResponse.json({ 
      hasUsers: users.length > 0,
      users: users 
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    // Apenas o Luciano (master admin) pode deletar contas
    if (!session?.user?.email || session.user.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Impedir deletar a própria conta master
    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }
    
    if (targetUser.email === 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Você não pode deletar a conta mestre do sistema.' }, { status: 403 });
    }

    const tenantId = userId; // tenantId é o ID do usuário como string

    // 2. Executar deleção em CASCATA para limpar o banco
    const collectionsToClean = [
      'pacientes', 
      'agendamentos', 
      'tarefas', 
      'configuracoes', 
      'financeiro', 
      'sessoes', 
      'familia', 
      'reabilitacao'
    ];

    await Promise.all([
      db.collection("users").deleteOne({ _id: new ObjectId(userId) }),
      ...collectionsToClean.map(coll => db.collection(coll).deleteMany({ 
        $or: [{ tenantId: tenantId }, { userId: userId }] 
      }))
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro na exclusão definitiva:", error);
    return NextResponse.json({ error: 'Erro interno na exclusão.' }, { status: 500 });
  }
}

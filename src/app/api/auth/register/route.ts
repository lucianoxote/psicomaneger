import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { ObjectId } from "mongodb";
import { resend } from "@/lib/resend";

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

    const logoUrl = "https://sinapsigestor.com.br/images/logo-sinapsi-full.png";

    // Enviar e-mail de boas-vindas
    try {
      await resend.emails.send({
        from: 'Sinapsi Gestor <suporte@sinapsigestor.com.br>',
        to: email,
        subject: `Bem-vindo(a) ao Sinapsi Gestor, ${name}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="${logoUrl}" alt="Sinapsi Gestor" style="max-height: 140px; width: auto;" />
            </div>
            
            <div style="background-color: #f8fafc; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h1 style="color: #0e7490; font-size: 24px; margin-top: 0;">Olá, ${name}!</h1>
              <p style="font-size: 16px; line-height: 1.6;">É um prazer ter você conosco! Sua conta no <strong>Sinapsi Gestor</strong> acaba de ser criada e já está pronta para uso.</p>
              
              <div style="margin: 32px 0; padding: 24px; background-color: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-weight: 600; color: #0e7490;">Seus dados de acesso:</p>
                <p style="margin: 8px 0 0 0;"><strong>E-mail:</strong> ${email}</p>
                <p style="margin: 4px 0 0 0;"><strong>Link:</strong> <a href="https://sinapsigestor.com.br" style="color: #0e7490;">sinapsigestor.com.br</a></p>
              </div>

              <p style="font-size: 16px; line-height: 1.6;">Agora você tem 15 dias de período de teste gratuito para explorar todas as funcionalidades de gestão clínica, prontuário eletrônico e controle financeiro.</p>

              <div style="text-align: center; margin-top: 32px;">
                <a href="https://sinapsigestor.com.br/login" style="background-color: #0e7490; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Começar a Usar Agora</a>
              </div>
            </div>

            <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px;">
              <p>Dúvidas? Responda a este e-mail ou entre em contato pelo nosso suporte.</p>
              <p style="margin-top: 16px;">© 2026 Sinapsi Gestor - Tecnologia para Psicologia</p>
            </div>
          </div>
        `
      });
    } catch (mailError) {
      console.error("Erro ao enviar e-mail de boas-vindas:", mailError);
      // Não interrompe o fluxo de registro se o e-mail falhar
    }

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

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    // Apenas o Luciano (master admin) pode alterar assinaturas
    if (!session?.user?.email || session.user.email !== 'lucianoxote@hotmail.com') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, plan, subscriptionStatus } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          plan, 
          subscriptionStatus,
          updatedAt: new Date() 
        } 
      }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro na atualização de assinatura:", error);
    return NextResponse.json({ error: 'Erro ao atualizar assinatura.' }, { status: 500 });
  }
}

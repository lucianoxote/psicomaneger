import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { resend, resendLivia } from '@/lib/resend';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user exists
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      // For security reasons, don't reveal if user exists
      return NextResponse.json({ success: true });
    }

    // Select the correct Resend client for testing purposes (Sandbox limitation)
    const mailClient = email.toLowerCase().includes('liviabrito') ? resendLivia : resend;

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Store token
    await db.collection("verificationTokens").updateOne(
      { email },
      { $set: { token, expires, email } },
      { upsert: true }
    );

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // Check if e-mail system is configured
    if (process.env.RESEND_API_KEY?.includes('dummy')) {
       return NextResponse.json({ error: 'Configuração de e-mail pendente no servidor. Verifique as chaves na Vercel.' }, { status: 501 });
    }

    await mailClient.emails.send({
      from: 'Sinapsi Gestor <onboarding@resend.dev>',
      to: email,
      subject: 'Recuperação de Senha - Sinapsi Gestor',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0e7490; margin-bottom: 24px;">Recuperação de Senha</h2>
          <p>Você solicitou a redefinição de sua senha no <strong>Sinapsi Gestor</strong>.</p>
          <p>Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
          <div style="margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #0e7490; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Redefinir Minha Senha</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Se você não solicitou isso, ignore este e-mail.</p>
          <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Sinapsi Gestor - Gestão Clínica de Excelência</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Erro forgot-password detalhado:', e.message || e);
    return NextResponse.json({ error: `Erro na solicitação: ${e.message || 'Erro interno'}` }, { status: 500 });
  }
}

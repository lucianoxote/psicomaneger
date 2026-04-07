import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Find token
    const tokenDoc = await db.collection("verificationTokens").findOne({
      token,
      expires: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await db.collection("users").updateOne(
      { email: tokenDoc.email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Delete token
    await db.collection("verificationTokens").deleteOne({ token });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Erro reset-password:', e);
    return NextResponse.json({ error: 'Erro interno ao processar redefinição' }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Find current user with password
    const user = await db.collection("users").findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Verify current password
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 403 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao alterar senha: ' + e.message }, { status: 500 });
  }
}

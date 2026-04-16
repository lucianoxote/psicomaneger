import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

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

    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      tenantId: result.insertedId.toString(), // Cada usuário novo é seu próprio tenant inicialmente
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
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

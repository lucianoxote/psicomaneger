import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !request.body) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
    }

    // O token (BLOB_READ_WRITE_TOKEN) deve estar configurado no Vercel Dashboard
    const blob = await put(filename, request.body, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Falha no upload: ' + error.message }, { status: 500 });
  }
}

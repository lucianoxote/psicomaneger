import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Configuração do Limitador de Acesso (10 tentativas por minuto por IP)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "60 s"),
});

const nextAuth = NextAuth(authConfig);

export default async function middleware(req: any) {
  const ip = req.ip ?? "127.0.0.1";
  const { pathname } = req.nextUrl;

  // 1. Proteger apenas rotas sensíveis contra ataques de força bruta (Login e Cadastro)
  if ((pathname === "/login" || pathname.startsWith("/api/auth")) && req.method === "POST") {
    try {
      const { success } = await ratelimit.limit(`ratelimit_${ip}`);
      if (!success) {
        return new NextResponse(
          "Muitas tentativas de acesso. Por segurança, aguarde um minuto.", 
          { status: 429, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
      }
    } catch (e) {
      console.error("Erro no Rate Limiting:", e);
    }
  }

  // 2. Permitir que rotas de autenticação do NextAuth passem sem interferência de redirecionamento
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Segue para a lógica normal de autenticação do NextAuth
  return (nextAuth.auth as any)(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|uploads|favicon.ico|favicon.png|synapsi_brain_v6.png).*)"],
};

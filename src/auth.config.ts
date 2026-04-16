import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    // This is a placeholder as providers rely on database/env
    // We will define the full provider in auth.ts
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      const isRecoveryPage = nextUrl.pathname.startsWith("/login/forgot-password") || 
                             nextUrl.pathname.startsWith("/reset-password");
      const isRegisterApi = nextUrl.pathname === "/api/auth/register";

      if (isRegisterApi) return true;

      if (!isLoggedIn && !isLoginPage && !isRecoveryPage) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || (token.id as string);
        (session.user as any).role = token.role as string;
        (session.user as any).tenantId = token.tenantId as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;

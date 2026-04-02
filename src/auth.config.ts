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
      const isRegisterApi = nextUrl.pathname === "/api/auth/register";

      if (isRegisterApi) return true;

      if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

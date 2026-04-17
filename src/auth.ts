import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./lib/mongodb";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection("users").findOne({ email: credentials.email });

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordCorrect) return null;

        // Trava de Segurança: Bloqueio de assinaturas não ativas
        // O administrador mestre tem bypass permanente
        const adminEmail = 'lucianoxote@hotmail.com';
        const isStatusBlocked = user.subscriptionStatus && user.subscriptionStatus !== 'Ativo';
        
        if (user.email !== adminEmail && isStatusBlocked) {
          // Lançamos um erro específico que o front-end possa identificar
          throw new Error(`STATUS_BLOCKED:${user.subscriptionStatus}`);
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || 'user',
          tenantId: user.tenantId?.toString() || user._id.toString(),
          plan: user.plan || 'Gratuito',
          subscriptionStatus: user.subscriptionStatus || 'Ativo',
          trialEndsAt: user.trialEndsAt || null,
        };
      },
    }),
  ],
});

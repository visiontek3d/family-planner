import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  logger: {
    error: (error) => {
      const e = error as Error & { cause?: unknown; type?: string };
      console.error("[NextAuth error]", JSON.stringify({
        type: e.type ?? e.name,
        message: e.message,
        cause: e.cause instanceof Error
          ? { message: e.cause.message, code: (e.cause as NodeJS.ErrnoException).code }
          : String(e.cause ?? ""),
      }));
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id) {
        await prisma.account.updateMany({
          where: { userId: user.id, provider: "google" },
          data: {
            access_token: account.access_token,
            ...(account.refresh_token ? { refresh_token: account.refresh_token } : {}),
            expires_at: account.expires_at,
            scope: account.scope,
          },
        });
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

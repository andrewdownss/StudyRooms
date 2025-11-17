import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { container } from "./container";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          const authService = container.credentialsAuthService;
          const user = await authService.validateCredentials(
            credentials.email,
            credentials.password
          );
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For credentials provider, validation already happened in authorize()
      if (account?.provider === 'credentials') {
        return true;
      }
      
      return true; // Allow sign-in
    },
    async jwt({ token, account, profile, user }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      if (profile) {
        token.profile = profile;
      }
      
      // Cache user ID in token from initial sign-in
      if (user?.id) {
        token.userId = user.id;
      }
      
      // Attach role and userId from DB; use user on initial sign-in, otherwise look up by email
      try {
        const email = (user?.email as string) || (token?.email as string);
        if (email) {
          const dbUser = await prisma.user.findUnique({ 
            where: { email },
            select: { id: true, role: true }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.userId = dbUser.id; // Cache userId in token
          }
        }
      } catch {
        // swallow to avoid breaking auth on role lookup failure
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      // Expose role and userId on the session
      if (session.user) {
        session.user.role = token.role ?? "user";
        session.user.id = token.userId as string; // Expose userId from token
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign-in
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    user: {
      id?: string; // User ID cached from JWT
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string; // "user" | "admin"
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string; // User ID cached in token
    accessToken?: string;
    idToken?: string;
    profile?: unknown;
    role?: string; // "user" | "admin"
  }
}

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Check if user email ends with @g.cofc.edu
      if (user.email && !user.email.endsWith("@g.cofc.edu")) {
        return false; // Deny sign-in
      }
      return true; // Allow sign-in
    },
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      if (profile) {
        token.profile = profile;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
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
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    profile?: unknown;
  }
}

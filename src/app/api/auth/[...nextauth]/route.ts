import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  // Await params to satisfy Next.js 15 requirements
  await context.params;
  return handler(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  // Await params to satisfy Next.js 15 requirements
  await context.params;
  return handler(req, context);
}

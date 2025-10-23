import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/http/middleware/auth";

export async function GET() {
  const orgs = await prisma.organization.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(orgs);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug } = body as { name?: string; slug?: string };
    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    const org = await prisma.organization.create({ data: { name, slug } });
    return NextResponse.json(org, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

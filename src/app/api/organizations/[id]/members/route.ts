import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/http/middleware/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const userId = await getCurrentUserId();
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!current || current.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body as {
      email?: string;
      role?: "owner" | "officer" | "member";
    };
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const membership = await prisma.orgMembership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      update: { role: role || "officer" },
      create: { userId: user.id, organizationId, role: role || "officer" },
      include: { user: true, organization: true },
    });

    return NextResponse.json({
      id: membership.id,
      role: membership.role,
      user: { id: membership.userId, email: membership.user?.email },
      organization: {
        id: membership.organizationId,
        name: membership.organization?.name,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}

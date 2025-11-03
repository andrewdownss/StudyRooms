import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IssueCreateSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = IssueCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    const { email, issueType, title, description, bookingId, roomId } =
      parsed.data;

    const created = await prisma.issue.create({
      data: {
        userId,
        email: email ?? (session?.user?.email as string | null) ?? null,
        issueType,
        description,
        bookingId: bookingId ?? null,
        roomId: roomId ?? null,
        // title is optional in schema; keep for future if added to model
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit issue" },
      { status: 500 }
    );
  }
}

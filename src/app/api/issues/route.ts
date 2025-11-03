import { NextResponse } from "next/server";
import { z } from "zod";
import { IssueCreateSchema } from "@/lib/validation/schemas";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

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
    const userId = session?.user?.id ?? null;

    const { email, issueType, title, description, bookingId, roomId } = parsed.data;

    const created = await prisma.issue.create({
      data: {
        userId,
        email: email ?? session?.user?.email ?? null,
        issueType,
        description,
        bookingId: bookingId ?? null,
        roomId: roomId ?? null,
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to submit issue" }, { status: 500 });
  }
}



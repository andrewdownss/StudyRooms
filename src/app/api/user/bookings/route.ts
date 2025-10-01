import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/bookings - Get current user's bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");

    const whereClause: any = {
      userId: user.id,
    };

    if (status) {
      whereClause.status = status;
    }

    if (upcoming === "true") {
      whereClause.date = {
        gte: new Date(),
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user bookings" },
      { status: 500 }
    );
  }
}

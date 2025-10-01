import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/rooms/categories - Get room categories with counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomsByCategory = await prisma.room.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
    });

    const categories = roomsByCategory.map((item) => ({
      id: item.category,
      name: item.category === "small" ? "Small Room" : "Large Room",
      capacity: item.category === "small" ? "1-4 people" : "5-12 people",
      description:
        item.category === "small"
          ? "Perfect for individual or small group study"
          : "Ideal for group projects and team meetings",
      count: item._count.id,
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching room categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch room categories" },
      { status: 500 }
    );
  }
}

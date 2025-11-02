/**
 * User Bookings API Routes (V2)
 * Get current user's bookings with optional filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/lib/container";

// GET /api/v2/user/bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for query parameters
    const searchParams = request.nextUrl.searchParams;
    const upcoming = searchParams.get("upcoming") === "true";
    const status = searchParams.get("status");

    let bookings;
    if (upcoming) {
      bookings = await container.bookingRepository.findUpcoming(user.id);
    } else {
      bookings = await container.bookingRepository.findByUser(user.id);
    }

    // Filter by status if provided
    if (status) {
      bookings = bookings.filter((b) => b.status === status);
    }

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}


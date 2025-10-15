/**
 * User Bookings API Routes
 * 
 * Thin layer that delegates to BookingHandler for user-specific bookings.
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { BookingHandler } from "@/lib/http/handlers/BookingHandler";
import { getCurrentUserId } from "@/lib/http/middleware/auth";
import { ApplicationError } from "@/lib/errors";

// GET /api/user/bookings - Get current user's bookings
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const handler = new BookingHandler(container.bookingService);
    return handler.getUserBookings(userId, userId);
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Bookings API Routes
 * 
 * Thin layer that delegates to BookingHandler.
 * Handles authentication and HTTP routing only.
 */

import { NextRequest } from "next/server";
import { container } from "@/lib/container";
import { BookingHandler } from "@/lib/http/handlers/BookingHandler";
import { getCurrentUserId } from "@/lib/http/middleware/auth";
import { ApplicationError } from "@/lib/errors";
import { NextResponse } from "next/server";

// GET /api/bookings - Get all bookings
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const handler = new BookingHandler(container.bookingService);
    return handler.getBookings(request, userId);
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

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const handler = new BookingHandler(container.bookingService);
    return handler.createBooking(request, userId);
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

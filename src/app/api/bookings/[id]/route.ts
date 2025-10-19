/**
 * Individual Booking API Routes
 * 
 * Thin layer that delegates to BookingHandler.
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { BookingHandler } from "@/lib/http/handlers/BookingHandler";
import { getCurrentUserId } from "@/lib/http/middleware/auth";
import { ApplicationError } from "@/lib/errors";

// GET /api/bookings/[id] - Get a specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    const handler = new BookingHandler(container.bookingService);
    return handler.getBooking(id, userId);
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

// PATCH /api/bookings/[id] - Update a booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    const handler = new BookingHandler(container.bookingService);
    return handler.updateBooking(request, id, userId);
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

// DELETE /api/bookings/[id] - Delete a booking (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getCurrentUserId();
    const handler = new BookingHandler(container.bookingService);
    return handler.deleteBooking(id, userId);
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

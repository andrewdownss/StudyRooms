/**
 * Individual Booking API Routes (V2)
 * Handles operations on specific bookings
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/lib/container";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "rejected"]),
});

// GET /api/v2/bookings/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const booking = await container.bookingRepository.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Authorization: user can only see their own bookings (unless admin)
    if (user.role !== "admin" && booking.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/bookings/[id] - Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const booking = await container.bookingRepository.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Authorization: user can only update their own bookings (unless admin)
    if (user.role !== "admin" && booking.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = updateSchema.parse(body);

    const updatedBooking = await container.bookingRepository.updateStatus(
      id,
      status
    );

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error("Error updating booking:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/bookings/[id] - Delete booking (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can delete bookings
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const booking = await container.bookingRepository.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await container.bookingRepository.delete(id);

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete booking" },
      { status: 500 }
    );
  }
}


/**
 * TimeSlot Booking API Endpoint (V2)
 * Uses the new TimeSlot-based booking system
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/lib/container";
import { z } from "zod";

const bookingSchema = z.object({
  roomId: z.string(),
  date: z.string().transform((str) => new Date(str)),
  startSlot: z.string(), // "14:00" format
  durationMinutes: z.number().min(30).max(240),
  organizationId: z.string().optional(),
});

// GET /api/v2/bookings - List bookings (admin sees all, users see their own)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const date = searchParams.get("date")
      ? new Date(searchParams.get("date")!)
      : undefined;

    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin sees all bookings, regular users see only their own
    const bookings =
      user.role === "admin"
        ? await container.bookingRepository.findAll({
            limit,
            filters: date ? { date } : undefined,
            orderBy: "date",
            orderDirection: "desc",
          })
        : await container.bookingRepository.findByUser(user.id);

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    // Get the room to determine its category
    const room = await container.roomRepository.findById(validatedData.roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Create TimeRange from start slot and duration
    const { TimeSlot, TimeRange } = await import("@/lib/domain/timeslot");
    const startSlot = TimeSlot.fromString(validatedData.startSlot);
    const timeRange = TimeRange.fromStartAndDuration(
      startSlot,
      validatedData.durationMinutes
    );

    const timeSlotBookingService = container.timeSlotBookingService;

    const booking = await timeSlotBookingService.createBooking({
      userId: session.user.id!,
      category: room.category as "small" | "large",
      date: validatedData.date,
      timeRange: timeRange,
      organizationId: validatedData.organizationId,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    if (error.message?.includes("not available")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}


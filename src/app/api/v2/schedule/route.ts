/**
 * TimeSlot Schedule API Endpoint (v2)
 * 
 * New API endpoint using the TimeSlot booking system
 * Demonstrates integration with Next.js API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/lib/container";
import { TimeRange } from "@/lib/domain/timeslot";
import { RoomCategory } from "@/lib/interfaces/domain";

/**
 * GET /api/v2/schedule
 * Get available time slots for a date and category
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const category = searchParams.get("category") as RoomCategory;
    const duration = parseInt(searchParams.get("duration") || "60");

    if (!date || !category) {
      return NextResponse.json(
        { error: "Missing required parameters: date, category" },
        { status: 400 }
      );
    }

    const timeSlotService = container.timeSlotBookingService;

    // Get available slots
    const slots = await timeSlotService.findAvailableSlots(
      new Date(date),
      category,
      duration
    );

    // Get statistics
    const stats = await timeSlotService.getAvailabilityStatistics(
      new Date(date),
      category
    );

    return NextResponse.json({
      success: true,
      data: {
        date,
        category,
        duration,
        availableSlots: slots.map((slot) => ({
          time: slot.toString(),
          displayTime: slot.toDisplayString(),
        })),
        statistics: {
          totalSlots: stats.totalSlots,
          availableSlots: stats.availableSlots,
          bookedSlots: stats.bookedSlots,
          utilizationPercentage: Math.round(stats.utilizationPercentage),
        },
      },
    });
  } catch (error) {
    console.error("Schedule API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/schedule
 * Create a booking using TimeSlot system
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, startTime, duration, category, organizationId } = body;

    if (!date || !startTime || !duration || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const timeSlotService = container.timeSlotBookingService;

    // Create time range
    const timeRange = TimeRange.fromLegacy(startTime, duration);

    // Create booking
    const booking = await timeSlotService.createBooking({
      userId: session.user.id,
      category: category as RoomCategory,
      date: new Date(date),
      timeRange,
      organizationId,
    });

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          date: booking.date,
          startTime: booking.startTime,
          duration: booking.duration,
          status: booking.status,
          room: booking.room,
        },
      },
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 400 }
    );
  }
}


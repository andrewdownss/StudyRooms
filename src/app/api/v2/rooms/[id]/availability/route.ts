/**
 * Room Availability API (V2) - TimeSlot System
 * Get available time slots for a specific room
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const durationMinutes = searchParams.get("duration");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    const duration = durationMinutes ? parseInt(durationMinutes) : 30;

    // Get the specific room
    const room = await container.roomRepository.findById(id);
    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Get bookings for this specific room on this date
    const bookings = await container.bookingRepository.findByRoom(id, dateObj);
    
    // Build time ranges from bookings
    const { TimeRange } = await import("@/lib/domain/timeslot");
    const { DailySchedule } = await import("@/lib/domain/timeslot");
    
    const bookedRanges = bookings
      .filter((b) => b.status === "confirmed")
      .map((b) => TimeRange.fromLegacy(b.startTime, b.duration));
    
    // Create daily schedule
    const schedule = new DailySchedule(dateObj, bookedRanges, { start: 8, end: 22 });
    
    // Get available slots
    const availableSlots = schedule.getAvailableSlotsForDuration(duration);

    // Convert TimeSlot objects to strings for JSON response
    const slots = availableSlots.map((slot) => ({
      time: slot.toString(),
      display: slot.toDisplayString(),
      minutes: slot.getMinutes(),
    }));

    return NextResponse.json({
      roomId: id,
      date: dateObj.toISOString().split("T")[0],
      duration,
      availableSlots: slots,
      count: slots.length,
    });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}


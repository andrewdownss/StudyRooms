import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bookings - Get all bookings (or filter by query params)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    const userId = searchParams.get("userId");

    const bookings = await prisma.booking.findMany({
      where: userId ? { userId } : undefined,
      take: limit ? parseInt(limit) : undefined,
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { category, date, startTime, duration } = body;

    if (!category || !date || !startTime || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find available rooms
    const availableRooms = await findAvailableRooms(
      category,
      date,
      startTime,
      duration
    );

    if (availableRooms.length === 0) {
      return NextResponse.json(
        { error: "No rooms available for the selected time slot" },
        { status: 409 }
      );
    }

    // Create the booking with the first available room
    const room = availableRooms[0];
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        date: new Date(date),
        startTime,
        duration,
        status: "confirmed",
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// Helper function to find available rooms
async function findAvailableRooms(
  category: string,
  date: string,
  startTime: string,
  duration: number
) {
  const bookingDate = new Date(date);

  // Get all rooms of the specified category
  const rooms = await prisma.room.findMany({
    where: { category },
  });

  // For each room, check if it has any conflicting bookings
  const availableRooms = [];

  for (const room of rooms) {
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
        date: bookingDate,
        status: "confirmed",
      },
    });

    const hasConflict = conflictingBookings.some((booking) => {
      const existingStart = parseTime(booking.startTime);
      const existingEnd = existingStart + booking.duration;
      const newStart = parseTime(startTime);
      const newEnd = newStart + duration;

      // Check for overlap
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (!hasConflict) {
      availableRooms.push(room);
    }
  }

  return availableRooms;
}

// Helper function to convert time string to minutes
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

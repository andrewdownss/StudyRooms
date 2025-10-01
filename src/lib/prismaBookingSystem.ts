import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type BookingCreateInput = {
  userId: string;
  date: string;
  startTime: string;
  duration: number;
  category: "small" | "large";
};

export class PrismaBookingSystem {
  // Find available rooms for a given time slot
  async findAvailableRooms(
    category: "small" | "large",
    date: string,
    startTime: string,
    duration: number
  ) {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Find rooms of the specified category that don't have conflicting bookings
    const availableRooms = await prisma.room.findMany({
      where: {
        category,
        bookings: {
          none: {
            date: new Date(date),
            AND: [
              {
                OR: [
                  {
                    // Check if the new booking starts during an existing booking
                    startTime: {
                      lte: startTime,
                    },
                    AND: {
                      // Calculate end time and check for overlap
                      startTime: {
                        gt: new Date(startDateTime.getTime() - duration * 60000)
                          .toISOString()
                          .split("T")[1]
                          .substring(0, 5),
                      },
                    },
                  },
                  {
                    // Check if the new booking ends during an existing booking
                    startTime: {
                      gte: startTime,
                      lt: new Date(endDateTime)
                        .toISOString()
                        .split("T")[1]
                        .substring(0, 5),
                    },
                  },
                ],
              },
              {
                status: "confirmed",
              },
            ],
          },
        },
      },
    });

    return availableRooms;
  }

  // Create a new booking
  async createBooking(input: BookingCreateInput) {
    const availableRooms = await this.findAvailableRooms(
      input.category,
      input.date,
      input.startTime,
      input.duration
    );

    if (availableRooms.length === 0) {
      throw new Error("No rooms available for the selected time slot");
    }

    // Select the first available room
    const room = availableRooms[0];

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: input.userId,
        roomId: room.id,
        date: new Date(input.date),
        startTime: input.startTime,
        duration: input.duration,
        status: "confirmed",
      },
      include: {
        room: true,
        user: true,
      },
    });

    return booking;
  }

  // Get user's bookings
  async getUserBookings(userId: string) {
    return prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        room: true,
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  // Get recent bookings
  async getRecentBookings(limit = 5) {
    return prisma.booking.findMany({
      take: limit,
      include: {
        room: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Cancel a booking
  async cancelBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId !== userId) {
      throw new Error("Not authorized to cancel this booking");
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: "cancelled" },
      include: {
        room: true,
      },
    });
  }

  // Get room categories
  async getRoomCategories() {
    const rooms = await prisma.room.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
    });

    return rooms.map((room) => ({
      id: room.category,
      name: room.category === "small" ? "Small Room" : "Large Room",
      capacity: room.category === "small" ? "1-4 people" : "5-12 people",
      description:
        room.category === "small"
          ? "Perfect for individual or small group study"
          : "Ideal for group projects and team meetings",
      count: room._count.id,
    }));
  }

  // Initialize default rooms if none exist
  async initializeDefaultRooms() {
    const roomCount = await prisma.room.count();

    if (roomCount === 0) {
      // Create some default rooms
      await prisma.room.createMany({
        data: [
          {
            name: "Study Room 101",
            category: "small",
            capacity: 4,
            description: "Small study room on the first floor",
          },
          {
            name: "Study Room 102",
            category: "small",
            capacity: 4,
            description: "Small study room on the first floor",
          },
          {
            name: "Study Room 103",
            category: "small",
            capacity: 4,
            description: "Small study room on the first floor",
          },
          {
            name: "Study Room 201",
            category: "large",
            capacity: 12,
            description: "Large study room on the second floor",
          },
          {
            name: "Study Room 202",
            category: "large",
            capacity: 12,
            description: "Large study room on the second floor",
          },
        ],
      });
    }
  }
}

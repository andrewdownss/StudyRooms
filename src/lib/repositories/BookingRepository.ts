/**
 * Booking Repository Implementation
 *
 * Handles all database operations for bookings using Prisma.
 * Abstracts away Prisma implementation details.
 */

import { prisma } from "../prisma";
import {
  IBookingRepository,
  BookingCreateData,
  BookingFilters,
  FindAllOptions,
} from "../interfaces/repositories";
import { IBooking, BookingStatus } from "../interfaces/domain";
import { NotFoundError } from "../errors";

export class BookingRepository implements IBookingRepository {
  /**
   * Create a new booking
   */
  async create(data: BookingCreateData): Promise<IBooking> {
    const booking = await prisma.booking.create({
      data: {
        userId: data.userId,
        roomId: data.roomId,
        ...(data.organizationId && { organizationId: data.organizationId }),
        date: data.date,
        startTime: data.startTime,
        duration: data.duration,
        status: data.status || "confirmed",
        // @ts-ignore - Prisma client will be regenerated
        visibility: data.visibility || "private",
        // @ts-ignore - Prisma client will be regenerated
        maxParticipants: data.maxParticipants || 1,
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
      },
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.toDomain(booking);
  }

  /**
   * Find booking by ID
   */
  async findById(id: string): Promise<IBooking | null> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    return booking ? this.toDomain(booking) : null;
  }

  /**
   * Find all bookings for a user
   */
  async findByUser(userId: string): Promise<IBooking[]> {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return bookings.map((b: any) => this.toDomain(b));
  }

  /**
   * Find all bookings for a room
   */
  async findByRoom(roomId: string, date?: Date): Promise<IBooking[]> {
    const where: any = { roomId };
    if (date) {
      where.date = date;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return bookings.map((b: any) => this.toDomain(b));
  }

  /**
   * Find bookings within a date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<IBooking[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return bookings.map((b: any) => this.toDomain(b));
  }

  /**
   * Find upcoming bookings for a user
   */
  async findUpcoming(userId: string): Promise<IBooking[]> {
    const now = new Date();
    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        date: {
          gte: now,
        },
        status: "confirmed",
      },
      include: {
        user: true,
        room: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return bookings.map((b: any) => this.toDomain(b));
  }

  /**
   * Find all bookings with optional filters
   */
  async findAll(options?: FindAllOptions): Promise<IBooking[]> {
    const where: any = {};

    if (options?.filters) {
      if (options.filters.userId) {
        where.userId = options.filters.userId;
      }
      if (options.filters.roomId) {
        where.roomId = options.filters.roomId;
      }
      if (options.filters.status) {
        where.status = options.filters.status;
      }
      if (options.filters.date) {
        where.date = options.filters.date;
      }
      if (options.filters.startDate && options.filters.endDate) {
        where.date = {
          gte: options.filters.startDate,
          lte: options.filters.endDate,
        };
      }
      if (options.filters.visibility) {
        where.visibility = options.filters.visibility;
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: {
        [options?.orderBy || "createdAt"]: options?.orderDirection || "desc",
      },
      include: {
        user: options?.includeUser !== false,
        room: options?.includeRoom !== false,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return bookings.map((b: any) => this.toDomain(b));
  }

  /**
   * Update a booking
   */
  async update(id: string, data: Partial<IBooking>): Promise<IBooking> {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.date && { date: data.date }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.duration && { duration: data.duration }),
        ...(data.organizationId !== undefined && {
          organizationId: data.organizationId,
        }),
        // @ts-ignore - Prisma client will be regenerated
        ...(data.visibility && { visibility: data.visibility }),
        // @ts-ignore - Prisma client will be regenerated
        ...(data.maxParticipants && { maxParticipants: data.maxParticipants }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      },
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.toDomain(booking);
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, status: BookingStatus): Promise<IBooking> {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.toDomain(booking);
  }

  /**
   * Delete a booking
   */
  async delete(id: string): Promise<void> {
    await prisma.booking.delete({
      where: { id },
    });
  }

  /**
   * Count bookings with optional filters
   */
  async count(filters?: BookingFilters): Promise<number> {
    const where: any = {};

    if (filters) {
      if (filters.userId) where.userId = filters.userId;
      if (filters.roomId) where.roomId = filters.roomId;
      if (filters.status) where.status = filters.status;
      if (filters.date) where.date = filters.date;
    }

    return prisma.booking.count({ where });
  }

  /**
   * Check if booking exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.booking.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Find public bookings (for browsing)
   */
  async findPublicBookings(date?: Date): Promise<IBooking[]> {
    const where: any = {
      // @ts-ignore - Prisma client will be regenerated
      visibility: { in: ['public', 'org'] },
      status: 'confirmed',
    };

    if (date) {
      where.date = date;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: true,
        room: true,
        organization: true,
        // @ts-ignore - Prisma client will be regenerated
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return bookings.map((b: any) => this.toDomain(b));
  }

  /**
   * Add a participant to a booking
   */
  async addParticipant(bookingId: string, userId: string): Promise<void> {
    // @ts-ignore - Prisma client will be regenerated
    await prisma.bookingParticipant.create({
      data: {
        bookingId,
        userId,
        role: 'participant',
      },
    });
  }

  /**
   * Remove a participant from a booking
   */
  async removeParticipant(bookingId: string, userId: string): Promise<void> {
    // @ts-ignore - Prisma client will be regenerated
    await prisma.bookingParticipant.deleteMany({
      where: {
        bookingId,
        userId,
      },
    });
  }

  /**
   * Convert Prisma model to domain model
   */
  private toDomain(prismaBooking: any): IBooking {
    return {
      id: prismaBooking.id,
      userId: prismaBooking.userId,
      roomId: prismaBooking.roomId,
      organizationId: prismaBooking.organizationId || undefined,
      date: prismaBooking.date,
      startTime: prismaBooking.startTime,
      duration: prismaBooking.duration,
      status: prismaBooking.status as BookingStatus,
      createdAt: prismaBooking.createdAt,
      updatedAt: prismaBooking.updatedAt,
      visibility: prismaBooking.visibility || 'private',
      maxParticipants: prismaBooking.maxParticipants || 1,
      title: prismaBooking.title || undefined,
      description: prismaBooking.description || undefined,
      ...(prismaBooking.user && { user: prismaBooking.user }),
      ...(prismaBooking.room && { room: prismaBooking.room }),
      ...(prismaBooking.organization && {
        organization: prismaBooking.organization,
      }),
      ...(prismaBooking.participants && {
        participants: prismaBooking.participants.map((p: any) => ({
          id: p.id,
          bookingId: p.bookingId,
          userId: p.userId,
          role: p.role,
          joinedAt: p.joinedAt,
          ...(p.user && { user: p.user }),
        })),
      }),
    };
  }
}

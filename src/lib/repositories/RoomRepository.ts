/**
 * Room Repository Implementation
 * 
 * Handles all database operations for rooms using Prisma.
 */

import { prisma } from '../prisma';
import { IRoomRepository, RoomCreateData } from '../interfaces/repositories';
import { IRoom, RoomCategory } from '../interfaces/domain';

export class RoomRepository implements IRoomRepository {
  /**
   * Create a new room
   */
  async create(data: RoomCreateData): Promise<IRoom> {
    const room = await prisma.room.create({
      data: {
        name: data.name,
        category: data.category,
        capacity: data.capacity,
        description: data.description || null,
      },
    });

    return this.toDomain(room);
  }

  /**
   * Create multiple rooms
   */
  async createMany(data: RoomCreateData[]): Promise<IRoom[]> {
    await prisma.room.createMany({
      data: data.map(d => ({
        name: d.name,
        category: d.category,
        capacity: d.capacity,
        description: d.description || null,
      })),
    });

    // Fetch created rooms
    const rooms = await prisma.room.findMany({
      where: {
        name: {
          in: data.map(d => d.name),
        },
      },
    });

    return rooms.map(r => this.toDomain(r));
  }

  /**
   * Find room by ID
   */
  async findById(id: string): Promise<IRoom | null> {
    const room = await prisma.room.findUnique({
      where: { id },
    });

    return room ? this.toDomain(room) : null;
  }

  /**
   * Find rooms by category
   */
  async findByCategory(category: RoomCategory): Promise<IRoom[]> {
    const rooms = await prisma.room.findMany({
      where: { category },
      orderBy: {
        name: 'asc',
      },
    });

    return rooms.map(r => this.toDomain(r));
  }

  /**
   * Find all rooms
   */
  async findAll(): Promise<IRoom[]> {
    const rooms = await prisma.room.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return rooms.map(r => this.toDomain(r));
  }

  /**
   * Find available rooms for a time slot
   */
  async findAvailable(
    category: RoomCategory,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<IRoom[]> {
    // Get all rooms of the category
    const rooms = await prisma.room.findMany({
      where: { category },
    });

    // For each room, check if it has conflicting bookings
    const availableRooms: IRoom[] = [];

    for (const room of rooms) {
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          roomId: room.id,
          date: date,
          status: 'confirmed',
        },
      });

      const hasConflict = conflictingBookings.some(booking => {
        const existingStart = this.parseTime(booking.startTime);
        const existingEnd = existingStart + booking.duration;
        const newStart = this.parseTime(startTime);
        const newEnd = newStart + duration;

        return (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        );
      });

      if (!hasConflict) {
        availableRooms.push(this.toDomain(room));
      }
    }

    return availableRooms;
  }

  /**
   * Update a room
   */
  async update(id: string, data: Partial<IRoom>): Promise<IRoom> {
    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      },
    });

    return this.toDomain(room);
  }

  /**
   * Delete a room
   */
  async delete(id: string): Promise<void> {
    await prisma.room.delete({
      where: { id },
    });
  }

  /**
   * Count rooms by category
   */
  async count(category?: RoomCategory): Promise<number> {
    return prisma.room.count({
      where: category ? { category } : undefined,
    });
  }

  /**
   * Check if room exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.room.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert Prisma model to domain model
   */
  private toDomain(prismaRoom: any): IRoom {
    return {
      id: prismaRoom.id,
      name: prismaRoom.name,
      category: prismaRoom.category as RoomCategory,
      capacity: prismaRoom.capacity,
      description: prismaRoom.description,
      createdAt: prismaRoom.createdAt,
      updatedAt: prismaRoom.updatedAt,
    };
  }
}


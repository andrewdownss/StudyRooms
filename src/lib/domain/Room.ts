/**
 * Room Domain Model
 * 
 * Rich domain object with business logic for rooms.
 */

import { IRoom, IRoomEntity, IBooking, RoomCategory } from '../interfaces/domain';
import { ValidationError } from '../errors';

export class RoomEntity implements IRoomEntity {
  id: string;
  name: string;
  category: RoomCategory;
  capacity: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IRoom) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.capacity = data.capacity;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Check if room can accommodate a number of people
   */
  canAccommodate(people: number): boolean {
    return people > 0 && people <= this.capacity;
  }

  /**
   * Check if room is available for a specific time slot
   */
  isAvailable(
    date: Date,
    startTime: string,
    duration: number,
    existingBookings: IBooking[]
  ): boolean {
    // Filter bookings for this room on this date
    const relevantBookings = existingBookings.filter(booking => 
      booking.roomId === this.id &&
      booking.date.toDateString() === date.toDateString() &&
      booking.status === 'confirmed'
    );

    // Check for conflicts
    const requestedStart = this.parseTime(startTime);
    const requestedEnd = requestedStart + duration;

    for (const booking of relevantBookings) {
      const bookingStart = this.parseTime(booking.startTime);
      const bookingEnd = bookingStart + booking.duration;

      // Check for overlap
      const hasConflict = (
        (requestedStart >= bookingStart && requestedStart < bookingEnd) ||
        (requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
        (requestedStart <= bookingStart && requestedEnd >= bookingEnd)
      );

      if (hasConflict) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get display name based on category
   */
  getCategoryDisplay(): string {
    return this.category === 'small' ? 'Small Room (1-4 people)' : 'Large Room (5-12 people)';
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Validate room data
   */
  static validate(data: Partial<IRoom>): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Room name is required');
      }
      if (data.name.length > 100) {
        throw new ValidationError('Room name too long (max 100 characters)');
      }
    }

    if (data.capacity !== undefined) {
      if (data.capacity < 1) {
        throw new ValidationError('Room capacity must be at least 1');
      }
      if (data.capacity > 50) {
        throw new ValidationError('Room capacity too large (max 50)');
      }
    }

    if (data.description !== undefined && data.description !== null) {
      if (data.description.length > 500) {
        throw new ValidationError('Description too long (max 500 characters)');
      }
    }
  }

  /**
   * Create a new RoomEntity from plain data
   */
  static fromData(data: IRoom): RoomEntity {
    RoomEntity.validate(data);
    return new RoomEntity(data);
  }
}


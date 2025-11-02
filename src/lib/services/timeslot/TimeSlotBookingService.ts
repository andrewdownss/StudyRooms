/**
 * TimeSlot Booking Service
 * 
 * New booking service implementation using TimeSlot domain model
 * Runs in parallel with legacy system for testing and validation
 * 
 * OOP Principles:
 * - Service Layer: Orchestrates domain objects and repositories
 * - Dependency Inversion: Depends on abstractions (interfaces)
 * - Single Responsibility: Manages timeslot-based bookings
 * - Open/Closed: Extensible without modifying legacy system
 */

import { TimeSlot } from "../../domain/timeslot/TimeSlot";
import { TimeRange } from "../../domain/timeslot/TimeRange";
import { DailySchedule } from "../../domain/timeslot/DailySchedule";
import {
  IBookingRepository,
  IRoomRepository,
  IUserRepository,
} from "../../interfaces/repositories";
import { IBookingService } from "../../interfaces/services";
import {
  IBooking,
  IRoom,
  BookingStatus,
  RoomCategory,
} from "../../interfaces/domain";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "../../errors";
import { UserEntity } from "../../domain/User";

/**
 * Input for creating a booking with TimeSlot
 */
export interface TimeSlotBookingInput {
  userId: string;
  category: RoomCategory;
  date: Date;
  timeRange: TimeRange;
  organizationId?: string;
  visibility?: 'private' | 'public' | 'org';
  maxParticipants?: number;
  title?: string;
  description?: string;
}

/**
 * Input for checking availability
 */
export interface TimeSlotAvailabilityInput {
  category: RoomCategory;
  date: Date;
  timeRange: TimeRange;
  excludeBookingId?: string; // For checking availability when updating
}

/**
 * Interface for TimeSlot booking service
 */
export interface ITimeSlotBookingService {
  // Core operations
  createBooking(input: TimeSlotBookingInput): Promise<IBooking>;
  checkAvailability(input: TimeSlotAvailabilityInput): Promise<boolean>;
  findAvailableSlots(
    date: Date,
    category: RoomCategory,
    durationMinutes?: number
  ): Promise<TimeSlot[]>;
  findAvailableRanges(
    date: Date,
    category: RoomCategory,
    durationMinutes: number
  ): Promise<TimeRange[]>;
}

/**
 * Concrete implementation of TimeSlot booking service
 */
export class TimeSlotBookingService implements ITimeSlotBookingService {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly userRepository: IUserRepository
  ) {}

  // ============================================================================
  // CORE BOOKING OPERATIONS
  // ============================================================================

  /**
   * Create a new booking using TimeSlot model
   */
  async createBooking(input: TimeSlotBookingInput): Promise<IBooking> {
    // 1. Validate time range
    if (!input.timeRange.isValidBookingDuration()) {
      throw new ValidationError(
        "Duration must be between 30 and 240 minutes in 30-minute increments"
      );
    }

    // 2. Validate within operating hours
    if (!input.timeRange.isWithinOperatingHours(8, 22)) {
      throw new ValidationError(
        "Booking must be within operating hours (8:00 AM - 10:00 PM)"
      );
    }

    // 3. Get user and validate permissions
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const userEntity = UserEntity.fromData(user);

    // 4. Check user's duration limits
    const duration = input.timeRange.getDurationMinutes();
    if (duration > userEntity.getMaxBookingDuration()) {
      throw new ValidationError(
        `Your role allows maximum ${userEntity.getMaxBookingDuration()} minutes per booking`
      );
    }

    // 5. Check daily booking limit
    await this.validateDailyLimit(input.userId, input.date, duration, userEntity);

    // 6. Check availability
    const isAvailable = await this.checkAvailability({
      category: input.category,
      date: input.date,
      timeRange: input.timeRange,
    });

    if (!isAvailable) {
      throw new ConflictError(
        "No rooms available for the selected time slot. Please try a different time."
      );
    }

    // 7. Find an available room
    const room = await this.findAvailableRoom(input);
    if (!room) {
      throw new ConflictError("No rooms available");
    }

    // 8. Determine status
    const status: BookingStatus = input.organizationId ? "pending" : "confirmed";

    // 9. Validate public booking requirements
    if (input.visibility === 'public' || input.visibility === 'org') {
      if (!input.title || input.title.trim().length === 0) {
        throw new ValidationError('Title is required for public/organization bookings');
      }
      if (!input.maxParticipants || input.maxParticipants < 1) {
        throw new ValidationError('Max participants must be at least 1');
      }
      if (input.maxParticipants > room.capacity) {
        throw new ValidationError(`Max participants cannot exceed room capacity (${room.capacity})`);
      }
    }

    // 10. Convert to legacy format and create booking
    const legacy = input.timeRange.toLegacy();
    const booking = await this.bookingRepository.create({
      userId: input.userId,
      roomId: room.id,
      organizationId: input.organizationId,
      date: input.date,
      startTime: legacy.startTime,
      duration: legacy.duration,
      status,
      visibility: input.visibility || 'private',
      maxParticipants: input.maxParticipants || 1,
      title: input.title,
      description: input.description,
    });

    return booking;
  }

  /**
   * Check if a time range is available for booking
   */
  async checkAvailability(
    input: TimeSlotAvailabilityInput
  ): Promise<boolean> {
    const rooms = await this.roomRepository.findByCategory(input.category);

    for (const room of rooms) {
      const schedule = await this.buildDailySchedule(room.id, input.date);

      // If checking for update, remove the existing booking from schedule
      if (input.excludeBookingId) {
        // This would require fetching and removing the booking
        // For now, we check as-is
      }

      if (schedule.isAvailable(input.timeRange)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find all available time slots for a given date and category
   */
  async findAvailableSlots(
    date: Date,
    category: RoomCategory,
    durationMinutes: number = 30
  ): Promise<TimeSlot[]> {
    const rooms = await this.roomRepository.findByCategory(category);
    const allAvailableSlots = new Set<string>();

    for (const room of rooms) {
      const schedule = await this.buildDailySchedule(room.id, date);
      const slots = schedule.getAvailableSlotsForDuration(durationMinutes);
      slots.forEach((slot) => allAvailableSlots.add(slot.toString()));
    }

    // Convert back to TimeSlot objects and sort
    return Array.from(allAvailableSlots)
      .map((s) => TimeSlot.fromString(s))
      .sort((a, b) => a.getMinutes() - b.getMinutes());
  }

  /**
   * Find all available time ranges for a specific duration
   */
  async findAvailableRanges(
    date: Date,
    category: RoomCategory,
    durationMinutes: number
  ): Promise<TimeRange[]> {
    const slots = await this.findAvailableSlots(date, category, durationMinutes);
    return slots.map((slot) =>
      TimeRange.fromStartAndDuration(slot, durationMinutes)
    );
  }

  // ============================================================================
  // COMPARISON WITH LEGACY SYSTEM
  // ============================================================================


  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Build a daily schedule for a specific room
   */
  private async buildDailySchedule(
    roomId: string,
    date: Date
  ): Promise<DailySchedule> {
    const bookings = await this.bookingRepository.findByRoom(roomId, date);

    const bookedRanges = bookings
      .filter((b) => b.status === "confirmed")
      .map((b) => TimeRange.fromLegacy(b.startTime, b.duration));

    return new DailySchedule(date, bookedRanges, { start: 8, end: 22 });
  }

  /**
   * Find an available room for the given booking input
   */
  private async findAvailableRoom(
    input: TimeSlotBookingInput
  ): Promise<IRoom | null> {
    const rooms = await this.roomRepository.findByCategory(input.category);

    for (const room of rooms) {
      const schedule = await this.buildDailySchedule(room.id, input.date);
      if (schedule.isAvailable(input.timeRange)) {
        return room;
      }
    }

    return null;
  }

  /**
   * Validate user's daily booking limit
   */
  private async validateDailyLimit(
    userId: string,
    date: Date,
    additionalMinutes: number,
    userEntity: UserEntity
  ): Promise<void> {
    const userBookings = await this.bookingRepository.findByUser(userId);

    const todayBookings = userBookings.filter(
      (b) =>
        b.date.toDateString() === date.toDateString() &&
        b.status === "confirmed"
    );

    const totalMinutesToday = todayBookings.reduce(
      (sum, b) => sum + b.duration,
      0
    );

    const dailyLimit = userEntity.getDailyBookingLimit();

    if (totalMinutesToday + additionalMinutes > dailyLimit) {
      const remaining = dailyLimit - totalMinutesToday;
      throw new ValidationError(
        `Daily booking limit exceeded. You have ${remaining} minutes remaining today.`
      );
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get statistics for a specific date and category
   */
  async getAvailabilityStatistics(
    date: Date,
    category: RoomCategory
  ): Promise<{
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    utilizationPercentage: number;
  }> {
    const rooms = await this.roomRepository.findByCategory(category);
    let totalBookedMinutes = 0;
    const operatingMinutes = (22 - 8) * 60; // 8am to 10pm
    const totalMinutes = operatingMinutes * rooms.length;

    for (const room of rooms) {
      const schedule = await this.buildDailySchedule(room.id, date);
      totalBookedMinutes += schedule.getTotalBookedMinutes();
    }

    const availableMinutes = totalMinutes - totalBookedMinutes;
    const totalSlots = totalMinutes / 30;
    const bookedSlots = totalBookedMinutes / 30;

    return {
      totalSlots,
      availableSlots: totalSlots - bookedSlots,
      bookedSlots,
      utilizationPercentage: (totalBookedMinutes / totalMinutes) * 100,
    };
  }

  /**
   * Get optimal booking suggestions for a user
   * Finds the best available time slots based on preferences
   */
  async getSuggestedTimeSlots(
    date: Date,
    category: RoomCategory,
    durationMinutes: number,
    preferredStartHour?: number
  ): Promise<TimeSlot[]> {
    const availableSlots = await this.findAvailableSlots(
      date,
      category,
      durationMinutes
    );

    if (!preferredStartHour) {
      return availableSlots.slice(0, 5); // Return first 5
    }

    // Sort by proximity to preferred hour
    const preferredMinutes = preferredStartHour * 60;
    return availableSlots
      .sort((a, b) => {
        const distA = Math.abs(a.getMinutes() - preferredMinutes);
        const distB = Math.abs(b.getMinutes() - preferredMinutes);
        return distA - distB;
      })
      .slice(0, 5);
  }
}


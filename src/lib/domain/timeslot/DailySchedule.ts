/**
 * DailySchedule Domain Object
 * 
 * Manages all bookings for a specific room on a specific day
 * Provides availability checking and booking management
 * 
 * OOP Principles:
 * - Encapsulation: Complex availability logic hidden
 * - Immutability: addBooking returns new instance
 * - Single Responsibility: Manages one room's schedule for one day
 */

import { ValidationError } from "../../errors";
import { TimeSlot } from "./TimeSlot";
import { TimeRange } from "./TimeRange";

export class DailySchedule {
  private readonly date: Date;
  private readonly bookedRanges: ReadonlyArray<TimeRange>;
  private readonly operatingHours: { start: number; end: number };

  /**
   * Create a new daily schedule
   * @param date The date (time component ignored)
   * @param bookedRanges Existing bookings for this day
   * @param operatingHours Operating hours (default 8am - 10pm)
   */
  constructor(
    date: Date,
    bookedRanges: TimeRange[] = [],
    operatingHours: { start: number; end: number } = { start: 8, end: 22 }
  ) {
    // Normalize date to midnight
    this.date = new Date(date);
    this.date.setHours(0, 0, 0, 0);

    // Validate operating hours
    if (
      operatingHours.start < 0 ||
      operatingHours.start >= 24 ||
      operatingHours.end <= operatingHours.start ||
      operatingHours.end > 24
    ) {
      throw new ValidationError("Invalid operating hours");
    }

    this.operatingHours = operatingHours;

    // Validate and store booked ranges
    this.validateBookedRanges(bookedRanges);
    this.bookedRanges = Object.freeze([...bookedRanges]);
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get the date this schedule is for
   */
  getDate(): Date {
    return new Date(this.date);
  }

  /**
   * Get all booked time ranges
   */
  getBookedRanges(): ReadonlyArray<TimeRange> {
    return this.bookedRanges;
  }

  /**
   * Get operating hours
   */
  getOperatingHours(): { start: number; end: number } {
    return { ...this.operatingHours };
  }

  /**
   * Check if a specific time range is available
   * Returns true if no conflicts exist
   */
  isAvailable(range: TimeRange): boolean {
    // Check if within operating hours
    if (!this.isWithinOperatingHours(range)) {
      return false;
    }

    // Check for conflicts with existing bookings
    return !this.bookedRanges.some((booked) => booked.overlapsWith(range));
  }

  /**
   * Check if a time slot is available
   * A slot is available if a 30-minute booking starting at that slot is possible
   */
  isSlotAvailable(slot: TimeSlot): boolean {
    try {
      const range = TimeRange.fromStartAndDuration(slot, 30);
      return this.isAvailable(range);
    } catch {
      return false;
    }
  }

  /**
   * Get all available time slots for any duration
   * Returns slots where at least a 30-minute booking can start
   */
  getAvailableSlots(): TimeSlot[] {
    const available: TimeSlot[] = [];
    const start = TimeSlot.fromTime(this.operatingHours.start, 0);
    const end = TimeSlot.fromTime(this.operatingHours.end, 0);

    let current = start;
    while (current.isBefore(end)) {
      if (this.isSlotAvailable(current)) {
        available.push(current);
      }
      try {
        current = current.next();
      } catch {
        break;
      }
    }

    return available;
  }

  /**
   * Get available slots for a specific duration
   * Returns slots where a booking of the specified duration can start
   */
  getAvailableSlotsForDuration(durationMinutes: number): TimeSlot[] {
    if (durationMinutes % 30 !== 0) {
      throw new ValidationError("Duration must be in 30-minute increments");
    }

    const available: TimeSlot[] = [];
    const start = TimeSlot.fromTime(this.operatingHours.start, 0);
    const end = TimeSlot.fromTime(this.operatingHours.end, 0);

    let current = start;
    while (current.isBefore(end)) {
      try {
        const range = TimeRange.fromStartAndDuration(current, durationMinutes);
        if (this.isAvailable(range)) {
          available.push(current);
        }
        current = current.next();
      } catch {
        break;
      }
    }

    return available;
  }

  /**
   * Get all available time ranges for a specific duration
   * Returns actual TimeRange objects, not just start slots
   */
  getAvailableRanges(durationMinutes: number): TimeRange[] {
    const slots = this.getAvailableSlotsForDuration(durationMinutes);
    return slots.map((slot) =>
      TimeRange.fromStartAndDuration(slot, durationMinutes)
    );
  }

  /**
   * Find the maximum available duration starting from a specific slot
   * Returns 0 if slot is not available
   */
  getMaxAvailableDuration(startSlot: TimeSlot): number {
    if (!this.isSlotAvailable(startSlot)) {
      return 0;
    }

    const operatingEnd = TimeSlot.fromTime(this.operatingHours.end, 0);
    let duration = 30;
    let current = startSlot.next();

    while (current.isBeforeOrEqual(operatingEnd)) {
      try {
        const range = TimeRange.fromStartAndDuration(startSlot, duration + 30);
        if (!this.isAvailable(range)) {
          break;
        }
        duration += 30;
        current = current.next();
      } catch {
        break;
      }
    }

    return duration;
  }

  /**
   * Get the next available slot after a given time
   * Returns null if no slots available
   */
  getNextAvailableSlot(afterSlot: TimeSlot): TimeSlot | null {
    const end = TimeSlot.fromTime(this.operatingHours.end, 0);
    let current = afterSlot;

    try {
      current = current.next();
    } catch {
      return null;
    }

    while (current.isBefore(end)) {
      if (this.isSlotAvailable(current)) {
        return current;
      }
      try {
        current = current.next();
      } catch {
        break;
      }
    }

    return null;
  }

  /**
   * Calculate total booked minutes for the day
   */
  getTotalBookedMinutes(): number {
    return this.bookedRanges.reduce(
      (total, range) => total + range.getDurationMinutes(),
      0
    );
  }

  /**
   * Calculate total available minutes for the day
   */
  getTotalAvailableMinutes(): number {
    const totalMinutes =
      (this.operatingHours.end - this.operatingHours.start) * 60;
    return totalMinutes - this.getTotalBookedMinutes();
  }

  /**
   * Calculate utilization percentage (0-100)
   */
  getUtilizationPercentage(): number {
    const totalMinutes =
      (this.operatingHours.end - this.operatingHours.start) * 60;
    if (totalMinutes === 0) return 0;
    return (this.getTotalBookedMinutes() / totalMinutes) * 100;
  }

  // ============================================================================
  // COMMANDS (Return new instances - Immutability)
  // ============================================================================

  /**
   * Add a booking to the schedule
   * Returns a new DailySchedule instance
   * Throws if the time range is not available
   */
  addBooking(range: TimeRange): DailySchedule {
    if (!this.isAvailable(range)) {
      throw new ValidationError("Time range is not available");
    }

    const newBookedRanges = [...this.bookedRanges, range];
    return new DailySchedule(this.date, newBookedRanges, this.operatingHours);
  }

  /**
   * Remove a booking from the schedule
   * Returns a new DailySchedule instance
   * Returns same schedule if booking doesn't exist
   */
  removeBooking(range: TimeRange): DailySchedule {
    const newBookedRanges = this.bookedRanges.filter(
      (booked) => !booked.equals(range)
    );

    if (newBookedRanges.length === this.bookedRanges.length) {
      return this; // No change
    }

    return new DailySchedule(this.date, newBookedRanges, this.operatingHours);
  }

  /**
   * Clear all bookings
   * Returns a new empty schedule for the same day
   */
  clearBookings(): DailySchedule {
    return new DailySchedule(this.date, [], this.operatingHours);
  }

  // ============================================================================
  // BUSINESS LOGIC
  // ============================================================================

  /**
   * Check if a time range is within operating hours
   */
  private isWithinOperatingHours(range: TimeRange): boolean {
    return range.isWithinOperatingHours(
      this.operatingHours.start,
      this.operatingHours.end
    );
  }

  /**
   * Validate that booked ranges don't overlap
   * Throws ValidationError if conflicts found
   */
  private validateBookedRanges(ranges: TimeRange[]): void {
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (ranges[i].overlapsWith(ranges[j])) {
          throw new ValidationError(
            `Overlapping bookings found: ${ranges[i].toString()} and ${ranges[j].toString()}`
          );
        }
      }
    }
  }

  /**
   * Get a summary of the schedule
   */
  getSummary(): {
    date: string;
    operatingHours: string;
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    utilization: number;
  } {
    const totalMinutes =
      (this.operatingHours.end - this.operatingHours.start) * 60;
    const totalSlots = totalMinutes / 30;
    const bookedMinutes = this.getTotalBookedMinutes();
    const bookedSlots = bookedMinutes / 30;

    return {
      date: this.date.toISOString().split("T")[0],
      operatingHours: `${this.operatingHours.start}:00 - ${this.operatingHours.end}:00`,
      totalSlots,
      bookedSlots,
      availableSlots: totalSlots - bookedSlots,
      utilization: this.getUtilizationPercentage(),
    };
  }

  /**
   * Convert to JSON-serializable format
   */
  toJSON(): {
    date: string;
    bookedRanges: Array<{ start: string; end: string; duration: number }>;
    operatingHours: { start: number; end: number };
  } {
    return {
      date: this.date.toISOString(),
      bookedRanges: this.bookedRanges.map((range) => range.toJSON()),
      operatingHours: this.operatingHours,
    };
  }
}


/**
 * TimeRange Value Object
 * 
 * Represents a continuous range of time slots (immutable)
 * Encapsulates time interval logic with proper validation
 * 
 * OOP Principles:
 * - Immutability: All operations return new instances
 * - Encapsulation: Complex time logic hidden behind simple interface
 * - Value equality: Based on start/end times, not reference
 */

import { ValidationError } from "../../errors";
import { TimeSlot } from "./TimeSlot";

export class TimeRange {
  private readonly start: TimeSlot;
  private readonly end: TimeSlot;

  /**
   * Private constructor - use factory methods instead
   */
  private constructor(start: TimeSlot, end: TimeSlot) {
    if (!start.isBefore(end)) {
      throw new ValidationError("Start time must be before end time");
    }
    this.start = start;
    this.end = end;
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create TimeRange from two TimeSlots
   */
  static fromSlots(start: TimeSlot, end: TimeSlot): TimeRange {
    return new TimeRange(start, end);
  }

  /**
   * Create TimeRange from start slot and duration in minutes
   * @example TimeRange.fromStartAndDuration(TimeSlot.fromString("14:00"), 60)
   */
  static fromStartAndDuration(
    start: TimeSlot,
    durationMinutes: number
  ): TimeRange {
    if (durationMinutes < 30) {
      throw new ValidationError("Minimum duration is 30 minutes");
    }
    if (durationMinutes > 240) {
      throw new ValidationError("Maximum duration is 240 minutes (4 hours)");
    }
    if (durationMinutes % 30 !== 0) {
      throw new ValidationError("Duration must be in 30-minute increments");
    }

    const slots = durationMinutes / 30;
    const end = start.addSlots(slots);
    return new TimeRange(start, end);
  }

  /**
   * Create TimeRange from legacy string-based format
   * Used for compatibility with existing booking system
   * @example TimeRange.fromLegacy("14:00", 60)
   */
  static fromLegacy(startTime: string, duration: number): TimeRange {
    const start = TimeSlot.fromString(startTime);
    return TimeRange.fromStartAndDuration(start, duration);
  }

  /**
   * Create TimeRange from start/end strings
   * @example TimeRange.fromStrings("14:00", "15:30")
   */
  static fromStrings(startTime: string, endTime: string): TimeRange {
    const start = TimeSlot.fromString(startTime);
    const end = TimeSlot.fromString(endTime);
    return new TimeRange(start, end);
  }

  // ============================================================================
  // QUERIES (Accessors)
  // ============================================================================

  /**
   * Get the start time slot
   */
  getStart(): TimeSlot {
    return this.start;
  }

  /**
   * Get the end time slot (exclusive)
   */
  getEnd(): TimeSlot {
    return this.end;
  }

  /**
   * Get duration in minutes
   */
  getDurationMinutes(): number {
    return this.end.getMinutes() - this.start.getMinutes();
  }

  /**
   * Get duration in hours (decimal)
   */
  getDurationHours(): number {
    return this.getDurationMinutes() / 60;
  }

  /**
   * Get number of 30-minute slots
   */
  getSlotCount(): number {
    return this.getDurationMinutes() / 30;
  }

  /**
   * Get all time slots within this range (inclusive start, exclusive end)
   */
  getAllSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let current = this.start;

    while (current.isBefore(this.end)) {
      slots.push(current);
      current = current.next();
    }

    return slots;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `${this.start.toString()} - ${this.end.toString()}`;
  }

  /**
   * Convert to display format (12-hour)
   */
  toDisplayString(): string {
    return `${this.start.toDisplayString()} - ${this.end.toDisplayString()}`;
  }

  /**
   * Convert to JSON-serializable format
   */
  toJSON(): { start: string; end: string; duration: number } {
    return {
      start: this.start.toString(),
      end: this.end.toString(),
      duration: this.getDurationMinutes(),
    };
  }

  // ============================================================================
  // CONVERSIONS
  // ============================================================================

  /**
   * Convert to legacy format for compatibility with existing system
   */
  toLegacy(): { startTime: string; duration: number } {
    return {
      startTime: this.start.toString(),
      duration: this.getDurationMinutes(),
    };
  }

  // ============================================================================
  // COMMANDS (Return new instances - Immutability)
  // ============================================================================

  /**
   * Extend the range by adding duration to the end
   */
  extend(additionalMinutes: number): TimeRange {
    if (additionalMinutes % 30 !== 0) {
      throw new ValidationError("Extension must be in 30-minute increments");
    }
    const newEnd = this.end.addSlots(additionalMinutes / 30);
    return new TimeRange(this.start, newEnd);
  }

  /**
   * Shorten the range by reducing duration from the end
   */
  shorten(minutesToRemove: number): TimeRange {
    if (minutesToRemove % 30 !== 0) {
      throw new ValidationError("Reduction must be in 30-minute increments");
    }
    const newDuration = this.getDurationMinutes() - minutesToRemove;
    if (newDuration < 30) {
      throw new ValidationError("Resulting duration would be less than 30 minutes");
    }
    const newEnd = this.end.addSlots(-minutesToRemove / 30);
    return new TimeRange(this.start, newEnd);
  }

  /**
   * Shift the entire range forward or backward
   */
  shift(minutes: number): TimeRange {
    if (minutes % 30 !== 0) {
      throw new ValidationError("Shift must be in 30-minute increments");
    }
    const slots = minutes / 30;
    const newStart = this.start.addSlots(slots);
    const newEnd = this.end.addSlots(slots);
    return new TimeRange(newStart, newEnd);
  }

  // ============================================================================
  // COMPARISONS & RELATIONSHIPS
  // ============================================================================

  /**
   * Check if this range equals another
   * Value equality based on start and end times
   */
  equals(other: TimeRange): boolean {
    return this.start.equals(other.start) && this.end.equals(other.end);
  }

  /**
   * Check if this range completely overlaps with another
   * Returns true if there is any time overlap
   */
  overlapsWith(other: TimeRange): boolean {
    // No overlap if one ends exactly when the other starts
    if (this.end.equals(other.start) || other.end.equals(this.start)) {
      return false;
    }

    // No overlap if one is completely before the other
    if (this.end.isBefore(other.start) || other.end.isBefore(this.start)) {
      return false;
    }

    return true;
  }

  /**
   * Check if this range contains a specific time slot
   */
  contains(slot: TimeSlot): boolean {
    return (
      (slot.equals(this.start) || slot.isAfter(this.start)) &&
      slot.isBefore(this.end)
    );
  }

  /**
   * Check if this range completely contains another range
   */
  containsRange(other: TimeRange): boolean {
    return (
      (this.start.equals(other.start) || this.start.isBefore(other.start)) &&
      (this.end.equals(other.end) || this.end.isAfter(other.end))
    );
  }

  /**
   * Check if this range is completely before another
   */
  isBefore(other: TimeRange): boolean {
    return this.end.isBeforeOrEqual(other.start);
  }

  /**
   * Check if this range is completely after another
   */
  isAfter(other: TimeRange): boolean {
    return this.start.isAfterOrEqual(other.end);
  }

  /**
   * Check if this range is adjacent to another (touches but doesn't overlap)
   */
  isAdjacentTo(other: TimeRange): boolean {
    return this.end.equals(other.start) || this.start.equals(other.end);
  }

  /**
   * Get the overlap between this range and another
   * Returns null if no overlap
   */
  getOverlap(other: TimeRange): TimeRange | null {
    if (!this.overlapsWith(other)) {
      return null;
    }

    const overlapStart = this.start.isAfter(other.start) ? this.start : other.start;
    const overlapEnd = this.end.isBefore(other.end) ? this.end : other.end;

    return new TimeRange(overlapStart, overlapEnd);
  }

  // ============================================================================
  // BUSINESS LOGIC
  // ============================================================================

  /**
   * Check if entire range is within operating hours
   */
  isWithinOperatingHours(startHour: number = 8, endHour: number = 22): boolean {
    // All slots in the range must be within operating hours
    return this.getAllSlots().every((slot) =>
      slot.isWithinOperatingHours(startHour, endHour)
    );
  }

  /**
   * Validate duration constraints for booking rules
   */
  isValidBookingDuration(): boolean {
    const duration = this.getDurationMinutes();
    return duration >= 30 && duration <= 240 && duration % 30 === 0;
  }

  /**
   * Split the range into multiple smaller ranges
   * Useful for breaking up long bookings
   */
  split(chunkMinutes: number): TimeRange[] {
    if (chunkMinutes % 30 !== 0) {
      throw new ValidationError("Chunk size must be in 30-minute increments");
    }

    const ranges: TimeRange[] = [];
    let current = this.start;

    while (current.isBefore(this.end)) {
      const chunkSlots = Math.min(
        chunkMinutes / 30,
        this.end.slotsBetween(current)
      );
      const chunkEnd = current.addSlots(chunkSlots);
      ranges.push(new TimeRange(current, chunkEnd));
      current = chunkEnd;
    }

    return ranges;
  }
}


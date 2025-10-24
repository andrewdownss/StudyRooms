/**
 * TimeSlot Value Object
 * 
 * Represents a 30-minute booking block (immutable)
 * Core domain value object following OOP principles:
 * - Immutability: All operations return new instances
 * - Encapsulation: Private constructor, factory methods only
 * - Value equality: Based on minutes, not reference
 */

import { ValidationError } from "../../errors";

export class TimeSlot {
  private readonly minutesSinceMidnight: number;

  /**
   * Private constructor - use factory methods instead
   * Ensures all TimeSlots are valid and aligned to 30-min boundaries
   */
  private constructor(minutes: number) {
    if (minutes < 0 || minutes >= 1440) {
      throw new ValidationError(
        "Time slot must be between 00:00 and 23:30"
      );
    }
    if (minutes % 30 !== 0) {
      throw new ValidationError(
        "Time slot must be aligned to 30-minute intervals"
      );
    }
    this.minutesSinceMidnight = minutes;
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create TimeSlot from hours and minutes
   * @example TimeSlot.fromTime(14, 0) // 2:00 PM
   * @example TimeSlot.fromTime(9, 30) // 9:30 AM
   */
  static fromTime(hours: number, minutes: number): TimeSlot {
    if (hours < 0 || hours > 23) {
      throw new ValidationError("Hours must be between 0 and 23");
    }
    if (minutes < 0 || minutes > 59) {
      throw new ValidationError("Minutes must be between 0 and 59");
    }
    const totalMinutes = hours * 60 + minutes;
    return new TimeSlot(totalMinutes);
  }

  /**
   * Create TimeSlot from string (HH:MM format)
   * @example TimeSlot.fromString("14:00")
   * @example TimeSlot.fromString("09:30")
   */
  static fromString(time: string): TimeSlot {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(time)) {
      throw new ValidationError(
        "Time must be in HH:MM format (e.g., 14:00)"
      );
    }

    const [hours, minutes] = time.split(":").map(Number);
    return TimeSlot.fromTime(hours, minutes);
  }

  /**
   * Create TimeSlot from minutes since midnight
   * @example TimeSlot.fromMinutes(840) // 14:00 (14 * 60 = 840)
   */
  static fromMinutes(minutes: number): TimeSlot {
    return new TimeSlot(minutes);
  }

  /**
   * Get the first time slot of the day (00:00)
   */
  static startOfDay(): TimeSlot {
    return new TimeSlot(0);
  }

  /**
   * Get the last time slot of the day (23:30)
   */
  static endOfDay(): TimeSlot {
    return new TimeSlot(23 * 60 + 30);
  }

  // ============================================================================
  // QUERIES (Accessors)
  // ============================================================================

  /**
   * Get minutes since midnight
   */
  getMinutes(): number {
    return this.minutesSinceMidnight;
  }

  /**
   * Get hour component (0-23)
   */
  getHours(): number {
    return Math.floor(this.minutesSinceMidnight / 60);
  }

  /**
   * Get minute component within the hour (0 or 30)
   */
  getMinuteOfHour(): number {
    return this.minutesSinceMidnight % 60;
  }

  /**
   * Convert to string format (HH:MM)
   */
  toString(): string {
    const hours = this.getHours();
    const minutes = this.getMinuteOfHour();
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Get display format (12-hour with AM/PM)
   */
  toDisplayString(): string {
    const hours = this.getHours();
    const minutes = this.getMinuteOfHour();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  /**
   * Convert to JSON-serializable format
   */
  toJSON(): string {
    return this.toString();
  }

  // ============================================================================
  // COMMANDS (Return new instances - Immutability)
  // ============================================================================

  /**
   * Get the next 30-minute slot
   */
  next(): TimeSlot {
    if (this.minutesSinceMidnight >= 23 * 60 + 30) {
      throw new ValidationError("Cannot get next slot after 23:30");
    }
    return new TimeSlot(this.minutesSinceMidnight + 30);
  }

  /**
   * Get the previous 30-minute slot
   */
  previous(): TimeSlot {
    if (this.minutesSinceMidnight <= 0) {
      throw new ValidationError("Cannot get previous slot before 00:00");
    }
    return new TimeSlot(this.minutesSinceMidnight - 30);
  }

  /**
   * Add multiple slots (positive or negative)
   * @param count Number of 30-minute slots to add
   */
  addSlots(count: number): TimeSlot {
    const newMinutes = this.minutesSinceMidnight + count * 30;
    if (newMinutes < 0 || newMinutes >= 1440) {
      throw new ValidationError(
        "Resulting time slot would be outside valid range"
      );
    }
    return new TimeSlot(newMinutes);
  }

  // ============================================================================
  // COMPARISONS
  // ============================================================================

  /**
   * Check if this slot equals another
   * Value equality based on minutes
   */
  equals(other: TimeSlot): boolean {
    return this.minutesSinceMidnight === other.minutesSinceMidnight;
  }

  /**
   * Check if this slot is before another
   */
  isBefore(other: TimeSlot): boolean {
    return this.minutesSinceMidnight < other.minutesSinceMidnight;
  }

  /**
   * Check if this slot is after another
   */
  isAfter(other: TimeSlot): boolean {
    return this.minutesSinceMidnight > other.minutesSinceMidnight;
  }

  /**
   * Check if this slot is before or equal to another
   */
  isBeforeOrEqual(other: TimeSlot): boolean {
    return this.minutesSinceMidnight <= other.minutesSinceMidnight;
  }

  /**
   * Check if this slot is after or equal to another
   */
  isAfterOrEqual(other: TimeSlot): boolean {
    return this.minutesSinceMidnight >= other.minutesSinceMidnight;
  }

  /**
   * Calculate the number of slots between this and another
   * Returns positive if other is after this, negative if before
   */
  slotsBetween(other: TimeSlot): number {
    return (other.minutesSinceMidnight - this.minutesSinceMidnight) / 30;
  }

  // ============================================================================
  // BUSINESS LOGIC
  // ============================================================================

  /**
   * Check if this is a valid operating hour slot
   * Default operating hours: 8:00 AM - 10:00 PM
   */
  isWithinOperatingHours(
    startHour: number = 8,
    endHour: number = 22
  ): boolean {
    const hours = this.getHours();
    return hours >= startHour && hours < endHour;
  }

  /**
   * Check if this slot is in the past relative to a given date/time
   */
  isInPast(referenceDate: Date): boolean {
    const slotDateTime = new Date(referenceDate);
    slotDateTime.setHours(this.getHours(), this.getMinuteOfHour(), 0, 0);
    return slotDateTime < new Date();
  }
}


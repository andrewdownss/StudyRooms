/**
 * BookingWindow - 7-Day Rolling Availability Grid
 * 
 * Uses composition to manage availability for a single room
 * across a rolling 7-day window
 */

import { BaseRoom } from '../rooms/BaseRoom';
import { DailySchedule } from '../timeslot/DailySchedule';
import { TimeSlot } from '../timeslot/TimeSlot';
import { TimeRange } from '../timeslot/TimeRange';
import { IBooking } from '../../interfaces/domain';
import { IBookingRepository } from '../../interfaces/repositories';

export class BookingWindow {
  private readonly room: BaseRoom;
  private windowStart: Date;
  private readonly windowDays: number;
  private readonly schedules: Map<string, DailySchedule>;
  private bookings: IBooking[];

  constructor(
    room: BaseRoom,
    startDate: Date = new Date(),
    windowDays: number = 7
  ) {
    this.room = room;
    this.windowStart = new Date(startDate);
    this.windowStart.setHours(0, 0, 0, 0);
    this.windowDays = windowDays;
    this.schedules = new Map();
    this.bookings = [];

    this.initializeSchedules();
  }

  /**
   * Initialize empty schedules for the window
   */
  private initializeSchedules(): void {
    for (let i = 0; i < this.windowDays; i++) {
      const date = this.getDateAt(i);
      const dateKey = this.getDateKey(date);
      this.schedules.set(dateKey, new DailySchedule(date, []));
    }
  }

  /**
   * Get the date at a specific offset from window start
   */
  private getDateAt(offset: number): Date {
    const date = new Date(this.windowStart);
    date.setDate(date.getDate() + offset);
    return date;
  }

  /**
   * Get a unique key for a date
   */
  private getDateKey(date: Date): string {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString().split('T')[0];
  }

  /**
   * Get availability for a specific date
   */
  getAvailability(date: Date): DailySchedule | null {
    const dateKey = this.getDateKey(date);
    return this.schedules.get(dateKey) || null;
  }

  /**
   * Check if a time range is available on a specific date
   */
  isAvailable(timeRange: TimeRange, date: Date): boolean {
    const schedule = this.getAvailability(date);
    if (!schedule) return false;

    return schedule.isAvailable(timeRange);
  }

  /**
   * Get all available slots for a specific date
   */
  getAvailableSlots(date: Date): TimeSlot[] {
    const schedule = this.getAvailability(date);
    if (!schedule) return [];

    return schedule.getAvailableSlots();
  }

  /**
   * Get available slots for a specific duration
   */
  getAvailableSlotsForDuration(date: Date, durationMinutes: number): TimeSlot[] {
    const schedule = this.getAvailability(date);
    if (!schedule) return [];

    return schedule.getAvailableSlotsForDuration(durationMinutes);
  }

  /**
   * Add a booking to the window
   */
  addBooking(booking: IBooking): void {
    if (booking.roomId !== this.room.getId()) {
      throw new Error('Booking is for a different room');
    }

    const dateKey = this.getDateKey(booking.date);
    const schedule = this.schedules.get(dateKey);
    
    if (schedule) {
      const timeRange = TimeRange.fromLegacy(booking.startTime, booking.duration);
      const newSchedule = schedule.addBooking(timeRange);
      this.schedules.set(dateKey, newSchedule);
      this.bookings.push(booking);
    }
  }

  /**
   * Remove a booking from the window
   */
  removeBooking(bookingId: string): void {
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;

    const booking = this.bookings[bookingIndex];
    const dateKey = this.getDateKey(booking.date);
    const schedule = this.schedules.get(dateKey);

    if (schedule) {
      const timeRange = TimeRange.fromLegacy(booking.startTime, booking.duration);
      const newSchedule = schedule.removeBooking(timeRange);
      this.schedules.set(dateKey, newSchedule);
      this.bookings.splice(bookingIndex, 1);
    }
  }

  /**
   * Roll the window forward by one day
   */
  roll(): void {
    // Remove oldest day
    const oldestKey = this.getDateKey(this.windowStart);
    this.schedules.delete(oldestKey);

    // Move window forward
    this.windowStart.setDate(this.windowStart.getDate() + 1);

    // Add new day at the end
    const newDate = this.getDateAt(this.windowDays - 1);
    const newKey = this.getDateKey(newDate);
    this.schedules.set(newKey, new DailySchedule(newDate, []));

    // Remove bookings outside the window
    this.bookings = this.bookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= this.windowStart;
    });
  }

  /**
   * Get all dates in the current window
   */
  getWindowDates(): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < this.windowDays; i++) {
      dates.push(this.getDateAt(i));
    }
    return dates;
  }

  /**
   * Get utilization percentage for each day
   */
  getUtilization(): Map<Date, number> {
    const utilization = new Map<Date, number>();

    this.schedules.forEach((schedule, dateKey) => {
      const date = new Date(dateKey);
      utilization.set(date, schedule.getUtilizationPercentage());
    });

    return utilization;
  }

  /**
   * Get the room associated with this window
   */
  getRoom(): BaseRoom {
    return this.room;
  }

  /**
   * Get window summary
   */
  getSummary(): {
    room: string;
    windowStart: Date;
    windowEnd: Date;
    totalBookings: number;
    averageUtilization: number;
  } {
    const utilizations = Array.from(this.getUtilization().values());
    const avgUtilization = utilizations.length > 0
      ? utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length
      : 0;

    return {
      room: this.room.getName(),
      windowStart: new Date(this.windowStart),
      windowEnd: this.getDateAt(this.windowDays - 1),
      totalBookings: this.bookings.length,
      averageUtilization: avgUtilization
    };
  }

  /**
   * Refresh window with latest bookings from repository
   */
  async refresh(bookingRepository: IBookingRepository): Promise<void> {
    // Clear current schedules
    this.schedules.clear();
    this.bookings = [];
    this.initializeSchedules();

    // Load bookings for window dates
    for (let i = 0; i < this.windowDays; i++) {
      const date = this.getDateAt(i);
      const dayBookings = await bookingRepository.findByRoom(
        this.room.getId(),
        date
      );

      dayBookings.forEach(booking => {
        if (booking.status === 'confirmed') {
          this.addBooking(booking);
        }
      });
    }
  }
}


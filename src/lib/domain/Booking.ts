/**
 * Booking Domain Model
 *
 * Rich domain object with business logic and behavior.
 * This encapsulates booking rules and validation.
 */

import {
  IBooking,
  IBookingEntity,
  BookingStatus,
  IUser,
  IRoom,
} from "../interfaces/domain";
import { ValidationError } from "../errors";

export class BookingEntity implements IBookingEntity {
  id: string;
  userId: string;
  roomId: string;
  organizationId?: string;
  date: Date;
  startTime: string;
  duration: number;
  status: BookingStatus;
  visibility: 'private' | 'public' | 'org';
  maxParticipants: number;
  title?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
  room?: IRoom;
  organization?: any;
  participants?: any[];

  constructor(data: IBooking) {
    this.id = data.id;
    this.userId = data.userId;
    this.roomId = data.roomId;
    this.organizationId = data.organizationId;
    this.date = data.date;
    this.startTime = data.startTime;
    this.duration = data.duration;
    this.status = data.status;
    this.visibility = data.visibility;
    this.maxParticipants = data.maxParticipants;
    this.title = data.title;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.user = data.user;
    this.room = data.room;
    this.organization = data.organization;
    this.participants = data.participants;
  }

  /**
   * Check if booking can be cancelled
   */
  canBeCancelled(): boolean {
    // Can't cancel if already cancelled or completed
    if (this.status === "cancelled" || this.status === "completed") {
      return false;
    }

    // Can't cancel if booking is in the past
    const bookingDateTime = this.getBookingDateTime();
    return bookingDateTime > new Date();
  }

  /**
   * Cancel the booking
   */
  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new ValidationError("Booking cannot be cancelled");
    }
    this.status = "cancelled";
    this.updatedAt = new Date();
  }

  /**
   * Check if booking is upcoming (future and confirmed)
   */
  isUpcoming(): boolean {
    if (this.status !== "confirmed") {
      return false;
    }
    const bookingDateTime = this.getBookingDateTime();
    return bookingDateTime >= new Date();
  }

  /**
   * Check if this booking conflicts with another
   */
  conflictsWith(other: IBookingEntity): boolean {
    // Must be same room
    if (this.roomId !== other.roomId) {
      return false;
    }

    // Must be same date
    if (this.date.toDateString() !== other.date.toDateString()) {
      return false;
    }

    // Both must be confirmed
    if (this.status !== "confirmed" || other.status !== "confirmed") {
      return false;
    }

    // Check time overlap
    const thisStart = this.parseTime(this.startTime);
    const thisEnd = thisStart + this.duration;
    const otherStart = this.parseTime(other.startTime);
    const otherEnd = otherStart + other.duration;

    return (
      (thisStart >= otherStart && thisStart < otherEnd) ||
      (thisEnd > otherStart && thisEnd <= otherEnd) ||
      (thisStart <= otherStart && thisEnd >= otherEnd)
    );
  }

  /**
   * Get the end time of the booking
   */
  getEndTime(): string {
    const startMinutes = this.parseTime(this.startTime);
    const endMinutes = startMinutes + this.duration;
    const hours = Math.floor(endMinutes / 60);
    const minutes = endMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Get the booking date and time as a Date object
   */
  private getBookingDateTime(): Date {
    const [hours, minutes] = this.startTime.split(":").map(Number);
    const dateTime = new Date(this.date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Validate booking data
   */
  static validate(
    data: Partial<Pick<IBooking, "duration" | "startTime" | "date">>
  ): void {
    if (data.duration) {
      if (data.duration < 30) {
        throw new ValidationError("Minimum booking duration is 30 minutes");
      }
      if (data.duration > 120) {
        throw new ValidationError("Maximum booking duration is 120 minutes");
      }
      if (data.duration % 30 !== 0) {
        throw new ValidationError("Duration must be in 30-minute increments");
      }
    }

    if (data.startTime) {
      const [hours, minutes] = data.startTime.split(":").map(Number);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new ValidationError("Invalid start time");
      }
    }

    if (data.date) {
      const bookingDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        throw new ValidationError("Cannot book in the past");
      }
    }
  }

  /**
   * Check if booking is public
   */
  isPublic(): boolean {
    return this.visibility === 'public';
  }

  /**
   * Check if booking is private
   */
  isPrivate(): boolean {
    return this.visibility === 'private';
  }

  /**
   * Check if user can join this booking
   */
  canUserJoin(userId: string, userOrgIds: string[]): { allowed: boolean; reason?: string } {
    if (this.visibility === 'private') {
      return { allowed: false, reason: 'This is a private booking' };
    }

    if (userId === this.userId) {
      return { allowed: false, reason: 'You are the creator' };
    }

    if (this.participants?.some(p => p.userId === userId)) {
      return { allowed: false, reason: 'Already joined' };
    }

    if (this.isFull()) {
      return { allowed: false, reason: 'Booking is full' };
    }

    if (this.visibility === 'org' && this.organizationId) {
      if (!userOrgIds.includes(this.organizationId)) {
        return { allowed: false, reason: 'Not a member of this organization' };
      }
    }

    const dateStr = this.date.toISOString().split('T')[0];
    const bookingDateTime = new Date(`${dateStr}T${this.startTime}`);
    if (bookingDateTime < new Date()) {
      return { allowed: false, reason: 'Booking has already started' };
    }

    return { allowed: true };
  }

  /**
   * Get available slots remaining
   */
  getAvailableSlots(): number {
    const current = this.participants?.length || 0;
    return Math.max(0, this.maxParticipants - current);
  }

  /**
   * Check if booking is full
   */
  isFull(): boolean {
    return this.getAvailableSlots() === 0;
  }

  /**
   * Get display color for UI
   */
  getDisplayColor(): 'green' | 'red' | 'blue' | 'gray' {
    if (this.visibility === 'public') return 'blue';
    if (this.visibility === 'org') return 'gray';
    return 'red';
  }

  /**
   * Create a new BookingEntity from plain data
   */
  static fromData(data: IBooking): BookingEntity {
    BookingEntity.validate(data);
    return new BookingEntity(data);
  }
}

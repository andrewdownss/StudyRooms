/**
 * Booking Entity with Business Logic
 * 
 * Extends the basic IBooking interface with behavior
 * 
 * OOP Principles:
 * - Encapsulation: Business logic contained within entity
 * - Single Responsibility: Booking-specific behavior only
 * - Dependency Injection: Receives policies via constructor
 */

import { IBooking, IBookingEntity } from '../../interfaces/domain';
import { BookingJoinPolicyFactory, IBookingJoinPolicy } from './BookingJoinPolicy';

export class BookingEntity implements IBookingEntity {
  private readonly joinPolicy: IBookingJoinPolicy;

  // Base properties from IBooking
  id: string;
  userId: string;
  roomId: string;
  organizationId?: string;
  date: Date;
  startTime: string;
  duration: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  visibility: 'private' | 'public' | 'org';
  maxParticipants: number;
  title?: string | null;
  description?: string | null;

  // Relations
  user?: any;
  room?: any;
  organization?: any;
  participants?: any[];

  constructor(booking: IBooking) {
    // Copy all properties
    this.id = booking.id;
    this.userId = booking.userId;
    this.roomId = booking.roomId;
    this.organizationId = booking.organizationId;
    this.date = booking.date;
    this.startTime = booking.startTime;
    this.duration = booking.duration;
    this.status = booking.status;
    this.createdAt = booking.createdAt;
    this.updatedAt = booking.updatedAt;
    this.visibility = booking.visibility;
    this.maxParticipants = booking.maxParticipants;
    this.title = booking.title;
    this.description = booking.description;
    this.user = booking.user;
    this.room = booking.room;
    this.organization = booking.organization;
    this.participants = booking.participants;

    // Select appropriate join policy
    this.joinPolicy = BookingJoinPolicyFactory.getPolicy(booking.visibility);
  }

  /**
   * Check if booking can be cancelled
   */
  canBeCancelled(): boolean {
    if (this.status === 'cancelled' || this.status === 'completed') {
      return false;
    }

    const bookingDateTime = new Date(this.date);
    const [hours, minutes] = this.startTime.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    // Can cancel up until start time
    return bookingDateTime > new Date();
  }

  /**
   * Cancel the booking
   */
  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('Booking cannot be cancelled');
    }
    this.status = 'cancelled';
  }

  /**
   * Check if booking is upcoming
   */
  isUpcoming(): boolean {
    const bookingDateTime = new Date(this.date);
    const [hours, minutes] = this.startTime.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    return bookingDateTime > new Date() && this.status === 'confirmed';
  }

  /**
   * Check if this booking conflicts with another
   */
  conflictsWith(other: IBookingEntity): boolean {
    // Different rooms = no conflict
    if (this.roomId !== other.roomId) {
      return false;
    }

    // Different dates = no conflict
    if (this.date.toDateString() !== other.date.toDateString()) {
      return false;
    }

    // Check time overlap
    const thisStart = this.getMinutes(this.startTime);
    const thisEnd = thisStart + this.duration;
    const otherStart = this.getMinutes(other.startTime);
    const otherEnd = otherStart + other.duration;

    return thisStart < otherEnd && otherStart < thisEnd;
  }

  /**
   * Get end time as string
   */
  getEndTime(): string {
    const startMinutes = this.getMinutes(this.startTime);
    const endMinutes = startMinutes + this.duration;
    const hours = Math.floor(endMinutes / 60) % 24;
    const minutes = endMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
    // Creator cannot join their own booking
    if (userId === this.userId) {
      return { allowed: false, reason: 'You are the creator' };
    }

    // Use the join policy
    const user = { id: userId } as any;
    return this.joinPolicy.canJoin(this, user, userOrgIds);
  }

  /**
   * Get number of available slots
   */
  getAvailableSlots(): number {
    return this.joinPolicy.getAvailableSlots(this);
  }

  /**
   * Check if booking is full
   */
  isFull(): boolean {
    return this.joinPolicy.isFull(this);
  }

  /**
   * Get display color for UI based on status and visibility
   */
  getDisplayColor(): 'green' | 'red' | 'blue' | 'gray' {
    // If cancelled or rejected, show as available (green)
    if (this.status === 'cancelled' || this.status === 'rejected') {
      return 'green';
    }

    // Private bookings = red
    if (this.visibility === 'private') {
      return 'red';
    }

    // Public bookings = blue
    if (this.visibility === 'public') {
      return 'blue';
    }

    // Organization bookings = gray
    return 'gray';
  }

  /**
   * Helper: Convert time string to minutes since midnight
   */
  private getMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}


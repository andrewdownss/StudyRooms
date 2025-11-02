/**
 * Booking Join Policy (Strategy Pattern)
 * 
 * Defines rules for who can join bookings and when
 * 
 * OOP Principles:
 * - Strategy Pattern: Interchangeable join policies
 * - Interface Segregation: Clear contract
 * - Open/Closed: New policies without modifying existing code
 */

import { IBooking, IUser } from '../../interfaces/domain';

export interface JoinResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Interface for booking join policies
 */
export interface IBookingJoinPolicy {
  /**
   * Check if user can join this booking
   */
  canJoin(
    booking: IBooking,
    user: IUser,
    userOrgIds: string[]
  ): JoinResult;

  /**
   * Get number of available slots
   */
  getAvailableSlots(booking: IBooking): number;

  /**
   * Check if booking is full
   */
  isFull(booking: IBooking): boolean;
}

/**
 * Policy for Public Bookings
 * Anyone can join if space available and time hasn't passed
 */
export class PublicBookingPolicy implements IBookingJoinPolicy {
  canJoin(
    booking: IBooking,
    user: IUser,
    userOrgIds: string[]
  ): JoinResult {
    // Check if already a participant
    if (booking.participants?.some(p => p.userId === user.id)) {
      return { allowed: false, reason: 'Already joined' };
    }

    // Check capacity
    if (this.isFull(booking)) {
      return { allowed: false, reason: 'Booking is full' };
    }

    // Check if booking has started
    const bookingTime = this.parseBookingTime(booking);
    const now = new Date();
    
    if (bookingTime < now) {
      return { allowed: false, reason: 'Booking has already started' };
    }

    return { allowed: true };
  }

  getAvailableSlots(booking: IBooking): number {
    const current = booking.participants?.length || 0;
    const max = booking.maxParticipants || 1;
    return Math.max(0, max - current);
  }

  isFull(booking: IBooking): boolean {
    return this.getAvailableSlots(booking) === 0;
  }

  private parseBookingTime(booking: IBooking): Date {
    const dateStr = booking.date.toISOString().split('T')[0];
    return new Date(`${dateStr}T${booking.startTime}`);
  }
}

/**
 * Policy for Organization Bookings
 * Only organization members can join
 */
export class OrganizationBookingPolicy implements IBookingJoinPolicy {
  canJoin(
    booking: IBooking,
    user: IUser,
    userOrgIds: string[]
  ): JoinResult {
    // Must have an organization
    if (!booking.organizationId) {
      return { allowed: false, reason: 'No organization set' };
    }

    // User must be in the organization
    if (!userOrgIds.includes(booking.organizationId)) {
      return {
        allowed: false,
        reason: 'Not a member of this organization'
      };
    }

    // Check if already a participant
    if (booking.participants?.some(p => p.userId === user.id)) {
      return { allowed: false, reason: 'Already joined' };
    }

    // Check capacity
    if (this.isFull(booking)) {
      return { allowed: false, reason: 'Booking is full' };
    }

    // Check if booking has started
    const bookingTime = this.parseBookingTime(booking);
    const now = new Date();
    
    if (bookingTime < now) {
      return { allowed: false, reason: 'Booking has already started' };
    }

    return { allowed: true };
  }

  getAvailableSlots(booking: IBooking): number {
    const current = booking.participants?.length || 0;
    const max = booking.maxParticipants || 1;
    return Math.max(0, max - current);
  }

  isFull(booking: IBooking): boolean {
    return this.getAvailableSlots(booking) === 0;
  }

  private parseBookingTime(booking: IBooking): Date {
    const dateStr = booking.date.toISOString().split('T')[0];
    return new Date(`${dateStr}T${booking.startTime}`);
  }
}

/**
 * Policy for Private Bookings
 * No one else can join
 */
export class PrivateBookingPolicy implements IBookingJoinPolicy {
  canJoin(): JoinResult {
    return { allowed: false, reason: 'This is a private booking' };
  }

  getAvailableSlots(): number {
    return 0;
  }

  isFull(): boolean {
    return true;
  }
}

/**
 * Factory to get appropriate policy based on visibility
 */
export class BookingJoinPolicyFactory {
  static getPolicy(visibility: string): IBookingJoinPolicy {
    switch (visibility) {
      case 'public':
        return new PublicBookingPolicy();
      case 'org':
        return new OrganizationBookingPolicy();
      case 'private':
      default:
        return new PrivateBookingPolicy();
    }
  }
}


/**
 * User Domain Model
 * 
 * Rich domain object with business logic for users.
 */

import { IUser, IUserEntity, IBooking, UserRole } from '../interfaces/domain';

export class UserEntity implements IUserEntity {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.emailVerified = data.emailVerified;
    this.image = data.image;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Check if user is an organization
   */
  isOrganization(): boolean {
    return this.role === 'organization';
  }

  /**
   * Check if user can manage a specific booking
   * 
   * Rules:
   * - Admins can manage any booking
   * - Users can manage their own bookings
   * - Organizations can manage their own bookings
   */
  canManageBooking(booking: IBooking): boolean {
    if (this.isAdmin()) {
      return true;
    }
    return booking.userId === this.id;
  }

  /**
   * Check if user can manage rooms
   * 
   * Rules:
   * - Only admins can manage rooms
   */
  canManageRoom(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can manage other users
   * 
   * Rules:
   * - Only admins can manage users
   */
  canManageUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can view all bookings
   * 
   * Rules:
   * - Admins can view all bookings
   * - Regular users can only view their own
   */
  canViewAllBookings(): boolean {
    return this.isAdmin();
  }

  /**
   * Get maximum booking duration for this user role
   * 
   * Rules:
   * - Regular users: 120 minutes (2 hours)
   * - Organizations: 240 minutes (4 hours)
   * - Admins: unlimited
   */
  getMaxBookingDuration(): number {
    if (this.isAdmin()) {
      return Infinity;
    }
    if (this.isOrganization()) {
      return 240; // 4 hours
    }
    return 120; // 2 hours
  }

  /**
   * Get daily booking limit for this user role
   * 
   * Rules:
   * - Regular users: 120 minutes per day
   * - Organizations: 480 minutes per day
   * - Admins: unlimited
   */
  getDailyBookingLimit(): number {
    if (this.isAdmin()) {
      return Infinity;
    }
    if (this.isOrganization()) {
      return 480; // 8 hours
    }
    return 120; // 2 hours
  }

  /**
   * Get display role name
   */
  getRoleDisplay(): string {
    switch (this.role) {
      case 'admin':
        return 'Administrator';
      case 'organization':
        return 'Organization';
      case 'user':
      default:
        return 'Student';
    }
  }

  /**
   * Create a new UserEntity from plain data
   */
  static fromData(data: IUser): UserEntity {
    return new UserEntity(data);
  }
}


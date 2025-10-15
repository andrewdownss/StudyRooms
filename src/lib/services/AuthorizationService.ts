/**
 * Authorization Service
 * 
 * Centralized authorization logic using role-based access control.
 * This implements the Policy pattern for permissions.
 */

import { IAuthorizationService } from '../interfaces/services';
import { IUserRepository } from '../interfaces/repositories';
import { IUser, IBooking } from '../interfaces/domain';
import { UserEntity } from '../domain/User';
import { ForbiddenError, UnauthorizedError, NotFoundError } from '../errors';

export class AuthorizationService implements IAuthorizationService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Get user with role information
   */
  async getUserWithRole(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }

  /**
   * Check if user can view a booking
   * 
   * Rules:
   * - Admins can view any booking
   * - Users can view their own bookings
   */
  async canViewBooking(userId: string, booking: IBooking): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const userEntity = UserEntity.fromData(user);
    return userEntity.canManageBooking(booking);
  }

  /**
   * Check if user can cancel a booking
   * 
   * Rules:
   * - Admins can cancel any booking
   * - Users can cancel their own bookings (if not in the past)
   */
  async canCancelBooking(userId: string, booking: IBooking): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const userEntity = UserEntity.fromData(user);
    
    if (!userEntity.canManageBooking(booking)) {
      return false;
    }

    // Additional check: booking must be cancellable
    const bookingDate = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    return bookingDate > new Date() && booking.status === 'confirmed';
  }

  /**
   * Check if user can modify a booking
   * 
   * Rules:
   * - Admins can modify any booking
   * - Users cannot modify bookings (can only cancel)
   */
  async canModifyBooking(userId: string, booking: IBooking): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const userEntity = UserEntity.fromData(user);
    
    // Only admins can modify bookings
    return userEntity.isAdmin();
  }

  /**
   * Check if user can delete a booking
   * 
   * Rules:
   * - Only admins can delete bookings
   */
  async canDeleteBooking(userId: string, booking: IBooking): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const userEntity = UserEntity.fromData(user);
    return userEntity.isAdmin();
  }

  /**
   * Check if user can manage rooms
   * 
   * Rules:
   * - Only admins can manage rooms
   */
  async canManageRooms(userId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const userEntity = UserEntity.fromData(user);
    return userEntity.canManageRoom();
  }

  /**
   * Check if user can manage other users
   * 
   * Rules:
   * - Only admins can manage users
   */
  async canManageUsers(userId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    const userEntity = UserEntity.fromData(user);
    return userEntity.canManageUsers();
  }

  /**
   * Enforce booking view permission (throws if denied)
   */
  async enforceBookingView(userId: string, booking: IBooking): Promise<void> {
    const canView = await this.canViewBooking(userId, booking);
    if (!canView) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }
  }

  /**
   * Enforce booking modify permission (throws if denied)
   */
  async enforceBookingModify(userId: string, booking: IBooking): Promise<void> {
    const canModify = await this.canModifyBooking(userId, booking);
    if (!canModify) {
      throw new ForbiddenError('You do not have permission to modify this booking');
    }
  }

  /**
   * Enforce room management permission (throws if denied)
   */
  async enforceRoomManagement(userId: string): Promise<void> {
    const canManage = await this.canManageRooms(userId);
    if (!canManage) {
      throw new ForbiddenError('Only administrators can manage rooms');
    }
  }

  /**
   * Enforce user management permission (throws if denied)
   */
  async enforceUserManagement(userId: string): Promise<void> {
    const canManage = await this.canManageUsers(userId);
    if (!canManage) {
      throw new ForbiddenError('Only administrators can manage users');
    }
  }
}


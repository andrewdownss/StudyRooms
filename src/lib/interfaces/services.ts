/**
 * Service Interfaces
 *
 * Define contracts for business logic layer.
 * Services orchestrate repositories and implement business rules.
 */

import {
  IBooking,
  IRoom,
  IUser,
  BookingStatus,
  RoomCategory,
  UserRole,
} from "./domain";

// ============================================================================
// BOOKING SERVICE
// ============================================================================

export interface IBookingService {
  // Create booking with business logic
  createBooking(
    userId: string,
    input: BookingServiceCreateInput
  ): Promise<IBooking>;

  // Get bookings with permissions
  getBooking(bookingId: string, requesterId: string): Promise<IBooking>;
  getUserBookings(userId: string, requesterId: string): Promise<IBooking[]>;
  getAllBookings(
    requesterId: string,
    options?: GetBookingsOptions
  ): Promise<IBooking[]>;

  // Update booking with authorization
  cancelBooking(bookingId: string, userId: string): Promise<IBooking>;
  updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    requesterId: string
  ): Promise<IBooking>;

  // Delete booking (admin only)
  deleteBooking(bookingId: string, requesterId: string): Promise<void>;

  // Availability check
  checkAvailability(
    category: RoomCategory,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<boolean>;
  findAvailableRooms(
    category: RoomCategory,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<IRoom[]>;
}

export interface BookingServiceCreateInput {
  category: RoomCategory;
  date: string;
  startTime: string;
  duration: number;
  organizationId?: string;
}

export interface GetBookingsOptions {
  limit?: number;
  status?: BookingStatus;
  upcoming?: boolean;
  date?: string;
}

// ============================================================================
// ROOM SERVICE
// ============================================================================

export interface IRoomService {
  // Get rooms
  getRoom(roomId: string): Promise<IRoom>;
  getAllRooms(category?: RoomCategory): Promise<IRoom[]>;
  getRoomCategories(): Promise<RoomCategoryInfo[]>;

  // Manage rooms (admin only)
  createRoom(
    input: RoomServiceCreateInput,
    requesterId: string
  ): Promise<IRoom>;
  updateRoom(
    roomId: string,
    input: RoomServiceUpdateInput,
    requesterId: string
  ): Promise<IRoom>;
  deleteRoom(roomId: string, requesterId: string): Promise<void>;
}

export interface RoomServiceCreateInput {
  name: string;
  category: RoomCategory;
  capacity: number;
  description?: string;
}

export interface RoomServiceUpdateInput {
  name?: string;
  category?: RoomCategory;
  capacity?: number;
  description?: string;
}

export interface RoomCategoryInfo {
  id: string;
  name: string;
  capacity: string;
  description: string;
  count: number;
}

// ============================================================================
// USER SERVICE
// ============================================================================

export interface IUserService {
  // Get users
  getUser(userId: string): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser>;

  // Update users
  updateUserRole(
    userId: string,
    role: UserRole,
    requesterId: string
  ): Promise<IUser>;
}

// ============================================================================
// AUTHORIZATION SERVICE
// ============================================================================

export interface IAuthorizationService {
  // Check permissions
  canViewBooking(userId: string, booking: IBooking): Promise<boolean>;
  canCancelBooking(userId: string, booking: IBooking): Promise<boolean>;
  canModifyBooking(userId: string, booking: IBooking): Promise<boolean>;
  canDeleteBooking(userId: string, booking: IBooking): Promise<boolean>;
  canManageRooms(userId: string): Promise<boolean>;
  canManageUsers(userId: string): Promise<boolean>;

  // Get user with role
  getUserWithRole(userId: string): Promise<IUser>;

  // Enforce permissions (throws if denied)
  enforceBookingView(userId: string, booking: IBooking): Promise<void>;
  enforceBookingModify(userId: string, booking: IBooking): Promise<void>;
  enforceRoomManagement(userId: string): Promise<void>;
  enforceUserManagement(userId: string): Promise<void>;
}

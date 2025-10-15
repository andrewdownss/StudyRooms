/**
 * Domain Interfaces
 * 
 * Define the shape of our core business entities.
 * These represent the "things" in our system.
 */

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';
export type RoomCategory = 'small' | 'large';
export type UserRole = 'user' | 'admin' | 'organization';
export type AuthProvider = 'google' | 'credentials';

// ============================================================================
// USER DOMAIN
// ============================================================================

export interface IUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  password?: string | null;  // Nullable - null for Google OAuth users
  authProvider: AuthProvider;  // How the user authenticated
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// ROOM DOMAIN
// ============================================================================

export interface IRoom {
  id: string;
  name: string;
  category: RoomCategory;
  capacity: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// BOOKING DOMAIN
// ============================================================================

export interface IBooking {
  id: string;
  userId: string;
  roomId: string;
  date: Date;
  startTime: string;
  duration: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional - loaded when needed)
  user?: IUser;
  room?: IRoom;
}

// ============================================================================
// DOMAIN ENTITY INTERFACES (with behavior)
// ============================================================================

export interface IBookingEntity extends IBooking {
  canBeCancelled(): boolean;
  cancel(): void;
  isUpcoming(): boolean;
  conflictsWith(other: IBookingEntity): boolean;
  getEndTime(): string;
}

export interface IRoomEntity extends IRoom {
  canAccommodate(people: number): boolean;
  isAvailable(date: Date, startTime: string, duration: number, existingBookings: IBooking[]): boolean;
}

export interface IUserEntity extends IUser {
  isAdmin(): boolean;
  isOrganization(): boolean;
  canManageBooking(booking: IBooking): boolean;
  canManageRoom(): boolean;
}


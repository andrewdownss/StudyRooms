/**
 * Repository Interfaces
 *
 * Define contracts for data access layer.
 * Repositories abstract away database implementation details.
 */

import { IBooking, IRoom, IUser, BookingStatus, RoomCategory } from "./domain";
import { IOrganization, IOrgMembership } from "./domain";

// ============================================================================
// BOOKING REPOSITORY
// ============================================================================

export interface IBookingRepository {
  // Create
  create(data: BookingCreateData): Promise<IBooking>;

  // Read
  findById(id: string): Promise<IBooking | null>;
  findByUser(userId: string): Promise<IBooking[]>;
  findByRoom(roomId: string, date?: Date): Promise<IBooking[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IBooking[]>;
  findUpcoming(userId: string): Promise<IBooking[]>;
  findAll(options?: FindAllOptions): Promise<IBooking[]>;
  findPublicBookings(date?: Date): Promise<IBooking[]>;

  // Update
  update(id: string, data: Partial<IBooking>): Promise<IBooking>;
  updateStatus(id: string, status: BookingStatus): Promise<IBooking>;

  // Delete
  delete(id: string): Promise<void>;

  // Participant Management
  addParticipant(bookingId: string, userId: string): Promise<void>;
  removeParticipant(bookingId: string, userId: string): Promise<void>;

  // Query helpers
  count(filters?: BookingFilters): Promise<number>;
  exists(id: string): Promise<boolean>;
}

export interface BookingCreateData {
  userId: string;
  roomId: string;
  organizationId?: string;
  date: Date;
  startTime: string;
  duration: number;
  status?: BookingStatus;
  visibility?: 'private' | 'public' | 'org';
  maxParticipants?: number;
  title?: string;
  description?: string;
}

export interface BookingFilters {
  userId?: string;
  roomId?: string;
  status?: BookingStatus;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  visibility?: 'private' | 'public' | 'org';
}

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "date";
  orderDirection?: "asc" | "desc";
  filters?: BookingFilters;
  includeUser?: boolean;
  includeRoom?: boolean;
}

// ============================================================================
// ROOM REPOSITORY
// ============================================================================

export interface IRoomRepository {
  // Create
  create(data: RoomCreateData): Promise<IRoom>;
  createMany(data: RoomCreateData[]): Promise<IRoom[]>;

  // Read
  findById(id: string): Promise<IRoom | null>;
  findByCategory(category: RoomCategory): Promise<IRoom[]>;
  findAll(): Promise<IRoom[]>;
  findAvailable(
    category: RoomCategory,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<IRoom[]>;

  // Update
  update(id: string, data: Partial<IRoom>): Promise<IRoom>;

  // Delete
  delete(id: string): Promise<void>;

  // Query helpers
  count(category?: RoomCategory): Promise<number>;
  exists(id: string): Promise<boolean>;
}

export interface RoomCreateData {
  name: string;
  category: RoomCategory;
  capacity: number;
  description?: string | null;
}

// ============================================================================
// USER REPOSITORY
// ============================================================================

export interface IUserRepository {
  // Create
  create(data: UserCreateData): Promise<IUser>;

  // Read
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findAll(): Promise<IUser[]>;

  // Update
  update(id: string, data: Partial<IUser>): Promise<IUser>;
  updateRole(id: string, role: string): Promise<IUser>;

  // Query helpers
  count(): Promise<number>;
  exists(id: string): Promise<boolean>;
}

export interface UserCreateData {
  email: string;
  name?: string;
  password?: string | null;
  role?: string;
  authProvider: "google" | "credentials";
  image?: string;
}

// ============================================================================
// ORGANIZATION REPOSITORY
// ============================================================================

export interface IOrganizationRepository {
  create(data: OrganizationCreateData): Promise<IOrganization>;
  findById(id: string): Promise<IOrganization | null>;
  findBySlug(slug: string): Promise<IOrganization | null>;
  findAll(): Promise<IOrganization[]>;
  findByUser(userId: string): Promise<IOrganization[]>;
  update(id: string, data: Partial<IOrganization>): Promise<IOrganization>;
  delete(id: string): Promise<void>;
}

export interface OrganizationCreateData {
  name: string;
  slug: string;
  status?: "active" | "suspended";
}

// ============================================================================
// ORG MEMBERSHIP REPOSITORY
// ============================================================================

export interface IOrgMembershipRepository {
  create(data: OrgMembershipCreateData): Promise<IOrgMembership>;
  findByUser(userId: string): Promise<IOrgMembership[]>;
  findByOrganization(organizationId: string): Promise<IOrgMembership[]>;
  isOfficer(userId: string, organizationId: string): Promise<boolean>;
  delete(id: string): Promise<void>;
}

export interface OrgMembershipCreateData {
  userId: string;
  organizationId: string;
  role?: "owner" | "officer" | "member";
}

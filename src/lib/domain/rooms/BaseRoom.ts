/**
 * Base Room Class Hierarchy
 * 
 * Uses inheritance and polymorphism to allow new room types
 * without breaking existing functionality
 */

import { TimeSlot } from "../timeslot/TimeSlot";

export enum RoomType {
  SMALL = 'small',
  LARGE = 'large',
  CONFERENCE = 'conference',
  STUDY_POD = 'study_pod',
}

export enum Amenity {
  PROJECTOR = 'projector',
  WHITEBOARD = 'whiteboard',
  TV_SCREEN = 'tv_screen',
  ETHERNET = 'ethernet',
  VIDEO_CONFERENCE = 'video_conference',
  SOUNDPROOF = 'soundproof',
}

export interface BookingRules {
  minDurationMinutes: number;
  maxDurationMinutes: number;
  advanceBookingDays: number;
  requiresApproval: boolean;
  allowedRoles: string[];
}

export interface OperatingHours {
  startHour: number;
  endHour: number;
  daysOfWeek: Set<number>; // 0-6 (Sunday-Saturday)
}

export interface Money {
  amount: number;
  currency: string;
}

/**
 * Abstract base class for all room types
 * Implements Template Method pattern
 */
export abstract class BaseRoom {
  protected readonly id: string;
  protected readonly name: string;
  protected readonly capacity: number;
  protected readonly description: string | null;
  protected readonly amenities: Set<Amenity>;
  protected readonly operatingHours: OperatingHours;

  constructor(
    id: string,
    name: string,
    capacity: number,
    description: string | null,
    amenities: Amenity[],
    operatingHours: OperatingHours
  ) {
    this.id = id;
    this.name = name;
    this.capacity = capacity;
    this.description = description;
    this.amenities = new Set(amenities);
    this.operatingHours = operatingHours;
  }

  // Abstract methods - must be implemented by subclasses
  abstract getRoomType(): RoomType;
  abstract getHourlyRate(): Money;
  abstract canAccommodate(people: number): boolean;
  abstract getBookingRules(): BookingRules;

  // Concrete methods - shared behavior
  hasAmenity(amenity: Amenity): boolean {
    return this.amenities.has(amenity);
  }

  getAmenities(): Amenity[] {
    return Array.from(this.amenities);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCapacity(): number {
    return this.capacity;
  }

  getDescription(): string | null {
    return this.description;
  }

  isOperatingAt(time: TimeSlot, date: Date): boolean {
    const dayOfWeek = date.getDay();
    if (!this.operatingHours.daysOfWeek.has(dayOfWeek)) {
      return false;
    }

    const hour = time.getHours();
    return hour >= this.operatingHours.startHour && 
           hour < this.operatingHours.endHour;
  }

  toString(): string {
    return `${this.getRoomType()}: ${this.name} (Capacity: ${this.capacity})`;
  }

  // Template method pattern
  calculateCost(durationMinutes: number): Money {
    const hourlyRate = this.getHourlyRate();
    const hours = durationMinutes / 60;
    return {
      amount: hourlyRate.amount * hours,
      currency: hourlyRate.currency
    };
  }

  // Convert to legacy format for compatibility
  toLegacyFormat(): {
    id: string;
    name: string;
    category: 'small' | 'large';
    capacity: number;
    description: string | null;
  } {
    const type = this.getRoomType();
    return {
      id: this.id,
      name: this.name,
      category: type === RoomType.SMALL ? 'small' : 'large',
      capacity: this.capacity,
      description: this.description
    };
  }
}


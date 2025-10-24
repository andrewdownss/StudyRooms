/**
 * Small Room Implementation
 * For 1-4 people study sessions
 */

import { BaseRoom, RoomType, Money, BookingRules, Amenity, OperatingHours } from './BaseRoom';

export class SmallRoom extends BaseRoom {
  private static readonly MAX_CAPACITY = 4;
  private static readonly HOURLY_RATE = 15;

  getRoomType(): RoomType {
    return RoomType.SMALL;
  }

  getHourlyRate(): Money {
    return {
      amount: SmallRoom.HOURLY_RATE,
      currency: 'USD'
    };
  }

  canAccommodate(people: number): boolean {
    return people > 0 && people <= SmallRoom.MAX_CAPACITY;
  }

  getBookingRules(): BookingRules {
    return {
      minDurationMinutes: 30,
      maxDurationMinutes: 120,
      advanceBookingDays: 14,
      requiresApproval: false,
      allowedRoles: ['user', 'admin']
    };
  }
}


/**
 * Large Room Implementation
 * For 5-12 people group sessions
 */

import { BaseRoom, RoomType, Money, BookingRules } from './BaseRoom';

export class LargeRoom extends BaseRoom {
  private static readonly MAX_CAPACITY = 12;
  private static readonly HOURLY_RATE = 25;

  getRoomType(): RoomType {
    return RoomType.LARGE;
  }

  getHourlyRate(): Money {
    return {
      amount: LargeRoom.HOURLY_RATE,
      currency: 'USD'
    };
  }

  canAccommodate(people: number): boolean {
    return people > 4 && people <= LargeRoom.MAX_CAPACITY;
  }

  getBookingRules(): BookingRules {
    return {
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      advanceBookingDays: 21,
      requiresApproval: false,
      allowedRoles: ['user', 'admin']
    };
  }
}


/**
 * Conference Room Implementation
 * For large meetings and presentations (8-20 people)
 */

import { BaseRoom, RoomType, Money, BookingRules, Amenity } from './BaseRoom';

export class ConferenceRoom extends BaseRoom {
  private static readonly MAX_CAPACITY = 20;
  private static readonly HOURLY_RATE = 40;

  getRoomType(): RoomType {
    return RoomType.CONFERENCE;
  }

  getHourlyRate(): Money {
    return {
      amount: ConferenceRoom.HOURLY_RATE,
      currency: 'USD'
    };
  }

  canAccommodate(people: number): boolean {
    return people > 8 && people <= ConferenceRoom.MAX_CAPACITY;
  }

  getBookingRules(): BookingRules {
    return {
      minDurationMinutes: 60,
      maxDurationMinutes: 240,
      advanceBookingDays: 30,
      requiresApproval: true,
      allowedRoles: ['admin', 'organization']
    };
  }

  // Conference-specific methods
  hasVideoConference(): boolean {
    return this.hasAmenity(Amenity.VIDEO_CONFERENCE);
  }

  hasProjector(): boolean {
    return this.hasAmenity(Amenity.PROJECTOR);
  }
}


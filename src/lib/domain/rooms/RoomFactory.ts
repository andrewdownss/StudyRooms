/**
 * Room Factory
 * Creates room instances following Open/Closed principle
 */

import { BaseRoom, RoomType, Amenity, OperatingHours } from './BaseRoom';
import { SmallRoom } from './SmallRoom';
import { LargeRoom } from './LargeRoom';
import { ConferenceRoom } from './ConferenceRoom';
import { IRoom } from '../../interfaces/domain';

export class RoomFactory {
  private static readonly DEFAULT_OPERATING_HOURS: OperatingHours = {
    startHour: 8,
    endHour: 22,
    daysOfWeek: new Set([0, 1, 2, 3, 4, 5, 6]) // All days
  };

  /**
   * Create a room from database/legacy format
   */
  static fromLegacyRoom(room: IRoom): BaseRoom {
    const type = room.category === 'small' ? RoomType.SMALL : RoomType.LARGE;
    const amenities: Amenity[] = [];
    
    return this.createRoom(
      type,
      room.id,
      room.name,
      room.capacity,
      room.description,
      amenities,
      this.DEFAULT_OPERATING_HOURS
    );
  }

  /**
   * Create a room of specific type
   */
  static createRoom(
    type: RoomType,
    id: string,
    name: string,
    capacity: number,
    description?: string | null,
    amenities?: Amenity[],
    operatingHours?: OperatingHours
  ): BaseRoom {
    const hours = operatingHours || this.DEFAULT_OPERATING_HOURS;
    const amen = amenities || [];
    const desc = description || null;

    switch (type) {
      case RoomType.SMALL:
        return new SmallRoom(id, name, capacity, desc, amen, hours);
      
      case RoomType.LARGE:
        return new LargeRoom(id, name, capacity, desc, amen, hours);
      
      case RoomType.CONFERENCE:
        return new ConferenceRoom(id, name, capacity, desc, amen, hours);
      
      default:
        throw new Error(`Unknown room type: ${type}`);
    }
  }

  /**
   * Get default operating hours
   */
  static getDefaultOperatingHours(): OperatingHours {
    return { ...this.DEFAULT_OPERATING_HOURS };
  }
}


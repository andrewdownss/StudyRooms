/**
 * Room Service
 * 
 * Implements room management business logic with authorization.
 */

import { IRoomService, RoomServiceCreateInput, RoomServiceUpdateInput, RoomCategoryInfo } from '../interfaces/services';
import { IRoomRepository } from '../interfaces/repositories';
import { IAuthorizationService } from '../interfaces/services';
import { IRoom, RoomCategory } from '../interfaces/domain';
import { RoomEntity } from '../domain/Room';
import { NotFoundError } from '../errors';

export class RoomService implements IRoomService {
  constructor(
    private roomRepository: IRoomRepository,
    private authorizationService: IAuthorizationService
  ) {}

  /**
   * Get a specific room
   */
  async getRoom(roomId: string): Promise<IRoom> {
    const room = await this.roomRepository.findById(roomId);
    
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return room;
  }

  /**
   * Get all rooms, optionally filtered by category
   */
  async getAllRooms(category?: RoomCategory): Promise<IRoom[]> {
    if (category) {
      return this.roomRepository.findByCategory(category);
    }
    return this.roomRepository.findAll();
  }

  /**
   * Get room categories with counts
   */
  async getRoomCategories(): Promise<RoomCategoryInfo[]> {
    const smallCount = await this.roomRepository.count('small');
    const largeCount = await this.roomRepository.count('large');

    return [
      {
        id: 'small',
        name: 'Small Room',
        capacity: '1-4 people',
        description: 'Perfect for individual or small group study',
        count: smallCount,
      },
      {
        id: 'large',
        name: 'Large Room',
        capacity: '5-12 people',
        description: 'Ideal for group projects and team meetings',
        count: largeCount,
      },
    ];
  }

  /**
   * Create a new room (admin only)
   */
  async createRoom(input: RoomServiceCreateInput, requesterId: string): Promise<IRoom> {
    // Check authorization
    await this.authorizationService.enforceRoomManagement(requesterId);

    // Validate input
    RoomEntity.validate(input as any);

    // Create room
    return this.roomRepository.create({
      name: input.name,
      category: input.category,
      capacity: input.capacity,
      description: input.description,
    });
  }

  /**
   * Update a room (admin only)
   */
  async updateRoom(
    roomId: string,
    input: RoomServiceUpdateInput,
    requesterId: string
  ): Promise<IRoom> {
    // Check authorization
    await this.authorizationService.enforceRoomManagement(requesterId);

    // Check room exists
    const existingRoom = await this.roomRepository.findById(roomId);
    if (!existingRoom) {
      throw new NotFoundError('Room not found');
    }

    // Validate input
    RoomEntity.validate(input as any);

    // Update room
    return this.roomRepository.update(roomId, input);
  }

  /**
   * Delete a room (admin only)
   */
  async deleteRoom(roomId: string, requesterId: string): Promise<void> {
    // Check authorization
    await this.authorizationService.enforceRoomManagement(requesterId);

    // Check room exists
    const existingRoom = await this.roomRepository.findById(roomId);
    if (!existingRoom) {
      throw new NotFoundError('Room not found');
    }

    // Delete room
    await this.roomRepository.delete(roomId);
  }
}


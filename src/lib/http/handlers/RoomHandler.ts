/**
 * Room HTTP Handler
 * 
 * Handles HTTP requests for room operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RoomService } from '../../services/RoomService';
import { 
  RoomCreateSchema, 
  RoomUpdateSchema, 
  RoomQuerySchema 
} from '../../validation/schemas';
import { ApplicationError } from '../../errors';
import { z } from 'zod';

export class RoomHandler {
  constructor(private roomService: RoomService) {}

  /**
   * GET /api/rooms
   * Get all rooms, optionally filtered by category
   */
  async getRooms(request: NextRequest): Promise<NextResponse> {
    try {
      const searchParams = request.nextUrl.searchParams;
      
      // Validate query parameters
      const query = RoomQuerySchema.parse({
        category: searchParams.get('category') || undefined,
      });

      const rooms = await this.roomService.getAllRooms(query.category);

      return NextResponse.json(rooms);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/rooms
   * Create a new room (admin only)
   */
  async createRoom(request: NextRequest, userId: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Validate input
      const validatedInput = RoomCreateSchema.parse(body);

      const room = await this.roomService.createRoom(validatedInput, userId);

      return NextResponse.json(room, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/rooms/[id]
   * Get a specific room
   */
  async getRoom(roomId: string): Promise<NextResponse> {
    try {
      const room = await this.roomService.getRoom(roomId);
      return NextResponse.json(room);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/rooms/[id]
   * Update a room (admin only)
   */
  async updateRoom(
    request: NextRequest,
    roomId: string,
    userId: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Validate input
      const validatedInput = RoomUpdateSchema.parse(body);

      const room = await this.roomService.updateRoom(roomId, validatedInput, userId);

      return NextResponse.json(room);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/rooms/[id]
   * Delete a room (admin only)
   */
  async deleteRoom(roomId: string, userId: string): Promise<NextResponse> {
    try {
      await this.roomService.deleteRoom(roomId, userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/rooms/categories
   * Get room categories with counts
   */
  async getCategories(): Promise<NextResponse> {
    try {
      const categories = await this.roomService.getRoomCategories();
      return NextResponse.json(categories);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and convert to appropriate HTTP responses
   */
  private handleError(error: unknown): NextResponse {
    console.error('RoomHandler error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof ApplicationError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}


/**
 * Booking HTTP Handler
 *
 * Handles HTTP requests for booking operations.
 * Validates input, calls services, formats responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "../../services/BookingService";
import {
  BookingCreateSchema,
  BookingUpdateSchema,
  BookingQuerySchema,
} from "../../validation/schemas";
import { ApplicationError } from "../../errors";
import { z } from "zod";

export class BookingHandler {
  constructor(private bookingService: BookingService) {}

  /**
   * GET /api/bookings
   * Get all bookings (filtered by user role)
   */
  async getBookings(
    request: NextRequest,
    userId: string
  ): Promise<NextResponse> {
    try {
      const searchParams = request.nextUrl.searchParams;

      // Validate query parameters
      const query = BookingQuerySchema.parse({
        limit: searchParams.get("limit") || undefined,
        status: searchParams.get("status") || undefined,
        upcoming: searchParams.get("upcoming") || undefined,
        date: searchParams.get("date") || undefined,
      });

      const options = {
        limit: query.limit,
        status: query.status,
        upcoming: query.upcoming === "true",
        date: query.date,
      };

      const bookings = await this.bookingService.getAllBookings(
        userId,
        options
      );

      return NextResponse.json(bookings);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/bookings
   * Create a new booking
   */
  async createBooking(
    request: NextRequest,
    userId: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate input
      const validatedInput = BookingCreateSchema.parse(body);

      const booking = await this.bookingService.createBooking(
        userId,
        validatedInput
      );

      return NextResponse.json(booking, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/bookings/[id]
   * Get a specific booking
   */
  async getBooking(bookingId: string, userId: string): Promise<NextResponse> {
    try {
      const booking = await this.bookingService.getBooking(bookingId, userId);
      return NextResponse.json(booking);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH /api/bookings/[id]
   * Update a booking status
   */
  async updateBooking(
    request: NextRequest,
    bookingId: string,
    userId: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json();

      // Validate input
      const { status } = BookingUpdateSchema.parse(body);

      const booking = await this.bookingService.updateBookingStatus(
        bookingId,
        status,
        userId
      );

      return NextResponse.json(booking);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE /api/bookings/[id]
   * Delete a booking (admin only)
   */
  async deleteBooking(
    bookingId: string,
    userId: string
  ): Promise<NextResponse> {
    try {
      await this.bookingService.deleteBooking(bookingId, userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST /api/bookings/[id]/cancel
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: string,
    userId: string
  ): Promise<NextResponse> {
    try {
      const booking = await this.bookingService.cancelBooking(
        bookingId,
        userId
      );
      return NextResponse.json(booking);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET /api/user/bookings
   * Get user's own bookings
   */
  async getUserBookings(
    userId: string,
    requesterId: string
  ): Promise<NextResponse> {
    try {
      const bookings = await this.bookingService.getUserBookings(
        userId,
        requesterId
      );
      return NextResponse.json(bookings);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and convert to appropriate HTTP responses
   */
  private handleError(error: unknown): NextResponse {
    console.error("BookingHandler error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
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
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

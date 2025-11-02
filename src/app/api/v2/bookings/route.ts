/**
 * API Route: Bookings (V2)
 * 
 * POST /api/v2/bookings - Create booking
 * GET /api/v2/bookings - List bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from '@/lib/container';
import { TimeSlot, TimeRange } from '@/lib/domain/timeslot';

/**
 * POST: Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roomId, date, startSlot, durationMinutes, visibility, maxParticipants, title, description } = body;

    // Validate required fields
    if (!roomId || !date || !startSlot || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user
    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get room to determine category
    const room = await container.roomRepository.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Build TimeRange from startSlot and duration
    const startTimeSlot = TimeSlot.fromString(startSlot);
    const timeRange = TimeRange.fromStartAndDuration(startTimeSlot, durationMinutes);

    // Create booking using TimeSlot service
    const booking = await container.timeSlotBookingService.createBooking({
      userId: user.id,
      category: room.category,
      date: new Date(date),
      timeRange,
      visibility: visibility || 'private',
      maxParticipants: maxParticipants || 1,
      title: title || undefined,
      description: description || undefined,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * GET: List bookings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : undefined;

    // Get user
    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Admin sees all, users see their own
    const bookings =
      user.role === 'admin'
        ? await container.bookingRepository.findAll({
            limit,
            filters: date ? { date } : undefined,
            orderBy: 'date',
            orderDirection: 'desc',
          })
        : await container.bookingRepository.findByUser(user.id);

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

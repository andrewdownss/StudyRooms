/**
 * API Route: Get All Bookings for a Room
 * GET /api/v2/rooms/:id/bookings?date=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');
    
    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter required' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const bookings = await container.bookingRepository.findByRoom(id, date);

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Error fetching room bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}


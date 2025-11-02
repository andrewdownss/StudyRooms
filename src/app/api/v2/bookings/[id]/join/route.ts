/**
 * API Route: Join Public Booking
 * POST /api/v2/bookings/:id/join
 * DELETE /api/v2/bookings/:id/join (leave)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from '@/lib/container';

/**
 * POST: Join a public booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Get booking
    const booking = await container.bookingRepository.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check visibility - only public bookings can be joined
    if (booking.visibility !== 'public' && booking.visibility !== 'org') {
      return NextResponse.json(
        { error: 'This is a private booking' },
        { status: 403 }
      );
    }

    // Check if user is the creator
    if (booking.userId === user.id) {
      return NextResponse.json(
        { error: 'You are the creator of this booking' },
        { status: 403 }
      );
    }

    // Check if already a participant
    if (booking.participants?.some(p => p.userId === user.id)) {
      return NextResponse.json(
        { error: 'Already joined this booking' },
        { status: 400 }
      );
    }

    // Check capacity
    const currentParticipants = booking.participants?.length || 0;
    if (currentParticipants >= (booking.maxParticipants || 1)) {
      return NextResponse.json(
        { error: 'Booking is full' },
        { status: 400 }
      );
    }

    // For organization bookings, check membership
    if (booking.visibility === 'org' && booking.organizationId) {
      const userMemberships = await container.orgMembershipRepository.findByUser(user.id);
      const userOrgIds = userMemberships.map(m => m.organizationId);
      
      if (!userOrgIds.includes(booking.organizationId)) {
        return NextResponse.json(
          { error: 'Not a member of this organization' },
          { status: 403 }
        );
      }
    }

    // Check if booking has already started
    const dateStr = booking.date.toISOString().split('T')[0];
    const bookingDateTime = new Date(`${dateStr}T${booking.startTime}`);
    
    if (bookingDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Booking has already started' },
        { status: 400 }
      );
    }

    // Add participant
    await container.bookingRepository.addParticipant(id, user.id);

    // Return updated booking
    const updatedBooking = await container.bookingRepository.findById(id);
    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error('Error joining booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join booking' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Leave a public booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Get booking
    const booking = await container.bookingRepository.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Cannot leave if you're the creator
    if (booking.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot leave your own booking. Cancel it instead.' },
        { status: 403 }
      );
    }

    // Remove participant
    await container.bookingRepository.removeParticipant(id, user.id);

    // Return updated booking
    const updatedBooking = await container.bookingRepository.findById(id);
    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error('Error leaving booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to leave booking' },
      { status: 500 }
    );
  }
}


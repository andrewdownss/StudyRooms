/**
 * API Route: Browse Public Bookings
 * GET /api/v2/bookings/public
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from '@/lib/container';
import { BookingEntity } from '@/lib/domain/booking';

/**
 * GET: List all public/organization bookings
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

    // Get user
    const user = await container.userRepository.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : undefined;

    // Get public bookings
    const bookings = await container.bookingRepository.findPublicBookings(date);

    // Get user's organizations for filtering
    const userMemberships = await container.orgMembershipRepository.findByUser(user.id);
    const userOrgIds = userMemberships.map(m => m.organizationId);

    // Filter bookings user can see
    const visibleBookings = bookings.filter(booking => {
      const entity = new BookingEntity(booking);
      
      // Public bookings: everyone can see
      if (entity.isPublic()) {
        return true;
      }
      
      // Organization bookings: only members can see
      if (booking.visibility === 'org' && booking.organizationId) {
        return userOrgIds.includes(booking.organizationId);
      }
      
      return false;
    });

    // Enrich with display information
    const enrichedBookings = visibleBookings.map(booking => {
      const entity = new BookingEntity(booking);
      return {
        ...booking,
        displayColor: entity.getDisplayColor(),
        availableSlots: entity.getAvailableSlots(),
        isFull: entity.isFull(),
        canJoin: entity.canUserJoin(user.id, userOrgIds).allowed,
      };
    });

    return NextResponse.json(enrichedBookings);
  } catch (error: any) {
    console.error('Error fetching public bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch public bookings' },
      { status: 500 }
    );
  }
}


/**
 * Booking Service
 * 
 * Implements booking business logic with authorization.
 * Orchestrates repositories and domain models.
 */

import { IBookingService, BookingServiceCreateInput, GetBookingsOptions } from '../interfaces/services';
import { IBookingRepository, IRoomRepository, IUserRepository } from '../interfaces/repositories';
import { IAuthorizationService } from '../interfaces/services';
import { IBooking, IRoom, BookingStatus, RoomCategory } from '../interfaces/domain';
import { BookingEntity } from '../domain/Booking';
import { UserEntity } from '../domain/User';
import { 
  NotFoundError, 
  ForbiddenError, 
  ConflictError, 
  ValidationError 
} from '../errors';

export class BookingService implements IBookingService {
  constructor(
    private bookingRepository: IBookingRepository,
    private roomRepository: IRoomRepository,
    private userRepository: IUserRepository,
    private authorizationService: IAuthorizationService
  ) {}

  /**
   * Create a new booking with business logic and authorization
   */
  async createBooking(
    userId: string,
    input: BookingServiceCreateInput
  ): Promise<IBooking> {
    // 1. Validate input
    const date = new Date(input.date);
    BookingEntity.validate({
      date,
      startTime: input.startTime,
      duration: input.duration,
    } as any);

    // 2. Get user to check role-specific limits
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userEntity = UserEntity.fromData(user);

    // 3. Check user's booking limits
    if (input.duration > userEntity.getMaxBookingDuration()) {
      throw new ValidationError(
        `Your role allows maximum ${userEntity.getMaxBookingDuration()} minutes per booking`
      );
    }

    // 4. Check daily booking limit
    const userBookingsToday = await this.bookingRepository.findByUser(userId);
    const todayBookings = userBookingsToday.filter(b => 
      b.date.toDateString() === date.toDateString() && 
      b.status === 'confirmed'
    );
    const totalMinutesToday = todayBookings.reduce((sum, b) => sum + b.duration, 0);
    const dailyLimit = userEntity.getDailyBookingLimit();

    if (totalMinutesToday + input.duration > dailyLimit) {
      const remaining = dailyLimit - totalMinutesToday;
      throw new ValidationError(
        `Daily booking limit exceeded. You have ${remaining} minutes remaining today.`
      );
    }

    // 5. Find available rooms
    const availableRooms = await this.roomRepository.findAvailable(
      input.category,
      date,
      input.startTime,
      input.duration
    );

    if (availableRooms.length === 0) {
      throw new ConflictError(
        'No rooms available for the selected time slot. Please try a different time.'
      );
    }

    // 6. Select the first available room
    const room = availableRooms[0];

    // 7. Create the booking
    const booking = await this.bookingRepository.create({
      userId,
      roomId: room.id,
      date,
      startTime: input.startTime,
      duration: input.duration,
      status: 'confirmed',
    });

    return booking;
  }

  /**
   * Get a specific booking with authorization
   */
  async getBooking(bookingId: string, requesterId: string): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization
    await this.authorizationService.enforceBookingView(requesterId, booking);

    return booking;
  }

  /**
   * Get user's bookings with authorization
   */
  async getUserBookings(userId: string, requesterId: string): Promise<IBooking[]> {
    // Users can view their own bookings, admins can view any user's bookings
    if (userId !== requesterId) {
      const canManage = await this.authorizationService.canManageUsers(requesterId);
      if (!canManage) {
        throw new ForbiddenError('You can only view your own bookings');
      }
    }

    return this.bookingRepository.findByUser(userId);
  }

  /**
   * Get all bookings (admin only) or user's own bookings
   */
  async getAllBookings(requesterId: string, options?: GetBookingsOptions): Promise<IBooking[]> {
    const user = await this.userRepository.findById(requesterId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userEntity = UserEntity.fromData(user);
    const isAdmin = userEntity.isAdmin();

    // Build filters
    const filters: any = {
      ...(options?.status && { status: options.status }),
      ...(!isAdmin && { userId: requesterId }), // Non-admins can only see their own
    };

    // Add upcoming filter
    if (options?.upcoming) {
      filters.startDate = new Date();
    }

    const bookings = await this.bookingRepository.findAll({
      limit: options?.limit,
      filters,
      includeUser: isAdmin, // Only include user details for admins
      includeRoom: true,
      orderBy: 'date',
      orderDirection: 'desc',
    });

    return bookings;
  }

  /**
   * Cancel a booking with authorization
   */
  async cancelBooking(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization
    const canCancel = await this.authorizationService.canCancelBooking(userId, booking);
    if (!canCancel) {
      throw new ForbiddenError('You do not have permission to cancel this booking');
    }

    // Use domain model to cancel
    const bookingEntity = BookingEntity.fromData(booking);
    
    if (!bookingEntity.canBeCancelled()) {
      throw new ValidationError('This booking cannot be cancelled');
    }

    bookingEntity.cancel();

    // Update in database
    return this.bookingRepository.updateStatus(bookingId, 'cancelled');
  }

  /**
   * Update booking status (admin only)
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    requesterId: string
  ): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Enforce admin-only modification
    await this.authorizationService.enforceBookingModify(requesterId, booking);

    return this.bookingRepository.updateStatus(bookingId, status);
  }

  /**
   * Delete a booking (admin only)
   */
  async deleteBooking(bookingId: string, requesterId: string): Promise<void> {
    const booking = await this.bookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check authorization
    const canDelete = await this.authorizationService.canDeleteBooking(requesterId, booking);
    if (!canDelete) {
      throw new ForbiddenError('Only administrators can delete bookings');
    }

    await this.bookingRepository.delete(bookingId);
  }

  /**
   * Check if rooms are available for a time slot
   */
  async checkAvailability(
    category: RoomCategory,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<boolean> {
    const availableRooms = await this.roomRepository.findAvailable(
      category,
      date,
      startTime,
      duration
    );
    return availableRooms.length > 0;
  }

  /**
   * Find all available rooms for a time slot
   */
  async findAvailableRooms(
    category: RoomCategory,
    date: Date,
    startTime: string,
    duration: number
  ): Promise<IRoom[]> {
    return this.roomRepository.findAvailable(category, date, startTime, duration);
  }
}


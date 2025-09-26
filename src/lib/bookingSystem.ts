export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in minutes
  userId?: string; // for future user system
  createdAt: string;
}

export interface BookingData {
  category?: 'small' | 'large';
  roomId?: string;
  roomName?: string;
  date?: string;
  startTime?: string;
  duration?: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  isAccessible: boolean;
  location: string;
  category: 'small' | 'group' | 'large';
}

export interface RoomCategory {
  id: 'small' | 'group' | 'large';
  name: string;
  description: string;
  capacity: string;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isBooked: boolean;
}

export class BookingSystem {
  private bookings: Booking[] = [];
  private rooms: Room[] = [];

  // Initialize rooms 100-120, 200-220, 300-330
  private initializeRooms(): void {
    const rooms: Room[] = [];
    
    // Rooms 100-120 (1st Floor) - Small Rooms
    for (let i = 100; i <= 120; i++) {
      rooms.push({
        id: `room-${i}`,
        name: `Room ${i}`,
        capacity: 4,
        isAccessible: Math.random() > 0.3, // 70% accessible
        location: "1st Floor",
        category: 'small',
      });
    }
    
    // Rooms 200-220 (2nd Floor) - Small Rooms
    for (let i = 200; i <= 220; i++) {
      rooms.push({
        id: `room-${i}`,
        name: `Room ${i}`,
        capacity: 4,
        isAccessible: Math.random() > 0.3, // 70% accessible
        location: "2nd Floor",
        category: 'small',
      });
    }
    
    // Rooms 300-330 (3rd Floor) - Large Rooms
    for (let i = 300; i <= 330; i++) {
      rooms.push({
        id: `room-${i}`,
        name: `Room ${i}`,
        capacity: 8,
        isAccessible: Math.random() > 0.3, // 70% accessible
        location: "3rd Floor",
        category: 'large',
      });
    }
    
    this.rooms = rooms;
  }

  private roomCategories: RoomCategory[] = [
    {
      id: 'small',
      name: 'Small Room',
      description: 'Perfect for individual study or small groups',
      capacity: 'Up to 4 people',
    },
    {
      id: 'large',
      name: 'Large Room',
      description: 'Ideal for larger groups and collaborative work',
      capacity: 'Up to 8 people',
    },
  ];

  constructor() {
    this.initializeRooms();
    this.loadBookings();
  }

  // Load bookings from localStorage
  private loadBookings(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('studyRoomBookings');
      if (stored) {
        this.bookings = JSON.parse(stored);
      }
    }
  }

  // Save bookings to localStorage
  private saveBookings(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('studyRoomBookings', JSON.stringify(this.bookings));
    }
  }

  // Get all rooms
  getRooms(): Room[] {
    return this.rooms;
  }

  // Get room by ID
  getRoom(roomId: string): Room | undefined {
    return this.rooms.find(room => room.id === roomId);
  }

  // Get all room categories
  getRoomCategories(): RoomCategory[] {
    return this.roomCategories;
  }

  // Get rooms by category
  getRoomsByCategory(category: 'small' | 'group' | 'large'): Room[] {
    return this.rooms.filter(room => room.category === category);
  }

  // Find first available room in a category for a specific date and time
  // For small rooms, checks in order: 100, 101, 102, ..., 120, 200, 201, ..., 220, 300, 301, ..., 330
  findAvailableRoomInCategory(
    category: 'small' | 'group' | 'large', 
    date: string, 
    startTime: string, 
    duration: number
  ): Room | null {
    const roomsInCategory = this.getRoomsByCategory(category);
    
    // Sort rooms by room number (100, 101, 102, ..., 330)
    const sortedRooms = roomsInCategory.sort((a, b) => {
      const aNum = parseInt(a.id.replace('room-', ''));
      const bNum = parseInt(b.id.replace('room-', ''));
      return aNum - bNum;
    });
    
    for (const room of sortedRooms) {
      if (this.isTimeSlotAvailable(room.id, date, startTime, duration)) {
        return room;
      }
    }
    
    return null;
  }

  // Get all bookings
  getBookings(): Booking[] {
    return this.bookings;
  }

  // Get bookings for a specific date
  getBookingsForDate(date: string): Booking[] {
    return this.bookings.filter(booking => booking.date === date);
  }

  // Get bookings for a specific room and date
  getBookingsForRoomAndDate(roomId: string, date: string): Booking[] {
    return this.bookings.filter(
      booking => booking.roomId === roomId && booking.date === date
    );
  }

  // Check if a time slot is available
  isTimeSlotAvailable(roomId: string, date: string, startTime: string, duration: number): boolean {
    const endTime = this.calculateEndTime(startTime, duration);
    const existingBookings = this.getBookingsForRoomAndDate(roomId, date);

    // Check for conflicts
    for (const booking of existingBookings) {
      if (this.timesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
        return false;
      }
    }

    return true;
  }

  // Check daily booking limit (2 hours = 120 minutes)
  checkDailyLimit(date: string, additionalDuration: number = 0): boolean {
    const todayBookings = this.getBookingsForDate(date);
    const totalMinutes = todayBookings.reduce((sum, booking) => sum + booking.duration, 0);
    return (totalMinutes + additionalDuration) <= 120; // 2 hours max
  }

  // Create a new booking
  createBooking(roomId: string, date: string, startTime: string, duration: number): Booking | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    // Validate constraints
    if (!this.isTimeSlotAvailable(roomId, date, startTime, duration)) {
      throw new Error('Time slot is not available');
    }

    if (!this.checkDailyLimit(date, duration)) {
      throw new Error('Daily booking limit exceeded (2 hours maximum)');
    }

    if (duration > 120) {
      throw new Error('Single booking cannot exceed 2 hours');
    }

    const endTime = this.calculateEndTime(startTime, duration);
    const booking: Booking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      roomName: room.name,
      date,
      startTime,
      endTime,
      duration,
      createdAt: new Date().toISOString(),
    };

    this.bookings.push(booking);
    this.saveBookings();
    return booking;
  }

  // Create a booking by room category (finds first available room)
  createBookingByCategory(
    category: 'small' | 'group' | 'large', 
    date: string, 
    startTime: string, 
    duration: number
  ): Booking | null {
    // Find first available room in category
    const availableRoom = this.findAvailableRoomInCategory(category, date, startTime, duration);
    
    if (!availableRoom) {
      throw new Error(`No ${category} rooms available for the selected time`);
    }

    // Create booking with the found room
    return this.createBooking(availableRoom.id, date, startTime, duration);
  }

  // Cancel a booking
  cancelBooking(bookingId: string): boolean {
    const index = this.bookings.findIndex(booking => booking.id === bookingId);
    if (index !== -1) {
      this.bookings.splice(index, 1);
      this.saveBookings();
      return true;
    }
    return false;
  }

  // Generate available time slots for a room and date
  generateTimeSlots(roomId: string, date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = 30; // 30-minute slots

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const isAvailable = this.isTimeSlotAvailable(roomId, date, time, 30);
        const isBooked = !isAvailable;

        slots.push({
          time,
          isAvailable,
          isBooked,
        });
      }
    }

    return slots;
  }

  // Helper: Calculate end time from start time and duration
  private calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  // Helper: Check if two time ranges overlap
  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    return start1Min < end2Min && start2Min < end1Min;
  }

  // Get formatted time slots for display
  getFormattedTimeSlots(roomIdOrCategory: string, date: string): string[] {
    // If it's a category, use the first room in that category for preview
    if (roomIdOrCategory === 'small' || roomIdOrCategory === 'large') {
      const roomsInCategory = this.getRoomsByCategory(roomIdOrCategory as 'small' | 'large');
      if (roomsInCategory.length > 0) {
        const slots = this.generateTimeSlots(roomsInCategory[0].id, date);
        return slots
          .filter(slot => slot.isAvailable)
          .map(slot => this.formatTimeForDisplay(slot.time));
      }
      return [];
    }
    
    // If it's a specific room ID
    const slots = this.generateTimeSlots(roomIdOrCategory, date);
    return slots
      .filter(slot => slot.isAvailable)
      .map(slot => this.formatTimeForDisplay(slot.time));
  }

  // Format time for display (e.g., "09:00" -> "9:00 AM")
  private formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Get remaining daily minutes
  getRemainingDailyMinutes(date: string): number {
    const todayBookings = this.getBookingsForDate(date);
    const usedMinutes = todayBookings.reduce((sum, booking) => sum + booking.duration, 0);
    return Math.max(0, 120 - usedMinutes); // 2 hours = 120 minutes
  }
}

// Create a singleton instance
export const bookingSystem = new BookingSystem();

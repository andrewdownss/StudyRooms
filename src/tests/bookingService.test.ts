import { describe, it, expect, beforeEach, vi } from "vitest";
import { BookingService } from "@/lib/services/BookingService";
import { AuthorizationService } from "@/lib/services/AuthorizationService";
import {
  IBookingRepository,
  IRoomRepository,
  IUserRepository,
} from "@/lib/interfaces/repositories";

function createMocks() {
  const bookingRepository: IBookingRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByUser: vi.fn(),
    findByRoom: vi.fn(),
    findByDateRange: vi.fn(),
    findUpcoming: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    exists: vi.fn(),
  };

  const roomRepository: IRoomRepository = {
    create: vi.fn(),
    createMany: vi.fn(),
    findById: vi.fn(),
    findByCategory: vi.fn(),
    findAll: vi.fn(),
    findAvailable: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    exists: vi.fn(),
  };

  const userRepository: IUserRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    updateRole: vi.fn(),
    count: vi.fn(),
    exists: vi.fn(),
  };

  const authorizationService = new AuthorizationService(userRepository);

  return {
    bookingRepository,
    roomRepository,
    userRepository,
    authorizationService,
  };
}

describe("BookingService.createBooking", () => {
  const userId = "user_1";
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const baseInput = {
    category: "small" as const,
    date: tomorrow.toISOString().slice(0, 10),
    startTime: "10:00",
    duration: 60,
  };

  let service: BookingService;
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
    service = new BookingService(
      mocks.bookingRepository,
      mocks.roomRepository,
      mocks.userRepository,
      mocks.authorizationService
    );

    // default user (student)
    (mocks.userRepository.findById as any).mockResolvedValue({
      id: userId,
      name: "User",
      email: "user@example.com",
      emailVerified: null,
      image: null,
      role: "user",
      password: null,
      authProvider: "credentials",
    });

    // default: no other bookings today
    (mocks.bookingRepository.findByUser as any).mockResolvedValue([]);

    // default: a room is available
    (mocks.roomRepository.findAvailable as any).mockResolvedValue([
      {
        id: "room_1",
        name: "Room 1",
        category: "small",
        capacity: 4,
        description: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // default: repository returns created booking
    (mocks.bookingRepository.create as any).mockImplementation((data: any) => ({
      id: "booking_1",
      userId: data.userId,
      roomId: data.roomId,
      organizationId: data.organizationId,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      room: {
        id: "room_1",
        name: "Room 1",
        category: "small",
        capacity: 4,
        description: null,
        createdAt: now,
        updatedAt: now,
      },
    }));
  });

  it("creates a confirmed booking for personal bookings", async () => {
    const booking = await service.createBooking(userId, baseInput);
    expect(booking.status).toBe("confirmed");
    expect(mocks.bookingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed" })
    );
  });

  it("creates a pending booking for organization bookings", async () => {
    const booking = await service.createBooking(userId, {
      ...baseInput,
      organizationId: "org_1",
    });
    expect(booking.status).toBe("pending");
    expect(mocks.bookingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org_1", status: "pending" })
    );
  });

  it("rejects when duration exceeds user role limit", async () => {
    await expect(
      service.createBooking(userId, { ...baseInput, duration: 240 })
    ).rejects.toThrow();
  });

  it("rejects when no rooms are available", async () => {
    (mocks.roomRepository.findAvailable as any).mockResolvedValue([]);
    await expect(service.createBooking(userId, baseInput)).rejects.toThrow(
      "No rooms available"
    );
  });
});

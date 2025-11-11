/**
 * BookingEntity Domain Logic Tests
 * 
 * Tests critical business rules for booking management including:
 * - Security: Authorization and access control
 * - Safety: Time validation and past booking prevention
 * - Reliability: Status management and conflict detection
 * - Availability: Capacity management and slot calculation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BookingEntity } from "@/lib/domain/Booking";
import { IBooking } from "@/lib/interfaces/domain";
import { ValidationError } from "@/lib/errors";

describe("BookingEntity - Business Logic Tests", () => {
  // Helper to create test booking data
  const createTestBooking = (overrides: Partial<IBooking> = {}): IBooking => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    return {
      id: "booking_123",
      userId: "user_creator",
      roomId: "room_101",
      date: tomorrow,
      startTime: "14:00",
      duration: 60,
      status: "confirmed",
      visibility: "private",
      maxParticipants: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [],
      ...overrides,
    };
  };

  // ============================================================================
  // SECURITY TESTS - Authorization and Access Control
  // ============================================================================
  
  describe("Security: canUserJoin() - Authorization Rules", () => {
    it("should REJECT joining private bookings (security)", () => {
      const privateBooking = new BookingEntity(
        createTestBooking({ visibility: "private" })
      );

      const result = privateBooking.canUserJoin("user_2", []);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("This is a private booking");
    });

    it("should REJECT creator from joining their own booking (security)", () => {
      const publicBooking = new BookingEntity(
        createTestBooking({
          visibility: "public",
          maxParticipants: 5,
          userId: "user_creator",
        })
      );

      const result = publicBooking.canUserJoin("user_creator", []);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("You are the creator");
    });

    it("should REJECT non-members from organization bookings (security)", () => {
      const orgBooking = new BookingEntity(
        createTestBooking({
          visibility: "org",
          organizationId: "org_cs_club",
          maxParticipants: 10,
        })
      );

      // User is not in org_cs_club
      const result = orgBooking.canUserJoin("user_2", ["org_other"]);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Not a member of this organization");
    });

    it("should ALLOW members to join organization bookings (security)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const orgBooking = new BookingEntity(
        createTestBooking({
          visibility: "org",
          organizationId: "org_cs_club",
          maxParticipants: 10,
          date: tomorrow,
          participants: [],
        })
      );

      // User IS in org_cs_club
      const result = orgBooking.canUserJoin("user_2", ["org_cs_club"]);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should REJECT users who already joined (security)", () => {
      const publicBooking = new BookingEntity(
        createTestBooking({
          visibility: "public",
          maxParticipants: 5,
          participants: [{ userId: "user_2", role: "participant" }],
        })
      );

      const result = publicBooking.canUserJoin("user_2", []);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Already joined");
    });
  });

  // ============================================================================
  // SAFETY TESTS - Time Validation and Past Booking Prevention
  // ============================================================================

  describe("Safety: Time Validation", () => {
    it("should REJECT joining bookings that already started (safety)", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(10, 0, 0, 0);

      const pastBooking = new BookingEntity(
        createTestBooking({
          visibility: "public",
          maxParticipants: 5,
          date: yesterday,
          startTime: "10:00",
          participants: [],
        })
      );

      const result = pastBooking.canUserJoin("user_2", []);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Booking has already started");
    });

    it("should REJECT cancelling past bookings (safety)", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const pastBooking = new BookingEntity(
        createTestBooking({
          date: yesterday,
          startTime: "10:00",
          status: "confirmed",
        })
      );

      expect(pastBooking.canBeCancelled()).toBe(false);
    });

    it("should ALLOW cancelling future bookings (safety)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const futureBooking = new BookingEntity(
        createTestBooking({
          date: tomorrow,
          startTime: "14:00",
          status: "confirmed",
        })
      );

      expect(futureBooking.canBeCancelled()).toBe(true);
    });

    it("should validate minimum duration of 30 minutes (safety)", () => {
      expect(() => {
        BookingEntity.validate({ duration: 15 });
      }).toThrow(ValidationError);
      expect(() => {
        BookingEntity.validate({ duration: 15 });
      }).toThrow("Minimum booking duration is 30 minutes");
    });

    it("should validate maximum duration of 120 minutes (safety)", () => {
      expect(() => {
        BookingEntity.validate({ duration: 180 });
      }).toThrow(ValidationError);
      expect(() => {
        BookingEntity.validate({ duration: 180 });
      }).toThrow("Maximum booking duration is 120 minutes");
    });

    it("should validate 30-minute increments (safety)", () => {
      expect(() => {
        BookingEntity.validate({ duration: 45 });
      }).toThrow("Duration must be in 30-minute increments");
    });
  });

  // ============================================================================
  // RELIABILITY TESTS - Status Management and Conflict Detection
  // ============================================================================

  describe("Reliability: Status Management", () => {
    it("should NOT allow cancelling already cancelled bookings (reliability)", () => {
      const booking = new BookingEntity(
        createTestBooking({ status: "cancelled" })
      );

      expect(booking.canBeCancelled()).toBe(false);
    });

    it("should NOT allow cancelling completed bookings (reliability)", () => {
      const booking = new BookingEntity(
        createTestBooking({ status: "completed" })
      );

      expect(booking.canBeCancelled()).toBe(false);
    });

    it("should correctly identify upcoming confirmed bookings (reliability)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcomingBooking = new BookingEntity(
        createTestBooking({
          date: tomorrow,
          status: "confirmed",
        })
      );

      expect(upcomingBooking.isUpcoming()).toBe(true);
    });

    it("should NOT identify cancelled bookings as upcoming (reliability)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const cancelledBooking = new BookingEntity(
        createTestBooking({
          date: tomorrow,
          status: "cancelled",
        })
      );

      expect(cancelledBooking.isUpcoming()).toBe(false);
    });
  });

  describe("Reliability: Conflict Detection", () => {
    it("should detect overlapping bookings in same room (reliability)", () => {
      const booking1 = new BookingEntity(
        createTestBooking({
          roomId: "room_101",
          startTime: "14:00",
          duration: 60, // 14:00 - 15:00
        })
      );

      const booking2Data = createTestBooking({
        roomId: "room_101",
        startTime: "14:30",
        duration: 60, // 14:30 - 15:30 (overlaps!)
      });
      const booking2 = new BookingEntity(booking2Data);

      expect(booking1.conflictsWith(booking2)).toBe(true);
    });

    it("should NOT detect conflict for different rooms (reliability)", () => {
      const booking1 = new BookingEntity(
        createTestBooking({
          roomId: "room_101",
          startTime: "14:00",
          duration: 60,
        })
      );

      const booking2Data = createTestBooking({
        roomId: "room_102", // Different room!
        startTime: "14:00",
        duration: 60,
      });
      const booking2 = new BookingEntity(booking2Data);

      expect(booking1.conflictsWith(booking2)).toBe(false);
    });

    it("should NOT detect conflict for back-to-back bookings (reliability)", () => {
      const booking1 = new BookingEntity(
        createTestBooking({
          startTime: "14:00",
          duration: 60, // 14:00 - 15:00
        })
      );

      const booking2Data = createTestBooking({
        startTime: "15:00",
        duration: 60, // 15:00 - 16:00 (no overlap)
      });
      const booking2 = new BookingEntity(booking2Data);

      expect(booking1.conflictsWith(booking2)).toBe(false);
    });
  });

  // ============================================================================
  // AVAILABILITY TESTS - Capacity Management
  // ============================================================================

  describe("Availability: Capacity Management", () => {
    it("should correctly calculate available slots (availability)", () => {
      const booking = new BookingEntity(
        createTestBooking({
          visibility: "public",
          maxParticipants: 5,
          participants: [
            { userId: "user_1" },
            { userId: "user_2" },
          ],
        })
      );

      expect(booking.getAvailableSlots()).toBe(3); // 5 - 2 = 3
    });

    it("should REJECT joining full bookings (availability)", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const fullBooking = new BookingEntity(
        createTestBooking({
          visibility: "public",
          maxParticipants: 3,
          date: tomorrow,
          participants: [
            { userId: "user_1" },
            { userId: "user_2" },
            { userId: "user_3" },
          ],
        })
      );

      expect(fullBooking.isFull()).toBe(true);

      const result = fullBooking.canUserJoin("user_4", []);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Booking is full");
    });

    it("should correctly identify not-full bookings (availability)", () => {
      const booking = new BookingEntity(
        createTestBooking({
          maxParticipants: 5,
          participants: [{ userId: "user_1" }],
        })
      );

      expect(booking.isFull()).toBe(false);
    });
  });

  // ============================================================================
  // UI INTEGRATION TESTS - Display Logic
  // ============================================================================

  describe("UI Integration: Display Colors", () => {
    it("should return blue for public bookings", () => {
      const booking = new BookingEntity(
        createTestBooking({ visibility: "public" })
      );
      expect(booking.getDisplayColor()).toBe("blue");
    });

    it("should return gray for organization bookings", () => {
      const booking = new BookingEntity(
        createTestBooking({ visibility: "org" })
      );
      expect(booking.getDisplayColor()).toBe("gray");
    });

    it("should return red for private bookings", () => {
      const booking = new BookingEntity(
        createTestBooking({ visibility: "private" })
      );
      expect(booking.getDisplayColor()).toBe("red");
    });
  });

  // ============================================================================
  // HELPER METHOD TESTS - Utility Functions
  // ============================================================================

  describe("Helper Methods", () => {
    it("should correctly calculate end time", () => {
      const booking = new BookingEntity(
        createTestBooking({
          startTime: "14:00",
          duration: 90, // 1.5 hours
        })
      );

      expect(booking.getEndTime()).toBe("15:30");
    });

    it("should correctly identify visibility types", () => {
      const publicBooking = new BookingEntity(
        createTestBooking({ visibility: "public" })
      );
      const privateBooking = new BookingEntity(
        createTestBooking({ visibility: "private" })
      );

      expect(publicBooking.isPublic()).toBe(true);
      expect(publicBooking.isPrivate()).toBe(false);
      expect(privateBooking.isPublic()).toBe(false);
      expect(privateBooking.isPrivate()).toBe(true);
    });
  });
});



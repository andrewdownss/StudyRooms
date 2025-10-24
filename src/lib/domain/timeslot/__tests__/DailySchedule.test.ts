/**
 * DailySchedule Tests
 */

import { describe, it, expect } from "vitest";
import { TimeSlot } from "../TimeSlot";
import { TimeRange } from "../TimeRange";
import { DailySchedule } from "../DailySchedule";
import { ValidationError } from "../../../errors";

describe("DailySchedule", () => {
  describe("Creation", () => {
    it("should create empty schedule", () => {
      const date = new Date("2025-10-25");
      const schedule = new DailySchedule(date);

      expect(schedule.getBookedRanges().length).toBe(0);
    });

    it("should create schedule with bookings", () => {
      const date = new Date("2025-10-25");
      const bookings = [
        TimeRange.fromLegacy("14:00", 60),
        TimeRange.fromLegacy("16:00", 60),
      ];

      const schedule = new DailySchedule(date, bookings);

      expect(schedule.getBookedRanges().length).toBe(2);
    });

    it("should reject overlapping bookings", () => {
      const date = new Date("2025-10-25");
      const bookings = [
        TimeRange.fromLegacy("14:00", 60),
        TimeRange.fromLegacy("14:30", 60), // Overlaps with first
      ];

      expect(() => new DailySchedule(date, bookings)).toThrow(ValidationError);
    });
  });

  describe("Availability Checking", () => {
    it("should check if range is available", () => {
      const date = new Date("2025-10-25");
      const bookings = [TimeRange.fromLegacy("14:00", 60)];
      const schedule = new DailySchedule(date, bookings);

      const available = TimeRange.fromLegacy("15:00", 60);
      const conflict = TimeRange.fromLegacy("14:30", 60);

      expect(schedule.isAvailable(available)).toBe(true);
      expect(schedule.isAvailable(conflict)).toBe(false);
    });

    it("should get available slots", () => {
      const date = new Date("2025-10-25");
      const bookings = [TimeRange.fromLegacy("14:00", 60)];
      const schedule = new DailySchedule(date, bookings, { start: 8, end: 10 });

      const slots = schedule.getAvailableSlots();

      // Should have slots from 8:00-14:00 and 15:00-10:00 (next day boundary handled)
      expect(slots.length).toBeGreaterThan(0);
      expect(slots.some((s) => s.toString() === "14:00")).toBe(false);
      expect(slots.some((s) => s.toString() === "14:30")).toBe(false);
    });

    it("should get available slots for specific duration", () => {
      const date = new Date("2025-10-25");
      const bookings = [TimeRange.fromLegacy("14:00", 60)];
      const schedule = new DailySchedule(date, bookings, { start: 8, end: 16 });

      const slots = schedule.getAvailableSlotsForDuration(90);

      // Each returned slot should allow a 90-minute booking
      slots.forEach((slot) => {
        const range = TimeRange.fromStartAndDuration(slot, 90);
        expect(schedule.isAvailable(range)).toBe(true);
      });
    });
  });

  describe("Commands", () => {
    it("should add booking", () => {
      const date = new Date("2025-10-25");
      const schedule = new DailySchedule(date);

      const newBooking = TimeRange.fromLegacy("14:00", 60);
      const updated = schedule.addBooking(newBooking);

      expect(updated.getBookedRanges().length).toBe(1);
      expect(schedule.getBookedRanges().length).toBe(0); // Original unchanged
    });

    it("should reject conflicting booking", () => {
      const date = new Date("2025-10-25");
      const bookings = [TimeRange.fromLegacy("14:00", 60)];
      const schedule = new DailySchedule(date, bookings);

      const conflict = TimeRange.fromLegacy("14:30", 60);

      expect(() => schedule.addBooking(conflict)).toThrow(ValidationError);
    });

    it("should remove booking", () => {
      const date = new Date("2025-10-25");
      const booking = TimeRange.fromLegacy("14:00", 60);
      const schedule = new DailySchedule(date, [booking]);

      const updated = schedule.removeBooking(booking);

      expect(updated.getBookedRanges().length).toBe(0);
    });
  });

  describe("Statistics", () => {
    it("should calculate total booked minutes", () => {
      const date = new Date("2025-10-25");
      const bookings = [
        TimeRange.fromLegacy("14:00", 60),
        TimeRange.fromLegacy("16:00", 90),
      ];
      const schedule = new DailySchedule(date, bookings);

      expect(schedule.getTotalBookedMinutes()).toBe(150);
    });

    it("should calculate utilization percentage", () => {
      const date = new Date("2025-10-25");
      const bookings = [TimeRange.fromLegacy("14:00", 60)];
      const schedule = new DailySchedule(date, bookings, { start: 8, end: 10 });

      const utilization = schedule.getUtilizationPercentage();

      expect(utilization).toBeGreaterThan(0);
      expect(utilization).toBeLessThanOrEqual(100);
    });

    it("should get summary", () => {
      const date = new Date("2025-10-25");
      const schedule = new DailySchedule(date, [], { start: 8, end: 22 });

      const summary = schedule.getSummary();

      expect(summary.totalSlots).toBe(28); // 14 hours * 2 slots per hour
      expect(summary.bookedSlots).toBe(0);
      expect(summary.utilization).toBe(0);
    });
  });

  describe("Advanced Queries", () => {
    it("should find max available duration from slot", () => {
      const date = new Date("2025-10-25");
      const bookings = [TimeRange.fromLegacy("16:00", 60)];
      const schedule = new DailySchedule(date, bookings, { start: 14, end: 18 });

      const slot = TimeSlot.fromTime(14, 0);
      const maxDuration = schedule.getMaxAvailableDuration(slot);

      expect(maxDuration).toBe(120); // 14:00-16:00 = 2 hours
    });

    it("should find next available slot", () => {
      const date = new Date("2025-10-25");
      const bookings = [
        TimeRange.fromLegacy("14:00", 60),
        TimeRange.fromLegacy("15:00", 30),
      ];
      const schedule = new DailySchedule(date, bookings, { start: 8, end: 18 });

      const afterBooked = TimeSlot.fromTime(14, 0);
      const next = schedule.getNextAvailableSlot(afterBooked);

      expect(next).not.toBeNull();
      expect(next?.toString()).toBe("15:30");
    });
  });
});

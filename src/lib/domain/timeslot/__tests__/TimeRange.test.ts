/**
 * TimeRange Tests
 */

import { describe, it, expect } from "vitest";
import { TimeSlot } from "../TimeSlot";
import { TimeRange } from "../TimeRange";
import { ValidationError } from "../../../errors";

describe("TimeRange", () => {
  describe("Factory Methods", () => {
    it("should create from slots", () => {
      const start = TimeSlot.fromTime(14, 0);
      const end = TimeSlot.fromTime(15, 0);
      const range = TimeRange.fromSlots(start, end);

      expect(range.getDurationMinutes()).toBe(60);
    });

    it("should create from start and duration", () => {
      const start = TimeSlot.fromTime(14, 0);
      const range = TimeRange.fromStartAndDuration(start, 90);

      expect(range.getEnd().toString()).toBe("15:30");
    });

    it("should create from legacy format", () => {
      const range = TimeRange.fromLegacy("14:00", 60);

      expect(range.getStart().toString()).toBe("14:00");
      expect(range.getDurationMinutes()).toBe(60);
    });

    it("should reject invalid ranges", () => {
      const start = TimeSlot.fromTime(14, 0);
      const end = TimeSlot.fromTime(14, 0);

      expect(() => TimeRange.fromSlots(start, end)).toThrow(ValidationError);
    });
  });

  describe("Queries", () => {
    it("should get all slots", () => {
      const range = TimeRange.fromLegacy("14:00", 90);
      const slots = range.getAllSlots();

      expect(slots.length).toBe(3);
      expect(slots[0].toString()).toBe("14:00");
      expect(slots[1].toString()).toBe("14:30");
      expect(slots[2].toString()).toBe("15:00");
    });

    it("should convert to legacy format", () => {
      const range = TimeRange.fromLegacy("14:00", 90);
      const legacy = range.toLegacy();

      expect(legacy.startTime).toBe("14:00");
      expect(legacy.duration).toBe(90);
    });
  });

  describe("Overlap Detection", () => {
    it("should detect overlaps", () => {
      const range1 = TimeRange.fromLegacy("14:00", 60); // 14:00-15:00
      const range2 = TimeRange.fromLegacy("14:30", 60); // 14:30-15:30
      const range3 = TimeRange.fromLegacy("15:30", 60); // 15:30-16:30

      expect(range1.overlapsWith(range2)).toBe(true);
      expect(range1.overlapsWith(range3)).toBe(false);
    });

    it("should detect adjacency", () => {
      const range1 = TimeRange.fromLegacy("14:00", 60); // 14:00-15:00
      const range2 = TimeRange.fromLegacy("15:00", 60); // 15:00-16:00

      expect(range1.isAdjacentTo(range2)).toBe(true);
      expect(range1.overlapsWith(range2)).toBe(false);
    });

    it("should check if contains slot", () => {
      const range = TimeRange.fromLegacy("14:00", 90);
      const slot1 = TimeSlot.fromTime(14, 30);
      const slot2 = TimeSlot.fromTime(16, 0);

      expect(range.contains(slot1)).toBe(true);
      expect(range.contains(slot2)).toBe(false);
    });
  });

  describe("Commands", () => {
    it("should extend range", () => {
      const range = TimeRange.fromLegacy("14:00", 60);
      const extended = range.extend(30);

      expect(extended.getDurationMinutes()).toBe(90);
    });

    it("should shift range", () => {
      const range = TimeRange.fromLegacy("14:00", 60);
      const shifted = range.shift(30);

      expect(shifted.getStart().toString()).toBe("14:30");
      expect(shifted.getEnd().toString()).toBe("15:30");
    });
  });

  describe("Business Logic", () => {
    it("should validate booking duration", () => {
      const valid = TimeRange.fromLegacy("14:00", 60);
      const tooShort = TimeRange.fromLegacy("14:00", 30);
      const tooLong = TimeRange.fromLegacy("14:00", 300);

      expect(valid.isValidBookingDuration()).toBe(true);
      expect(tooShort.isValidBookingDuration()).toBe(true); // 30 min is valid minimum
      expect(tooLong.isValidBookingDuration()).toBe(false); // > 240 min
    });
  });
});


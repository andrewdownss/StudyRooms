/**
 * TimeSlot Tests
 */

import { describe, it, expect } from "vitest";
import { TimeSlot } from "../TimeSlot";
import { ValidationError } from "../../../errors";

describe("TimeSlot", () => {
  describe("Factory Methods", () => {
    it("should create from time", () => {
      const slot = TimeSlot.fromTime(14, 0);
      expect(slot.getHours()).toBe(14);
      expect(slot.getMinuteOfHour()).toBe(0);
    });

    it("should create from string", () => {
      const slot = TimeSlot.fromString("14:30");
      expect(slot.toString()).toBe("14:30");
    });

    it("should create from minutes", () => {
      const slot = TimeSlot.fromMinutes(840); // 14:00
      expect(slot.getHours()).toBe(14);
    });

    it("should reject invalid times", () => {
      expect(() => TimeSlot.fromTime(25, 0)).toThrow(ValidationError);
      expect(() => TimeSlot.fromTime(14, 15)).toThrow(ValidationError); // Not 30-min aligned
      expect(() => TimeSlot.fromString("25:00")).toThrow(ValidationError);
    });
  });

  describe("Queries", () => {
    it("should get minutes since midnight", () => {
      const slot = TimeSlot.fromTime(14, 30);
      expect(slot.getMinutes()).toBe(14 * 60 + 30);
    });

    it("should convert to string", () => {
      const slot = TimeSlot.fromTime(9, 30);
      expect(slot.toString()).toBe("09:30");
    });

    it("should convert to display string", () => {
      const slot = TimeSlot.fromTime(14, 30);
      expect(slot.toDisplayString()).toBe("2:30 PM");
    });
  });

  describe("Comparisons", () => {
    it("should compare slots correctly", () => {
      const slot1 = TimeSlot.fromTime(14, 0);
      const slot2 = TimeSlot.fromTime(14, 30);
      const slot3 = TimeSlot.fromTime(14, 0);

      expect(slot1.equals(slot3)).toBe(true);
      expect(slot1.isBefore(slot2)).toBe(true);
      expect(slot2.isAfter(slot1)).toBe(true);
    });

    it("should calculate slots between", () => {
      const slot1 = TimeSlot.fromTime(14, 0);
      const slot2 = TimeSlot.fromTime(15, 30);

      expect(slot1.slotsBetween(slot2)).toBe(3); // 90 minutes = 3 slots
    });
  });

  describe("Commands", () => {
    it("should get next slot", () => {
      const slot = TimeSlot.fromTime(14, 0);
      const next = slot.next();

      expect(next.toString()).toBe("14:30");
    });

    it("should get previous slot", () => {
      const slot = TimeSlot.fromTime(14, 30);
      const prev = slot.previous();

      expect(prev.toString()).toBe("14:00");
    });

    it("should add slots", () => {
      const slot = TimeSlot.fromTime(14, 0);
      const future = slot.addSlots(4); // Add 2 hours

      expect(future.toString()).toBe("16:00");
    });
  });

  describe("Business Logic", () => {
    it("should check operating hours", () => {
      const morning = TimeSlot.fromTime(9, 0);
      const evening = TimeSlot.fromTime(21, 30);
      const night = TimeSlot.fromTime(23, 0);

      expect(morning.isWithinOperatingHours(8, 22)).toBe(true);
      expect(evening.isWithinOperatingHours(8, 22)).toBe(true);
      expect(night.isWithinOperatingHours(8, 22)).toBe(false);
    });
  });
});


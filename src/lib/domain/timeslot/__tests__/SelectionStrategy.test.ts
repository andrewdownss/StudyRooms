/**
 * Selection Strategy Tests
 */

import { describe, it, expect } from "vitest";
import { TimeSlot } from "../TimeSlot";
import {
  SingleSelectionStrategy,
  RangeSelectionStrategy,
  MultiSelectionStrategy,
  ContiguousMultiSelectionStrategy,
} from "../presentation/ISelectionStrategy";
import { TimeSlotViewModel } from "../presentation/TimeSlotViewModel";

describe("Selection Strategies", () => {
  describe("SingleSelectionStrategy", () => {
    it("should select single slot", () => {
      const strategy = new SingleSelectionStrategy();
      const slot = TimeSlot.fromTime(14, 0);
      const vm = new TimeSlotViewModel(slot, true, false, false);

      const result = strategy.select(slot, [], vm);

      expect(result.length).toBe(1);
      expect(result[0].equals(slot)).toBe(true);
    });

    it("should replace selection", () => {
      const strategy = new SingleSelectionStrategy();
      const slot1 = TimeSlot.fromTime(14, 0);
      const slot2 = TimeSlot.fromTime(15, 0);
      const vm = new TimeSlotViewModel(slot2, true, false, false);

      const result = strategy.select(slot2, [slot1], vm);

      expect(result.length).toBe(1);
      expect(result[0].equals(slot2)).toBe(true);
    });

    it("should deselect when clicking same slot", () => {
      const strategy = new SingleSelectionStrategy();
      const slot = TimeSlot.fromTime(14, 0);
      const vm = new TimeSlotViewModel(slot, true, false, false);

      const result = strategy.select(slot, [slot], vm);

      expect(result.length).toBe(0);
    });
  });

  describe("RangeSelectionStrategy", () => {
    it("should select range", () => {
      const strategy = new RangeSelectionStrategy();
      const slot1 = TimeSlot.fromTime(14, 0);
      const slot2 = TimeSlot.fromTime(15, 0);
      const vm = new TimeSlotViewModel(slot2, true, false, false);

      const result = strategy.select(slot2, [slot1], vm);

      expect(result.length).toBe(3); // 14:00, 14:30, 15:00
      expect(result[0].toString()).toBe("14:00");
      expect(result[2].toString()).toBe("15:00");
    });

    it("should handle reverse range", () => {
      const strategy = new RangeSelectionStrategy();
      const slot1 = TimeSlot.fromTime(15, 0);
      const slot2 = TimeSlot.fromTime(14, 0);
      const vm = new TimeSlotViewModel(slot2, true, false, false);

      const result = strategy.select(slot2, [slot1], vm);

      expect(result.length).toBe(3);
      expect(result[0].toString()).toBe("14:00");
    });

    it("should validate selection", () => {
      const strategy = new RangeSelectionStrategy();
      const slot1 = TimeSlot.fromTime(14, 0);
      const slot2 = TimeSlot.fromTime(14, 30);

      expect(strategy.isValidSelection([slot1, slot2])).toBe(true);
      expect(strategy.isValidSelection([slot1])).toBe(true); // Single slot is valid
    });
  });

  describe("MultiSelectionStrategy", () => {
    it("should toggle slots", () => {
      const strategy = new MultiSelectionStrategy(5);
      const slot1 = TimeSlot.fromTime(14, 0);
      const slot2 = TimeSlot.fromTime(15, 0);
      const vm1 = new TimeSlotViewModel(slot1, true, false, false);
      const vm2 = new TimeSlotViewModel(slot2, true, false, false);

      const result1 = strategy.select(slot1, [], vm1);
      expect(result1.length).toBe(1);

      const result2 = strategy.select(slot2, result1, vm2);
      expect(result2.length).toBe(2);

      // Deselect first
      const result3 = strategy.select(slot1, result2, vm1);
      expect(result3.length).toBe(1);
      expect(result3[0].equals(slot2)).toBe(true);
    });

    it("should enforce max slots limit", () => {
      const strategy = new MultiSelectionStrategy(2);
      const vm = new TimeSlotViewModel(
        TimeSlot.fromTime(14, 0),
        true,
        false,
        false
      );

      let selection: TimeSlot[] = [];

      // Add 3 slots
      for (let i = 0; i < 3; i++) {
        const slot = TimeSlot.fromTime(14 + i, 0);
        const slotVm = new TimeSlotViewModel(slot, true, false, false);
        selection = strategy.select(slot, selection, slotVm);
      }

      expect(selection.length).toBe(2); // Should not exceed max
    });
  });

  describe("ContiguousMultiSelectionStrategy", () => {
    it("should only allow adjacent slots", () => {
      const strategy = new ContiguousMultiSelectionStrategy(120);
      const slot1 = TimeSlot.fromTime(14, 0);
      const slot2 = TimeSlot.fromTime(14, 30);
      const slot3 = TimeSlot.fromTime(16, 0); // Not adjacent

      const vm1 = new TimeSlotViewModel(slot1, true, false, false);
      const vm2 = new TimeSlotViewModel(slot2, true, false, false);
      const vm3 = new TimeSlotViewModel(slot3, true, false, false);

      let selection = strategy.select(slot1, [], vm1);
      selection = strategy.select(slot2, selection, vm2);
      expect(selection.length).toBe(2);

      // Try to add non-adjacent - should reset
      selection = strategy.select(slot3, selection, vm3);
      expect(selection.length).toBe(1);
      expect(selection[0].equals(slot3)).toBe(true);
    });

    it("should enforce duration limit", () => {
      const strategy = new ContiguousMultiSelectionStrategy(60); // Max 1 hour
      const vm = new TimeSlotViewModel(
        TimeSlot.fromTime(14, 0),
        true,
        false,
        false
      );

      let selection: TimeSlot[] = [];

      // Try to add 3 slots (90 minutes)
      for (let i = 0; i < 3; i++) {
        const slot = TimeSlot.fromTime(14, i * 30);
        const slotVm = new TimeSlotViewModel(slot, true, false, false);
        selection = strategy.select(slot, selection, slotVm);
      }

      // Should stop at 60 minutes (2 slots)
      expect(selection.length).toBe(2);
    });
  });
});


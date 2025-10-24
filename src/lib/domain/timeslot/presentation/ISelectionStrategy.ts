/**
 * Selection Strategy Interface
 * 
 * Strategy pattern for different time slot selection behaviors
 * Allows runtime switching between single-select, range-select, multi-select
 * 
 * OOP Principles:
 * - Strategy Pattern: Encapsulate selection algorithms
 * - Polymorphism: Different strategies interchangeable
 * - Open/Closed: Open for extension, closed for modification
 */

import { TimeSlot } from "../TimeSlot";
import { TimeRange } from "../TimeRange";
import { ITimeSlotViewModel } from "./TimeSlotViewModel";

export type SelectionType = "single" | "range" | "multi";

/**
 * Base interface for selection strategies
 */
export interface ISelectionStrategy {
  /**
   * Process a slot selection/deselection
   * @param slot The slot being clicked
   * @param currentSelection Currently selected slots
   * @param viewModel View model for the clicked slot
   * @returns New array of selected slots
   */
  select(
    slot: TimeSlot,
    currentSelection: TimeSlot[],
    viewModel: ITimeSlotViewModel
  ): TimeSlot[];

  /**
   * Check if a slot can be selected
   * @param slot The slot to check
   * @param viewModel View model for the slot
   * @returns True if the slot can be selected
   */
  canSelect(slot: TimeSlot, viewModel: ITimeSlotViewModel): boolean;

  /**
   * Get the type of selection this strategy implements
   */
  getSelectionType(): SelectionType;

  /**
   * Get a description of how this strategy works
   */
  getDescription(): string;

  /**
   * Validate that current selection is valid for this strategy
   * @returns True if selection is valid
   */
  isValidSelection(selection: TimeSlot[]): boolean;

  /**
   * Get the time range from current selection (if applicable)
   * Returns null if selection doesn't form a valid range
   */
  getSelectionRange(selection: TimeSlot[]): TimeRange | null;
}

/**
 * Abstract base class for selection strategies
 * Provides common functionality
 */
export abstract class BaseSelectionStrategy implements ISelectionStrategy {
  abstract select(
    slot: TimeSlot,
    currentSelection: TimeSlot[],
    viewModel: ITimeSlotViewModel
  ): TimeSlot[];

  abstract getSelectionType(): SelectionType;

  abstract getDescription(): string;

  /**
   * Default implementation: can select if available and not in past
   */
  canSelect(slot: TimeSlot, viewModel: ITimeSlotViewModel): boolean {
    return viewModel.isAvailable && !viewModel.isInPast;
  }

  /**
   * Check if selection forms a contiguous range
   */
  protected isContiguousRange(selection: TimeSlot[]): boolean {
    if (selection.length === 0) return true;

    const sorted = this.sortSlots(selection);
    for (let i = 1; i < sorted.length; i++) {
      const expectedMinutes = sorted[i - 1].getMinutes() + 30;
      if (sorted[i].getMinutes() !== expectedMinutes) {
        return false;
      }
    }
    return true;
  }

  /**
   * Sort time slots chronologically
   */
  protected sortSlots(slots: TimeSlot[]): TimeSlot[] {
    return [...slots].sort((a, b) => a.getMinutes() - b.getMinutes());
  }

  /**
   * Default validation: any selection is valid
   */
  isValidSelection(selection: TimeSlot[]): boolean {
    return selection.length > 0;
  }

  /**
   * Try to create a time range from selection
   */
  getSelectionRange(selection: TimeSlot[]): TimeRange | null {
    if (selection.length === 0) return null;

    const sorted = this.sortSlots(selection);
    if (!this.isContiguousRange(selection)) return null;

    try {
      const start = sorted[0];
      const end = sorted[sorted.length - 1].next();
      return TimeRange.fromSlots(start, end);
    } catch {
      return null;
    }
  }
}

/**
 * Single Selection Strategy
 * Only one slot can be selected at a time
 */
export class SingleSelectionStrategy extends BaseSelectionStrategy {
  select(
    slot: TimeSlot,
    currentSelection: TimeSlot[],
    viewModel: ITimeSlotViewModel
  ): TimeSlot[] {
    if (!this.canSelect(slot, viewModel)) {
      return currentSelection;
    }

    // If clicking the same slot, deselect it
    if (
      currentSelection.length === 1 &&
      currentSelection[0].equals(slot)
    ) {
      return [];
    }

    // Replace with new selection
    return [slot];
  }

  getSelectionType(): SelectionType {
    return "single";
  }

  getDescription(): string {
    return "Select one time slot at a time. Click to select, click again to deselect.";
  }

  isValidSelection(selection: TimeSlot[]): boolean {
    return selection.length === 1;
  }
}

/**
 * Range Selection Strategy
 * Select a continuous range of slots
 * First click sets start, second click sets end
 */
export class RangeSelectionStrategy extends BaseSelectionStrategy {
  select(
    slot: TimeSlot,
    currentSelection: TimeSlot[],
    viewModel: ITimeSlotViewModel
  ): TimeSlot[] {
    if (!this.canSelect(slot, viewModel)) {
      return currentSelection;
    }

    // First click - set start
    if (currentSelection.length === 0) {
      return [slot];
    }

    // If clicking the same slot, deselect
    if (
      currentSelection.length === 1 &&
      currentSelection[0].equals(slot)
    ) {
      return [];
    }

    // Second click - create range
    if (currentSelection.length === 1) {
      const start = currentSelection[0];
      return this.createRange(start, slot);
    }

    // Already have range - start new selection
    return [slot];
  }

  /**
   * Create all slots between start and end (inclusive)
   */
  private createRange(start: TimeSlot, end: TimeSlot): TimeSlot[] {
    // Determine direction
    const isForward = start.isBefore(end);
    const rangeStart = isForward ? start : end;
    const rangeEnd = isForward ? end : start;

    const slots: TimeSlot[] = [];
    let current = rangeStart;

    while (current.isBeforeOrEqual(rangeEnd)) {
      slots.push(current);
      try {
        current = current.next();
      } catch {
        break;
      }
    }

    return slots;
  }

  getSelectionType(): SelectionType {
    return "range";
  }

  getDescription(): string {
    return "Select a range of time slots. Click start time, then click end time to select all slots in between.";
  }

  isValidSelection(selection: TimeSlot[]): boolean {
    return selection.length > 0 && this.isContiguousRange(selection);
  }
}

/**
 * Multi Selection Strategy
 * Toggle individual slots on/off
 */
export class MultiSelectionStrategy extends BaseSelectionStrategy {
  private readonly maxSlots: number;

  constructor(maxSlots: number = 8) {
    super();
    this.maxSlots = maxSlots;
  }

  select(
    slot: TimeSlot,
    currentSelection: TimeSlot[],
    viewModel: ITimeSlotViewModel
  ): TimeSlot[] {
    if (!this.canSelect(slot, viewModel)) {
      return currentSelection;
    }

    // Check if already selected
    const existingIndex = currentSelection.findIndex((s) => s.equals(slot));

    if (existingIndex >= 0) {
      // Deselect - remove from array
      return [
        ...currentSelection.slice(0, existingIndex),
        ...currentSelection.slice(existingIndex + 1),
      ];
    }

    // Add to selection if under limit
    if (currentSelection.length >= this.maxSlots) {
      // Replace oldest selection with new one
      return [...currentSelection.slice(1), slot];
    }

    return [...currentSelection, slot];
  }

  getSelectionType(): SelectionType {
    return "multi";
  }

  getDescription(): string {
    return `Toggle individual time slots. Select up to ${this.maxSlots} slots. Click a selected slot to deselect it.`;
  }

  isValidSelection(selection: TimeSlot[]): boolean {
    return selection.length > 0 && selection.length <= this.maxSlots;
  }

  getMaxSlots(): number {
    return this.maxSlots;
  }
}

/**
 * Contiguous Multi Selection Strategy
 * Toggle individual slots but enforce they remain contiguous
 */
export class ContiguousMultiSelectionStrategy extends BaseSelectionStrategy {
  private readonly maxDuration: number; // in minutes

  constructor(maxDuration: number = 240) {
    super();
    this.maxDuration = maxDuration;
  }

  select(
    slot: TimeSlot,
    currentSelection: TimeSlot[],
    viewModel: ITimeSlotViewModel
  ): TimeSlot[] {
    if (!this.canSelect(slot, viewModel)) {
      return currentSelection;
    }

    if (currentSelection.length === 0) {
      return [slot];
    }

    const sorted = this.sortSlots(currentSelection);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Check if clicking an already selected slot
    const existingIndex = currentSelection.findIndex((s) => s.equals(slot));
    if (existingIndex >= 0) {
      // Only allow deselection from ends
      if (slot.equals(first) || slot.equals(last)) {
        return currentSelection.filter((s) => !s.equals(slot));
      }
      return currentSelection; // Can't remove from middle
    }

    // Check if slot is adjacent to current selection
    const isBeforeFirst = slot.next().equals(first);
    const isAfterLast = last.next().equals(slot);

    if (!isBeforeFirst && !isAfterLast) {
      // Not adjacent - start new selection
      return [slot];
    }

    // Check duration limit
    const newSelection = [...currentSelection, slot];
    const newRange = this.getSelectionRange(newSelection);
    if (newRange && newRange.getDurationMinutes() > this.maxDuration) {
      return currentSelection; // Would exceed limit
    }

    return newSelection;
  }

  getSelectionType(): SelectionType {
    return "multi";
  }

  getDescription(): string {
    return `Select contiguous time slots up to ${this.maxDuration / 60} hours. Click adjacent slots to extend selection.`;
  }

  isValidSelection(selection: TimeSlot[]): boolean {
    if (selection.length === 0) return false;
    if (!this.isContiguousRange(selection)) return false;

    const range = this.getSelectionRange(selection);
    return range ? range.getDurationMinutes() <= this.maxDuration : false;
  }

  getMaxDuration(): number {
    return this.maxDuration;
  }
}

/**
 * Factory for creating selection strategies
 */
export class SelectionStrategyFactory {
  static createSingle(): ISelectionStrategy {
    return new SingleSelectionStrategy();
  }

  static createRange(): ISelectionStrategy {
    return new RangeSelectionStrategy();
  }

  static createMulti(maxSlots: number = 8): ISelectionStrategy {
    return new MultiSelectionStrategy(maxSlots);
  }

  static createContiguousMulti(maxDuration: number = 240): ISelectionStrategy {
    return new ContiguousMultiSelectionStrategy(maxDuration);
  }

  static createFromType(
    type: SelectionType,
    options?: { maxSlots?: number; maxDuration?: number }
  ): ISelectionStrategy {
    switch (type) {
      case "single":
        return this.createSingle();
      case "range":
        return this.createRange();
      case "multi":
        return options?.maxDuration
          ? this.createContiguousMulti(options.maxDuration)
          : this.createMulti(options?.maxSlots);
      default:
        return this.createRange(); // Default
    }
  }
}


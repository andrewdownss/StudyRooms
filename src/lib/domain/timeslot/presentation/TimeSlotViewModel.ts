/**
 * TimeSlotViewModel
 * 
 * UI-friendly representation of a TimeSlot
 * Separates domain logic from presentation concerns
 * 
 * OOP Principles:
 * - Separation of Concerns: Domain model vs UI representation
 * - Immutability: All modifications return new instances
 * - Read-only Properties: Prevent external mutation
 */

import { TimeSlot } from "../TimeSlot";

/**
 * Interface for TimeSlot view model
 * Defines contract for UI representation
 */
export interface ITimeSlotViewModel {
  readonly slot: TimeSlot;
  readonly displayTime: string;
  readonly displayTimeRange: string;
  readonly isAvailable: boolean;
  readonly isSelected: boolean;
  readonly isInPast: boolean;
  readonly isDisabled: boolean;
  readonly cssClasses: string[];
  readonly metadata?: Record<string, any>;
  withSelection(selected: boolean): ITimeSlotViewModel;
}

/**
 * Concrete implementation of TimeSlot view model
 */
export class TimeSlotViewModel implements ITimeSlotViewModel {
  public readonly slot: TimeSlot;
  public readonly isAvailable: boolean;
  public readonly isSelected: boolean;
  public readonly isInPast: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(
    slot: TimeSlot,
    isAvailable: boolean,
    isSelected: boolean = false,
    isInPast: boolean = false,
    metadata?: Record<string, any>
  ) {
    this.slot = slot;
    this.isAvailable = isAvailable;
    this.isSelected = isSelected;
    this.isInPast = isInPast;
    this.metadata = metadata ? { ...metadata } : undefined;
  }

  // ============================================================================
  // DISPLAY PROPERTIES
  // ============================================================================

  /**
   * Get display time in 24-hour format (HH:MM)
   */
  get displayTime(): string {
    return this.slot.toString();
  }

  /**
   * Get display time in 12-hour format with AM/PM
   */
  get displayTime12Hour(): string {
    return this.slot.toDisplayString();
  }

  /**
   * Get display time range (this slot to next slot)
   * Example: "14:00 - 14:30"
   */
  get displayTimeRange(): string {
    try {
      const end = this.slot.next();
      return `${this.slot.toString()} - ${end.toString()}`;
    } catch {
      return this.slot.toString();
    }
  }

  /**
   * Get 12-hour format time range
   * Example: "2:00 PM - 2:30 PM"
   */
  get displayTimeRange12Hour(): string {
    try {
      const end = this.slot.next();
      return `${this.slot.toDisplayString()} - ${end.toDisplayString()}`;
    } catch {
      return this.slot.toDisplayString();
    }
  }

  /**
   * Check if the slot is disabled (not available or in past)
   */
  get isDisabled(): boolean {
    return !this.isAvailable || this.isInPast;
  }

  /**
   * Get CSS classes for styling
   */
  get cssClasses(): string[] {
    const classes = ["timeslot"];

    if (this.isAvailable) {
      classes.push("available");
    } else {
      classes.push("unavailable");
    }

    if (this.isSelected) {
      classes.push("selected");
    }

    if (this.isInPast) {
      classes.push("past");
    }

    if (this.isDisabled) {
      classes.push("disabled");
    }

    // Add semantic classes
    if (!this.isAvailable && !this.isInPast) {
      classes.push("booked");
    }

    return classes;
  }

  /**
   * Get inline style suggestions for the UI
   */
  get styleHints(): {
    backgroundColor?: string;
    borderColor?: string;
    cursor?: string;
    opacity?: number;
  } {
    if (this.isDisabled) {
      return {
        opacity: 0.5,
        cursor: "not-allowed",
      };
    }

    if (this.isSelected) {
      return {
        backgroundColor: "#4CAF50",
        borderColor: "#45a049",
        cursor: "pointer",
      };
    }

    if (this.isAvailable) {
      return {
        backgroundColor: "#f0f0f0",
        borderColor: "#ddd",
        cursor: "pointer",
      };
    }

    return {
      backgroundColor: "#ffebee",
      borderColor: "#ef5350",
      cursor: "not-allowed",
    };
  }

  // ============================================================================
  // COMMANDS (Return new instances - Immutability)
  // ============================================================================

  /**
   * Create a new view model with updated selection state
   */
  withSelection(selected: boolean): TimeSlotViewModel {
    return new TimeSlotViewModel(
      this.slot,
      this.isAvailable,
      selected,
      this.isInPast,
      this.metadata
    );
  }

  /**
   * Create a new view model with updated availability
   */
  withAvailability(available: boolean): TimeSlotViewModel {
    return new TimeSlotViewModel(
      this.slot,
      available,
      this.isSelected,
      this.isInPast,
      this.metadata
    );
  }

  /**
   * Create a new view model with updated metadata
   */
  withMetadata(metadata: Record<string, any>): TimeSlotViewModel {
    return new TimeSlotViewModel(
      this.slot,
      this.isAvailable,
      this.isSelected,
      this.isInPast,
      { ...this.metadata, ...metadata }
    );
  }

  /**
   * Toggle selection state
   */
  toggleSelection(): TimeSlotViewModel {
    return this.withSelection(!this.isSelected);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if this view model can be selected
   */
  canBeSelected(): boolean {
    return this.isAvailable && !this.isInPast;
  }

  /**
   * Get a tooltip message for the slot
   */
  getTooltip(): string {
    if (this.isInPast) {
      return "This time slot is in the past";
    }
    if (!this.isAvailable) {
      return "This time slot is already booked";
    }
    if (this.isSelected) {
      return `Selected: ${this.displayTimeRange12Hour}`;
    }
    return `Available: ${this.displayTimeRange12Hour}`;
  }

  /**
   * Get accessibility label for screen readers
   */
  getAriaLabel(): string {
    const status = this.isAvailable ? "available" : "booked";
    const selected = this.isSelected ? ", selected" : "";
    const past = this.isInPast ? ", in the past" : "";
    return `${this.displayTimeRange12Hour}, ${status}${selected}${past}`;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): {
    time: string;
    isAvailable: boolean;
    isSelected: boolean;
    isInPast: boolean;
    metadata?: Record<string, any>;
  } {
    return {
      time: this.slot.toString(),
      isAvailable: this.isAvailable,
      isSelected: this.isSelected,
      isInPast: this.isInPast,
      metadata: this.metadata,
    };
  }

  /**
   * Create view model from plain object
   */
  static fromJSON(data: {
    time: string;
    isAvailable: boolean;
    isSelected?: boolean;
    isInPast?: boolean;
    metadata?: Record<string, any>;
  }): TimeSlotViewModel {
    const slot = TimeSlot.fromString(data.time);
    return new TimeSlotViewModel(
      slot,
      data.isAvailable,
      data.isSelected ?? false,
      data.isInPast ?? false,
      data.metadata
    );
  }
}

/**
 * Factory for creating TimeSlotViewModels with common configurations
 */
export class TimeSlotViewModelFactory {
  /**
   * Create an available slot
   */
  static createAvailable(slot: TimeSlot): TimeSlotViewModel {
    return new TimeSlotViewModel(slot, true, false, false);
  }

  /**
   * Create a booked slot
   */
  static createBooked(slot: TimeSlot): TimeSlotViewModel {
    return new TimeSlotViewModel(slot, false, false, false);
  }

  /**
   * Create a past slot
   */
  static createPast(slot: TimeSlot): TimeSlotViewModel {
    return new TimeSlotViewModel(slot, false, false, true);
  }

  /**
   * Create a selected slot
   */
  static createSelected(slot: TimeSlot): TimeSlotViewModel {
    return new TimeSlotViewModel(slot, true, true, false);
  }

  /**
   * Create from slot with dynamic state based on current time and bookings
   */
  static create(
    slot: TimeSlot,
    isBooked: boolean,
    referenceDate: Date
  ): TimeSlotViewModel {
    const isInPast = slot.isInPast(referenceDate);
    const isAvailable = !isBooked && !isInPast;
    return new TimeSlotViewModel(slot, isAvailable, false, isInPast);
  }
}


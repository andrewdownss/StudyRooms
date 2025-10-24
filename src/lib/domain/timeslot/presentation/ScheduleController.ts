/**
 * Schedule Controller
 * 
 * Orchestrates schedule display, selection, and booking
 * Acts as the bridge between UI and domain/service layers
 * 
 * OOP Principles:
 * - Facade Pattern: Simple interface for complex subsystem
 * - Mediator: Coordinates between grid, selection, and booking
 * - Single Responsibility: Manages schedule state and user interactions
 */

import { ValidationError } from "../../../errors";
import { TimeSlot } from "../TimeSlot";
import { TimeRange } from "../TimeRange";
import { IScheduleGrid } from "./IScheduleGrid";
import { ISelectionStrategy } from "./ISelectionStrategy";
import { ITimeSlotViewModel, TimeSlotViewModel } from "./TimeSlotViewModel";
import { RoomCategory, IBooking } from "../../../interfaces/domain";

/**
 * Events that the controller can emit
 */
export interface ScheduleControllerEvents {
  onSelectionChanged?: (selection: TimeSlot[]) => void;
  onBookingCreated?: (booking: IBooking) => void;
  onError?: (error: Error) => void;
}

/**
 * Interface for booking service integration
 */
export interface IScheduleBookingService {
  createBooking(input: {
    userId: string;
    category: RoomCategory;
    date: Date;
    timeRange: TimeRange;
    organizationId?: string;
  }): Promise<IBooking>;
}

/**
 * Controller for managing schedule interactions
 */
export interface IScheduleController {
  // Queries
  getGrid(): IScheduleGrid;
  getSelectedSlots(): TimeSlot[];
  getSelectionStrategy(): ISelectionStrategy;
  canBook(): boolean;
  getSelectionRange(): TimeRange | null;
  getSelectionDuration(): number;
  getSummary(): {
    gridType: string;
    dateRange: { start: Date; end: Date };
    selectionType: string;
    selectedSlots: number;
    selectionDuration: number;
    canBook: boolean;
  };

  // Commands
  handleSlotClick(slot: TimeSlot): void;
  setSelectionStrategy(strategy: ISelectionStrategy): void;
  clearSelection(): void;
  selectSlot(slot: TimeSlot): void;
  deselectSlot(slot: TimeSlot): void;
  selectRange(start: TimeSlot, end: TimeSlot): void;

  // Booking
  createBooking(
    userId: string,
    category: RoomCategory,
    organizationId?: string
  ): Promise<IBooking>;

  // View Models
  getViewModels(): ITimeSlotViewModel[][];
  getViewModel(rowIndex: number, columnIndex: number): ITimeSlotViewModel | null;
}

/**
 * Concrete implementation of schedule controller
 */
export class ScheduleController implements IScheduleController {
  private selectedSlots: TimeSlot[] = [];
  private selectionStrategy: ISelectionStrategy;
  private readonly events: ScheduleControllerEvents;

  constructor(
    private readonly grid: IScheduleGrid,
    private readonly bookingService: IScheduleBookingService,
    selectionStrategy: ISelectionStrategy,
    events?: ScheduleControllerEvents
  ) {
    this.selectionStrategy = selectionStrategy;
    this.events = events || {};
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  getGrid(): IScheduleGrid {
    return this.grid;
  }

  getSelectedSlots(): TimeSlot[] {
    return [...this.selectedSlots];
  }

  getSelectionStrategy(): ISelectionStrategy {
    return this.selectionStrategy;
  }

  /**
   * Check if current selection can be booked
   */
  canBook(): boolean {
    if (this.selectedSlots.length === 0) {
      return false;
    }

    // Validate with strategy
    if (!this.selectionStrategy.isValidSelection(this.selectedSlots)) {
      return false;
    }

    // Check if slots form a valid booking range
    const range = this.getSelectionRange();
    return range !== null && range.isValidBookingDuration();
  }

  /**
   * Get the time range from current selection
   */
  getSelectionRange(): TimeRange | null {
    return this.selectionStrategy.getSelectionRange(this.selectedSlots);
  }

  /**
   * Get total duration of selection in minutes
   */
  getSelectionDuration(): number {
    const range = this.getSelectionRange();
    return range ? range.getDurationMinutes() : 0;
  }

  /**
   * Get all view models as a 2D array matching the grid
   */
  getViewModels(): ITimeSlotViewModel[][] {
    const rows = this.grid.getRows();
    const columns = this.grid.getColumns();
    const viewModels: ITimeSlotViewModel[][] = [];

    for (let r = 0; r < rows.length; r++) {
      const row: ITimeSlotViewModel[] = [];
      for (let c = 0; c < columns.length; c++) {
        const cell = this.grid.getCellAt(r, c);
        if (cell) {
          // Update selection state
          const isSelected = this.isSlotSelected(cell.slot);
          row.push(cell.withSelection(isSelected));
        } else {
          row.push(null as any); // Placeholder for empty cells
        }
      }
      viewModels.push(row);
    }

    return viewModels;
  }

  /**
   * Get view model for a specific cell
   */
  getViewModel(rowIndex: number, columnIndex: number): ITimeSlotViewModel | null {
    const cell = this.grid.getCellAt(rowIndex, columnIndex);
    if (!cell) return null;

    const isSelected = this.isSlotSelected(cell.slot);
    return cell.withSelection(isSelected);
  }

  /**
   * Check if a slot is currently selected
   */
  private isSlotSelected(slot: TimeSlot): boolean {
    return this.selectedSlots.some((s) => s.equals(slot));
  }

  // ============================================================================
  // COMMANDS
  // ============================================================================

  /**
   * Handle a slot click from the UI
   */
  handleSlotClick(slot: TimeSlot): void {
    try {
      // Find the view model for this slot
      const cellInfo = this.grid.findCell(slot);
      if (!cellInfo || !cellInfo.cell) {
        return;
      }

      const viewModel = cellInfo.cell;

      // Use strategy to determine new selection
      if (this.selectionStrategy.canSelect(slot, viewModel)) {
        const newSelection = this.selectionStrategy.select(
          slot,
          this.selectedSlots,
          viewModel
        );

        this.selectedSlots = newSelection;
        this.emitSelectionChanged();
      }
    } catch (error) {
      this.emitError(
        error instanceof Error ? error : new Error("Unknown error")
      );
    }
  }

  /**
   * Set a new selection strategy
   */
  setSelectionStrategy(strategy: ISelectionStrategy): void {
    this.selectionStrategy = strategy;
    this.clearSelection();
  }

  /**
   * Clear all selected slots
   */
  clearSelection(): void {
    this.selectedSlots = [];
    this.emitSelectionChanged();
  }

  /**
   * Manually select a specific slot
   */
  selectSlot(slot: TimeSlot): void {
    const cellInfo = this.grid.findCell(slot);
    if (!cellInfo || !cellInfo.cell) {
      throw new ValidationError("Slot not found in grid");
    }

    const viewModel = cellInfo.cell;
    if (!this.selectionStrategy.canSelect(slot, viewModel)) {
      throw new ValidationError("Slot cannot be selected");
    }

    const newSelection = this.selectionStrategy.select(
      slot,
      this.selectedSlots,
      viewModel
    );

    this.selectedSlots = newSelection;
    this.emitSelectionChanged();
  }

  /**
   * Manually deselect a specific slot
   */
  deselectSlot(slot: TimeSlot): void {
    this.selectedSlots = this.selectedSlots.filter((s) => !s.equals(slot));
    this.emitSelectionChanged();
  }

  /**
   * Select a range of slots
   */
  selectRange(start: TimeSlot, end: TimeSlot): void {
    try {
      const range = start.isBefore(end)
        ? TimeRange.fromSlots(start, end.next())
        : TimeRange.fromSlots(end, start.next());

      this.selectedSlots = range.getAllSlots();
      this.emitSelectionChanged();
    } catch (error) {
      this.emitError(
        error instanceof Error ? error : new Error("Invalid range")
      );
    }
  }

  // ============================================================================
  // BOOKING
  // ============================================================================

  /**
   * Create a booking from current selection
   */
  async createBooking(
    userId: string,
    category: RoomCategory,
    organizationId?: string
  ): Promise<IBooking> {
    if (!this.canBook()) {
      throw new ValidationError("Invalid selection for booking");
    }

    const timeRange = this.getSelectionRange();
    if (!timeRange) {
      throw new ValidationError("Cannot create time range from selection");
    }

    const dateRange = this.grid.getDateRange();

    try {
      const booking = await this.bookingService.createBooking({
        userId,
        category,
        date: dateRange.start,
        timeRange,
        organizationId,
      });

      this.emitBookingCreated(booking);
      this.clearSelection();

      return booking;
    } catch (error) {
      this.emitError(
        error instanceof Error ? error : new Error("Booking failed")
      );
      throw error;
    }
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  private emitSelectionChanged(): void {
    this.events.onSelectionChanged?.(this.getSelectedSlots());
  }

  private emitBookingCreated(booking: IBooking): void {
    this.events.onBookingCreated?.(booking);
  }

  private emitError(error: Error): void {
    this.events.onError?.(error);
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Get a summary of the current state
   */
  getSummary(): {
    gridType: string;
    dateRange: { start: Date; end: Date };
    selectionType: string;
    selectedSlots: number;
    selectionDuration: number;
    canBook: boolean;
  } {
    return {
      gridType: this.grid.getGridType(),
      dateRange: this.grid.getDateRange(),
      selectionType: this.selectionStrategy.getSelectionType(),
      selectedSlots: this.selectedSlots.length,
      selectionDuration: this.getSelectionDuration(),
      canBook: this.canBook(),
    };
  }

  /**
   * Export current state for persistence
   */
  exportState(): {
    selectedSlots: string[];
    selectionType: string;
  } {
    return {
      selectedSlots: this.selectedSlots.map((s) => s.toString()),
      selectionType: this.selectionStrategy.getSelectionType(),
    };
  }

  /**
   * Restore state from exported data
   */
  restoreState(state: { selectedSlots: string[] }): void {
    try {
      this.selectedSlots = state.selectedSlots.map((s) =>
        TimeSlot.fromString(s)
      );
      this.emitSelectionChanged();
    } catch (error) {
      this.emitError(
        error instanceof Error ? error : new Error("Failed to restore state")
      );
    }
  }
}

/**
 * Factory for creating schedule controllers
 */
export class ScheduleControllerFactory {
  static create(
    grid: IScheduleGrid,
    bookingService: IScheduleBookingService,
    selectionStrategy: ISelectionStrategy,
    events?: ScheduleControllerEvents
  ): IScheduleController {
    return new ScheduleController(grid, bookingService, selectionStrategy, events);
  }

  static createWithDefaults(
    grid: IScheduleGrid,
    bookingService: IScheduleBookingService,
    events?: ScheduleControllerEvents
  ): IScheduleController {
    // Import selection strategy
    const { RangeSelectionStrategy } = require("./ISelectionStrategy");
    const strategy = new RangeSelectionStrategy();
    return new ScheduleController(grid, bookingService, strategy, events);
  }
}


/**
 * Schedule Grid Interface
 * 
 * Abstract interface for different schedule layouts
 * Supports multiple visualization styles: day view, week view, room view
 * 
 * OOP Principles:
 * - Polymorphism: Different layouts implement same interface
 * - Strategy Pattern: Layout algorithm is interchangeable
 * - Separation of Concerns: Grid structure vs cell content
 */

import { ITimeSlotViewModel } from "./TimeSlotViewModel";
import { TimeSlot } from "../TimeSlot";
import { IRoom } from "../../../interfaces/domain";

/**
 * Represents a row in the schedule grid
 */
export interface ScheduleRow {
  id: string;
  label: string;
  timeSlot?: TimeSlot; // For time-based rows
  room?: IRoom; // For room-based rows
  metadata?: Record<string, any>;
}

/**
 * Represents a column in the schedule grid
 */
export interface ScheduleColumn {
  id: string;
  label: string;
  shortLabel?: string;
  date?: Date; // For date-based columns
  timeSlot?: TimeSlot; // For time-based columns
  metadata?: Record<string, any>;
}

/**
 * Base interface for all schedule grid layouts
 */
export interface IScheduleGrid {
  /**
   * Get all rows in the grid
   */
  getRows(): ScheduleRow[];

  /**
   * Get all columns in the grid
   */
  getColumns(): ScheduleColumn[];

  /**
   * Get the cell at a specific row/column intersection
   * Returns null if cell is not applicable
   */
  getCellAt(rowIndex: number, columnIndex: number): ITimeSlotViewModel | null;

  /**
   * Get the date range this grid covers
   */
  getDateRange(): { start: Date; end: Date };

  /**
   * Get the type of grid layout
   */
  getGridType(): "day" | "week" | "month" | "room" | "custom";

  /**
   * Get total number of cells (rows * columns)
   */
  getCellCount(): number;

  /**
   * Find cell by time slot and date
   */
  findCell(slot: TimeSlot, date?: Date): {
    row: number;
    column: number;
    cell: ITimeSlotViewModel | null;
  } | null;
}

/**
 * Abstract base class for schedule grids
 */
export abstract class BaseScheduleGrid implements IScheduleGrid {
  abstract getRows(): ScheduleRow[];
  abstract getColumns(): ScheduleColumn[];
  abstract getCellAt(rowIndex: number, columnIndex: number): ITimeSlotViewModel | null;
  abstract getDateRange(): { start: Date; end: Date };
  abstract getGridType(): "day" | "week" | "month" | "room" | "custom";

  getCellCount(): number {
    return this.getRows().length * this.getColumns().length;
  }

  findCell(
    slot: TimeSlot,
    date?: Date
  ): { row: number; column: number; cell: ITimeSlotViewModel | null } | null {
    const rows = this.getRows();
    const columns = this.getColumns();

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < columns.length; c++) {
        const cell = this.getCellAt(r, c);
        if (!cell) continue;

        // Check if slot matches
        if (!cell.slot.equals(slot)) continue;

        // Check date if provided
        if (date) {
          const column = columns[c];
          if (column.date) {
            const columnDate = new Date(column.date);
            columnDate.setHours(0, 0, 0, 0);
            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);
            if (columnDate.getTime() !== searchDate.getTime()) continue;
          }
        }

        return { row: r, column: c, cell };
      }
    }

    return null;
  }
}

/**
 * Day Schedule Grid
 * Rows: Time slots
 * Columns: Single day
 */
export class DayScheduleGrid extends BaseScheduleGrid {
  constructor(
    private readonly date: Date,
    private readonly slots: ITimeSlotViewModel[],
    private readonly startHour: number = 8,
    private readonly endHour: number = 22
  ) {
    super();
    // Normalize date
    this.date = new Date(date);
    this.date.setHours(0, 0, 0, 0);
  }

  getRows(): ScheduleRow[] {
    return this.slots.map((vm) => ({
      id: `slot-${vm.slot.toString()}`,
      label: vm.displayTimeRange,
      timeSlot: vm.slot,
      metadata: { viewModel: vm },
    }));
  }

  getColumns(): ScheduleColumn[] {
    return [
      {
        id: `date-${this.date.toISOString()}`,
        label: this.date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        shortLabel: this.date.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric" 
        }),
        date: new Date(this.date),
      },
    ];
  }

  getCellAt(rowIndex: number, _columnIndex: number): ITimeSlotViewModel | null {
    return this.slots[rowIndex] || null;
  }

  getDateRange(): { start: Date; end: Date } {
    return { start: new Date(this.date), end: new Date(this.date) };
  }

  getGridType(): "day" {
    return "day";
  }

  getDate(): Date {
    return new Date(this.date);
  }

  getTimeSlots(): ITimeSlotViewModel[] {
    return [...this.slots];
  }
}

/**
 * Week Schedule Grid
 * Rows: Time slots
 * Columns: Days of the week
 */
export class WeekScheduleGrid extends BaseScheduleGrid {
  constructor(
    private readonly weekStart: Date,
    private readonly slotsByDay: Map<string, ITimeSlotViewModel[]>,
    private readonly startHour: number = 8,
    private readonly endHour: number = 22
  ) {
    super();
    // Normalize to start of week
    this.weekStart = new Date(weekStart);
    this.weekStart.setHours(0, 0, 0, 0);
  }

  getRows(): ScheduleRow[] {
    // Get time slots from first day as template
    const firstDay = this.slotsByDay.values().next().value || [];
    return firstDay.map((vm) => ({
      id: `slot-${vm.slot.toString()}`,
      label: vm.displayTimeRange,
      timeSlot: vm.slot,
    }));
  }

  getColumns(): ScheduleColumn[] {
    const columns: ScheduleColumn[] = [];
    const currentDate = new Date(this.weekStart);

    for (let i = 0; i < 7; i++) {
      columns.push({
        id: `day-${currentDate.toISOString()}`,
        label: currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        shortLabel: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
        date: new Date(currentDate),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return columns;
  }

  getCellAt(rowIndex: number, columnIndex: number): ITimeSlotViewModel | null {
    const columns = this.getColumns();
    const column = columns[columnIndex];
    if (!column.date) return null;

    const dayKey = this.getDayKey(column.date);
    const slots = this.slotsByDay.get(dayKey) || [];
    return slots[rowIndex] || null;
  }

  getDateRange(): { start: Date; end: Date } {
    const end = new Date(this.weekStart);
    end.setDate(end.getDate() + 6);
    return { start: new Date(this.weekStart), end };
  }

  getGridType(): "week" {
    return "week";
  }

  private getDayKey(date: Date): string {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString().split("T")[0];
  }
}

/**
 * Room Schedule Grid
 * Rows: Rooms
 * Columns: Time slots
 */
export class RoomScheduleGrid extends BaseScheduleGrid {
  constructor(
    private readonly date: Date,
    private readonly roomSlots: Map<string, ITimeSlotViewModel[]>,
    private readonly rooms: IRoom[]
  ) {
    super();
    this.date = new Date(date);
    this.date.setHours(0, 0, 0, 0);
  }

  getRows(): ScheduleRow[] {
    return this.rooms.map((room) => ({
      id: `room-${room.id}`,
      label: `${room.name} (${room.category})`,
      room,
      metadata: { capacity: room.capacity, category: room.category },
    }));
  }

  getColumns(): ScheduleColumn[] {
    // Get time slots from first room as template
    const firstRoomSlots = this.roomSlots.values().next().value || [];
    return firstRoomSlots.map((vm) => ({
      id: `slot-${vm.slot.toString()}`,
      label: vm.displayTime12Hour,
      shortLabel: vm.displayTime,
      timeSlot: vm.slot,
    }));
  }

  getCellAt(rowIndex: number, columnIndex: number): ITimeSlotViewModel | null {
    const room = this.rooms[rowIndex];
    if (!room) return null;

    const slots = this.roomSlots.get(room.id) || [];
    return slots[columnIndex] || null;
  }

  getDateRange(): { start: Date; end: Date } {
    return { start: new Date(this.date), end: new Date(this.date) };
  }

  getGridType(): "room" {
    return "room";
  }

  getDate(): Date {
    return new Date(this.date);
  }

  getRooms(): IRoom[] {
    return [...this.rooms];
  }
}

/**
 * Compact Day Grid (for mobile/small screens)
 * Shows only available slots in a list format
 */
export class CompactDayGrid extends BaseScheduleGrid {
  constructor(
    private readonly date: Date,
    private readonly availableSlots: ITimeSlotViewModel[]
  ) {
    super();
    this.date = new Date(date);
    this.date.setHours(0, 0, 0, 0);
  }

  getRows(): ScheduleRow[] {
    return this.availableSlots.map((vm, index) => ({
      id: `available-${index}`,
      label: vm.displayTimeRange,
      timeSlot: vm.slot,
      metadata: { viewModel: vm },
    }));
  }

  getColumns(): ScheduleColumn[] {
    return [
      {
        id: "availability",
        label: "Available Times",
        date: new Date(this.date),
      },
    ];
  }

  getCellAt(rowIndex: number, _columnIndex: number): ITimeSlotViewModel | null {
    return this.availableSlots[rowIndex] || null;
  }

  getDateRange(): { start: Date; end: Date } {
    return { start: new Date(this.date), end: new Date(this.date) };
  }

  getGridType(): "custom" {
    return "custom";
  }
}

/**
 * Factory for creating schedule grids
 */
export class ScheduleGridFactory {
  static createDayGrid(
    date: Date,
    slots: ITimeSlotViewModel[],
    options?: { startHour?: number; endHour?: number }
  ): DayScheduleGrid {
    return new DayScheduleGrid(
      date,
      slots,
      options?.startHour ?? 8,
      options?.endHour ?? 22
    );
  }

  static createWeekGrid(
    weekStart: Date,
    slotsByDay: Map<string, ITimeSlotViewModel[]>,
    options?: { startHour?: number; endHour?: number }
  ): WeekScheduleGrid {
    return new WeekScheduleGrid(
      weekStart,
      slotsByDay,
      options?.startHour ?? 8,
      options?.endHour ?? 22
    );
  }

  static createRoomGrid(
    date: Date,
    roomSlots: Map<string, ITimeSlotViewModel[]>,
    rooms: IRoom[]
  ): RoomScheduleGrid {
    return new RoomScheduleGrid(date, roomSlots, rooms);
  }

  static createCompactGrid(
    date: Date,
    availableSlots: ITimeSlotViewModel[]
  ): CompactDayGrid {
    return new CompactDayGrid(date, availableSlots);
  }
}


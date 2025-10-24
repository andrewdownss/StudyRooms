/**
 * Schedule Factory
 * 
 * Factory for creating schedule controllers with different configurations
 * Simplifies the complex initialization of schedule components
 * 
 * OOP Principles:
 * - Factory Pattern: Encapsulates object creation complexity
 * - Dependency Injection: Services injected at construction
 * - Builder Pattern elements: Fluent configuration interface
 */

import { IScheduleController, ScheduleController, ScheduleControllerEvents, IScheduleBookingService } from "./ScheduleController";
import { IScheduleGrid, DayScheduleGrid, WeekScheduleGrid, RoomScheduleGrid, CompactDayGrid } from "./IScheduleGrid";
import { ISelectionStrategy, SelectionStrategyFactory, SelectionType } from "./ISelectionStrategy";
import { TimeSlotViewModel, TimeSlotViewModelFactory } from "./TimeSlotViewModel";
import { TimeSlot } from "../TimeSlot";
import { DailySchedule } from "../DailySchedule";
import { TimeRange } from "../TimeRange";
import { RoomCategory, IRoom } from "../../../interfaces/domain";
import { IRoomRepository, IBookingRepository } from "../../../interfaces/repositories";

/**
 * Configuration options for schedule factory
 */
export interface ScheduleFactoryOptions {
  startHour?: number;
  endHour?: number;
  selectionMode?: SelectionType;
  maxSlots?: number;
  maxDuration?: number;
  events?: ScheduleControllerEvents;
}

/**
 * Factory for creating fully configured schedule controllers
 */
export class ScheduleFactory {
  constructor(
    private readonly bookingService: IScheduleBookingService,
    private readonly roomRepository: IRoomRepository,
    private readonly bookingRepository: IBookingRepository
  ) {}

  // ============================================================================
  // DAY VIEW
  // ============================================================================

  /**
   * Create a day view controller
   * Shows all time slots for a single day
   */
  async createDayView(
    date: Date,
    category: RoomCategory,
    options?: ScheduleFactoryOptions
  ): Promise<IScheduleController> {
    const startHour = options?.startHour ?? 8;
    const endHour = options?.endHour ?? 22;

    // Build availability for the day
    const viewModels = await this.buildDayAvailability(
      date,
      category,
      startHour,
      endHour
    );

    // Create grid
    const grid: IScheduleGrid = new DayScheduleGrid(
      date,
      viewModels,
      startHour,
      endHour
    );

    // Create selection strategy
    const strategy = this.createSelectionStrategy(options);

    // Create controller
    return new ScheduleController(
      grid,
      this.bookingService,
      strategy,
      options?.events
    );
  }

  /**
   * Create a compact day view (mobile-friendly)
   * Shows only available slots in a list
   */
  async createCompactDayView(
    date: Date,
    category: RoomCategory,
    options?: ScheduleFactoryOptions
  ): Promise<IScheduleController> {
    const startHour = options?.startHour ?? 8;
    const endHour = options?.endHour ?? 22;

    // Get only available slots
    const viewModels = await this.buildDayAvailability(
      date,
      category,
      startHour,
      endHour
    );

    const availableSlots = viewModels.filter((vm) => vm.isAvailable);

    // Create compact grid
    const grid: IScheduleGrid = new CompactDayGrid(date, availableSlots);

    // Create selection strategy (single selection for compact view)
    const strategy = SelectionStrategyFactory.createSingle();

    // Create controller
    return new ScheduleController(
      grid,
      this.bookingService,
      strategy,
      options?.events
    );
  }

  // ============================================================================
  // WEEK VIEW
  // ============================================================================

  /**
   * Create a week view controller
   * Shows all time slots for 7 days
   */
  async createWeekView(
    weekStart: Date,
    category: RoomCategory,
    options?: ScheduleFactoryOptions
  ): Promise<IScheduleController> {
    const startHour = options?.startHour ?? 8;
    const endHour = options?.endHour ?? 22;

    // Build availability for each day of the week
    const slotsByDay = new Map<string, TimeSlotViewModel[]>();
    const currentDate = new Date(weekStart);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const viewModels = await this.buildDayAvailability(
        currentDate,
        category,
        startHour,
        endHour
      );

      const dayKey = currentDate.toISOString().split("T")[0];
      slotsByDay.set(dayKey, viewModels);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create grid
    const grid: IScheduleGrid = new WeekScheduleGrid(
      weekStart,
      slotsByDay,
      startHour,
      endHour
    );

    // Single selection for week view (select one slot across the week)
    const strategy = SelectionStrategyFactory.createSingle();

    // Create controller
    return new ScheduleController(
      grid,
      this.bookingService,
      strategy,
      options?.events
    );
  }

  // ============================================================================
  // ROOM VIEW
  // ============================================================================

  /**
   * Create a room view controller
   * Shows all rooms with their time slot availability
   */
  async createRoomView(
    date: Date,
    category: RoomCategory,
    options?: ScheduleFactoryOptions
  ): Promise<IScheduleController> {
    const startHour = options?.startHour ?? 8;
    const endHour = options?.endHour ?? 22;

    // Get all rooms for the category
    const rooms = await this.roomRepository.findByCategory(category);

    // Build availability for each room
    const roomSlots = new Map<string, TimeSlotViewModel[]>();

    for (const room of rooms) {
      const schedule = await this.buildRoomSchedule(room.id, date);
      const viewModels = this.createViewModelsForSchedule(
        schedule,
        date,
        startHour,
        endHour
      );
      roomSlots.set(room.id, viewModels);
    }

    // Create grid
    const grid: IScheduleGrid = new RoomScheduleGrid(date, roomSlots, rooms);

    // Single selection for room view
    const strategy = SelectionStrategyFactory.createSingle();

    // Create controller
    return new ScheduleController(
      grid,
      this.bookingService,
      strategy,
      options?.events
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Build availability view models for a day
   */
  private async buildDayAvailability(
    date: Date,
    category: RoomCategory,
    startHour: number,
    endHour: number
  ): Promise<TimeSlotViewModel[]> {
    // Get all rooms of this category
    const rooms = await this.roomRepository.findByCategory(category);

    // Build combined schedule for all rooms
    const availableSlots = new Set<string>();

    for (const room of rooms) {
      const schedule = await this.buildRoomSchedule(room.id, date);
      const available = schedule.getAvailableSlots();
      available.forEach((slot) => availableSlots.add(slot.toString()));
    }

    // Create view models for all time slots in operating hours
    const viewModels: TimeSlotViewModel[] = [];
    let current = TimeSlot.fromTime(startHour, 0);
    const end = TimeSlot.fromTime(endHour, 0);

    while (current.isBefore(end)) {
      const isAvailable = availableSlots.has(current.toString());
      const isInPast = current.isInPast(date);

      viewModels.push(
        TimeSlotViewModelFactory.create(current, !isAvailable, date)
      );

      try {
        current = current.next();
      } catch {
        break;
      }
    }

    return viewModels;
  }

  /**
   * Build daily schedule for a specific room
   */
  private async buildRoomSchedule(
    roomId: string,
    date: Date
  ): Promise<DailySchedule> {
    const bookings = await this.bookingRepository.findByRoom(roomId, date);

    const bookedRanges = bookings
      .filter((b) => b.status === "confirmed")
      .map((b) => TimeRange.fromLegacy(b.startTime, b.duration));

    return new DailySchedule(date, bookedRanges);
  }

  /**
   * Create view models from a daily schedule
   */
  private createViewModelsForSchedule(
    schedule: DailySchedule,
    date: Date,
    startHour: number,
    endHour: number
  ): TimeSlotViewModel[] {
    const viewModels: TimeSlotViewModel[] = [];
    const availableSlots = schedule.getAvailableSlots();
    const availableSet = new Set(availableSlots.map((s) => s.toString()));

    let current = TimeSlot.fromTime(startHour, 0);
    const end = TimeSlot.fromTime(endHour, 0);

    while (current.isBefore(end)) {
      const isAvailable = availableSet.has(current.toString());
      const isInPast = current.isInPast(date);

      viewModels.push(
        new TimeSlotViewModel(current, isAvailable, false, isInPast)
      );

      try {
        current = current.next();
      } catch {
        break;
      }
    }

    return viewModels;
  }

  /**
   * Create selection strategy from options
   */
  private createSelectionStrategy(
    options?: ScheduleFactoryOptions
  ): ISelectionStrategy {
    const mode = options?.selectionMode ?? "range";

    return SelectionStrategyFactory.createFromType(mode, {
      maxSlots: options?.maxSlots,
      maxDuration: options?.maxDuration,
    });
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Create day view for today
   */
  async createTodayView(
    category: RoomCategory,
    options?: ScheduleFactoryOptions
  ): Promise<IScheduleController> {
    return this.createDayView(new Date(), category, options);
  }

  /**
   * Create week view for current week
   */
  async createCurrentWeekView(
    category: RoomCategory,
    options?: ScheduleFactoryOptions
  ): Promise<IScheduleController> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek); // Start on Sunday
    weekStart.setHours(0, 0, 0, 0);

    return this.createWeekView(weekStart, category, options);
  }

  /**
   * Create room view for today
   */
  async createTodayRoomView(
    category: RoomCategory,
    options?: ScheduleFactoryOptions
  ): Promise<IScheduleController> {
    return this.createRoomView(new Date(), category, options);
  }
}

/**
 * Builder for ScheduleFactory configuration
 * Provides fluent interface for complex setups
 */
export class ScheduleFactoryBuilder {
  private bookingService?: IScheduleBookingService;
  private roomRepository?: IRoomRepository;
  private bookingRepository?: IBookingRepository;

  withBookingService(service: IScheduleBookingService): this {
    this.bookingService = service;
    return this;
  }

  withRoomRepository(repository: IRoomRepository): this {
    this.roomRepository = repository;
    return this;
  }

  withBookingRepository(repository: IBookingRepository): this {
    this.bookingRepository = repository;
    return this;
  }

  build(): ScheduleFactory {
    if (!this.bookingService || !this.roomRepository || !this.bookingRepository) {
      throw new Error(
        "ScheduleFactory requires bookingService, roomRepository, and bookingRepository"
      );
    }

    return new ScheduleFactory(
      this.bookingService,
      this.roomRepository,
      this.bookingRepository
    );
  }
}


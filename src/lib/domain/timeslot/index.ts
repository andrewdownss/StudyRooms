/**
 * TimeSlot Domain Module Exports
 * 
 * Central export point for all timeslot-related domain objects
 */

// Core Value Objects
export { TimeSlot } from "./TimeSlot";
export { TimeRange } from "./TimeRange";
export { DailySchedule } from "./DailySchedule";

// Presentation Layer
export {
  TimeSlotViewModel,
  TimeSlotViewModelFactory,
} from "./presentation/TimeSlotViewModel";

export type {
  ITimeSlotViewModel,
} from "./presentation/TimeSlotViewModel";

export {
  BaseSelectionStrategy,
  SingleSelectionStrategy,
  RangeSelectionStrategy,
  MultiSelectionStrategy,
  ContiguousMultiSelectionStrategy,
  SelectionStrategyFactory,
} from "./presentation/ISelectionStrategy";

export type {
  ISelectionStrategy,
  SelectionType,
} from "./presentation/ISelectionStrategy";

export {
  BaseScheduleGrid,
  DayScheduleGrid,
  WeekScheduleGrid,
  RoomScheduleGrid,
  CompactDayGrid,
  ScheduleGridFactory,
} from "./presentation/IScheduleGrid";

export type {
  IScheduleGrid,
  ScheduleRow,
  ScheduleColumn,
} from "./presentation/IScheduleGrid";

export {
  ScheduleController,
  ScheduleControllerFactory,
} from "./presentation/ScheduleController";

export type {
  IScheduleController,
  ScheduleControllerEvents,
  IScheduleBookingService,
} from "./presentation/ScheduleController";

export {
  ScheduleFactory,
  ScheduleFactoryBuilder,
} from "./presentation/ScheduleFactory";

export type {
  ScheduleFactoryOptions,
} from "./presentation/ScheduleFactory";


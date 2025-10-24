# TimeSlot Booking System

A complete parallel booking system implementation using object-oriented design principles and domain-driven design patterns.

## Overview

This is a **separate, parallel implementation** of the booking system that runs alongside the existing legacy system. It introduces a robust TimeSlot-based architecture with:

- **Immutable Value Objects**: TimeSlot and TimeRange
- **Rich Domain Models**: DailySchedule with business logic
- **Polymorphic Strategies**: Multiple selection behaviors
- **Flexible Views**: Day, Week, and Room grid layouts
- **Type Safety**: Full TypeScript with proper abstractions

## Architecture

```
src/lib/domain/timeslot/
├── TimeSlot.ts              # 30-minute time slot value object
├── TimeRange.ts             # Time interval value object
├── DailySchedule.ts         # Availability management
├── presentation/            # UI/Presentation Layer
│   ├── TimeSlotViewModel.ts      # UI-friendly slot representation
│   ├── ISelectionStrategy.ts     # Polymorphic selection behaviors
│   ├── IScheduleGrid.ts          # Polymorphic grid layouts
│   ├── ScheduleController.ts     # Orchestration & event handling
│   └── ScheduleFactory.ts        # Easy instantiation
└── __tests__/              # Comprehensive test suite

src/lib/services/timeslot/
└── TimeSlotBookingService.ts     # Booking logic with legacy comparison
```

## Core Concepts

### 1. TimeSlot (Value Object)

Represents a 30-minute booking block with immutability:

```typescript
// Create time slots
const slot = TimeSlot.fromTime(14, 0);        // 2:00 PM
const slot2 = TimeSlot.fromString("14:30");   // 2:30 PM

// Navigate
const next = slot.next();                     // 2:30 PM
const prev = slot.previous();                 // 1:30 PM
const future = slot.addSlots(4);              // 4:00 PM

// Compare
slot.isBefore(slot2);                         // true
slot.equals(TimeSlot.fromTime(14, 0));        // true

// Display
slot.toString();                              // "14:00"
slot.toDisplayString();                       // "2:00 PM"
```

### 2. TimeRange (Value Object)

Represents a continuous time interval:

```typescript
// Create ranges
const range = TimeRange.fromStartAndDuration(
  TimeSlot.fromTime(14, 0),
  90  // 90 minutes
);

// Or from legacy format
const range2 = TimeRange.fromLegacy("14:00", 90);

// Query
range.getDurationMinutes();                   // 90
range.getAllSlots();                          // [14:00, 14:30, 15:00]

// Check relationships
range1.overlapsWith(range2);                  // boolean
range1.contains(slot);                        // boolean

// Transform (returns new instance)
const extended = range.extend(30);            // Add 30 minutes
const shifted = range.shift(60);              // Move forward 1 hour
```

### 3. DailySchedule (Domain Model)

Manages bookings for one room on one day:

```typescript
const bookings = [
  TimeRange.fromLegacy("14:00", 60),
  TimeRange.fromLegacy("16:00", 90)
];

const schedule = new DailySchedule(
  new Date("2025-10-25"),
  bookings,
  { start: 8, end: 22 }  // Operating hours
);

// Check availability
const available = schedule.isAvailable(
  TimeRange.fromLegacy("15:00", 60)
);

// Get available slots
const slots = schedule.getAvailableSlots();
const slotsFor90Min = schedule.getAvailableSlotsForDuration(90);

// Statistics
schedule.getTotalBookedMinutes();
schedule.getUtilizationPercentage();

// Immutable updates
const updated = schedule.addBooking(newRange);
```

## UI Integration

### Selection Strategies (Polymorphic)

Choose how users select time slots:

```typescript
import { SelectionStrategyFactory } from './domain/timeslot';

// Single slot selection
const single = SelectionStrategyFactory.createSingle();

// Range selection (click start, click end)
const range = SelectionStrategyFactory.createRange();

// Multi-select with limit
const multi = SelectionStrategyFactory.createMulti(8);

// Contiguous multi-select
const contiguous = SelectionStrategyFactory.createContiguousMulti(120);
```

### Grid Layouts (Polymorphic)

Different visualizations for different use cases:

```typescript
import { ScheduleFactory } from './domain/timeslot';

// Day view (vertical time slots)
const dayController = await factory.createDayView(
  new Date(),
  'small',
  { selectionMode: 'range' }
);

// Week view (7 days horizontal)
const weekController = await factory.createWeekView(
  weekStart,
  'small'
);

// Room view (rooms vs time slots)
const roomController = await factory.createRoomView(
  new Date(),
  'large'
);

// Compact view (mobile-friendly list)
const compactController = await factory.createCompactDayView(
  new Date(),
  'small'
);
```

### Schedule Controller

Central orchestrator for all interactions:

```typescript
// Get the grid
const grid = controller.getGrid();
const rows = grid.getRows();
const columns = grid.getColumns();

// Handle user interactions
controller.handleSlotClick(slot);
controller.clearSelection();

// Query state
const selected = controller.getSelectedSlots();
const canBook = controller.canBook();
const duration = controller.getSelectionDuration();

// Create booking
const booking = await controller.createBooking(
  userId,
  'small',
  organizationId
);

// Listen to events
const controller = new ScheduleController(grid, service, strategy, {
  onSelectionChanged: (slots) => console.log('Selected:', slots),
  onBookingCreated: (booking) => console.log('Created:', booking),
  onError: (error) => console.error('Error:', error)
});
```

## Usage Example

### Complete Integration

```typescript
import {
  ScheduleFactory,
  ScheduleFactoryBuilder,
  SelectionStrategyFactory
} from '@/lib/domain/timeslot';
import { TimeSlotBookingService } from '@/lib/services/timeslot';
import { container } from '@/lib/container';

// 1. Setup services
const bookingRepo = container.bookingRepository;
const roomRepo = container.roomRepository;
const userRepo = container.userRepository;

const bookingService = new TimeSlotBookingService(
  bookingRepo,
  roomRepo,
  userRepo,
  legacyBookingService  // Optional for comparison
);

// 2. Create factory
const factory = new ScheduleFactoryBuilder()
  .withBookingService(bookingService)
  .withRoomRepository(roomRepo)
  .withBookingRepository(bookingRepo)
  .build();

// 3. Create a controller
const controller = await factory.createDayView(
  new Date(),
  'small',
  {
    selectionMode: 'range',
    startHour: 8,
    endHour: 22,
    events: {
      onSelectionChanged: (slots) => setSelectedSlots(slots),
      onBookingCreated: (booking) => router.push('/bookings'),
      onError: (error) => showError(error.message)
    }
  }
);

// 4. Render grid
const grid = controller.getGrid();
const viewModels = controller.getViewModels();

return (
  <div className="schedule-grid">
    {viewModels.map((row, rowIdx) => (
      <div key={rowIdx} className="row">
        {row.map((cell, colIdx) => (
          cell && (
            <div
              key={colIdx}
              className={cell.cssClasses.join(' ')}
              onClick={() => controller.handleSlotClick(cell.slot)}
              aria-label={cell.getAriaLabel()}
            >
              {cell.displayTime}
            </div>
          )
        ))}
      </div>
    ))}
    <button
      disabled={!controller.canBook()}
      onClick={() => controller.createBooking(userId, 'small')}
    >
      Book ({controller.getSelectionDuration()} minutes)
    </button>
  </div>
);
```

## OOP Design Principles Applied

### 1. **Encapsulation**
- Private constructors force use of factory methods
- Internal time representation hidden
- Complex logic wrapped in simple interfaces

### 2. **Immutability**
- All value objects return new instances
- No setters, only transformations
- Thread-safe by design

### 3. **Polymorphism**
- ISelectionStrategy: 4+ different implementations
- IScheduleGrid: Day, Week, Room, Compact views
- Strategies interchangeable at runtime

### 4. **Single Responsibility**
- TimeSlot: Time representation only
- DailySchedule: Availability management only
- Controller: User interaction orchestration only

### 5. **Open/Closed Principle**
- Easy to add new selection strategies
- Easy to add new grid layouts
- No modification of existing code required

### 6. **Dependency Inversion**
- Services depend on interfaces
- High-level policy independent of details
- Easy to mock for testing

### 7. **Factory Pattern**
- Complex object creation simplified
- Sensible defaults provided
- Builder for advanced configurations

### 8. **Strategy Pattern**
- Selection behavior pluggable
- Grid layout pluggable
- Runtime switching supported

## Testing

Comprehensive test suite included:

```bash
# Run tests
npm test src/lib/domain/timeslot

# Run specific test file
npm test TimeSlot.test.ts

# Watch mode
npm test -- --watch
```

Tests cover:
- ✅ Value object creation and validation
- ✅ Immutability guarantees
- ✅ Time arithmetic and comparisons
- ✅ Availability checking
- ✅ Conflict detection
- ✅ Selection strategies
- ✅ Grid layouts
- ✅ Edge cases and error conditions

## Comparison with Legacy System

The TimeSlotBookingService includes methods to validate against the legacy system:

```typescript
const result = await timeSlotService.validateAgainstLegacy({
  userId: 'user-123',
  category: 'small',
  date: new Date('2025-10-25'),
  timeRange: TimeRange.fromLegacy('14:00', 60)
});

console.log(result);
// {
//   match: true,
//   timeSlotResult: true,
//   legacyResult: true,
//   differences: undefined,
//   timestamp: Date
// }
```

## Migration Path

This system is designed for gradual adoption:

1. **Phase 1** (Current): Parallel operation with legacy system
2. **Phase 2**: A/B testing in production
3. **Phase 3**: Gradual migration of features
4. **Phase 4**: Complete replacement of legacy

## Benefits Over Legacy System

✅ **Type Safety**: Full TypeScript with proper abstractions  
✅ **Testability**: Pure functions, easy mocking  
✅ **Flexibility**: Polymorphic designs allow customization  
✅ **Maintainability**: Clear separation of concerns  
✅ **Extensibility**: Open for extension without modification  
✅ **Performance**: Efficient time calculations  
✅ **DX**: Excellent developer experience with clear APIs  

## Future Enhancements

Potential additions without breaking changes:

- [ ] Custom grid layouts (month view, timeline view)
- [ ] More selection strategies (duration-based, capacity-based)
- [ ] Recurring booking support
- [ ] Waitlist management
- [ ] Resource conflict resolution
- [ ] Multi-room booking
- [ ] Calendar synchronization

## Support

For questions or issues with the TimeSlot booking system, refer to:
- Test files for usage examples
- Type definitions for API reference
- This README for architectural overview


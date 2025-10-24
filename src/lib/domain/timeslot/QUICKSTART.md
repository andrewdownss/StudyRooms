# Quick Start Guide - TimeSlot Booking System

## Step-by-Step Implementation Guide

### Step 1: Import Dependencies

```typescript
// In your page component
import {
  ScheduleFactory,
  ScheduleFactoryBuilder,
  IScheduleController,
  TimeSlot,
} from '@/lib/domain/timeslot';
import { TimeSlotBookingService } from '@/lib/services/timeslot';
import { container } from '@/lib/container';
```

### Step 2: Initialize Services (Once per app)

```typescript
// src/lib/services/timeslot/container.ts
import { TimeSlotBookingService } from './TimeSlotBookingService';
import { container as mainContainer } from '../container';

export const timeSlotBookingService = new TimeSlotBookingService(
  mainContainer.bookingRepository,
  mainContainer.roomRepository,
  mainContainer.userRepository,
  mainContainer.bookingService // Optional: for legacy comparison
);

export const scheduleFactory = new ScheduleFactoryBuilder()
  .withBookingService(timeSlotBookingService)
  .withRoomRepository(mainContainer.roomRepository)
  .withBookingRepository(mainContainer.bookingRepository)
  .build();
```

### Step 3: Create a Basic Schedule Page

```typescript
// app/schedule/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { scheduleFactory } from '@/lib/services/timeslot/container';
import { IScheduleController, TimeSlot } from '@/lib/domain/timeslot';
import { RoomCategory } from '@/lib/interfaces/domain';

export default function SchedulePage() {
  const { data: session } = useSession();
  const [controller, setController] = useState<IScheduleController | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [category, setCategory] = useState<RoomCategory>('small');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize controller
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const ctrl = await scheduleFactory.createDayView(
          new Date(),
          category,
          {
            selectionMode: 'range',
            startHour: 8,
            endHour: 22,
            events: {
              onSelectionChanged: (slots) => setSelectedSlots(slots),
              onBookingCreated: (booking) => {
                alert('Booking created successfully!');
                // Refresh the controller
                init();
              },
              onError: (err) => setError(err.message),
            },
          }
        );
        setController(ctrl);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
        setLoading(false);
      }
    }

    init();
  }, [category]);

  // Handle booking
  const handleBook = async () => {
    if (!controller || !session?.user?.id) return;

    try {
      setLoading(true);
      await controller.createBooking(session.user.id, category);
      setSelectedSlots([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !controller) {
    return <div>Loading schedule...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!controller) {
    return <div>No schedule available</div>;
  }

  const grid = controller.getGrid();
  const viewModels = controller.getViewModels();
  const summary = controller.getSummary();

  return (
    <div className="schedule-container">
      <h1>Book a Study Room</h1>
      
      {/* Category Selector */}
      <div className="category-selector">
        <button
          className={category === 'small' ? 'active' : ''}
          onClick={() => setCategory('small')}
        >
          Small Rooms (1-4 people)
        </button>
        <button
          className={category === 'large' ? 'active' : ''}
          onClick={() => setCategory('large')}
        >
          Large Rooms (5-12 people)
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="schedule-grid">
        <div className="grid-header">
          <div className="time-label">Time</div>
          {grid.getColumns().map((col) => (
            <div key={col.id} className="column-header">
              {col.label}
            </div>
          ))}
        </div>

        {viewModels.map((row, rowIdx) => (
          <div key={rowIdx} className="grid-row">
            <div className="time-label">
              {grid.getRows()[rowIdx].label}
            </div>
            {row.map((cell, colIdx) => {
              if (!cell) return <div key={colIdx} className="empty-cell" />;

              return (
                <div
                  key={colIdx}
                  className={cell.cssClasses.join(' ')}
                  onClick={() => !cell.isDisabled && controller.handleSlotClick(cell.slot)}
                  style={{
                    cursor: cell.isDisabled ? 'not-allowed' : 'pointer',
                    opacity: cell.isDisabled ? 0.5 : 1,
                  }}
                  title={cell.getTooltip()}
                  aria-label={cell.getAriaLabel()}
                >
                  {cell.displayTime}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selection Info */}
      <div className="selection-info">
        {selectedSlots.length > 0 ? (
          <>
            <p>
              Selected: {selectedSlots.length} slot(s) 
              ({controller.getSelectionDuration()} minutes)
            </p>
            <p>
              Time: {selectedSlots[0].toDisplayString()} - 
              {selectedSlots[selectedSlots.length - 1].next().toDisplayString()}
            </p>
          </>
        ) : (
          <p>Click on available slots to select a time range</p>
        )}
      </div>

      {/* Actions */}
      <div className="actions">
        <button
          onClick={() => controller.clearSelection()}
          disabled={selectedSlots.length === 0}
        >
          Clear Selection
        </button>
        <button
          onClick={handleBook}
          disabled={!controller.canBook() || loading}
          className="primary"
        >
          {loading ? 'Booking...' : `Book ${controller.getSelectionDuration()} minutes`}
        </button>
      </div>

      {/* Debug Info (optional) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="debug-info">
          <summary>Debug Info</summary>
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
```

### Step 4: Add Styling

```css
/* app/schedule/styles.css */
.schedule-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.category-selector button {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.category-selector button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.schedule-grid {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.grid-header {
  display: grid;
  grid-template-columns: 150px 1fr;
  background: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.grid-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  border-bottom: 1px solid #eee;
}

.time-label {
  padding: 15px;
  font-weight: 500;
  border-right: 1px solid #ddd;
}

.column-header {
  padding: 15px;
  text-align: center;
  font-weight: 600;
}

.timeslot {
  padding: 20px;
  text-align: center;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.timeslot.available {
  background: #e8f5e9;
  cursor: pointer;
}

.timeslot.available:hover {
  background: #c8e6c9;
  border-color: #4CAF50;
}

.timeslot.selected {
  background: #4CAF50;
  color: white;
  font-weight: 600;
}

.timeslot.booked {
  background: #ffebee;
  color: #999;
  cursor: not-allowed;
}

.timeslot.past {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}

.selection-info {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.actions button {
  padding: 12px 24px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
}

.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions button.primary {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.actions button.primary:hover:not(:disabled) {
  background: #45a049;
}

.error {
  padding: 15px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin: 20px 0;
}
```

### Step 5: Alternative - Week View

```typescript
// Just change the factory call
const ctrl = await scheduleFactory.createWeekView(
  getStartOfWeek(new Date()),
  category,
  {
    selectionMode: 'single', // Single selection for week view
    events: { /* same as above */ }
  }
);

// Adjust grid to show columns for each day
<div className="grid-row">
  <div className="time-label">{grid.getRows()[rowIdx].label}</div>
  {row.map((cell, colIdx) => (
    // Same cell rendering as above
  ))}
</div>
```

### Step 6: Alternative - Room View

```typescript
// Show all rooms and their availability
const ctrl = await scheduleFactory.createRoomView(
  new Date(),
  category,
  { events: { /* same */ } }
);

// Rows are now rooms, columns are time slots
```

## Advanced Usage

### Custom Selection Strategy

```typescript
import { ContiguousMultiSelectionStrategy } from '@/lib/domain/timeslot';

// Only allow contiguous selections up to 2 hours
const strategy = new ContiguousMultiSelectionStrategy(120);
controller.setSelectionStrategy(strategy);
```

### Compare with Legacy System

```typescript
import { timeSlotBookingService } from '@/lib/services/timeslot/container';

const comparison = await timeSlotBookingService.validateAgainstLegacy({
  userId: session.user.id,
  category: 'small',
  date: new Date(),
  timeRange: controller.getSelectionRange()!
});

if (!comparison.match) {
  console.warn('Discrepancy with legacy system:', comparison.differences);
}
```

### Export/Restore State

```typescript
// Save selection
const state = controller.exportState();
localStorage.setItem('booking-draft', JSON.stringify(state));

// Restore later
const savedState = JSON.parse(localStorage.getItem('booking-draft')!);
controller.restoreState(savedState);
```

## Mobile Responsive Example

```typescript
// Use compact view for mobile
const isMobile = window.innerWidth < 768;

const ctrl = isMobile
  ? await scheduleFactory.createCompactDayView(new Date(), category)
  : await scheduleFactory.createDayView(new Date(), category);
```

## Testing Your Integration

```typescript
// Create a test controller
import { describe, it, expect } from 'vitest';

describe('Schedule Page', () => {
  it('should initialize controller', async () => {
    const ctrl = await scheduleFactory.createDayView(
      new Date(),
      'small'
    );
    
    expect(ctrl).toBeDefined();
    expect(ctrl.getGrid().getGridType()).toBe('day');
  });

  it('should handle slot selection', async () => {
    const ctrl = await scheduleFactory.createDayView(new Date(), 'small');
    const slot = TimeSlot.fromTime(14, 0);
    
    ctrl.handleSlotClick(slot);
    
    expect(ctrl.getSelectedSlots().length).toBeGreaterThan(0);
  });
});
```

## Common Pitfalls

❌ **Don't modify TimeSlot directly** - They're immutable
✅ **Do use transformation methods** - `slot.next()`, `slot.addSlots(2)`

❌ **Don't forget to await factory methods** - They load availability
✅ **Do handle loading states** - Show spinners while initializing

❌ **Don't assume selection is valid** - Check `controller.canBook()`
✅ **Do validate before booking** - Use `getSelectionRange()` to verify

## Next Steps

1. ✅ Copy the code above to create your schedule page
2. ✅ Customize styling to match your design system
3. ✅ Add loading states and error handling
4. ✅ Test on different screen sizes
5. ✅ Add analytics tracking
6. ✅ Deploy and monitor

## Need Help?

- Check `src/lib/domain/timeslot/README.md` for detailed API docs
- Look at test files for usage examples
- Review `TIMESLOT_SYSTEM_SUMMARY.md` for architecture overview


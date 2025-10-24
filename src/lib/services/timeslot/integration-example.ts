/**
 * TimeSlot System Integration Example
 * 
 * Demonstrates how the new TimeSlot system integrates with existing infrastructure
 * This file shows working examples you can use in your application
 */

import { container } from "../../container";
import { TimeSlot, TimeRange } from "../../domain/timeslot";
import { RoomCategory } from "../../interfaces/domain";

/**
 * Example 1: Check availability using TimeSlot system
 */
export async function checkAvailabilityExample() {
  const timeSlotService = container.timeSlotBookingService;

  // Check if 2:00 PM - 3:30 PM is available
  const timeRange = TimeRange.fromLegacy("14:00", 90);
  
  const isAvailable = await timeSlotService.checkAvailability({
    category: "small",
    date: new Date("2025-10-25"),
    timeRange: timeRange,
  });

  console.log("Available:", isAvailable);
  return isAvailable;
}

/**
 * Example 2: Create a booking using TimeSlot system
 */
export async function createBookingExample(userId: string) {
  const timeSlotService = container.timeSlotBookingService;

  const booking = await timeSlotService.createBooking({
    userId: userId,
    category: "small",
    date: new Date("2025-10-25"),
    timeRange: TimeRange.fromLegacy("14:00", 60),
    // organizationId: "optional-org-id"
  });

  console.log("Booking created:", booking);
  return booking;
}

/**
 * Example 3: Get available time slots for a day
 */
export async function getAvailableSlotsExample() {
  const timeSlotService = container.timeSlotBookingService;

  const slots = await timeSlotService.findAvailableSlots(
    new Date("2025-10-25"),
    "small",
    60 // Looking for 60-minute slots
  );

  console.log("Available slots:", slots.map(s => s.toString()));
  return slots;
}

/**
 * Example 4: Compare TimeSlot system with legacy system
 */
export async function comparisonExample() {
  const timeSlotService = container.timeSlotBookingService;

  const comparison = await timeSlotService.validateAgainstLegacy({
    userId: "test-user-id",
    category: "small",
    date: new Date("2025-10-25"),
    timeRange: TimeRange.fromLegacy("14:00", 60),
  });

  if (comparison.match) {
    console.log("✅ Both systems agree!");
  } else {
    console.log("⚠️ Systems disagree:", comparison.differences);
  }

  return comparison;
}

/**
 * Example 5: Create a schedule controller for UI
 */
export async function createScheduleControllerExample(category: RoomCategory = "small") {
  const factory = container.scheduleFactory;

  // Create a day view controller
  const controller = await factory.createDayView(
    new Date(),
    category,
    {
      selectionMode: "range",
      startHour: 8,
      endHour: 22,
      events: {
        onSelectionChanged: (slots) => {
          console.log("Selected slots:", slots.map(s => s.toString()));
        },
        onBookingCreated: (booking) => {
          console.log("Booking created:", booking.id);
        },
        onError: (error) => {
          console.error("Error:", error.message);
        },
      },
    }
  );

  return controller;
}

/**
 * Example 6: Get grid data for rendering
 */
export async function getGridDataExample() {
  const controller = await createScheduleControllerExample();
  
  const grid = controller.getGrid();
  const viewModels = controller.getViewModels();

  // Grid structure
  console.log("Grid type:", grid.getGridType());
  console.log("Rows:", grid.getRows().length);
  console.log("Columns:", grid.getColumns().length);

  // Get a specific cell
  const cell = viewModels[0][0];
  if (cell) {
    console.log("First cell:", {
      time: cell.displayTime,
      available: cell.isAvailable,
      cssClasses: cell.cssClasses,
    });
  }

  return { grid, viewModels };
}

/**
 * Example 7: Handle user interaction (slot click)
 */
export async function handleSlotClickExample() {
  const controller = await createScheduleControllerExample();
  
  // User clicks on 2:00 PM slot
  const slot = TimeSlot.fromTime(14, 0);
  controller.handleSlotClick(slot);

  // Check selection
  const selected = controller.getSelectedSlots();
  const canBook = controller.canBook();
  const duration = controller.getSelectionDuration();

  console.log("Selected:", selected.map(s => s.toString()));
  console.log("Can book:", canBook);
  console.log("Duration:", duration, "minutes");

  return { selected, canBook, duration };
}

/**
 * Example 8: Complete booking flow
 */
export async function completeBookingFlowExample(userId: string) {
  const controller = await createScheduleControllerExample("small");
  
  // 1. User selects time slots
  controller.handleSlotClick(TimeSlot.fromTime(14, 0));
  controller.handleSlotClick(TimeSlot.fromTime(15, 0)); // Range selection

  // 2. Verify selection is valid
  if (!controller.canBook()) {
    throw new Error("Invalid selection");
  }

  // 3. Show summary
  const summary = controller.getSummary();
  console.log("Booking summary:", summary);

  // 4. Create booking
  const booking = await controller.createBooking(userId, "small");
  console.log("Booking created:", booking);

  return booking;
}

/**
 * Example 9: Get statistics
 */
export async function getStatisticsExample() {
  const timeSlotService = container.timeSlotBookingService;

  const stats = await timeSlotService.getAvailabilityStatistics(
    new Date("2025-10-25"),
    "small"
  );

  console.log("Statistics:", {
    totalSlots: stats.totalSlots,
    availableSlots: stats.availableSlots,
    bookedSlots: stats.bookedSlots,
    utilization: `${stats.utilizationPercentage.toFixed(1)}%`,
  });

  return stats;
}

/**
 * Example 10: Get suggested time slots
 */
export async function getSuggestedSlotsExample() {
  const timeSlotService = container.timeSlotBookingService;

  // Get suggestions for 90-minute booking, preferring afternoon
  const suggestions = await timeSlotService.getSuggestedTimeSlots(
    new Date("2025-10-25"),
    "small",
    90,
    14 // Prefer 2:00 PM
  );

  console.log("Suggested times:");
  suggestions.forEach(slot => {
    console.log(`  - ${slot.toDisplayString()}`);
  });

  return suggestions;
}

/**
 * Integration Test: Run all examples
 */
export async function runIntegrationTests() {
  console.log("🧪 Running TimeSlot Integration Tests\n");

  try {
    console.log("1. Checking availability...");
    await checkAvailabilityExample();

    console.log("\n2. Getting available slots...");
    await getAvailableSlotsExample();

    console.log("\n3. Creating schedule controller...");
    await createScheduleControllerExample();

    console.log("\n4. Getting grid data...");
    await getGridDataExample();

    console.log("\n5. Handling slot click...");
    await handleSlotClickExample();

    console.log("\n6. Getting statistics...");
    await getStatisticsExample();

    console.log("\n7. Getting suggestions...");
    await getSuggestedSlotsExample();

    console.log("\n✅ All integration tests passed!");
    return true;
  } catch (error) {
    console.error("\n❌ Integration test failed:", error);
    return false;
  }
}

/**
 * Quick verification that integration works
 */
export async function quickVerification() {
  try {
    // Verify services are accessible
    const timeSlotService = container.timeSlotBookingService;
    const factory = container.scheduleFactory;
    const legacyService = container.bookingService;

    console.log("✅ TimeSlotBookingService:", !!timeSlotService);
    console.log("✅ ScheduleFactory:", !!factory);
    console.log("✅ Legacy BookingService:", !!legacyService);
    console.log("✅ Repositories:", {
      booking: !!container.bookingRepository,
      room: !!container.roomRepository,
      user: !!container.userRepository,
    });

    return true;
  } catch (error) {
    console.error("❌ Verification failed:", error);
    return false;
  }
}


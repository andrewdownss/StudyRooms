import { PrismaBookingSystem } from "./prismaBookingSystem";

// Create a singleton instance
const bookingSystem = new PrismaBookingSystem();

// Initialize default rooms
bookingSystem.initializeDefaultRooms().catch(console.error);

export { bookingSystem };

-- AlterTable: Add public booking fields to Booking
ALTER TABLE "Booking" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';
ALTER TABLE "Booking" ADD COLUMN "maxParticipants" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Booking" ADD COLUMN "title" TEXT;
ALTER TABLE "Booking" ADD COLUMN "description" TEXT;

-- CreateTable: BookingParticipant for tracking who joins public bookings
CREATE TABLE "BookingParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingParticipant_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingParticipant_bookingId_userId_key" ON "BookingParticipant"("bookingId", "userId");

-- CreateIndex
CREATE INDEX "BookingParticipant_bookingId_idx" ON "BookingParticipant"("bookingId");

-- CreateIndex
CREATE INDEX "BookingParticipant_userId_idx" ON "BookingParticipant"("userId");

-- CreateIndex
CREATE INDEX "Booking_visibility_idx" ON "Booking"("visibility");


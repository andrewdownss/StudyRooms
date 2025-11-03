-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bookingId" TEXT,
    "roomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Issue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Issue_userId_idx" ON "Issue"("userId");

-- CreateIndex
CREATE INDEX "Issue_bookingId_idx" ON "Issue"("bookingId");

-- CreateIndex
CREATE INDEX "Issue_roomId_idx" ON "Issue"("roomId");

-- CreateIndex
CREATE INDEX "Issue_issueType_idx" ON "Issue"("issueType");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

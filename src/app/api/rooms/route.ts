/**
 * Rooms API Routes
 * 
 * Thin layer that delegates to RoomHandler.
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { RoomHandler } from "@/lib/http/handlers/RoomHandler";
import { getCurrentUserId } from "@/lib/http/middleware/auth";
import { ApplicationError } from "@/lib/errors";

// GET /api/rooms - Get all rooms or filter by category
export async function GET(request: NextRequest) {
  try {
    // Just need to be authenticated to view rooms
    await getCurrentUserId();
    const handler = new RoomHandler(container.roomService);
    return handler.getRooms(request);
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create a new room (admin only)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const handler = new RoomHandler(container.roomService);
    return handler.createRoom(request, userId);
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

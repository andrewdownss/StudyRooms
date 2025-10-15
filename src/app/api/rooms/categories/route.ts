/**
 * Room Categories API Routes
 * 
 * Thin layer that delegates to RoomHandler for category information.
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { RoomHandler } from "@/lib/http/handlers/RoomHandler";
import { getCurrentUserId } from "@/lib/http/middleware/auth";
import { ApplicationError } from "@/lib/errors";

// GET /api/rooms/categories - Get room categories with counts
export async function GET(request: NextRequest) {
  try {
    // Just need to be authenticated to view categories
    await getCurrentUserId();
    const handler = new RoomHandler(container.roomService);
    return handler.getCategories();
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

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Room {
  id: string;
  name: string;
  category: string;
  capacity: number;
}

interface TimeSlot {
  time: string;
  display: string;
  minutes: number;
}

export default function BookRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [duration, setDuration] = useState<number>(60);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchRooms();
    }
  }, [session]);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
        if (data.length > 0) {
          setSelectedRoomId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const checkAvailability = async () => {
    if (!selectedRoomId || !bookingDate) {
      setMessage({ type: "error", text: "Please select a room and date" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/v2/rooms/${selectedRoomId}/availability?date=${bookingDate}&duration=${duration}`
      );

      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.availableSlots || []);
        setMessage({
          type: "success",
          text: `Found ${data.count} available time slots`,
        });
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to check availability" });
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Network error occurred" });
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    if (!selectedRoomId || !bookingDate || !selectedSlot) {
      setMessage({
        type: "error",
        text: "Please select room, date, and time slot",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v2/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          date: bookingDate,
          startSlot: selectedSlot,
          durationMinutes: duration,
        }),
      });

      if (res.ok) {
        const booking = await res.json();
        setMessage({
          type: "success",
          text: `✅ Booking confirmed! Your room is reserved.`,
        });
        setSelectedSlot("");
        // Refresh availability
        setTimeout(() => checkAvailability(), 1000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Booking failed" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Link
            href="/dashboard"
            className="text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Book a Study Room</h1>
          <p className="mt-2">Reserve your perfect study space</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel: Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Your Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.category}, {room.capacity} people)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>

              <button
                onClick={checkAvailability}
                disabled={loading || !selectedRoomId}
                className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Checking..." : "Check Availability"}
              </button>
            </div>

            {/* Room Info */}
            {selectedRoom && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Room Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Name:</strong> {selectedRoom.name}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedRoom.category}
                  </p>
                  <p>
                    <strong>Capacity:</strong> {selectedRoom.capacity} people
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Available Slots */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Available Times ({availableSlots.length})
            </h2>

            {availableSlots.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSlot === slot.time
                          ? "bg-red-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-red-100"
                      }`}
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>

                {selectedSlot && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-gray-900 mb-3">
                      <strong>Selected:</strong> {selectedSlot} for {duration}{" "}
                      minutes
                    </p>
                    <button
                      onClick={createBooking}
                      disabled={loading}
                      className="w-full bg-red-800 text-white py-2 rounded-lg font-semibold hover:bg-red-900 disabled:opacity-50 transition-colors"
                    >
                      {loading ? "Booking..." : "Confirm Booking"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">No times selected yet</p>
                <p className="text-sm">
                  Choose a room and date, then click "Check Availability"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


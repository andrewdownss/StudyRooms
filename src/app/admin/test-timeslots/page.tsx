"use client";

import { useState, useEffect } from "react";
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

export default function AdminTestTimeSlotsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [testDate, setTestDate] = useState<string>(
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
    fetchRooms();
  }, []);

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
    if (!selectedRoomId || !testDate) {
      setMessage({ type: "error", text: "Please select a room and date" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/v2/rooms/${selectedRoomId}/availability?date=${testDate}&duration=${duration}`
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
        setMessage({ type: "error", text: error.error || "Failed to fetch" });
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

  const createTestBooking = async () => {
    if (!selectedRoomId || !testDate || !selectedSlot) {
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
          date: testDate,
          startSlot: selectedSlot,
          durationMinutes: duration,
        }),
      });

      if (res.ok) {
        const booking = await res.json();
        setMessage({
          type: "success",
          text: `✅ Booking created! ID: ${booking.id}`,
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

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-800 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <Link
            href="/admin/bookings"
            className="text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">TimeSlot System Test</h1>
          <p className="mt-2">
            Test the new 30-minute TimeSlot booking system
          </p>
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
            <h2 className="text-xl font-bold mb-4">Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Room
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:border-transparent"
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
                  Test Date
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:border-transparent"
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
                className="w-full bg-purple-800 text-white py-2 rounded-lg font-semibold hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Checking..." : "Check Availability"}
              </button>
            </div>

            {/* Room Info */}
            {selectedRoom && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Room Info</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Name:</strong> {selectedRoom.name}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedRoom.category}
                  </p>
                  <p>
                    <strong>Capacity:</strong> {selectedRoom.capacity} people
                  </p>
                  <p>
                    <strong>Room ID:</strong>{" "}
                    <code className="bg-gray-200 px-1 rounded">
                      {selectedRoom.id}
                    </code>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Available Slots */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">
              Available Time Slots ({availableSlots.length})
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
                          ? "bg-purple-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-purple-100"
                      }`}
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>

                {selectedSlot && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-900 mb-3">
                      <strong>Selected:</strong> {selectedSlot} for {duration}{" "}
                      minutes
                    </p>
                    <button
                      onClick={createTestBooking}
                      disabled={loading}
                      className="w-full bg-purple-800 text-white py-2 rounded-lg font-semibold hover:bg-purple-900 disabled:opacity-50 transition-colors"
                    >
                      {loading ? "Creating..." : "Create Test Booking"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">No slots loaded yet</p>
                <p className="text-sm">
                  Configure options and click "Check Availability"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* API Test Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">API Test Commands</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Check Availability:
              </p>
              <code className="text-xs text-gray-600 break-all">
                curl "http://localhost:3000/api/v2/rooms/{selectedRoomId ||
                  "ROOM_ID"}
                /availability?date={testDate}&duration={duration}"
              </code>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Create Booking:
              </p>
              <code className="text-xs text-gray-600 break-all">
                curl -X POST "http://localhost:3000/api/v2/bookings" -H
                "Content-Type: application/json" -d '&#123;"roomId":"
                {selectedRoomId || "ROOM_ID"}","date":"{testDate}
                ","startSlot":"{selectedSlot || "14:00"}
                ","durationMinutes":{duration}&#125;'
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
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

interface Booking {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  status: string;
  room: Room;
}

export default function BookRoomV2Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [bookingDate, setBookingDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; slug: string; role?: string }[]
  >([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchRooms();
      fetchRecentBookings();
      fetchOrganizations();
    }
  }, [session]);

  useEffect(() => {
    if (selectedRoom && bookingDate && duration) {
      fetchAvailableSlots();
    }
  }, [selectedRoom, bookingDate, duration]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms", {
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Failed to load rooms");
        setRooms([]);
        return;
      }
      const roomData = await response.json();
      setRooms(roomData);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Could not load rooms");
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch("/api/user/bookings");
      if (response.ok) {
        const bookings = await response.json();
        setRecentBookings(bookings.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch {
      // noop
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedRoom || !bookingDate) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v2/rooms/${selectedRoom.id}/availability?date=${bookingDate}&duration=${duration}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.availableSlots);
      } else {
        setError("Failed to load available time slots");
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setError("Could not load available slots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setStep(2);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedRoom || !bookingDate || !selectedSlot) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v2/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          date: bookingDate,
          startSlot: selectedSlot.time,
          durationMinutes: duration,
          ...(organizationId ? { organizationId } : {}),
        }),
      });

      if (response.ok) {
        const booking = await response.json();
        alert(
          `Room booked successfully using NEW TimeSlot System!\n${
            selectedRoom.name
          } on ${new Date(booking.date).toLocaleDateString()} at ${
            selectedSlot.display
          } for ${booking.duration} minutes`
        );
        // Reset form and refresh bookings
        setStep(1);
        setSelectedRoom(null);
        setBookingDate("");
        setDuration(60);
        setSelectedSlot(null);
        setOrganizationId(null);
        fetchRecentBookings();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setError("An error occurred while booking the room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      if (response.ok) {
        alert("Booking cancelled successfully");
        fetchRecentBookings();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("An error occurred while cancelling the booking");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-blue-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/dashboard"
            className="text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Book a Study Room (TimeSlot System)</h1>
              <p className="mt-2">Testing the new 30-minute TimeSlot booking system</p>
            </div>
            <div className="bg-blue-700 px-4 py-2 rounded-lg text-sm">
              🔬 V2 Test Page
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                step >= 1 ? "text-blue-800" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-blue-800 text-white" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium">Select Room</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div
              className={`flex items-center ${
                step >= 2 ? "text-blue-800" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-blue-800 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Pick TimeSlot & Confirm</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Step 1: Select Room */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Select a Room</h2>
            {rooms.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-800"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {room.name}
                    </h3>
                    <p className="text-gray-700 mb-2">
                      Category: {room.category}
                    </p>
                    <p className="text-gray-500">Capacity: {room.capacity} people</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">No rooms available.</div>
            )}
          </div>
        )}

        {/* Step 2: Pick TimeSlot */}
        {step === 2 && selectedRoom && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Book {selectedRoom.name}
                </h2>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedSlot(null);
                  }}
                  className="text-sm text-blue-800 hover:underline"
                >
                  Change Room
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book on behalf of organization (optional)
                  </label>
                  <select
                    value={organizationId || ""}
                    onChange={(e) => setOrganizationId(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  >
                    <option value="">Personal booking</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => {
                      setDuration(Number(e.target.value));
                      setSelectedSlot(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>

                {/* Available TimeSlots */}
                {bookingDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Time Slots ({availableSlots.length} available)
                    </label>
                    {isLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => handleSlotSelect(slot)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedSlot?.time === slot.time
                                ? "bg-blue-800 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                            }`}
                          >
                            {slot.display}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">
                        No available time slots for this duration
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={isLoading || !bookingDate || !selectedSlot}
                  className="w-full bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Recent Bookings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`rounded-lg border p-4 ${
                    booking.status === "cancelled"
                      ? "bg-gray-100 border-gray-300 opacity-60"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className={`font-medium ${
                        booking.status === "cancelled"
                          ? "text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {booking.room.name}
                    </h3>
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      booking.status === "cancelled"
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  >
                    {new Date(booking.date).toLocaleDateString()} at{" "}
                    {booking.startTime}
                  </p>
                  <p
                    className={`text-sm ${
                      booking.status === "cancelled"
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Duration: {booking.duration} minutes
                  </p>
                  {booking.status === "cancelled" && (
                    <p className="text-xs text-red-600 mt-2">Cancelled</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


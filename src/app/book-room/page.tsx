"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReportIssueModal } from "@/components/ReportIssueModal";

interface Room {
  id: string;
  name: string;
  category: string;
  capacity: number;
}

interface TimeSlotWithStatus {
  time: string;
  display: string;
  minutes: number;
  status: "available" | "booked";
  color: "green" | "red" | "blue" | "gray";
  booking?: {
    id: string;
    title?: string;
    description?: string;
    visibility: string;
    userId: string;
  };
}

export default function BookRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [allSlots, setAllSlots] = useState<TimeSlotWithStatus[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotWithStatus | null>(
    null
  );
  const [isJoiningBooking, setIsJoiningBooking] = useState(false); // Track if viewing a public booking
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  // Booking form fields (only shown after selecting a slot)
  const [duration, setDuration] = useState<number>(60);
  const [visibility, setVisibility] = useState<"private" | "public" | "org">(
    "private"
  );
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [maxParticipants, setMaxParticipants] = useState<number>(1);
  const [isReportOpen, setIsReportOpen] = useState(false);

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

  // Auto-load time slots when room or date changes
  useEffect(() => {
    if (selectedRoomId && bookingDate) {
      loadTimeSlots();
    }
  }, [selectedRoomId, bookingDate]);

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

  // Generate all 30-minute slots from 8am to 10pm
  const generateAllSlots = (): TimeSlotWithStatus[] => {
    const slots: TimeSlotWithStatus[] = [];
    for (let hour = 8; hour < 22; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayString = `${displayHour}:${String(minute).padStart(
          2,
          "0"
        )} ${ampm}`;

        slots.push({
          time: timeString,
          display: displayString,
          minutes: hour * 60 + minute,
          status: "available",
          color: "green",
        });
      }
    }
    return slots;
  };

  const loadTimeSlots = async () => {
    if (!selectedRoomId || !bookingDate) return;

    setLoading(true);
    setMessage(null);

    try {
      // Fetch all bookings for this room on this date
      const res = await fetch(
        `/api/v2/rooms/${selectedRoomId}/bookings?date=${bookingDate}`
      );

      const slots = generateAllSlots();

      if (res.ok) {
        const bookings = await res.json();

        // Mark slots as booked based on existing bookings
        bookings.forEach((booking: any) => {
          const startTime = booking.startTime;
          const duration = booking.duration;
          const startMinutes =
            parseInt(startTime.split(":")[0]) * 60 +
            parseInt(startTime.split(":")[1]);

          // Mark all slots covered by this booking
          for (let i = 0; i < duration / 30; i++) {
            const slotMinutes = startMinutes + i * 30;
            const slot = slots.find((s) => s.minutes === slotMinutes);
            if (slot) {
              slot.status = "booked";
              // Color based on visibility
              if (booking.visibility === "public") {
                slot.color = "blue";
              } else if (booking.visibility === "org") {
                slot.color = "gray";
              } else {
                slot.color = "red";
              }
              slot.booking = {
                id: booking.id,
                title: booking.title,
                description: booking.description,
                visibility: booking.visibility,
                userId: booking.userId,
              };
            }
          }
        });
      }

      setAllSlots(slots);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Failed to load time slots" });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: TimeSlotWithStatus) => {
    if (slot.status === "booked") {
      // Public bookings can be joined
      if (slot.color === "blue" && slot.booking) {
        setSelectedSlot(slot);
        setIsJoiningBooking(true);
        setMessage(null);
        return;
      }

      // Private/org bookings show error message
      if (slot.booking) {
        setMessage({
          type: "error",
          text: `This slot is ${slot.booking.visibility} booked${
            slot.booking.title ? ": " + slot.booking.title : ""
          }`,
        });
      }
      return;
    }

    // Available slot - show booking form
    setSelectedSlot(slot);
    setIsJoiningBooking(false);
    setMessage(null);
  };

  const createBooking = async () => {
    if (!selectedRoomId || !bookingDate || !selectedSlot) {
      setMessage({
        type: "error",
        text: "Please select room, date, and time slot",
      });
      return;
    }

    // Validate public booking fields
    if ((visibility === "public" || visibility === "org") && !title.trim()) {
      setMessage({
        type: "error",
        text: "Title is required for public/organization bookings",
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
          startSlot: selectedSlot.time,
          durationMinutes: duration,
          visibility,
          maxParticipants: visibility === "private" ? 1 : maxParticipants,
          title: visibility !== "private" ? title : undefined,
          description: visibility !== "private" ? description : undefined,
        }),
      });

      if (res.ok) {
        const visibilityText =
          visibility === "public"
            ? "Public"
            : visibility === "org"
            ? "Organization"
            : "Private";
        setMessage({
          type: "success",
          text: `✅ ${visibilityText} booking confirmed!`,
        });
        setSelectedSlot(null);
        setTitle("");
        setDescription("");
        // Reload time slots
        setTimeout(() => loadTimeSlots(), 1000);
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

  const joinBooking = async () => {
    if (!selectedSlot?.booking?.id) {
      setMessage({
        type: "error",
        text: "No booking selected",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/v2/bookings/${selectedSlot.booking.id}/join`,
        {
          method: "POST",
        }
      );

      if (res.ok) {
        setMessage({
          type: "success",
          text: `✅ Successfully joined the study group!`,
        });
        setSelectedSlot(null);
        setIsJoiningBooking(false);
        // Reload time slots
        setTimeout(() => loadTimeSlots(), 1000);
      } else {
        const error = await res.json();
        setMessage({
          type: "error",
          text: error.error || "Failed to join booking",
        });
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
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/dashboard"
            className="text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Book a Study Room</h1>
          <p className="mt-2">Select a time slot to begin</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Room and Date Selection */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 inline-flex items-center gap-1">
                Room
                <span
                  className="text-gray-400 cursor-help"
                  title="Choose a room that fits your group size and needs."
                >
                  ⓘ
                </span>
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => {
                  setSelectedRoomId(e.target.value);
                  setSelectedSlot(null); // Reset selection
                }}
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
              <label className="block text-sm font-medium text-gray-700 mb-2 inline-flex items-center gap-1">
                Date
                <span
                  className="text-gray-400 cursor-help"
                  title="You can book up to 30 days in advance."
                >
                  ⓘ
                </span>
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  setSelectedSlot(null); // Reset selection
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {selectedRoom && (
                  <>
                    <strong>{selectedRoom.name}</strong>
                    <br />
                    Capacity: {selectedRoom.capacity} people
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Color Legend */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Time Slot Colors
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>🔒 Private (Booked)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>🌐 Public (Joinable)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>🏢 Organization</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Time Slots Grid (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Available Times
              {loading && (
                <span className="ml-2 text-sm text-gray-500">(Loading...)</span>
              )}
            </h2>

            {allSlots.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {allSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slot.color === "red" || slot.color === "gray"}
                    className={`
                      px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${
                        selectedSlot?.time === slot.time
                          ? "ring-2 ring-red-800 ring-offset-2"
                          : ""
                      }
                      ${
                        slot.color === "green" &&
                        "bg-green-100 hover:bg-green-200 text-green-800 cursor-pointer"
                      }
                      ${
                        slot.color === "red" &&
                        "bg-red-100 text-red-800 cursor-not-allowed opacity-60"
                      }
                      ${
                        slot.color === "blue" &&
                        "bg-blue-100 hover:bg-blue-200 text-blue-800 cursor-pointer"
                      }
                      ${
                        slot.color === "gray" &&
                        "bg-gray-100 text-gray-800 cursor-not-allowed opacity-60"
                      }
                    `}
                  >
                    {slot.display}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">Select a room and date</p>
                <p className="text-sm">Time slots will appear here</p>
              </div>
            )}
          </div>

          {/* Booking Details Form (1/3 width) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Booking Details
            </h2>

            {selectedSlot ? (
              <div className="space-y-4">
                <div
                  className={`p-3 border rounded-lg ${
                    isJoiningBooking
                      ? "bg-blue-50 border-blue-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    Selected Time
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isJoiningBooking ? "text-blue-800" : "text-red-800"
                    }`}
                  >
                    {selectedSlot.display}
                  </p>
                </div>

                {isJoiningBooking && selectedSlot.booking ? (
                  // Show booking details for public bookings
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-blue-600 text-xl">🌐</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {selectedSlot.booking.title ||
                              "Public Study Session"}
                          </h3>
                          {selectedSlot.booking.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedSlot.booking.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                      <p>
                        Click "Join Study Group" to become a participant in this
                        public booking.
                      </p>
                    </div>

                    <button
                      onClick={joinBooking}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? "Joining..." : "Join Study Group"}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSlot(null);
                        setIsJoiningBooking(false);
                      }}
                      className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  // Show booking form for available slots
                  <>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Booking Type
                      </label>
                      <select
                        value={visibility}
                        onChange={(e) =>
                          setVisibility(
                            e.target.value as "private" | "public" | "org"
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                      >
                        <option value="private">🔒 Private</option>
                        <option value="public">🌐 Public</option>
                        <option value="org">🏢 Organization</option>
                      </select>
                    </div>

                    {/* Public/Org Fields */}
                    {(visibility === "public" || visibility === "org") && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., CS 101 Study Group"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                            maxLength={100}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                            maxLength={500}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Participants
                          </label>
                          <input
                            type="number"
                            value={maxParticipants}
                            onChange={(e) =>
                              setMaxParticipants(
                                Math.max(
                                  1,
                                  Math.min(
                                    selectedRoom?.capacity || 10,
                                    Number(e.target.value)
                                  )
                                )
                              )
                            }
                            min={1}
                            max={selectedRoom?.capacity || 10}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={createBooking}
                      disabled={loading}
                      className="w-full bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 disabled:opacity-50 transition-colors"
                    >
                      {loading ? "Booking..." : "Confirm Booking"}
                    </button>

                    <button
                      onClick={() => setSelectedSlot(null)}
                      className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-sm">
                  Click a{" "}
                  <span className="text-green-600 font-semibold">green</span>{" "}
                  time slot to begin booking
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Report an issue floating button */}
      <button
        onClick={() => setIsReportOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-full shadow-lg px-4 py-3 hover:bg-gray-800"
        title="Report an issue"
        aria-label="Report an issue"
      >
        <span className="inline-flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Report issue
        </span>
      </button>

      <ReportIssueModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        defaultEmail={session?.user?.email || null}
        defaultBookingId={selectedSlot?.booking?.id || null}
      />
    </div>
  );
}

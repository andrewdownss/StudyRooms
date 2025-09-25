"use client";

import React, { useState } from "react";

interface Room {
  id: string;
  name: string;
  capacity: number;
  isAccessible: boolean;
  location: string;
}

interface BookingData {
  room: Room;
  date: string;
  time: string;
  duration: string;
}

export default function BookRoomPage() {
  const [step, setStep] = useState(1); // 1: Select Room, 2: Pick Time, 3: Confirm
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});

  // Simple room data
  const rooms: Room[] = [
    {
      id: "room-101",
      name: "Small Study Room",
      capacity: 4,
      isAccessible: true,
      location: "1st Floor",
    },
    {
      id: "room-202",
      name: "Group Room",
      capacity: 8,
      isAccessible: false,
      location: "2nd Floor",
    },
    {
      id: "room-303",
      name: "Large Conference Room",
      capacity: 12,
      isAccessible: true,
      location: "3rd Floor",
    },
  ];

  // Today's available time slots
  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setBookingData({ ...bookingData, room });
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    const today = new Date().toLocaleDateString();
    setBookingData({
      ...bookingData,
      time,
      date: today,
      duration: "1",
    });
    setStep(3);
  };

  const handleBooking = () => {
    alert(
      `Room booked successfully!\n${bookingData.room?.name} at ${bookingData.time}`
    );
    // Reset form
    setStep(1);
    setSelectedRoom(null);
    setBookingData({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Book a Study Room
          </h1>
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center ${
                  step >= 1 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step >= 1
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 text-sm">Choose Room</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div
                className={`flex items-center ${
                  step >= 2 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step >= 2
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm">Pick Time</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div
                className={`flex items-center ${
                  step >= 3 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step >= 3
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  3
                </div>
                <span className="ml-2 text-sm">Confirm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Choose Room */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Choose a room for today
            </h2>
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {room.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {room.location} • Up to {room.capacity} people
                    </p>
                    {room.isAccessible && (
                      <span className="inline-flex items-center mt-2 text-sm text-green-700">
                        ♿ Wheelchair accessible
                      </span>
                    )}
                  </div>
                  <div className="text-blue-600">→</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Pick Time */}
        {step === 2 && selectedRoom && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Pick a time for {selectedRoom.name}
              </h2>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-4">
                Today,{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <div className="font-medium text-gray-900">{time}</div>
                    <div className="text-sm text-green-600">Available</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Booking */}
        {step === 3 && bookingData.room && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Confirm your booking
              </h2>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {bookingData.room.name}
                  </h3>
                  <p className="text-gray-600">{bookingData.room.location}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date</span>
                      <p className="font-medium">{bookingData.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Time</span>
                      <p className="font-medium">{bookingData.time}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleBooking}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

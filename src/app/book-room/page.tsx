"use client";

import React, { useState, useEffect } from "react";
import { bookingSystem, Room, Booking, RoomCategory, BookingData } from "../../lib/bookingSystem";
import ManualBookingForm from "../../components/ManualBookingForm";

export default function BookRoomPage() {
  const [step, setStep] = useState(1); // 1: Select Room Type, 2: Pick Time, 3: Confirm
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Set<string>>(new Set());

  // Get room categories from booking system
  const roomCategories = bookingSystem.getRoomCategories();

  // Load recent bookings on component mount
  useEffect(() => {
    const bookings = bookingSystem.getBookings();
    setRecentBookings(bookings.slice(-5).reverse()); // Show 5 most recent
  }, []);

  // Get available time slots for selected category and today
  const today = new Date().toISOString().split('T')[0];
  const timeSlots = selectedCategory ? bookingSystem.getFormattedTimeSlots(selectedCategory.id, today) : [];

  const handleCategorySelect = (category: RoomCategory) => {
    setSelectedCategory(category);
    setBookingData({ ...bookingData, category: category.id as 'small' | 'large' });
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    const time24 = convertTo24Hour(time);
    setBookingData({
      ...bookingData,
      startTime: time24,
      date: today,
      duration: 60, // Default 1 hour
    });
    setStep(3);
  };

  const handleBooking = () => {
    if (bookingData.category && bookingData.date && bookingData.startTime && bookingData.duration) {
      try {
        const booking = bookingSystem.createBookingByCategory(
          bookingData.category as 'small' | 'large',
          bookingData.date,
          bookingData.startTime,
          bookingData.duration
        );
        
        if (booking) {
          alert(`Room booked successfully!\n${booking.roomName} at ${bookingData.startTime} for ${bookingData.duration} minutes`);
          // Refresh recent bookings
          const bookings = bookingSystem.getBookings();
          setRecentBookings(bookings.slice(-5).reverse());
          // Clear cancelled bookings state
          setCancelledBookings(new Set());
          // Reset form
          setStep(1);
          setSelectedCategory(null);
          setSelectedRoom(null);
          setBookingData({});
        }
      } catch (error) {
        alert(`Booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleManualBookingCreated = (booking: Booking) => {
    // Refresh recent bookings
    const bookings = bookingSystem.getBookings();
    setRecentBookings(bookings.slice(-5).reverse());
    // Clear cancelled bookings state
    setCancelledBookings(new Set());
    alert(`Manual booking created successfully!\n${booking.roomName} on ${booking.date} at ${booking.startTime}`);
  };

  // Convert display time (e.g., "9:00 AM") to 24-hour format (e.g., "09:00")
  const convertTo24Hour = (displayTime: string): string => {
    const [time, period] = displayTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Book a Study Room
            </h1>
            <button
              onClick={() => setShowManualBooking(true)}
              className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors"
            >
              Manual Booking
            </button>
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center ${
                  step >= 1 ? "text-red-800" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step >= 1
                      ? "border-red-800 bg-red-800 text-white"
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
                  step >= 2 ? "text-red-800" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step >= 2
                      ? "border-red-800 bg-red-800 text-white"
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
                  step >= 3 ? "text-red-800" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step >= 3
                      ? "border-red-800 bg-red-800 text-white"
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Recent Bookings */}
        {recentBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBookings.map((booking) => {
                const isCancelled = cancelledBookings.has(booking.id);
                return (
                  <div 
                    key={booking.id} 
                    className={`rounded-lg border p-4 transition-all ${
                      isCancelled 
                        ? 'bg-gray-100 border-gray-300 opacity-60' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-medium ${
                        isCancelled ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {booking.roomName}
                      </h3>
                      {!isCancelled && (
                        <button
                          onClick={() => {
                            bookingSystem.cancelBooking(booking.id);
                            setCancelledBookings(prev => new Set(prev).add(booking.id));
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isCancelled ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {new Date(booking.date).toLocaleDateString()} at {booking.startTime}
                    </p>
                    <p className={`text-sm ${
                      isCancelled ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Duration: {booking.duration} minutes
                    </p>
                    {isCancelled && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Will be removed upon refreshing the page
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Booking Flow */}
        {/* Step 1: Choose Room Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Choose a room type for today
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-red-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {category.description}
                      </p>
                      <p className="text-gray-500 mt-2">
                        {category.capacity}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        System will find the first available {category.name.toLowerCase()} for your time
                      </p>
                    </div>
                    <div className="text-red-800">→</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Pick Time */}
        {step === 2 && selectedCategory && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Pick a time for {selectedCategory.name}
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
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all"
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
        {step === 3 && bookingData.category && (
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
                    {selectedCategory?.name}
                  </h3>
                  <p className="text-gray-600">System will assign first available room</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date</span>
                      <p className="font-medium">{bookingData.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Time</span>
                      <p className="font-medium">{bookingData.startTime}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleBooking}
                    className="w-full bg-red-800 text-white py-3 px-4 rounded-lg hover:bg-red-900 transition-colors font-medium"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      {showManualBooking && (
        <ManualBookingForm
          onBookingCreated={handleManualBookingCreated}
          onClose={() => setShowManualBooking(false)}
        />
      )}
    </div>
  );
}

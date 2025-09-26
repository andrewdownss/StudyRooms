import React, { useState, useEffect } from 'react';
import { bookingSystem, Room, Booking } from '../lib/bookingSystem';
import Calendar from './Calendar';

interface ManualBookingFormProps {
  onBookingCreated: (booking: Booking) => void;
  onClose: () => void;
}

export default function ManualBookingForm({ onBookingCreated, onClose }: ManualBookingFormProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const rooms = bookingSystem.getRooms();
  const today = new Date().toISOString().split('T')[0];

  // Duration options (in minutes)
  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ];

  // Update available times when room, date, or duration changes
  useEffect(() => {
    if (selectedRoom && selectedDate) {
      const times = bookingSystem.getFormattedTimeSlots(selectedRoom, selectedDate);
      setAvailableTimes(times);
      setSelectedTime(''); // Reset selected time
    }
  }, [selectedRoom, selectedDate, selectedDuration]);

  // Check daily limit
  const remainingMinutes = selectedDate ? bookingSystem.getRemainingDailyMinutes(selectedDate) : 120;
  const canBookDuration = selectedDuration <= remainingMinutes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!selectedRoom || !selectedDate || !selectedTime) {
        throw new Error('Please fill in all fields');
      }

      // Convert display time back to 24-hour format
      const time24 = convertTo24Hour(selectedTime);
      
      const booking = bookingSystem.createBooking(
        selectedRoom,
        selectedDate,
        time24,
        selectedDuration
      );

      if (booking) {
        onBookingCreated(booking);
        onClose();
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Manual Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Specific Room
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 gap-2 p-3">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoom(room.id)}
                      className={`
                        p-3 border rounded-lg text-left transition-colors
                        ${selectedRoom === room.id
                          ? 'border-red-800 bg-red-50 text-red-800'
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="font-medium text-gray-900">{room.name}</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {room.location} • {room.capacity} people
                      </div>
                      {room.isAccessible && (
                        <div className="text-sm text-green-600 mt-1">♿ Wheelchair accessible</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {selectedRoom && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {rooms.find(r => r.id === selectedRoom)?.name} - {rooms.find(r => r.id === selectedRoom)?.location}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                minDate={today}
              />
              {selectedDate && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {formatDate(selectedDate)}
                </p>
              )}
            </div>

            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Duration
              </label>
              <div className="grid grid-cols-2 gap-3">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedDuration(option.value)}
                    disabled={option.value > remainingMinutes}
                    className={`
                      p-3 border rounded-lg text-left transition-colors
                      ${selectedDuration === option.value
                        ? 'border-red-800 bg-red-50 text-red-800'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                      ${option.value > remainingMinutes
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                      }
                    `}
                  >
                    <div className="font-medium">{option.label}</div>
                    {option.value > remainingMinutes && (
                      <div className="text-xs text-red-500">Exceeds daily limit</div>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Remaining daily time: {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m
              </p>
            </div>

            {/* Time Selection */}
            {selectedRoom && selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Times
                </label>
                {availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`
                          p-3 border rounded-lg text-center transition-colors
                          ${selectedTime === time
                            ? 'border-red-800 bg-red-50 text-red-800'
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No available times for this room and date
                  </p>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedRoom || !selectedDate || !selectedTime || !canBookDuration || isSubmitting}
                className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

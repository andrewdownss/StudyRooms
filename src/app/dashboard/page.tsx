"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

interface Room {
  id: string;
  name: string;
  category: string;
  capacity: number;
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  status: string;
  room: Room;
  organization?: { id: string; name: string } | null;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [orgBookingsWeek, setOrgBookingsWeek] = useState<
    { date: string; bookings: Booking[] }[]
  >([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchUserBookings = async () => {
    try {
      // Fetch recent bookings
      const recentResponse = await fetch("/api/user/bookings");
      if (recentResponse.ok) {
        const bookings = await recentResponse.json();
        setUserBookings(bookings.slice(0, 3));
      }

      // Fetch upcoming bookings
      const upcomingResponse = await fetch(
        "/api/user/bookings?upcoming=true&status=confirmed"
      );
      if (upcomingResponse.ok) {
        const bookings = await upcomingResponse.json();
        setUpcomingBookings(bookings.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchOrgBookingsWeek = async () => {
    try {
      const days: string[] = [];
      const start = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d.toISOString().split("T")[0]);
      }

      const results = await Promise.all(
        days.map((d) => fetch(`/api/bookings?date=${d}`, { cache: "no-store" }))
      );

      const grouped: { date: string; bookings: Booking[] }[] = [];
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (!res.ok) {
          grouped.push({ date: days[i], bookings: [] });
          continue;
        }
        const all: Booking[] = await res.json();
        const filtered = all
          .filter(
            (b) =>
              b.organization &&
              (b.status === "confirmed" || b.status === "pending")
          )
          .sort((a, b) =>
            a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0
          );
        grouped.push({ date: days[i], bookings: filtered });
      }

      setOrgBookingsWeek(grouped);
    } catch {
      setOrgBookingsWeek([]);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserBookings();
      fetchOrgBookingsWeek();
    }
  }, [session]);

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

  if (!session) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                StudyRooms Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {session.user?.name || session.user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {session.user?.role === "admin" && (
                <Link
                  href="/admin/bookings"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/settings"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Settings
              </Link>
              <Link
                href="/book-room"
                className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900 transition-colors"
              >
                Book a Room
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {session.user?.name?.charAt(0)?.toUpperCase() ||
                  session.user?.email?.charAt(0)?.toUpperCase() ||
                  "S"}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome, {session.user?.name?.split(" ")[0] || "Student"}!
              </h2>
              <p className="text-gray-600">{session.user?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Ready to book your next study session?
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/book-room"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 border-red-800"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Book a Room
                </h3>
                <p className="text-sm text-gray-500">
                  Reserve your study space
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h6a2 2 0 002-2v-4"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  My Bookings
                </h3>
                <p className="text-sm text-gray-500">
                  {userBookings.length} active reservations
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Upcoming</h3>
                <p className="text-sm text-gray-500">
                  {upcomingBookings.length} sessions this week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Recent Bookings */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Bookings
              </h3>
            </div>
            <div className="p-6">
              {userBookings.length > 0 ? (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {booking.room.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString()} at{" "}
                          {booking.startTime}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.duration} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={
                            booking.status === "pending"
                              ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                              : booking.status === "cancelled"
                              ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700"
                              : booking.status === "completed"
                              ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          }
                        >
                          {booking.status === "pending"
                            ? "Waiting for approval"
                            : booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h6a2 2 0 002-2v-4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No bookings yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by booking your first study room.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/book-room"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-800 hover:bg-red-900"
                    >
                      Book a Room
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Upcoming Sessions
              </h3>
            </div>
            <div className="p-6">
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {booking.room.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.date).toLocaleDateString()} at{" "}
                          {booking.startTime}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.duration} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Upcoming
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No upcoming sessions
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Book a room for your next study session.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Organization schedule (next 7 days) */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Organization Schedule (Next 7 Days)
              </h3>
            </div>
            <div className="p-6">
              {orgBookingsWeek.length > 0 ? (
                <div className="space-y-6">
                  {orgBookingsWeek.map((day) => (
                    <div key={day.date}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        {new Date(day.date).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </h4>
                      {day.bookings.length > 0 ? (
                        <div className="space-y-2">
                          {day.bookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="text-sm text-gray-900 font-medium">
                                  {booking.organization?.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {booking.room.name} at {booking.startTime}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {booking.status === "pending"
                                  ? "Pending"
                                  : "Confirmed"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          No organization bookings.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No organization bookings this week.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

interface BookingStats {
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  completedBookings: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    totalBookings: 0,
    activeBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchBookingStats();
    }
  }, [session]);

  const fetchBookingStats = async () => {
    try {
      const response = await fetch("/api/user/bookings");
      if (response.ok) {
        const bookings: Array<{ status: string }> = await response.json();

        setBookingStats({
          totalBookings: bookings.length,
          activeBookings: bookings.filter((b) => b.status === "confirmed")
            .length,
          cancelledBookings: bookings.filter((b) => b.status === "cancelled")
            .length,
          completedBookings: bookings.filter((b) => b.status === "completed")
            .length,
        });
      }
    } catch (error) {
      console.error("Error fetching booking stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut({ callbackUrl: "/" });
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

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Account Settings
              </h1>
              <p className="text-gray-600">
                Manage your account and preferences
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                <li>
                  <a
                    href="#account"
                    className="flex items-center px-4 py-2 text-sm font-medium text-red-800 bg-red-50 rounded-md"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Account Information
                  </a>
                </li>
                <li>
                  <a
                    href="#statistics"
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Booking Statistics
                  </a>
                </li>
                <li>
                  <a
                    href="#preferences"
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Preferences
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <section id="account" className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Account Information
              </h2>

              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {session.user?.name?.charAt(0)?.toUpperCase() ||
                        session.user?.email?.charAt(0)?.toUpperCase() ||
                        "S"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Profile Picture
                    </h3>
                    <p className="text-sm text-gray-500">Your account avatar</p>
                  </div>
                </div>

                {/* Name */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Full Name
                    </dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {session.user?.name || "Not provided"}
                    </dd>
                  </div>
                </div>

                {/* Email */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Email Address
                    </dt>
                    <dd className="text-sm text-gray-900 col-span-2 flex items-center">
                      {session.user?.email}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    </dd>
                  </div>
                </div>

                {/* Account Type */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Account Type
                    </dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      Student Account
                    </dd>
                  </div>
                </div>

                {/* Member Since */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Member Since
                    </dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {new Date().toLocaleDateString()}
                    </dd>
                  </div>
                </div>
              </div>
            </section>

            {/* Booking Statistics */}
            <section
              id="statistics"
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Booking Statistics
              </h2>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {bookingStats.totalBookings}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Total Bookings
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {bookingStats.activeBookings}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Active</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {bookingStats.completedBookings}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Completed</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {bookingStats.cancelledBookings}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Cancelled</div>
                  </div>
                </div>
              )}
            </section>

            {/* Preferences */}
            <section
              id="preferences"
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive booking confirmations and reminders
                    </p>
                  </div>
                  <button
                    type="button"
                    className="bg-red-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                    role="switch"
                    aria-checked="true"
                  >
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Reminder Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Get reminded before your booking starts
                    </p>
                  </div>
                  <button
                    type="button"
                    className="bg-red-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                    role="switch"
                    aria-checked="true"
                  >
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Default Booking Duration
                    </h3>
                    <p className="text-sm text-gray-500">
                      Your preferred booking length
                    </p>
                  </div>
                  <select defaultValue="1 hour" className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>1.5 hours</option>
                    <option>2 hours</option>
                    <option>3 hours</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Danger Zone
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Sign Out
                    </h3>
                    <p className="text-sm text-gray-500">
                      Sign out from your current session
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

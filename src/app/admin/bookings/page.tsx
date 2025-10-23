"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface AdminRoom {
  id: string;
  name: string;
  category: string;
  capacity: number;
}

interface AdminBooking {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  status: string;
  user: AdminUser;
  room: AdminRoom;
  organization?: { id: string; name: string } | null;
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isAdmin = session?.user?.role === "admin";

  useEffect(
    function fetchAll() {
      if (!session?.user?.email) return;
      let isCancelled = false;

      async function run() {
        try {
          setIsLoading(true);
          setHasError(null);
          const res = await fetch("/api/bookings?limit=200", {
            cache: "no-store",
          });
          if (!res.ok) {
            throw new Error("Failed to load bookings");
          }
          const data: AdminBooking[] = await res.json();
          if (!isCancelled) setBookings(data);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Unknown error";
          if (!isCancelled) setHasError(message);
        } finally {
          if (!isCancelled) setIsLoading(false);
        }
      }
      run();

      return () => {
        isCancelled = true;
      };
    },
    [session?.user?.email]
  );

  async function cancelBooking(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel booking");
      const updated = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
    } catch {
      alert("Error cancelling booking");
    }
  }

  async function deleteBooking(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete booking");
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch {
      alert("Error deleting booking");
    }
  }

  async function approveBooking(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (!res.ok) throw new Error("Failed to approve booking");
      const updated = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
    } catch {
      alert("Error approving booking");
    }
  }

  async function rejectBooking(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject booking");
      const updated = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );
    } catch {
      alert("Error rejecting booking");
    }
  }

  const filteredBookings = useMemo(
    function filter() {
      if (statusFilter === "all") return bookings;
      return bookings.filter((b) => b.status === statusFilter);
    },
    [bookings, statusFilter]
  );

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Forbidden</h2>
          <p className="text-gray-600 mb-6">
            You do not have admin permissions.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Bookings
              </h1>
              <p className="text-gray-600">Manage all room bookings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/organizations"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Organizations
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center gap-4">
          <label className="text-sm text-gray-600">Filter status</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="ml-auto text-sm text-gray-500">
            {filteredBookings.length} bookings
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Loading bookings...
                    </td>
                  </tr>
                ) : hasError ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-red-600"
                    >
                      {hasError}
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No bookings
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(b.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {b.startTime}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {b.duration} min
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {b.room.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {b.user.name || b.user.email || b.user.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={
                            b.status === "confirmed"
                              ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              : b.status === "cancelled"
                              ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700"
                              : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          }
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => cancelBooking(b.id)}
                              className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            >
                              Cancel
                            </button>
                          )}
                          {b.status === "pending" && (
                            <div className="space-x-2">
                              <button
                                onClick={() => approveBooking(b.id)}
                                className="text-green-700 text-xs hover:underline"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectBooking(b.id)}
                                className="text-red-700 text-xs hover:underline"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => deleteBooking(b.id)}
                            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

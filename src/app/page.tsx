import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { DashboardLink } from "@/components/DashboardLink";
import { container } from "@/lib/container";

async function getRoomCount(): Promise<number> {
  try {
    const count = await container.roomRepository.count();
    return count;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const roomCount = await getRoomCount();
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* College of Charleston Logo - Styled Text */}
              <div className="flex items-center justify-center h-12 w-12 rounded-lg" style={{ backgroundColor: '#7D0A0A' }}>
                <span className="text-white font-bold text-lg">CofC</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">StudyRooms</h1>
                <p className="text-gray-600">Addlestone Library Study Room Booking</p>
              </div>
            </div>
            <nav className="flex gap-4 items-center">
              <DashboardLink />
              <Link
                href="/book-room"
                className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900 transition-colors"
              >
                Book a Room
              </Link>
              <AuthButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Reserve Your Perfect Study Space
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Modern, intuitive study room booking for students, organizations,
            and classes. Find and reserve the ideal space for your academic
            needs.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/book-room"
              className="bg-red-800 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-900 transition-colors shadow-lg"
            >
              Start Booking
            </Link>
            <Link
              href="/dashboard"
              className="border-2 border-red-800 text-red-800 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-50 transition-colors"
            >
              View My Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Public Study Groups
            </h3>
            <p className="text-gray-700">
              Create or join public study sessions. Connect with classmates and
              collaborate on group projects.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Real-Time Availability
            </h3>
            <p className="text-gray-700">
              See available time slots instantly. Book rooms in 30-minute increments
              from 8AM to 10PM.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Organization Bookings
            </h3>
            <p className="text-gray-700">
              Reserve rooms for clubs and organizations. Manage group bookings
              with flexible scheduling options.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            Study Room Booking System
          </h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-800 mb-2">{roomCount}</div>
              <div className="text-gray-700">Study Rooms Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                8AM - 10PM
              </div>
              <div className="text-gray-700">Daily Booking Hours</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">30min</div>
              <div className="text-gray-700">Time Slot Increments</div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-16">
          <h3 className="text-2xl font-bold text-center mb-6">
            Addlestone Library
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                205 Calhoun St
              </p>
              <p className="text-gray-700 mb-4">
                Charleston, SC 29401
              </p>
              <p className="text-sm text-gray-600 mb-4">
                College of Charleston
              </p>
              <p className="text-sm text-gray-500">
                Reserve study rooms at the Addlestone Library for your academic needs.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3354.5!2d-79.938!3d32.787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88fe6a8b8b8b8b8b%3A0x8b8b8b8b8b8b8b8b!2sAddlestone%20Library%2C%20205%20Calhoun%20St%2C%20Charleston%2C%20SC%2029401!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
                title="Addlestone Library Location"
              ></iframe>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">StudyRooms</h4>
              <p className="text-gray-400">
                Modern library study room booking system for academic success.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/book-room" className="hover:text-white">
                    Book a Room
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    My Reservations
                  </Link>
                </li>
                <li>
                  <Link href="/book-room" className="hover:text-white">
                    Room Directory
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signin" className="hover:text-white">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/organizations" className="hover:text-white">
                    Organizations
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-white">
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Booking Hours</h4>
              <div className="text-gray-400">
                <p>Daily: 8:00 AM - 10:00 PM</p>
                <p className="mt-2 text-sm">
                  Book in 30-minute increments
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} StudyRooms. Built for academic excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

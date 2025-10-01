"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export function DashboardLink() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      Dashboard
    </Link>
  );
}
